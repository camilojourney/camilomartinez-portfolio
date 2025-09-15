import NextAuth from "next-auth"
import { OAuthConfig } from "next-auth/providers"
import { WhoopDatabaseService } from '@/lib/db/whoop-database'
import { TokenRefreshService } from '@/lib/services/token-refresh-service'

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
        async jwt({ token, account, profile, trigger }): Promise<any> {
            // Initial sign in - store tokens in database
            if (account) {
                console.log('🔐 Initial sign in - storing tokens in database and session');
                
                const expiresAt = new Date(Date.now() + (account.expires_in ?? 3600) * 1000);
                const tokens = {
                    accessToken: account.access_token!,
                    refreshToken: account.refresh_token!,
                    expiresAt,
                };

                // Store tokens in database if we have user profile
                if (profile) {
                    try {
                        const dbService = new WhoopDatabaseService();
                        await dbService.upsertUserWithTokens(profile as any, tokens);
                        console.log('✅ Stored user tokens in database');
                    } catch (error) {
                        console.error('� Error storing tokens in database:', error);
                    }
                }

                return {
                    ...token,
                    user: profile || token.user,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: Math.floor(expiresAt.getTime() / 1000),
                };
            }

            // If there's no refresh token, there's nothing we can do
            if (!token.refreshToken) {
                console.warn('⚠️ No refresh token available');
                return {
                    ...token,
                    error: "RefreshAccessTokenError",
                };
            }

            // Check token expiration with different buffers for different scenarios
            // For regular page loads, only refresh if token is actually expired
            // For critical operations, be more proactive
            const MINIMAL_REFRESH_BUFFER = 60; // 1 minute for regular operations
            const isTokenExpired = token.expiresAt &&
                typeof token.expiresAt === 'number' &&
                Date.now() >= (token.expiresAt - MINIMAL_REFRESH_BUFFER) * 1000;

            // If token is still valid, return it
            if (token.expiresAt &&
                typeof token.expiresAt === 'number' &&
                !isTokenExpired) {
                return token;
            }

            // Token is expired or about to expire, try to refresh
            try {
                console.log('🔄 Token expired, attempting refresh...');
                
                const tokenService = new TokenRefreshService();
                const refreshedTokens = await tokenService.refreshWhoopToken(token.refreshToken as string);

                // Update database with new tokens if we have user info
                if (token.user) {
                    try {
                        const dbService = new WhoopDatabaseService();
                        await dbService.upsertUserWithTokens(token.user as any, refreshedTokens);
                        console.log('✅ Updated tokens in database');
                    } catch (error) {
                        console.error('💥 Error updating tokens in database:', error);
                    }
                }

                console.log('✅ Token refresh successful');
                return {
                    ...token,
                    accessToken: refreshedTokens.accessToken,
                    refreshToken: refreshedTokens.refreshToken,
                    expiresAt: Math.floor(refreshedTokens.expiresAt.getTime() / 1000),
                    error: undefined, // Clear any previous errors
                };
            } catch (error) {
                // Only log once per session to avoid spam
                if (!token.error) {
                    console.warn('⚠️ Please re-authenticate - visit /signin');
                }
                
                // Return token with error flag
                return {
                    ...token,
                    error: "RefreshAccessTokenError",
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
                expiresAt: token.expiresAt,
                error: token.error,
                user: token.user || session.user,
            };
        },
    },
})
