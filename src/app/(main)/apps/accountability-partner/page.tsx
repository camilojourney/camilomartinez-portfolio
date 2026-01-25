import { AccountabilityDashboard } from '@/components/features/whoop/AccountabilityDashboard';
import LiquidNav from '@/components/shared/liquid-nav';

// Configure Incremental Static Regeneration (ISR) with 6-hour revalidation
export const dynamic = 'auto';
export const dynamicParams = true;
export const revalidate = 21600; // Revalidate every 6 hours (21600 seconds)

interface WeeklyAccountabilityData {
    weekStart: string; // YYYY-MM-DD
    weekEnd: string;   // YYYY-MM-DD
    trainingDays: number;
    meditationSessions: number;
    avgWakeTime: string; // HH:MM format
    wakeTimeStdDev: number; // in minutes
    avgWorkoutStartTime: string; // HH:MM format
    workoutStartStdDev: number; // in minutes
    avgSleepStartTime: string; // HH:MM format
    sleepStartStdDev: number; // in minutes
}

async function getWeeklyAccountabilityMetrics(): Promise<WeeklyAccountabilityData[]> {
    try {
        // Fetch directly from weekly_habits_summary table
        const { sql } = await import('@vercel/postgres');

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

        // Format time as HH:MM
        // PostgreSQL returns numeric values as strings, so we need to parseFloat first
        const formatTime = (decimalHour: string | number | null): string => {
            if (decimalHour === null || decimalHour === 0 || decimalHour === '0') return '--:--';
            const hour = typeof decimalHour === 'string' ? parseFloat(decimalHour) : decimalHour;
            if (isNaN(hour)) return '--:--';
            const hours = Math.floor(hour);
            const minutes = Math.round((hour - hours) * 60);
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };

        // Helper to safely parse numeric strings from PostgreSQL
        const parseNum = (val: string | number | null): number => {
            if (val === null) return 0;
            const num = typeof val === 'string' ? parseFloat(val) : val;
            return isNaN(num) ? 0 : num;
        };

        const weeklyData: WeeklyAccountabilityData[] = result.rows.map((row) => ({
            weekStart: row.week_start_date instanceof Date
                ? row.week_start_date.toISOString().split('T')[0]
                : String(row.week_start_date),
            weekEnd: row.week_end_date instanceof Date
                ? row.week_end_date.toISOString().split('T')[0]
                : String(row.week_end_date),
            trainingDays: parseInt(row.workout_count, 10) || 0,
            meditationSessions: parseInt(row.meditation_count, 10) || 0,
            avgWakeTime: formatTime(row.avg_wake_hour),
            wakeTimeStdDev: Math.round(parseNum(row.std_wake_hour) * 60 * 100) / 100, // Convert hours to minutes
            avgWorkoutStartTime: formatTime(row.avg_workout_hour),
            workoutStartStdDev: Math.round(parseNum(row.std_workout_hour) * 60 * 100) / 100,
            avgSleepStartTime: formatTime(row.avg_sleep_start_hour),
            sleepStartStdDev: Math.round(parseNum(row.std_sleep_start_hour) * 60 * 100) / 100
        }));

        // Reverse to get chronological order (oldest first)
        weeklyData.reverse();

        console.log('Weekly accountability metrics from DB:', weeklyData.length, 'weeks');
        console.log('Sample data:', weeklyData.slice(-3));

        return weeklyData;
    } catch (error) {
        console.error('Error fetching weekly accountability metrics:', error);
        return [];
    }
}

async function getWeeklyHabitsData() {
    try {
        // Query database directly instead of using HTTP fetch
        // This avoids issues with server-side fetching its own API routes
        const { sql } = await import('@vercel/postgres');

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
            ORDER BY week_start_date ASC
        `;

        // Transform the data for the frontend
        // PostgreSQL returns numeric values as strings through @vercel/postgres
        // We need to parse them to numbers for the charts to work correctly
        // Date fields need to be converted to ISO strings for parseISO() to work
        const weeklyData = result.rows.map((row) => ({
            weekStart: row.week_start_date instanceof Date
                ? row.week_start_date.toISOString().split('T')[0]
                : String(row.week_start_date),
            weekEnd: row.week_end_date instanceof Date
                ? row.week_end_date.toISOString().split('T')[0]
                : String(row.week_end_date),
            meditationCount: parseInt(row.meditation_count, 10) || 0,
            trainingDays: parseInt(row.workout_count, 10) || 0,
            avgWakeHour: row.avg_wake_hour ? parseFloat(row.avg_wake_hour) : null,
            stdWakeHour: row.std_wake_hour ? parseFloat(row.std_wake_hour) : null,
            avgWorkoutHour: row.avg_workout_hour ? parseFloat(row.avg_workout_hour) : null,
            stdWorkoutHour: row.std_workout_hour ? parseFloat(row.std_workout_hour) : null,
            avgSleepStartHour: row.avg_sleep_start_hour ? parseFloat(row.avg_sleep_start_hour) : null,
            stdSleepStartHour: row.std_sleep_start_hour ? parseFloat(row.std_sleep_start_hour) : null,
        }));

        console.log('Weekly habits data from DB:', weeklyData.length, 'weeks');
        console.log('Sample weekStart format:', weeklyData[0]?.weekStart, typeof weeklyData[0]?.weekStart);

        return weeklyData;
    } catch (error) {
        console.error('Error fetching weekly habits data:', error);
        return [];
    }
}

export default async function AccountabilityPartnerPage() {
    const weeklyMetrics = await getWeeklyAccountabilityMetrics();
    const weeklyHabitsData = await getWeeklyHabitsData();

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Navigation */}
            <LiquidNav currentPage="apps" />

            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-amber-900/20 to-orange-900/30 animate-gradient-xy"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-20">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent leading-tight">
                            Accountability Partner
                        </h1>
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-full px-8 py-4 mb-8">
                            <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></span>
                            <span className="text-amber-300 font-semibold text-lg tracking-wide">Public Commitment Tracker</span>
                        </div>
                        <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                            My public accountability board for the morning workout challenge.{' '}
                            <span className="text-amber-400 font-semibold">Every workout</span>,{' '}
                            <span className="text-orange-400 font-semibold">every morning</span>,{' '}
                            <span className="text-amber-300 font-semibold">for everyone to see</span>.
                        </p>
                    </div>

                    {/* All dashboard content with year toggle - client component */}
                    <AccountabilityDashboard
                        weeklyMetrics={weeklyMetrics}
                        weeklyHabitsData={weeklyHabitsData}
                    />
                </div>
            </div>
        </div>
    );
}
