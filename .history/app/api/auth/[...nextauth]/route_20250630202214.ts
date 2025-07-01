import NextAuth from "next-auth"
import crypto from "crypto"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        {
            id: "whoop",
            name: "WHOOP",
            type: "oauth",
            authorization: {
                url: "https://api.prod.whoop.com/oauth/oauth2/auth",
                params: {
                    scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline",
                    response_type: "code",
                    state: crypto.randomBytes(16).toString('hex'), // Generate 32-character state
                },
            },
            token: "https://api.prod.whoop.com/oauth/oauth2/token",
            userinfo: "https://api.prod.whoop.com/developer/v1/user/profile/basic",
            clientId: process.env.WHOOP_CLIENT_ID,
            clientSecret: process.env.WHOOP_CLIENT_SECRET,
            profile(profile: any) {
                return {
                    id: profile.user_id?.toString() || "unknown",
                    name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "WHOOP User",
                    email: profile.email || null,
                }
            },
        }
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                token.expiresAt = account.expires_at
            }

            // Check if token is expired and refresh if needed
            if (token.expiresAt && Date.now() > (token.expiresAt as number) * 1000) {
                try {
                    const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            grant_type: 'refresh_token',
                            refresh_token: token.refreshToken,
                            client_id: process.env.WHOOP_CLIENT_ID,
                            client_secret: process.env.WHOOP_CLIENT_SECRET,
                            scope: 'offline',
                        }),
                    })

                    if (response.ok) {
                        const refreshedTokens = await response.json()
                        token.accessToken = refreshedTokens.access_token
                        token.refreshToken = refreshedTokens.refresh_token
                        token.expiresAt = Math.floor(Date.now() / 1000) + refreshedTokens.expires_in
                    } else {
                        console.error('Token refresh failed:', response.status, response.statusText)
                    }
                } catch (error) {
                    console.error('Token refresh error:', error)
                }
            }

            return token
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string
            session.refreshToken = token.refreshToken as string
            return session
        },
    },
    pages: {
        error: '/auth/error',
    },
    secret: process.env.AUTH_SECRET,
})

export { handlers as GET, handlers as POST }
