'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WorkoutCountData {
    week: string;
    sport_name: string;
    workout_count: number;
}

interface SportAverage {
    sport_name: string;
    avg_per_week: number;
    total_workouts: number;
}

interface Props {
    weeklyData: WorkoutCountData[];
    sportAverages: SportAverage[];
}

const sportColors: { [key: string]: string } = {
    'weightlifting': '#FF6B6B',
    'running': '#AF52DE',
    'boxing': '#FF9500',
    'table-tennis': '#64D2FF'
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-xl">
                <p className="text-white font-medium mb-2">{`Week of ${label}`}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {`${entry.name}: ${entry.value} workout${entry.value !== 1 ? 's' : ''}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function WorkoutCountChartStatic({ weeklyData, sportAverages }: Props) {
    if (weeklyData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-white/60 text-xl mb-2">🏋️ No Workout Data</div>
                    <div className="text-white/40">No workout data available for the last 3 months</div>
                </div>
            </div>
        );
    }

    // Transform data for stacked bar chart
    const chartData = weeklyData.reduce((acc: any, item) => {
        const existingWeek = acc.find((w: any) => w.week === item.week);
        if (existingWeek) {
            existingWeek[item.sport_name] = item.workout_count;
        } else {
            acc.push({
                week: item.week,
                [item.sport_name]: item.workout_count
            });
        }
        return acc;
    }, []);

    // Sort by week and format dates
    chartData.sort((a: any, b: any) => new Date(a.week).getTime() - new Date(b.week).getTime());

    // Format week labels as month/day
    const formattedChartData = chartData.map((item: any) => ({
        ...item,
        week: new Date(item.week).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    }));

    // Get unique sports for the chart
    const uniqueSports = Array.from(new Set(weeklyData.map(d => d.sport_name)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Chart */}
                <div className="flex-1 liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={formattedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="week"
                                tick={{ fontSize: 11, fill: '#ffffff80' }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                stroke="rgba(255,255,255,0.3)"
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#ffffff80' }}
                                stroke="rgba(255,255,255,0.3)"
                                label={{ value: 'Number of Workouts', angle: -90, position: 'insideLeft', fill: '#ffffff80' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {uniqueSports.map((sport, index) => (
                                <Bar
                                    key={sport}
                                    dataKey={sport}
                                    stackId="workouts"
                                    fill={sportColors[sport] || `hsl(${(index * 360 / uniqueSports.length)}, 70%, 60%)`}
                                    name={sport === 'table-tennis' ? 'Table Tennis' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Averages Sidebar */}
                <div className="lg:w-80 liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 text-center">
                        📊 3-Month Averages
                    </h3>
                    <div className="space-y-3">
                        {sportAverages.map((sport, index) => (
                            <div
                                key={sport.sport_name}
                                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: sportColors[sport.sport_name] || `hsl(${(index * 360 / sportAverages.length)}, 70%, 60%)` }}
                                    ></div>
                                    <div className="text-white/90 font-medium text-sm capitalize">
                                        {sport.sport_name === 'table-tennis' ? 'Table Tennis' :
                                            sport.sport_name.charAt(0).toUpperCase() + sport.sport_name.slice(1)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-white">
                                        {Number(sport.avg_per_week).toFixed(1)}
                                    </div>
                                    <div className="text-white/60 text-xs">avg/week</div>
                                    <div className="text-white/40 text-xs mt-1">
                                        {sport.total_workouts} total
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Summary */}
                    <div className="mt-6 bg-orange-500/10 backdrop-blur-sm rounded-lg p-4 border border-orange-400/20">
                        <div className="text-center">
                            <div className="text-orange-300 font-medium text-sm mb-2">Total Weekly Average</div>
                            <div className="text-2xl font-bold text-orange-400">
                                {sportAverages.reduce((sum, sport) => sum + Number(sport.avg_per_week), 0).toFixed(1)}
                            </div>
                            <div className="text-orange-300/60 text-xs">workouts/week</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
