// 📂 src/lib/services/strava-token-service.ts
/**
 * Strava Token Management Service
 * Handles OAuth token refresh and validation following the same pattern as WHOOP
 */

import { StravaTokens, StravaRefreshResponse, StravaAuthError } from '@/types/strava-auth';
import { stravaUserService } from '@/lib/db/strava-database';

export class StravaTokenService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiBaseUrl = 'https://www.strava.com/api/v3';

  constructor() {
    this.clientId = process.env.STRAVA_CLIENT_ID!;
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET!;

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Strava client credentials not configured');
    }
  }

  /**
   * Check if access token is expired or will expire soon (within 1 hour)
   */
  isTokenExpired(tokens: StravaTokens): boolean {
    const now = new Date();
    const expiryBuffer = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour buffer
    return tokens.expiresAt <= expiryBuffer;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<StravaTokens> {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData: StravaAuthError = await response.json();
        throw new Error(`Strava token refresh failed: ${errorData.message}`);
      }

      const data: StravaRefreshResponse = await response.json();

      // Convert expires_at from Unix timestamp to Date
      const expiresAt = new Date(data.expires_at * 1000);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch (error) {
      console.error('❌ Error refreshing Strava token:', error);
      throw error;
    }
  }

  /**
   * Get valid access token for user, refreshing if necessary
   */
  async getValidAccessToken(userId: number): Promise<string | null> {
    try {
      // Get current tokens from database
      const tokens = await stravaUserService.getUserTokens(userId);
      
      if (!tokens) {
        console.log(`No Strava tokens found for user ${userId}`);
        return null;
      }

      // Check if token needs refresh
      if (this.isTokenExpired(tokens)) {
        console.log(`♻️ Refreshing expired Strava token for user ${userId}`);
        
        const newTokens = await this.refreshAccessToken(tokens.refreshToken);
        
        // Update tokens in database
        await stravaUserService.updateUserTokens(userId, newTokens);
        
        console.log(`✅ Strava token refreshed for user ${userId}, expires: ${newTokens.expiresAt}`);
        return newTokens.accessToken;
      }

      return tokens.accessToken;
    } catch (error) {
      console.error(`❌ Error getting valid access token for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Validate access token by making a test API call
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/athlete`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error validating Strava access token:', error);
      return false;
    }
  }

  /**
   * Refresh tokens for all users with expired tokens (for cron job)
   */
  async refreshExpiredTokens(): Promise<{
    totalUsers: number;
    refreshed: number;
    errors: string[];
  }> {
    const results = {
      totalUsers: 0,
      refreshed: 0,
      errors: [] as string[],
    };

    try {
      const users = await stravaUserService.getAllUsersWithTokens();
      results.totalUsers = users.length;

      console.log(`🔄 Checking Strava tokens for ${users.length} users...`);

      for (const user of users) {
        if (!user.access_token || !user.refresh_token || !user.token_expires_at) {
          continue;
        }

        const tokens: StravaTokens = {
          accessToken: user.access_token,
          refreshToken: user.refresh_token,
          expiresAt: user.token_expires_at,
          scopes: user.scopes || undefined,
        };

        try {
          if (this.isTokenExpired(tokens)) {
            console.log(`♻️ Refreshing Strava token for user ${user.id}`);
            
            const newTokens = await this.refreshAccessToken(tokens.refreshToken);
            await stravaUserService.updateUserTokens(user.id, newTokens);
            
            results.refreshed++;
            console.log(`✅ Token refreshed for user ${user.id}`);
          }
        } catch (error) {
          const errorMsg = `Failed to refresh token for user ${user.id}: ${error}`;
          results.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      console.log(`✅ Token refresh complete: ${results.refreshed}/${results.totalUsers} refreshed, ${results.errors.length} errors`);
      return results;
    } catch (error) {
      console.error('❌ Error in bulk token refresh:', error);
      results.errors.push(`Bulk refresh error: ${error}`);
      return results;
    }
  }

  /**
   * Revoke access token (deauthorize)
   */
  async revokeAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error revoking Strava access token:', error);
      return false;
    }
  }
}

// Create singleton instance
export const stravaTokenService = new StravaTokenService();
