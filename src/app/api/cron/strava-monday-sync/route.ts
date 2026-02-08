// 📂 src/app/api/cron/strava-monday-sync/route.ts
/**
 * Strava Monday sync cron job
 * Syncs new Strava activities for all users
 * Triggered every Monday at 1 PM
 *
 * Note: Astoria Conquest map update runs separately on Render via its own cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { StravaDataSyncCoordinator } from '@/lib/services/strava-data-sync';
import { requestMatchesAnySecret } from '@/lib/security/route-auth';

export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

interface StravaSyncResult {
  success: boolean;
  totalUsers: number;
  totalActivitiesImported: number;
  totalErrors: number;
  durationSeconds: number;
  results?: any[];
  error?: string;
}

interface MondaySyncResponse {
  success: boolean;
  strava: StravaSyncResult;
  totalDurationSeconds: number;
  syncedAt: string;
  scheduledBy: string;
}

export async function POST(request: NextRequest) {
  const overallStartTime = new Date();

  try {
    const expected = process.env.CRON_SECRET;

    if (process.env.NODE_ENV !== 'development') {
      if (!expected) {
        return NextResponse.json({ error: 'CRON_SECRET must be configured' }, { status: 500 });
      }

      const authorized = requestMatchesAnySecret(request, [expected], { allowQuerySecret: true });
      if (!authorized) {
        console.error('❌ Unauthorized Monday sync cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Dry run: validate wiring without heavy work
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        endpoint: 'strava-monday-sync',
        dryRun: true,
        schedule: 'Every Monday at 1 PM',
        includes: ['strava-weekly-sync'],
        note: 'Astoria map update runs separately on Render via cron',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🗓️ Starting Strava Monday sync cron job...');
    console.log('📋 Task: Strava weekly sync (Astoria update handled by Render cron)');

    // ============================================
    // STRAVA WEEKLY SYNC
    // ============================================
    console.log('\n📊 Starting Strava weekly sync...');
    const stravaStartTime = new Date();
    let stravaResult: StravaSyncResult;

    try {
      const syncCoordinator = new StravaDataSyncCoordinator();
      const results = await syncCoordinator.runWeeklySyncForAllUsers();

      const stravaEndTime = new Date();
      const stravaDuration = (stravaEndTime.getTime() - stravaStartTime.getTime()) / 1000;

      stravaResult = {
        success: true,
        totalUsers: results.length,
        totalActivitiesImported: results.reduce((sum, r) => sum + r.successfulImports, 0),
        totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
        durationSeconds: stravaDuration,
        results: results
      };

      console.log(`✅ Strava sync completed in ${stravaDuration}s`);
      console.log(`   - Users synced: ${stravaResult.totalUsers}`);
      console.log(`   - Activities imported: ${stravaResult.totalActivitiesImported}`);
      console.log(`   - Errors: ${stravaResult.totalErrors}`);

    } catch (stravaError) {
      const stravaEndTime = new Date();
      const stravaDuration = (stravaEndTime.getTime() - stravaStartTime.getTime()) / 1000;

      stravaResult = {
        success: false,
        totalUsers: 0,
        totalActivitiesImported: 0,
        totalErrors: 1,
        durationSeconds: stravaDuration,
        error: stravaError instanceof Error ? stravaError.message : 'Unknown error'
      };

      console.error(`❌ Strava sync failed:`, stravaError);
    }

    // ============================================
    // FINAL RESULTS
    // ============================================
    const overallEndTime = new Date();
    const totalDuration = (overallEndTime.getTime() - overallStartTime.getTime()) / 1000;

    const response: MondaySyncResponse = {
      success: stravaResult.success,
      strava: stravaResult,
      totalDurationSeconds: totalDuration,
      syncedAt: overallEndTime.toISOString(),
      scheduledBy: 'vercel-cron'
    };

    console.log(`\n${stravaResult.success ? '✅' : '❌'} Strava sync completed in ${totalDuration}s`);
    console.log('📊 Summary:');
    console.log(`   - Strava: ${stravaResult.success ? '✅' : '❌'} (${stravaResult.durationSeconds}s)`);
    console.log(`   - Note: Astoria map update runs separately on Render`);

    return NextResponse.json(response, {
      status: stravaResult.success ? 200 : 500
    });

  } catch (error) {
    const overallEndTime = new Date();
    const totalDuration = (overallEndTime.getTime() - overallStartTime.getTime()) / 1000;

    console.error('❌ Monday sync cron job failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      totalDurationSeconds: totalDuration,
      failedAt: overallEndTime.toISOString(),
      scheduledBy: 'vercel-cron'
    }, { status: 500 });
  }
}

// GET endpoint for manual testing and status checking
export async function GET() {
  try {
    return NextResponse.json({
      status: 'Strava Monday sync cron endpoint is active',
      schedule: 'Every Monday at 1 PM (0 13 * * 1)',
      tasks: [
        {
          name: 'Strava Weekly Sync',
          description: 'Syncs new running activities from Strava for all users',
          duration: 'Typically 10-30 seconds'
        }
      ],
      note: 'Astoria Conquest map update runs separately on Render via its own cron job',
      endpoints: {
        cronEndpoint: 'POST /api/cron/strava-monday-sync (requires CRON_SECRET)',
        manualStravaSync: 'POST /api/strava/sync/weekly (requires authentication)',
        stravaSyncStatus: 'GET /api/strava/sync-status'
      },
      environment: process.env.NODE_ENV,
      isProduction: process.env.VERCEL === '1',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
