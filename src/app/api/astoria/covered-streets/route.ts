import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * API Route: Serve Astoria covered streets GeoJSON
 * 
 * This endpoint serves the streets you've covered in your Astoria conquest.
 * Updated weekly when new Strava runs are processed.
 * 
 * By serving via API instead of bundling, we keep the bundle size small
 * while still providing fresh data on each page visit.
 */
export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'data',
      'astoria-conquest',
      'astoria-covered-streets.geojson'
    );

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const geoJsonData = JSON.parse(fileContent);

    return NextResponse.json(geoJsonData, {
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 hour, revalidate in background for 24 hours
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error loading covered streets:', error);
    return NextResponse.json(
      { error: 'Failed to load covered streets data' },
      { status: 500 }
    );
  }
}
