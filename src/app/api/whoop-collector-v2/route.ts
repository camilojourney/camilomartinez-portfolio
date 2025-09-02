/**
 * WHOOP API V2 Data Collector
 *
 * Collection Strategy:
 * 1. Cycles: Two-phase collection
 *    a) Try paginated        // 2. Collect ALL cycles using two-phase strategy
            // 2. Collect ALL cycles using two-phase strategy
        let cycles: WhoopCycle[] = [];
        try        try {
            console.log('💤 Phase 3: Fetching sleep data from WHOOP API...');
            console.log('🔍 Retrieving complete sleep history...');
            const sleepData = await whoopClient.getAllSleep(startDate);
            
            if (sleepData.length > 0) {
                console.log(`📦 Retrieved ${sleepData.length} sleep records from API`);
                
                // Show complete date range
                const dates = sleepData.map(s => new Date(s.start));
                const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                console.log(`📅 Sleep data spans: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
                
                await dbService.upsertSleeps(sleepData);
                results.newSleep = sleepData.length;
                console.log(`✅ Stored ${sleepData.length} sleep records (note: upsert doesn't track duplicates for sleep)`);
            } else {
                console.log('ℹ️ No sleep data found for the specified date range');
            }
        } catch (error) {
            console.error('❌ Sleep data collection failed:', error);
            console.log('🔄 Retrying sleep collection with smaller date range...');
            
            // Retry with a more recent date range to avoid timeout
            try {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                const recentStartDate = threeMonthsAgo.toISOString();
                
                console.log(`🔄 Retry: Fetching sleep data from ${recentStartDate}...`);
                const sleepData = await whoopClient.getAllSleep(recentStartDate);
                
                if (sleepData.length > 0) {
                    console.log(`📦 Retry retrieved ${sleepData.length} sleep records`);
                    await dbService.upsertSleeps(sleepData);
                    results.newSleep = sleepData.length;
                    console.log(`✅ Retry successful: Stored ${sleepData.length} sleep records`);
                }
            } catch (retryError) {
                console.error('❌ Sleep retry also failed:', retryError);
                results.errors.push(`Sleep: ${error}`);
                results.errors.push(`Sleep retry: ${retryError}`);
            }
        }onsole.log('\n🔄 Phase 2: Fetching cycles from WHOOP API...');
            console.log('🔍 Retrieving complete cycle history...');
            cycles = await whoopClient.getAllCycles(startDate);
            
            if (cycles.length > 0) {
                console.log(`📦 Retrieved ${cycles.length} cycles from paginated API`);
                
                // Show complete date range
                const dates = cycles.map(c => new Date(c.start));
                const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                console.log(`📅 Cycle data spans: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
                
                // Show ALL cycle records with dates and strain
                console.log('📋 Complete cycle dataset:');
                cycles
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .forEach((c, index) => {
                        const startDate = new Date(c.start).toISOString().split('T')[0];
                        const endDate = c.end ? new Date(c.end).toISOString().split('T')[0] : 'ongoing';
                        const strain = c.score?.strain || 'N/A';
                        console.log(`   ${String(index + 1).padStart(3, ' ')}. ${startDate} to ${endDate} - ID: ${c.id}, Strain: ${strain}`);
                    });
                
                await dbService.upsertCycles(cycles);
                results.newCycles = cycles.length;
                console.log(`✅ Stored ${cycles.length} cycles (note: upsert doesn't track duplicates for cycles)`);
            }es: WhoopCycle[] = [];
               // 3. Get ALL sleep data via collection endpoint
        try {
            console.log('\n💤 Phase 3: Fetching sleep data from WHOOP API...');
            console.log('🔍 Retrieving complete sleep history...');
            const sleepData = await whoopClient.getAllSleep(startDate);
            
            if (sleepData.length > 0) {
                console.log(`📦 Retrieved ${sleepData.length} sleep records from API`);
                
                // Show complete date range
                const dates = sleepData.map(s => new Date(s.start));
                const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                console.log(`📅 Sleep data spans: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
                
                // Show ALL sleep records with dates and performance
                console.log('📋 Complete sleep dataset:');
                sleepData
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .forEach((s, index) => {
                        const startDate = new Date(s.start).toISOString().split('T')[0];
                        const endDate = new Date(s.end).toISOString().split('T')[0];
                        const performance = s.score?.sleep_performance_percentage || 'N/A';
                        const nap = s.nap ? ' (NAP)' : '';
                        console.log(`   ${String(index + 1).padStart(3, ' ')}. ${startDate} to ${endDate} - ID: ${s.id}, Performance: ${performance}%${nap}`);
                    });
                
                await dbService.upsertSleeps(sleepData);
                results.newSleep = sleepData.length;
                console.log(`✅ Stored ${sleepData.length} sleep records (note: upsert doesn't track duplicates for sleep)`);
            } else {
                console.log('ℹ️ No sleep data found for the specified date range');
            }      console.log('\n🔄 Phase 2: Fetching cycles from WHOOP API...');
            console.log('🔍 Searching for cycle data across all months...');
            cycles = await whoopClient.getAllCycles(startDate);
            
            if (cycles.length > 0) {
                console.log(`📦 Retrieved ${cycles.length} cycles from paginated API`);
                
                // Show date range of cycle data
                const dates = cycles.map(c => new Date(c.start));
                const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                console.log(`📅 Cycle data spans: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
                
                // Show monthly breakdown
                const monthlyBreakdown = cycles.reduce((acc, c) => {
                    const month = new Date(c.start).toISOString().slice(0, 7); // YYYY-MM
                    acc[month] = (acc[month] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
                
                console.log('📊 Monthly cycle breakdown:');
                Object.entries(monthlyBreakdown)
                    .sort()
                    .forEach(([month, count]) => {
                        console.log(`   ${month}: ${count} cycles`);
                    });
                
                await dbService.upsertCycles(cycles);
                results.newCycles = cycles.length;
                console.log(`✅ Stored ${cycles.length} cycles (note: upsert doesn't track duplicates for cycles)`);
            }oint (limited to 25 records)
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
import { sql } from '@/lib/db/db';
import { WhoopCycle } from '@/types/whoop';

export async function POST(request: NextRequest) {
    const session = await auth();
    const sessionWithToken = session as typeof session & { accessToken?: string; error?: string };
    
    // Check for session errors (like refresh token issues)
    if (sessionWithToken?.error === 'RefreshAccessTokenError') {
        console.warn('⚠️ Refresh token error detected - user needs to re-authenticate');
        return NextResponse.json({ 
            error: 'Authentication expired', 
            message: 'Your WHOOP connection has expired. Please sign in again.',
            requiresReauth: true 
        }, { status: 401 });
    }
    
    if (!sessionWithToken?.accessToken) {
        console.warn('⚠️ No access token available');
        return NextResponse.json({ 
            error: 'Not authenticated',
            message: 'Please sign in with your WHOOP account to continue.'
        }, { status: 401 });
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
            // For historical collection, start from much earlier date to get ALL data
            // WHOOP API requires explicit start date - without it, only returns recent data
            // Try 1 year back to see if we can get more historical data
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            startDate = oneYearAgo.toISOString();
        }

        console.log('🔧 Running historical collection with OPTIMIZED strategy');
        console.log(`📅 Collection mode: ${mode}, Start date: ${startDate || 'ALL HISTORY'}`);
        console.log(`📆 Specific start date: ${startDate ? new Date(startDate).toLocaleDateString() : 'No limit'}`);
        console.log(`🔍 Raw startDate value: ${startDate}`);
        console.log(`🎯 Target: Complete historical dataset - showing ALL data retrieved`);
        console.log(`⏱️  Real-time progress will be shown below...`);

        // 1. Get ALL recovery data first (needed for cycle relationship mapping)
        let recoveryData;
        try {
            console.log('\n📊 Phase 1: Fetching ALL recovery data from WHOOP API...');
            console.log('🔍 Retrieving complete recovery history...');
            recoveryData = await whoopClient.getAllRecovery(startDate);
            
            if (recoveryData.length > 0) {
                console.log(`📦 Retrieved ${recoveryData.length} recovery records from API`);
                
                // Show complete date range
                const dates = recoveryData.map(r => new Date(r.created_at || Date.now()));
                const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                console.log(`📅 Recovery data spans: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
                
                // Show ALL recovery records with dates and scores
                console.log('📋 Complete recovery dataset:');
                recoveryData
                    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
                    .forEach((r, index) => {
                        const date = new Date(r.created_at || Date.now()).toISOString().split('T')[0];
                        const score = r.score?.recovery_score || 'N/A';
                        console.log(`   ${String(index + 1).padStart(3, ' ')}. ${date} - Cycle: ${r.cycle_id}, Score: ${score}`);
                    });
                
                const { newRecoveryCount, errors } = await dbService.upsertRecoveries(recoveryData);
                results.newRecovery = newRecoveryCount;
                
                if (errors.length > 0) {
                    results.errors.push(...errors);
                    console.log(`⚠️ ${errors.length} recovery records had issues (likely missing sleep dependencies)`);
                }
                
                console.log(`✅ Stored ${newRecoveryCount} NEW recovery records (${recoveryData.length - newRecoveryCount} were duplicates)`);
            } else {
                console.log('ℹ️ No recovery data found for the specified date range');
            }
        } catch (error) {
            console.error('❌ Recovery data collection failed:', error);
            results.errors.push(`Recovery: ${error}`);
            throw new Error('Recovery data collection failed - required for cycle mapping');
        }

        // 2. Collect ALL cycles using two-phase strategy
        let cycles: WhoopCycle[] = [];
        try {
            console.log('� Phase 2: Fetching cycles from WHOOP API...');
            cycles = await whoopClient.getAllCycles(startDate);
            
            if (cycles.length > 0) {
                console.log(`📦 Retrieved ${cycles.length} cycles from paginated API`);
                await dbService.upsertCycles(cycles);
                results.newCycles = cycles.length;
                console.log(`✅ Stored ${cycles.length} cycles (note: upsert doesn't track duplicates for cycles)`);
            }

            // Phase 2: Use recovery data to find and fetch any missing cycles
            const recoveredCycleIds = Array.from(new Set(recoveryData.map(r => r.cycle_id))) as number[];
            const knownCycleIds = cycles.map(c => c.id);
            const missingCycleIds = recoveredCycleIds.filter(id => !knownCycleIds.includes(id));

            if (missingCycleIds.length > 0) {
                console.log(`� Phase 2b: Found ${missingCycleIds.length} additional cycle IDs from recovery data`);
                console.log(`📦 Fetching individual cycles by ID...`);
                
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

                            // Progress update every 10 cycles or key milestones
                            if (successCount % 10 === 0 || successCount === missingCycleIds.length) {
                                const progress = Math.round((successCount / missingCycleIds.length) * 100);
                                console.log(`⚡ Progress: ${progress}% (${successCount}/${missingCycleIds.length} individual cycles fetched)`);
                            }
                        } catch (error) {
                            attempts++;
                            if (attempts === maxRetries) {
                                console.error(`❌ Failed to fetch cycle ${cycleId} after ${maxRetries} attempts`);
                                results.errors.push(`Cycle ${cycleId}: Failed after ${maxRetries} attempts`);
                            } else {
                                retryCount++;
                                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                            }
                        }
                    }
                }

                const failedCount = missingCycleIds.length - successCount;
                console.log(`✅ Individual cycle fetching complete:`);
                console.log(`   - Successfully fetched: ${successCount}/${missingCycleIds.length}`);
                if (failedCount > 0) console.log(`   - Failed: ${failedCount}`);
                if (retryCount > 0) console.log(`   - Total retries needed: ${retryCount}`);
            } else {
                console.log(`✅ All cycles already fetched via pagination - no additional cycles needed`);
            }

            console.log(`🎯 Total cycles processed: ${results.newCycles}`);
        } catch (error) {
            console.error('❌ Cycle collection failed:', error);
            results.errors.push(`Cycles: ${error}`);
        }

        // 3. Get ALL sleep data via collection endpoint
        try {
            console.log('� Phase 3: Fetching sleep data from WHOOP API...');
            const sleepData = await whoopClient.getAllSleep(startDate);
            
            if (sleepData.length > 0) {
                console.log(`📦 Retrieved ${sleepData.length} sleep records from API`);
                await dbService.upsertSleeps(sleepData);
                results.newSleep = sleepData.length;
                console.log(`✅ Stored ${sleepData.length} sleep records (note: upsert doesn't track duplicates for sleep)`);
            } else {
                console.log('ℹ️ No sleep data found for the specified date range');
            }
        } catch (error) {
            console.error('❌ Sleep data collection failed:', error);
            results.errors.push(`Sleep: ${error}`);
        }

        // 4. Update sleep-cycle relationships using the recovery data we collected
        try {
            console.log('� Phase 4: Updating sleep-cycle relationships...');
            await dbService.updateSleepCycleRelationships(recoveryData);
            console.log('✅ Sleep-cycle relationships updated successfully');
        } catch (error) {
            console.error('❌ Relationship mapping failed:', error);
            results.errors.push(`Relationship mapping: ${error}`);
        }

        // 5. Get ALL workout data via collection endpoint
        try {
            console.log('\n🏋️ Phase 5: Fetching workout data from WHOOP API...');
            console.log('🔍 Retrieving complete workout history...');
            const workouts = await whoopClient.getAllWorkouts(startDate);
            
            if (workouts.length > 0) {
                console.log(`📦 Retrieved ${workouts.length} workout records from API`);
                
                // Show complete date range
                const dates = workouts.map(w => new Date(w.start));
                const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                console.log(`📅 Workout data spans: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
                
                // Show ALL workout records with dates, sport, and strain
                console.log('📋 Complete workout dataset:');
                workouts
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .forEach((w, index) => {
                        const startDate = new Date(w.start).toISOString().split('T')[0];
                        const endDate = new Date(w.end).toISOString().split('T')[0];
                        const sport = w.sport_name || 'Unknown';
                        const strain = w.score?.strain || 'N/A';
                        console.log(`   ${String(index + 1).padStart(3, ' ')}. ${startDate} to ${endDate} - ${sport}, Strain: ${strain}`);
                    });

                // Categorize workouts by data completeness for insights
                const complete = workouts.filter(w => w.score?.strain && w.score?.average_heart_rate);
                const partialScore = workouts.filter(w => w.score && (!w.score.strain || !w.score.average_heart_rate));
                const noScore = workouts.filter(w => !w.score);

                await dbService.upsertWorkouts(workouts);
                results.newWorkouts = workouts.length;

                console.log(`✅ Stored ${workouts.length} workout records:`);
                console.log(`   - ${complete.length} with complete data`);
                console.log(`   - ${partialScore.length} with partial score data`);
                console.log(`   - ${noScore.length} without score data`);

                // Add workout stats to results for dashboard
                Object.assign(results, {
                    workoutStats: {
                        total: workouts.length,
                        withCompleteData: complete.length,
                        withPartialData: partialScore.length,
                        withoutScore: noScore.length,
                        dataQualityRate: Math.round((complete.length / workouts.length) * 100) + '%'
                    }
                });
            } else {
                console.log('ℹ️ No workout data found for the specified date range');
            }
        } catch (error) {
            console.error('❌ Workout collection failed:', error);
            results.errors.push(`Workouts: ${error}`);
        }

        // Final summary with clear totals
        const totalRecords = results.newCycles + results.newSleep + results.newRecovery + results.newWorkouts;

        console.log(`\n🎉 HISTORICAL COLLECTION COMPLETE!`);
        console.log(`======================================`);
        console.log(`📈 Data Summary:`);
        console.log(`   • Recovery Records: ${results.newRecovery} processed`);
        console.log(`   • Cycle Records: ${results.newCycles} processed`);
        console.log(`   • Sleep Records: ${results.newSleep} processed`);
        console.log(`   • Workout Records: ${results.newWorkouts} processed`);
        console.log(`======================================`);
        console.log(`📊 Total Records: ${totalRecords}`);
        
        // Analyze collection quality
        if (results.newSleep === 0) {
            console.log(`\n⚠️  COLLECTION ANALYSIS:`);
            console.log(`❌ No sleep records collected - this may cause recovery relationship issues`);
            console.log(`💡 Recommendation: Run collection again or check WHOOP API sleep endpoint`);
        }
        
        if (results.errors.length > 0) {
            console.log(`\n🔍 ERROR ANALYSIS:`);
            const recoveryErrors = results.errors.filter(e => e.includes('Recovery'));
            const sleepErrors = results.errors.filter(e => e.includes('Sleep'));
            
            if (sleepErrors.length > 0) {
                console.log(`💤 Sleep Collection Issues: ${sleepErrors.length} errors`);
                console.log(`   - Primary cause: Connection timeouts or API limits`);
                console.log(`   - Impact: Missing sleep references in recovery data`);
            }
            
            if (recoveryErrors.length > 0) {
                console.log(`📊 Recovery Relationship Issues: ${recoveryErrors.length} warnings`);
                console.log(`   - Primary cause: Sleep records not collected first`);
                console.log(`   - Solution: Sleep data will be collected on next run`);
            }
        }
        // Add Missing Data Analysis
        console.log(`\n🔍 MISSING DATA ANALYSIS:`);
        console.log(`======================================`);
        
        try {
            // Get all dates from cycles (most reliable for daily tracking)
            const allCycles = await sql`
                SELECT DISTINCT DATE(start_time) as cycle_date 
                FROM whoop_cycles 
                WHERE start_time IS NOT NULL 
                ORDER BY cycle_date ASC
            `;
            
            if (allCycles.rows && allCycles.rows.length > 0) {
                const firstRow = allCycles.rows[0] as any;
                const lastRow = allCycles.rows[allCycles.rows.length - 1] as any;
                
                console.log(`🔍 First row cycle_date: "${firstRow.cycle_date}"`);
                console.log(`🔍 Last row cycle_date: "${lastRow.cycle_date}"`);
                
                const firstDate = new Date(firstRow.cycle_date);
                const lastDate = new Date(lastRow.cycle_date);
                
                // Check if dates are valid
                if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
                    console.log(`❌ Invalid date format in database`);
                    return;
                }
                
                console.log(`📅 Data Range: ${firstDate.toISOString().split('T')[0]} to ${lastDate.toISOString().split('T')[0]}`);
                console.log(`📈 Total Days Covered: ${allCycles.rows.length} days`);
                
                // Calculate expected days
                const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const missingDays = daysDiff - allCycles.rows.length;
                
                console.log(`🎯 Expected Days: ${daysDiff} days`);
                console.log(`❌ Missing Days: ${missingDays} days`);
                
                if (missingDays > 0) {
                    // Find missing date ranges
                    const existingDates = new Set(allCycles.rows.map((row: any) => row.cycle_date));
                    const missingRanges: string[] = [];
                    let currentMissingStart: Date | null = null;
                    
                    // Check each day in the range
                    const currentDate = new Date(firstDate);
                    while (currentDate <= lastDate) {
                        const dateStr = currentDate.toISOString().split('T')[0];
                        
                        if (!existingDates.has(dateStr)) {
                            // This day is missing
                            if (!currentMissingStart) {
                                currentMissingStart = new Date(currentDate);
                            }
                        } else {
                            // This day exists, close any open missing range
                            if (currentMissingStart) {
                                const endDate = new Date(currentDate);
                                endDate.setDate(endDate.getDate() - 1);
                                
                                if (currentMissingStart.getTime() === endDate.getTime()) {
                                    missingRanges.push(currentMissingStart.toISOString().split('T')[0]);
                                } else {
                                    missingRanges.push(`${currentMissingStart.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
                                }
                                currentMissingStart = null;
                            }
                        }
                        
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    
                    // Close any final missing range
                    if (currentMissingStart) {
                        const endDate = new Date(lastDate);
                        if (currentMissingStart.getTime() === endDate.getTime()) {
                            missingRanges.push(currentMissingStart.toISOString().split('T')[0]);
                        } else {
                            missingRanges.push(`${currentMissingStart.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
                        }
                    }
                    
                    console.log(`\n📋 Missing Date Ranges:`);
                    missingRanges.forEach((range, index) => {
                        console.log(`   ${index + 1}. ${range}`);
                    });
                } else {
                    console.log(`✅ No missing days - complete data coverage!`);
                }
            } else {
                console.log(`⚠️ No cycle data found in database`);
            }
        } catch (error) {
            console.log(`❌ Error analyzing missing data: ${error}`);
        }
        
        console.log(`======================================`);
        
        if (results.errors.length > 0) {
            console.log(`⚠️ Warnings/Issues: ${results.errors.length}`);
            console.log(`   (These are typically normal - duplicate records, missing relationships, etc.)`);
        } else {
            console.log(`✅ No issues encountered`);
        }
        
        console.log(`🎯 Collection strategy: ${mode.toUpperCase()}`);
        console.log(`⏰ Completed at: ${new Date().toLocaleString()}`);
        console.log(`======================================\n`);

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
