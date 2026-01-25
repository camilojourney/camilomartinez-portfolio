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

    // Calculate yearly averages for all years (completed or current)
    const yearlyAverages = yearData.length > 0 ? {
        avgTrainingDays: Math.round(yearData.reduce((sum, w) => sum + w.trainingDays, 0) / yearData.length),
        avgMeditations: Math.round(yearData.reduce((sum, w) => sum + w.meditationSessions, 0) / yearData.length),
        avgWakeStdDev: (() => {
            const validWeeks = yearData.filter(w => w.wakeTimeStdDev > 0);
            if (validWeeks.length === 0) return 0;
            return Math.round(validWeeks.reduce((sum, w) => sum + w.wakeTimeStdDev, 0) / validWeeks.length);
        })(),
        avgWorkoutStdDev: (() => {
            const validWeeks = yearData.filter(w => w.workoutStartStdDev > 0);
            if (validWeeks.length === 0) return 0;
            return Math.round(validWeeks.reduce((sum, w) => sum + w.workoutStartStdDev, 0) / validWeeks.length);
        })(),
        avgSleepStdDev: (() => {
            const validWeeks = yearData.filter(w => w.sleepStartStdDev > 0);
            if (validWeeks.length === 0) return 0;
            return Math.round(validWeeks.reduce((sum, w) => sum + w.sleepStartStdDev, 0) / validWeeks.length);
        })(),
        totalWeeks: yearData.length
    } : null;

    // Calculate monthly averages for all years (completed or current)
    const monthlyAverages = yearData.length > 0 ? (() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData: { [key: number]: WeeklyAccountabilityData[] } = {};

        // Group weeks by month
        yearData.forEach(week => {
            const date = new Date(week.weekStart);
            const month = date.getMonth(); // 0-11
            if (!monthlyData[month]) {
                monthlyData[month] = [];
            }
            monthlyData[month].push(week);
        });

        // Calculate averages for each month
        return Object.keys(monthlyData)
            .map(monthKey => {
                const month = parseInt(monthKey);
                const weeks = monthlyData[month];
                const validWakeWeeks = weeks.filter(w => w.wakeTimeStdDev > 0);
                const validWorkoutWeeks = weeks.filter(w => w.workoutStartStdDev > 0);
                const validSleepWeeks = weeks.filter(w => w.sleepStartStdDev > 0);

                return {
                    month: months[month],
                    avgTrainingDays: Math.round(weeks.reduce((sum, w) => sum + w.trainingDays, 0) / weeks.length),
                    avgMeditations: Math.round(weeks.reduce((sum, w) => sum + w.meditationSessions, 0) / weeks.length),
                    avgWakeStdDev: validWakeWeeks.length > 0
                        ? Math.round(validWakeWeeks.reduce((sum, w) => sum + w.wakeTimeStdDev, 0) / validWakeWeeks.length)
                        : 0,
                    avgWorkoutStdDev: validWorkoutWeeks.length > 0
                        ? Math.round(validWorkoutWeeks.reduce((sum, w) => sum + w.workoutStartStdDev, 0) / validWorkoutWeeks.length)
                        : 0,
                    avgSleepStdDev: validSleepWeeks.length > 0
                        ? Math.round(validSleepWeeks.reduce((sum, w) => sum + w.sleepStartStdDev, 0) / validSleepWeeks.length)
                        : 0,
                    weekCount: weeks.length
                };
            })
            .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
    })() : null;

    // Display data (yearly average or most recent week)
    const currentYear = new Date().getFullYear();
    const isCompletedYear = selectedYear < currentYear;

    const displayData = yearlyAverages ? {
        trainingDays: yearlyAverages.avgTrainingDays,
        meditationSessions: yearlyAverages.avgMeditations,
        wakeTimeStdDev: yearlyAverages.avgWakeStdDev,
        workoutStartStdDev: yearlyAverages.avgWorkoutStdDev,
        sleepStartStdDev: yearlyAverages.avgSleepStdDev,
    } : mostRecentWeek || {
        trainingDays: 0,
        meditationSessions: 0,
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
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {/* Training Days */}
                        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-400/30">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">💪</span>
                                <h3 className="text-sm font-semibold text-white">Training</h3>
                            </div>
                            <p className="text-white/50 text-xs mb-2">Building strength</p>
                            <div className="text-2xl font-bold text-amber-400">
                                {displayData.trainingDays} {displayData.trainingDays === 1 ? 'day' : 'days'}
                            </div>
                            <p className="text-white/40 text-xs mt-1">{periodLabel}</p>
                        </Card>

                        {/* Meditation Sessions */}
                        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/30">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">🧘</span>
                                <h3 className="text-sm font-semibold text-white">Meditation</h3>
                            </div>
                            <p className="text-white/50 text-xs mb-2">Mental clarity</p>
                            <div className="text-2xl font-bold text-purple-400">
                                {displayData.meditationSessions} sessions
                            </div>
                            <p className="text-white/40 text-xs mt-1">{periodLabel}</p>
                        </Card>

                        {/* Wake Stability */}
                        <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-400/30">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">☀️</span>
                                <h3 className="text-sm font-semibold text-white">Wake</h3>
                            </div>
                            <p className="text-white/50 text-xs mb-2">Morning routine</p>
                            <div className="text-2xl font-bold text-cyan-400">
                                {displayData.wakeTimeStdDev === 0 ? 'N/A' : `±${Math.round(displayData.wakeTimeStdDev)} min`}
                            </div>
                            <p className="text-white/40 text-xs mt-1">{displayData.wakeTimeStdDev === 0 ? '≤1 data point' : periodLabel}</p>
                        </Card>

                        {/* Workout Consistency */}
                        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">🏃</span>
                                <h3 className="text-sm font-semibold text-white">Workout</h3>
                            </div>
                            <p className="text-white/50 text-xs mb-2">Time consistency</p>
                            <div className="text-2xl font-bold text-green-400">
                                {displayData.workoutStartStdDev === 0 ? 'N/A' : `±${Math.round(displayData.workoutStartStdDev)} min`}
                            </div>
                            <p className="text-white/40 text-xs mt-1">{displayData.workoutStartStdDev === 0 ? '≤1 workout' : periodLabel}</p>
                        </Card>

                        {/* Sleep Consistency */}
                        <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-400/30">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">🌙</span>
                                <h3 className="text-sm font-semibold text-white">Sleep</h3>
                            </div>
                            <p className="text-white/50 text-xs mb-2">Recovery routine</p>
                            <div className="text-2xl font-bold text-indigo-400">
                                {displayData.sleepStartStdDev === 0 ? 'N/A' : `±${Math.round(displayData.sleepStartStdDev)} min`}
                            </div>
                            <p className="text-white/40 text-xs mt-1">{displayData.sleepStartStdDev === 0 ? '≤1 data point' : periodLabel}</p>
                        </Card>
                    </div>
                </>
            )}

            {/* Weekly Progress Table */}
            {showTable && (
                <Card className="p-6 bg-black/20 border-white/10 mx-auto max-w-5xl">
                    <h3 className="text-xl font-semibold text-white mb-6 text-center">
                        {isCompletedYear ? `${selectedYear} Year Summary` : `Weekly Progress Tracker - ${selectedYear}`}
                    </h3>

                    {/* For all years, show yearly average row */}
                    {yearlyAverages && (
                        <>
                            <div className="overflow-x-auto flex justify-center">
                                <table className="text-sm">
                                    <thead>
                                        <tr className="border-b border-white/20">
                                            <th className="text-left py-3 px-4 text-white/80 font-medium w-32">Period</th>
                                            <th className="text-center py-3 px-4 text-white/80 font-medium w-24">Training<br />Days</th>
                                            <th className="text-center py-3 px-4 text-white/80 font-medium w-24">Meditation<br />Sessions</th>
                                            <th className="text-center py-3 px-4 text-white/80 font-medium w-28">Wake<br />Stability</th>
                                            <th className="text-center py-3 px-4 text-white/80 font-medium w-28">Workout<br />Consistency</th>
                                            <th className="text-center py-3 px-4 text-white/80 font-medium w-28">Sleep<br />Consistency</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-white/10 bg-amber-500/10">
                                            <td className="py-3 px-4 text-white/90 font-semibold">
                                                {isCompletedYear ? 'Year Average' : 'Year to Date'}
                                                <span className="ml-2 text-amber-400 text-xs">({yearlyAverages.totalWeeks} weeks)</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-semibold text-white/80">
                                                    {yearlyAverages.avgTrainingDays} {yearlyAverages.avgTrainingDays === 1 ? 'day' : 'days'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-semibold text-white/80">
                                                    {yearlyAverages.avgMeditations}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-semibold text-cyan-400">
                                                    {yearlyAverages.avgWakeStdDev === 0 ? 'N/A' : `±${yearlyAverages.avgWakeStdDev} min`}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-semibold text-green-400">
                                                    {yearlyAverages.avgWorkoutStdDev === 0 ? 'N/A' : `±${yearlyAverages.avgWorkoutStdDev} min`}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-semibold text-indigo-400">
                                                    {yearlyAverages.avgSleepStdDev === 0 ? 'N/A' : `±${yearlyAverages.avgSleepStdDev} min`}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Monthly Breakdown */}
                            {(monthlyAverages?.length ?? 0) > 0 && (
                                <details className="mt-6">
                                    <summary className="cursor-pointer text-center text-white/70 hover:text-white/90 transition-colors py-2">
                                        Show monthly breakdown ▼
                                    </summary>
                                    <div className="mt-4 overflow-x-auto flex justify-center">
                                        <table className="text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-2 px-4 text-white/60 font-medium text-xs">Month</th>
                                                    <th className="text-center py-2 px-4 text-white/60 font-medium text-xs">Training<br />(avg)</th>
                                                    <th className="text-center py-2 px-4 text-white/60 font-medium text-xs">Meditation<br />(avg)</th>
                                                    <th className="text-center py-2 px-4 text-white/60 font-medium text-xs">Wake<br />(avg)</th>
                                                    <th className="text-center py-2 px-4 text-white/60 font-medium text-xs">Workout<br />(avg)</th>
                                                    <th className="text-center py-2 px-4 text-white/60 font-medium text-xs">Sleep<br />(avg)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {monthlyAverages.map((month) => (
                                                    <tr key={month.month} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="py-2 px-4 text-white/70 font-medium text-sm">
                                                            {month.month}
                                                            <span className="ml-2 text-white/40 text-xs">({month.weekCount}w)</span>
                                                        </td>
                                                        <td className="py-2 px-4 text-center">
                                                            <span className="text-white/70 text-sm">
                                                                {month.avgTrainingDays} {month.avgTrainingDays === 1 ? 'day' : 'days'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4 text-center">
                                                            <span className="text-white/70 text-sm">{month.avgMeditations}</span>
                                                        </td>
                                                        <td className="py-2 px-4 text-center">
                                                            <span className="text-cyan-400/80 text-sm">
                                                                {month.avgWakeStdDev === 0 ? 'N/A' : `±${month.avgWakeStdDev} min`}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4 text-center">
                                                            <span className="text-green-400/80 text-sm">
                                                                {month.avgWorkoutStdDev === 0 ? 'N/A' : `±${month.avgWorkoutStdDev} min`}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4 text-center">
                                                            <span className="text-indigo-400/80 text-sm">
                                                                {month.avgSleepStdDev === 0 ? 'N/A' : `±${month.avgSleepStdDev} min`}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="border-t-2 border-white/20 bg-amber-500/5">
                                                    <td className="py-2 px-4 text-white/90 font-semibold text-sm">
                                                        Year Total
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <span className="text-white/90 font-semibold text-sm">
                                                            {yearData.reduce((sum, w) => sum + w.trainingDays, 0)} days
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <span className="text-white/90 font-semibold text-sm">
                                                            {yearData.reduce((sum, w) => sum + w.meditationSessions, 0)} sessions
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <span className="text-white/50 text-xs">—</span>
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <span className="text-white/50 text-xs">—</span>
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <span className="text-white/50 text-xs">—</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            )}
                        </>
                    )}

                </Card>
            )}
        </div>
    );
}
