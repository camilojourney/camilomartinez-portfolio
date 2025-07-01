import NextAuth from "next-auth"

// WHOOP provider configuration
const WhoopProvider = {
    id: "whoop",
    name: "WHOOP",
    type: "oauth" as const,
    authorization: {
        url: "https://api.prod.whoop.com/oauth/oauth2/auth",
        params: {
            scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement",
            response_type: "code",
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

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [WhoopProvider],
    callbacks: {
        async jwt({ token, account }) {
            // Persist the OAuth tokens to the JWT on signin
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                token.expiresAt = account.expires_at
            }
            return token
        },
        async session({ session, token }) {
            // Send properties to the client
            session.accessToken = token.accessToken as string
            session.refreshToken = token.refreshToken as string
            return session
        },
    },
    pages: {
        error: '/auth/error',
    },
})

export { handlers as GET, handlers as POST }
