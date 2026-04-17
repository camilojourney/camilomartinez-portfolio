'use client';

import React from 'react';

interface MonthlyTrainingDaysProps {
    data: Array<{
        month: string; // "YYYY-MM" format
        trainingDays: number;
        daysInMonth: number;
    }>;
    selectedYear: number;
}

export function MonthlyTrainingDays({ data, selectedYear }: MonthlyTrainingDaysProps) {
    // Filter data by selected year
    const yearData = data.filter(item => {
        const yearStr = item.month.split('-')[0] ?? '';
        const year = parseInt(yearStr, 10);
        return year === selectedYear;
    });

    // Create full year data with all 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullYearData = months.map((monthName, index) => {
        const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
        const monthData = yearData.find(d => d.month === monthKey);

        // Get days in month for the given year and month
        const daysInMonth = new Date(selectedYear, index + 1, 0).getDate();

        return {
            month: monthName,
            trainingDays: monthData?.trainingDays || 0,
            daysInMonth: monthData?.daysInMonth || daysInMonth
        };
    });

    // Find first and last month with data to trim empty months
    const firstMonthWithData = fullYearData.findIndex(m => m.trainingDays > 0);
    const lastMonthWithData = fullYearData.map(m => m.trainingDays > 0).lastIndexOf(true);

    const visibleData = firstMonthWithData !== -1 && lastMonthWithData !== -1
        ? fullYearData.slice(firstMonthWithData, lastMonthWithData + 1)
        : fullYearData;

    // Calculate chart dimensions
    const chartHeight = 120;
    const barWidth = 32; // Width per month
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = Math.max(700, visibleData.length * (barWidth + 8) + padding.left + padding.right);

    // Get max value for scaling (max days in a month is 31)
    const maxDays = 31;

    // Scale function
    const yScale = (days: number) => {
        return ((maxDays - days) / maxDays) * (chartHeight - padding.top - padding.bottom);
    };

    return (
        <div className="w-full bg-black/20 rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-light text-white mb-2 text-center">Monthly Training Days</h3>
            <p className="text-white/60 text-sm mb-4 text-center">
                How many days per month did I train?
            </p>

            {/* Scrollable chart container */}
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-400/30">
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-auto"
                    style={{ minWidth: `${chartWidth}px` }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Y-axis */}
                    <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={chartHeight - padding.bottom}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="2"
                    />

                    {/* X-axis */}
                    <line
                        x1={padding.left}
                        y1={chartHeight - padding.bottom}
                        x2={chartWidth - padding.right}
                        y2={chartHeight - padding.bottom}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="2"
                    />

                    {/* Y-axis labels and grid lines */}
                    {[0, 10, 20, 30].map((days) => (
                        <g key={days}>
                            <text
                                x={padding.left - 10}
                                y={padding.top + yScale(days)}
                                textAnchor="end"
                                fill="rgba(255,255,255,0.6)"
                                fontSize="12"
                                dominantBaseline="middle"
                            >
                                {days}
                            </text>
                            <line
                                x1={padding.left}
                                y1={padding.top + yScale(days)}
                                x2={chartWidth - padding.right}
                                y2={padding.top + yScale(days)}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1"
                                strokeDasharray="4,4"
                            />
                        </g>
                    ))}

                    {/* Y-axis title */}
                    <text
                        x={15}
                        y={chartHeight / 2}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.8)"
                        fontSize="12"
                        fontWeight="300"
                        transform={`rotate(-90, 15, ${chartHeight / 2})`}
                    >
                        Training Days
                    </text>

                    {/* Bars */}
                    {visibleData.map((monthData, index) => {
                        const x = padding.left + index * (barWidth + 8) + 4;
                        const barHeight = (chartHeight - padding.top - padding.bottom) * (monthData.trainingDays / maxDays);
                        const y = chartHeight - padding.bottom - barHeight;

                        return (
                            <g key={index}>
                                {/* Bar */}
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill="url(#gradient-purple)"
                                    opacity="0.9"
                                    rx="3"
                                    className="hover:opacity-100 transition-opacity cursor-pointer"
                                />

                                {/* Value label on top of bar */}
                                {monthData.trainingDays > 0 && (
                                    <text
                                        x={x + barWidth / 2}
                                        y={y - 5}
                                        textAnchor="middle"
                                        fill="rgba(255,255,255,0.9)"
                                        fontSize="11"
                                        fontWeight="500"
                                    >
                                        {monthData.trainingDays}
                                    </text>
                                )}

                                {/* Month label */}
                                <text
                                    x={x + barWidth / 2}
                                    y={chartHeight - padding.bottom + 15}
                                    textAnchor="middle"
                                    fill="rgba(255,255,255,0.6)"
                                    fontSize="12"
                                >
                                    {monthData.month}
                                </text>
                            </g>
                        );
                    })}

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7e22ce" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Legend */}
            <div className="flex justify-center items-center gap-6 mt-4 p-4 bg-black/20 rounded-xl">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-purple-400"></div>
                    <span className="text-white/70 text-sm">Training Days per Month</span>
                </div>
                <div className="text-white/60 text-sm">
                    Max: 31 days
                </div>
            </div>
        </div>
    );
}
