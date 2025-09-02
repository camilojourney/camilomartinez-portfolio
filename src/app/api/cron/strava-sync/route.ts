// 📂 src/app/api/cron/strava-sync/route.ts
/**
 * Automated Strava data synchronization cron job
 * Triggered daily to fetch new running activities from Strava
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStravaClient } from '@/lib/strava-client';
import { batchUpsertStravaRuns, getLastActivityId, getDatabaseHealth } from '@/lib/db/strava-database';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Starting Strava sync cron job...');
    
    // Get database health info for monitoring
    const dbHealth = await getDatabaseHealth();
    console.log('📊 Database health:', dbHealth);

    // Create Strava client with automatic token refresh
    const stravaClient = await createStravaClient();
    
    // Get the last synced activity ID to determine starting point
    const lastActivityId = await getLastActivityId();
    console.log(`📍 Last synced activity ID: ${lastActivityId || 'none'}`);

    let newActivities;
    
    if (lastActivityId) {
      // Incremental sync: get activities newer than the last synced one
      newActivities = await stravaClient.getActivitiesSinceId(lastActivityId);
    } else {
      // Initial sync: get last 30 days of activities
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      newActivities = await stravaClient.getAllRunsInDateRange(thirtyDaysAgo);
    }

    console.log(`📊 Found ${newActivities.length} new activities to sync`);

    if (newActivities.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new activities to sync',
        syncedCount: 0,
        lastActivityId,
        dbHealth
      });
    }

    // Batch upsert the new activities
    const syncedCount = await batchUpsertStravaRuns(newActivities);
    
    // Get updated database health
    const updatedDbHealth = await getDatabaseHealth();

    console.log(`✅ Strava sync completed: ${syncedCount} activities processed`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} activities`,
      syncedCount,
      newActivitiesFound: newActivities.length,
      lastActivityId,
      dbHealthBefore: dbHealth,
      dbHealthAfter: updatedDbHealth,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Strava sync cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      failedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for manual testing and status checking
export async function GET() {
  try {
    const dbHealth = await getDatabaseHealth();
    
    return NextResponse.json({
      status: 'Strava sync cron endpoint is active',
      lastCronRun: process.env.NODE_ENV === 'development' ? 'Manual check' : 'See Vercel logs',
      databaseHealth: dbHealth,
      endpoints: {
        cronSync: 'POST /api/cron/strava-sync (requires CRON_SECRET)',
        manualSync: 'POST /api/strava/sync (requires authentication)',
        data: 'GET /api/astoria-conquest'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
