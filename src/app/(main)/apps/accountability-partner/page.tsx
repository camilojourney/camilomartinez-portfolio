import { AccountabilityDashboard } from '@/components/features/whoop/AccountabilityDashboard';
import Link from 'next/link';
import PageShell from '@/components/shared/page-shell';

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

function isMissingDatabaseConfig(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const record = error as { code?: unknown; message?: unknown };
    return record.code === 'missing_connection_string' ||
        (typeof record.message === 'string' && record.message.includes('missing_connection_string'));
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
                ? (row.week_start_date.toISOString().split('T')[0] ?? '')
                : String(row.week_start_date ?? ''),
            weekEnd: row.week_end_date instanceof Date
                ? (row.week_end_date.toISOString().split('T')[0] ?? '')
                : String(row.week_end_date ?? ''),
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
        if (!isMissingDatabaseConfig(error)) {
            console.error('Error fetching weekly accountability metrics:', error);
        }
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
                ? (row.week_start_date.toISOString().split('T')[0] ?? '')
                : String(row.week_start_date ?? ''),
            weekEnd: row.week_end_date instanceof Date
                ? (row.week_end_date.toISOString().split('T')[0] ?? '')
                : String(row.week_end_date ?? ''),
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
        if (!isMissingDatabaseConfig(error)) {
            console.error('Error fetching weekly habits data:', error);
        }
        return [];
    }
}

export default async function AccountabilityPartnerPage() {
    const weeklyMetrics = await getWeeklyAccountabilityMetrics();
    const weeklyHabitsData = await getWeeklyHabitsData();

    return (
        <PageShell currentPage="apps" maxWidth="full">
            <header className="rise-in grid gap-8 border-b border-line pb-10 md:grid-cols-12 md:gap-12 md:pb-14">
                <div className="md:col-span-8">
                    <span className="status status-live">Public commitment tracker</span>
                    <h1 className="display mt-3">Accountability Partner</h1>
                    <p className="lede mt-6">
                        My public accountability board for the morning workout challenge. <em>Every workout, every morning</em>,
                        for everyone to see.
                    </p>
                </div>
                <dl className="facts self-end md:col-span-4">
                    <dt>Rule</dt>
                    <dd>Work out before 8:30 AM, every day</dd>
                    <dt>Source</dt>
                    <dd>WHOOP API, refreshed every 6 hours</dd>
                    <dt>Case study</dt>
                    <dd>
                        <Link href="/projects/accountability-partner" className="link">
                            Why I built this
                        </Link>
                    </dd>
                </dl>
            </header>

            <div className="py-10 md:py-14">
                {/* All dashboard content with year toggle - client component */}
                <AccountabilityDashboard
                    weeklyMetrics={weeklyMetrics}
                    weeklyHabitsData={weeklyHabitsData}
                />
            </div>
        </PageShell>
    );
}
