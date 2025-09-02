// 📂 src/app/api/strava/sync/route.ts
/**
 * Manual Strava data synchronization endpoint
 * Allows authenticated users to trigger data sync manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStravaClient, StravaClient } from '@/lib/strava-client';
import { batchUpsertStravaRuns, getLastRunDate, getDatabaseHealth } from '@/lib/db/strava-database';

export async function POST(request: NextRequest) {
  try {
    // Parse request body for sync options
    const body = await request.json().catch(() => ({}));
    const { 
      daysBack = 30, 
      forceFullSync = false,
      accessToken = null 
    } = body;

    console.log('🚀 Starting manual Strava sync...', { daysBack, forceFullSync });
    
    // Create Strava client (use provided token or refresh stored one)
    const stravaClient = accessToken 
      ? new StravaClient(accessToken)
      : await createStravaClient();

    // Validate the token first
    const isValidToken = await stravaClient.validateToken();
    if (!isValidToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired Strava token',
        message: 'Please re-authenticate with Strava'
      }, { status: 401 });
    }

    // Determine sync starting point
    let startDate: Date;
    
    if (forceFullSync) {
      // Full sync: go back specified number of days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      console.log(`📅 Full sync: fetching ${daysBack} days of data from ${startDate.toDateString()}`);
    } else {
      // Incremental sync: start from last run date or 30 days ago
      const lastRunDate = await getLastRunDate();
      
      if (lastRunDate) {
        startDate = new Date(lastRunDate);
        startDate.setDate(startDate.getDate() - 1); // Overlap by 1 day to catch any missed runs
        console.log(`📅 Incremental sync: starting from ${startDate.toDateString()}`);
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        console.log(`📅 Initial sync: fetching ${daysBack} days of data from ${startDate.toDateString()}`);
      }
    }

    // Fetch activities from Strava
    const activities = await stravaClient.getAllRunsInDateRange(startDate);
    console.log(`📊 Found ${activities.length} running activities to sync`);

    if (activities.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new activities found to sync',
        syncedCount: 0,
        activitiesFound: 0,
        syncPeriod: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          daysBack
        }
      });
    }

    // Get database health before sync
    const dbHealthBefore = await getDatabaseHealth();

    // Batch upsert the activities
    const syncedCount = await batchUpsertStravaRuns(activities);
    
    // Get updated database health
    const dbHealthAfter = await getDatabaseHealth();

    console.log(`✅ Manual Strava sync completed: ${syncedCount}/${activities.length} activities processed`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} activities`,
      syncedCount,
      activitiesFound: activities.length,
      syncPeriod: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        daysBack,
        forceFullSync
      },
      databaseHealth: {
        before: dbHealthBefore,
        after: dbHealthAfter
      },
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manual Strava sync failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Manual sync failed. Check your Strava authentication and try again.',
      failedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint - Check sync status and provide sync options
 */
export async function GET() {
  try {
    const dbHealth = await getDatabaseHealth();
    const lastRunDate = await getLastRunDate();
    
    return NextResponse.json({
      syncStatus: 'Manual sync endpoint ready',
      databaseHealth: dbHealth,
      lastRunDate,
      syncOptions: {
        defaultDaysBack: 30,
        maxRecommendedDaysBack: 90,
        supportsIncrementalSync: true,
        supportsFullSync: true
      },
      instructions: {
        incrementalSync: 'POST with empty body for incremental sync',
        fullSync: 'POST with { "forceFullSync": true, "daysBack": 60 }',
        customToken: 'POST with { "accessToken": "your_token" }'
      }
    });

  } catch (error) {
    console.error('❌ Error checking sync status:', error);
    
    return NextResponse.json({
      error: 'Failed to check sync status',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
