import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';
import { DashboardStrainData } from '@/types/whoop';

export async function GET() {
    try {
        // Get daily strain data for the last 90 days
        const strainData = await sql`
            SELECT 
                TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date,
                strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            AND start_time >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY start_time ASC
        `;

        const result: DashboardStrainData[] = strainData.rows.map(row => ({
            formatted_date: row.formatted_date,
            strain: parseFloat(row.strain) || 0
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching strain data:', error);
        return NextResponse.json({
            error: 'Failed to fetch strain data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}