import { NextResponse } from 'next/server';
import { WhoopV2Client } from '../../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../../lib/whoop-database';

export async function GET(request: Request) {
    try {
        // Verify this is a valid cron request
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accessToken = process.env.WHOOP_ACCESS_TOKEN;
        if (!accessToken) {
            return NextResponse.json({ error: 'No access token' }, { status: 500 });
        }

        const whoopClient = new WhoopV2Client(accessToken);
        const dbService = new WhoopDatabaseService();

        // Get data for the last 3 days to ensure we catch any recent updates
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString();

        let results = {
            cycles: 0,
            sleep: 0,
            recovery: 0,
            workouts: 0,
            errors: [] as string[]
        };

        try {
            // Sync cycles
            const cycles = await whoopClient.getAllCycles(startDate, endDate);
            for (const cycle of cycles) {
                await dbService.upsertCycle(cycle);
            }
            results.cycles = cycles.length;

            // Sync sleep
            const sleepData = await whoopClient.getAllSleep(startDate, endDate);
            for (const sleep of sleepData) {
                const matchingCycle = cycles.find(cycle => 
                    new Date(sleep.start) >= new Date(cycle.start) &&
                    new Date(sleep.start) <= new Date(cycle.end)
                );
                if (matchingCycle) {
                    await dbService.upsertSleep(sleep, matchingCycle.id);
                }
            }
            results.sleep = sleepData.length;

            // Sync workouts
            const workouts = await whoopClient.getAllWorkouts(startDate, endDate);
            for (const workout of workouts) {
                await dbService.upsertWorkout(workout);
            }
            results.workouts = workouts.length;

        } catch (error) {
            console.error('Daily sync error:', error);
            results.errors.push(error instanceof Error ? error.message : 'Unknown error');
        }

        return NextResponse.json({
            success: results.errors.length === 0,
            message: 'Daily WHOOP sync completed',
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({
            error: 'Daily sync failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}