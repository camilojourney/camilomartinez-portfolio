'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import WorkoutTimeChart from '@/components/features/whoop/WorkoutTimeChart';
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

interface WorkoutTimeData {
    date: string;
    time: string;
    timeAsMinutes: number;
    workoutType: string;
}

interface AccountabilityDashboardProps {
    workoutTimeData: WorkoutTimeData[];
    weeklyMetrics: WeeklyAccountabilityData[];
    weeklyHabitsData: WeeklyHabitsData[];
}

export function AccountabilityDashboard({
    workoutTimeData,
    weeklyMetrics,
    weeklyHabitsData
}: AccountabilityDashboardProps) {
    const [selectedYear, setSelectedYear] = useState<number>(2026);

    // Filter workout data by selected year
    const filteredWorkoutData = workoutTimeData.filter(workout => {
        const year = parseInt(workout.date.split('-')[0]);
        return year === selectedYear;
    });

    return (
        <div className="space-y-20">
            {/* Weekly Accountability Metrics and Goals Tracking - FIRST */}
            {weeklyMetrics.length > 0 && (
                <div>
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full px-6 py-3 mb-6">
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                            <span className="text-purple-300 font-semibold tracking-wide">How consistent am I with my goals?</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            Weekly Accountability Tracker
                        </h2>
                        <p className="text-white/70 text-lg max-w-3xl mx-auto leading-relaxed">
                            Track my weekly progress across multiple commitments: <span className="font-bold text-amber-400">training frequency</span>, <span className="font-bold text-purple-400">meditation practice</span>, <span className="font-bold text-cyan-400">wake times</span>, and <span className="font-bold text-green-400">workout start times</span>.
                        </p>

                        {/* Year Toggle - shared across all sections */}
                        <div className="mt-6 inline-flex gap-2 bg-black/40 border border-white/20 rounded-lg p-1">
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

            {/* Morning Workout Challenge Chart - LAST */}
            <Card className="p-8 pt-12 border-white/10 hover:border-amber-400/30 transition-all duration-300 overflow-visible">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-full px-6 py-3 mb-6">
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                        <span className="text-amber-300 font-semibold tracking-wide">Am I winning my early morning battle?</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                        The Morning Workout Challenge
                    </h2>
                    <div className="space-y-4 text-white/70 text-lg max-w-3xl mx-auto leading-relaxed mb-6">
                        <h2 className="text-4xl font-bold text-center text-white mb-6">
                            Win The Morning, Win The Day
                        </h2>
                        <p className="text-center text-white/80 text-base max-w-2xl mx-auto">
                            Starting <span className="font-bold text-white">January 1, 2026</span>, I committed to working out <span className="font-bold text-white">before 9:00 AM</span> every day.
                            This is my <span className="font-bold text-amber-400">public accountability board</span> — tracking every workout, every morning, for everyone to see.
                        </p>
                    </div>
                </div>

                {/* Workout Time Chart Component */}
                <div className="border border-amber-500/30 bg-black/20 rounded-lg p-6">
                    {filteredWorkoutData.length > 0 ? (
                        <WorkoutTimeChart data={filteredWorkoutData} goalTime="09:00" />
                    ) : (
                        <div className="text-center p-8 text-white/60">
                            <div className="text-amber-400 text-3xl mb-3">⏰</div>
                            <p className="text-white/70 text-lg">No workout time data available for {selectedYear}.</p>
                            <p className="text-white/50 text-sm mt-2">
                                {selectedYear === 2025
                                    ? 'The morning workout challenge started January 1, 2026.'
                                    : 'Check that your database has workout records.'}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

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
