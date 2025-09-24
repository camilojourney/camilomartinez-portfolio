// 📂 src/app/api/astoria-conquest/route.ts
/**
 * Main data endpoint for the Astoria Conquest feature
 * Provides basic run data and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { astoriaConquestServiceOptimized } from '@/lib/services/astoria-conquest-optimized';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching Astoria Conquest data...');
    
    // Get the runs with optimized processing and performance monitoring
    const data = await astoriaConquestServiceOptimized.getRunsWithDetails();
    
    // Calculate basic stats from the real data
    const totalRuns = data.runs.length;
    const totalDistance = data.runs.reduce((sum: number, run: any) => sum + run.distance_meters, 0);
    const avgSpeed = data.runs.length > 0 ? data.runs.reduce((sum: number, run: any) => sum + (run.average_speed_mps || 0), 0) / data.runs.length : 0;
    
    // Prepare response data
    const response = {
      runs: data.runs,
      mapBounds: data.mapBounds, // Include expanded bounds for map component
      originalMapBounds: data.originalMapBounds, // Original Astoria neighborhood bounds
      stats: {
        totalRuns,
        totalDistance,
        avgSpeed,
        lastRunDate: data.runs.length > 0 ? data.runs[0].start_date : null,
        runsWithWhoopData: data.runs.filter((run: any) => run.whoopData).length
      },
      metadata: {
        dataType: 'astoria-conquest',
        generatedAt: new Date().toISOString(),
        runCount: data.runs.length,
        source: 'astoria-conquest-service-optimized',
        boundsExpanded: JSON.stringify(data.mapBounds) !== JSON.stringify(data.originalMapBounds)
      },
      performance: data.performanceStats || null
    };

    console.log(`✅ Astoria data fetched: ${data.runs.length} runs with GPS coordinates and WHOOP data`);
    console.log(`🗺️ Map bounds: ${data.mapBounds ? 'expanded to include GPS data' : 'using original bounds'}`);
    
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
