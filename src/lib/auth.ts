import NextAuth from "next-auth"
import { OAuthConfig } from "next-auth/providers"

interface WhoopProfile {
    user_id: number
    email: string
    first_name: string
    last_name: string
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    debug: false, // Disable debug logging
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    // NextAuth will automatically use localhost:3000 in development
    // and the deployment URL in production
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
                    scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline",
                    response_type: "code",
                    access_type: "offline",
                    prompt: "consent"       // Ensures the user is prompted for consent
                },
            },
            token: {
                url: "https://api.prod.whoop.com/oauth/oauth2/token",
                params: {
                    grant_type: "authorization_code"
                }
            },
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
        async jwt({ token, account, trigger }) {
            // Initial sign in
            if (account) {
                console.log('🔐 Initial sign in - storing tokens');
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: Math.floor(Date.now() / 1000 + (account.expires_in ?? 3600)),
                };
            }

            // If there's no refresh token, there's nothing we can do
            if (!token.refreshToken) {
                console.warn('⚠️ No refresh token available');
                return token;
            }

            // Return previous token if it hasn't expired yet
            // Add 5-minute buffer to prevent edge cases
            const REFRESH_BUFFER = 300; // 5 minutes in seconds
            if (token.expiresAt &&
                typeof token.expiresAt === 'number' &&
                Date.now() < (token.expiresAt - REFRESH_BUFFER) * 1000) {
                return token;
            }

            // Token has expired (or will soon), try to refresh it
            try {
                console.log('🔄 Refreshing access token...');
                console.log('🔍 Current token expires at:', new Date((token.expiresAt as number) * 1000).toISOString());
                
                const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                    },
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: token.refreshToken as string,
                        client_id: process.env.WHOOP_CLIENT_ID!,
                        client_secret: process.env.WHOOP_CLIENT_SECRET!,
                    }),
                });

                const refreshedTokens = await response.json();
                console.log('🔍 WHOOP refresh response status:', response.status);
                console.log('🔍 WHOOP refresh response:', refreshedTokens);

                if (!response.ok) {
                    console.error('💥 Token refresh failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: refreshedTokens.error,
                        errorDescription: refreshedTokens.error_description,
                    });
                    
                    // If refresh token is invalid, user needs to re-authenticate
                    if (refreshedTokens.error === 'invalid_grant' || refreshedTokens.error === 'invalid_request') {
                        console.warn('🚫 Refresh token invalid - user needs to re-authenticate');
                        return {
                            ...token,
                            error: 'RefreshAccessTokenError',
                            accessToken: undefined,
                            refreshToken: undefined,
                            expiresAt: undefined,
                        };
                    }
                    
                    throw new Error(refreshedTokens.error_description || refreshedTokens.error || 'Failed to refresh token');
                }

                console.log('✅ Token refreshed successfully');
                return {
                    ...token,
                    accessToken: refreshedTokens.access_token,
                    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
                    expiresAt: Math.floor(Date.now() / 1000 + (refreshedTokens.expires_in ?? 3600)),
                    error: undefined, // Clear any previous errors
                };
            } catch (error) {
                console.error('💥 Error refreshing access token:', error);
                return {
                    ...token,
                    error: 'RefreshAccessTokenError',
                };
            }
        },
        async session({ session, token }) {
            // If there's a refresh token error, the user needs to re-authenticate
            if (token.error === 'RefreshAccessTokenError') {
                console.warn('⚠️ Session has refresh token error - access token may be invalid');
            }
            
            return {
                ...session,
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
                expiresAt: token.expiresAt,
                error: token.error,
                user: token.user || session.user,
            };
        },
    },
})
