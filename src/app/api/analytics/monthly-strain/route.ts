import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';
import { DashboardMonthlyStrainData } from '@/types/whoop';

export async function GET() {
    try {
        // Get monthly strain averages for the last 12 months
        const monthlyStrainData = await sql`
            SELECT 
                TO_CHAR(start_time, 'YYYY-MM') AS month,
                ROUND(AVG(strain), 2) AS average_strain,
                COUNT(*) AS days_count
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            AND start_time >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY TO_CHAR(start_time, 'YYYY-MM')
            ORDER BY month ASC
        `;

        const result: DashboardMonthlyStrainData[] = monthlyStrainData.rows.map(row => ({
            month: row.month,
            average_strain: parseFloat(row.average_strain) || 0,
            days_count: parseInt(row.days_count) || 0
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching monthly strain data:', error);
        return NextResponse.json({
            error: 'Failed to fetch monthly strain data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}