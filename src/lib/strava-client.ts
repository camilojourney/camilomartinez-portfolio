// 📂 src/lib/strava-client.ts
/**
 * Strava API client for the Astoria Conquest feature
 * Handles authentication, data fetching, and rate limiting
 */

import { StravaTokenResponse, StravaActivity, StravaConfig, StravaErrorResponse, RunningActivityType } from '@/types/strava';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_BASE = 'https://www.strava.com/oauth';

export class StravaClient {
  private accessToken: string;
  private rateLimitRemaining: number = 100;
  private rateLimitResetTime: number = Date.now() + 15 * 60 * 1000; // 15 minutes from now

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Refresh the access token using the refresh token
   * Essential for automated cron jobs and long-term access
   */
  static async refreshAccessToken(refreshToken?: string): Promise<StravaTokenResponse> {
    const tokenToUse = refreshToken || process.env.STRAVA_REFRESH_TOKEN;
    
    if (!tokenToUse) {
      throw new Error('No refresh token available for Strava API');
    }

    const response = await fetch(`${STRAVA_AUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID!,
        client_secret: process.env.STRAVA_CLIENT_SECRET!,
        refresh_token: tokenToUse,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData: StravaErrorResponse = await response.json();
      throw new Error(`Failed to refresh Strava token: ${errorData.message}`);
    }

    const tokenData: StravaTokenResponse = await response.json();
    
    // Log successful token refresh (remove in production)
    console.log('✅ Strava token refreshed successfully', {
      expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      expires_in: tokenData.expires_in,
    });

    return tokenData;
  }

  /**
   * Generate OAuth authorization URL for initial user authentication
   */
  static generateAuthUrl(state?: string): string {
    const config: StravaConfig = {
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/strava/callback`,
      scope: ['read', 'activity:read_all'],
    };

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      approval_prompt: 'force',
      scope: config.scope.join(','),
      ...(state && { state }),
    });

    return `${STRAVA_AUTH_BASE}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
    const response = await fetch(`${STRAVA_AUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID!,
        client_secret: process.env.STRAVA_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorData: StravaErrorResponse = await response.json();
      throw new Error(`Failed to exchange code for token: ${errorData.message}`);
    }

    return response.json();
  }

  /**
   * Generic fetch method with rate limiting and error handling
   */
  private async fetch(endpoint: string, params?: Record<string, any>): Promise<any> {
    // Check rate limiting
    if (this.rateLimitRemaining <= 1 && Date.now() < this.rateLimitResetTime) {
      const waitTime = this.rateLimitResetTime - Date.now();
      console.log(`🕒 Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const url = new URL(`${STRAVA_API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    });

    // Update rate limiting info from headers
    const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
    const rateLimitUsage = response.headers.get('X-RateLimit-Usage');
    
    if (rateLimitUsage) {
      const [shortTermUsage, dailyUsage] = rateLimitUsage.split(',').map(Number);
      this.rateLimitRemaining = 100 - shortTermUsage; // Strava allows 100 requests per 15 minutes
      console.log(`📊 Strava API usage: ${shortTermUsage}/100 (15min), ${dailyUsage}/1000 (daily)`);
    }

    if (!response.ok) {
      const errorData: StravaErrorResponse = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
        errors: [],
      }));
      throw new Error(`Strava API error: ${errorData.message}`);
    }

    return response.json();
  }

  /**
   * Get activities for the authenticated athlete
   * @param afterTimestamp - Unix timestamp to get activities after
   * @param beforeTimestamp - Unix timestamp to get activities before
   * @param page - Page number for pagination
   * @param perPage - Number of activities per page (max 200)
   */
  async getActivities(
    afterTimestamp?: number,
    beforeTimestamp?: number,
    page: number = 1,
    perPage: number = 200
  ): Promise<StravaActivity[]> {
    const params: Record<string, any> = {
      page,
      per_page: Math.min(perPage, 200), // Strava max is 200
    };

    if (afterTimestamp) params.after = afterTimestamp;
    if (beforeTimestamp) params.before = beforeTimestamp;

    const activities: StravaActivity[] = await this.fetch('/athlete/activities', params);
    
    // Filter only running activities
    const runningTypes: RunningActivityType[] = ['Run', 'TrailRun', 'VirtualRun'];
    const runs = activities.filter(activity => 
      runningTypes.includes(activity.type as RunningActivityType) &&
      activity.map?.summary_polyline // Only activities with GPS data
    );

    console.log(`📊 Fetched ${activities.length} activities, ${runs.length} runs with GPS data`);
    return runs;
  }

  /**
   * Get all running activities for a date range with pagination
   */
  async getAllRunsInDateRange(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<StravaActivity[]> {
    const afterTimestamp = Math.floor(startDate.getTime() / 1000);
    const beforeTimestamp = Math.floor(endDate.getTime() / 1000);
    
    let allRuns: StravaActivity[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 Fetching page ${page} of Strava activities...`);
      
      const runs = await this.getActivities(afterTimestamp, beforeTimestamp, page, 200);
      
      if (runs.length === 0) {
        hasMore = false;
      } else {
        allRuns = allRuns.concat(runs);
        page++;
        
        // Add a small delay to be respectful of rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Safety check: if we've fetched more than 2000 activities, something might be wrong
      if (allRuns.length > 2000) {
        console.warn('⚠️ Fetched over 2000 activities, stopping to prevent infinite loop');
        break;
      }
    }

    console.log(`✅ Successfully fetched ${allRuns.length} total runs from ${startDate.toDateString()} to ${endDate.toDateString()}`);
    return allRuns;
  }

  /**
   * Get activities since a specific activity ID (useful for incremental sync)
   */
  async getActivitiesSinceId(lastActivityId: number): Promise<StravaActivity[]> {
    // Strava doesn't support filtering by activity ID directly
    // So we'll get recent activities and filter client-side
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentActivities = await this.getAllRunsInDateRange(oneMonthAgo);
    
    // Filter to only activities newer than the last synced one
    return recentActivities.filter(activity => activity.id > lastActivityId);
  }

  /**
   * Get detailed activity data including full polyline
   * Note: This uses a separate API call and counts against rate limits
   */
  async getActivityDetails(activityId: number): Promise<any> {
    return this.fetch(`/activities/${activityId}`);
  }

  /**
   * Get the authenticated athlete's profile
   */
  async getAthlete(): Promise<any> {
    return this.fetch('/athlete');
  }

  /**
   * Check if the current access token is still valid
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getAthlete();
      return true;
    } catch (error) {
      console.error('❌ Strava token validation failed:', error);
      return false;
    }
  }
}

/**
 * Utility function to create a StravaClient with automatic token refresh
 */
export async function createStravaClient(refreshToken?: string): Promise<StravaClient> {
  try {
    const tokenResponse = await StravaClient.refreshAccessToken(refreshToken);
    return new StravaClient(tokenResponse.access_token);
  } catch (error) {
    console.error('❌ Failed to create Strava client:', error);
    throw new Error('Failed to authenticate with Strava API');
  }
}

/**
 * Helper function to convert date to Unix timestamp
 */
export function dateToUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Helper function to get the start of today in Unix timestamp
 */
export function getTodayTimestamp(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateToUnixTimestamp(today);
}

/**
 * Helper function to get timestamp for X days ago
 */
export function getDaysAgoTimestamp(days: number): number {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return dateToUnixTimestamp(date);
}
