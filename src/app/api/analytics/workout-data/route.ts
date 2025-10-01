import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';
import { DashboardWorkoutData } from '@/types/whoop';

export async function GET() {
    try {
        // Get workout data for the last 90 days
        const workoutData = await sql`
            SELECT 
                w.id,
                COALESCE(s.name, 'Unknown') AS sport_name,
                w.start_time,
                w.end_time
            FROM whoop_workouts w
            LEFT JOIN sports s ON w.sport_id = s.id
            WHERE w.start_time >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY w.start_time DESC
            LIMIT 100
        `;

        const result: DashboardWorkoutData[] = workoutData.rows.map(row => ({
            id: row.id,
            sport_name: row.sport_name || 'Unknown',
            start_time: row.start_time,
            end_time: row.end_time
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching workout data:', error);
        
        // Fallback query if sports table doesn't exist
        try {
            const fallbackWorkoutData = await sql`
                SELECT 
                    id,
                    'Workout' AS sport_name,
                    start_time,
                    end_time
                FROM whoop_workouts
                WHERE start_time >= CURRENT_DATE - INTERVAL '90 days'
                ORDER BY start_time DESC
                LIMIT 100
            `;

            const fallbackResult: DashboardWorkoutData[] = fallbackWorkoutData.rows.map(row => ({
                id: row.id,
                sport_name: row.sport_name || 'Workout',
                start_time: row.start_time,
                end_time: row.end_time
            }));

            return NextResponse.json(fallbackResult);
        } catch (fallbackError) {
            console.error('Fallback workout query also failed:', fallbackError);
            return NextResponse.json({
                error: 'Failed to fetch workout data',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }
    }
}