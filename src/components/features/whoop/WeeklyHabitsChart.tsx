'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';

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

interface WeeklyHabitsChartProps {
    data: WeeklyHabitsData[];
    selectedYear: number;
}

// Format standard deviation in minutes
const formatStdDev = (stdHour: number | null): string => {
    if (stdHour === null) return 'N/A';
    const minutes = Math.round(stdHour * 60);
    return `±${minutes} min`;
};

// Summary Stats Component - shows metrics below each chart (pull-focused, no success rates)
interface SummaryStatsProps {
    avgValue: string;
    avgLabel: string;
    last4WeeksAvg: string;
    totalCount: number;
    accentColor: string;
}

const SummaryStats = ({ avgValue, avgLabel, last4WeeksAvg, totalCount, accentColor }: SummaryStatsProps) => (
    <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-white/10">
        <div className="text-center">
            <p className="text-xs text-muted-foreground">{avgLabel}</p>
            <p className="text-lg font-semibold" style={{ color: accentColor }}>{avgValue}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-muted-foreground">Last 4 Weeks</p>
            <p className="text-lg font-semibold text-foreground">{last4WeeksAvg}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-muted-foreground">Weeks Tracked</p>
            <p className="text-lg font-semibold text-muted-foreground">{totalCount}</p>
        </div>
    </div>
);

// Stability Stats Component - for std dev charts
interface StabilityStatsProps {
    avgStdDev: string;
    last4WeeksAvg: string;
    totalCount: number;
    accentColor: string;
}

const StabilityStats = ({ avgStdDev, last4WeeksAvg, totalCount, accentColor }: StabilityStatsProps) => (
    <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-white/10">
        <div className="text-center">
            <p className="text-xs text-muted-foreground">Average Variance</p>
            <p className="text-lg font-semibold" style={{ color: accentColor }}>{avgStdDev}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-muted-foreground">Last 4 Weeks</p>
            <p className="text-lg font-semibold text-foreground">{last4WeeksAvg}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-muted-foreground">Weeks Tracked</p>
            <p className="text-lg font-semibold text-muted-foreground">{totalCount}</p>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
                <p className="font-semibold text-sm text-gray-900">
                    Week of {format(parseISO(label), 'MMM d, yyyy')}
                </p>
                {payload.map((entry: any, index: number) => {
                    return (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-semibold">{entry.value}</span>
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
};

// Tooltip for standard deviation charts
const StdDevTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                <p className="font-semibold text-xs text-gray-900">
                    Week of {format(parseISO(label), 'MMM d')}
                </p>
                {payload.map((entry: any, index: number) => {
                    const minutes = Math.round((entry.value || 0) * 60);
                    return (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                            Std Dev: <span className="font-semibold">±{minutes} min</span>
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
};

export function WeeklyHabitsChart({ data, selectedYear }: WeeklyHabitsChartProps) {
    // Filter for selected year data only
    const yearData = data.filter(item => {
        try {
            const date = parseISO(item.weekStart);
            return date.getFullYear() === selectedYear;
        } catch {
            return false;
        }
    });

    // Format data for X-axis labels
    const formatXAxis = (tickItem: string) => {
        try {
            return format(parseISO(tickItem), 'MMM d');
        } catch {
            return tickItem;
        }
    };

    // Use selected year data
    const recentData = yearData;

    // Get last 4 weeks of data (most recent)
    const last4Weeks = recentData.slice(-4);

    // Calculate summary statistics (pull-focused, no success rates)
    const calcTrainingStats = () => {
        const validWeeks = recentData.filter(d => d.trainingDays !== null && d.trainingDays !== undefined);
        const total = validWeeks.length;
        const avg = total > 0 ? validWeeks.reduce((sum, d) => sum + d.trainingDays, 0) / total : 0;

        // Last 4 weeks average
        const last4Valid = last4Weeks.filter(d => d.trainingDays !== null && d.trainingDays !== undefined);
        const last4Avg = last4Valid.length > 0
            ? last4Valid.reduce((sum, d) => sum + d.trainingDays, 0) / last4Valid.length
            : 0;

        return { avg: avg.toFixed(1), last4Avg: `${last4Avg.toFixed(1)} days`, total };
    };

    const calcMeditationStats = () => {
        const validWeeks = recentData.filter(d => d.meditationCount !== null && d.meditationCount !== undefined);
        const total = validWeeks.length;
        const avg = total > 0 ? validWeeks.reduce((sum, d) => sum + d.meditationCount, 0) / total : 0;

        // Last 4 weeks average
        const last4Valid = last4Weeks.filter(d => d.meditationCount !== null && d.meditationCount !== undefined);
        const last4Avg = last4Valid.length > 0
            ? last4Valid.reduce((sum, d) => sum + d.meditationCount, 0) / last4Valid.length
            : 0;

        return { avg: avg.toFixed(1), last4Avg: `${last4Avg.toFixed(1)} sessions`, total };
    };

    const calcWakeTimeStats = () => {
        const validWeeks = recentData.filter(d => d.stdWakeHour !== null && d.stdWakeHour !== undefined);
        const total = validWeeks.length;
        const avgStd = total > 0 ? validWeeks.reduce((sum, d) => sum + (d.stdWakeHour || 0), 0) / total : null;

        // Last 4 weeks average
        const last4Valid = last4Weeks.filter(d => d.stdWakeHour !== null && d.stdWakeHour !== undefined);
        const last4Avg = last4Valid.length > 0
            ? last4Valid.reduce((sum, d) => sum + (d.stdWakeHour || 0), 0) / last4Valid.length
            : null;

        return { avgStd: formatStdDev(avgStd), last4Avg: formatStdDev(last4Avg), total };
    };

    const calcWorkoutTimeStats = () => {
        const validWeeks = recentData.filter(d => d.stdWorkoutHour !== null && d.stdWorkoutHour !== undefined);
        const total = validWeeks.length;
        const avgStd = total > 0 ? validWeeks.reduce((sum, d) => sum + (d.stdWorkoutHour || 0), 0) / total : null;

        // Last 4 weeks average
        const last4Valid = last4Weeks.filter(d => d.stdWorkoutHour !== null && d.stdWorkoutHour !== undefined);
        const last4Avg = last4Valid.length > 0
            ? last4Valid.reduce((sum, d) => sum + (d.stdWorkoutHour || 0), 0) / last4Valid.length
            : null;

        return { avgStd: formatStdDev(avgStd), last4Avg: formatStdDev(last4Avg), total };
    };

    const calcSleepTimeStats = () => {
        const validWeeks = recentData.filter(d => d.stdSleepStartHour !== null && d.stdSleepStartHour !== undefined);
        const total = validWeeks.length;
        const avgStd = total > 0 ? validWeeks.reduce((sum, d) => sum + (d.stdSleepStartHour || 0), 0) / total : null;

        // Last 4 weeks average
        const last4Valid = last4Weeks.filter(d => d.stdSleepStartHour !== null && d.stdSleepStartHour !== undefined);
        const last4Avg = last4Valid.length > 0
            ? last4Valid.reduce((sum, d) => sum + (d.stdSleepStartHour || 0), 0) / last4Valid.length
            : null;

        return { avgStd: formatStdDev(avgStd), last4Avg: formatStdDev(last4Avg), total };
    };

    const trainingStats = calcTrainingStats();
    const meditationStats = calcMeditationStats();
    const wakeStats = calcWakeTimeStats();
    const workoutStats = calcWorkoutTimeStats();
    const sleepStats = calcSleepTimeStats();

    return (
        <div className="space-y-8">
            {/* Training Days Chart */}
            <div className="bg-black/20 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Training Days per Week</h3>
                <p className="text-sm text-muted-foreground mb-4">Building strength for longevity</p>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={recentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="weekStart"
                            tickFormatter={formatXAxis}
                            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[0, 7]}
                            ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                            tick={{ fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                        />
                        <Tooltip content={<CustomTooltip metric="count" />} isAnimationActive={false} />
                        <Line
                            type="monotone"
                            dataKey="trainingDays"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            name="Training Days"
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
                <SummaryStats
                    avgValue={`${trainingStats.avg} days`}
                    avgLabel="Weekly Average"
                    last4WeeksAvg={trainingStats.last4Avg}
                    totalCount={trainingStats.total}
                    accentColor="#3b82f6"
                />
            </div>

            {/* Meditation Sessions Chart */}
            <div className="bg-black/20 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Meditation Sessions per Week</h3>
                <p className="text-sm text-muted-foreground mb-4">Mental clarity for problem-solving</p>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={recentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="weekStart"
                            tickFormatter={formatXAxis}
                            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[0, 15]}
                            ticks={[0, 3, 6, 9, 12, 15]}
                            tick={{ fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                        />
                        <Tooltip content={<CustomTooltip metric="count" />} isAnimationActive={false} />
                        <Line
                            type="monotone"
                            dataKey="meditationCount"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ fill: '#8b5cf6', r: 4 }}
                            name="Meditation Sessions"
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
                <SummaryStats
                    avgValue={`${meditationStats.avg} sessions`}
                    avgLabel="Weekly Average"
                    last4WeeksAvg={meditationStats.last4Avg}
                    totalCount={meditationStats.total}
                    accentColor="#8b5cf6"
                />
            </div>

            {/* Wake Stability Chart (Std Dev only) */}
            <div className="bg-black/20 border border-cyan-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Wake Stability</h3>
                <p className="text-sm text-muted-foreground mb-4">Consistent morning routine - lower variance is better</p>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={recentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="weekStart"
                            tickFormatter={formatXAxis}
                            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[0, 2]}
                            ticks={[0, 0.5, 1, 1.5, 2]}
                            tickFormatter={(v) => `±${Math.round(v * 60)}m`}
                            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                        />
                        <Tooltip content={<StdDevTooltip />} isAnimationActive={false} />
                        <Bar
                            dataKey="stdWakeHour"
                            fill="#06b6d4"
                            fillOpacity={0.7}
                            name="Variance"
                            isAnimationActive={false}
                        />
                    </BarChart>
                </ResponsiveContainer>
                <StabilityStats
                    avgStdDev={wakeStats.avgStd}
                    last4WeeksAvg={wakeStats.last4Avg}
                    totalCount={wakeStats.total}
                    accentColor="#06b6d4"
                />
            </div>

            {/* Workout Consistency Chart (Std Dev only) */}
            <div className="bg-black/20 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Workout Consistency</h3>
                <p className="text-sm text-muted-foreground mb-4">Reliable routine = reliable output - lower variance is better</p>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={recentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="weekStart"
                            tickFormatter={formatXAxis}
                            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[0, 3]}
                            ticks={[0, 1, 2, 3]}
                            tickFormatter={(v) => `±${Math.round(v * 60)}m`}
                            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                        />
                        <Tooltip content={<StdDevTooltip />} isAnimationActive={false} />
                        <Bar
                            dataKey="stdWorkoutHour"
                            fill="#22c55e"
                            fillOpacity={0.7}
                            name="Variance"
                            isAnimationActive={false}
                        />
                    </BarChart>
                </ResponsiveContainer>
                <StabilityStats
                    avgStdDev={workoutStats.avgStd}
                    last4WeeksAvg={workoutStats.last4Avg}
                    totalCount={workoutStats.total}
                    accentColor="#22c55e"
                />
            </div>

            {/* Sleep Consistency Chart (Std Dev only) */}
            <div className="bg-black/20 border border-indigo-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Sleep Consistency</h3>
                <p className="text-sm text-muted-foreground mb-4">Recovery routine stability - lower variance is better</p>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={recentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="weekStart"
                            tickFormatter={formatXAxis}
                            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[0, 2]}
                            ticks={[0, 0.5, 1, 1.5, 2]}
                            tickFormatter={(v) => `±${Math.round(v * 60)}m`}
                            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                        />
                        <Tooltip content={<StdDevTooltip />} isAnimationActive={false} />
                        <Bar
                            dataKey="stdSleepStartHour"
                            fill="#8b5cf6"
                            fillOpacity={0.7}
                            name="Variance"
                            isAnimationActive={false}
                        />
                    </BarChart>
                </ResponsiveContainer>
                <StabilityStats
                    avgStdDev={sleepStats.avgStd}
                    last4WeeksAvg={sleepStats.last4Avg}
                    totalCount={sleepStats.total}
                    accentColor="#8b5cf6"
                />
            </div>
        </div>
    );
}
