// 📂 src/app/api/cron/strava-weekly-sync/route.ts
/**
 * Weekly Strava data synchronization cron job
 * Triggered every Monday at 1 PM to fetch new running activities from the past week
 */

import { NextRequest, NextResponse } from 'next/server';
import { StravaDataSyncCoordinator } from '@/lib/services/strava-data-sync';
import { requestMatchesAnySecret } from '@/lib/security/route-auth';

export async function POST(request: NextRequest) {
  try {
    const expected = process.env.STRAVA_CRON_SECRET || process.env.CRON_SECRET;
    
    if (process.env.NODE_ENV !== 'development') {
      if (!expected) {
        return NextResponse.json({ error: 'STRAVA_CRON_SECRET or CRON_SECRET must be configured' }, { status: 500 });
      }

      const authorized = requestMatchesAnySecret(request, [expected], { allowQuerySecret: true });
      if (!authorized) {
        console.error('❌ Unauthorized weekly sync cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Dry run: validate wiring without heavy work
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    if (dryRun) {
      return NextResponse.json({ 
        ok: true, 
        endpoint: 'strava-weekly-sync', 
        dryRun: true, 
        schedule: 'Every Monday at 1 PM',
        timestamp: new Date().toISOString() 
      });
    }

    console.log('🗓️ Starting weekly Strava sync cron job...');
    const startTime = new Date();
    
    // Initialize the sync coordinator
    const syncCoordinator = new StravaDataSyncCoordinator();
    
    // Run weekly sync for all users
    const results = await syncCoordinator.runWeeklySyncForAllUsers();
    
    const endTime = new Date();
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    console.log(`✅ Weekly Strava sync completed in ${durationSeconds}s`);

    return NextResponse.json({
      success: true,
      type: 'weekly-sync',
      totalUsers: results.length,
      totalActivitiesImported: results.reduce((sum, r) => sum + r.successfulImports, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      results: results,
      scheduledBy: 'vercel-cron',
      syncedAt: endTime.toISOString(),
      durationSeconds
    });

  } catch (error) {
    console.error('❌ Weekly Strava sync cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      type: 'weekly-sync',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      failedAt: new Date().toISOString(),
      scheduledBy: 'vercel-cron'
    }, { status: 500 });
  }
}

// GET endpoint for manual testing and status checking
export async function GET() {
  try {
    return NextResponse.json({
      status: 'Weekly Strava sync cron endpoint is active',
      schedule: 'Every Monday at 1 PM (0 13 * * 1)',
      lastCronRun: process.env.NODE_ENV === 'development' ? 'Manual check' : 'See Vercel logs',
      endpoints: {
        weeklySync: 'POST /api/cron/strava-weekly-sync (requires STRAVA_CRON_SECRET)',
        manualWeeklySync: 'POST /api/strava/sync/weekly (requires authentication)',
        historicalSync: 'POST /api/strava/sync/historical (requires authentication)',
        syncStatus: 'GET /api/strava/sync-status'
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
