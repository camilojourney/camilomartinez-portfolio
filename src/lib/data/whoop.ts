import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db/db';

/**
 * Fetch strain data from the database with built-in revalidation
 */
export async function fetchStrainData(options?: { revalidate?: boolean }) {
    try {
        const result = await sql`
            SELECT
                TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date,
                strain::decimal as strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            ORDER BY start_time DESC
        `;
        
        const processedData = result.rows.map(row => ({
            formatted_date: String(row.formatted_date),
            strain: parseFloat(String(row.strain))
        }));

        // Optionally trigger revalidation
        if (options?.revalidate) {
            revalidatePath('/my-data');
        }
        
        return processedData;
    } catch (error) {
        console.error('Error fetching strain data:', error);
        return [];
    }
}

/**
 * Fetch monthly strain data with revalidation support
 */
export async function fetchMonthlyStrainData(options?: { revalidate?: boolean }) {
    try {
        const result = await sql`
            SELECT
                TO_CHAR(start_time, 'YYYY-MM') AS month,
                AVG(strain::decimal) as average_strain,
                COUNT(*) as days_count
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            GROUP BY TO_CHAR(start_time, 'YYYY-MM')
            ORDER BY month DESC
        `;
        
        const processedData = result.rows.map(row => ({
            month: String(row.month),
            average_strain: parseFloat(String(row.average_strain)),
            days_count: parseInt(String(row.days_count))
        }));

        if (options?.revalidate) {
            revalidatePath('/my-data');
        }
        
        return processedData;
    } catch (error) {
        console.error('Error fetching monthly strain data:', error);
        return [];
    }
}

/**
 * Fetch strain vs recovery data with revalidation
 */
export async function fetchStrainRecoveryData(options?: { revalidate?: boolean }) {
    try {
        const result = await sql`
            SELECT
                c1.start_time::date as strain_date,
                c1.strain,
                r2.recovery_percentage as recovery_score
            FROM whoop_cycles c1
            INNER JOIN whoop_recovery r2 ON
                r2.cycle_id IN (
                    SELECT c2.id
                    FROM whoop_cycles c2
                    WHERE c2.start_time::date = (c1.start_time::date + interval '1 day')
                )
            WHERE
                c1.strain IS NOT NULL
                AND c1.strain > 0
                AND r2.recovery_percentage IS NOT NULL
                AND r2.recovery_percentage > 0
            ORDER BY c1.start_time DESC
        `;

        if (options?.revalidate) {
            revalidatePath('/my-data');
        }

        return result.rows as Array<{
            strain_date: string;
            strain: number;
            recovery_score: number;
        }>;
    } catch (error) {
        console.error('Error fetching strain vs recovery data:', error);
        return [];
    }
}

/**
 * Fetch workout data with revalidation
 */
export async function fetchWorkoutData(options?: { revalidate?: boolean }) {
    try {
        const result = await sql`
            SELECT
                id,
                sport_name,
                start_time,
                end_time
            FROM whoop_workouts
            WHERE
                start_time >= DATE_TRUNC('year', CURRENT_DATE)
                AND end_time > start_time
                AND (
                    sport_name = 'weightlifting'
                    OR sport_name = 'weightlifting_msk'
                    OR sport_name = 'running'
                    OR sport_name = 'boxing'
                )
            ORDER BY start_time ASC
        `;

        if (options?.revalidate) {
            revalidatePath('/my-data');
        }

        if (result.rows.length > 0) {
            return result.rows.map(row => ({
                id: row.id as string,
                sport_name: row.sport_name as string,
                start_time: row.start_time as string,
                end_time: row.end_time as string
            }));
        }

        return [];
    } catch (error) {
        console.error('Error fetching workout data:', error);
        return [];
    }
}

/**
 * Fetch workout times with revalidation
 */
export async function fetchWorkoutTimes(options?: { revalidate?: boolean }) {
    try {
        const result = await sql`
            SELECT
                TO_CHAR(DATE(start_time + (timezone_offset || ' hours')::interval), 'YYYY-MM-DD') AS workout_date,
                TO_CHAR(MIN(start_time + (timezone_offset || ' hours')::interval), 'HH24:MI') AS first_workout_time
            FROM whoop_workouts
            WHERE sport_name IN ('running', 'weightlifting', 'boxing', 'weightlifting_msk')
            GROUP BY workout_date
            ORDER BY workout_date;
        `;
        
        const processedData = result.rows.map(row => {
            const [hours, minutes] = row.first_workout_time.split(':').map(Number);
            const timeAsMinutes = hours * 60 + minutes;
            
            return {
                date: row.workout_date,
                time: row.first_workout_time,
                timeAsMinutes
            };
        });

        if (options?.revalidate) {
            revalidatePath('/my-data');
        }
        
        return processedData;
    } catch (error) {
        console.error('Error fetching workout times:', error);
        return [];
    }
}