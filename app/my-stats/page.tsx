import { sql } from "@vercel/postgres";
import WorkoutCountChartStatic from "@/components/WorkoutCountChartStatic";
import WorkoutHoursChartStatic from "@/components/WorkoutHoursChartStatic";
import StrainVsHRVChartStatic from "@/components/StrainVsSleepChartStatic";
import SleepConsistencyChartStatic from "@/components/SleepConsistencyChartStatic";
import WorkoutHeatmapStatic from "@/components/WorkoutHeatmapStatic";

// Server-side data fetching - no API calls needed
async function getWorkoutCountData() {
    try {
        // Get workout count per week by sport type for the last 3 months - filtered sports only
        const { rows: weeklyData } = await sql`
            WITH weekly_workouts AS (
                SELECT
                    DATE_TRUNC('week', start_time)::date as week,
                    CASE
                        WHEN sport_name = 'Weightlifting' THEN 'weightlifting'
                        WHEN sport_name = 'Running' THEN 'running'
                        WHEN sport_name = 'Boxing' THEN 'boxing'
                        WHEN sport_name = 'Table Tennis' THEN 'table-tennis'
                        ELSE LOWER(sport_name)
                    END as sport_name,
                    COUNT(*) as workout_count
                FROM whoop_workouts
                WHERE start_time >= NOW() - INTERVAL '3 months'
                    AND sport_name IN ('Weightlifting', 'Running', 'Boxing', 'Table Tennis')
                GROUP BY DATE_TRUNC('week', start_time), sport_name
                ORDER BY week DESC
            )
            SELECT * FROM weekly_workouts;
        `;

        // Get sport averages - filtered sports only
        const { rows: sportAverages } = await sql`
            SELECT
                CASE
                    WHEN sport_name = 'Weightlifting' THEN 'weightlifting'
                    WHEN sport_name = 'Running' THEN 'running'
                    WHEN sport_name = 'Boxing' THEN 'boxing'
                    WHEN sport_name = 'Table Tennis' THEN 'table-tennis'
                    ELSE LOWER(sport_name)
                END as sport_name,
                AVG(weekly_count) as avg_per_week,
                SUM(weekly_count) as total_workouts
            FROM (
                SELECT
                    DATE_TRUNC('week', start_time) as week_start,
                    sport_name,
                    COUNT(*) as weekly_count
                FROM whoop_workouts
                WHERE start_time >= NOW() - INTERVAL '3 months'
                    AND sport_name IN ('Weightlifting', 'Running', 'Boxing', 'Table Tennis')
                GROUP BY DATE_TRUNC('week', start_time), sport_name
            ) weekly_data
            GROUP BY sport_name
            ORDER BY avg_per_week DESC;
        `;

        return {
            weeklyData: weeklyData.map((row: any) => ({
                week: row.week,
                sport_name: row.sport_name,
                workout_count: Number(row.workout_count)
            })),
            sportAverages: sportAverages.map((row: any) => ({
                sport_name: row.sport_name,
                avg_per_week: Number(row.avg_per_week),
                total_workouts: Number(row.total_workouts)
            }))
        };
    } catch (error) {
        console.error('Error fetching workout count data:', error);
        return { weeklyData: [], sportAverages: [] };
    }
}

async function getWorkoutHoursData() {
    try {
        // Get workout hours per week by sport type - filtered sports only
        const { rows: weeklyData } = await sql`
            WITH weekly_hours AS (
                SELECT
                    DATE_TRUNC('week', start_time)::date as week,
                    CASE
                        WHEN sport_name = 'Weightlifting' THEN 'weightlifting'
                        WHEN sport_name = 'Running' THEN 'running'
                        WHEN sport_name = 'Boxing' THEN 'boxing'
                        WHEN sport_name = 'Table Tennis' THEN 'table-tennis'
                        ELSE LOWER(sport_name)
                    END as sport_name,
                    SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as total_hours
                FROM whoop_workouts
                WHERE start_time >= NOW() - INTERVAL '3 months'
                    AND sport_name IN ('Weightlifting', 'Running', 'Boxing', 'Table Tennis')
                    AND end_time IS NOT NULL
                GROUP BY DATE_TRUNC('week', start_time), sport_name
                ORDER BY week DESC
            )
            SELECT * FROM weekly_hours;
        `;

        // Get sport hour averages - filtered sports only
        const { rows: sportAverages } = await sql`
            SELECT
                CASE
                    WHEN sport_name = 'Weightlifting' THEN 'weightlifting'
                    WHEN sport_name = 'Running' THEN 'running'
                    WHEN sport_name = 'Boxing' THEN 'boxing'
                    WHEN sport_name = 'Table Tennis' THEN 'table-tennis'
                    ELSE LOWER(sport_name)
                END as sport_name,
                AVG(weekly_hours) as avg_hours_per_week,
                SUM(weekly_hours) as total_hours
            FROM (
                SELECT
                    DATE_TRUNC('week', start_time) as week_start,
                    sport_name,
                    SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as weekly_hours
                FROM whoop_workouts
                WHERE start_time >= NOW() - INTERVAL '3 months'
                    AND sport_name IN ('Weightlifting', 'Running', 'Boxing', 'Table Tennis')
                    AND end_time IS NOT NULL
                GROUP BY DATE_TRUNC('week', start_time), sport_name
            ) weekly_data
            GROUP BY sport_name
            ORDER BY avg_hours_per_week DESC;
        `;

        return {
            weeklyData: weeklyData.map((row: any) => ({
                week: row.week,
                sport_name: row.sport_name,
                total_hours: Number(row.total_hours)
            })),
            sportAverages: sportAverages.map((row: any) => ({
                sport_name: row.sport_name,
                avg_hours_per_week: Number(row.avg_hours_per_week),
                total_hours: Number(row.total_hours)
            }))
        };
    } catch (error) {
        console.error('Error fetching workout hours data:', error);
        return { weeklyData: [], sportAverages: [] };
    }
}

async function getStrainVsHRVData() {
    try {
        const { rows } = await sql`
      SELECT
        c.id as cycle_id,
        c.strain,
        r.hrv_rmssd_milli,
        c.start_time as cycle_start,
        r.recovery_score,
        s.sleep_performance_percentage,
        r.resting_heart_rate
      FROM whoop_cycles c
      LEFT JOIN whoop_recovery r ON c.id = r.cycle_id
      LEFT JOIN whoop_sleep s ON c.id = s.cycle_id
      WHERE c.strain IS NOT NULL
        AND r.hrv_rmssd_milli IS NOT NULL
      ORDER BY c.start_time DESC;
    `;

        return rows.map((row: any) => ({
            cycle_id: String(row.cycle_id),
            strain: Number(row.strain),
            hrv_rmssd_milli: Number(row.hrv_rmssd_milli),
            cycle_start: row.cycle_start,
            recovery_score: row.recovery_score ? Number(row.recovery_score) : undefined,
            sleep_performance_percentage: row.sleep_performance_percentage ? Number(row.sleep_performance_percentage) : undefined,
            resting_heart_rate: row.resting_heart_rate ? Number(row.resting_heart_rate) : undefined,
        }));
    } catch (error) {
        console.error('Error fetching strain vs HRV data:', error);
        return [];
    }
}

async function getSleepConsistencyData() {
    try {
        const { rows } = await sql`
      SELECT
        s.sleep_consistency_percentage,
        r.hrv_rmssd_milli,
        s.start_time as sleep_start,
        s.end_time as sleep_end
      FROM whoop_cycles c
      LEFT JOIN whoop_sleep s ON c.id = s.cycle_id
      LEFT JOIN whoop_recovery r ON c.id = r.cycle_id
      WHERE s.sleep_consistency_percentage IS NOT NULL
        AND r.hrv_rmssd_milli IS NOT NULL
        AND s.start_time IS NOT NULL
        AND s.end_time IS NOT NULL
      ORDER BY c.start_time DESC;
    `;

        return rows.map((row: any) => ({
            sleep_consistency_percentage: Number(row.sleep_consistency_percentage),
            hrv_rmssd_milli: Number(row.hrv_rmssd_milli),
            sleep_start: row.sleep_start,
            sleep_end: row.sleep_end,
        }));
    } catch (error) {
        console.error('Error fetching sleep consistency data:', error);
        return [];
    }
}

async function getWorkoutHeatmapData() {
    try {
        const { rows } = await sql`
            SELECT
                DATE(start_time) as date,
                COUNT(*) as workout_count
            FROM whoop_workouts
            WHERE start_time >= NOW() - INTERVAL '1 year'
                AND sport_name IN ('Weightlifting', 'Running', 'Boxing', 'Table Tennis')
            GROUP BY DATE(start_time)
            ORDER BY date DESC;
        `;

        return rows.map((row: any) => ({
            date: row.date,
            workout_count: Number(row.workout_count),
        }));
    } catch (error) {
        console.error('Error fetching workout heatmap data:', error);
        return [];
    }
}

export default async function MyStatsPage() {
    // Fetch all data server-side
    const workoutCountData = await getWorkoutCountData();
    const workoutHoursData = await getWorkoutHoursData();
    const strainVsHRVData = await getStrainVsHRVData();
    const sleepConsistencyData = await getSleepConsistencyData();
    const workoutHeatmapData = await getWorkoutHeatmapData();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        My WHOOP Analytics
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Personal fitness data insights from my WHOOP device. Updated daily with workout patterns,
                        strain analysis, sleep performance correlations, and data science experiments.
                    </p>
                    <div className="mt-6 flex justify-center items-center space-x-4 text-gray-400">
                        <span>📊 Last 3-6 months</span>
                        <span>•</span>
                        <span>🔄 Auto-updated daily</span>
                        <span>•</span>
                        <span>📈 Real fitness data</span>
                    </div>
                </div>

                {/* Charts Container */}
                <div className="space-y-12">
                    {/* Strain vs HRV */}
                    <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                        <h2 className="text-3xl font-semibold text-white mb-6 text-center">
                            Strain vs HRV Correlation
                        </h2>
                        <p className="text-gray-300 text-center mb-8">
                            Analysis of how my daily strain impacts heart rate variability and recovery
                        </p>
                        <StrainVsHRVChartStatic data={strainVsHRVData} />
                    </div>

                    {/* Sleep Consistency Hypothesis */}
                    <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                        <SleepConsistencyChartStatic data={sleepConsistencyData} />
                    </div>

                    {/* Annual Workout Heatmap */}
                    <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                        <WorkoutHeatmapStatic data={workoutHeatmapData} />
                    </div>

                    {/* Workout Count Analytics */}
                    <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                        <h2 className="text-3xl font-semibold text-white mb-6 text-center">
                            Weekly Workout Frequency by Sport
                        </h2>
                        <p className="text-gray-300 text-center mb-8">
                            Breakdown of workout frequency across different sports and activities
                        </p>
                        <WorkoutCountChartStatic
                            weeklyData={workoutCountData.weeklyData}
                            sportAverages={workoutCountData.sportAverages}
                        />
                    </div>

                    {/* Workout Hours Analytics */}
                    <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                        <h2 className="text-3xl font-semibold text-white mb-6 text-center">
                            Weekly Training Volume by Sport
                        </h2>
                        <p className="text-gray-300 text-center mb-8">
                            Time spent training across different sports and activities
                        </p>
                        <WorkoutHoursChartStatic
                            weeklyData={workoutHoursData.weeklyData}
                            sportAverages={workoutHoursData.sportAverages}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center">
                    <p className="text-gray-400">
                        Data collected from WHOOP API and updated automatically daily at 2 PM UTC
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Want to see your own analytics? Check out the{" "}
                        <a href="/live-data" className="text-blue-400 hover:text-blue-300 underline">
                            Live Data Demo
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
