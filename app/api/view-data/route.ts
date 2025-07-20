import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export async function GET() {
    try {
        // Get recent data from each table
        const users = await sql`SELECT COUNT(*) as count FROM whoop_users`;
        const cycles = await sql`SELECT COUNT(*) as count FROM whoop_cycles`;
        const sleep = await sql`SELECT COUNT(*) as count FROM whoop_sleep`;
        const recovery = await sql`SELECT COUNT(*) as count FROM whoop_recovery`;
        const workouts = await sql`SELECT COUNT(*) as count FROM whoop_workouts`;

        // Get recent records
        const recentCycles = await sql`
            SELECT id, start_time, end_time, strain
            FROM whoop_cycles
            ORDER BY start_time DESC
            LIMIT 5
        `;

        const recentSleep = await sql`
            SELECT id, start_time, end_time, sleep_performance_percentage
            FROM whoop_sleep
            ORDER BY start_time DESC
            LIMIT 5
        `;

        return NextResponse.json({
            success: true,
            counts: {
                users: users[0]?.count || 0,
                cycles: cycles[0]?.count || 0,
                sleep: sleep[0]?.count || 0,
                recovery: recovery[0]?.count || 0,
                workouts: workouts[0]?.count || 0
            },
            recent: {
                cycles: recentCycles,
                sleep: recentSleep
            },
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
