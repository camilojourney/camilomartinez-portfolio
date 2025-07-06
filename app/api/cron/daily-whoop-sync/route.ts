import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Cron secret for security
const CRON_SECRET = process.env.CRON_SECRET || 'whoop_daily_sync_2024_secure_key_x7mQ9pR3nF8vK2jL';

export async function POST(request: NextRequest) {
    try {
        // Verify the cron request is authorized
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            console.log('Unauthorized cron request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🕐 Daily WHOOP sync started at', new Date().toISOString());
        console.log('🌍 Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

        const client = await pool.connect();
        const results = {
            totalUsers: 0,
            notificationsSent: 0,
            errors: [] as string[]
        };

        try {
            // Get all users who have WHOOP data
            const usersResult = await client.query(`
                SELECT DISTINCT u.user_id, u.email, u.first_name, u.last_name,
                       COUNT(c.id) as total_cycles,
                       MAX(c.created_at) as last_sync
                FROM whoop_users u
                LEFT JOIN whoop_cycles c ON u.user_id = c.user_id
                WHERE u.user_id IS NOT NULL
                GROUP BY u.user_id, u.email, u.first_name, u.last_name
                ORDER BY u.user_id
            `);

            results.totalUsers = usersResult.rows.length;
            console.log(`📊 Found ${results.totalUsers} users with WHOOP data`);

            for (const user of usersResult.rows) {
                console.log(`👤 User ${user.user_id} (${user.email}): ${user.total_cycles} cycles, last sync: ${user.last_sync}`);

                // Check if user has synced in the last 2 days
                const lastSync = user.last_sync ? new Date(user.last_sync) : null;
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

                if (!lastSync || lastSync < twoDaysAgo) {
                    console.log(`⚠️  User ${user.user_id} needs data sync (last sync: ${lastSync})`);
                }
            }

            // Log the cron execution
            await client.query(`
                INSERT INTO whoop_sync_logs (sync_date, total_users, status, details)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (sync_date) DO UPDATE SET
                total_users = EXCLUDED.total_users,
                status = EXCLUDED.status,
                details = EXCLUDED.details,
                updated_at = CURRENT_TIMESTAMP
            `, [
                new Date().toISOString().split('T')[0], // Just the date part
                results.totalUsers,
                'completed',
                JSON.stringify({
                    executedAt: new Date().toISOString(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    users: usersResult.rows.map(u => ({
                        user_id: u.user_id,
                        email: u.email,
                        total_cycles: u.total_cycles,
                        last_sync: u.last_sync
                    }))
                })
            ]);

            console.log('✅ Daily WHOOP sync cron completed successfully');

            return NextResponse.json({
                success: true,
                message: 'Daily WHOOP sync cron executed successfully',
                timestamp: new Date().toISOString(),
                results,
                instructions: {
                    for_users: 'Visit /whoop-dashboard to manually sync your latest data',
                    next_automatic_sync: 'Tomorrow at 2:00 PM UTC'
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Daily WHOOP sync error:', error);

        // Log the error
        try {
            const client = await pool.connect();
            await client.query(`
                INSERT INTO whoop_sync_logs (sync_date, total_users, status, details)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (sync_date) DO UPDATE SET
                status = EXCLUDED.status,
                details = EXCLUDED.details,
                updated_at = CURRENT_TIMESTAMP
            `, [
                new Date().toISOString().split('T')[0],
                0,
                'failed',
                JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error',
                    executedAt: new Date().toISOString()
                })
            ]);
            client.release();
        } catch (logError) {
            console.error('Failed to log sync error:', logError);
        }

        return NextResponse.json(
            {
                error: 'Daily sync failed',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

// Create the sync logs table if it doesn't exist
async function ensureSyncLogsTable() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS whoop_sync_logs (
                id SERIAL PRIMARY KEY,
                sync_date DATE UNIQUE,
                total_users INTEGER DEFAULT 0,
                successful_syncs INTEGER DEFAULT 0,
                failed_syncs INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending',
                details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_whoop_sync_logs_date ON whoop_sync_logs(sync_date);
            CREATE INDEX IF NOT EXISTS idx_whoop_sync_logs_status ON whoop_sync_logs(status);
        `);
        console.log('📋 Sync logs table ensured');
    } catch (error) {
        console.error('Failed to create sync logs table:', error);
    } finally {
        client.release();
    }
}

// Initialize table on module load
ensureSyncLogsTable().catch(console.error);
