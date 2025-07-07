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

            // Get the user's last sync information
            const userSyncResult = await client.query(`
                SELECT
                    MAX(c.created_at) as last_cycle_sync,
                    MAX(s.created_at) as last_sleep_sync,
                    MAX(r.created_at) as last_recovery_sync,
                    COUNT(c.id) as total_cycles,
                    COUNT(s.id) as total_sleep,
                    COUNT(r.id) as total_recovery
                FROM whoop_users u
                LEFT JOIN whoop_cycles c ON u.user_id = c.user_id
                LEFT JOIN whoop_sleep s ON u.user_id = s.user_id
                LEFT JOIN whoop_recovery r ON u.user_id = r.user_id
                WHERE u.user_id = $1
                GROUP BY u.user_id
            `, [user_id]);

            // Get the latest automatic sync log
            const syncLogResult = await client.query(`
                SELECT sync_date, status, details, created_at
                FROM whoop_sync_logs
                ORDER BY sync_date DESC
                LIMIT 1
            `);

            const userSync = userSyncResult.rows[0];
            const latestSyncLog = syncLogResult.rows[0];

            // Calculate if user needs sync (last activity > 24 hours ago)
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const lastActivity = userSync ? new Date(Math.max(
                new Date(userSync.last_cycle_sync || 0).getTime(),
                new Date(userSync.last_sleep_sync || 0).getTime(),
                new Date(userSync.last_recovery_sync || 0).getTime()
            )) : null;

            const needsSync = !lastActivity || lastActivity < oneDayAgo;

            return NextResponse.json({
                user_sync: {
                    last_cycle_sync: userSync?.last_cycle_sync,
                    last_sleep_sync: userSync?.last_sleep_sync,
                    last_recovery_sync: userSync?.last_recovery_sync,
                    total_cycles: parseInt(userSync?.total_cycles || '0'),
                    total_sleep: parseInt(userSync?.total_sleep || '0'),
                    total_recovery: parseInt(userSync?.total_recovery || '0'),
                    last_activity: lastActivity?.toISOString(),
                    needs_sync: needsSync
                },
                automatic_sync: {
                    last_check: latestSyncLog?.created_at,
                    status: latestSyncLog?.status,
                    next_scheduled: '14:00 UTC daily',
                    details: latestSyncLog?.details
                },
                recommendations: needsSync ? [
                    'Your data is more than 24 hours old',
                    'Click "Run Daily Collection" to get the latest data',
                    'The system automatically checks for sync needs at 2 PM UTC daily'
                ] : [
                    'Your data is up to date',
                    'Daily automatic checks are running at 2 PM UTC',
                    'You can manually sync anytime using the buttons above'
                ]
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error getting sync status:', error);
        return NextResponse.json(
            { error: 'Failed to get sync status', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
