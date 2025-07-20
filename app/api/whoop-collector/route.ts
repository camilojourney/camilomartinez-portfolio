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

        // Parse request body to check for mode
        const body = await request.json().catch(() => ({}));
        const mode = body.mode || 'daily'; // Default to daily if no mode specified
        const isDaily = mode === 'daily';
        const now = new Date();

        console.log(`🔧 Running ${mode} collection`);

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

        // Calculate start date based on mode
        let startDate: string | undefined;
        if (isDaily) {
            // Daily mode: collect last 3 days to catch any delayed data
            const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
            startDate = threeDaysAgo.toISOString();
            console.log('📅 Daily mode: collecting last 3 days from', startDate);
        } else {
            // Historical mode: collect ALL data (no start date limit)
            startDate = undefined; // This will fetch all historical data
            console.log('📅 Historical mode: collecting ALL historical data (no date limit)');
            console.log('⚠️ This may take a while and use significant API requests');
            console.log('💡 WHOOP rate limits: 100 req/min, 10,000 req/day');
        }

        // Collect new cycles
        try {
            console.log('🔍 DEBUG: About to fetch cycles...');
            console.log('🔍 DEBUG: startDate =', startDate);
            console.log('🔍 DEBUG: mode =', mode);

            const cycles = await whoopClient.getAllCycles(startDate);

            console.log('🔍 DEBUG: Raw cycles response:', {
                count: cycles.length,
                firstCycle: cycles[0] ? {
                    id: cycles[0].id,
                    start: cycles[0].start,
                    end: cycles[0].end
                } : null,
                lastCycle: cycles[cycles.length - 1] ? {
                    id: cycles[cycles.length - 1].id,
                    start: cycles[cycles.length - 1].start,
                    end: cycles[cycles.length - 1].end
                } : null
            });

            if (cycles.length > 0) {
                console.log(`📊 Date range of cycles: ${cycles[cycles.length - 1]?.start} to ${cycles[0]?.start}`);

                // Try to upsert cycles
                console.log('🔍 DEBUG: About to upsert cycles to database...');
                await dbService.upsertCycles(cycles);
                results.newCycles = cycles.length;
                console.log('🔍 DEBUG: Successfully upserted cycles to database');
            } else {
                console.log('🔍 DEBUG: No cycles found - this might be the issue!');
            }
        } catch (error) {
            console.error('❌ ERROR: Error fetching cycles:', error);
            results.errors.push(`Error fetching cycles: ${error}`);
        }

        // Collect sleep data first (recovery depends on sleep data)
        try {
            console.log('🛌 Fetching all sleep data since:', startDate);
            const sleepData = await whoopClient.getAllSleep(startDate);
            console.log(`Found ${sleepData.length} sleep records to process`);

            for (const sleep of sleepData) {
                try {
                    // Store all sleep records - the database will handle cycle relationships
                    await dbService.upsertSleep(sleep);
                    results.newSleep++;
                    console.log(`✅ Stored sleep data: ${sleep.id}`);
                } catch (error) {
                    console.error(`❌ Error storing sleep ${sleep.id}:`, error);
                    results.errors.push(`Error storing sleep ${sleep.id}: ${error}`);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching sleep data:', error);
            results.errors.push(`Error fetching sleep data: ${error}`);
        }

        // Collect recovery data in bulk (more efficient than per-cycle)
        try {
            console.log('🔄 Fetching all recovery data since:', startDate);
            const recoveryData = await whoopClient.getAllRecovery(startDate);
            console.log(`Found ${recoveryData.length} recovery records to process`);

            for (const recovery of recoveryData) {
                try {
                    await dbService.upsertRecovery(recovery);
                    results.newRecovery++;
                    console.log(`✅ Stored recovery data for cycle ${recovery.cycle_id}`);
                } catch (error) {
                    // Enhanced debugging for foreign key constraint violations
                    if (error instanceof Error && error.message.includes('whoop_recovery_sleep_id_fkey')) {
                        console.error(`🔍 DEBUG: Foreign key violation for recovery cycle ${recovery.cycle_id}`);
                        console.error(`🔍 DEBUG: Recovery references sleep_id: ${recovery.sleep_id}`);
                        console.error(`🔍 DEBUG: This sleep_id might not exist in our whoop_sleep table`);

                        // Add this to results for visibility
                        results.errors.push(`Recovery cycle ${recovery.cycle_id} references missing sleep_id: ${recovery.sleep_id}`);
                    } else {
                        console.error(`❌ Error storing recovery for cycle ${recovery.cycle_id}:`, error);
                        results.errors.push(`Error storing recovery for cycle ${recovery.cycle_id}: ${error}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error fetching recovery data:', error);
            results.errors.push(`Error fetching recovery data: ${error}`);
        }

        // Collect new workouts
        try {
            console.log('🏃‍♂️ Fetching new workouts since:', startDate);
            const workouts = await whoopClient.getAllWorkouts(startDate);
            console.log(`Found ${workouts.length} workouts to process`);

            if (workouts.length > 0) {
                await dbService.upsertWorkouts(workouts);
                results.newWorkouts = workouts.length;
                console.log(`✅ Stored ${workouts.length} workouts`);
            }
        } catch (error) {
            console.error('❌ Error fetching workouts:', error);
            results.errors.push(`Error fetching workouts: ${error}`);
        }

        console.log(`${mode === 'historical' ? 'Historical' : 'Daily'} collection results:`, results);

        // Add summary statistics
        console.log(`📊 Collection Summary:`);
        console.log(`  - Cycles: ${results.newCycles}`);
        console.log(`  - Sleep Records: ${results.newSleep}`);
        console.log(`  - Recovery Records: ${results.newRecovery}`);
        console.log(`  - Workouts: ${results.newWorkouts}`);
        console.log(`  - Errors: ${results.errors.length}`);

        if (results.errors.length > 0) {
            console.log(`⚠️ Foreign Key Issues: ${results.errors.filter(e => e.includes('sleep_id')).length}`);
        }

        // Add completion message for historical runs
        if (!isDaily) {
            console.log(`🎉 COMPLETE HISTORICAL COLLECTION FINISHED!`);
            console.log(`📈 Total Records: ${results.newCycles + results.newSleep + results.newRecovery + results.newWorkouts}`);
            console.log(`💾 Your entire WHOOP history has been synchronized`);
        }

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
