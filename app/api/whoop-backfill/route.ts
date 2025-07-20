import { NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { WhoopV2Client } from '../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../lib/whoop-database';

export async function POST() {
    try {
        // Get the authenticated session
        const session = await auth();

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Not authenticated or no access token available' }, { status: 401 });
        }

        const accessToken = session.accessToken;

        const whoopClient = new WhoopV2Client(accessToken);
        const dbService = new WhoopDatabaseService();

        // Get user profile and store it
        const user = await whoopClient.getUserProfile();
        await dbService.upsertUser(user);

        // Get historical data (last 30 days)
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString();

        // Fetch cycles
        const cycles = await whoopClient.getAllCycles(startDate, endDate);
        console.log(`Found ${cycles.length} cycles to backfill`);

        for (const cycle of cycles) {
            await dbService.upsertCycle(cycle);
        }

        // Fetch sleep data
        const sleepData = await whoopClient.getAllSleep(startDate, endDate);
        console.log(`Found ${sleepData.length} sleep records to backfill`);

        for (const sleep of sleepData) {
            // Find matching cycle for this sleep
            const matchingCycle = cycles.find(cycle =>
                new Date(sleep.start) >= new Date(cycle.start) &&
                new Date(sleep.start) <= new Date(cycle.end)
            );

            if (matchingCycle) {
                await dbService.upsertSleep(sleep, matchingCycle.id);
            }
        }

        // Fetch workouts
        const workouts = await whoopClient.getAllWorkouts(startDate, endDate);
        console.log(`Found ${workouts.length} workouts to backfill`);

        for (const workout of workouts) {
            await dbService.upsertWorkout(workout);
        }

        return NextResponse.json({
            success: true,
            message: 'Historical data backfill completed',
            data: {
                cycles: cycles.length,
                sleep: sleepData.length,
                workouts: workouts.length
            }
        });

    } catch (error) {
        console.error('Backfill error:', error);
        return NextResponse.json({
            error: 'Backfill failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
