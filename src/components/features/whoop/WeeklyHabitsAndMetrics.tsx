'use client';

import React from 'react';
import { WeeklyHabitsChart } from '@/components/features/whoop/WeeklyHabitsChart';
import { WeeklyAccountabilityMetrics } from '@/components/features/whoop/WeeklyAccountabilityMetrics';

interface WeeklyHabitsData {
    weekStart: string;
    weekEnd: string;
    meditationCount: number;
    trainingDays: number;
    avgWakeHour: number | null;
    stdWakeHour: number | null;
    avgWorkoutHour: number | null;
    stdWorkoutHour: number | null;
    avgSleepStartHour: number | null;
    stdSleepStartHour: number | null;
}

interface WeeklyAccountabilityData {
    weekStart: string;
    weekEnd: string;
    trainingDays: number;
    meditationSessions: number;
    avgWakeTime: string;
    wakeTimeStdDev: number;
    avgWorkoutStartTime: string;
    workoutStartStdDev: number;
    avgSleepStartTime: string;
    sleepStartStdDev: number;
}

interface WeeklyHabitsAndMetricsProps {
    habitsData: WeeklyHabitsData[];
    metricsData: WeeklyAccountabilityData[];
    selectedYear: number;  // Now controlled by parent component
}

export function WeeklyHabitsAndMetrics({ habitsData, metricsData, selectedYear }: WeeklyHabitsAndMetricsProps) {
    return (
        <div className="space-y-12">
            {/* 1. Summary Cards - FIRST (Past Week at a glance) */}
            <WeeklyAccountabilityMetrics data={metricsData} selectedYear={selectedYear} showCards={true} showTable={false} />

            {/* 2. Charts - SECOND */}
            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <WeeklyHabitsChart data={habitsData} selectedYear={selectedYear} />
                </div>
            </div>

            {/* 3. Weekly Progress Table - THIRD (before Morning Workout Challenge) */}
            <WeeklyAccountabilityMetrics data={metricsData} selectedYear={selectedYear} showCards={false} showTable={true} />
        </div>
    );
}
