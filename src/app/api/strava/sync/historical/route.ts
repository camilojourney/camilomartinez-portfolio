// 📂 src/app/api/strava/sync/historical/route.ts
/**
 * API endpoint to trigger historical data import for Strava activities
 * This is typically a one-time operation for new users or full re-sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { historicalDataImporter } from '@/lib/services/strava-data-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    console.log(`🚀 Starting historical import ${userId ? `for user ${userId}` : 'for all users'}...`);

    // Store progress updates in memory for this request
    const progressUpdates: any[] = [];
    
    const onProgress = (progress: any) => {
      progressUpdates.push({
        ...progress,
        timestamp: new Date().toISOString(),
      });
      console.log(`📊 Progress: User ${progress.userId} - ${progress.processedActivities}/${progress.totalActivities} (${progress.successfulImports} imported)`);
    };

    const options = {
      maxActivitiesPerBatch: 20,
      delayBetweenBatches: 1500, // Be conservative with API rate limits
      onProgress,
    };

    let results;
    const startTime = Date.now();

    if (userId) {
      // Import for specific user
      const result = await historicalDataImporter.importUserHistoricalData(parseInt(userId), options);
      results = [result];
    } else {
      // Import for all users
      results = await historicalDataImporter.importAllUsersHistoricalData(options);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Calculate summary statistics
    const totalImported = results.reduce((sum, r) => sum + r.successfulImports, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalProcessed = results.reduce((sum, r) => sum + r.totalActivities, 0);
    const successfulUsers = results.filter(r => r.status === 'completed').length;

    console.log(`✅ Historical import completed: ${totalImported}/${totalProcessed} activities imported in ${duration}s`);

    return NextResponse.json({
      status: 'success',
      data: {
        summary: {
          totalActivitiesProcessed: totalProcessed,
          totalActivitiesImported: totalImported,
          totalErrors: totalErrors,
          successfulUsers: successfulUsers,
          failedUsers: results.length - successfulUsers,
          durationSeconds: duration,
          averageRate: totalImported > 0 ? Math.round(totalImported / (duration / 60)) : 0, // activities per minute
        },
        results: results.map(r => ({
          userId: r.userId,
          status: r.status,
          totalActivities: r.totalActivities,
          successfulImports: r.successfulImports,
          errorCount: r.errors.length,
          startTime: r.startTime,
          endTime: r.endTime,
          // Include first few errors for debugging
          errors: r.errors.slice(0, 3),
        })),
        progressUpdates: progressUpdates.slice(-10), // Last 10 progress updates
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Historical import failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        error: {
          message: 'Historical import failed',
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
    message: 'Use POST to trigger historical import',
    usage: {
      endpoint: '/api/strava/sync/historical',
      method: 'POST',
      body: {
        userId: 'optional - specific user ID to import, omit for all users',
      },
      examples: [
        'POST /api/strava/sync/historical (import all users)',
        'POST /api/strava/sync/historical {"userId": 12345} (import specific user)',
      ],
    },
  });
}
