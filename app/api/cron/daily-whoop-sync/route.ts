import { NextResponse } from 'next/server';
import { WhoopV2Client } from '../../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../../lib/whoop-database';
import { sql } from '../../../../lib/db';

// This function will fetch the user's account details directly from the database
// as there is no active session during a cron job.
async function getAccountForSync(userId: string) {
    const { rows } = await sql`
        SELECT id, provider, access_token, refresh_token, expires_at
        FROM accounts
        WHERE "userId" = ${userId} AND provider = 'whoop'
        LIMIT 1;
    `;
    return rows[0] || null;
}

// This function will update the tokens in the database after a successful refresh
async function updateAccountTokens(accountId: string, newTokens: { access_token: string; refresh_token?: string; expires_in: number }) {
    const newExpiresAt = Math.floor(Date.now() / 1000) + newTokens.expires_in;

    if (newTokens.refresh_token) {
        // If a new refresh token is provided, update all token fields
        await sql`
            UPDATE accounts
            SET
                access_token = ${newTokens.access_token},
                refresh_token = ${newTokens.refresh_token},
                expires_at = ${newExpiresAt}
            WHERE id = ${accountId};
        `;
    } else {
        // If no new refresh token is provided, only update the access token and expiry
        await sql`
            UPDATE accounts
            SET
                access_token = ${newTokens.access_token},
                expires_at = ${newExpiresAt}
            WHERE id = ${accountId};
        `;
    }
}

export async function GET(request: Request) {
    // 1. Secure the endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // IMPORTANT: Ensure WHOOP_USER_ID_TO_SYNC is set in your Vercel environment variables
    const userIdToSync = process.env.WHOOP_USER_ID_TO_SYNC;
    if (!userIdToSync) {
        console.error('CRON ERROR: WHOOP_USER_ID_TO_SYNC environment variable is not set.');
        return new NextResponse('Configuration error: User ID for sync is not set.', { status: 500 });
    }

    try {
        console.log(`[CRON] Starting daily sync for user ID: ${userIdToSync}`);
        const account = await getAccountForSync(userIdToSync);

        if (!account) {
            throw new Error(`[CRON] No WHOOP account found for user ID: ${userIdToSync}`);
        }

        let currentAccessToken = account.access_token;

        // 2. Refresh token if it's expired
        const isTokenExpired = !account.expires_at || Date.now() > account.expires_at * 1000;
        if (isTokenExpired) {
            console.log('[CRON] Access token expired. Refreshing...');
            if (!account.refresh_token) {
                throw new Error('[CRON] No refresh token available. Cannot refresh.');
            }

            const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: account.refresh_token,
                    client_id: process.env.WHOOP_CLIENT_ID!,
                    client_secret: process.env.WHOOP_CLIENT_SECRET!,
                }),
            });

            const refreshedTokens = await response.json();
            if (!response.ok) {
                throw new Error(`[CRON] Failed to refresh token: ${JSON.stringify(refreshedTokens)}`);
            }

            await updateAccountTokens(account.id, refreshedTokens);
            console.log('[CRON] Tokens refreshed and saved to database.');
            currentAccessToken = refreshedTokens.access_token;
        } else {
            console.log('[CRON] Access token is still valid.');
        }

        if (!currentAccessToken) {
            throw new Error('[CRON] No valid access token available to fetch data.');
        }

        // 3. Initialize clients with the valid token
        const whoopClient = new WhoopV2Client(currentAccessToken);
        const dbService = new WhoopDatabaseService();

        // 4. Set the date range for the daily sync (last 3 days to catch updates)
        const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        console.log(`[CRON] Fetching data since: ${startDate}`);

        // 5. Execute data collection in the correct order
        // STEP 1: Sleep
        const sleepData = await whoopClient.getAllSleep(startDate);
        if (sleepData.length > 0) {
            await dbService.upsertSleeps(sleepData);
            console.log(`[CRON] Synced ${sleepData.length} sleep records.`);
        }

        // STEP 2: Cycles (derived from sleeps)
        const cycleIds = [...new Set(sleepData.map(s => s.cycle_id))];
        const cycles = [];
        for (const cycleId of cycleIds) {
            try {
                const cycle = await whoopClient.getCycleById(cycleId);
                cycles.push(cycle);
            } catch (error) {
                console.warn(`[CRON] Could not fetch details for cycle ${cycleId}. Skipping.`);
            }
        }
        if (cycles.length > 0) {
            await dbService.upsertCycles(cycles);
            console.log(`[CRON] Synced ${cycles.length} cycle records.`);
        }

        // STEP 3: Recovery
        const recoveryData = await whoopClient.getAllRecovery(startDate);
        if (recoveryData.length > 0) {
            const { newRecoveryCount } = await dbService.upsertRecoveries(recoveryData);
            console.log(`[CRON] Synced ${newRecoveryCount} recovery records.`);
        }

        // STEP 4: Workouts
        const workouts = await whoopClient.getAllWorkouts(startDate);
        if (workouts.length > 0) {
            await dbService.upsertWorkouts(workouts);
            console.log(`[CRON] Synced ${workouts.length} workout records.`);
        }

        console.log('[CRON] Daily sync completed successfully!');
        return NextResponse.json({ success: true, message: 'Daily sync completed.' });

    } catch (error) {
        console.error('[CRON] An error occurred during the daily sync:', error);
        return new NextResponse('Cron job failed.', { status: 500 });
    }
}
