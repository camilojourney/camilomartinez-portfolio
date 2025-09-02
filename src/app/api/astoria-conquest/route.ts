// 📂 src/app/api/astoria-conquest/route.ts
/**
 * Main data endpoint for the Astoria Conquest feature
 * Provides GeoJSON data and statistics for the interactive map
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAstoriaStreetsGeoJSON, getRunsGeoJSON, getAstoriaStats, getDatabaseHealth } from '@/lib/db/strava-database';
import { AstoriaTrackerData } from '@/types/strava';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching Astoria Conquest data...');
    
    // Get query parameters for optional filtering
    const { searchParams } = new URL(request.url);
    const includeRuns = searchParams.get('includeRuns') !== 'false'; // Default to true
    const skipStats = searchParams.get('skipStats') === 'true'; // Default to false
    
    // Fetch data in parallel for better performance
    const [streetsGeoJSON, runsGeoJSON, stats] = await Promise.all([
      getAstoriaStreetsGeoJSON(),
      includeRuns ? getRunsGeoJSON() : Promise.resolve({ type: 'FeatureCollection' as const, features: [] }),
      skipStats ? Promise.resolve(null) : getAstoriaStats()
    ]);

    // Prepare response data
    const response: AstoriaTrackerData = {
      allStreetsGeoJSON: streetsGeoJSON,
      runGeometriesGeoJSON: runsGeoJSON,
      stats: stats || {
        totalStreets: 0,
        completedStreets: 0,
        partialStreets: 0,
        unvisitedStreets: 0,
        completionPercentage: 0,
        totalDistanceMeters: 0,
        completedDistanceMeters: 0,
        remainingDistanceMeters: 0,
        totalRunsCount: 0,
        totalRunningTimeSeconds: 0,
        averageRunDistanceMeters: 0,
        streetsCompletedThisMonth: 0,
        monthlyProgressPercentage: 0,
      }
    };

    // Add metadata for debugging
    const metadata = {
      streetsCount: streetsGeoJSON.features.length,
      runsCount: runsGeoJSON.features.length,
      dataFetchedAt: new Date().toISOString(),
      queryParams: {
        includeRuns,
        skipStats
      }
    };

    console.log('✅ Astoria Conquest data fetched successfully:', metadata);

    return NextResponse.json({
      ...response,
      _metadata: metadata
    });

  } catch (error) {
    console.error('❌ Error fetching Astoria Conquest data:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch Astoria Conquest data',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST endpoint for manual data refresh (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // This could be used for manual data refresh or admin operations
    // For now, just return the database health status
    
    const dbHealth = await getDatabaseHealth();
    
    return NextResponse.json({
      message: 'Astoria Conquest data refresh endpoint',
      databaseHealth: dbHealth,
      note: 'Use GET /api/astoria-conquest for data retrieval',
      refreshedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Astoria Conquest POST endpoint:', error);
    
    return NextResponse.json({
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
