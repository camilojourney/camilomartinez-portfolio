// 📂 src/lib/services/strava-sync.ts
/**
 * Strava Data Synchronization Service
 * 
 * Handles fetching and storing Strava running activities for the Astoria Conquest project.
 * Supports both full historical sync and incremental weekly updates.
 */

import { sql } from '@vercel/postgres';

interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface StravaUser {
  id: number;
  email?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  profile?: string;
}

interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  distance: number;
  map?: {
    polyline?: string;
    summary_polyline?: string;
  };
}

interface StravaDetailedActivity extends StravaActivity {
  polyline_detailed?: string;
}

export class StravaDataSync {
  private readonly baseUrl = 'https://www.strava.com/api/v3';
  private readonly clientId = process.env.STRAVA_CLIENT_ID!;
  private readonly clientSecret = process.env.STRAVA_CLIENT_SECRET!;

  /**
   * Step 1: Store or update Strava user authentication
   */
  async storeUserTokens(
    athleteId: number, 
    tokens: StravaTokens, 
    userProfile: StravaUser
  ): Promise<void> {
    console.log(`🔐 Storing tokens for athlete ID: ${athleteId}`);
    
    try {
      await sql`
        INSERT INTO strava_users (
          id, email, first_name, last_name, username, 
          city, state, country, sex, profile_picture_url,
          access_token, refresh_token, token_expires_at, 
          scopes, created_at, updated_at
        ) VALUES (
          ${athleteId},
          ${userProfile.email || null},
          ${userProfile.firstname || null},
          ${userProfile.lastname || null},
          ${userProfile.username || null},
          ${userProfile.city || null},
          ${userProfile.state || null},
          ${userProfile.country || null},
          ${userProfile.sex || null},
          ${userProfile.profile || null},
          ${tokens.access_token},
          ${tokens.refresh_token},
          ${new Date(tokens.expires_at * 1000).toISOString()},
          'read,activity:read_all',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          username = EXCLUDED.username,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          country = EXCLUDED.country,
          sex = EXCLUDED.sex,
          profile_picture_url = EXCLUDED.profile_picture_url,
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          token_expires_at = EXCLUDED.token_expires_at,
          updated_at = NOW()
      `;
      
      console.log(`✅ User tokens stored successfully for ${userProfile.firstname} ${userProfile.lastname}`);
    } catch (error) {
      console.error('❌ Error storing user tokens:', error);
      throw error;
    }
  }

  /**
   * Step 2: Refresh access token if expired
   */
  async refreshTokenIfNeeded(athleteId: number): Promise<string> {
    const userResult = await sql`
      SELECT access_token, refresh_token, token_expires_at
      FROM strava_users 
      WHERE id = ${athleteId}
    `;

    if (userResult.rows.length === 0) {
      throw new Error(`No user found with athlete ID: ${athleteId}`);
    }

    const user = userResult.rows[0];
    const expiresAt = new Date(user.token_expires_at);
    const now = new Date();
    
    // If token expires within 1 hour, refresh it
    if (expiresAt.getTime() - now.getTime() < 3600 * 1000) {
      console.log('🔄 Access token expired, refreshing...');
      
      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: user.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (!refreshResponse.ok) {
        throw new Error(`Token refresh failed: ${refreshResponse.statusText}`);
      }

      const tokens = await refreshResponse.json();
      
      // Update the database with new tokens
      await sql`
        UPDATE strava_users 
        SET 
          access_token = ${tokens.access_token},
          refresh_token = ${tokens.refresh_token},
          token_expires_at = ${new Date(tokens.expires_at * 1000).toISOString()},
          updated_at = NOW()
        WHERE id = ${athleteId}
      `;

      console.log('✅ Access token refreshed successfully');
      return tokens.access_token;
    }

    return user.access_token;
  }

  /**
   * Step 3: Fetch all historical running activities
   */
  async fetchAllHistoricalRuns(athleteId: number): Promise<void> {
    console.log(`🏃‍♂️ Starting historical run sync for athlete ${athleteId}`);
    
    const accessToken = await this.refreshTokenIfNeeded(athleteId);
    let page = 1;
    let totalActivities = 0;
    let runActivities = 0;

    while (true) {
      console.log(`📄 Fetching page ${page} of activities...`);
      
      // Fetch activities with pagination
      const activitiesResponse = await fetch(
        `${this.baseUrl}/athlete/activities?page=${page}&per_page=200`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      if (!activitiesResponse.ok) {
        throw new Error(`Failed to fetch activities: ${activitiesResponse.statusText}`);
      }

      const activities: StravaActivity[] = await activitiesResponse.json();
      
      if (activities.length === 0) {
        console.log('📋 No more activities found, stopping pagination');
        break;
      }

      totalActivities += activities.length;

      // Filter for running activities only
      const runningActivities = activities.filter(activity => 
        activity.sport_type === 'Run'
      );

      runActivities += runningActivities.length;

      if (runningActivities.length > 0) {
        console.log(`🏃‍♂️ Found ${runningActivities.length} running activities on page ${page}`);
        
        // Store running activities in batches
        await this.storeRunningActivities(athleteId, runningActivities, accessToken);
      }

      page++;
      
      // Rate limiting: Wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`🎉 Historical sync complete!`);
    console.log(`   📊 Total activities processed: ${totalActivities}`);
    console.log(`   🏃‍♂️ Running activities stored: ${runActivities}`);
  }

  /**
   * Step 4: Fetch recent activities (weekly sync)
   */
  async fetchRecentRuns(athleteId: number, daysBack: number = 7): Promise<void> {
    console.log(`🔄 Starting incremental sync for last ${daysBack} days`);
    
    const accessToken = await this.refreshTokenIfNeeded(athleteId);
    const after = Math.floor((Date.now() - (daysBack * 24 * 60 * 60 * 1000)) / 1000);

    const activitiesResponse = await fetch(
      `${this.baseUrl}/athlete/activities?after=${after}&per_page=200`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!activitiesResponse.ok) {
      throw new Error(`Failed to fetch recent activities: ${activitiesResponse.statusText}`);
    }

    const activities: StravaActivity[] = await activitiesResponse.json();
    const runningActivities = activities.filter(activity => activity.sport_type === 'Run');

    if (runningActivities.length > 0) {
      console.log(`🏃‍♂️ Found ${runningActivities.length} recent running activities`);
      await this.storeRunningActivities(athleteId, runningActivities, accessToken);
    } else {
      console.log('📋 No recent running activities found');
    }
  }

  /**
   * Step 5: Store running activities with detailed polylines
   */
  private async storeRunningActivities(
    athleteId: number, 
    activities: StravaActivity[], 
    accessToken: string
  ): Promise<void> {
    for (const activity of activities) {
      try {
        // Get detailed activity data to fetch high-resolution polyline
        const detailResponse = await fetch(
          `${this.baseUrl}/activities/${activity.id}`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );

        if (!detailResponse.ok) {
          console.warn(`⚠️ Failed to fetch details for activity ${activity.id}`);
          continue;
        }

        const detailedActivity: StravaDetailedActivity = await detailResponse.json();

        // Extract polylines (your specific field name: polyline_detailed)
        const summaryPolyline = activity.map?.summary_polyline || null;
        const detailedPolyline = detailedActivity.polyline_detailed || 
                                activity.map?.polyline || 
                                null;

        // Store in database
        await sql`
          INSERT INTO strava_runs (
            id, user_id, name, sport_type, start_date,
            distance_meters, summary_polyline, detailed_polyline,
            created_at, updated_at
          ) VALUES (
            ${activity.id},
            ${athleteId},
            ${activity.name},
            ${activity.sport_type},
            ${activity.start_date},
            ${activity.distance},
            ${summaryPolyline},
            ${detailedPolyline},
            NOW(),
            NOW()
          )
          ON CONFLICT (id) 
          DO UPDATE SET
            name = EXCLUDED.name,
            sport_type = EXCLUDED.sport_type,
            start_date = EXCLUDED.start_date,
            distance_meters = EXCLUDED.distance_meters,
            summary_polyline = EXCLUDED.summary_polyline,
            detailed_polyline = EXCLUDED.detailed_polyline,
            updated_at = NOW()
        `;

        console.log(`✅ Stored run: "${activity.name}" (${(activity.distance / 1609.34).toFixed(2)} miles)`);

        // Rate limiting: Wait between detail requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Error storing activity ${activity.id}:`, error);
        continue; // Continue with other activities
      }
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(athleteId: number): Promise<{
    totalRuns: number;
    totalDistance: number;
    lastSyncDate: string | null;
    oldestRun: string | null;
    newestRun: string | null;
  }> {
    const result = await sql`
      SELECT 
        COUNT(*) as total_runs,
        SUM(distance_meters) as total_distance,
        MAX(updated_at) as last_sync_date,
        MIN(start_date) as oldest_run,
        MAX(start_date) as newest_run
      FROM strava_runs 
      WHERE user_id = ${athleteId}
    `;

    const stats = result.rows[0];
    
    return {
      totalRuns: parseInt(stats.total_runs) || 0,
      totalDistance: parseFloat(stats.total_distance) || 0,
      lastSyncDate: stats.last_sync_date,
      oldestRun: stats.oldest_run,
      newestRun: stats.newest_run
    };
  }
}

// Export singleton instance
export const stravaSync = new StravaDataSync();
