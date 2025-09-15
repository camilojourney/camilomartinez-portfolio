/**
 * WHOOP API V2 Data Collector
 *
 * Collection Strategy:
 * 1. Cycl        // Get fresh tokens for this specific user (force refresh for historical collection)
        const freshTokens = await tokenService.getFreshTokensForUser(userId, true);
        if (!freshTokens || !freshTokens.accessToken) {
            return NextResponse.json({
                success: false,
                requiresReauth: true,
                error: 'No valid access token available after refresh. Please re-authenticate.'
            }, { status: 401 });
        }o-phase collection
 *    a) Try paginated collection endpoint (limited to 25 records)
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
import { TokenRefreshService } from '@/lib/services/token-refresh-service';
import { sql } from '@/lib/db/db';
import { WhoopCycle } from '@/types/whoop';

// Authorization helper function (same as daily-fetch)
function isAuthorized(req: Request): boolean {
    const url = new URL(req.url);
    const headerSecret = req.headers.get('x-cron-secret');
    const querySecret = url.searchParams.get('secret') || url.searchParams.get('token');
    const expected = process.env.CRON_SECRET;
    return !!expected && (headerSecret === expected || querySecret === expected);
}

export async function POST(request: NextRequest) {
    // Try session-based auth first (for logged-in users)
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
    
    // If no session, check for CRON_SECRET authorization (admin access)
    const hasSession = !!sessionWithToken?.user?.id;
    const hasCronAuth = isAuthorized(request);
    
    if (!hasSession && !hasCronAuth) {
        console.warn('⚠️ No authenticated user or admin access available');
        return NextResponse.json({ 
            error: 'Not authenticated',
            message: 'Please sign in with your WHOOP account to continue.'
        }, { status: 401 });
    }
    
    console.log(`🔐 Authorization: ${hasSession ? 'User session' : 'Admin/CRON access'}`)

    try {
        const body = await request.json().catch(() => ({}));
        const mode = body.mode || 'daily';
        const isDaily = mode === 'daily';

        console.log(`🔧 Running ${mode} collection with OPTIMIZED strategy`);

        // Initialize services
        const dbService = new WhoopDatabaseService();
        const tokenService = new TokenRefreshService();

        // STEP 1: Get user ID and fresh tokens (handle both session and admin auth)
        console.log('🔄 Step 1: Getting user and refreshing tokens...');
        
        let userId: number;
        let freshTokens: any;
        
        if (hasSession) {
            // Session-based: Process specific user
            const rawId = (sessionWithToken.user as any)?.user_id ?? (sessionWithToken.user as any)?.id;
            userId = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10);
            if (!userId || Number.isNaN(userId)) {
                return NextResponse.json({
                    success: false,
                    error: 'Unable to resolve WHOOP user id from session',
                    hint: 'Re-authenticate with WHOOP so we can store your profile id',
                }, { status: 400 });
            }
            
            console.log(`👤 Processing for session user ID: ${userId}`);
            
            // Get fresh tokens for this specific user (force refresh for historical collection)
            freshTokens = await tokenService.getFreshTokensForUser(userId, true);
            if (!freshTokens || !freshTokens.accessToken) {
                throw new Error('No valid access token available after refresh - user needs to re-authenticate');
            }
        } else if (hasCronAuth) {
            // Admin access: Get first available user (for now, can be extended to all users later)
            console.log(`🔧 Admin access: Getting first available user`);
            
            // Refresh all user tokens first
            const tokenRefreshResults = await tokenService.refreshAllUserTokens();
            console.log(`Token refresh complete: ${tokenRefreshResults.successful} successful, ${tokenRefreshResults.failed} failed`);
            
            // Get all users with fresh tokens
            const allUsers = await dbService.getAllUsersWithTokens();
            console.log(`Found ${allUsers.length} users for processing`);
            
            if (allUsers.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'No users with tokens found in database. Users need to authenticate via OAuth flow first.'
                }, { status: 400 });
            }
            
            // Use first user for now (can be extended for all users)
            const firstUser = allUsers[0];
            userId = firstUser.id;
            freshTokens = { 
                accessToken: firstUser.access_token, 
                refreshToken: firstUser.refresh_token 
            };
            
            console.log(`👤 Processing for admin user ID: ${userId}`);
            console.log(`🔍 Admin token debug:`, {
                hasAccessToken: !!firstUser.access_token,
                hasRefreshToken: !!firstUser.refresh_token,
                accessTokenLength: firstUser.access_token?.length || 0,
                refreshTokenLength: firstUser.refresh_token?.length || 0,
                tokenExpiresAt: firstUser.token_expires_at
            });
        }

        console.log('✅ Fresh tokens obtained for historical collection');
        console.log('🔍 Debug token info:', { 
            hasAccessToken: !!freshTokens?.accessToken, 
            tokenLength: freshTokens?.accessToken?.length || 0,
            authMethod: hasSession ? 'session' : 'admin' 
        });

        // Validate access token before proceeding
        if (!freshTokens || !freshTokens.accessToken) {
            return NextResponse.json({
                success: false,
                error: 'No valid access token available',
                authMethod: hasSession ? 'session' : 'admin',
                debug: { freshTokens: !!freshTokens, accessToken: !!freshTokens?.accessToken }
            }, { status: 401 });
        }

        // Initialize WHOOP client with fresh token
        console.log(`🔧 Initializing WHOOP client with token (${freshTokens.accessToken.substring(0, 10)}...)`);
        const whoopClient = new WhoopV2Client(freshTokens.accessToken);

        // Get user profile first
        const userProfile = await whoopClient.getUserProfile();
        await dbService.upsertUser(userProfile);

        const results = {
            user: userProfile,
            newCycles: 0,
            newSleep: 0,
            newRecovery: 0,
            newWorkouts: 0,
            totalCycles: 0,
            totalSleep: 0,
            totalRecovery: 0,
            totalWorkouts: 0,
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

        // Phase 1: Get ALL cycles data FIRST (foundational data structure)
        try {
            console.log('\n� Phase 1: Fetching cycles from WHOOP API...');
            console.log('🔍 Retrieving complete cycle history...');
            const cycleData = await whoopClient.getAllCycles(startDate);
            
            if (cycleData.length > 0) {
                console.log(`📦 Retrieved ${cycleData.length} cycles from paginated API`);
                
                // Show complete date range
                const dates = cycleData.map(c => new Date(c.start));
                const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                console.log(`📅 Cycle data spans: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
                
                // Show ALL cycle records with dates and strain
                console.log('📋 Complete cycle dataset:');
                cycleData
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .forEach((c, index) => {
                        const startDate = new Date(c.start).toISOString().split('T')[0];
                        const endDate = new Date(c.end).toISOString().split('T')[0];
                        const strain = c.score?.strain || 'N/A';
                        console.log(`   ${String(index + 1).padStart(3, ' ')}. ${startDate} to ${endDate} - ID: ${c.id}, Strain: ${strain}`);
                    });
                
                await dbService.upsertCycles(cycleData);
                results.totalCycles = cycleData.length;
                results.newCycles = cycleData.length; // Note: First run will show all as new
                console.log(`✅ Stored ${cycleData.length} cycles processed (upsert handles duplicates)`);
            } else {
                console.log('ℹ️ No cycle data found for the specified date range');
            }
        } catch (error) {
            console.error('❌ Cycle data collection failed:', error);
            results.errors.push(`Cycles: ${error}`);
        }

        // Phase 2: Get ALL sleep data 
        try {
            console.log('\n� Phase 2: Fetching sleep data from WHOOP API...');
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
                results.totalSleep = sleepData.length;
                results.newSleep = sleepData.length; // Note: First run will show all as new
                console.log(`✅ Stored ${sleepData.length} sleep records processed (upsert handles duplicates)`);
            } else {
                console.log('ℹ️ No sleep data found for the specified date range');
            }
        } catch (error) {
            console.error('❌ Sleep data collection failed:', error);
            results.errors.push(`Sleep: ${error}`);
        }

        // Phase 3: Get ALL recovery data (now sleep data exists)
        let recoveryData;
        try {
            console.log('\n📊 Phase 3: Fetching ALL recovery data from WHOOP API...');
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
                results.totalRecovery = recoveryData.length;
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

        // Phase 4: Get ALL workout data
        try {
            console.log('\n🏋️ Phase 4: Fetching workout data from WHOOP API...');
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
                results.totalSleep = sleepData.length;
                results.newSleep = sleepData.length; // Note: First run will show all as new
                console.log(`✅ Stored ${sleepData.length} sleep records processed (upsert handles duplicates)`);
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
                    results.totalSleep = sleepData.length;
                    results.newSleep = sleepData.length; // Note: Retry showing total processed
                    console.log(`✅ Retry successful: Stored ${sleepData.length} sleep records`);
                }
            } catch (retryError) {
                console.error('❌ Sleep retry also failed:', retryError);
                results.errors.push(`Sleep: ${error}`);
                results.errors.push(`Sleep retry: ${retryError}`);
            }
        }

        // 4. Update sleep-cycle relationships using the recovery data we collected
        try {
            console.log('\n🔗 Phase 4: Updating sleep-cycle relationships...');
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
                results.totalWorkouts = workouts.length;
                results.newWorkouts = workouts.length; // Note: First run will show all as new

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
        const totalRecords = results.totalRecovery + results.totalCycles + results.totalSleep + results.totalWorkouts;

        console.log(`\n🎉 HISTORICAL COLLECTION COMPLETE!`);
        console.log(`======================================`);
        console.log(`📈 Data Summary:`);
        console.log(`   • Recovery Records: ${results.totalRecovery} processed`);
        console.log(`   • Cycle Records: ${results.totalCycles} processed`);
        console.log(`   • Sleep Records: ${results.totalSleep} processed`);
        console.log(`   • Workout Records: ${results.totalWorkouts} processed`);
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
                    cycles: results.totalCycles,
                    sleep: results.totalSleep,
                    recovery: results.totalRecovery,
                    workouts: results.totalWorkouts
                },
                newRecordsByType: {
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
