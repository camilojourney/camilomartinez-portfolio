import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';
import { WhoopV2Client } from '../../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../../lib/whoop-database';

// Function to get the access token from environment variables
function getWhoopAccessToken() {
    // First try to get the token from environment
    const token = process.env.WHOOP_ACCESS_TOKEN;
    if (!token) {
        throw new Error('WHOOP_ACCESS_TOKEN environment variable not found. Please sign in to WHOOP to get a new token.');
    }
    return token;
}

// The GET handler should be at the top level, not nested inside getWhoopAccessToken
export async function GET(request: Request) {
    // Secure the endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Get the access token
        const accessToken = await getWhoopAccessToken();
        if (!accessToken) {
            throw new Error('No access token found for WHOOP user');
        }

        // Initialize the WHOOP client
        const whoopClient = new WhoopV2Client(accessToken);

        // Get current time and 48 hours ago
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        console.log(`[DATA-FETCH] Fetching data from ${fortyEightHoursAgo.toISOString()} to ${now.toISOString()}`);

        // Initialize database service
        const dbService = new WhoopDatabaseService();

        // Fetch all types of data in parallel
        const [allCycles, sleep, recovery, workouts] = await Promise.all([
            whoopClient.getAllCycles(fortyEightHoursAgo.toISOString(), now.toISOString()),
            whoopClient.getAllSleep(fortyEightHoursAgo.toISOString(), now.toISOString()),
            whoopClient.getAllRecovery(fortyEightHoursAgo.toISOString(), now.toISOString()),
            whoopClient.getAllWorkouts(fortyEightHoursAgo.toISOString(), now.toISOString())
        ]);

        // Filter out incomplete cycles (where end is null)
        const cycles = allCycles.filter(cycle => cycle.end !== null);
        const incompleteCount = allCycles.length - cycles.length;
        console.log(`[DATA-FETCH] Filtered out ${incompleteCount} incomplete cycles from ${allCycles.length} total cycles`);

        // Store the data
        await Promise.all([
            dbService.upsertCycles(cycles),
            dbService.upsertSleeps(sleep),
            dbService.upsertRecoveries(recovery),
            dbService.upsertWorkouts(workouts)
        ]);

        console.log(`[DATA-FETCH] Successfully processed data:
                    - Cycles: ${cycles.length}
                    - Sleep: ${sleep.length}
                    - Recovery: ${recovery.length}
                    - Workouts: ${workouts.length}
                `);

        return NextResponse.json({
            success: true,
            data: {
                cycles: cycles.length,
                sleep: sleep.length,
                recovery: recovery.length,
                workouts: workouts.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[DATA-FETCH] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
