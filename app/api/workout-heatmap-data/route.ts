import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
    try {
        // Get all cycle data (daily strain) for the heatmap (no authentication required)
        const result = await sql`
            SELECT
                id,
                start_time,
                strain,
                kilojoule,
                average_heart_rate,
                max_heart_rate,
                0 as sport_id
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            ORDER BY start_time DESC
        `;

        // Get summary stats from cycles
        const summary = await sql`
            SELECT
                COUNT(*) as total_cycles,
                MIN(start_time) as earliest_cycle,
                MAX(start_time) as latest_cycle,
                AVG(strain) as avg_strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
        `;

        return NextResponse.json({
            workouts: result.rows,
            summary: summary.rows[0],
            success: true
        });

    } catch (error) {
        console.error('Error fetching cycle data:', error);
        return NextResponse.json({
            error: 'Failed to fetch cycle data',
            workouts: [],
            summary: null,
            success: false
        }, { status: 500 });
    }
}
