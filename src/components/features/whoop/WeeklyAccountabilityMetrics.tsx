'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

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

interface WeeklyAccountabilityMetricsProps {
    data: WeeklyAccountabilityData[];
    selectedYear?: number;
    showCards?: boolean;  // Show summary cards (default: true)
    showTable?: boolean;  // Show progress table (default: true)
}

export function WeeklyAccountabilityMetrics({ data, selectedYear = 2026, showCards = true, showTable = true }: WeeklyAccountabilityMetricsProps) {
    // Filter data by selected year
    const yearData = data.filter(week => {
        const weekStart = new Date(week.weekStart);
        return weekStart.getFullYear() === selectedYear;
    });

    // Get the most recent week's data for Past Week Summary
    // Sort by weekStart descending and take the first one
    const getMostRecentWeek = () => {
        if (yearData.length === 0) return null;

        const sorted = [...yearData].sort((a, b) => {
            const dateA = new Date(a.weekStart).getTime();
            const dateB = new Date(b.weekStart).getTime();
            return dateB - dateA; // Newest first
        });

        return sorted[0];
    };

    const mostRecentWeek = getMostRecentWeek();

    // Sort by date (most recent first)
    const sortedWeeks = [...yearData].sort((a, b) => {
        const dateA = new Date(a.weekStart).getTime();
        const dateB = new Date(b.weekStart).getTime();
        return dateB - dateA; // Descending order (newest first)
    });

    // Get current/ongoing week (the most recent one)
    const currentWeek = sortedWeeks[0];

    const last6Weeks = sortedWeeks.slice(0, 6);
    const olderWeeks = sortedWeeks.slice(6);

    // Format date for display
    // Parse date string manually to avoid timezone issues
    // "2026-01-04" should display as Jan 4, not Jan 3
    const formatWeekLabel = (weekStart: string, weekEnd: string) => {
        // Parse YYYY-MM-DD format directly to avoid UTC timezone shift
        const parseLocalDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
            return { year, month, day };
        };
        
        const start = parseLocalDate(weekStart);
        const end = parseLocalDate(weekEnd);
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthStart = months[start.month - 1];
        const monthEnd = months[end.month - 1];

        if (monthStart === monthEnd) {
            return `${monthStart} ${start.day}-${end.day}`;
        }
        return `${monthStart} ${start.day}-${monthEnd} ${end.day}`;
    };

    // Check if goal is met
    const isGoalMet = (value: number, goal: number) => value >= goal;

    // Check if time is within goal range (in minutes from hour decimal)
    const isTimeGoalMet = (timeString: string, goalHour: number, toleranceMinutes: number) => {
        if (timeString === '--:--') return false;
        const [hours, minutes] = timeString.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        const goalMinutes = goalHour * 60;
        return Math.abs(totalMinutes - goalMinutes) <= toleranceMinutes;
    };

    // Check if sleep start time (bedtime) is within goal range (12:30 AM ± 30min)
    const isSleepStartGoalMet = (timeString: string) => {
        if (timeString === '--:--') return false;
        const [hours, minutes] = timeString.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        const goalMinutes = 0.5 * 60; // 12:30 AM = 0.5 hours = 30 minutes
        return Math.abs(totalMinutes - goalMinutes) <= 30; // ±30 min tolerance
    };

    // Get color class for goal status
    const getGoalColorClass = (met: boolean, partial: boolean = false) => {
        if (met) return 'text-green-400';
        if (partial) return 'text-amber-400';
        return 'text-red-400';
    };

    // Calculate yearly averages for completed years
    const currentYear = new Date().getFullYear();
    const isCompletedYear = selectedYear < currentYear;

    const yearlyAverages = isCompletedYear && yearData.length > 0 ? {
        avgTrainingDays: Math.round(yearData.reduce((sum, w) => sum + w.trainingDays, 0) / yearData.length),
        avgMeditations: Math.round(yearData.reduce((sum, w) => sum + w.meditationSessions, 0) / yearData.length),
        avgWakeTime: (() => {
            const validWakeTimes = yearData.filter(w => w.avgWakeTime !== '--:--');
            if (validWakeTimes.length === 0) return '--:--';
            const totalMinutes = validWakeTimes.reduce((sum, w) => {
                const [h, m] = w.avgWakeTime.split(':').map(Number);
                return sum + (h * 60 + m);
            }, 0);
            const avgMinutes = Math.round(totalMinutes / validWakeTimes.length);
            const hours = Math.floor(avgMinutes / 60);
            const minutes = avgMinutes % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        })(),
        avgWorkoutTime: (() => {
            const validWorkoutTimes = yearData.filter(w => w.avgWorkoutStartTime !== '--:--');
            if (validWorkoutTimes.length === 0) return '--:--';
            const totalMinutes = validWorkoutTimes.reduce((sum, w) => {
                const [h, m] = w.avgWorkoutStartTime.split(':').map(Number);
                return sum + (h * 60 + m);
            }, 0);
            const avgMinutes = Math.round(totalMinutes / validWorkoutTimes.length);
            const hours = Math.floor(avgMinutes / 60);
            const minutes = avgMinutes % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        })(),
        avgSleepStartTime: (() => {
            const validSleepTimes = yearData.filter(w => w.avgSleepStartTime !== '--:--');
            if (validSleepTimes.length === 0) return '--:--';
            const totalMinutes = validSleepTimes.reduce((sum, w) => {
                const [h, m] = w.avgSleepStartTime.split(':').map(Number);
                return sum + (h * 60 + m);
            }, 0);
            const avgMinutes = Math.round(totalMinutes / validSleepTimes.length);
            const hours = Math.floor(avgMinutes / 60);
            const minutes = avgMinutes % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        })(),
        totalWeeks: yearData.length
    } : null;

    // Display data (yearly average or most recent week)
    const displayData = isCompletedYear && yearlyAverages ? {
        trainingDays: yearlyAverages.avgTrainingDays,
        meditationSessions: yearlyAverages.avgMeditations,
        avgWakeTime: yearlyAverages.avgWakeTime,
        avgWorkoutStartTime: yearlyAverages.avgWorkoutTime,
        avgSleepStartTime: yearlyAverages.avgSleepStartTime,
        wakeTimeStdDev: 0,
        workoutStartStdDev: 0,
        sleepStartStdDev: 0,
    } : mostRecentWeek || {
        trainingDays: 0,
        meditationSessions: 0,
        avgWakeTime: '--:--',
        avgWorkoutStartTime: '--:--',
        avgSleepStartTime: '--:--',
        wakeTimeStdDev: 0,
        workoutStartStdDev: 0,
        sleepStartStdDev: 0,
    };

    const periodLabel = isCompletedYear ? `${selectedYear} Average (${yearlyAverages?.totalWeeks || 0} weeks)` : 'Last week';

    // Get the date range for the most recent week
    const lastWeekDateRange = mostRecentWeek
        ? formatWeekLabel(mostRecentWeek.weekStart, mostRecentWeek.weekEnd)
        : '';

    return (
        <div className="space-y-6">
            {/* Summary Cards Section */}
            {showCards && (
                <>
                    {/* Header with "Past Week" title and date range */}
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {isCompletedYear ? `${selectedYear} Summary` : 'Past Week Summary'}
                        </h3>
                        {!isCompletedYear && lastWeekDateRange && (
                            <p className="text-white/60 text-lg">
                                {lastWeekDateRange}
                            </p>
                        )}
                    </div>

                    {/* Weekly Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Training Days Goal */}
                        <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-400/30">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">💪</span>
                                <h3 className="text-lg font-semibold text-white">Training Days</h3>
                            </div>
                            <p className="text-white/60 text-sm mb-3">Goal: 5/7 days per week</p>
                            <div className="text-3xl font-bold text-amber-400">
                                {displayData.trainingDays}
                                <span className="text-white/60 text-lg">/7</span>
                            </div>
                            <p className="text-white/50 text-xs mt-2">{periodLabel}</p>
                        </Card>

                        {/* Meditation Sessions */}
                        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/30">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">🧘</span>
                                <h3 className="text-lg font-semibold text-white">Meditation</h3>
                            </div>
                            <p className="text-white/60 text-sm mb-3">Goal: 10 sessions per week</p>
                            <div className="text-3xl font-bold text-purple-400">
                                {displayData.meditationSessions}
                                <span className="text-white/60 text-lg">/10</span>
                            </div>
                            <p className="text-white/50 text-xs mt-2">{periodLabel}</p>
                        </Card>

                        {/* Wake Time */}
                        <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-400/30">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">☀️</span>
                                <h3 className="text-lg font-semibold text-white">Wake Time</h3>
                            </div>
                            <p className="text-white/60 text-sm mb-3">Goal: 8:00 ± 20 min</p>
                            <div className="text-3xl font-bold text-cyan-400">
                                {displayData.avgWakeTime}
                            </div>
                            <p className="text-white/50 text-xs mt-2">{periodLabel}</p>
                        </Card>

                        {/* Workout Start Time */}
                        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">🏃</span>
                                <h3 className="text-lg font-semibold text-white">Workout Start</h3>
                            </div>
                            <p className="text-white/60 text-sm mb-3">Goal: 9:00 ± 20 min</p>
                            <div className="text-3xl font-bold text-green-400">
                                {displayData.avgWorkoutStartTime}
                            </div>
                            <p className="text-white/50 text-xs mt-2">{periodLabel}</p>
                        </Card>

                        {/* Sleep Start Time */}
                        <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-400/30">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">🌙</span>
                                <h3 className="text-lg font-semibold text-white">Sleep Start</h3>
                            </div>
                            <p className="text-white/60 text-sm mb-3">Goal: 12:30 AM ± 30 min</p>
                            <div className="text-3xl font-bold text-indigo-400">
                                {displayData.avgSleepStartTime}
                            </div>
                            <p className="text-white/50 text-xs mt-2">{periodLabel}</p>
                        </Card>
                    </div>
                </>
            )}

            {/* Weekly Progress Table */}
            {showTable && (
                <Card className="p-6 bg-black/20 border-white/10 mx-auto max-w-5xl">
                    <h3 className="text-xl font-semibold text-white mb-6 text-center">Weekly Progress Tracker - {selectedYear}</h3>

                    {/* Last 6 Weeks */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="text-left py-3 px-4 text-white/80 font-medium">Week</th>
                                    <th className="text-center py-3 px-4 text-white/80 font-medium">Training<br />Days</th>
                                    <th className="text-center py-3 px-4 text-white/80 font-medium">Meditation<br />Sessions</th>
                                    <th className="text-center py-3 px-4 text-white/80 font-medium">Wake Time<br />(Avg ± SD)</th>
                                    <th className="text-center py-3 px-4 text-white/80 font-medium">Workout Start<br />(Avg ± SD)</th>
                                    <th className="text-center py-3 px-4 text-white/80 font-medium">Sleep Start<br />(Avg ± SD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {last6Weeks.map((week, index) => {
                                    const trainingGoalMet = isGoalMet(week.trainingDays, 5);
                                    const meditationGoalMet = isGoalMet(week.meditationSessions, 10);
                                    const wakeGoalMet = isTimeGoalMet(week.avgWakeTime, 8, 20);
                                    const workoutGoalMet = isTimeGoalMet(week.avgWorkoutStartTime, 9, 20);
                                    const sleepStartGoalMet = isSleepStartGoalMet(week.avgSleepStartTime);

                                    const isCurrent = index === 0;

                                    return (
                                        <tr
                                            key={week.weekStart}
                                            className={`border-b border-white/10 hover:bg-white/5 transition-colors ${isCurrent ? 'bg-amber-500/10' : ''}`}
                                        >
                                            <td className="py-3 px-4 text-white/90 font-medium">
                                                {formatWeekLabel(week.weekStart, week.weekEnd)}
                                                {isCurrent && (
                                                    <span className="ml-2 text-amber-400 text-xs">(Current)</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`font-bold ${getGoalColorClass(trainingGoalMet)}`}>
                                                    {week.trainingDays}/7
                                                </span>
                                                <span className="ml-2">
                                                    {trainingGoalMet ? '✅' : '⚠️'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`font-semibold ${getGoalColorClass(meditationGoalMet)}`}>
                                                    {week.meditationSessions}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className={`font-semibold ${getGoalColorClass(wakeGoalMet)}`}>
                                                    {week.avgWakeTime}
                                                </div>
                                                <div className="text-white/50 text-xs">± {Math.round(week.wakeTimeStdDev)} min</div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className={`font-semibold ${getGoalColorClass(workoutGoalMet)}`}>
                                                    {week.avgWorkoutStartTime}
                                                </div>
                                                <div className="text-white/50 text-xs">± {Math.round(week.workoutStartStdDev)} min</div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className={`font-semibold ${getGoalColorClass(sleepStartGoalMet)}`}>
                                                    {week.avgSleepStartTime}
                                                </div>
                                                <div className="text-white/50 text-xs">± {Math.round(week.sleepStartStdDev)} min</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Scrollable Older Weeks */}
                    {olderWeeks.length > 0 && (
                        <details className="mt-6">
                            <summary className="cursor-pointer text-center text-white/70 hover:text-white/90 transition-colors py-2">
                                Show {olderWeeks.length} older weeks ▼
                            </summary>
                            <div className="mt-4 max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {olderWeeks.map((week) => {
                                            const trainingGoalMet = isGoalMet(week.trainingDays, 5);
                                            const meditationGoalMet = isGoalMet(week.meditationSessions, 10);
                                            const wakeGoalMet = isTimeGoalMet(week.avgWakeTime, 8, 20);
                                            const workoutGoalMet = isTimeGoalMet(week.avgWorkoutStartTime, 9, 20);
                                            const sleepStartGoalMet = isSleepStartGoalMet(week.avgSleepStartTime);

                                            return (
                                                <tr
                                                    key={week.weekStart}
                                                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-white/90 font-medium">
                                                        {formatWeekLabel(week.weekStart, week.weekEnd)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`font-bold ${getGoalColorClass(trainingGoalMet)}`}>
                                                            {week.trainingDays}/7
                                                        </span>
                                                        <span className="ml-2">
                                                            {trainingGoalMet ? '✅' : '⚠️'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`font-semibold ${getGoalColorClass(meditationGoalMet)}`}>
                                                            {week.meditationSessions}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <div className={`font-semibold ${getGoalColorClass(wakeGoalMet)}`}>
                                                            {week.avgWakeTime}
                                                        </div>
                                                        <div className="text-white/50 text-xs">± {Math.round(week.wakeTimeStdDev)} min</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <div className={`font-semibold ${getGoalColorClass(workoutGoalMet)}`}>
                                                            {week.avgWorkoutStartTime}
                                                        </div>
                                                        <div className="text-white/50 text-xs">± {Math.round(week.workoutStartStdDev)} min</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <div className={`font-semibold ${getGoalColorClass(sleepStartGoalMet)}`}>
                                                            {week.avgSleepStartTime}
                                                        </div>
                                                        <div className="text-white/50 text-xs">± {Math.round(week.sleepStartStdDev)} min</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    )}

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="flex flex-wrap gap-6 justify-center text-sm text-white/60">
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">●</span>
                                <span>Goal Met</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-red-400">●</span>
                                <span>Goal Not Met</span>
                            </div>
                        </div>
                        <div className="mt-3 text-center text-sm text-white/60">
                            <span className="text-white/80 font-semibold">Goals: </span>
                            <span className="text-amber-400">5 training days</span>
                            <span className="mx-1">•</span>
                            <span className="text-purple-400">10 meditations</span>
                            <span className="mx-1">•</span>
                            <span className="text-cyan-400">8:00 (±20min) wake</span>
                            <span className="mx-1">•</span>
                            <span className="text-green-400">9:00 (±20min) workout</span>
                            <span className="mx-1">•</span>
                            <span className="text-indigo-400">12:30 AM (±30min) sleep</span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
