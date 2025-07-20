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
                    scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline",
                    response_type: "code",
                    prompt: "consent"        // Force consent screen to ensure offline access
                },
            },
            token: {
                url: "https://api.prod.whoop.com/oauth/oauth2/token",
                params: {
                    grant_type: "authorization_code",
                    scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline"
                },
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
        async jwt({ token, account }) {
            // Initial sign in - store both access and refresh tokens
            if (account) {
                console.log('🔐 Initial OAuth sign in detected');
                console.log('📦 Raw account data:', JSON.stringify(account, null, 2));

                // Enhanced token validation
                if (!account.access_token) {
                    console.error('❌ No access token in OAuth response');
                    return { ...token, error: 'NoAccessToken' };
                }

                if (!account.refresh_token) {
                    console.error('❌ No refresh token in OAuth response');
                    return { ...token, error: 'NoRefreshToken' };
                }

                console.log('✅ OAuth tokens validated:', {
                    hasAccessToken: true,
                    hasRefreshToken: true,
                    tokenType: account.token_type || 'Bearer',
                    expiresAt: account.expires_at || 'using default'
                });

                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at || Math.floor(Date.now() / 1000) + 3600,
                    tokenType: account.token_type || 'Bearer',
                };
            }

            // Return early if we don't have essential token data
            if (!token.accessToken) {
                console.log('❌ Missing access token - forcing re-auth');
                return { ...token, error: 'RefreshAccessTokenError' };
            }

            // Always verify refresh token availability for non-initial auth
            if (!token.refreshToken) {
                console.log('⚠️ No refresh token found in existing token');
                return { ...token, error: 'RefreshAccessTokenError' };
            }

            // Token is still valid (with 5 minute buffer)
            const expiryTime = (token.expiresAt as number) * 1000;
            const currentTime = Date.now();
            const bufferTime = 5 * 60 * 1000; // 5 minutes

            if (currentTime < (expiryTime - bufferTime)) {
                return token;
            }

            // Token has expired or will expire soon, try to refresh it
            console.log('🔄 Access token expired/expiring, attempting refresh...');

            if (!token.refreshToken) {
                console.log('❌ No refresh token available - forcing re-auth');
                return { ...token, error: 'RefreshAccessTokenError' };
            }

            try {
                console.log('🔄 Attempting token refresh with stored refresh token');
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
                        scope: 'offline', // WHOOP requires only 'offline' for refresh
                    }),
                });

                const responseText = await response.text();

                if (!response.ok) {
                    console.log(`❌ Token refresh failed: ${response.status} - ${responseText}`);

                    // Special handling for specific error cases
                    if (response.status === 400) {
                        console.log('🔍 Invalid refresh token detected - forcing re-auth');
                    } else if (response.status === 401) {
                        console.log('🔒 Unauthorized refresh attempt - forcing re-auth');
                    }

                    throw new Error(`Token refresh failed: ${response.status}`);
                }

                let refreshedTokens;
                try {
                    refreshedTokens = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('💥 Failed to parse refresh token response:', responseText);
                    throw new Error('Invalid refresh token response format');
                }

                if (!refreshedTokens.access_token) {
                    console.error('❌ No access token in refresh response');
                    throw new Error('Invalid refresh response: missing access token');
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
                // Return token with error flag - user will need to re-authenticate
                return { ...token, error: 'RefreshAccessTokenError' };
            }
        },
        async session({ session, token }) {
            // Always log session update attempts
            console.log('📝 Updating session state');

            // Handle authentication errors by forcing sign out
            if (token.error === 'RefreshAccessTokenError') {
                console.log('🚨 Authentication error detected - marking session as invalid');
                return {
                    ...session,
                    error: 'RefreshAccessTokenError',
                    accessToken: undefined // Explicitly clear the access token
                };
            }

            if (!token.accessToken) {
                console.log('⚠️ No access token in session update');
                return { ...session, error: 'NoAccessToken' };
            }

            // Valid session update
            console.log('✅ Session updated successfully');
            session.accessToken = token.accessToken as string;
            session.error = token.error as string;
            return session;
        },
    },
})
