import NextAuth from "next-auth"
import { OAuthConfig } from "next-auth/providers"

interface WhoopProfile {
    user_id: number
    email: string
    first_name: string
    last_name: string
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    debug: process.env.NODE_ENV !== "production", // Only debug in development
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    providers: [
        {
            id: "whoop",
            name: "Whoop",
            type: "oauth",
            clientId: process.env.WHOOP_CLIENT_ID,
            clientSecret: process.env.WHOOP_CLIENT_SECRET,
            authorization: {
                url: "https://api.prod.whoop.com/oauth/oauth2/auth",
                params: {
                    scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement",
                    response_type: "code"
                },
            },
            token: {
                url: "https://api.prod.whoop.com/oauth/oauth2/token",
                params: { grant_type: "authorization_code" }
            },
            userinfo: "https://api.prod.whoop.com/developer/v1/user/profile/basic",
            checks: ["state"],
            client: {
                token_endpoint_auth_method: "client_secret_post"
            },
            profile(profile: WhoopProfile) {
                return {
                    id: profile.user_id.toString(),
                    name: `${profile.first_name} ${profile.last_name}`,
                    email: profile.email,
                    image: null,
                }
            },
        } as OAuthConfig<WhoopProfile>,
    ],
    pages: {
        signIn: '/signin',
    },
    callbacks: {
        async jwt({ token, account }) {
            // Initial sign in - store both access and refresh tokens
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
                return token;
            }

            // Token is still valid
            if (Date.now() < (token.expiresAt as number) * 1000) {
                return token;
            }

            // Token has expired, try to refresh it
            console.log('Access token expired, attempting refresh...');
            try {
                const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: token.refreshToken as string,
                        client_id: process.env.WHOOP_CLIENT_ID!,
                        client_secret: process.env.WHOOP_CLIENT_SECRET!,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Token refresh failed: ${response.status}`);
                }

                const refreshedTokens = await response.json();
                console.log('Token refreshed successfully');

                return {
                    ...token,
                    accessToken: refreshedTokens.access_token,
                    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
                    expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
                };
            } catch (error) {
                console.error('Error refreshing access token:', error);
                // Return token with error flag - user will need to re-authenticate
                return { ...token, error: 'RefreshAccessTokenError' };
            }
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.error = token.error as string;
            return session;
        },
    },
})
