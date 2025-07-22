import { sql } from './db';
import {
    WhoopUser,
    WhoopCycle,
    WhoopSleep,
    WhoopRecovery,
    WhoopWorkout
} from '../types/whoop';

export class WhoopDatabaseService {

    // User operations
    async upsertUser(user: WhoopUser): Promise<void> {
        await sql`
            INSERT INTO whoop_users (id, email, first_name, last_name)
            VALUES (${user.user_id}, ${user.email}, ${user.first_name}, ${user.last_name})
            ON CONFLICT (id)
            DO UPDATE SET
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name;
        `;
    }

    // Cycle operations
    async upsertCycle(cycle: WhoopCycle) {
        if (!cycle.score) {
            console.warn(`Skipping cycle ${cycle.id} due to missing score data.`);
            return;
        }
        return sql`
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
    private async upsertSleep(sleep: WhoopSleep, cycleId?: number) {
        const hasScore = sleep.score && sleep.score_state === 'SCORED';
        const stageSum = hasScore && sleep.score ? sleep.score.stage_summary : null;

        return sql`
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
    private async upsertRecovery(recovery: WhoopRecovery) {
        if (!recovery.score) {
            console.warn(`Skipping recovery for cycle ${recovery.cycle_id} - no score data`);
            return;
        }
        return sql`
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
    private async upsertWorkout(workout: WhoopWorkout) {
        if (!workout.score) {
            console.warn(`Skipping workout ${workout.id} - no score data`);
            return;
        }
        return sql`
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
                ${workout.score.strain || null}, ${workout.score.average_heart_rate || null},
                ${workout.score.max_heart_rate || null}, ${workout.score.kilojoule || null},
                ${workout.score.distance_meter || null}, ${workout.score.altitude_gain_meter || null},
                ${workout.score.altitude_change_meter || null}, ${workout.score.zone_duration?.zone_zero_milli || null},
                ${workout.score.zone_duration?.zone_one_milli || null}, ${workout.score.zone_duration?.zone_two_milli || null},
                ${workout.score.zone_duration?.zone_three_milli || null}, ${workout.score.zone_duration?.zone_four_milli || null},
                ${workout.score.zone_duration?.zone_five_milli || null}
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
        const db = await sql.connect();
        try {
            await db.query('BEGIN');
            await Promise.all(sleeps.map(sleep => {
                // Try to find cycle_id from the map if provided
                const cycleId = cycleMap?.get(sleep.id);
                return this.upsertSleep(sleep, cycleId);
            }));
            await db.query('COMMIT');
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    async upsertCycles(cycles: WhoopCycle[]): Promise<void> {
        if (cycles.length === 0) return;
        const db = await sql.connect();
        try {
            await db.query('BEGIN');
            await Promise.all(cycles.map(cycle => this.upsertCycle(cycle)));
            await db.query('COMMIT');
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    async upsertRecoveries(recoveries: WhoopRecovery[]): Promise<{ newRecoveryCount: number; errors: string[] }> {
        if (recoveries.length === 0) return { newRecoveryCount: 0, errors: [] };

        const db = await sql.connect();
        const errors: string[] = [];
        let newRecoveryCount = 0;

        try {
            await db.query('BEGIN');
            for (const recovery of recoveries) {
                try {
                    await this.upsertRecovery(recovery);
                    newRecoveryCount++;
                } catch (error) {
                    // This catches foreign key constraint errors if sleep_id doesn't exist
                    const errorMessage = `Recovery for cycle ${recovery.cycle_id} failed, likely references a missing sleep_id: ${recovery.sleep_id}`;
                    errors.push(errorMessage);
                }
            }
            await db.query('COMMIT');
        } catch (error) {
            await db.query('ROLLBACK');
            // Add a general error message if the whole transaction fails
            errors.push(`Database transaction failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            db.release();
        }
        return { newRecoveryCount, errors };
    }

    async upsertWorkouts(workouts: WhoopWorkout[]): Promise<void> {
        if (workouts.length === 0) return;
        const db = await sql.connect();
        try {
            await db.query('BEGIN');
            await Promise.all(workouts.map(workout => this.upsertWorkout(workout)));
            await db.query('COMMIT');
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    // Get latest data timestamps for incremental sync
    async getLatestCycleDate(userId: number): Promise<Date | null> {
        const result = await sql`
            SELECT MAX(end_time) as latest_date
            FROM whoop_cycles
            WHERE user_id = ${userId};
        `;
        return result.rows[0]?.latest_date ? new Date(result.rows[0].latest_date) : null;
    }

    async getLatestWorkoutDate(userId: number): Promise<Date | null> {
        const result = await sql`
            SELECT MAX(end_time) as latest_date
            FROM whoop_workouts
            WHERE user_id = ${userId};
        `;
        return result.rows[0]?.latest_date ? new Date(result.rows[0].latest_date) : null;
    }
}
