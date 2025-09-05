import { sql } from './db';
import type {
    WhoopProfile,
    WhoopCycle,
    WhoopSleep,
    WhoopRecovery,
    WhoopWorkout
} from '@/types/whoop';
import type { WhoopTokens } from '@/lib/services/token-refresh-service';

export class WhoopDatabaseService {
    // User operations
    async upsertUser(user: WhoopProfile, db = sql): Promise<void> {
        const userId = parseInt(user.user_id, 10);
        await db`
            INSERT INTO whoop_users (id, email, first_name, last_name, updated_at)
            VALUES (${userId}, ${user.email}, ${user.first_name}, ${user.last_name}, NOW())
            ON CONFLICT (id)
            DO UPDATE SET
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                updated_at = NOW();
        `;
    }

    // User operations with tokens
    async upsertUserWithTokens(user: WhoopProfile, tokens?: WhoopTokens, db = sql): Promise<void> {
        const userId = parseInt(user.user_id, 10);
        
        if (tokens) {
            await db`
                INSERT INTO whoop_users (
                    id, email, first_name, last_name, 
                    access_token, refresh_token, token_expires_at, updated_at
                )
                VALUES (
                    ${userId}, ${user.email}, ${user.first_name}, ${user.last_name},
                    ${tokens.accessToken}, ${tokens.refreshToken}, ${tokens.expiresAt.toISOString()}, NOW()
                )
                ON CONFLICT (id)
                DO UPDATE SET
                    email = EXCLUDED.email,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    access_token = EXCLUDED.access_token,
                    refresh_token = EXCLUDED.refresh_token,
                    token_expires_at = EXCLUDED.token_expires_at,
                    updated_at = NOW();
            `;
        } else {
            // Just update user info, preserve existing tokens
            await this.upsertUser(user, db);
        }
    }

    // Update tokens only (without profile requirement)
    async updateUserTokens(userId: number, tokens: WhoopTokens, db = sql): Promise<void> {
        await db`
            UPDATE whoop_users 
            SET 
                access_token = ${tokens.accessToken},
                refresh_token = ${tokens.refreshToken},
                token_expires_at = ${tokens.expiresAt.toISOString()},
                updated_at = NOW()
            WHERE id = ${userId}
        `;
    }

    // Get user tokens
    async getUserTokens(userId: number, db = sql): Promise<WhoopTokens | null> {
        const result = await db`
            SELECT access_token, refresh_token, token_expires_at
            FROM whoop_users 
            WHERE id = ${userId} AND refresh_token IS NOT NULL
        `;

        if (result.rows.length === 0 || !result.rows[0].access_token) {
            return null;
        }

        const row = result.rows[0];
        return {
            accessToken: row.access_token,
            refreshToken: row.refresh_token,
            expiresAt: new Date(row.token_expires_at),
        };
    }

    // Get all users with tokens (for cron jobs) - use after token refresh
    async getAllUsersWithTokens(db = sql): Promise<Array<{ 
        id: number; 
        email: string; 
        first_name: string; 
        last_name: string;
        access_token?: string;
        refresh_token?: string;
        token_expires_at?: Date;
    }>> {
        const result = await db`
            SELECT id, email, first_name, last_name, access_token, refresh_token, token_expires_at
            FROM whoop_users 
            WHERE refresh_token IS NOT NULL
            ORDER BY id
        `;

        return result.rows.map(row => ({
            id: row.id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
            access_token: row.access_token,
            refresh_token: row.refresh_token,
            token_expires_at: row.token_expires_at ? new Date(row.token_expires_at) : undefined,
        }));
    }

    // Cycle operations
    async upsertCycle(cycle: WhoopCycle, db = sql): Promise<void> {
        if (!cycle.score) {
            console.warn(`Skipping cycle ${cycle.id} due to missing score data.`);
            return;
        }
        await db`
            INSERT INTO whoop_cycles (
                id, user_id, start_time, end_time, timezone_offset,
                score_state, strain, kilojoule, average_heart_rate, max_heart_rate
            )
            VALUES (
                ${cycle.id}, ${cycle.user_id}, ${cycle.start}, ${cycle.end},
                ${cycle.timezone_offset}, ${cycle.score_state}, ${cycle.score.strain},
                ${cycle.score.kilojoule}, ${cycle.score.average_heart_rate}, ${cycle.score.max_heart_rate}
            )
            ON CONFLICT (id)
            DO UPDATE SET
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time,
                timezone_offset = EXCLUDED.timezone_offset,
                score_state = EXCLUDED.score_state,
                strain = EXCLUDED.strain,
                kilojoule = EXCLUDED.kilojoule,
                average_heart_rate = EXCLUDED.average_heart_rate,
                max_heart_rate = EXCLUDED.max_heart_rate;
        `;
    }

    // Sleep operations
    async upsertSleep(sleep: WhoopSleep, cycleId?: number, db = sql): Promise<void> {
        const hasScore = sleep.score && sleep.score_state === 'SCORED';
        const stageSum = hasScore && sleep.score ? sleep.score.stage_summary : null;

        await db`
            INSERT INTO whoop_sleep (
                id, activity_v1_id, user_id, cycle_id, start_time, end_time, timezone_offset,
                nap, score_state, sleep_performance_percentage, respiratory_rate,
                sleep_consistency_percentage, sleep_efficiency_percentage,
                total_in_bed_time_milli, total_awake_time_milli, total_light_sleep_time_milli,
                total_slow_wave_sleep_time_milli, total_rem_sleep_time_milli, disturbance_count
            )
            VALUES (
                ${sleep.id}, ${sleep.v1_id || null}, ${sleep.user_id}, ${cycleId || null},
                ${sleep.start}, ${sleep.end}, ${sleep.timezone_offset}, ${sleep.nap}, ${sleep.score_state},
                ${hasScore && sleep.score ? sleep.score.sleep_performance_percentage : null},
                ${hasScore && sleep.score ? sleep.score.respiratory_rate : null},
                ${hasScore && sleep.score ? sleep.score.sleep_consistency_percentage : null},
                ${hasScore && sleep.score ? sleep.score.sleep_efficiency_percentage : null},
                ${stageSum ? stageSum.total_in_bed_time_milli : null},
                ${stageSum ? stageSum.total_awake_time_milli : null},
                ${stageSum ? stageSum.total_light_sleep_time_milli : null},
                ${stageSum ? stageSum.total_slow_wave_sleep_time_milli : null},
                ${stageSum ? stageSum.total_rem_sleep_time_milli : null},
                ${stageSum ? stageSum.disturbance_count : null}
            )
            ON CONFLICT (id)
            DO UPDATE SET
                activity_v1_id = EXCLUDED.activity_v1_id,
                cycle_id = EXCLUDED.cycle_id,
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
    }

    // Recovery operations
    async upsertRecovery(recovery: WhoopRecovery, db = sql): Promise<void> {
        if (!recovery.score) {
            console.warn(`Skipping recovery for cycle ${recovery.cycle_id} - no score data`);
            return;
        }
        await db`
            INSERT INTO whoop_recovery (
                cycle_id, sleep_id, user_id, score_state, recovery_score,
                resting_heart_rate, hrv_rmssd_milli, spo2_percentage, skin_temp_celsius
            )
            VALUES (
                ${recovery.cycle_id}, ${recovery.sleep_id}, ${recovery.user_id},
                ${recovery.score_state}, ${recovery.score.recovery_score || null},
                ${recovery.score.resting_heart_rate || null}, ${recovery.score.hrv_rmssd_milli || null},
                ${recovery.score.spo2_percentage || null}, ${recovery.score.skin_temp_celsius || null}
            )
            ON CONFLICT (cycle_id)
            DO UPDATE SET
                sleep_id = EXCLUDED.sleep_id,
                score_state = EXCLUDED.score_state,
                recovery_score = EXCLUDED.recovery_score,
                resting_heart_rate = EXCLUDED.resting_heart_rate,
                hrv_rmssd_milli = EXCLUDED.hrv_rmssd_milli,
                spo2_percentage = EXCLUDED.spo2_percentage,
                skin_temp_celsius = EXCLUDED.skin_temp_celsius;
        `;
    }

    // Workout operations
    async upsertWorkout(workout: WhoopWorkout, db = sql): Promise<void> {
        await db`
            INSERT INTO whoop_workouts (
                id, activity_v1_id, user_id, start_time, end_time, timezone_offset, sport_id, sport_name,
                score_state, strain, average_heart_rate, max_heart_rate, kilojoule,
                distance_meter, altitude_gain_meter, altitude_change_meter,
                zone_zero_milli, zone_one_milli, zone_two_milli, zone_three_milli,
                zone_four_milli, zone_five_milli
            )
            VALUES (
                ${workout.id}, ${workout.v1_id || null}, ${workout.user_id}, ${workout.start}, ${workout.end},
                ${workout.timezone_offset}, ${workout.sport_id}, ${workout.sport_name || null}, ${workout.score_state},
                ${workout.score?.strain || null}, ${workout.score?.average_heart_rate || null},
                ${workout.score?.max_heart_rate || null}, ${workout.score?.kilojoule || null},
                ${workout.score?.distance_meter || null}, ${workout.score?.altitude_gain_meter || null},
                ${workout.score?.altitude_change_meter || null}, ${workout.score?.zone_duration?.zone_zero_milli || null},
                ${workout.score?.zone_duration?.zone_one_milli || null}, ${workout.score?.zone_duration?.zone_two_milli || null},
                ${workout.score?.zone_duration?.zone_three_milli || null}, ${workout.score?.zone_duration?.zone_four_milli || null},
                ${workout.score?.zone_duration?.zone_five_milli || null}
            )
            ON CONFLICT (id)
            DO UPDATE SET
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time,
                timezone_offset = EXCLUDED.timezone_offset,
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
    }

    // Bulk operations for efficiency using transactions
    async upsertSleeps(sleeps: WhoopSleep[], cycleMap?: Map<string, number>): Promise<void> {
        if (sleeps.length === 0) return;
        // Process each sleep individually to avoid transaction complexity
        for (const sleep of sleeps) {
            // Try to find cycle_id from the map if provided
            const cycleId = cycleMap?.get(sleep.id);
            await this.upsertSleep(sleep, cycleId);
        }
    }

    async upsertCycles(cycles: WhoopCycle[]): Promise<void> {
        if (cycles.length === 0) return;
        // Process each cycle individually to avoid transaction complexity
        for (const cycle of cycles) {
            await this.upsertCycle(cycle);
        }
    }

    async upsertRecoveries(recoveries: WhoopRecovery[]): Promise<{ newRecoveryCount: number; errors: string[] }> {
        if (recoveries.length === 0) return { newRecoveryCount: 0, errors: [] };
        
        let newCount = 0;
        const errors: string[] = [];
        
        // Process each recovery individually to avoid transaction complexity
        for (const recovery of recoveries) {
            try {
                await this.upsertRecovery(recovery);
                newCount++;
            } catch (error) {
                const errorMsg = `Recovery for cycle ${recovery.cycle_id} failed, likely references a missing sleep_id: ${recovery.sleep_id}`;
                errors.push(errorMsg);
                console.warn(errorMsg);
            }
        }
        
        return { newRecoveryCount: newCount, errors };
    }

    async upsertWorkouts(workouts: WhoopWorkout[]): Promise<void> {
        if (workouts.length === 0) return;
        // Process each workout individually to avoid transaction complexity
        for (const workout of workouts) {
            await this.upsertWorkout(workout);
        }
    }

    // Get latest data timestamps for incremental sync
    async getLatestCycleDate(userId: number, db = sql): Promise<Date | null> {
        const result = await db`
            SELECT MAX(end_time) as latest_date
            FROM whoop_cycles
            WHERE user_id = ${userId};
        `;
        return result.rows[0]?.latest_date ? new Date(result.rows[0].latest_date) : null;
    }

    async getLatestWorkoutDate(userId: number, db = sql): Promise<Date | null> {
        const result = await db`
            SELECT MAX(end_time) as latest_date
            FROM whoop_workouts
            WHERE user_id = ${userId};
        `;
        return result.rows[0]?.latest_date ? new Date(result.rows[0].latest_date) : null;
    }

    // Method to update the cycle_id in sleep records using the recovery data
    async updateSleepCycleRelationships(recoveries: WhoopRecovery[]): Promise<void> {
        console.log(`Updating cycle relationships for ${recoveries.length} recovery records...`);

        // Process in batches to avoid overwhelming the database
        const batchSize = 50;
        for (let i = 0; i < recoveries.length; i += batchSize) {
            const batch = recoveries.slice(i, i + batchSize);

            // Filter out records with missing sleep_id or cycle_id
            const validRecords = batch.filter(r => r.sleep_id && r.cycle_id);

            if (validRecords.length === 0) continue;

            // Build an array of objects for the update operation
            const updateData = validRecords.map(r => ({
                sleep_id: r.sleep_id,
                cycle_id: r.cycle_id
            }));

            // Update each relationship
            try {
                for (const data of updateData) {
                    await sql`
                        UPDATE whoop_sleep
                        SET cycle_id = ${data.cycle_id}
                        WHERE id = ${data.sleep_id}
                        AND (cycle_id IS NULL OR cycle_id != ${data.cycle_id});
                    `;
                }
                console.log(`✅ Updated relationships for batch of ${validRecords.length} records`);
            } catch (error) {
                console.error('❌ Error updating sleep-cycle relationships:', error);
                throw error;
            }
        }
    }
}
