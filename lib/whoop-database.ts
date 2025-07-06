import { sql } from './db';
import {
    WhoopUser,
    WhoopCycle,
    WhoopSleep,
    WhoopRecovery,
    WhoopWorkout,
    DbUser,
    DbCycle,
    DbSleep,
    DbRecovery,
    DbWorkout
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
        last_name = EXCLUDED.last_name
    `;
    }

    // Cycle operations
    async upsertCycle(cycle: WhoopCycle): Promise<void> {
        await sql`
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
        max_heart_rate = EXCLUDED.max_heart_rate
    `;
    }

    // Sleep operations
    async upsertSleep(sleep: WhoopSleep, cycleId: number): Promise<void> {
        console.log(`💾 Upserting sleep for cycle ${cycleId}, sleep ID: ${sleep.id}, score_state: ${sleep.score_state}`);

        // Handle cases where score data might be missing
        const hasScore = sleep.score && sleep.score_state === 'SCORED';
        const stageSum = hasScore && sleep.score ? sleep.score.stage_summary : null;

        try {
            const result = await sql`
              INSERT INTO whoop_sleep (
                id, user_id, cycle_id, start_time, end_time, timezone_offset,
                nap, score_state, sleep_performance_percentage, respiratory_rate,
                sleep_consistency_percentage, sleep_efficiency_percentage,
                total_in_bed_time_milli, total_awake_time_milli, total_light_sleep_time_milli,
                total_slow_wave_sleep_time_milli, total_rem_sleep_time_milli, disturbance_count
              )
              VALUES (
                ${sleep.id}, ${sleep.user_id}, ${cycleId}, ${sleep.start}, ${sleep.end},
                ${sleep.timezone_offset}, ${sleep.nap}, ${sleep.score_state},
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
                disturbance_count = EXCLUDED.disturbance_count
            `;
            console.log(`✅ Sleep upsert successful for cycle ${cycleId}`);
        } catch (error) {
            console.error(`❌ Sleep upsert failed for cycle ${cycleId}:`, error);
            throw error;
        }
    }

    // Recovery operations
    async upsertRecovery(recovery: WhoopRecovery, sleepId?: number): Promise<void> {
        console.log(`💾 Upserting recovery for cycle ${recovery.cycle_id}, sleepId: ${sleepId || 'null'}`);
        try {
            const result = await sql`
          INSERT INTO whoop_recovery (
            cycle_id, sleep_id, user_id, score_state, recovery_score,
            resting_heart_rate, hrv_rmssd_milli, spo2_percentage, skin_temp_celsius
          )
          VALUES (
            ${recovery.cycle_id}, ${sleepId || null}, ${recovery.user_id},
            ${recovery.score_state}, ${recovery.score.recovery_score},
            ${recovery.score.resting_heart_rate}, ${recovery.score.hrv_rmssd_milli},
            ${recovery.score.spo2_percentage}, ${recovery.score.skin_temp_celsius}
          )
          ON CONFLICT (cycle_id)
          DO UPDATE SET
            sleep_id = EXCLUDED.sleep_id,
            score_state = EXCLUDED.score_state,
            recovery_score = EXCLUDED.recovery_score,
            resting_heart_rate = EXCLUDED.resting_heart_rate,
            hrv_rmssd_milli = EXCLUDED.hrv_rmssd_milli,
            spo2_percentage = EXCLUDED.spo2_percentage,
            skin_temp_celsius = EXCLUDED.skin_temp_celsius
        `;
            console.log(`✅ Recovery upsert result:`, result);
        } catch (error) {
            console.error(`❌ Recovery upsert failed for cycle ${recovery.cycle_id}:`, error);
            throw error;
        }
    }

    // Workout operations
    async upsertWorkout(workout: WhoopWorkout): Promise<void> {
        // Skip workouts without score data
        if (!workout.score) {
            console.log(`Skipping workout ${workout.id} - no score data`);
            return;
        }

        await sql`
      INSERT INTO whoop_workouts (
        id, user_id, start_time, end_time, timezone_offset, sport_id,
        score_state, strain, average_heart_rate, max_heart_rate, kilojoule,
        distance_meter, altitude_gain_meter, altitude_change_meter,
        zone_zero_milli, zone_one_milli, zone_two_milli, zone_three_milli,
        zone_four_milli, zone_five_milli
      )
      VALUES (
        ${workout.id}, ${workout.user_id}, ${workout.start}, ${workout.end},
        ${workout.timezone_offset}, ${workout.sport_id}, ${workout.score_state},
        ${workout.score.strain || 0}, ${workout.score.average_heart_rate || 0},
        ${workout.score.max_heart_rate || 0}, ${workout.score.kilojoule || 0},
        ${workout.score.distance_meter || 0}, ${workout.score.altitude_gain_meter || 0},
        ${workout.score.altitude_change_meter || 0}, ${workout.score.zone_duration?.zone_zero_milli || 0},
        ${workout.score.zone_duration?.zone_one_milli || 0}, ${workout.score.zone_duration?.zone_two_milli || 0},
        ${workout.score.zone_duration?.zone_three_milli || 0}, ${workout.score.zone_duration?.zone_four_milli || 0},
        ${workout.score.zone_duration?.zone_five_milli || 0}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        timezone_offset = EXCLUDED.timezone_offset,
        sport_id = EXCLUDED.sport_id,
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
        zone_five_milli = EXCLUDED.zone_five_milli
    `;
    }

    // Bulk operations for efficiency
    async upsertCycles(cycles: WhoopCycle[]): Promise<void> {
        for (const cycle of cycles) {
            await this.upsertCycle(cycle);
        }
    }

    async upsertWorkouts(workouts: WhoopWorkout[]): Promise<void> {
        for (const workout of workouts) {
            await this.upsertWorkout(workout);
        }
    }

    // Get latest data timestamps for incremental sync
    async getLatestCycleDate(userId: number): Promise<Date | null> {
        const result = await sql`
      SELECT MAX(end_time) as latest_date
      FROM whoop_cycles
      WHERE user_id = ${userId}
    `;

        return result.rows[0]?.latest_date ? new Date(result.rows[0].latest_date) : null;
    }

    async getLatestWorkoutDate(userId: number): Promise<Date | null> {
        const result = await sql`
      SELECT MAX(end_time) as latest_date
      FROM whoop_workouts
      WHERE user_id = ${userId}
    `;

        return result.rows[0]?.latest_date ? new Date(result.rows[0].latest_date) : null;
    }

    // Get cycles that need sleep/recovery data
    async getCyclesWithoutSleep(userId: number, limit = 50): Promise<number[]> {
        const result = await sql`
      SELECT c.id
      FROM whoop_cycles c
      LEFT JOIN whoop_sleep s ON c.id = s.cycle_id
      WHERE c.user_id = ${userId} AND s.id IS NULL
      ORDER BY c.start_time DESC
      LIMIT ${limit}
    `;

        return result.rows.map(row => row.id);
    }

    async getCyclesWithoutRecovery(userId: number, limit = 50): Promise<number[]> {
        const result = await sql`
      SELECT c.id
      FROM whoop_cycles c
      LEFT JOIN whoop_recovery r ON c.id = r.cycle_id
      WHERE c.user_id = ${userId} AND r.cycle_id IS NULL
      ORDER BY c.start_time DESC
      LIMIT ${limit}
    `;

        return result.rows.map(row => row.id);
    }

    // Data validation and counts (all users)
    async getDataCountsAll(): Promise<{
        cycles: number;
        sleep: number;
        recovery: number;
        workouts: number;
    }> {
        const [cyclesResult, sleepResult, recoveryResult, workoutsResult] = await Promise.all([
            sql`SELECT COUNT(*) as count FROM whoop_cycles`,
            sql`SELECT COUNT(*) as count FROM whoop_sleep`,
            sql`SELECT COUNT(*) as count FROM whoop_recovery`,
            sql`SELECT COUNT(*) as count FROM whoop_workouts`
        ]);

        return {
            cycles: parseInt(cyclesResult.rows[0]?.count || '0'),
            sleep: parseInt(sleepResult.rows[0]?.count || '0'),
            recovery: parseInt(recoveryResult.rows[0]?.count || '0'),
            workouts: parseInt(workoutsResult.rows[0]?.count || '0')
        };
    }

    // Get latest data timestamps (all users)
    async getLatestCycleDateAll(): Promise<Date | null> {
        const result = await sql`
            SELECT MAX(end_time) as latest_date
            FROM whoop_cycles
        `;

        const dateStr = result.rows[0]?.latest_date;
        return dateStr ? new Date(dateStr) : null;
    }

    async getLatestWorkoutDateAll(): Promise<Date | null> {
        const result = await sql`
            SELECT MAX(end_time) as latest_date
            FROM whoop_workouts
        `;

        const dateStr = result.rows[0]?.latest_date;
        return dateStr ? new Date(dateStr) : null;
    }

    // Data validation and counts
    async getDataCounts(userId: number): Promise<{
        cycles: number;
        sleep: number;
        recovery: number;
        workouts: number;
    }> {
        const [cyclesResult, sleepResult, recoveryResult, workoutsResult] = await Promise.all([
            sql`SELECT COUNT(*) as count FROM whoop_cycles WHERE user_id = ${userId}`,
            sql`SELECT COUNT(*) as count FROM whoop_sleep WHERE user_id = ${userId}`,
            sql`SELECT COUNT(*) as count FROM whoop_recovery WHERE user_id = ${userId}`,
            sql`SELECT COUNT(*) as count FROM whoop_workouts WHERE user_id = ${userId}`
        ]);

        return {
            cycles: parseInt(cyclesResult.rows[0]?.count || '0'),
            sleep: parseInt(sleepResult.rows[0]?.count || '0'),
            recovery: parseInt(recoveryResult.rows[0]?.count || '0'),
            workouts: parseInt(workoutsResult.rows[0]?.count || '0')
        };
    }
}
