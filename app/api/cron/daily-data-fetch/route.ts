import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';
import { WhoopV2Client } from '../../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../../lib/whoop-database';

import { auth } from '../../../../lib/auth';

export async function POST(request: Request) {
    // Secure the endpoint
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (cronSecret !== expectedSecret) {
        console.error('[DAILY-FETCH] Authorization failed');
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const session = await auth();
        // Use stored token as fallback
        const accessToken = session?.accessToken || process.env.WHOOP_ACCESS_TOKEN;

        if (!accessToken) {
            throw new Error('No access token found');
        }

        // Initialize clients
        const whoopClient = new WhoopV2Client(accessToken);
        const dbService = new WhoopDatabaseService();

        // Get user profile first
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

        console.log(`[DAILY-FETCH] Collecting data from ${startTwoDaysAgo.toISOString()} to ${endOfYesterday.toISOString()}`);

        // First, get all data in parallel for the date range
        const [recoveryRecords, sleepRecords, workoutRecords] = await Promise.all([
            whoopClient.getAllRecovery(startTwoDaysAgo.toISOString(), endOfYesterday.toISOString()),
            whoopClient.getAllSleep(startTwoDaysAgo.toISOString(), endOfYesterday.toISOString()),
            whoopClient.getAllWorkouts(startTwoDaysAgo.toISOString(), endOfYesterday.toISOString())
        ]);

        // Extract cycle IDs from recovery records and fetch cycle data
        const uniqueCycleIds = Array.from(new Set(recoveryRecords.map(r => r.cycle_id)));
        const cycleData = (await Promise.all(
            uniqueCycleIds.map(id => whoopClient.getCycleById(id).catch(() => null))
        )).filter(c => c !== null);

        // Filter data for completed records within our date range
        const filteredCycles = cycleData.filter(cycle => {
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
        console.log(`[DAILY-FETCH] Filtering results:
            Cycles:
            - Total fetched: ${cycleData.length}
            - Complete & within range: ${filteredCycles.length}
            - Excluded incomplete or current: ${cycleData.length - filteredCycles.length}

            Sleep:
            - Total fetched: ${sleepRecords.length}
            - Complete & within range: ${filteredSleep.length}
            - Excluded incomplete or current: ${sleepRecords.length - filteredSleep.length}

            Recovery:
            - Total fetched: ${recoveryRecords.length}
            - Within range: ${filteredRecovery.length}
            - Excluded current: ${recoveryRecords.length - filteredRecovery.length}

            Workouts:
            - Total fetched: ${workoutRecords.length}
            - Complete & within range: ${filteredWorkouts.length}
            - Excluded incomplete or current: ${workoutRecords.length - filteredWorkouts.length}
        `);

        // Store the filtered data
        await Promise.all([
            dbService.upsertCycles(filteredCycles),
            dbService.upsertSleeps(filteredSleep),
            dbService.upsertRecoveries(filteredRecovery),
            dbService.upsertWorkouts(filteredWorkouts)
        ]);

        console.log(`[DAILY-FETCH] Successfully processed data:
            - Cycles: ${filteredCycles.length}
            - Sleep: ${filteredSleep.length}
            - Recovery: ${filteredRecovery.length}
            - Workouts: ${filteredWorkouts.length}
        `);

        return NextResponse.json({
            success: true,
            data: {
                cycles: filteredCycles.length,
                sleep: filteredSleep.length,
                recovery: filteredRecovery.length,
                workouts: filteredWorkouts.length
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
