'use client';

import React, { useState } from 'react';
import { WeeklyHabitsAndMetrics } from '@/components/features/whoop/WeeklyHabitsAndMetrics';
import Link from 'next/link';

// Types
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

interface AccountabilityDashboardProps {
    weeklyMetrics: WeeklyAccountabilityData[];
    weeklyHabitsData: WeeklyHabitsData[];
}

export function AccountabilityDashboard({
    weeklyMetrics,
    weeklyHabitsData
}: AccountabilityDashboardProps) {
    const [selectedYear, setSelectedYear] = useState<number>(2026);

    return (
        <div className="space-y-20">
            {weeklyMetrics.length === 0 && (
                <div className="panel panel-pad max-w-2xl" role="status">
                    <h2 className="title-sm">No workout data yet</h2>
                    <p className="body-muted mt-2">
                        The board fills in once the WHOOP sync has stored at least one week of workouts. Check back after the next refresh.
                    </p>
                </div>
            )}
            {/* Weekly Accountability Metrics and Goals Tracking */}
            {weeklyMetrics.length > 0 && (
                <div>
                    {/* Year Toggle */}
                    <div className="mb-8">
                        <div className="inline-flex gap-1 rounded-lg border border-line bg-surface-2 p-1" role="group" aria-label="Year">
                            {[2025, 2026].map((year) => (
                                <button
                                    key={year}
                                    type="button"
                                    onClick={() => setSelectedYear(year)}
                                    aria-pressed={selectedYear === year}
                                    className={`min-h-10 rounded-md px-5 py-2 text-sm font-medium transition-colors ${selectedYear === year
                                        ? 'bg-ink text-page'
                                        : 'text-muted hover:text-ink'
                                        }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>
                    <WeeklyHabitsAndMetrics
                        habitsData={weeklyHabitsData}
                        metricsData={weeklyMetrics}
                        selectedYear={selectedYear}
                    />
                </div>
            )}

            {/* Call to Action - Read how I built this */}
            <section className="border-t border-line pt-12" aria-labelledby="accountability-cta">
                <h2 id="accountability-cta" className="title-lg">Want to see how this was built?</h2>
                <p className="body-muted mt-3 max-w-xl">Learn about the motivation, technical challenges, and how I track my morning workout commitment.</p>
                <Link href="/projects/accountability-partner" className="btn-primary mt-6">
                    Read the case study
                </Link>
            </section>
        </div>
    );
}
