'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StrainVsHRVData {
    cycle_id: string;
    strain: number;
    hrv_rmssd_milli: number;
    cycle_start: string;
    recovery_score?: number;
    sleep_performance_percentage?: number;
    resting_heart_rate?: number;
}

interface Props {
    data: StrainVsHRVData[];
}

export default function StrainVsHRVChartStatic({ data }: Props) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-white/60 text-xl mb-2">📊 No Strain vs HRV Data</div>
                    <div className="text-white/40">No correlation data available for analysis</div>
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
                    <p className="font-semibold text-white">{`Date: ${new Date(data.cycle_start).toLocaleDateString()}`}</p>
                    <p className="text-blue-400">{`Strain: ${data.strain}`}</p>
                    <p className="text-green-400">{`HRV: ${data.hrv_rmssd_milli}ms`}</p>
                    {data.recovery_score && (
                        <p className="text-purple-400">{`Recovery: ${data.recovery_score}%`}</p>
                    )}
                    {data.sleep_performance_percentage && (
                        <p className="text-yellow-400">{`Sleep: ${data.sleep_performance_percentage}%`}</p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Calculate correlation coefficient
    const calculateCorrelation = (data: StrainVsHRVData[]) => {
        if (data.length < 2) return 0;

        const n = data.length;
        const sumX = data.reduce((sum, d) => sum + d.strain, 0);
        const sumY = data.reduce((sum, d) => sum + d.hrv_rmssd_milli, 0);
        const sumXY = data.reduce((sum, d) => sum + (d.strain * d.hrv_rmssd_milli), 0);
        const sumX2 = data.reduce((sum, d) => sum + (d.strain * d.strain), 0);
        const sumY2 = data.reduce((sum, d) => sum + (d.hrv_rmssd_milli * d.hrv_rmssd_milli), 0);

        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

        return denominator === 0 ? 0 : numerator / denominator;
    };

    const correlation = calculateCorrelation(data);

    // Calculate some summary stats
    const avgStrain = data.reduce((sum, d) => sum + d.strain, 0) / data.length;
    const avgHRV = data.reduce((sum, d) => sum + d.hrv_rmssd_milli, 0) / data.length;

    return (
        <div className="w-full space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                    <div className="text-2xl font-bold text-blue-400">{avgStrain.toFixed(1)}</div>
                    <div className="text-white/60 text-sm">Average Strain</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                    <div className="text-2xl font-bold text-green-400">{avgHRV.toFixed(1)}ms</div>
                    <div className="text-white/60 text-sm">Average HRV</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                    <div className="text-2xl font-bold text-purple-400">{correlation.toFixed(3)}</div>
                    <div className="text-white/60 text-sm">Correlation Coefficient</div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <div className="mb-4">
                    <h3 className="text-xl font-semibold text-white">
                        Strain vs HRV Scatter Plot
                    </h3>
                    <p className="text-sm text-white/60 mt-1">
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
                            dataKey="strain"
                            domain={['dataMin - 1', 'dataMax + 1']}
                            label={{ value: 'Strain', position: 'insideBottom', offset: -5, fill: '#ffffff80' }}
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
                            fill="#36A2EB"
                            fillOpacity={0.7}
                            stroke="#36A2EB"
                            strokeWidth={1}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Insights */}
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">📈 Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-white/80">Data Points:</span>
                        <span className="text-white ml-2">{data.length} cycles</span>
                    </div>
                    <div>
                        <span className="text-white/80">Relationship:</span>
                        <span className="text-white ml-2">
                            {Math.abs(correlation) < 0.1 ? 'No correlation' :
                                Math.abs(correlation) < 0.3 ? 'Weak correlation' :
                                    Math.abs(correlation) < 0.7 ? 'Moderate correlation' : 'Strong correlation'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
