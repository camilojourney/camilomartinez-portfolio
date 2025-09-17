// 📂 src/lib/db/strava-database.ts
/**
 * Database operations for Strava data in the Astoria Conquest feature
 * Handles storing runs, street data, user authentication, and geospatial calculations
 */

import { sql } from './db';
import { StravaActivity } from '@/types/strava';
import { StravaTokens, StravaProfile, StoredStravaUser } from '@/types/strava-auth';

/**
 * STRAVA USER AUTHENTICATION OPERATIONS
 * Following the same pattern as WHOOP integration
 */

export class StravaUserService {
  // Upsert user profile information
  async upsertUser(user: StravaProfile, db = sql): Promise<void> {
    await db`
      INSERT INTO strava_users (
        id, email, first_name, last_name, username, city, state, country, sex, profile_picture_url, updated_at
      )
      VALUES (
        ${user.id}, ${user.email || null}, ${user.firstname || null}, ${user.lastname || null}, 
        ${user.username || null}, ${user.city || null}, ${user.state || null}, ${user.country || null}, 
        ${user.sex || null}, ${user.profilePictureUrl || null}, NOW()
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
        updated_at = NOW();
    `;
  }

  // Upsert user with tokens (during OAuth flow)
  async upsertUserWithTokens(user: StravaProfile, tokens?: StravaTokens, db = sql): Promise<void> {
    if (tokens) {
      await db`
        INSERT INTO strava_users (
          id, email, first_name, last_name, username, city, state, country, sex, profile_picture_url,
          access_token, refresh_token, token_expires_at, scopes, updated_at
        )
        VALUES (
          ${user.id}, ${user.email || null}, ${user.firstname || null}, ${user.lastname || null}, 
          ${user.username || null}, ${user.city || null}, ${user.state || null}, ${user.country || null}, 
          ${user.sex || null}, ${user.profilePictureUrl || null},
          ${tokens.accessToken}, ${tokens.refreshToken}, ${tokens.expiresAt.toISOString()}, ${tokens.scopes || null}, NOW()
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
          scopes = EXCLUDED.scopes,
          updated_at = NOW();
      `;
    } else {
      // Just update user info, preserve existing tokens
      await this.upsertUser(user, db);
    }
  }

  // Update tokens only (after refresh)
  async updateUserTokens(userId: number, tokens: StravaTokens, db = sql): Promise<void> {
    await db`
      UPDATE strava_users 
      SET 
        access_token = ${tokens.accessToken},
        refresh_token = ${tokens.refreshToken},
        token_expires_at = ${tokens.expiresAt.toISOString()},
        scopes = ${tokens.scopes || null},
        updated_at = NOW()
      WHERE id = ${userId}
    `;
  }

  // Get user tokens
  async getUserTokens(userId: number, db = sql): Promise<StravaTokens | null> {
    const result = await db`
      SELECT access_token, refresh_token, token_expires_at, scopes
      FROM strava_users 
      WHERE id = ${userId} AND refresh_token IS NOT NULL
    `;

    if (result.rows.length === 0 || !result.rows[0].access_token) {
      return null;
    }

    const row = result.rows[0];
    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: new Date(row.token_expires_at),
      scopes: row.scopes,
    };
  }

  // Get all users with tokens (for cron jobs)
  async getAllUsersWithTokens(db = sql): Promise<StoredStravaUser[]> {
    const result = await db`
      SELECT id, email, first_name, last_name, username, city, state, country, sex, profile_picture_url,
             access_token, refresh_token, token_expires_at, scopes, created_at, updated_at
      FROM strava_users 
      WHERE refresh_token IS NOT NULL
      ORDER BY id
    `;

    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      username: row.username,
      city: row.city,
      state: row.state,
      country: row.country,
      sex: row.sex,
      profile_picture_url: row.profile_picture_url,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      token_expires_at: row.token_expires_at ? new Date(row.token_expires_at) : undefined,
      scopes: row.scopes,
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
    }));
  }

  // Get user profile by ID
  async getUserProfile(userId: number, db = sql): Promise<StoredStravaUser | null> {
    const result = await sql`
      SELECT id, email, first_name, last_name, username, city, state, country, sex, profile_picture_url,
             access_token, refresh_token, token_expires_at, scopes, created_at, updated_at
      FROM strava_users 
      WHERE id = ${userId}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      username: row.username,
      city: row.city,
      state: row.state,
      country: row.country,
      sex: row.sex,
      profile_picture_url: row.profile_picture_url,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      token_expires_at: row.token_expires_at ? new Date(row.token_expires_at) : undefined,
      scopes: row.scopes,
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }
}

// Create a singleton instance
export const stravaUserService = new StravaUserService();

/**
 * STRAVA ACTIVITY DATA OPERATIONS
 * Simplified functions for data population (no map/geo processing yet)
 */

/**
 * Insert or update a Strava run in the database with ENHANCED DATA
 * Handles all enhanced fields: performance metrics, coordinates, splits, etc.
 */
export async function upsertStravaRun(activity: StravaActivity, userId: number, detailedPolyline?: string): Promise<void> {
  try {
    if (!activity.map?.summary_polyline) {
      console.warn(`⚠️ Skipping activity ${activity.id}: No GPS data available`);
      return;
    }

    // Use detailed polyline if provided, otherwise fall back to summary
    const polylineToStore = detailedPolyline || activity.map.polyline || activity.map.summary_polyline;
    
    // Enhanced upsert with ALL enhanced fields (matching actual schema)
    await sql`
      INSERT INTO strava_runs (
        id, user_id, name, sport_type, start_date, distance_meters,
        summary_polyline, detailed_polyline,
        elapsed_time_seconds, start_date_local, utc_offset_seconds,
        average_speed_mps, max_speed_mps, total_elevation_gain,
        elev_high, elev_low, suffer_score, perceived_exertion,
        private_note, created_at
      ) VALUES (
        ${activity.id}, ${userId}, ${activity.name}, ${activity.type || activity.sport_type || 'Run'},
        ${activity.start_date}, ${activity.distance},
        ${activity.map.summary_polyline}, ${polylineToStore},
        ${activity.elapsed_time || null}, ${activity.start_date_local || null}, ${activity.utc_offset || null},
        ${activity.average_speed || null}, ${activity.max_speed || null},
        ${activity.total_elevation_gain || null}, ${activity.elev_high || null},
        ${activity.elev_low || null}, ${activity.suffer_score || null},
        ${activity.perceived_exertion || null}, ${activity.private_note || null},
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
        elapsed_time_seconds = EXCLUDED.elapsed_time_seconds,
        start_date_local = EXCLUDED.start_date_local,
        utc_offset_seconds = EXCLUDED.utc_offset_seconds,
        average_speed_mps = EXCLUDED.average_speed_mps,
        max_speed_mps = EXCLUDED.max_speed_mps,
        total_elevation_gain = EXCLUDED.total_elevation_gain,
        elev_high = EXCLUDED.elev_high,
        elev_low = EXCLUDED.elev_low,
        suffer_score = EXCLUDED.suffer_score,
        perceived_exertion = EXCLUDED.perceived_exertion,
        private_note = EXCLUDED.private_note,
        updated_at = NOW()
    `;

    // Handle splits data in normalized table
    await upsertStravaSplits(activity.id, activity.splits_metric, activity.splits_standard);

    console.log(`✅ Enhanced upsert: ${activity.name} (${(activity.distance / 1000).toFixed(2)}km) with performance data`);
  } catch (error) {
    console.error(`❌ Error upserting run ${activity.id}:`, error);
    throw error;
  }
}

/**
 * Upsert splits data into the normalized strava_run_splits table
 * Handles both metric and standard splits from Strava API
 */
export async function upsertStravaSplits(runId: number, splitsMetric?: any[], splitsStandard?: any[]): Promise<void> {
  try {
    // Clear existing splits for this run first
    await sql`DELETE FROM strava_run_splits WHERE strava_run_id = ${runId}`;

    // Insert metric splits
    if (splitsMetric && splitsMetric.length > 0) {
      for (const [index, split] of splitsMetric.entries()) {
        await sql`
          INSERT INTO strava_run_splits (
            strava_run_id, split_type, split_number,
            distance_meters, elapsed_time_seconds, moving_time_seconds,
            elevation_difference_meters, average_speed_mps, 
            average_grade_adjusted_speed, pace_zone
          ) VALUES (
            ${runId}, 'metric', ${index + 1},
            ${split.distance || 0}, ${split.elapsed_time || 0}, ${split.moving_time || split.elapsed_time || 0},
            ${split.elevation_difference || null}, ${split.average_speed || null},
            ${split.average_grade_adjusted_speed || null}, ${split.pace_zone || null}
          )
        `;
      }
    }

    // Insert standard splits
    if (splitsStandard && splitsStandard.length > 0) {
      for (const [index, split] of splitsStandard.entries()) {
        await sql`
          INSERT INTO strava_run_splits (
            strava_run_id, split_type, split_number,
            distance_meters, elapsed_time_seconds, moving_time_seconds,
            elevation_difference_meters, average_speed_mps,
            average_grade_adjusted_speed, pace_zone
          ) VALUES (
            ${runId}, 'standard', ${index + 1},
            ${split.distance || 0}, ${split.elapsed_time || 0}, ${split.moving_time || split.elapsed_time || 0},
            ${split.elevation_difference || null}, ${split.average_speed || null},
            ${split.average_grade_adjusted_speed || null}, ${split.pace_zone || null}
          )
        `;
      }
    }

    if (splitsMetric?.length || splitsStandard?.length) {
      console.log(`📊 Upserted ${splitsMetric?.length || 0} metric + ${splitsStandard?.length || 0} standard splits for run ${runId}`);
    }
  } catch (error) {
    console.error(`❌ Error upserting splits for run ${runId}:`, error);
    // Don't throw here - we don't want splits errors to prevent the main run data from being saved
  }
}

/**
 * Batch upsert multiple Strava runs for a specific user
 */
export async function batchUpsertStravaRuns(activities: StravaActivity[], userId: number): Promise<number> {
  let successCount = 0;
  let errorCount = 0;

  console.log(`📊 Starting batch upsert of ${activities.length} activities for user ${userId}...`);

  for (const activity of activities) {
    try {
      // For now, use summary polyline - we'll enhance this later to fetch detailed polylines
      await upsertStravaRun(activity, userId);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to upsert activity ${activity.id}:`, error);
      errorCount++;
    }

    // Small delay to prevent overwhelming the database
    if (successCount % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`✅ Batch upsert complete for user ${userId}: ${successCount} successful, ${errorCount} errors`);
  return successCount;
}

/**
 * Get the most recent run date to determine sync starting point
 */
export async function getLastRunDate(): Promise<Date | null> {
  try {
    const result = await sql`
      SELECT MAX(start_date) as last_run_date
      FROM strava_runs
    `;

    const lastRunDate = result.rows[0]?.last_run_date;
    return lastRunDate ? new Date(lastRunDate) : null;
  } catch (error) {
    console.error('❌ Error getting last run date:', error);
    return null;
  }
}

/**
 * Get the highest activity ID to determine incremental sync point
 */
export async function getLastActivityId(): Promise<number | null> {
  try {
    const result = await sql`
      SELECT MAX(id) as last_activity_id
      FROM strava_runs
    `;

    return result.rows[0]?.last_activity_id || null;
  } catch (error) {
    console.error('❌ Error getting last activity ID:', error);
    return null;
  }
}

/**
 * Get simple database statistics (no complex geo calculations for now)
 */
export async function getSimpleStats(): Promise<{
  totalRuns: number;
  totalUsers: number;
  oldestRun?: Date;
  newestRun?: Date;
}> {
  try {
    const result = await sql`
      SELECT 
        (SELECT COUNT(*) FROM strava_runs) as total_runs,
        (SELECT COUNT(*) FROM strava_users) as total_users,
        (SELECT MIN(start_date) FROM strava_runs) as oldest_run,
        (SELECT MAX(start_date) FROM strava_runs) as newest_run
    `;

    const row = result.rows[0];
    
    return {
      totalRuns: parseInt(row?.total_runs) || 0,
      totalUsers: parseInt(row?.total_users) || 0,
      oldestRun: row?.oldest_run ? new Date(row.oldest_run) : undefined,
      newestRun: row?.newest_run ? new Date(row.newest_run) : undefined,
    };
  } catch (error) {
    console.error('❌ Error getting simple stats:', error);
    return {
      totalRuns: 0,
      totalUsers: 0,
    };
  }
}

/**
 * Get all runs as simple data (no GeoJSON for now)
 */
export async function getAllRuns(): Promise<any[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        user_id,
        name,
        sport_type,
        start_date,
        distance_meters,
        summary_polyline,
        detailed_polyline,
        created_at
      FROM strava_runs
      ORDER BY start_date DESC
    `;

    return result.rows;
  } catch (error) {
    console.error('❌ Error getting runs:', error);
    return [];
  }
}

/**
 * Get recent running activity for dashboard highlights
 */
export async function getRecentRuns(limit: number = 5): Promise<any[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        user_id,
        name,
        sport_type,
        start_date,
        distance_meters,
        summary_polyline,
        detailed_polyline,
        created_at
      FROM strava_runs
      ORDER BY start_date DESC
      LIMIT ${limit}
    `;

    return result.rows;
  } catch (error) {
    console.error('❌ Error getting recent runs:', error);
    return [];
  }
}

/**
 * Delete old runs (for data cleanup)
 */
export async function deleteRunsOlderThan(date: Date): Promise<number> {
  try {
    const result = await sql`
      DELETE FROM strava_runs
      WHERE start_date < ${date.toISOString()}
    `;

    const deletedCount = result.rowCount || 0;
    console.log(`🧹 Deleted ${deletedCount} runs older than ${date.toDateString()}`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Error deleting old runs:', error);
    return 0;
  }
}
