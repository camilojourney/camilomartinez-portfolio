import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { WhoopV2Client } from '../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../lib/whoop-database';

export async function POST(request: NextRequest) {
    try {
        // Get the authenticated session
        const session = await auth();

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Initialize clients
        const whoopClient = new WhoopV2Client(session.accessToken);
        const dbService = new WhoopDatabaseService();

        // Get user profile
        const userProfile = await whoopClient.getUserProfile();
        await dbService.upsertUser(userProfile);

        const results = {
            user: userProfile,
            newCycles: 0,
            newSleep: 0,
            newRecovery: 0,
            newWorkouts: 0,
            errors: [] as string[]
        };

        // Get the latest data timestamps to determine what we need to sync
        const latestCycleDate = await dbService.getLatestCycleDate(userProfile.user_id);
        const latestWorkoutDate = await dbService.getLatestWorkoutDate(userProfile.user_id);

        console.log('Latest cycle date:', latestCycleDate);
        console.log('Latest workout date:', latestWorkoutDate);

        // Calculate start date for incremental sync (last 3 days to ensure we don't miss anything)
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

        const cycleStartDate = latestCycleDate && latestCycleDate > threeDaysAgo
            ? latestCycleDate.toISOString()
            : threeDaysAgo.toISOString();

        const workoutStartDate = latestWorkoutDate && latestWorkoutDate > threeDaysAgo
            ? latestWorkoutDate.toISOString()
            : threeDaysAgo.toISOString();

        // Collect new cycles
        try {
            console.log('Fetching new cycles since:', cycleStartDate);
            const cycles = await whoopClient.getAllCycles(cycleStartDate);
            console.log(`Found ${cycles.length} cycles to process`);

            if (cycles.length > 0) {
                await dbService.upsertCycles(cycles);
                results.newCycles = cycles.length;

                // For each new cycle, get sleep and recovery data
                for (const cycle of cycles) {
                    try {
                        // Get sleep data
                        try {
                            const sleep = await whoopClient.getSleep(cycle.id);
                            await dbService.upsertSleep(sleep, cycle.id);
                            results.newSleep++;
                            console.log(`Stored sleep data for cycle ${cycle.id}`);
                        } catch (error) {
                            console.warn(`No sleep data for cycle ${cycle.id}:`, error);
                            results.errors.push(`No sleep data for cycle ${cycle.id}`);
                        }

                        // Get recovery data
                        try {
                            const recovery = await whoopClient.getRecovery(cycle.id);
                            await dbService.upsertRecovery(recovery);
                            results.newRecovery++;
                            console.log(`Stored recovery data for cycle ${cycle.id}`);
                        } catch (error) {
                            console.warn(`No recovery data for cycle ${cycle.id}:`, error);
                            results.errors.push(`No recovery data for cycle ${cycle.id}`);
                        }

                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        console.error(`Error processing cycle ${cycle.id}:`, error);
                        results.errors.push(`Error processing cycle ${cycle.id}: ${error}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching cycles:', error);
            results.errors.push(`Error fetching cycles: ${error}`);
        }

        // Collect new workouts
        try {
            console.log('Fetching new workouts since:', workoutStartDate);
            const workouts = await whoopClient.getAllWorkouts(workoutStartDate);
            console.log(`Found ${workouts.length} workouts to process`);

            if (workouts.length > 0) {
                await dbService.upsertWorkouts(workouts);
                results.newWorkouts = workouts.length;
            }
        } catch (error) {
            console.error('Error fetching workouts:', error);
            results.errors.push(`Error fetching workouts: ${error}`);
        }

        console.log('Daily collection results:', results);
        return NextResponse.json(results);

    } catch (error) {
        console.error('Daily collection error:', error);
        return NextResponse.json({
            error: 'Collection failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET endpoint for debugging
export async function GET() {
    return NextResponse.json({
        message: 'WHOOP Daily Collector',
        endpoints: {
            POST: 'Run daily data collection'
        }
    });
}
