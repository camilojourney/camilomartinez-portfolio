import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';
import { WhoopV2Client } from '@/lib/whoop';
import { WhoopDatabaseService } from '@/lib/db/whoop-database';
import { TokenRefreshService } from '@/lib/services/token-refresh-service';
import { auth } from '@/lib/auth';

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

    try {
        console.log('[DAILY-FETCH] Starting daily data fetch for all users...');
        
        const dbService = new WhoopDatabaseService();
        const tokenService = new TokenRefreshService();
        
        // STEP 1: Refresh all user tokens FIRST (daily refresh strategy)
        console.log('[DAILY-FETCH] Step 1: Refreshing all user tokens...');
        const tokenRefreshResults = await tokenService.refreshAllUserTokens();
        console.log(`[DAILY-FETCH] Token refresh complete: ${tokenRefreshResults.successful} successful, ${tokenRefreshResults.failed} failed`);
        
        if (tokenRefreshResults.errors.length > 0) {
            console.warn('[DAILY-FETCH] Token refresh errors:', tokenRefreshResults.errors);
        }
        
        // STEP 2: Get all users with fresh tokens
        const users = await dbService.getAllUsersWithTokens();
        console.log(`[DAILY-FETCH] Step 2: Found ${users.length} users for data fetch`);

        if (users.length === 0) {
            throw new Error('No users with tokens found in database. Users need to authenticate via OAuth flow first.');
        }

        const results = {
            totalUsers: users.length,
            successfulUsers: 0,
            failedUsers: 0,
            userResults: [] as any[],
            errors: [] as string[],
            tokenRefreshResults: {
                successful: tokenRefreshResults.successful,
                failed: tokenRefreshResults.failed,
                errors: tokenRefreshResults.errors
            }
        };

        // STEP 3: Process each user with their fresh tokens
        console.log('[DAILY-FETCH] Step 3: Processing data for all users...');
        for (const user of users) {
            try {
                console.log(`[DAILY-FETCH] Processing user: ${user.first_name} ${user.last_name} (${user.id})`);
                
                // Use the tokens that were just refreshed (should be fresh)
                if (!user.access_token) {
                    const error = `No access token available for user ${user.id} after refresh - needs re-authentication`;
                    console.error(`[DAILY-FETCH] ${error}`);
                    results.errors.push(error);
                    results.failedUsers++;
                    continue;
                }

                // Process data for this user with fresh token
                const userResult = await processUserData(user.id, user.access_token, dbService);
                results.userResults.push({
                    userId: user.id,
                    userName: `${user.first_name} ${user.last_name}`,
                    ...userResult
                });
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
        console.log(`[DAILY-FETCH] Summary: Tokens refreshed → Data fetched → Job complete`);

        return NextResponse.json({
            success: true,
            data: results,
            timestamp: new Date().toISOString()
        });

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

// Helper function to process data for a single user
async function processUserData(userId: number, accessToken: string, dbService: WhoopDatabaseService) {
    // Initialize WHOOP client with user's token
    const whoopClient = new WhoopV2Client(accessToken);
    
    // Test the token first with a simple call
    const userProfile = await whoopClient.getUserProfile();
    await dbService.upsertUser(userProfile);

    const results = {
        user: userProfile,
        newCycles: 0,
        newSleep: 0,
        newRecovery: 0,
        newWorkouts: 0
    };

    // Set up date range: from start of 2 days ago until end of yesterday
    const now = new Date();
    const startTwoDaysAgo = new Date(now);
    startTwoDaysAgo.setDate(now.getDate() - 2);
    startTwoDaysAgo.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(now);
    endOfYesterday.setDate(now.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    console.log(`[DAILY-FETCH] User ${userId}: Collecting data from ${startTwoDaysAgo.toISOString()} to ${endOfYesterday.toISOString()}`);

    // First, get all data in parallel for the date range
    const [recoveryRecords, sleepRecords, workoutRecords] = await Promise.all([
        whoopClient.getAllRecovery(startTwoDaysAgo.toISOString()),
        whoopClient.getAllSleep(startTwoDaysAgo.toISOString()),
        whoopClient.getAllWorkouts(startTwoDaysAgo.toISOString())
    ]);

    // Extract cycle IDs from recovery records and fetch cycle data
    const uniqueCycleIds = Array.from(new Set(recoveryRecords.map(r => r.cycle_id)));
    const cycleData = (await Promise.all(
        uniqueCycleIds.map(id => whoopClient.getCycleById(id).catch(() => null))
    )).filter((c: any): c is Exclude<typeof c, null> => c !== null);

    // Filter data for completed records within our date range
    const filteredCycles = cycleData.filter((cycle: { end: string }) => {
        const endDate = new Date(cycle.end);
        return endDate <= endOfYesterday;
    });

    const filteredSleep = sleepRecords.filter(item => {
        if (!item.end) return false;
        const endDate = new Date(item.end);
        return endDate <= endOfYesterday;
    });

    const filteredRecovery = recoveryRecords.filter(item => {
        const date = new Date(item.created_at);
        return date >= startTwoDaysAgo && date <= endOfYesterday;
    });

    const filteredWorkouts = workoutRecords.filter(item => {
        if (!item.end) return false;
        const endDate = new Date(item.end);
        return endDate <= endOfYesterday;
    });

    // Detailed logging of what's being filtered
    console.log(`[DAILY-FETCH] User ${userId} filtering results:
        Cycles: ${cycleData.length} fetched → ${filteredCycles.length} filtered
        Sleep: ${sleepRecords.length} fetched → ${filteredSleep.length} filtered
        Recovery: ${recoveryRecords.length} fetched → ${filteredRecovery.length} filtered
        Workouts: ${workoutRecords.length} fetched → ${filteredWorkouts.length} filtered
    `);

    // Store the filtered data and get actual insert counts
    const [, , recoveryResult, ] = await Promise.all([
        dbService.upsertCycles(filteredCycles),
        dbService.upsertSleeps(filteredSleep),
        dbService.upsertRecoveries(filteredRecovery),
        dbService.upsertWorkouts(filteredWorkouts)
    ]);

    const actualResults = {
        newCycles: filteredCycles.length,
        newSleep: filteredSleep.length,
        newRecovery: recoveryResult.newRecoveryCount,
        newWorkouts: filteredWorkouts.length
    };

    console.log(`[DAILY-FETCH] User ${userId} processed: ${filteredCycles.length} cycles, ${filteredSleep.length} sleep, ${actualResults.newRecovery} recovery, ${filteredWorkouts.length} workouts`);

    return actualResults;
}
