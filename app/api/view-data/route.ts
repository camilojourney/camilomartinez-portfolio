import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { Pool } from 'pg';

// Initialize PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();

        try {
            // Get user_id from the session - it's stored in session.user.id
            const user_id = session.user?.id;

            if (!user_id) {
                return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
            }

            // Fetch recent data (last 30 days for analytics)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Fetch cycles
            const cyclesResult = await client.query(`
                SELECT * FROM whoop_cycles
                WHERE user_id = $1 AND created_at >= $2
                ORDER BY created_at DESC
            `, [user_id, thirtyDaysAgo.toISOString()]);

            // Fetch sleep data
            const sleepResult = await client.query(`
                SELECT * FROM whoop_sleep
                WHERE user_id = $1 AND created_at >= $2
                ORDER BY created_at DESC
            `, [user_id, thirtyDaysAgo.toISOString()]);

            // Fetch recovery data
            const recoveryResult = await client.query(`
                SELECT * FROM whoop_recovery
                WHERE user_id = $1 AND created_at >= $2
                ORDER BY created_at DESC
            `, [user_id, thirtyDaysAgo.toISOString()]);

            // Fetch workouts
            const workoutsResult = await client.query(`
                SELECT * FROM whoop_workouts
                WHERE user_id = $1 AND created_at >= $2
                ORDER BY created_at DESC
            `, [user_id, thirtyDaysAgo.toISOString()]);

            // Get total counts and date ranges
            const summaryResult = await client.query(`
                SELECT
                    (SELECT COUNT(*) FROM whoop_cycles WHERE user_id = $1) as total_cycles,
                    (SELECT COUNT(*) FROM whoop_sleep WHERE user_id = $1) as total_sleep,
                    (SELECT COUNT(*) FROM whoop_recovery WHERE user_id = $1) as total_recovery,
                    (SELECT COUNT(*) FROM whoop_workouts WHERE user_id = $1) as total_workouts,
                    (SELECT MIN(created_at) FROM whoop_cycles WHERE user_id = $1) as earliest_cycle,
                    (SELECT MAX(created_at) FROM whoop_cycles WHERE user_id = $1) as latest_cycle
            `, [user_id]);

            const summary = summaryResult.rows[0];

            return NextResponse.json({
                cycles: cyclesResult.rows,
                sleep: sleepResult.rows,
                recovery: recoveryResult.rows,
                workouts: workoutsResult.rows,
                summary: {
                    totalCycles: parseInt(summary.total_cycles) || 0,
                    totalSleep: parseInt(summary.total_sleep) || 0,
                    totalRecovery: parseInt(summary.total_recovery) || 0,
                    totalWorkouts: parseInt(summary.total_workouts) || 0,
                    dateRange: {
                        earliest: summary.earliest_cycle,
                        latest: summary.latest_cycle
                    }
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error fetching WHOOP data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch WHOOP data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
