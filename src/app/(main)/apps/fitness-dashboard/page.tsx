import { analyticsService } from '@/lib/api/config';
import { Card } from '@/components/ui/Card';
import { ActivityHeatmap } from '@/components/features/whoop/ActivityHeatmap';
import { StrainVsRecoveryChart } from '@/components/features/whoop/StrainVsRecoveryChart';
import { TrainingAnalytics } from '@/components/features/whoop/TrainingAnalytics';
import LiquidNav from '@/components/shared/liquid-nav';
import Link from 'next/link';
import FitnessDashboardClient from './fitness-dashboard-client';

/* eslint-disable @typescript-eslint/no-unused-vars */

// Configure Incremental Static Regeneration (ISR) with 6-hour revalidation
export const dynamic = 'auto';
export const dynamicParams = true;
export const revalidate = 21600; // Revalidate every 6 hours (21600 seconds)

import { DashboardStrainData, DashboardMonthlyStrainData, DashboardStrainRecoveryData, DashboardWorkoutData } from '@/types/whoop';

async function getStrainData(): Promise<DashboardStrainData[]> {
    try {
        const response = await analyticsService.getStrainData() as any;
        
        // Extract strain data from /api/view-data response
        const strainData = response?.strain || [];
        
        console.log('Strain Data from API:', strainData.length, 'records');
        console.log('Sample data:', strainData.slice(0, 3));
        
        // Convert to expected format
        return strainData.map((item: any) => ({
            formatted_date: item.formatted_date,
            strain: parseFloat(item.strain) || 0
        }));
    } catch (error) {
        console.error('Error fetching strain data:', error);
        return [];
    }
}

async function getMonthlyStrainData(): Promise<DashboardMonthlyStrainData[]> {
    try {
        const response = await analyticsService.getMonthlyStrainData() as any;
        
        // Extract and aggregate monthly data from strain data
        const strainData = response?.strain || [];
        
        if (!strainData.length) {
            console.log('No strain data for monthly aggregation');
            return [];
        }
        
        // Group by month and calculate averages
        const monthlyMap = new Map();
        
        strainData.forEach((item: any) => {
            const date = new Date(item.formatted_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, { total: 0, count: 0 });
            }
            
            const month = monthlyMap.get(monthKey);
            month.total += parseFloat(item.strain) || 0;
            month.count += 1;
        });
        
        const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
            month,
            average_strain: Math.round((data.total / data.count) * 100) / 100,
            days_count: data.count
        }));
        
        console.log('Monthly Strain Data processed:', monthlyData.length, 'months');
        return monthlyData;
    } catch (error) {
        console.error('Error fetching monthly strain data:', error);
        return [];
    }
}

async function getStrainRecoveryData(): Promise<DashboardStrainRecoveryData[]> {
    try {
        const response = await analyticsService.getStrainRecoveryData() as any;
        
        // Extract cycles and recovery data
        const cycles = response?.recent?.cycles || [];
        const recovery = response?.recent?.recovery || [];
        
        // Create a map of recovery by cycle_id for easy lookup
        const recoveryMap = new Map();
        recovery.forEach((r: any) => {
            recoveryMap.set(r.cycle_id, parseFloat(r.recovery_percentage) || 0);
        });
        
        // Sort cycles by date to ensure proper order
        const sortedCycles = cycles
            .filter((cycle: any) => cycle.strain != null)
            .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        
        // Match each day's recovery with PREVIOUS day's strain
        const strainRecoveryData: DashboardStrainRecoveryData[] = [];
        
        for (let i = 1; i < sortedCycles.length; i++) {
            const currentCycle = sortedCycles[i];
            const previousCycle = sortedCycles[i - 1];
            
            const currentRecovery = recoveryMap.get(currentCycle.id);
            const previousStrain = parseFloat(previousCycle.strain) || 0;
            
            if (currentRecovery > 0 && previousStrain > 0) {
                strainRecoveryData.push({
                    strain_date: currentCycle.formatted_date, // Date for the recovery measurement
                    strain: previousStrain, // Previous day's strain
                    recovery_score: currentRecovery // Current day's recovery
                });
            }
        }
        
        console.log('Strain vs Recovery Data (previous day correlation):', strainRecoveryData.length, 'records');
        console.log('Sample correlation data:', strainRecoveryData.slice(0, 3));
        return strainRecoveryData;
    } catch (error) {
        console.error('Error fetching strain vs recovery data:', error);
        return [];
    }
}

async function getWorkoutData(): Promise<DashboardWorkoutData[]> {
    try {
        const response = await analyticsService.getWorkoutData() as any;

        // Extract workout data from /api/view-data response
        const workouts = response?.recent?.workouts || [];

        if (workouts?.length) {
            const workoutData = workouts.map((workout: any) => ({
                id: workout.id,
                sport_name: workout.sport_name || 'Workout',
                start_time: workout.start_time,
                end_time: workout.end_time
            }));

            console.log('Workout data found:', workoutData.length, 'workouts');
            return workoutData;
        }

        console.log('No workout data found');
        return [];
    } catch (error) {
        console.error('Error fetching workout data:', error);
        return []; // Return empty array on error
    }
}

interface MonthlyTrainingDaysData {
    month: string; // "YYYY-MM" format
    trainingDays: number;
    daysInMonth: number;
}

async function getMonthlyTrainingDays(): Promise<MonthlyTrainingDaysData[]> {
    try {
        const response = await analyticsService.getWorkoutData() as any;

        // Extract workout data from /api/view-data response
        const workouts = response?.recent?.workouts || [];

        if (!workouts?.length) {
            console.log('No workout data for monthly training days');
            return [];
        }

        // Filter to only relevant workout types
        const relevantWorkouts = workouts.filter((workout: any) => {
            const sportName = workout.sport_name?.toLowerCase();
            return sportName === 'weightlifting' ||
                   sportName === 'weightlifting_msk' ||
                   sportName === 'running' ||
                   sportName === 'boxing';
        });

        // Group workouts by month and count unique days
        const monthlyMap = new Map<string, Set<string>>();

        relevantWorkouts.forEach((workout: any) => {
            const startTime = new Date(workout.start_time);

            // Get the timezone offset from the workout or assume NY time
            const timezoneOffset = workout.timezone_offset || '-05:00';

            // Apply timezone offset to get local date
            const offsetHours = parseInt(timezoneOffset.split(':')[0]);
            const offsetMinutes = parseInt(timezoneOffset.split(':')[1]);
            const localTime = new Date(startTime.getTime() + (offsetHours * 60 + offsetMinutes) * 60 * 1000);

            const monthKey = `${localTime.getFullYear()}-${String(localTime.getMonth() + 1).padStart(2, '0')}`;
            const dayKey = localTime.toISOString().split('T')[0] ?? ''; // YYYY-MM-DD

            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, new Set());
            }
            if (dayKey) {
                monthlyMap.get(monthKey)!.add(dayKey);
            }
        });

        // Convert to array with days in month calculation
        const monthlyTrainingDays: MonthlyTrainingDaysData[] = [];

        monthlyMap.forEach((days, monthKey) => {
            const parts = monthKey.split('-').map(Number);
            const year = parts[0] ?? new Date().getFullYear();
            const month = parts[1] ?? 1;
            const daysInMonth = new Date(year, month, 0).getDate();

            monthlyTrainingDays.push({
                month: monthKey,
                trainingDays: days.size,
                daysInMonth
            });
        });

        // Sort by month chronologically
        monthlyTrainingDays.sort((a, b) => a.month.localeCompare(b.month));

        console.log('Monthly training days processed:', monthlyTrainingDays.length, 'months');
        console.log('Sample data:', monthlyTrainingDays.slice(0, 3));

        return monthlyTrainingDays;
    } catch (error) {
        console.error('Error fetching monthly training days:', error);
        return [];
    }
}


export default async function MyDataPage() {
    const strainData = await getStrainData();
    const monthlyStrainData = await getMonthlyStrainData();
    const strainRecoveryData = await getStrainRecoveryData();
    const workoutData = await getWorkoutData();
    const monthlyTrainingDays = await getMonthlyTrainingDays();

    return (
        <FitnessDashboardClient
            strainData={strainData}
            monthlyStrainData={monthlyStrainData}
            strainRecoveryData={strainRecoveryData}
            workoutData={workoutData}
            monthlyTrainingDays={monthlyTrainingDays}
        />
    );
}
