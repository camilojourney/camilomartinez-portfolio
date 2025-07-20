import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export async function GET() {
    try {
        const result = await sql`
            SELECT
                'whoop_users' as table_name,
                COUNT(*) as count
            FROM whoop_users
            UNION ALL
            SELECT
                'whoop_cycles' as table_name,
                COUNT(*) as count
            FROM whoop_cycles
            UNION ALL
            SELECT
                'whoop_sleep' as table_name,
                COUNT(*) as count
            FROM whoop_sleep
            UNION ALL
            SELECT
                'whoop_recovery' as table_name,
                COUNT(*) as count
            FROM whoop_recovery
            UNION ALL
            SELECT
                'whoop_workouts' as table_name,
                COUNT(*) as count
            FROM whoop_workouts
            ORDER BY table_name;
        `;

        return NextResponse.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database check error:', error);
        return NextResponse.json({
            error: 'Failed to check database',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
