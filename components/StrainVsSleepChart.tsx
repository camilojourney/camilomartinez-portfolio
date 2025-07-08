'use client';

import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StrainVsSleepData {
    cycle_id: string;
    strain: number;
    sleep_performance_percentage: number;
    cycle_start: string;
}

const StrainVsSleepChart: React.FC = () => {
    const [data, setData] = useState<StrainVsSleepData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/charts/strain-vs-sleep');
                if (!response.ok) {
                    throw new Error('Failed to fetch strain vs sleep data');
                }
                const result = await response.json();
                setData(result.data || []);
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
                <div className="text-lg">Loading strain vs sleep data...</div>
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

    // Custom tooltip component
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-semibold">{`Date: ${new Date(data.cycle_start).toLocaleDateString()}`}</p>
                    <p className="text-blue-600">{`Strain: ${data.strain}`}</p>
                    <p className="text-green-600">{`Sleep Performance: ${data.sleep_performance_percentage}%`}</p>
                </div>
            );
        }
        return null;
    };

    // Calculate correlation coefficient
    const calculateCorrelation = (data: StrainVsSleepData[]) => {
        if (data.length < 2) return 0;

        const n = data.length;
        const sumX = data.reduce((sum, d) => sum + d.strain, 0);
        const sumY = data.reduce((sum, d) => sum + d.sleep_performance_percentage, 0);
        const sumXY = data.reduce((sum, d) => sum + (d.strain * d.sleep_performance_percentage), 0);
        const sumX2 = data.reduce((sum, d) => sum + (d.strain * d.strain), 0);
        const sumY2 = data.reduce((sum, d) => sum + (d.sleep_performance_percentage * d.sleep_performance_percentage), 0);

        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

        return denominator === 0 ? 0 : numerator / denominator;
    };

    const correlation = calculateCorrelation(data);

    return (
        <div className="w-full bg-white p-6 rounded-lg shadow-lg">
            <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                    Strain vs Sleep Performance
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Correlation coefficient: {correlation.toFixed(3)}
                    {Math.abs(correlation) > 0.3 && (
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${correlation > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {Math.abs(correlation) > 0.7 ? 'Strong' : 'Moderate'} {correlation > 0 ? 'Positive' : 'Negative'}
                        </span>
                    )}
                </p>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        type="number"
                        dataKey="strain"
                        domain={['dataMin - 1', 'dataMax + 1']}
                        label={{ value: 'Strain', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="sleep_performance_percentage"
                        domain={['dataMin - 5', 'dataMax + 5']}
                        label={{ value: 'Sleep Performance (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Scatter
                        dataKey="sleep_performance_percentage"
                        fill="#36A2EB"
                        fillOpacity={0.7}
                        stroke="#36A2EB"
                        strokeWidth={1}
                    />
                </ScatterChart>
            </ResponsiveContainer>

            {data.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                    No strain vs sleep data available
                </div>
            )}
        </div>
    );
};

export default StrainVsSleepChart;
