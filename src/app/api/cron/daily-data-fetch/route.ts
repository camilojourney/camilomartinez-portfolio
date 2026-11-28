import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';
import { WhoopV2Client } from '@/lib/whoop';
import { WhoopDatabaseService } from '@/lib/db/whoop-database';
import { TokenRefreshService } from '@/lib/services/token-refresh-service';
import { endOfYesterday, finishedRecords, parseSince, syncWindowStart } from '@/lib/services/whoop-daily-sync';

// The run that follows an outage reads every missed day, which takes longer than a daily run.
export const maxDuration = 300;

interface UserResult {
    userId: number;
    userName: string;
    /** Where this run started reading. */
    from: string;
    newCycles: number;
    newSleep: number;
    newRecovery: number;
    newWorkouts: number;
    /** Recoveries left for a later run because their cycle has not finished. */
    waiting: number;
}

function isAuthorized(req: Request): boolean {
    const url = new URL(req.url);
    const headerSecret = req.headers.get('x-cron-secret');
    const querySecret = url.searchParams.get('secret') || url.searchParams.get('token');
    const expected = process.env.CRON_SECRET;
    return !!expected && (headerSecret === expected || querySecret === expected);
}

async function handleDailyFetch(request: Request) {
    // Secure the endpoint (via header or query param)
    if (!isAuthorized(request)) {
        console.error('[DAILY-FETCH] Authorization failed');
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // Dry run: validate wiring without heavy work
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    if (dryRun) {
        return NextResponse.json({ ok: true, endpoint: 'daily-data-fetch', dryRun: true, timestamp: new Date().toISOString() });
    }

    const now = new Date();
    const asked = url.searchParams.get('since');
    const since = asked === null ? null : parseSince(asked, now);
    if (asked !== null && !since) {
        return NextResponse.json({
            success: false,
            error: 'since must be a day that has begun, written YYYY-MM-DD'
        }, { status: 400 });
    }

    try {
        const results = await fetchAllUsers(now, since);
        const refreshWarning = await refreshViews();

        // A user whose data was not stored fails the request, so the scheduled job
        // that called it fails too and the failure is seen.
        const success = results.failedUsers === 0;
        return NextResponse.json({
            success,
            data: results,
            refreshWarning,
            timestamp: new Date().toISOString()
        }, { status: success ? 200 : 500 });

    } catch (error) {
        console.error('[DAILY-FETCH] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    return handleDailyFetch(request);
}

export async function GET(request: Request) {
    return handleDailyFetch(request);
}

async function fetchAllUsers(now: Date, since: Date | null) {
    const dbService = new WhoopDatabaseService();

    // Refresh every user's token first (daily refresh strategy)
    const tokenRefreshResults = await new TokenRefreshService().refreshAllUserTokens();
    console.log(`[DAILY-FETCH] Token refresh: ${tokenRefreshResults.successful} successful, ${tokenRefreshResults.failed} failed`);
    if (tokenRefreshResults.errors.length > 0) {
        console.warn('[DAILY-FETCH] Token refresh errors:', tokenRefreshResults.errors);
    }

    const users = await dbService.getAllUsersWithTokens();
    if (users.length === 0) {
        throw new Error('No users with tokens found in database. Users need to authenticate via OAuth flow first.');
    }

    const results = {
        totalUsers: users.length,
        successfulUsers: 0,
        failedUsers: 0,
        userResults: [] as UserResult[],
        errors: [] as string[],
        tokenRefreshResults,
    };

    for (const user of users) {
        try {
            if (!user.access_token) {
                throw new Error('No access token available after refresh - needs re-authentication');
            }
            const stored = await fetchUser(user.id, user.access_token, dbService, now, since);
            results.userResults.push({ userId: user.id, userName: `${user.first_name} ${user.last_name}`, ...stored });
            results.successfulUsers++;
        } catch (error) {
            const errorMsg = `Error processing user ${user.id}: ${error instanceof Error ? error.message : String(error)}`;
            console.error(`[DAILY-FETCH] ${errorMsg}`);
            results.errors.push(errorMsg);
            results.failedUsers++;
        }

        // Small delay between users to avoid rate limiting
        if (users.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log(`[DAILY-FETCH] Completed: ${results.successfulUsers}/${results.totalUsers} users processed successfully`);
    return results;
}

async function fetchUser(userId: number, accessToken: string, dbService: WhoopDatabaseService, now: Date, since: Date | null) {
    const whoopClient = new WhoopV2Client(accessToken);
    await dbService.upsertUser(await whoopClient.getUserProfile());

    const from = syncWindowStart(now, await dbService.getLatestRecoveryDate(userId), since).toISOString();
    const [cycles, sleeps, recoveries, workouts] = await Promise.all([
        whoopClient.getAllCycles(from),
        whoopClient.getAllSleep(from),
        whoopClient.getAllRecovery(from),
        whoopClient.getAllWorkouts(from)
    ]);
    const finished = finishedRecords({ cycles, sleeps, recoveries, workouts }, endOfYesterday(now));

    // Order matters. A sleep row points at its cycle, and a recovery row at its cycle
    // and its sleep. Recoveries go last and oldest first, so the newest stored recovery
    // marks how far the stored data is complete: the next run resumes from it.
    await dbService.upsertCycles(finished.cycles);
    await dbService.upsertSleeps(finished.sleeps, finished.sleepCycles);
    await dbService.upsertWorkouts(finished.workouts);
    const recovery = await dbService.upsertRecoveries(finished.recoveries);
    if (recovery.errors.length > 0) {
        throw new Error(`${recovery.errors.length} recoveries were not stored: ${recovery.errors.join('; ')}`);
    }

    const stored = {
        from,
        newCycles: finished.cycles.length,
        newSleep: finished.sleeps.length,
        newRecovery: recovery.newRecoveryCount,
        newWorkouts: finished.workouts.length,
        waiting: finished.waiting
    };
    console.log(`[DAILY-FETCH] User ${userId} stored:`, stored);
    return stored;
}

// The dashboards read the tables directly; the views feed other analytics, so a
// failed refresh is reported and does not fail the fetch.
async function refreshViews(): Promise<string | null> {
    try {
        await sql`SELECT refresh_all_materialized_views();`;
        return null;
    } catch (refreshError) {
        console.error('[DAILY-FETCH] Failed to refresh materialized views:', refreshError);
        return `Materialized view refresh failed: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`;
    }
}
