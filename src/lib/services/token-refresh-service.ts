// 📂 src/lib/services/token-refresh-service.ts

import { sql } from '@/lib/db/db';

export interface WhoopTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
}

export interface WhoopTokenRefreshResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}

export class TokenRefreshService {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly tokenUrl = 'https://api.prod.whoop.com/oauth/oauth2/token';

    constructor() {
        this.clientId = process.env.WHOOP_CLIENT_ID!;
        this.clientSecret = process.env.WHOOP_CLIENT_SECRET!;
        
        if (!this.clientId || !this.clientSecret) {
            throw new Error('WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET must be set');
        }
    }

    /**
     * Refresh WHOOP access token using refresh token
     */
    async refreshWhoopToken(refreshToken: string): Promise<WhoopTokens> {
        try {
            console.log('🔄 Refreshing WHOOP access token...');
            
            const response = await fetch(this.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    scope: 'offline read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('💥 Token refresh failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData.error,
                    errorDescription: errorData.error_description,
                });
                
                throw new Error(
                    `Token refresh failed: ${response.status} ${response.statusText} - ${
                        errorData.error_description || errorData.error || 'Unknown error'
                    }`
                );
            }

            const tokenData: WhoopTokenRefreshResponse = await response.json();
            console.log('✅ Token refreshed successfully');

            // Calculate expiration time (subtract 5 minutes for safety buffer)
            const expiresAt = new Date(Date.now() + (tokenData.expires_in - 300) * 1000);

            return {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt,
            };
        } catch (error) {
            console.error('💥 Error refreshing WHOOP token:', error);
            throw error;
        }
    }

    /**
     * Get fresh tokens for a user - refresh if needed or forced
     */
    async getFreshTokensForUser(userId: number, forceRefresh: boolean = false): Promise<WhoopTokens | null> {
        try {
            // Get current tokens from database
            const userResult = await sql`
                SELECT access_token, refresh_token, token_expires_at
                FROM whoop_users 
                WHERE id = ${userId}
            `;

            if (userResult.rows.length === 0) {
                console.warn(`⚠️ User ${userId} not found in database`);
                return null;
            }

            const user = userResult.rows[0];
            
            if (!user.refresh_token) {
                console.warn(`⚠️ User ${userId} has no refresh token - needs re-authentication`);
                return null;
            }

            // Check if token needs refresh (or will expire in next 10 minutes)
            const now = new Date();
            const expiresAt = user.token_expires_at ? new Date(user.token_expires_at) : null;
            const needsRefresh = forceRefresh || !expiresAt || !user.access_token || 
                               (expiresAt.getTime() - now.getTime()) < (10 * 60 * 1000); // 10 minutes

            if (!needsRefresh && user.access_token) {
                console.log(`✅ User ${userId} has valid token until ${expiresAt?.toISOString()}`);
                return {
                    accessToken: user.access_token,
                    refreshToken: user.refresh_token,
                    expiresAt: expiresAt!,
                };
            }

            // Refresh the token
            const reason = forceRefresh ? 'forced refresh' : `expires: ${expiresAt?.toISOString() || 'unknown'}`;
            console.log(`🔄 User ${userId} token needs refresh (${reason})`);
            const newTokens = await this.refreshWhoopToken(user.refresh_token);

            // Update database with new tokens
            await this.updateUserTokens(userId, newTokens);

            return newTokens;
        } catch (error) {
            console.error(`💥 Error getting fresh tokens for user ${userId}:`, error);
            return null;
        }
    }

    /**
     * Update user tokens in database
     */
    async updateUserTokens(userId: number, tokens: WhoopTokens): Promise<void> {
        try {
            await sql`
                UPDATE whoop_users 
                SET 
                    access_token = ${tokens.accessToken},
                    refresh_token = ${tokens.refreshToken},
                    token_expires_at = ${tokens.expiresAt.toISOString()},
                    updated_at = NOW()
                WHERE id = ${userId}
            `;
            
            console.log(`✅ Updated tokens for user ${userId}, expires at ${tokens.expiresAt.toISOString()}`);
        } catch (error) {
            console.error(`💥 Error updating tokens for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Refresh tokens for all users (for use in cron jobs) - FORCE REFRESH
     */
    async refreshAllUserTokens(): Promise<{ 
        successful: number; 
        failed: number; 
        errors: string[] 
    }> {
        console.log('🔄 Starting FORCED token refresh for all users...');
        
        // Get all users who have refresh tokens
        const usersResult = await sql`
            SELECT id, refresh_token, token_expires_at, first_name, last_name
            FROM whoop_users 
            WHERE refresh_token IS NOT NULL
        `;

        const users = usersResult.rows;
        let successful = 0;
        let failed = 0;
        const errors: string[] = [];

        console.log(`📋 Found ${users.length} users with refresh tokens`);

        for (const user of users) {
            try {
                // FORCE refresh for each user (don't check expiry)
                const tokens = await this.getFreshTokensForUser(user.id, true); // forceRefresh = true
                if (tokens) {
                    successful++;
                    console.log(`✅ FORCE refreshed tokens for ${user.first_name} ${user.last_name} (${user.id})`);
                } else {
                    failed++;
                    const error = `Failed to refresh tokens for ${user.first_name} ${user.last_name} (${user.id})`;
                    errors.push(error);
                    console.error(`❌ ${error}`);
                }
            } catch (error) {
                failed++;
                const errorMsg = `Error refreshing tokens for ${user.first_name} ${user.last_name} (${user.id}): ${
                    error instanceof Error ? error.message : String(error)
                }`;
                errors.push(errorMsg);
                console.error(`❌ ${errorMsg}`);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`🏁 FORCED token refresh complete: ${successful} successful, ${failed} failed`);
        return { successful, failed, errors };
    }

    /**
     * Get users who need token refresh (tokens expiring in next 30 minutes)
     */
    async getUsersNeedingTokenRefresh(): Promise<Array<{ id: number; first_name: string; last_name: string; token_expires_at: string | null }>> {
        const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);
        
        const result = await sql`
            SELECT id, first_name, last_name, token_expires_at
            FROM whoop_users 
            WHERE refresh_token IS NOT NULL 
            AND (
                token_expires_at IS NULL 
                OR token_expires_at < ${thirtyMinutesFromNow.toISOString()}
                OR access_token IS NULL
            )
        `;

        return result.rows as Array<{ id: number; first_name: string; last_name: string; token_expires_at: string | null }>;
    }
}
