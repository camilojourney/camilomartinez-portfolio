import { sql } from '@/lib/db/db';
import FitnessDashboardClient from './fitness-dashboard-client';
import {
    DashboardMonthlyStrainData,
    DashboardStrainData,
    DashboardStrainRecoveryData,
    DashboardWorkoutData,
} from '@/types/whoop';

interface MonthlyTrainingDaysData {
    month: string;
    trainingDays: number;
    daysInMonth: number;
}

interface RecentCycleRow {
    id: number;
    start_time: string;
    end_time: string;
    strain: number | string | null;
    formatted_date: string;
}

interface RecentRecoveryRow {
    cycle_id: number;
    recovery_percentage: number | string | null;
}

interface RecentWorkoutRow {
    id: string;
    start_time: string;
    end_time: string;
    sport_name: string | null;
    strain: number | string | null;
    timezone_offset: string | null;
}

interface StrainRow {
    formatted_date: string;
    strain: number | string | null;
}

interface FitnessDashboardData {
    strainData: DashboardStrainData[];
    monthlyStrainData: DashboardMonthlyStrainData[];
    strainRecoveryData: DashboardStrainRecoveryData[];
    workoutData: DashboardWorkoutData[];
    monthlyTrainingDays: MonthlyTrainingDaysData[];
    errorMessage?: string;
}

// This page reads private health data — force dynamic rendering so it is never
// statically cached and served to unauthenticated visitors.
export const dynamic = 'force-dynamic';

function toNumber(value: number | string | null | undefined): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

function getLocalDateKey(startTime: string, timezoneOffset: string | null): string | null {
    const utcDate = new Date(startTime);

    if (Number.isNaN(utcDate.getTime())) {
        return null;
    }

    if (!timezoneOffset || !/^[+-]\d{2}:\d{2}$/.test(timezoneOffset)) {
        return utcDate.toISOString().split('T')[0] ?? null;
    }

    const sign = timezoneOffset.startsWith('-') ? -1 : 1;
    const [hoursPart, minutesPart] = timezoneOffset.slice(1).split(':');
    const hours = Number.parseInt(hoursPart ?? '0', 10);
    const minutes = Number.parseInt(minutesPart ?? '0', 10);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return utcDate.toISOString().split('T')[0] ?? null;
    }

    const offsetMinutes = sign * ((hours * 60) + minutes);
    return new Date(utcDate.getTime() + (offsetMinutes * 60 * 1000)).toISOString().split('T')[0] ?? null;
}

function emptyDashboardData(errorMessage?: string): FitnessDashboardData {
    return {
        strainData: [],
        monthlyStrainData: [],
        strainRecoveryData: [],
        workoutData: [],
        monthlyTrainingDays: [],
        errorMessage,
    };
}

async function getFitnessDashboardData(): Promise<FitnessDashboardData> {
    try {
        // Use allSettled so a single query failure does not blank the entire dashboard
        const [recentCyclesResult, recentRecoveryResult, recentWorkoutsResult, strainDataResult] = await Promise.allSettled([
            sql<RecentCycleRow>`
                SELECT id, start_time, end_time, strain,
                       TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date
                FROM whoop_cycles
                ORDER BY start_time DESC
                LIMIT 1000;
            `,
            sql<RecentRecoveryRow>`
                SELECT cycle_id, recovery_percentage
                FROM whoop_recovery
                ORDER BY cycle_id DESC
                LIMIT 1000;
            `,
            sql<RecentWorkoutRow>`
                SELECT id, start_time, end_time, sport_name, strain, timezone_offset
                FROM whoop_workouts
                WHERE sport_name IN ('running', 'cycling', 'boxing', 'weightlifting', 'weightlifting_msk')
                ORDER BY start_time DESC
                LIMIT 1000;
            `,
            sql<StrainRow>`
                SELECT
                    TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date,
                    strain
                FROM whoop_cycles
                WHERE strain IS NOT NULL
                  AND start_time >= NOW() - INTERVAL '2 years'
                ORDER BY start_time ASC
            `,
        ]);

        const recentCycles = recentCyclesResult.status === 'fulfilled' ? recentCyclesResult.value.rows : [];
        const recentRecovery = recentRecoveryResult.status === 'fulfilled' ? recentRecoveryResult.value.rows : [];
        const recentWorkouts = recentWorkoutsResult.status === 'fulfilled' ? recentWorkoutsResult.value.rows : [];
        const strainRows = strainDataResult.status === 'fulfilled' ? strainDataResult.value.rows : [];

        const strainData: DashboardStrainData[] = strainRows.map((row) => ({
            formatted_date: row.formatted_date,
            strain: toNumber(row.strain),
        }));

        const monthlyStrainMap = new Map<string, { total: number; count: number }>();
        strainData.forEach((row) => {
            const monthKey = row.formatted_date.slice(0, 7);
            const existing = monthlyStrainMap.get(monthKey) ?? { total: 0, count: 0 };

            existing.total += row.strain;
            existing.count += 1;
            monthlyStrainMap.set(monthKey, existing);
        });

        const monthlyStrainData: DashboardMonthlyStrainData[] = Array.from(monthlyStrainMap.entries())
            .map(([month, values]) => ({
                month,
                average_strain: Math.round((values.total / values.count) * 100) / 100,
                days_count: values.count,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        const recoveryByCycleId = new Map<number, number>();
        recentRecovery.forEach((row) => {
            recoveryByCycleId.set(row.cycle_id, toNumber(row.recovery_percentage));
        });

        const sortedCycles = [...recentCycles]
            .filter((cycle) => cycle.strain !== null)
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        const strainRecoveryData: DashboardStrainRecoveryData[] = [];
        for (let index = 1; index < sortedCycles.length; index += 1) {
            const currentCycle = sortedCycles[index];
            const previousCycle = sortedCycles[index - 1];

            if (!currentCycle || !previousCycle) {
                continue;
            }

            const recoveryScore = recoveryByCycleId.get(currentCycle.id) ?? 0;
            const previousStrain = toNumber(previousCycle.strain);

            if (recoveryScore > 0 && previousStrain > 0) {
                strainRecoveryData.push({
                    strain_date: currentCycle.formatted_date,
                    strain: previousStrain,
                    recovery_score: recoveryScore,
                });
            }
        }

        const workoutData: DashboardWorkoutData[] = recentWorkouts.map((workout) => ({
            id: workout.id,
            sport_name: workout.sport_name ?? 'Workout',
            start_time: workout.start_time,
            end_time: workout.end_time,
        }));

        const monthlyTrainingMap = new Map<string, Set<string>>();
        recentWorkouts.forEach((workout) => {
            const localDateKey = getLocalDateKey(workout.start_time, workout.timezone_offset);
            if (!localDateKey) {
                return;
            }

            const monthKey = localDateKey.slice(0, 7);
            const trainingDays = monthlyTrainingMap.get(monthKey) ?? new Set<string>();
            trainingDays.add(localDateKey);
            monthlyTrainingMap.set(monthKey, trainingDays);
        });

        const monthlyTrainingDays: MonthlyTrainingDaysData[] = Array.from(monthlyTrainingMap.entries())
            .map(([month, days]) => {
                const [yearPart, monthPart] = month.split('-');
                const year = Number.parseInt(yearPart ?? '', 10);
                const monthNumber = Number.parseInt(monthPart ?? '', 10);
                const daysInMonth = Number.isFinite(year) && Number.isFinite(monthNumber)
                    ? new Date(year, monthNumber, 0).getDate()
                    : 0;

                return {
                    month,
                    trainingDays: days.size,
                    daysInMonth,
                };
            })
            .sort((a, b) => a.month.localeCompare(b.month));

        return {
            strainData,
            monthlyStrainData,
            strainRecoveryData,
            workoutData,
            monthlyTrainingDays,
        };
    } catch (error) {
        console.error('Error loading fitness dashboard data:', error);
        return emptyDashboardData('Unable to load dashboard data right now. Please try again later.');
    }
}

export default async function MyDataPage() {
    const data = await getFitnessDashboardData();
    return <FitnessDashboardClient {...data} />;
}
