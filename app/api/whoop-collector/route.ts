import { auth } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSportName } from '@/lib/whoop-sports';

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.email || !session.accessToken) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const accessToken = session.accessToken;
        const baseUrl = 'https://api.prod.whoop.com/developer';

        let totalInserted = {
            users: 0,
            cycles: 0,
            sleep: 0,
            recovery: 0,
            workouts: 0
        };

        console.log('Starting WHOOP data collection...');

        // 1. Get user profile and upsert user
        console.log('Fetching user profile...');
        const userResponse = await fetch(`${baseUrl}/v1/user/profile/basic`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!userResponse.ok) {
            throw new Error(`User profile fetch failed: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        console.log('User data received:', userData.user_id);

        // Upsert user
        await sql`
            INSERT INTO whoop_users (id, email, first_name, last_name)
            VALUES (${userData.user_id}, ${session.user.email}, ${userData.first_name || ''}, ${userData.last_name || ''})
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name;
        `;
        totalInserted.users = 1;

        // 2. Get cycles with pagination
        console.log('Fetching cycles...');
        let allCycles: any[] = [];
        let nextToken: string | null = null;
        let pageCount = 0;
        const maxPages = 20;

        do {
            pageCount++;
            const url = nextToken
                ? `${baseUrl}/v1/cycle?limit=50&next_token=${nextToken}`
                : `${baseUrl}/v1/cycle?limit=50`;

            console.log(`Fetching cycles page ${pageCount}...`);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                console.warn(`Failed to fetch cycles page ${pageCount}: ${response.status}`);
                break;
            }

            const data = await response.json();
            if (data.records && data.records.length > 0) {
                allCycles = allCycles.concat(data.records);
                console.log(`Got ${data.records.length} cycles from page ${pageCount}`);
            }

            nextToken = data.next_token || null;
            await new Promise(resolve => setTimeout(resolve, 100));

        } while (nextToken && pageCount < maxPages);

        console.log(`Total cycles fetched: ${allCycles.length}`);

        // Process each cycle
        for (const cycle of allCycles) {
            try {
                // Insert cycle
                await sql`
                    INSERT INTO whoop_cycles (
                        id, user_id, start_time, end_time, timezone_offset,
                        score_state, strain, kilojoule, average_heart_rate, max_heart_rate
                    )
                    VALUES (
                        ${cycle.id}, ${userData.user_id}, ${cycle.start}, ${cycle.end}, ${cycle.timezone_offset},
                        ${cycle.score_state}, ${cycle.score?.strain || null}, ${cycle.score?.kilojoule || null},
                        ${cycle.score?.average_heart_rate || null}, ${cycle.score?.max_heart_rate || null}
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        start_time = EXCLUDED.start_time,
                        end_time = EXCLUDED.end_time,
                        timezone_offset = EXCLUDED.timezone_offset,
                        score_state = EXCLUDED.score_state,
                        strain = EXCLUDED.strain,
                        kilojoule = EXCLUDED.kilojoule,
                        average_heart_rate = EXCLUDED.average_heart_rate,
                        max_heart_rate = EXCLUDED.max_heart_rate;
                `;
                totalInserted.cycles++;

                // Get sleep data for this cycle
                const sleepResponse = await fetch(`${baseUrl}/v1/cycle/${cycle.id}/sleep`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (sleepResponse.ok) {
                    const sleepData = await sleepResponse.json();
                    if (sleepData.records && sleepData.records.length > 0) {
                        for (const sleep of sleepData.records) {
                            await sql`
                                INSERT INTO whoop_sleep (
                                    id, user_id, cycle_id, start_time, end_time, timezone_offset,
                                    nap, score_state, sleep_performance_percentage, respiratory_rate,
                                    sleep_consistency_percentage, sleep_efficiency_percentage,
                                    total_in_bed_time_milli, total_awake_time_milli, total_light_sleep_time_milli,
                                    total_slow_wave_sleep_time_milli, total_rem_sleep_time_milli, disturbance_count
                                )
                                VALUES (
                                    ${sleep.id}, ${userData.user_id}, ${cycle.id}, ${sleep.start}, ${sleep.end}, ${sleep.timezone_offset},
                                    ${sleep.nap}, ${sleep.score_state}, ${sleep.score?.stage_summary?.sleep_performance_percentage || null},
                                    ${sleep.score?.stage_summary?.respiratory_rate || null}, ${sleep.score?.stage_summary?.sleep_consistency_percentage || null},
                                    ${sleep.score?.stage_summary?.sleep_efficiency_percentage || null}, ${sleep.score?.stage_summary?.total_in_bed_time_milli || null},
                                    ${sleep.score?.stage_summary?.total_awake_time_milli || null}, ${sleep.score?.stage_summary?.total_light_sleep_time_milli || null},
                                    ${sleep.score?.stage_summary?.total_slow_wave_sleep_time_milli || null}, ${sleep.score?.stage_summary?.total_rem_sleep_time_milli || null},
                                    ${sleep.score?.stage_summary?.disturbance_count || null}
                                )
                                ON CONFLICT (id) DO UPDATE SET
                                    start_time = EXCLUDED.start_time,
                                    end_time = EXCLUDED.end_time,
                                    timezone_offset = EXCLUDED.timezone_offset,
                                    nap = EXCLUDED.nap,
                                    score_state = EXCLUDED.score_state,
                                    sleep_performance_percentage = EXCLUDED.sleep_performance_percentage,
                                    respiratory_rate = EXCLUDED.respiratory_rate,
                                    sleep_consistency_percentage = EXCLUDED.sleep_consistency_percentage,
                                    sleep_efficiency_percentage = EXCLUDED.sleep_efficiency_percentage,
                                    total_in_bed_time_milli = EXCLUDED.total_in_bed_time_milli,
                                    total_awake_time_milli = EXCLUDED.total_awake_time_milli,
                                    total_light_sleep_time_milli = EXCLUDED.total_light_sleep_time_milli,
                                    total_slow_wave_sleep_time_milli = EXCLUDED.total_slow_wave_sleep_time_milli,
                                    total_rem_sleep_time_milli = EXCLUDED.total_rem_sleep_time_milli,
                                    disturbance_count = EXCLUDED.disturbance_count;
                            `;
                            totalInserted.sleep++;
                        }
                    }
                }

                // Get recovery data for this cycle
                const recoveryResponse = await fetch(`${baseUrl}/v1/cycle/${cycle.id}/recovery`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (recoveryResponse.ok) {
                    const recoveryData = await recoveryResponse.json();
                    if (recoveryData.score_state) {
                        const sleepResult = await sql`
                            SELECT id FROM whoop_sleep WHERE cycle_id = ${cycle.id} LIMIT 1;
                        `;

                        await sql`
                            INSERT INTO whoop_recovery (
                                cycle_id, sleep_id, user_id, score_state, recovery_score,
                                resting_heart_rate, hrv_rmssd_milli, spo2_percentage, skin_temp_celsius
                            )
                            VALUES (
                                ${cycle.id}, ${sleepResult.rows[0]?.id || null}, ${userData.user_id}, ${recoveryData.score_state},
                                ${recoveryData.score?.recovery_score || null}, ${recoveryData.score?.resting_heart_rate || null},
                                ${recoveryData.score?.hrv_rmssd_milli || null}, ${recoveryData.score?.spo2_percentage || null},
                                ${recoveryData.score?.skin_temp_celsius || null}
                            )
                            ON CONFLICT (cycle_id) DO UPDATE SET
                                sleep_id = EXCLUDED.sleep_id,
                                user_id = EXCLUDED.user_id,
                                score_state = EXCLUDED.score_state,
                                recovery_score = EXCLUDED.recovery_score,
                                resting_heart_rate = EXCLUDED.resting_heart_rate,
                                hrv_rmssd_milli = EXCLUDED.hrv_rmssd_milli,
                                spo2_percentage = EXCLUDED.spo2_percentage,
                                skin_temp_celsius = EXCLUDED.skin_temp_celsius;
                        `;
                        totalInserted.recovery++;
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (cycleError) {
                console.warn(`Failed to process cycle ${cycle.id}:`, cycleError);
            }
        }

        // 3. Get workouts with pagination
        console.log('Fetching workouts...');
        let allWorkouts: any[] = [];
        nextToken = null;
        pageCount = 0;

        do {
            pageCount++;
            const url = nextToken
                ? `${baseUrl}/v1/activity/workout?limit=50&next_token=${nextToken}`
                : `${baseUrl}/v1/activity/workout?limit=50`;

            console.log(`Fetching workouts page ${pageCount}...`);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                console.warn(`Failed to fetch workouts page ${pageCount}: ${response.status}`);
                break;
            }

            const data = await response.json();
            if (data.records && data.records.length > 0) {
                allWorkouts = allWorkouts.concat(data.records);
                console.log(`Got ${data.records.length} workouts from page ${pageCount}`);
            }

            nextToken = data.next_token || null;
            await new Promise(resolve => setTimeout(resolve, 100));

        } while (nextToken && pageCount < maxPages);

        console.log(`Total workouts fetched: ${allWorkouts.length}`);

        // Process each workout
        for (const workout of allWorkouts) {
            try {
                const sportName = getSportName(workout.sport_id);

                await sql`
                    INSERT INTO whoop_workouts (
                        id, user_id, start_time, end_time, timezone_offset, sport_id, sport_name, score_state,
                        strain, average_heart_rate, max_heart_rate, kilojoule, distance_meter,
                        altitude_gain_meter, altitude_change_meter, zone_zero_milli, zone_one_milli,
                        zone_two_milli, zone_three_milli, zone_four_milli, zone_five_milli
                    )
                    VALUES (
                        ${workout.id}, ${userData.user_id}, ${workout.start}, ${workout.end}, ${workout.timezone_offset},
                        ${workout.sport_id}, ${sportName}, ${workout.score_state}, ${workout.score?.strain || null},
                        ${workout.score?.average_heart_rate || null}, ${workout.score?.max_heart_rate || null},
                        ${workout.score?.kilojoule || null}, ${workout.score?.distance_meter || null},
                        ${workout.score?.altitude_gain_meter || null}, ${workout.score?.altitude_change_meter || null},
                        ${workout.score?.zone_duration?.zone_zero_milli || null}, ${workout.score?.zone_duration?.zone_one_milli || null},
                        ${workout.score?.zone_duration?.zone_two_milli || null}, ${workout.score?.zone_duration?.zone_three_milli || null},
                        ${workout.score?.zone_duration?.zone_four_milli || null}, ${workout.score?.zone_duration?.zone_five_milli || null}
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        start_time = EXCLUDED.start_time,
                        end_time = EXCLUDED.end_time,
                        timezone_offset = EXCLUDED.timezone_offset,
                        sport_id = EXCLUDED.sport_id,
                        sport_name = EXCLUDED.sport_name,
                        score_state = EXCLUDED.score_state,
                        strain = EXCLUDED.strain,
                        average_heart_rate = EXCLUDED.average_heart_rate,
                        max_heart_rate = EXCLUDED.max_heart_rate,
                        kilojoule = EXCLUDED.kilojoule,
                        distance_meter = EXCLUDED.distance_meter,
                        altitude_gain_meter = EXCLUDED.altitude_gain_meter,
                        altitude_change_meter = EXCLUDED.altitude_change_meter,
                        zone_zero_milli = EXCLUDED.zone_zero_milli,
                        zone_one_milli = EXCLUDED.zone_one_milli,
                        zone_two_milli = EXCLUDED.zone_two_milli,
                        zone_three_milli = EXCLUDED.zone_three_milli,
                        zone_four_milli = EXCLUDED.zone_four_milli,
                        zone_five_milli = EXCLUDED.zone_five_milli;
                `;
                totalInserted.workouts++;
            } catch (workoutError) {
                console.warn(`Failed to process workout ${workout.id}:`, workoutError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'WHOOP data collection completed successfully',
            stats: {
                usersInserted: totalInserted.users,
                cyclesInserted: totalInserted.cycles,
                sleepInserted: totalInserted.sleep,
                recoveryInserted: totalInserted.recovery,
                workoutsInserted: totalInserted.workouts,
                totalPages: pageCount
            }
        });

    } catch (error) {
        console.error('WHOOP data collection error:', error);
        return NextResponse.json({
            error: 'Data collection failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
