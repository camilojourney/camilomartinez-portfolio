/**
 * WHOOP API V2 Data Collector
 *
 * Collection Strategy:
 * 1. Cycles: Two-phase collection
 *    a) Try paginated /cycle endpoint (limited to 25 records)
 *    b) Use recovery data to identify & fetch missing cycles via /cycle/{id}
 *
 * 2. Sleep & Recovery: Use paginated collection endpoints
 *    - /activity/sleep for all sleep records
 *    - /recovery for all recovery records (also serves as relationship mapping)
 *
 * 3. Workouts: Use paginated /activity/workout endpoint
 *
 * 4. Relationship Mapping:
 *    - Recovery records contain both cycle_id and sleep_id
 *    - Used to update sleep-cycle relationships in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WhoopV2Client } from '@/lib/whoop';
import { WhoopDatabaseService } from '@/lib/db/whoop-database';
import { WhoopCycle } from '@/types/whoop';

export async function POST(request: NextRequest) {
    const session = await auth();
    const sessionWithToken = session as typeof session & { accessToken?: string; error?: string };
    
    if (!sessionWithToken?.accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const mode = body.mode || 'daily';
        const isDaily = mode === 'daily';

        console.log(`🔧 Running ${mode} collection with OPTIMIZED strategy`);

        // Initialize clients
        const whoopClient = new WhoopV2Client(sessionWithToken.accessToken);
        const dbService = new WhoopDatabaseService();

        // Get user profile first
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

        // Date range
        let startDate: string | undefined;
        if (isDaily) {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            startDate = threeDaysAgo.toISOString();
        } else {
            startDate = undefined; // Get ALL historical data
        }

        console.log(`📅 Collection mode: ${mode}, Start date: ${startDate || 'ALL HISTORY'}`);

        // 1. Get ALL recovery data first (needed for cycle relationship mapping)
        let recoveryData;
        try {
            console.log('❤️‍🩹 Fetching ALL recovery data...');
            recoveryData = await whoopClient.getAllRecovery(startDate);
            if (recoveryData.length > 0) {
                const { newRecoveryCount, errors } = await dbService.upsertRecoveries(recoveryData);
                results.newRecovery = newRecoveryCount;
                if (errors.length > 0) {
                    results.errors.push(...errors);
                }
                console.log(`✅ Collected ${newRecoveryCount} recovery records`);
            }
        } catch (error) {
            console.error('❌ Recovery data collection failed:', error);
            results.errors.push(`Recovery: ${error}`);
            // Don't proceed without recovery data as it's needed for cycle mapping
            throw new Error('Recovery data collection failed - required for cycle mapping');
        }

        // 2. Collect ALL cycles using two-phase strategy
        let cycles: WhoopCycle[] = [];
        try {
            console.log('🔄 Phase 1: Fetching cycles via pagination...');
            cycles = await whoopClient.getAllCycles(startDate);
            await dbService.upsertCycles(cycles);
            results.newCycles = cycles.length;
            console.log(`✅ Phase 1: Collected ${cycles.length} cycles via pagination`);

            // Phase 2: Use recovery data to find and fetch any missing cycles
            const recoveredCycleIds = Array.from(new Set(recoveryData.map(r => r.cycle_id))) as number[];
            const knownCycleIds = cycles.map(c => c.id);
            const missingCycleIds = recoveredCycleIds.filter(id => !knownCycleIds.includes(id));

            if (missingCycleIds.length > 0) {
                console.log(`🔄 Phase 2: Fetching ${missingCycleIds.length} additional cycles by ID...`);
                let successCount = 0;
                let retryCount = 0;
                const maxRetries = 3;

                for (const cycleId of missingCycleIds) {
                    let success = false;
                    let attempts = 0;

                    while (!success && attempts < maxRetries) {
                        try {
                            const cycle = await whoopClient.getCycleById(cycleId);
                            await dbService.upsertCycles([cycle]);
                            results.newCycles++;
                            successCount++;
                            success = true;

                            // Progress update with percentage
                            const progress = Math.round((successCount / missingCycleIds.length) * 100);
                            if (successCount % 10 === 0 || progress % 25 === 0) {
                                console.log(`✅ Progress: ${progress}% (${successCount}/${missingCycleIds.length} cycles)`);
                            }
                        } catch (error) {
                            attempts++;
                            if (attempts === maxRetries) {
                                console.error(`❌ Failed to fetch cycle ${cycleId} after ${maxRetries} attempts:`, error);
                                results.errors.push(`Cycle ${cycleId}: ${error}`);
                            } else {
                                retryCount++;
                                console.log(`⚠️ Retry ${attempts}/${maxRetries} for cycle ${cycleId}...`);
                                await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
                            }
                        }
                    }
                }

                // Final status report
                const failedCount = missingCycleIds.length - successCount;
                console.log(`✅ Phase 2: Complete. Results:
    - Success: ${successCount}/${missingCycleIds.length} cycles collected
    - Failed: ${failedCount} cycles
    - Retries: ${retryCount} total retries
    - Success Rate: ${Math.round((successCount / missingCycleIds.length) * 100)}%`);
            }

            console.log(`✅ Cycle collection complete. Total cycles: ${results.newCycles}`);
        } catch (error) {
            console.error('❌ Cycle collection failed:', error);
            results.errors.push(`Cycles: ${error}`);
        }

        // 3. Get ALL sleep data via collection endpoint
        try {
            console.log('🛌 Fetching ALL sleep data...');
            const sleepData = await whoopClient.getAllSleep(startDate);
            if (sleepData.length > 0) {
                await dbService.upsertSleeps(sleepData); // No cycle mapping - will be updated by recovery data
                results.newSleep = sleepData.length;
                console.log(`✅ Collected ${sleepData.length} sleep records`);
            }
        } catch (error) {
            console.error('❌ Sleep data collection failed:', error);
            results.errors.push(`Sleep: ${error}`);
        }

        // 4. Update sleep-cycle relationships using the recovery data we collected
        try {
            console.log('🔄 Updating relationships between cycles and sleep...');
            await dbService.updateSleepCycleRelationships(recoveryData);
            console.log('✅ Sleep-cycle relationships updated successfully');
        } catch (error) {
            console.error('❌ Relationship mapping failed:', error);
            results.errors.push(`Relationship mapping: ${error}`);
        }

        // 5. Get ALL workout data via collection endpoint
        try {
            console.log('🏃‍♂️ Fetching ALL workouts...');
            const workouts = await whoopClient.getAllWorkouts(startDate);
            if (workouts.length > 0) {
                console.log(`Found ${workouts.length} total workouts`);

                // Categorize workouts by data completeness
                const categorizedWorkouts = workouts.reduce((acc, w) => {
                    if (!w.score) {
                        acc.noScore.push(w);
                    } else if (!w.score.strain || !w.score.average_heart_rate) {
                        acc.partialScore.push(w);
                    } else {
                        acc.complete.push(w);
                    }
                    return acc;
                }, { complete: [], partialScore: [], noScore: [] } as Record<string, any[]>);

                // Store all workouts, even incomplete ones
                await dbService.upsertWorkouts(workouts);
                results.newWorkouts = workouts.length;

                // Detailed stats
                console.log('Workout Data Quality:');
                console.log(`  ✅ Complete data: ${categorizedWorkouts.complete.length} workouts`);
                console.log(`  ⚠️ Partial score: ${categorizedWorkouts.partialScore.length} workouts`);
                console.log(`  ℹ️ No score data: ${categorizedWorkouts.noScore.length} workouts`);

                // Add workout stats to results
                Object.assign(results, {
                    workoutStats: {
                        total: workouts.length,
                        withCompleteData: categorizedWorkouts.complete.length,
                        withPartialData: categorizedWorkouts.partialScore.length,
                        withoutScore: categorizedWorkouts.noScore.length,
                        dataQualityRate: Math.round((categorizedWorkouts.complete.length / workouts.length) * 100) + '%'
                    }
                });

                // Log some example workout IDs for investigation if needed
                if (categorizedWorkouts.noScore.length > 0) {
                    console.log('Example workouts without scores:');
                    categorizedWorkouts.noScore.slice(0, 3).forEach((w: { id: string | number; sport_name?: string; sport_id?: string; start: string }) => {
                        console.log(`  - ID: ${w.id}, Sport: ${w.sport_name || w.sport_id}, Time: ${w.start}`);
                    });
                }
            }
        } catch (error) {
            console.error('❌ Workout collection failed:', error);
            results.errors.push(`Workouts: ${error}`);
        }

        // Summary with detailed stats
        const totalRecords = results.newCycles + results.newSleep + results.newRecovery + results.newWorkouts;

        console.log(`\n📊 COLLECTION COMPLETE!`);
        console.log(`Data Collected:`);
        console.log(`  - Cycles: ${results.newCycles}`);
        console.log(`  - Sleep: ${results.newSleep}`);
        console.log(`  - Recovery: ${results.newRecovery}`);
        console.log(`  - Workouts: ${results.newWorkouts}`);
        console.log(`\nTotals:`);
        console.log(`  - Total Records Stored: ${totalRecords}`);
        console.log(`  - Total Errors/Warnings: ${results.errors.length}`);

        if (results.errors.length > 0) {
            console.log('\nError Summary:');
            results.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }

        return NextResponse.json({
            ...results,
            summary: {
                totalRecords,
                errorCount: results.errors.length,
                recordsByType: {
                    cycles: results.newCycles,
                    sleep: results.newSleep,
                    recovery: results.newRecovery,
                    workouts: results.newWorkouts
                }
            }
        });
    } catch (error) {
        console.error('Collection failed catastrophically:', error);
        return NextResponse.json({
            error: 'Collection failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'WHOOP V2 Data Collector',
        description: 'Advanced collector using hybrid strategy for cycles and paginated endpoints for other data',
        details: [
            'Cycles: Two-phase collection (pagination + individual fetching)',
            'Sleep: Paginated collection',
            'Recovery: Paginated collection & relationship mapping',
            'Workouts: Paginated collection'
        ],
        usage: 'POST with {"mode": "historical"} for all data or {"mode": "daily"} for recent data'
    });
}
