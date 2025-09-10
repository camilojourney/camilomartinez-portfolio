// 📂 src/app/api/strava/sync/weekly/route.ts
/**
 * API endpoint to trigger weekly sync of new Strava activities
 * This is designed to be called by cron jobs or manual triggers
 */

import { NextRequest, NextResponse } from 'next/server';
import { weeklySyncService } from '@/lib/services/strava-data-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    console.log(`🔄 Starting weekly sync ${userId ? `for user ${userId}` : 'for all users'}...`);

    // Store progress updates in memory for this request
    const progressUpdates: any[] = [];
    
    const onProgress = (progress: any) => {
      progressUpdates.push({
        ...progress,
        timestamp: new Date().toISOString(),
      });
      
      if (progress.totalActivities === 0) {
        console.log(`👤 User ${progress.userId}: No new activities to sync`);
      } else {
        console.log(`👤 User ${progress.userId}: ${progress.successfulImports}/${progress.totalActivities} new activities synced`);
      }
    };

    const options = {
      maxActivitiesPerBatch: 50, // Weekly sync can be more aggressive
      delayBetweenBatches: 500,
      onProgress,
    };

    let results;
    const startTime = Date.now();

    if (userId) {
      // Sync for specific user
      const result = await weeklySyncService.syncUserNewActivities(parseInt(userId), options);
      results = [result];
    } else {
      // Sync for all users
      results = await weeklySyncService.syncAllUsersNewActivities(options);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Calculate summary statistics
    const totalSynced = results.reduce((sum, r) => sum + r.successfulImports, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalNewActivities = results.reduce((sum, r) => sum + r.totalActivities, 0);
    const successfulUsers = results.filter(r => r.status === 'completed').length;
    const usersWithNewActivities = results.filter(r => r.totalActivities > 0).length;

    console.log(`✅ Weekly sync completed: ${totalSynced}/${totalNewActivities} new activities synced in ${duration}s`);

    return NextResponse.json({
      status: 'success',
      data: {
        summary: {
          totalNewActivitiesFound: totalNewActivities,
          totalActivitiesSynced: totalSynced,
          totalErrors: totalErrors,
          usersChecked: results.length,
          usersWithNewActivities: usersWithNewActivities,
          successfulUsers: successfulUsers,
          failedUsers: results.length - successfulUsers,
          durationSeconds: duration,
          averageRate: totalSynced > 0 ? Math.round(totalSynced / (duration / 60)) : 0, // activities per minute
        },
        results: results
          .filter(r => r.totalActivities > 0 || r.errors.length > 0) // Only show users with updates or errors
          .map(r => ({
            userId: r.userId,
            status: r.status,
            totalNewActivities: r.totalActivities,
            successfulSyncs: r.successfulImports,
            errorCount: r.errors.length,
            startTime: r.startTime,
            endTime: r.endTime,
            // Include errors for debugging
            errors: r.errors,
          })),
        progressUpdates: progressUpdates.slice(-10), // Last 10 progress updates
        nextRecommendedSync: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Weekly sync failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        error: {
          message: 'Weekly sync failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'info',
    message: 'Use POST to trigger weekly sync',
    usage: {
      endpoint: '/api/strava/sync/weekly',
      method: 'POST',
      body: {
        userId: 'optional - specific user ID to sync, omit for all users',
      },
      examples: [
        'POST /api/strava/sync/weekly (sync all users)',
        'POST /api/strava/sync/weekly {"userId": 12345} (sync specific user)',
      ],
      scheduling: {
        recommended: 'Weekly (every Monday at 6 AM)',
        cronJob: '0 6 * * 1',
        manual: 'Call this endpoint or use scripts/data/strava-weekly-sync.js',
      },
    },
  });
}
