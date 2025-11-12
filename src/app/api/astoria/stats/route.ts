import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * API Route: Serve Astoria progress statistics
 * 
 * This endpoint serves your Astoria Conquest progress stats including:
 * - Total miles covered vs total miles
 * - Number of segments covered
 * - List of all runs with details
 * - Last update timestamp
 * 
 * Updated weekly along with the map data.
 */
export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'data',
      'astoria-conquest',
      'astoria-progress-stats.json'
    );

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const statsData = JSON.parse(fileContent);

    return NextResponse.json(statsData, {
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 hour, revalidate in background for 24 hours
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error loading stats:', error);
    return NextResponse.json(
      { error: 'Failed to load statistics data' },
      { status: 500 }
    );
  }
}
