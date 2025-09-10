// 📂 src/app/api/astoria-conquest/route.ts
/**
 * Main data endpoint for the Astoria Conquest feature
 * Provides basic run data and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllRuns, getSimpleStats } from '@/lib/db/strava-database';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching Astoria Conquest data...');
    
    // Get query parameters for optional filtering
    const { searchParams } = new URL(request.url);
    const includeRuns = searchParams.get('includeRuns') !== 'false'; // Default to true
    const skipStats = searchParams.get('skipStats') === 'true'; // Default to false
    
    // Fetch data in parallel for better performance
    const [runs, stats] = await Promise.all([
      includeRuns ? getAllRuns() : Promise.resolve([]),
      skipStats ? Promise.resolve(null) : getSimpleStats()
    ]);

    // Prepare response data
    const response = {
      runs: runs,
      stats: stats || {
        totalRuns: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgPace: 0,
        lastRunDate: null,
        runFrequency: 0
      },
      metadata: {
        dataType: 'astoria-conquest',
        generatedAt: new Date().toISOString(),
        runCount: runs.length,
        source: 'strava-database'
      }
    };

    console.log(`✅ Astoria data fetched: ${runs.length} runs, stats included: ${!skipStats}`);
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' // 5min cache, 10min stale
      }
    });

  } catch (error) {
    console.error('❌ Error fetching Astoria data:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch Astoria data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache' // Don't cache errors
      }
    });
  }
}
