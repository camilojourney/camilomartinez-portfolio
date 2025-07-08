'use client'

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WorkoutCountData {
    week: string;
    sport_name: string;
    workout_count: number;
    avg_per_week: string | number;
    total_workouts: number;
}

interface SportAverage {
    sport_name: string;
    avg_per_week: string | number;
    total_workouts: number;
}

const sportColors: { [key: string]: string } = {
    'weightlifting_msk': '#FF6B6B',
    'weightlifting': '#FF8E8E',
    'cycling': '#4ECDC4',
    'walking': '#45B7D1',
    'boxing': '#FF9500',
    'running': '#AF52DE',
    'activity': '#32D74B',
    'other': '#8E8E93',
    'hiit': '#FF453A',
    'tennis': '#30D158',
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

export default function WorkoutCountChart() {
    const [data, setData] = useState<WorkoutCountData[]>([]);
    const [averages, setAverages] = useState<SportAverage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/charts/workout-count-weekly')
            .then(res => res.json())
            .then(data => {
                if (data.weekly_data && data.sport_averages) {
                    setData(data.weekly_data);
                    setAverages(data.sport_averages);
                } else {
                    setError('Invalid data format');
                }
            })
            .catch(err => {
                console.error('Error fetching workout count data:', err);
                setError('Failed to fetch data');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
                    <div className="text-white/80 text-lg">Loading workout data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-2">⚠️ Error loading data</div>
                    <div className="text-white/60">{error}</div>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
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
    const weeklyData = data.reduce((acc: any, item) => {
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

    // Get unique sports for the chart
    const uniqueSports = Array.from(new Set(data.map(d => d.sport_name)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Chart */}
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-4 text-center">
                        Workouts Per Week by Sport Type
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
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
                                    name={sport.replace(/_/g, ' ').replace(/msk/g, '(MSK)')}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Averages Sidebar */}
                <div className="lg:w-80">
                    <h3 className="text-lg font-semibold text-white mb-4 text-center">
                        📊 3-Month Averages
                    </h3>
                    <div className="space-y-3">
                        {averages.map((sport, index) => (
                            <div
                                key={sport.sport_name}
                                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: sportColors[sport.sport_name] || `hsl(${(index * 360 / averages.length)}, 70%, 60%)` }}
                                    ></div>
                                    <div className="text-white/90 font-medium text-sm capitalize">
                                        {sport.sport_name.replace(/_/g, ' ').replace(/msk/g, '(MSK)')}
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
                                {averages.reduce((sum, sport) => sum + Number(sport.avg_per_week), 0).toFixed(1)}
                            </div>
                            <div className="text-orange-300/60 text-xs">workouts/week</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
