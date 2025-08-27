import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';

export async function GET() {
    try {
        // Get recent data from each table
        const users = await sql`SELECT COUNT(*) as count FROM whoop_users`;
        const cycles = await sql`SELECT COUNT(*) as count FROM whoop_cycles`;
        const sleep = await sql`SELECT COUNT(*) as count FROM whoop_sleep`;
        const recovery = await sql`SELECT COUNT(*) as count FROM whoop_recovery`;
        const workouts = await sql`SELECT COUNT(*) as count FROM whoop_workouts`;

        // Get recent records with correct column names
        const recentCycles = await sql`
            SELECT id, start_time, end_time, strain,
                   TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date
            FROM whoop_cycles
            ORDER BY start_time DESC
            LIMIT 10
        `;

        const recentRecovery = await sql`
            SELECT cycle_id, recovery_score
            FROM whoop_recovery
            ORDER BY cycle_id DESC
            LIMIT 10;
        `;

        const recentSleep = await sql`
            SELECT id, start_time, end_time, sleep_performance_percentage
            FROM whoop_sleep
            ORDER BY start_time DESC
            LIMIT 10;
        `;

        const recentWorkouts = await sql`
            SELECT id, start_time, end_time, sport_name, strain
            FROM whoop_workouts
            ORDER BY start_time DESC
            LIMIT 10;
        `;

        // Get the most recent dates to check data freshness
        const latestDate = await sql`
            SELECT MAX(start_time) as latest_cycle_date
            FROM whoop_cycles
        `;

        // Get strain data for recent month to verify August data
        const strainData = await sql`
            SELECT
                TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date,
                strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            AND start_time >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            ORDER BY start_time DESC
        `;

        return NextResponse.json({
            success: true,
            counts: {
                users: parseInt(users.rows[0]?.count) || 0,
                cycles: parseInt(cycles.rows[0]?.count) || 0,
                sleep: parseInt(sleep.rows[0]?.count) || 0,
                recovery: parseInt(recovery.rows[0]?.count) || 0,
                workouts: parseInt(workouts.rows[0]?.count) || 0
            },
            recent: {
                cycles: recentCycles.rows,
                recovery: recentRecovery.rows,
                sleep: recentSleep.rows,
                workouts: recentWorkouts.rows
            },
            latest_date: latestDate.rows[0]?.latest_cycle_date,
            strain: strainData.rows,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('View data error:', error);
        return NextResponse.json({
            error: 'Failed to view data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
