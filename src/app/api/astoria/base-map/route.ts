import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * API Route: Serve Astoria base map GeoJSON
 *
 * This endpoint serves the complete Astoria street network that acts as the
 * background layer for the conquest map. By serving via API instead of bundling,
 * we reduce the JavaScript bundle size by ~1 MB.
 *
 * The file is generated weekly by the backend Python script and committed to git.
 */
export async function GET() {
    try {
        const filePath = path.join(
            process.cwd(),
            'public',
            'data',
            'astoria-conquest',
            'astoria-base-map.geojson'
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
        console.error('Error loading base map:', error);
        return NextResponse.json(
            { error: 'Failed to load base map data' },
            { status: 500 }
        );
    }
}
