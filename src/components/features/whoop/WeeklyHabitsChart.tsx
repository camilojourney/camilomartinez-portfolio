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
    ReferenceLine,
    ReferenceArea,
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

const formatTime = (hour: number | null): string => {
    if (hour === null) return 'N/A';
    const hours = Math.floor(hour);
    const minutes = Math.round((hour - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Format standard deviation in minutes
const formatStdDev = (stdHour: number | null): string => {
    if (stdHour === null) return 'N/A';
    const minutes = Math.round(stdHour * 60);
    return `±${minutes} min`;
};

// Summary Stats Component - shows metrics below each chart
interface SummaryStatsProps {
    avgValue: string;
    avgLabel: string;
    successRate: number;
    successCount: number;
    totalCount: number;
    successLabel: string;
    trendWeeks: number;
    accentColor: string;
}

const SummaryStats = ({ avgValue, avgLabel, successRate, successCount, totalCount, successLabel, trendWeeks, accentColor }: SummaryStatsProps) => (
    <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-white/10">
        <div className="text-center">
            <p className="text-xs text-white/50">{avgLabel}</p>
            <p className="text-lg font-semibold" style={{ color: accentColor }}>{avgValue}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-white/50">Success Rate</p>
            <p className={`text-lg font-semibold ${successRate >= 70 ? 'text-green-400' : successRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {successRate.toFixed(1)}%
            </p>
        </div>
        <div className="text-center">
            <p className="text-xs text-white/50">{successLabel}</p>
            <p className="text-lg font-semibold text-white/80">{successCount} of {totalCount}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-white/50">Trend</p>
            <p className={`text-lg font-semibold ${trendWeeks >= 8 ? 'text-white/80' : 'text-yellow-400'}`}>
                {trendWeeks >= 8 ? '📈 Tracking' : `Need ${8 - trendWeeks}+ weeks`}
            </p>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label, metric, showTrainingDays }: any) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0]?.payload;
        return (
            <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
                <p className="font-semibold text-sm text-gray-900">
                    Week of {format(parseISO(label), 'MMM d, yyyy')}
                </p>
                {payload.map((entry: any, index: number) => {
                    const value = entry.value;
                    const displayValue = metric === 'time' ? formatTime(value) : value;
                    return (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-semibold">{displayValue}</span>
                        </p>
                    );
                })}
                {showTrainingDays && dataPoint?.trainingDays !== undefined && (
                    <p className="text-sm text-gray-600 mt-1 border-t border-gray-200 pt-1">
                        Training Days: <span className="font-semibold">{dataPoint.trainingDays}</span>
                    </p>
                )}
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

    const formatYAxisTime = (hour: number) => {
        return formatTime(hour);
    };

    // Use selected year data
    const recentData = yearData;

    // Calculate summary statistics
    const calcTrainingStats = () => {
        const validWeeks = recentData.filter(d => d.trainingDays !== null && d.trainingDays !== undefined);
        const total = validWeeks.length;
        const successWeeks = validWeeks.filter(d => d.trainingDays >= 5).length;
        const avg = total > 0 ? validWeeks.reduce((sum, d) => sum + d.trainingDays, 0) / total : 0;
        return { avg: avg.toFixed(1), successRate: total > 0 ? (successWeeks / total) * 100 : 0, successCount: successWeeks, total };
    };

    const calcMeditationStats = () => {
        const validWeeks = recentData.filter(d => d.meditationCount !== null && d.meditationCount !== undefined);
        const total = validWeeks.length;
        const successWeeks = validWeeks.filter(d => d.meditationCount >= 10).length;
        const avg = total > 0 ? validWeeks.reduce((sum, d) => sum + d.meditationCount, 0) / total : 0;
        return { avg: avg.toFixed(1), successRate: total > 0 ? (successWeeks / total) * 100 : 0, successCount: successWeeks, total };
    };

    const calcWakeTimeStats = () => {
        const validWeeks = recentData.filter(d => d.avgWakeHour !== null && d.avgWakeHour !== undefined);
        const total = validWeeks.length;
        // Goal: 8:00 AM ±20 min (7.67 - 8.33)
        const successWeeks = validWeeks.filter(d => d.avgWakeHour! >= 7.67 && d.avgWakeHour! <= 8.33).length;
        const avg = total > 0 ? validWeeks.reduce((sum, d) => sum + (d.avgWakeHour || 0), 0) / total : null;
        const avgStd = total > 0 ? validWeeks.reduce((sum, d) => sum + (d.stdWakeHour || 0), 0) / total : null;
        return { avg: avg !== null ? formatTime(avg) : 'N/A', avgStd: formatStdDev(avgStd), successRate: total > 0 ? (successWeeks / total) * 100 : 0, successCount: successWeeks, total };
    };

    const calcWorkoutTimeStats = () => {
        const validWeeks = recentData.filter(d => d.avgWorkoutHour !== null && d.avgWorkoutHour !== undefined);
        const total = validWeeks.length;
        // Goal: 9:00 AM ±20 min (8.67 - 9.33)
        const successWeeks = validWeeks.filter(d => d.avgWorkoutHour! >= 8.67 && d.avgWorkoutHour! <= 9.33).length;
        const avg = total > 0 ? validWeeks.reduce((sum, d) => sum + (d.avgWorkoutHour || 0), 0) / total : null;
        const avgStd = total > 0 ? validWeeks.reduce((sum, d) => sum + (d.stdWorkoutHour || 0), 0) / total : null;
        return { avg: avg !== null ? formatTime(avg) : 'N/A', avgStd: formatStdDev(avgStd), successRate: total > 0 ? (successWeeks / total) * 100 : 0, successCount: successWeeks, total };
    };

    const calcSleepTimeStats = () => {
        const validWeeks = recentData.filter(d => d.avgSleepStartHour !== null && d.avgSleepStartHour !== undefined);
        const total = validWeeks.length;
        // Goal: 12:30 AM ±30 min (0.0 - 1.0)
        const successWeeks = validWeeks.filter(d => d.avgSleepStartHour! >= 0 && d.avgSleepStartHour! <= 1).length;
        const avg = total > 0 ? validWeeks.reduce((sum, d) => sum + (d.avgSleepStartHour || 0), 0) / total : null;
        const avgStd = total > 0 ? validWeeks.reduce((sum, d) => sum + (d.stdSleepStartHour || 0), 0) / total : null;
        return { avg: avg !== null ? formatTime(avg) : 'N/A', avgStd: formatStdDev(avgStd), successRate: total > 0 ? (successWeeks / total) * 100 : 0, successCount: successWeeks, total };
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
                <h3 className="text-lg font-semibold text-white mb-2">Training Days per Week</h3>
                <p className="text-sm text-white/60 mb-4">Goal: 5 days/week</p>
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
                        <Tooltip content={<CustomTooltip metric="count" />} />
                        <ReferenceLine y={5} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Goal', fill: '#10b981' }} />
                        <Line
                            type="monotone"
                            dataKey="trainingDays"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            name="Training Days"
                        />
                    </LineChart>
                </ResponsiveContainer>
                <SummaryStats
                    avgValue={`${trainingStats.avg} days`}
                    avgLabel="Weekly Average"
                    successRate={trainingStats.successRate}
                    successCount={trainingStats.successCount}
                    totalCount={trainingStats.total}
                    successLabel="Weeks ≥5 Days"
                    trendWeeks={trainingStats.total}
                    accentColor="#3b82f6"
                />
            </div>

            {/* Meditation Sessions Chart */}
            <div className="bg-black/20 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Meditation Sessions per Week</h3>
                <p className="text-sm text-white/60 mb-4">Goal: 10 sessions/week</p>
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
                        <Tooltip content={<CustomTooltip metric="count" />} />
                        <ReferenceLine y={10} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Goal', fill: '#10b981' }} />
                        <Line
                            type="monotone"
                            dataKey="meditationCount"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ fill: '#8b5cf6', r: 4 }}
                            name="Meditation Sessions"
                        />
                    </LineChart>
                </ResponsiveContainer>
                <SummaryStats
                    avgValue={`${meditationStats.avg} sessions`}
                    avgLabel="Weekly Average"
                    successRate={meditationStats.successRate}
                    successCount={meditationStats.successCount}
                    totalCount={meditationStats.total}
                    successLabel="Weeks ≥10 Sessions"
                    trendWeeks={meditationStats.total}
                    accentColor="#8b5cf6"
                />
            </div>

            {/* Wake Time Chart with Std Dev */}
            <div className="bg-black/20 border border-cyan-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Average Wake Time</h3>
                <p className="text-sm text-white/60 mb-4">Goal: 8:00 AM ±20 min (7:40 - 8:20)</p>
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
                            domain={[6, 11]}
                            ticks={[6, 7, 8, 9, 10, 11]}
                            tickFormatter={formatYAxisTime}
                            tick={{ fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                        />
                        <Tooltip content={<CustomTooltip metric="time" />} />
                        {/* Goal range: 7:40 - 8:20 (7.67 - 8.33) */}
                        <ReferenceArea y1={7.67} y2={8.33} fill="#10b981" fillOpacity={0.1} />
                        <ReferenceLine y={8} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Goal', fill: '#10b981' }} />
                        <Line
                            type="monotone"
                            dataKey="avgWakeHour"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            dot={{ fill: '#06b6d4', r: 4 }}
                            name="Avg Wake Time"
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>

                {/* Standard Deviation Chart - smaller reference chart */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/50 mb-2">Consistency (Standard Deviation) - Lower is better</p>
                    <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={recentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="weekStart"
                                tickFormatter={formatXAxis}
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                stroke="rgba(255,255,255,0.1)"
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                domain={[0, 2]}
                                ticks={[0, 0.5, 1, 1.5, 2]}
                                tickFormatter={(v) => `±${Math.round(v * 60)}m`}
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                stroke="rgba(255,255,255,0.1)"
                            />
                            <Tooltip content={<StdDevTooltip />} />
                            {/* Goal: std dev under 30 min (0.5 hours) */}
                            <ReferenceLine y={0.5} stroke="#10b981" strokeDasharray="2 2" />
                            <Bar
                                dataKey="stdWakeHour"
                                fill="#06b6d4"
                                fillOpacity={0.6}
                                name="Std Dev"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <SummaryStats
                    avgValue={wakeStats.avg}
                    avgLabel="Weekly Average"
                    successRate={wakeStats.successRate}
                    successCount={wakeStats.successCount}
                    totalCount={wakeStats.total}
                    successLabel="Weeks in Range"
                    trendWeeks={wakeStats.total}
                    accentColor="#06b6d4"
                />
            </div>

            {/* Workout Time Chart with Std Dev */}
            <div className="bg-black/20 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Average Workout Start Time</h3>
                <p className="text-sm text-white/60 mb-4">Goal: 9:00 AM ±20 min (8:40 - 9:20)</p>
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
                            domain={[7, 14]}
                            ticks={[7, 8, 9, 10, 11, 12, 13, 14]}
                            tickFormatter={formatYAxisTime}
                            tick={{ fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                        />
                        <Tooltip content={<CustomTooltip metric="time" showTrainingDays={true} />} />
                        {/* Goal range: 8:40 - 9:20 (8.67 - 9.33) */}
                        <ReferenceArea y1={8.67} y2={9.33} fill="#10b981" fillOpacity={0.1} />
                        <ReferenceLine y={9} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Goal', fill: '#10b981' }} />
                        <Line
                            type="monotone"
                            dataKey="avgWorkoutHour"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ fill: '#22c55e', r: 4 }}
                            name="Avg Workout Time"
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>

                {/* Standard Deviation Chart - smaller reference chart */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/50 mb-2">Consistency (Standard Deviation) - Lower is better</p>
                    <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={recentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="weekStart"
                                tickFormatter={formatXAxis}
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                stroke="rgba(255,255,255,0.1)"
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                domain={[0, 3]}
                                ticks={[0, 1, 2, 3]}
                                tickFormatter={(v) => `±${Math.round(v * 60)}m`}
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                stroke="rgba(255,255,255,0.1)"
                            />
                            <Tooltip content={<StdDevTooltip />} />
                            {/* Goal: std dev under 30 min (0.5 hours) */}
                            <ReferenceLine y={0.5} stroke="#10b981" strokeDasharray="2 2" />
                            <Bar
                                dataKey="stdWorkoutHour"
                                fill="#22c55e"
                                fillOpacity={0.6}
                                name="Std Dev"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <SummaryStats
                    avgValue={workoutStats.avg}
                    avgLabel="Weekly Average"
                    successRate={workoutStats.successRate}
                    successCount={workoutStats.successCount}
                    totalCount={workoutStats.total}
                    successLabel="Weeks in Range"
                    trendWeeks={workoutStats.total}
                    accentColor="#22c55e"
                />
            </div>

            {/* Sleep Start Time Chart with Std Dev */}
            <div className="bg-black/20 border border-indigo-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Average Sleep Start Time (Bedtime)</h3>
                <p className="text-sm text-white/60 mb-4">Goal: 12:30 AM ±30 min (12:00 - 1:00 AM)</p>
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
                            domain={[0, 4]}
                            ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]}
                            tickFormatter={formatYAxisTime}
                            tick={{ fill: 'rgba(255,255,255,0.6)' }}
                            stroke="rgba(255,255,255,0.2)"
                        />
                        <Tooltip content={<CustomTooltip metric="time" />} />
                        {/* Goal range: 12:00 - 1:00 AM (0.0 - 1.0) */}
                        <ReferenceArea y1={0} y2={1} fill="#10b981" fillOpacity={0.1} />
                        <ReferenceLine y={0.5} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Goal (12:30 AM)', fill: '#10b981' }} />
                        <Line
                            type="monotone"
                            dataKey="avgSleepStartHour"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ fill: '#8b5cf6', r: 4 }}
                            name="Avg Sleep Start"
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>

                {/* Standard Deviation Chart - smaller reference chart */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/50 mb-2">Consistency (Standard Deviation) - Lower is better</p>
                    <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={recentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="weekStart"
                                tickFormatter={formatXAxis}
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                stroke="rgba(255,255,255,0.1)"
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                domain={[0, 2]}
                                ticks={[0, 0.5, 1, 1.5, 2]}
                                tickFormatter={(v) => `±${Math.round(v * 60)}m`}
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                stroke="rgba(255,255,255,0.1)"
                            />
                            <Tooltip content={<StdDevTooltip />} />
                            {/* Goal: std dev under 30 min (0.5 hours) */}
                            <ReferenceLine y={0.5} stroke="#10b981" strokeDasharray="2 2" />
                            <Bar
                                dataKey="stdSleepStartHour"
                                fill="#8b5cf6"
                                fillOpacity={0.6}
                                name="Std Dev"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <SummaryStats
                    avgValue={sleepStats.avg}
                    avgLabel="Weekly Average"
                    successRate={sleepStats.successRate}
                    successCount={sleepStats.successCount}
                    totalCount={sleepStats.total}
                    successLabel="Weeks in Range"
                    trendWeeks={sleepStats.total}
                    accentColor="#8b5cf6"
                />
            </div>
        </div>
    );
}
