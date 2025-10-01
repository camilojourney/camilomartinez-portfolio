import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';
import { DashboardWorkoutTimeData } from '@/types/whoop';

export async function GET() {
    try {
        // Get workout times for the last 90 days
        const workoutTimeData = await sql`
            SELECT 
                TO_CHAR(start_time, 'YYYY-MM-DD') AS date,
                TO_CHAR(start_time, 'HH24:MI') AS time,
                EXTRACT(HOUR FROM start_time) * 60 + EXTRACT(MINUTE FROM start_time) AS timeAsMinutes
            FROM whoop_workouts
            WHERE start_time >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY start_time ASC
        `;

        const result: DashboardWorkoutTimeData[] = workoutTimeData.rows.map(row => ({
            date: row.date,
            time: row.time,
            timeAsMinutes: parseInt(row.timeasminutes) || 0
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching workout time data:', error);
        return NextResponse.json({
            error: 'Failed to fetch workout time data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}