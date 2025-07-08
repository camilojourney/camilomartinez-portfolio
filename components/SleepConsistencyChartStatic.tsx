'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SleepConsistencyData {
    sleep_consistency_percentage: number;
    hrv_rmssd_milli: number;
    sleep_start: string;
    sleep_end: string;
}

interface Props {
    data: SleepConsistencyData[];
}

export default function SleepConsistencyChartStatic({ data }: Props) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-white/60 text-xl mb-2">😴 No Sleep Consistency Data</div>
                    <div className="text-white/40">No sleep consistency data available for analysis</div>
                </div>
            </div>
        );
    }

    // Custom tooltip component
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-xl">
                    <p className="font-semibold text-white">{`Date: ${new Date(data.sleep_start).toLocaleDateString()}`}</p>
                    <p className="text-purple-400">{`Sleep Consistency: ${data.sleep_consistency_percentage}%`}</p>
                    <p className="text-cyan-400">{`HRV: ${data.hrv_rmssd_milli} ms`}</p>
                </div>
            );
        }
        return null;
    };

    // Calculate correlation coefficient
    const calculateCorrelation = (data: SleepConsistencyData[]) => {
        if (data.length < 2) return 0;

        const n = data.length;
        const sumX = data.reduce((sum, d) => sum + d.sleep_consistency_percentage, 0);
        const sumY = data.reduce((sum, d) => sum + d.hrv_rmssd_milli, 0);
        const sumXY = data.reduce((sum, d) => sum + (d.sleep_consistency_percentage * d.hrv_rmssd_milli), 0);
        const sumX2 = data.reduce((sum, d) => sum + (d.sleep_consistency_percentage * d.sleep_consistency_percentage), 0);
        const sumY2 = data.reduce((sum, d) => sum + (d.hrv_rmssd_milli * d.hrv_rmssd_milli), 0);

        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

        return denominator === 0 ? 0 : numerator / denominator;
    };

    const correlation = calculateCorrelation(data);

    // Calculate summary stats
    const avgConsistency = data.reduce((sum, d) => sum + d.sleep_consistency_percentage, 0) / data.length;
    const avgHRV = data.reduce((sum, d) => sum + d.hrv_rmssd_milli, 0) / data.length;

    return (
        <div className="w-full space-y-6">
            {/* Header with Hypothesis */}
            <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <h3 className="text-2xl font-semibold text-white mb-2">
                    💤 Consistency is King Hypothesis
                </h3>
                <p className="text-white/70 leading-relaxed">
                    Does going to bed and waking up at consistent times actually improve recovery?
                    This scatter plot analyzes the relationship between sleep schedule consistency and Heart Rate Variability (HRV) -
                    a key indicator of recovery and autonomic nervous system health.
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="liquid-glass-card backdrop-blur-lg bg-purple-500/10 border border-purple-400/20 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{avgConsistency.toFixed(1)}%</div>
                    <div className="text-white/60 text-sm">Average Sleep Consistency</div>
                </div>
                <div className="liquid-glass-card backdrop-blur-lg bg-cyan-500/10 border border-cyan-400/20 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400">{avgHRV.toFixed(1)} ms</div>
                    <div className="text-white/60 text-sm">Average HRV</div>
                </div>
                <div className="liquid-glass-card backdrop-blur-lg bg-orange-500/10 border border-orange-400/20 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">{correlation.toFixed(3)}</div>
                    <div className="text-white/60 text-sm">Correlation Coefficient</div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <h4 className="text-xl font-semibold text-white">Sleep Consistency vs HRV Analysis</h4>
                    </div>
                    <p className="text-sm text-white/60">
                        Correlation: {correlation.toFixed(3)}
                        {Math.abs(correlation) > 0.3 && (
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${correlation > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {Math.abs(correlation) > 0.7 ? 'Strong' : 'Moderate'} {correlation > 0 ? 'Positive' : 'Negative'}
                            </span>
                        )}
                    </p>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            type="number"
                            dataKey="sleep_consistency_percentage"
                            domain={['dataMin - 5', 'dataMax + 5']}
                            label={{ value: 'Sleep Consistency (%)', position: 'insideBottom', offset: -5, fill: '#ffffff80' }}
                            tick={{ fill: '#ffffff80' }}
                            stroke="rgba(255,255,255,0.3)"
                        />
                        <YAxis
                            type="number"
                            dataKey="hrv_rmssd_milli"
                            domain={['dataMin - 5', 'dataMax + 5']}
                            label={{ value: 'HRV (ms)', angle: -90, position: 'insideLeft', fill: '#ffffff80' }}
                            tick={{ fill: '#ffffff80' }}
                            stroke="rgba(255,255,255,0.3)"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Scatter
                            dataKey="hrv_rmssd_milli"
                            fill="#A855F7"
                            fillOpacity={0.7}
                            stroke="#A855F7"
                            strokeWidth={1}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Insights */}
            <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🧠</span>
                    Data Science Insights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-white/80">Data Points:</span>
                            <span className="text-white font-medium">{data.length} nights</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/80">Relationship Strength:</span>
                            <span className="text-white font-medium">
                                {Math.abs(correlation) < 0.1 ? 'No correlation' :
                                    Math.abs(correlation) < 0.3 ? 'Weak correlation' :
                                        Math.abs(correlation) < 0.7 ? 'Moderate correlation' : 'Strong correlation'}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-white/80">Hypothesis Status:</span>
                            <span className={`font-medium ${correlation > 0.3 ? 'text-green-400' : correlation > 0.1 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {correlation > 0.3 ? '✅ Supported' : correlation > 0.1 ? '⚠️ Inconclusive' : '❌ Not Supported'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/80">Practical Impact:</span>
                            <span className="text-white font-medium">
                                {correlation > 0.3 ? 'High' : correlation > 0.1 ? 'Moderate' : 'Low'}
                            </span>
                        </div>
                    </div>
                </div>

                {correlation > 0.3 && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                        <p className="text-green-300 text-sm">
                            <strong>Key Finding:</strong> The data supports the "Consistency is King" hypothesis!
                            Maintaining consistent sleep schedules appears to positively impact recovery metrics.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
