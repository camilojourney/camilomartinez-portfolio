import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { WhoopV2Client } from '../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../lib/whoop-database';
import { WhoopSleep, WhoopCycle, WhoopRecovery, WhoopWorkout } from '../../../types/whoop';

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

        // Initialize clients with v2 API
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

        // Determine date range for collection
        let startDate: string | undefined;
        if (isDaily) {
            // For daily collection, get last 3 days to ensure no gaps
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            startDate = threeDaysAgo.toISOString();
            console.log('📅 Daily mode: collecting last 3 days from', startDate);
        } else {
            // For historical collection, start from undefined to get all data
            // or you could set a very old date like:
            // startDate = '2010-01-01T00:00:00Z';
            startDate = undefined;
            console.log('📅 Historical mode: collecting ALL historical data');
        }

        // STEP 1: Fetch and save ALL sleep data FIRST. It has reliable pagination.
        let allSleepData: WhoopSleep[] = [];
        try {
            console.log('🛌 Fetching all sleep data since:', startDate);
            allSleepData = await whoopClient.getAllSleep(startDate);
            if (allSleepData.length > 0) {
                await dbService.upsertSleeps(allSleepData);
                results.newSleep = allSleepData.length;
                console.log(`✅ Stored ${allSleepData.length} sleep records.`);
            }
        } catch (error) {
            const errorMessage = `Error with sleep data: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        // STEP 2: Fetch cycles using direct pagination (v2 API)
        try {
            console.log('🔄 Fetching all cycles since:', startDate);
            // Use the new getAllCycles method we added to the client
            const allCycles = await whoopClient.getAllCycles(startDate);
            console.log(`Found ${allCycles.length} cycles via pagination`);
            
            if (allCycles.length > 0) {
                await dbService.upsertCycles(allCycles);
                results.newCycles = allCycles.length;
                console.log(`✅ Stored ${allCycles.length} cycles from direct fetch.`);
            } else {
                console.warn('⚠️ No cycles found via direct fetch! This is unusual and may indicate an API issue.');
            }
        } catch (error) {
            const errorMessage = `Error with cycle data: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        // STEP 3: Collect and save recovery data.
        try {
            console.log('❤️‍🩹 Fetching all recovery data since:', startDate);
            const recoveryData = await whoopClient.getAllRecovery(startDate);
            if (recoveryData.length > 0) {
                const { newRecoveryCount, errors } = await dbService.upsertRecoveries(recoveryData);
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
                await dbService.upsertWorkouts(workouts);
                results.newWorkouts = workouts.length;
                console.log(`✅ Stored ${workouts.length} workouts.`);
            }
        } catch (error) {
            const errorMessage = `Error with workouts: ${error instanceof Error ? error.message : String(error)}`;
            console.error('❌', errorMessage);
            results.errors.push(errorMessage);
        }

        // Summary of collection results
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

// GET endpoint for debugging
export async function GET() {
    return NextResponse.json({
        message: 'WHOOP Data Collector',
        description: 'This endpoint collects data from the WHOOP API and stores it in the database.',
        usage: 'Send a POST request to collect data. Add {"mode": "historical"} to the body for full historical collection.',
        documentation: 'See the whoop-client.ts and whoop-database.ts files for more details on the implementation.'
    });
}
