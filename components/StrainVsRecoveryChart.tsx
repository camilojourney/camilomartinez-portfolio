'use client';

import React, { useMemo } from 'react';

interface StrainVsRecoveryProps {
    data: Array<{
        strain_date: string;
        strain: number;
        recovery_score: number;
    }>;
}

interface DataPoint {
    strain: number;
    recovery: number;
    date: string;
    color: string;
}

export function StrainVsRecoveryChart({ data }: StrainVsRecoveryProps) {
    const processedData = useMemo(() => {
        const points: DataPoint[] = data.map(item => {
            const recovery = Number(item.recovery_score);
            const strain = Number(item.strain);

            // Color based on recovery score
            let color: string;
            if (recovery >= 67) {
                color = '#10b981'; // Green for good recovery (67%+)
            } else if (recovery >= 34) {
                color = '#f59e0b'; // Yellow for moderate recovery (34-66%)
            } else {
                color = '#ef4444'; // Red for poor recovery (<34%)
            }

            return {
                strain,
                recovery,
                date: item.strain_date,
                color
            };
        });

        return points;
    }, [data]);

    // Calculate trend line using linear regression
    const { slope, intercept, correlation } = useMemo(() => {
        if (processedData.length < 2) return { slope: 0, intercept: 0, correlation: 0 };

        const n = processedData.length;
        const sumX = processedData.reduce((sum, p) => sum + p.strain, 0);
        const sumY = processedData.reduce((sum, p) => sum + p.recovery, 0);
        const sumXY = processedData.reduce((sum, p) => sum + p.strain * p.recovery, 0);
        const sumXX = processedData.reduce((sum, p) => sum + p.strain * p.strain, 0);
        const sumYY = processedData.reduce((sum, p) => sum + p.recovery * p.recovery, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate correlation coefficient
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        const correlation = denominator === 0 ? 0 : numerator / denominator;

        return { slope, intercept, correlation };
    }, [processedData]);

    // Chart dimensions and scaling
    const chartWidth = 600;
    const chartHeight = 500; // Increased from 400 to 500 for better mobile viewing
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    // Scale functions
    const xScale = (strain: number) => (strain / 21) * plotWidth;
    const yScale = (recovery: number) => plotHeight - (recovery / 100) * plotHeight;

    // Generate trend line points
    const trendLineStart = { x: 0, y: intercept };
    const trendLineEnd = { x: 21, y: slope * 21 + intercept };

    // Stats for display
    const stats = useMemo(() => {
        const totalPoints = processedData.length;
        const avgStrain = processedData.reduce((sum, p) => sum + p.strain, 0) / totalPoints;
        const avgRecovery = processedData.reduce((sum, p) => sum + p.recovery, 0) / totalPoints;

        const goodRecoveryDays = processedData.filter(p => p.recovery >= 67).length;
        const moderateRecoveryDays = processedData.filter(p => p.recovery >= 34 && p.recovery < 67).length;
        const poorRecoveryDays = processedData.filter(p => p.recovery < 34).length;

        return {
            totalPoints,
            avgStrain: avgStrain.toFixed(1),
            avgRecovery: avgRecovery.toFixed(0),
            goodRecoveryDays,
            moderateRecoveryDays,
            poorRecoveryDays,
            correlationStrength: Math.abs(correlation) > 0.7 ? 'Strong' :
                Math.abs(correlation) > 0.3 ? 'Moderate' : 'Weak',
            correlationDirection: correlation > 0 ? 'Positive' : 'Negative'
        };
    }, [processedData, correlation]);

    if (!data || data.length === 0) {
        return (
            <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-4 sm:p-8 text-center">
                <div className="text-white/60 mb-4">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-xl font-light text-white mb-2">Insufficient Data</h3>
                    <p className="text-white/60 font-light">
                        Need both strain and recovery data to show correlation analysis.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-3 sm:p-8">
            {/* Header */}
            <div className="mb-4 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-light text-white mb-2 sm:mb-3 flex items-center gap-3">
                    <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></span>
                    Strain vs. Recovery: The Core Performance Loop
                </h2>
                <p className="text-white/70 font-light text-base sm:text-lg leading-relaxed">
                    Each dot represents one day, showing how training intensity impacts recovery capacity.
                    The trend line reveals the fundamental relationship between effort and restoration.
                </p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
                <div className="text-center p-1 sm:p-2">
                    <div className="text-xl sm:text-2xl font-light text-cyan-400 mb-1">{stats.totalPoints}</div>
                    <div className="text-white/60 text-xs sm:text-sm font-light">Data Points</div>
                </div>
                <div className="text-center p-1 sm:p-2">
                    <div className="text-xl sm:text-2xl font-light text-cyan-400 mb-1">{stats.avgStrain}</div>
                    <div className="text-white/60 text-xs sm:text-sm font-light">Avg Strain</div>
                </div>
                <div className="text-center p-1 sm:p-2">
                    <div className="text-xl sm:text-2xl font-light text-cyan-400 mb-1">{stats.avgRecovery}%</div>
                    <div className="text-white/60 text-xs sm:text-sm font-light">Avg Recovery</div>
                </div>
                <div className="text-center p-1 sm:p-2">
                    <div className="text-xl sm:text-2xl font-light text-cyan-400 mb-1">
                        {correlation >= 0 ? '+' : ''}{(correlation * 100).toFixed(0)}%
                    </div>
                    <div className="text-white/60 text-xs sm:text-sm font-light">Correlation</div>
                </div>
            </div>

            {/* Chart Container */}
            <div className="bg-black/20 rounded-2xl p-2 sm:p-6 mb-6">
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-auto max-w-4xl mx-auto"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Grid lines */}
                    <defs>
                        <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect
                        x={padding.left}
                        y={padding.top}
                        width={plotWidth}
                        height={plotHeight}
                        fill="url(#grid)"
                    />

                    {/* Axes */}
                    <line
                        x1={padding.left}
                        y1={padding.top + plotHeight}
                        x2={padding.left + plotWidth}
                        y2={padding.top + plotHeight}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="2"
                    />
                    <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={padding.top + plotHeight}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="2"
                    />

                    {/* X-axis labels */}
                    {[0, 5, 10, 15, 20].map(strain => (
                        <g key={strain}>
                            <text
                                x={padding.left + xScale(strain)}
                                y={padding.top + plotHeight + 20}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.6)"
                                fontSize="12"
                            >
                                {strain}
                            </text>
                        </g>
                    ))}

                    {/* Y-axis labels */}
                    {[0, 25, 50, 75, 100].map(recovery => (
                        <g key={recovery}>
                            <text
                                x={padding.left - 15}
                                y={padding.top + yScale(recovery) + 4}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.6)"
                                fontSize="12"
                            >
                                {recovery}%
                            </text>
                        </g>
                    ))}

                    {/* Trend line */}
                    <line
                        x1={padding.left + xScale(0)}
                        y1={padding.top + yScale(Math.max(0, Math.min(100, trendLineStart.y)))}
                        x2={padding.left + xScale(21)}
                        y2={padding.top + yScale(Math.max(0, Math.min(100, trendLineEnd.y)))}
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.8"
                    />

                    {/* Data points */}
                    {processedData.map((point, index) => (
                        <circle
                            key={index}
                            cx={padding.left + xScale(point.strain)}
                            cy={padding.top + yScale(point.recovery)}
                            r="5"
                            fill={point.color}
                            opacity="0.8"
                            className="hover:opacity-100 hover:r-6 transition-all duration-200"
                        >
                            <title>
                                {`Date: ${new Date(point.date).toLocaleDateString()}\nStrain: ${point.strain.toFixed(1)}\nRecovery: ${point.recovery.toFixed(0)}%`}
                            </title>
                        </circle>
                    ))}

                    {/* Axis labels */}
                    <text
                        x={padding.left + plotWidth / 2}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.8)"
                        fontSize="14"
                        fontWeight="300"
                    >
                        Strain Score
                    </text>
                    <text
                        x={20}
                        y={padding.top + plotHeight / 2}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.8)"
                        fontSize="14"
                        fontWeight="300"
                        transform={`rotate(-90, 20, ${padding.top + plotHeight / 2})`}
                    >
                        Recovery Score (%)
                    </text>
                </svg>
            </div>

            {/* Legend and Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                {/* Legend */}
                <div>
                    <h3 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-4">Recovery Zones</h3>
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <span className="text-white/80 text-sm">
                                Optimal Recovery (67%+): {stats.goodRecoveryDays} days
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                            <span className="text-white/80 text-sm">
                                Moderate Recovery (34-66%): {stats.moderateRecoveryDays} days
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                            <span className="text-white/80 text-sm">
                                Poor Recovery (&lt;34%): {stats.poorRecoveryDays} days
                            </span>
                        </div>
                    </div>
                </div>

                {/* Analysis */}
                <div>
                    <h3 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-4">Correlation Analysis</h3>
                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-white/80">
                        <p>
                            <span className="text-cyan-400 font-medium">Trend:</span> {stats.correlationDirection}
                            {correlation !== 0 && (
                                <span className="ml-1">
                                    {correlation > 0 ? '↗' : '↘'} {stats.correlationStrength} correlation
                                </span>
                            )}
                        </p>
                        <p className="text-white/60 font-light">
                            {Math.abs(correlation) > 0.3
                                ? correlation > 0
                                    ? "Higher strain days tend to result in better recovery scores—indicating effective training adaptation."
                                    : "Higher strain days tend to result in lower recovery scores—suggesting the need for better load management."
                                : "No clear linear relationship between strain and recovery—recovery depends on multiple factors beyond daily strain."
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
