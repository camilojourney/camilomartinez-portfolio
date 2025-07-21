import NextAuth from "next-auth"
import { OAuthConfig } from "next-auth/providers"

interface WhoopProfile {
    user_id: number
    email: string
    first_name: string
    last_name: string
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    debug: process.env.NODE_ENV !== "production",
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
                    response_type: "code",
                    access_type: "offline", // This is the key to getting a refresh token
                    prompt: "consent"       // Ensures the user is prompted for consent
                },
            },
            token: "https://api.prod.whoop.com/oauth/oauth2/token",
            userinfo: "https://api.prod.whoop.com/developer/v2/user/profile/basic",
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
            // Initial sign in
            if (account) {
                console.log('🔐 Initial sign in - storing tokens');
                return {
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at,
                    user: token,
                };
            }

            // Return previous token if it has not expired yet
            if (Date.now() < (token.expiresAt as number) * 1000) {
                return token;
            }

            // Access token has expired, try to refresh it
            console.log('🔄 Access token expired, attempting to refresh...');
            if (!token.refreshToken) {
                console.error('❌ No refresh token available.');
                return { ...token, error: 'RefreshAccessTokenError' };
            }

            try {
                const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: token.refreshToken as string,
                        client_id: process.env.WHOOP_CLIENT_ID!,
                        client_secret: process.env.WHOOP_CLIENT_SECRET!,
                    }),
                });

                const refreshedTokens = await response.json();

                if (!response.ok) {
                    console.error('❌ Token refresh failed:', refreshedTokens);
                    throw refreshedTokens;
                }

                console.log('✅ Token refreshed successfully');
                return {
                    ...token,
                    accessToken: refreshedTokens.access_token,
                    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
                    expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
                };

            } catch (error) {
                console.error('💥 Error refreshing access token:', error);
                return { ...token, error: 'RefreshAccessTokenError' };
            }
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.error = token.error as string | undefined;
            // @ts-ignore
            session.user = token.user;
            return session;
        },
    },
})
