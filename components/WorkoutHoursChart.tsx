'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WorkoutHoursData {
    week: string;
    workout_type: string;
    total_hours: number;
}

interface WorkoutHoursSummary {
    workout_type: string;
    avg_hours_per_week: number;
    total_weeks: number;
}

interface ChartDataPoint {
    week: string;
    [key: string]: string | number;
}

const WorkoutHoursChart: React.FC = () => {
    const [weeklyData, setWeeklyData] = useState<WorkoutHoursData[]>([]);
    const [summary, setSummary] = useState<WorkoutHoursSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/charts/workout-hours-weekly');
                if (!response.ok) {
                    throw new Error('Failed to fetch workout hours data');
                }
                const data = await response.json();
                setWeeklyData(data.weeklyData || []);
                setSummary(data.summary || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-lg">Loading workout hours data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    // Get unique workout types and weeks
    const workoutTypes = Array.from(new Set(weeklyData.map(d => d.workout_type)));
    const weeks = Array.from(new Set(weeklyData.map(d => d.week))).sort();

    // Color palette for different workout types
    const colors = [
        '#FF6384',
        '#36A2EB',
        '#FFCD56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#C7C7C7',
        '#536293',
        '#FF63FF',
        '#63FF84',
    ];

    // Transform data for Recharts
    const chartData: ChartDataPoint[] = weeks.map(week => {
        const weekData: ChartDataPoint = { week };
        workoutTypes.forEach(type => {
            const entry = weeklyData.find(d => d.week === week && d.workout_type === type);
            weekData[type] = entry ? entry.total_hours : 0;
        });
        return weekData;
    });

    return (
        <div className="w-full">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Chart */}
                <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">
                        Workout Hours Per Week by Type
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="week"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip />
                            <Legend />
                            {workoutTypes.map((type, index) => (
                                <Line
                                    key={type}
                                    type="monotone"
                                    dataKey={type}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Sidebar with 3-month averages */}
                <div className="lg:w-80 bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        3-Month Averages (Hours/Week)
                    </h3>
                    <div className="space-y-3">
                        {summary
                            .sort((a, b) => b.avg_hours_per_week - a.avg_hours_per_week)
                            .map((item, index) => (
                                <div
                                    key={item.workout_type}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: colors[workoutTypes.indexOf(item.workout_type) % colors.length] }}
                                        />
                                        <span className="font-medium text-gray-700">
                                            {item.workout_type}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-gray-900">
                                            {item.avg_hours_per_week.toFixed(1)}h
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            over {item.total_weeks} weeks
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    {summary.length === 0 && (
                        <div className="text-gray-500 text-center py-4">
                            No workout data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkoutHoursChart;
