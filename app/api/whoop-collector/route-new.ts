import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { WhoopV2Client } from '../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../lib/whoop-database';
import { WhoopCycle, WhoopSleep, WhoopRecovery, WhoopWorkout } from '../../../types/whoop';

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 Starting Whoop data collection...');

        const session = await auth();
        if (!session?.accessToken) {
            return NextResponse.json({ error: 'No valid session or access token' }, { status: 401 });
        }

        const whoopClient = new WhoopV2Client(session.accessToken);
        const dbService = new WhoopDatabaseService();

        // Parse request body for date range
        let body;
        try {
            body = await request.json();
        } catch {
            body = {};
        }

        const daysBack = body.daysBack || 30;
        const startDate = new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        console.log(`📅 Collecting data from ${startDate} onwards...`);

        const results = {
            newCycles: 0,
            newSleep: 0,
            newRecovery: 0,
            newWorkouts: 0,
            errors: [] as string[]
        };

        // STEP 1: Collect all cycles
        try {
            console.log('🔄 Fetching all cycles...');
            const allCycles = await whoopClient.getAllCycles(startDate);
            if (allCycles.length > 0) {
                await dbService.upsertCycles(allCycles);
                results.newCycles = allCycles.length;
                console.log(`✅ Stored ${allCycles.length} cycles.`);
            } else {
                console.log('ℹ️ No cycles found for the specified period.');
            }
        } catch (error) {
            const errorMessage = `Error collecting cycles: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        // STEP 2: Collect all sleep data
        try {
            console.log('🛌 Fetching all sleep data...');
            const allSleepData = await whoopClient.getAllSleep(startDate);
            if (allSleepData.length > 0) {
                await dbService.upsertSleeps(allSleepData);
                results.newSleep = allSleepData.length;
                console.log(`✅ Stored ${allSleepData.length} sleep records.`);
            } else {
                console.log('ℹ️ No sleep data found for the specified period.');
            }
        } catch (error) {
            const errorMessage = `Error collecting sleep data: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        // STEP 3: Collect all recovery data
        try {
            console.log('❤️‍🩹 Fetching all recovery data...');
            const allRecoveryData = await whoopClient.getAllRecovery(startDate);
            if (allRecoveryData.length > 0) {
                await dbService.upsertRecoveries(allRecoveryData);
                results.newRecovery = allRecoveryData.length;
                console.log(`✅ Stored ${allRecoveryData.length} recovery records.`);
            } else {
                console.log('ℹ️ No recovery data found for the specified period.');
            }
        } catch (error) {
            const errorMessage = `Error collecting recovery data: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        // STEP 4: Collect all workout data
        try {
            console.log('🏋️ Fetching all workout data...');
            const allWorkoutData = await whoopClient.getAllWorkouts(startDate);
            if (allWorkoutData.length > 0) {
                await dbService.upsertWorkouts(allWorkoutData);
                results.newWorkouts = allWorkoutData.length;
                console.log(`✅ Stored ${allWorkoutData.length} workout records.`);
            } else {
                console.log('ℹ️ No workout data found for the specified period.');
            }
        } catch (error) {
            const errorMessage = `Error collecting workout data: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        console.log('🎉 Data collection completed!');
        console.log(`Summary: ${results.newCycles} cycles, ${results.newSleep} sleep, ${results.newRecovery} recovery, ${results.newWorkouts} workouts`);

        if (results.errors.length > 0) {
            console.log(`⚠️ Errors encountered: ${results.errors.length}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Data collection completed',
            results
        });

    } catch (error) {
        console.error('❌ Fatal error in data collection:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
