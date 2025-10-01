import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';
import { DashboardStrainRecoveryData } from '@/types/whoop';

export async function GET() {
    try {
        // Get strain vs recovery data for the last 90 days
        const strainRecoveryData = await sql`
            SELECT 
                TO_CHAR(c.start_time, 'YYYY-MM-DD') AS strain_date,
                c.strain,
                r.recovery_percentage AS recovery_score
            FROM whoop_cycles c
            LEFT JOIN whoop_recovery r ON c.id = r.cycle_id
            WHERE c.strain IS NOT NULL
            AND r.recovery_percentage IS NOT NULL
            AND c.start_time >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY c.start_time ASC
        `;

        const result: DashboardStrainRecoveryData[] = strainRecoveryData.rows.map(row => ({
            strain_date: row.strain_date,
            strain: parseFloat(row.strain) || 0,
            recovery_score: parseFloat(row.recovery_score) || 0
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching strain vs recovery data:', error);
        return NextResponse.json({
            error: 'Failed to fetch strain vs recovery data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}