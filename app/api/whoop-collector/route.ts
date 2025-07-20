import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { WhoopV2Client } from '../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../lib/whoop-database';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const mode = body.mode || 'daily';
        const isDaily = mode === 'daily';

        console.log(`🔧 Running ${mode} collection`);

        const whoopClient = new WhoopV2Client(session.accessToken);
        const dbService = new WhoopDatabaseService();
        const userProfile = await whoopClient.getUserProfile();
        await dbService.upsertUser(userProfile);

        const results = {
            user: userProfile,
            newCycles: 0,
            newSleep: 0,
            newRecovery: 0,
            newWorkouts: 0,
            errors: [] as string[],
        };

        let startDate: string | undefined;
        if (isDaily) {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            startDate = threeDaysAgo.toISOString();
            console.log('📅 Daily mode: collecting last 3 days from', startDate);
        } else {
            startDate = undefined;
            console.log('📅 Historical mode: collecting ALL historical data');
        }

        // STEP 1: Fetch and save ALL sleep data FIRST.
        try {
            console.log('🛌 Fetching all sleep data since:', startDate);
            const sleepData = await whoopClient.getAllSleep(startDate);
            if (sleepData.length > 0) {
                await dbService.upsertSleeps(sleepData); // Assumes a bulk upsert method
                results.newSleep = sleepData.length;
                console.log(`✅ Stored ${sleepData.length} sleep records.`);
            }
        } catch (error) {
            const errorMessage = `Error with sleep data: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        // STEP 2: Collect and save cycles.
        try {
            console.log('🔄 Fetching cycles since:', startDate);
            const cycles = await whoopClient.getAllCycles(startDate);
            if (cycles.length > 0) {
                await dbService.upsertCycles(cycles); // Assumes a bulk upsert method
                results.newCycles = cycles.length;
                console.log(`✅ Stored ${cycles.length} cycles.`);
            }
        } catch (error) {
            const errorMessage = `Error with cycles: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        // STEP 3: Collect and save recovery data.
        try {
            console.log('❤️‍🩹 Fetching all recovery data since:', startDate);
            const recoveryData = await whoopClient.getAllRecovery(startDate);
            if (recoveryData.length > 0) {
                const { newRecoveryCount, errors } = await dbService.upsertRecoveries(recoveryData); // Assumes a bulk upsert method
                results.newRecovery = newRecoveryCount;
                results.errors.push(...errors);
                console.log(`✅ Stored ${newRecoveryCount} recovery records.`);
            }
        } catch (error) {
            const errorMessage = `Error with recovery data: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        // STEP 4: Collect and save workouts.
        try {
            console.log('🏃‍♂️ Fetching new workouts since:', startDate);
            const workouts = await whoopClient.getAllWorkouts(startDate);
            if (workouts.length > 0) {
                await dbService.upsertWorkouts(workouts); // Assumes a bulk upsert method
                results.newWorkouts = workouts.length;
                console.log(`✅ Stored ${workouts.length} workouts.`);
            }
        } catch (error) {
            const errorMessage = `Error with workouts: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        console.log(`📊 Collection Summary:`);
        console.log(`  - Cycles: ${results.newCycles}`);
        console.log(`  - Sleep Records: ${results.newSleep}`);
        console.log(`  - Recovery Records: ${results.newRecovery}`);
        console.log(`  - Workouts: ${results.newWorkouts}`);
        console.log(`  - Errors: ${results.errors.length}`);

        if (!isDaily) {
            console.log(`🎉 COMPLETE HISTORICAL COLLECTION FINISHED!`);
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error('Collection failed catastrophically:', error);
        return NextResponse.json({
            error: 'Collection failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
