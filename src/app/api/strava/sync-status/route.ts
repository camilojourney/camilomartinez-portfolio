// 📂 src/app/api/strava/sync-status/route.ts
/**
 * API endpoint to get Strava data sync status
 * Shows current sync statistics and whether historical import is needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { stravaDataSyncCoordinator } from '@/lib/services/strava-data-sync';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Getting Strava sync status...');

    const syncStatus = await stravaDataSyncCoordinator.getSyncStatus();
    
    // Calculate additional metrics
    const averageRunsPerUser = syncStatus.totalUsers > 0 
      ? Math.round(syncStatus.totalRuns / syncStatus.totalUsers)
      : 0;

    const response = {
      status: 'success',
      data: {
        ...syncStatus,
        averageRunsPerUser,
        recommendations: {
          needsHistoricalImport: syncStatus.needsHistoricalImport,
          nextWeeklySync: syncStatus.lastSyncDate 
            ? new Date(syncStatus.lastSyncDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            : new Date(),
          actions: syncStatus.needsHistoricalImport 
            ? ['Run historical import first', 'Set up weekly sync schedule']
            : ['Continue weekly sync schedule', 'Monitor for new users']
        }
      },
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Sync status retrieved: ${syncStatus.totalRuns} runs, ${syncStatus.totalUsers} users`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        error: {
          message: 'Failed to get sync status',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
