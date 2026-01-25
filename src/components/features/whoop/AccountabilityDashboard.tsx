'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
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
            {/* Weekly Accountability Metrics and Goals Tracking */}
            {weeklyMetrics.length > 0 && (
                <div>
                    {/* Year Toggle */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex gap-2 bg-black/40 border border-white/20 rounded-lg p-1">
                            <button
                                onClick={() => setSelectedYear(2025)}
                                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${selectedYear === 2025
                                    ? 'bg-purple-500 text-white shadow-lg'
                                    : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                                    }`}
                            >
                                2025
                            </button>
                            <button
                                onClick={() => setSelectedYear(2026)}
                                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${selectedYear === 2026
                                    ? 'bg-purple-500 text-white shadow-lg'
                                    : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                                    }`}
                            >
                                2026
                            </button>
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
            <Card className="border-white/10 bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-amber-400/30 p-8 md:p-10 text-center space-y-4">
                <h3 className="text-2xl md:text-3xl font-semibold text-white">Want to see how this was built?</h3>
                <p className="text-white/70 text-lg">Learn about the motivation, technical challenges, and how I track my morning workout commitment.</p>
                <Link
                    href="/projects/accountability-partner"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/20 px-6 py-3 text-white font-medium transition-all duration-300 hover:scale-105 hover:border-amber-300/60 hover:bg-amber-500/30 hover:text-amber-100"
                >
                    <span>Read the case study</span>
                    <span aria-hidden className="text-lg">→</span>
                </Link>
            </Card>
        </div>
    );
}
