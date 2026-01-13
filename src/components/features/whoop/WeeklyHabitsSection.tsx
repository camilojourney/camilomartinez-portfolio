'use client';

import React, { useEffect, useState } from 'react';
import { WeeklyHabitsChart } from '@/components/features/whoop/WeeklyHabitsChart';

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

export function WeeklyHabitsSection() {
    const [data, setData] = useState<WeeklyHabitsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(2026);

    useEffect(() => {
        async function fetchWeeklyHabits() {
            try {
                const response = await fetch('/api/weekly-habits');
                const result = await response.json();

                if (result.success && result.data) {
                    setData(result.data);
                } else {
                    setError(result.error || 'Failed to load data');
                }
            } catch (err) {
                console.error('Error fetching weekly habits:', err);
                setError('Failed to load weekly habits data');
            } finally {
                setLoading(false);
            }
        }

        fetchWeeklyHabits();
    }, []);

    if (loading) {
        return (
            <div className="py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Loading...
                    </span>
                </div>
                <p className="mt-4 text-white/60">Loading weekly habits data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <div className="text-red-400 font-semibold">{error}</div>
                <p className="mt-2 text-white/60">Please try refreshing the page.</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-white/60">No weekly habits data available yet.</p>
            </div>
        );
    }

    return (
        <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white">Weekly Goals Tracking</h2>
                    <p className="mt-4 text-lg text-white/70">
                        Track your progress against weekly goals for training, meditation, wake time, and workout timing.
                    </p>

                    {/* Year Toggle */}
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
                <WeeklyHabitsChart data={data} selectedYear={selectedYear} />
            </div>
        </section>
    );
}
