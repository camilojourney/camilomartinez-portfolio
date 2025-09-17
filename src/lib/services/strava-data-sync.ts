// 📂 src/lib/services/strava-data-sync.ts
/**
 * Strava Data Synchronization Service
 * Phase 2: Data Population - Historical and Weekly Sync
 * 
 * This service builds on top of the existing Phase 1 authentication infrastructure
 * to populate the strava_runs table with historical and ongoing activity data.
 */

import { StravaClient, createStravaClient } from '@/lib/strava-client';
import { stravaUserService, batchUpsertStravaRuns, getLastRunDate, getLastActivityId, upsertStravaRun } from '@/lib/db/strava-database';
import { StravaActivity, StravaSplit } from '@/types/strava';
import { StoredStravaUser } from '@/types/strava-auth';
import { sql } from '@/lib/db/db';

export interface SyncProgress {
  userId: number;
  totalActivities: number;
  processedActivities: number;
  successfulImports: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
}

export interface SyncOptions {
  maxActivitiesPerBatch?: number;
  delayBetweenBatches?: number;
  maxRetries?: number;
  onProgress?: (progress: SyncProgress) => void;
}

/**
 * Enhanced upsert function for strava_runs table
 * Handles the complete database schema with all new Strava API fields
 */
async function upsertStravaRunWithUser(activity: StravaActivity, userId: number, detailedPolyline?: string): Promise<void> {
  try {
    if (!activity.map?.summary_polyline) {
      console.warn(`⚠️ Skipping activity ${activity.id}: No GPS data available`);
      return;
    }

    await sql`
      INSERT INTO strava_runs (
        id,
        user_id,
        name,
        sport_type,
        start_date,
        distance_meters,
        summary_polyline,
        detailed_polyline,
        -- New timing fields
        elapsed_time_seconds,
        start_date_local,
        utc_offset_seconds,
        -- New performance metrics
        average_speed_mps,
        max_speed_mps,
        total_elevation_gain,
        elev_high,
        elev_low,
        suffer_score,
        perceived_exertion,
        -- New location coordinates  
        start_latlng,
        end_latlng,
        -- New notes
        private_note
      ) VALUES (
        ${activity.id},
        ${userId},
        ${activity.name},
        ${activity.type || activity.sport_type || 'Run'},
        ${activity.start_date},
        ${activity.distance},
        ${activity.map.summary_polyline},
        ${detailedPolyline || activity.map.polyline || activity.map.summary_polyline},
        -- Timing values
        ${activity.elapsed_time || null},
        ${activity.start_date_local || null},
        ${activity.utc_offset || null},
        -- Performance values
        ${activity.average_speed || null},
        ${activity.max_speed || null},
        ${activity.total_elevation_gain || null},
        ${activity.elev_high || null},
        ${activity.elev_low || null},
        ${activity.suffer_score || null},
        ${activity.perceived_exertion || null},
        -- Location coordinates (PostGIS POINT format)
        ${activity.start_latlng ? `POINT(${activity.start_latlng[1]} ${activity.start_latlng[0]})` : null},
        ${activity.end_latlng ? `POINT(${activity.end_latlng[1]} ${activity.end_latlng[0]})` : null},
        -- Notes
        ${activity.private_note || null}
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
        start_latlng = EXCLUDED.start_latlng,
        end_latlng = EXCLUDED.end_latlng,
        private_note = EXCLUDED.private_note,
        updated_at = NOW()
    `;

    // Now handle the splits data in the normalized table
    await upsertStravaSplits(activity.id, activity.splits_metric, activity.splits_standard);

    console.log(`✅ Upserted run: ${activity.name} (${(activity.distance / 1000).toFixed(2)}km) with enhanced data and splits`);
  } catch (error) {
    console.error(`❌ Error upserting run ${activity.id}:`, error);
    throw error;
  }
}

/**
 * Upserts splits data into the normalized strava_run_splits table
 * Handles both metric and standard splits from Strava API
 */
async function upsertStravaSplits(runId: number, splitsMetric?: StravaSplit[], splitsStandard?: StravaSplit[]): Promise<void> {
  try {
    // Clear existing splits for this run first
    await sql`DELETE FROM strava_run_splits WHERE run_id = ${runId}`;

    // Insert metric splits
    if (splitsMetric && splitsMetric.length > 0) {
      for (const [index, split] of splitsMetric.entries()) {
        await sql`
          INSERT INTO strava_run_splits (
            run_id,
            split_index,
            split_type,
            distance,
            elapsed_time,
            elevation_difference,
            moving_time,
            pace_zone,
            average_speed,
            average_grade_adjusted_speed
          ) VALUES (
            ${runId},
            ${index + 1},
            'metric',
            ${split.distance || null},
            ${split.elapsed_time || null},
            ${split.elevation_difference || null},
            ${split.moving_time || null},
            ${split.pace_zone || null},
            ${split.average_speed || null},
            ${split.average_grade_adjusted_speed || null}
          )
        `;
      }
    }

    // Insert standard splits
    if (splitsStandard && splitsStandard.length > 0) {
      for (const [index, split] of splitsStandard.entries()) {
        await sql`
          INSERT INTO strava_run_splits (
            run_id,
            split_index,
            split_type,
            distance,
            elapsed_time,
            elevation_difference,
            moving_time,
            pace_zone,
            average_speed,
            average_grade_adjusted_speed
          ) VALUES (
            ${runId},
            ${index + 1},
            'standard',
            ${split.distance || null},
            ${split.elapsed_time || null},
            ${split.elevation_difference || null},
            ${split.moving_time || null},
            ${split.pace_zone || null},
            ${split.average_speed || null},
            ${split.average_grade_adjusted_speed || null}
          )
        `;
      }
    }

    if (splitsMetric?.length || splitsStandard?.length) {
      console.log(`📊 Inserted ${splitsMetric?.length || 0} metric splits, ${splitsStandard?.length || 0} standard splits for run ${runId}`);
    }
  } catch (error) {
    console.error(`❌ Error upserting splits for run ${runId}:`, error);
    // Don't throw here - we don't want splits errors to prevent the main run data from being saved
  }
}

/**
 * Get the most recent run date for a specific user
 */
async function getLastRunDateForUser(userId: number): Promise<Date | null> {
  try {
    const result = await sql`
      SELECT MAX(start_date) as last_run_date
      FROM strava_runs
      WHERE user_id = ${userId}
    `;

    const lastRunDate = result.rows[0]?.last_run_date;
    return lastRunDate ? new Date(lastRunDate) : null;
  } catch (error) {
    console.error('❌ Error getting last run date for user:', error);
    return null;
  }
}

/**
 * Get the highest activity ID for a specific user
 */
async function getLastActivityIdForUser(userId: number): Promise<number | null> {
  try {
    const result = await sql`
      SELECT MAX(id) as last_activity_id
      FROM strava_runs
      WHERE user_id = ${userId}
    `;

    return result.rows[0]?.last_activity_id || null;
  } catch (error) {
    console.error('❌ Error getting last activity ID for user:', error);
    return null;
  }
}

/**
 * Historical Data Import Service
 * Fetches all historical running data for a user from Strava
 */
export class HistoricalDataImporter {
  private defaultOptions: Required<SyncOptions> = {
    maxActivitiesPerBatch: 30,
    delayBetweenBatches: 1000, // 1 second between batches to respect rate limits
    maxRetries: 3,
    onProgress: () => {},
  };

  /**
   * Import all historical running data for a specific user
   */
  async importUserHistoricalData(
    userId: number, 
    options: SyncOptions = {}
  ): Promise<SyncProgress> {
    const opts = { ...this.defaultOptions, ...options };
    
    const progress: SyncProgress = {
      userId,
      totalActivities: 0,
      processedActivities: 0,
      successfulImports: 0,
      errors: [],
      startTime: new Date(),
      status: 'running',
    };

    let stravaClient: StravaClient | null = null;

    try {
      console.log(`🚀 Starting historical data import for user ${userId}`);
      
      // Get user tokens for API calls
      const userTokens = await stravaUserService.getUserTokens(userId);
      if (!userTokens) {
        throw new Error(`No valid tokens found for user ${userId}`);
      }

      // Create Strava client with user's refresh token
      stravaClient = await createStravaClient(userTokens.refreshToken);

      // Get all running activities - start from very beginning
      const startDate = new Date('2010-01-01'); // Strava was founded in 2009
      const endDate = new Date();
      
      console.log(`📊 Fetching all running activities for user ${userId} since ${startDate.toDateString()}...`);
      const allActivities = await stravaClient.getAllRunsInDateRange(startDate, endDate);
      
      progress.totalActivities = allActivities.length;
      console.log(`📈 Found ${allActivities.length} total running activities`);

      opts.onProgress(progress);

      // Process activities in batches
      const batches = this.createBatches(allActivities, opts.maxActivitiesPerBatch);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchNumber = i + 1;
        
        console.log(`📦 Processing batch ${batchNumber}/${batches.length} (${batch.length} activities)`);

        try {
          // Process each activity in the batch
          for (const activity of batch) {
            try {
              // Try to get detailed polyline for better accuracy
              let detailedPolyline: string | undefined;
              try {
                const detailedActivity = await stravaClient.getActivityDetails(activity.id);
                detailedPolyline = detailedActivity.map?.polyline;
                
                // Small delay to respect rate limits
                await this.delay(200);
              } catch (detailError) {
                console.warn(`⚠️ Could not get detailed polyline for activity ${activity.id}, using summary`);
              }

              // Upsert the activity
              await upsertStravaRunWithUser(activity, userId, detailedPolyline);
              progress.successfulImports++;
              
            } catch (activityError) {
              const errorMsg = `Activity ${activity.id} failed: ${activityError instanceof Error ? activityError.message : 'Unknown error'}`;
              console.error(`❌ ${errorMsg}`);
              progress.errors.push(errorMsg);
            }
            
            progress.processedActivities++;
            
            // Update progress periodically
            if (progress.processedActivities % 10 === 0) {
              opts.onProgress(progress);
            }
          }

          // Delay between batches to respect rate limits
          if (i < batches.length - 1) {
            await this.delay(opts.delayBetweenBatches);
          }
          
        } catch (batchError) {
          const errorMsg = `Batch ${batchNumber} failed: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          progress.errors.push(errorMsg);
          
          // Continue with next batch even if one fails
          progress.processedActivities += batch.length;
        }
      }

      progress.status = 'completed';
      progress.endTime = new Date();
      
      console.log(`✅ Historical import completed for user ${userId}`);
      console.log(`📊 Results: ${progress.successfulImports}/${progress.totalActivities} activities imported successfully`);
      
      if (progress.errors.length > 0) {
        console.log(`⚠️ ${progress.errors.length} errors encountered during import`);
      }

    } catch (error) {
      progress.status = 'failed';
      progress.endTime = new Date();
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during historical import';
      progress.errors.push(errorMsg);
      console.error(`❌ Historical import failed for user ${userId}:`, errorMsg);
    }

    opts.onProgress(progress);
    return progress;
  }

  /**
   * Import historical data for all users with valid tokens
   */
  async importAllUsersHistoricalData(options: SyncOptions = {}): Promise<SyncProgress[]> {
    console.log(`🌍 Starting historical data import for all users`);
    
    const allUsers = await stravaUserService.getAllUsersWithTokens();
    console.log(`👥 Found ${allUsers.length} users with valid tokens`);

    const results: SyncProgress[] = [];

    for (const user of allUsers) {
      console.log(`\n👤 Processing user: ${user.username || user.id} (${user.first_name} ${user.last_name})`);
      
      try {
        const result = await this.importUserHistoricalData(user.id, options);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to import data for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          totalActivities: 0,
          processedActivities: 0,
          successfulImports: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          startTime: new Date(),
          endTime: new Date(),
          status: 'failed',
        });
      }

      // Delay between users to be respectful to Strava API
      await this.delay(2000);
    }

    const totalImported = results.reduce((sum, r) => sum + r.successfulImports, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    
    console.log(`\n🎉 All users historical import completed!`);
    console.log(`📊 Total activities imported: ${totalImported}`);
    console.log(`⚠️ Total errors: ${totalErrors}`);

    return results;
  }

  /**
   * Create batches of activities for processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Weekly Sync Service
 * Incrementally syncs new activities since the last sync
 */
export class WeeklySyncService {
  private historicalImporter: HistoricalDataImporter;

  constructor() {
    this.historicalImporter = new HistoricalDataImporter();
  }

  /**
   * Sync new activities for a specific user since their last sync
   */
  async syncUserNewActivities(userId: number, options: SyncOptions = {}): Promise<SyncProgress> {
    const progress: SyncProgress = {
      userId,
      totalActivities: 0,
      processedActivities: 0,
      successfulImports: 0,
      errors: [],
      startTime: new Date(),
      status: 'running',
    };

    let stravaClient: StravaClient | null = null;

    try {
      console.log(`🔄 Starting weekly sync for user ${userId}`);
      
      // Get user tokens
      const userTokens = await stravaUserService.getUserTokens(userId);
      if (!userTokens) {
        throw new Error(`No valid tokens found for user ${userId}`);
      }

      // Create Strava client
      stravaClient = await createStravaClient(userTokens.refreshToken);

      // Determine sync start date (last run date + 1 day, or 7 days ago)
      const lastRunDate = await getLastRunDateForUser(userId);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const syncStartDate = lastRunDate && lastRunDate > oneWeekAgo 
        ? new Date(lastRunDate.getTime() + 24 * 60 * 60 * 1000) // Start from day after last run
        : oneWeekAgo; // If no recent data, sync last week

      console.log(`📅 Syncing activities since: ${syncStartDate.toDateString()}`);

      // Get new activities since last sync
      const newActivities = await stravaClient.getAllRunsInDateRange(
        syncStartDate,
        new Date() // Until now
      );

      progress.totalActivities = newActivities.length;
      console.log(`📈 Found ${newActivities.length} new activities to sync`);

      if (newActivities.length === 0) {
        console.log(`✅ No new activities to sync for user ${userId}`);
        progress.status = 'completed';
        progress.endTime = new Date();
        return progress;
      }

      // Process the new activities
      for (const activity of newActivities) {
        try {
          // Try to get detailed polyline
          let detailedPolyline: string | undefined;
          try {
            const detailedActivity = await stravaClient.getActivityDetails(activity.id);
            detailedPolyline = detailedActivity.map?.polyline;
            await this.historicalImporter['delay'](200);
          } catch (detailError) {
            console.warn(`⚠️ Could not get detailed polyline for activity ${activity.id}, using summary`);
          }

          // Upsert the activity
          await upsertStravaRunWithUser(activity, userId, detailedPolyline);
          progress.successfulImports++;
          
        } catch (activityError) {
          const errorMsg = `Activity ${activity.id} failed: ${activityError instanceof Error ? activityError.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          progress.errors.push(errorMsg);
        }
        
        progress.processedActivities++;
      }

      progress.status = 'completed';
      progress.endTime = new Date();

      console.log(`✅ Weekly sync completed for user ${userId}: ${progress.successfulImports}/${newActivities.length} activities synced`);

    } catch (error) {
      progress.status = 'failed';
      progress.endTime = new Date();
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during weekly sync';
      progress.errors.push(errorMsg);
      console.error(`❌ Weekly sync failed for user ${userId}:`, errorMsg);
    }

    options.onProgress?.(progress);
    return progress;
  }

  /**
   * Run weekly sync for all users
   */
  async syncAllUsersNewActivities(options: SyncOptions = {}): Promise<SyncProgress[]> {
    console.log(`🌍 Starting weekly sync for all users`);
    
    const allUsers = await stravaUserService.getAllUsersWithTokens();
    console.log(`👥 Found ${allUsers.length} users with valid tokens`);

    const results: SyncProgress[] = [];

    for (const user of allUsers) {
      console.log(`\n👤 Syncing user: ${user.username || user.id} (${user.first_name} ${user.last_name})`);
      
      try {
        const result = await this.syncUserNewActivities(user.id, options);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to sync user ${user.id}:`, error);
        results.push({
          userId: user.id,
          totalActivities: 0,
          processedActivities: 0,
          successfulImports: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          startTime: new Date(),
          endTime: new Date(),
          status: 'failed',
        });
      }

      // Small delay between users
      await this.historicalImporter['delay'](1000);
    }

    const totalSynced = results.reduce((sum, r) => sum + r.successfulImports, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    
    console.log(`\n🎉 Weekly sync for all users completed!`);
    console.log(`📊 Total new activities synced: ${totalSynced}`);
    console.log(`⚠️ Total errors: ${totalErrors}`);

    return results;
  }
}

/**
 * Main Strava Data Sync Coordinator
 * Provides unified interface for both historical and weekly sync operations
 */
export class StravaDataSyncCoordinator {
  private historicalImporter: HistoricalDataImporter;
  private weeklySyncService: WeeklySyncService;

  constructor() {
    this.historicalImporter = new HistoricalDataImporter();
    this.weeklySyncService = new WeeklySyncService();
  }

  /**
   * Run a complete data population for a user (historical + recent)
   */
  async fullUserSync(userId: number, options: SyncOptions = {}): Promise<{
    historical: SyncProgress;
    weekly: SyncProgress;
  }> {
    console.log(`🚀 Starting full sync for user ${userId}`);

    // First run historical import
    const historical = await this.historicalImporter.importUserHistoricalData(userId, options);
    
    // Then run weekly sync to catch any recent activities
    const weekly = await this.weeklySyncService.syncUserNewActivities(userId, options);

    console.log(`✅ Full sync completed for user ${userId}`);
    console.log(`📊 Historical: ${historical.successfulImports} activities`);
    console.log(`📊 Weekly: ${weekly.successfulImports} new activities`);

    return { historical, weekly };
  }

  /**
   * Run weekly sync for all users (main cron job function)
   */
  async runWeeklySyncForAllUsers(options: SyncOptions = {}): Promise<SyncProgress[]> {
    return this.weeklySyncService.syncAllUsersNewActivities(options);
  }

  /**
   * Run historical import for all users (one-time setup)
   */
  async runHistoricalImportForAllUsers(options: SyncOptions = {}): Promise<SyncProgress[]> {
    return this.historicalImporter.importAllUsersHistoricalData(options);
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<{
    lastSyncDate: Date | null;
    totalRuns: number;
    totalUsers: number;
    needsHistoricalImport: boolean;
  }> {
    const allUsers = await stravaUserService.getAllUsersWithTokens();
    
    // Get total runs across all users
    const result = await sql`SELECT COUNT(*) as total_runs FROM strava_runs`;
    const totalRuns = parseInt(result.rows[0]?.total_runs) || 0;
    
    // Get most recent sync date
    const lastSyncResult = await sql`SELECT MAX(start_date) as last_sync FROM strava_runs`;
    const lastSyncDate = lastSyncResult.rows[0]?.last_sync ? new Date(lastSyncResult.rows[0].last_sync) : null;
    
    // Simple heuristic: if we have fewer than 10 runs per user, might need historical import
    const needsHistoricalImport = allUsers.length > 0 && (totalRuns / allUsers.length) < 10;

    return {
      lastSyncDate,
      totalRuns,
      totalUsers: allUsers.length,
      needsHistoricalImport,
    };
  }
}

// Export singleton instances for use across the application
export const historicalDataImporter = new HistoricalDataImporter();
export const weeklySyncService = new WeeklySyncService();
export const stravaDataSyncCoordinator = new StravaDataSyncCoordinator();
