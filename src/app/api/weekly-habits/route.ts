import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    try {
        const result = await sql`
            SELECT
                week_start_date,
                week_end_date,
                meditation_count,
                workout_count,
                avg_wake_hour,
                std_wake_hour,
                avg_workout_hour,
                std_workout_hour,
                avg_sleep_start_hour,
                std_sleep_start_hour
            FROM weekly_habits_summary
            ORDER BY week_start_date DESC
        `;

        // Transform the data for the frontend
        const weeklyData = result.rows.map((row) => ({
            weekStart: row.week_start_date,
            weekEnd: row.week_end_date,
            meditationCount: row.meditation_count || 0,
            trainingDays: row.workout_count || 0,
            avgWakeHour: row.avg_wake_hour || null,
            stdWakeHour: row.std_wake_hour || null,
            avgWorkoutHour: row.avg_workout_hour || null,
            stdWorkoutHour: row.std_workout_hour || null,
            avgSleepStartHour: row.avg_sleep_start_hour || null,
            stdSleepStartHour: row.std_sleep_start_hour || null,
        }));

        // Reverse to get chronological order (oldest first)
        weeklyData.reverse();

        return NextResponse.json({
            success: true,
            data: weeklyData,
            count: weeklyData.length
        });
    } catch (error) {
        console.error('Error fetching weekly habits data:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch weekly habits data',
                data: []
            },
            { status: 500 }
        );
    }
}
