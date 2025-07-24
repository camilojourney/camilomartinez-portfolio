'use client';

import React, { useMemo } from 'react';

// This interface matches what our database query returns
interface WorkoutData {
    id: string;
    sport_name: string;
    start_time: string;
    end_time: string;
    // Other fields are optional since they might not be in the query result
    [key: string]: any;
}

interface ActivityDistributionProps {
    data: WorkoutData[];
}

export function ActivityDistributionChart({ data }: ActivityDistributionProps) {
    // Handle empty data case
    if (!data || data.length === 0) {
        return (
            <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 text-center">
                <div className="text-white/60">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-light mb-3 text-white">No Activity Data Yet</h3>
                    <p className="text-white/70 font-light text-base leading-relaxed mb-6 max-w-2xl mx-auto">
                        Your workout distribution will appear here once you have some weightlifting, running, or boxing activities recorded.
                    </p>
                </div>
            </div>
        );
    }

    // Process data to calculate hours per sport per month
    const processedData = useMemo(() => {
        // Initialize empty data structure
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const sportCategories = ['Weightlifting', 'Running', 'Boxing'];

        // Initialize the monthly data with zeros
        const monthlyData = months.map(month => ({
            name: month,
            Weightlifting: 0,
            Running: 0,
            Boxing: 0
        }));

        // Initialize yearly totals
        const yearlyTotals = {
            Weightlifting: 0,
            Running: 0,
            Boxing: 0
        };

        // Process each workout
        data.forEach(workout => {
            // Calculate duration in hours
            const start = new Date(workout.start_time);
            const end = new Date(workout.end_time);
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

            // Determine month index
            const monthIndex = start.getMonth();

            // Determine sport category
            let sportCategory;
            if (workout.sport_name.toLowerCase() === 'weightlifting' || workout.sport_name.toLowerCase() === 'weightlifting_msk') {
                sportCategory = 'Weightlifting';
            } else if (workout.sport_name.toLowerCase() === 'running') {
                sportCategory = 'Running';
            } else if (workout.sport_name.toLowerCase() === 'boxing') {
                sportCategory = 'Boxing';
            } else {
                return; // Skip other sports
            }

            // Add hours to monthly data
            monthlyData[monthIndex][sportCategory] += durationHours;

            // Add to yearly total
            yearlyTotals[sportCategory] += durationHours;
        });

        return {
            monthlyData,
            yearlyTotals
        };
    }, [data]);

    // Colors for each sport
    const sportColors = {
        Weightlifting: 'url(#gradient-green)',
        Running: 'url(#gradient-blue)',
        Boxing: 'url(#gradient-orange)'
    };

    // For the legend and solid color needs
    const sportSolidColors = {
        Weightlifting: '#4ade80', // Green
        Running: '#3b82f6',      // Blue
        Boxing: '#f97316'        // Orange
    };

    // Calculate chart dimensions
    const barChartWidth = 700;
    const barChartHeight = 400;
    const donutChartSize = 300;
    const padding = { top: 40, right: 60, bottom: 60, left: 60 };
    const barGroupWidth = (barChartWidth - padding.left - padding.right) / 12; // Total width allocated per month
    const groupPadding = barGroupWidth * 0.2; // Use 20% of the group width for spacing
    const barWidth = (barGroupWidth - groupPadding) / 3; // The width for each of the 3 bars

    // Get max value for y-axis scale
    const maxHours = useMemo(() => {
        let max = 0;
        processedData.monthlyData.forEach(month => {
            const monthTotal = month.Weightlifting + month.Running + month.Boxing;
            if (monthTotal > max) max = monthTotal;
        });
        return Math.ceil(max * 1.2); // Add 20% padding
    }, [processedData.monthlyData]);

    // Scale functions
    const yScale = (hours: number) => (barChartHeight - padding.top - padding.bottom) * (1 - hours / maxHours);

    // Calculate total hours for donut chart
    // This line adds up all the hours from your data to display in the center of the chart
    const totalHoursYear = Object.values(processedData.yearlyTotals).reduce((sum, hours) => sum + hours, 0);

    // Calculate percentages and angles for donut chart
    const donutData = useMemo(() => {
        const result: Array<{
            sport: string;
            hours: number;
            percentage: number;
            startAngle: number;
            endAngle: number;
        }> = [];
        let startAngle = -Math.PI / 2; // Start at the 9 o'clock position

        for (const [sport, hours] of Object.entries(processedData.yearlyTotals)) {
            const percentage = hours / totalHoursYear;
            const endAngle = startAngle + percentage * 2 * Math.PI;

            result.push({
                sport,
                hours,
                percentage,
                startAngle,
                endAngle
            });

            startAngle = endAngle;
        }

        return result;
    }, [processedData.yearlyTotals, totalHoursYear]);

    // Helper function to create a simple arc path (not a closed wedge)
    const describeArc = (startAngle: number, endAngle: number, radius: number) => {
        const center = donutChartSize / 2;
        const start = {
            x: center + Math.sin(startAngle) * radius,
            y: center - Math.cos(startAngle) * radius
        };
        const end = {
            x: center + Math.sin(endAngle) * radius,
            y: center - Math.cos(endAngle) * radius
        };

        const largeArcFlag = endAngle - startAngle > Math.PI ? '1' : '0';

        const d = [
            'M', start.x, start.y,
            'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y
        ].join(' ');

        return d;
    };

    // Format hours to display with one decimal place
    const formatHours = (hours: number) => hours.toFixed(1);

    return (
        <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-3 sm:p-8">
            <style jsx>{`
                @keyframes grow {
                    from { transform: scaleY(0); }
                    to { transform: scaleY(1); }
                }
                @keyframes draw-arc {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .bar-anim {
                    transform-origin: bottom;
                    animation: grow 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.5s ease-out forwards 0.3s;
                    opacity: 0;
                }
            `}</style>

            <div className="mb-4 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-light text-white mb-2 sm:mb-3 flex items-center gap-3">
                    <span className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></span>
                    Training Hours Distribution
                </h2>
                <p className="text-white/70 font-light text-base sm:text-lg leading-relaxed">
                    Monthly training hours by sport type, showing my focus on weightlifting, running, and boxing throughout the year.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Bar Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-black/20 rounded-2xl p-2 sm:p-6">
                    <h3 className="text-lg font-light text-white mb-4 text-center">Monthly Training Hours</h3>

                    {/* Sport Legend */}
                    <div className="flex justify-center gap-6 mb-4">
                        {Object.entries(sportSolidColors).map(([sport, color]) => (
                            <div key={sport} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                                <span className="text-white/80 text-sm">{sport}</span>
                            </div>
                        ))}
                    </div>

                    {/* Scrollable wrapper for the chart */}
                    <div className="overflow-x-auto">
                        <svg
                            viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
                            className="w-full h-auto min-w-[600px]"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {/* Define gradients */}
                            <defs>
                                <linearGradient id="gradient-green" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4ade80" />
                                    <stop offset="100%" stopColor="#15803d" />
                                </linearGradient>
                                <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#1d4ed8" />
                                </linearGradient>
                                <linearGradient id="gradient-orange" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#c2410c" />
                                </linearGradient>
                            </defs>

                            {/* X-axis */}
                            <line
                                x1={padding.left}
                                y1={barChartHeight - padding.bottom}
                                x2={barChartWidth - padding.right}
                                y2={barChartHeight - padding.bottom}
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="2"
                            />

                            {/* Y-axis */}
                            <line
                                x1={padding.left}
                                y1={padding.top}
                                x2={padding.left}
                                y2={barChartHeight - padding.bottom}
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="2"
                            />

                            {/* Y-axis labels */}
                            {[0, maxHours / 4, maxHours / 2, maxHours * 3 / 4, maxHours].map((hours, i) => (
                                <g key={i}>
                                    <text
                                        x={padding.left - 10}
                                        y={padding.top + yScale(hours)}
                                        textAnchor="end"
                                        fill="rgba(255,255,255,0.6)"
                                        fontSize="12"
                                        dominantBaseline="middle"
                                    >
                                        {Math.round(hours)}h
                                    </text>
                                    <line
                                        x1={padding.left - 5}
                                        y1={padding.top + yScale(hours)}
                                        x2={padding.left}
                                        y2={padding.top + yScale(hours)}
                                        stroke="rgba(255,255,255,0.3)"
                                        strokeWidth="1"
                                    />
                                </g>
                            ))}

                            {/* X-axis labels (months) */}
                            {processedData.monthlyData.map((month, i) => (
                                <text
                                    key={i}
                                    x={padding.left + i * barGroupWidth + barGroupWidth / 2}
                                    y={barChartHeight - padding.bottom + 20}
                                    textAnchor="middle"
                                    fill="rgba(255,255,255,0.6)"
                                    fontSize="12"
                                >
                                    {month.name}
                                </text>
                            ))}

                            {/* Y-axis title */}
                            <text
                                x={20}
                                y={barChartHeight / 2}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.8)"
                                fontSize="14"
                                fontWeight="300"
                                transform={`rotate(-90, 20, ${barChartHeight / 2})`}
                            >
                                Hours
                            </text>

                            {/* Bars */}
                            {processedData.monthlyData.map((month, monthIndex) => {
                                // Calculate the starting x-position for this month's group of bars
                                const groupXStart = padding.left + monthIndex * barGroupWidth + groupPadding / 2;

                                return (
                                    <g key={monthIndex} className="bar-group">
                                        {/* Weightlifting bar */}
                                        <rect
                                            x={groupXStart}
                                            y={padding.top + yScale(month.Weightlifting)}
                                            width={barWidth}
                                            height={barChartHeight - padding.bottom - padding.top - yScale(month.Weightlifting)}
                                            fill={sportColors.Weightlifting}
                                            opacity="0.8"
                                            className="bar-anim hover:opacity-100 transition-opacity"
                                            rx="2"
                                            style={{ animationDelay: `${monthIndex * 50}ms` }}
                                        >
                                            <title>{`${month.name}: ${formatHours(month.Weightlifting)} hours of Weightlifting`}</title>
                                        </rect>

                                        {/* Running bar */}
                                        <rect
                                            x={groupXStart + barWidth}
                                            y={padding.top + yScale(month.Running)}
                                            width={barWidth}
                                            height={barChartHeight - padding.bottom - padding.top - yScale(month.Running)}
                                            fill={sportColors.Running}
                                            opacity="0.8"
                                            className="bar-anim hover:opacity-100 transition-opacity"
                                            rx="2"
                                            style={{ animationDelay: `${monthIndex * 50 + 50}ms` }}
                                        >
                                            <title>{`${month.name}: ${formatHours(month.Running)} hours of Running`}</title>
                                        </rect>

                                        {/* Boxing bar */}
                                        <rect
                                            x={groupXStart + barWidth * 2}
                                            y={padding.top + yScale(month.Boxing)}
                                            width={barWidth}
                                            height={barChartHeight - padding.bottom - padding.top - yScale(month.Boxing)}
                                            fill={sportColors.Boxing}
                                            opacity="0.8"
                                            className="bar-anim hover:opacity-100 transition-opacity"
                                            rx="2"
                                            style={{ animationDelay: `${monthIndex * 50 + 100}ms` }}
                                        >
                                            <title>{`${month.name}: ${formatHours(month.Boxing)} hours of Boxing`}</title>
                                        </rect>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>                {/* Yearly Donut Chart (1/3 width) */}
                <div className="lg:col-span-1 bg-black/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-4">
                    <h3 className="text-lg font-light text-white mb-2 text-center">Yearly Distribution</h3>

                    <div className="flex flex-col items-center">
                        {/* Conic Gradient Donut Chart */}
                        <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center">
                            {/* Create the conic gradient donut */}
                            <div
                                className="w-[85%] h-[85%] rounded-full relative animate-fadeIn"
                                style={{
                                    background: donutData.length > 0
                                        ? `conic-gradient(
                                            ${donutData.map((segment, i) => {
                                            const startPercentage = i === 0 ? 0 : donutData
                                                .slice(0, i)
                                                .reduce((sum, s) => sum + s.percentage, 0) * 100;

                                            const endPercentage = startPercentage + segment.percentage * 100;

                                            return `${sportSolidColors[segment.sport as keyof typeof sportSolidColors]}
                                                    ${startPercentage}% ${endPercentage}%`;
                                        }).join(', ')}
                                        )`
                                        : 'transparent',
                                    maskImage: 'radial-gradient(transparent 49%, black 50%)',
                                    WebkitMaskImage: 'radial-gradient(transparent 49%, black 50%)',
                                    animation: 'fadeIn 0.5s ease-out forwards',
                                    boxShadow: '0 0 20px rgba(0,0,0,0.3) inset'
                                }}
                            >
                                {/* Inner circle that displays the total in the middle of the donut */}
                                <div className="absolute inset-0 m-auto w-[50%] h-[50%] bg-black/40 rounded-full flex items-center justify-center flex-col animate-scaleIn shadow-inner border border-white/20">
                                    {/* "TOTAL" text */}
                                    <span className="text-white/90 text-base font-medium mb-[-2px]">
                                        TOTAL
                                    </span>

                                    {/* THIS IS THE TOTAL HOURS NUMBER displayed prominently */}
                                    <span className="text-white text-4xl font-bold mt-1">
                                        {formatHours(totalHoursYear)}
                                    </span>

                                    {/* "HOURS" text */}
                                    <span className="text-white/90 text-base font-medium mt-1">
                                        HOURS
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-6 space-y-3 w-full max-w-[300px]">
                            {Object.entries(processedData.yearlyTotals).map(([sport, hours], i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{
                                                backgroundColor: sportSolidColors[sport as keyof typeof sportSolidColors],
                                                animation: `fadeIn 0.3s ease-out forwards ${i * 100 + 300}ms`,
                                                opacity: 0
                                            }}
                                        ></div>
                                        <span
                                            className="text-white/80 text-sm md:text-base"
                                            style={{
                                                animation: `fadeIn 0.3s ease-out forwards ${i * 100 + 300}ms`,
                                                opacity: 0
                                            }}
                                        >
                                            {sport}
                                        </span>
                                    </div>
                                    <span
                                        className="text-white/80 text-sm md:text-base ml-8"
                                        style={{
                                            animation: `fadeIn 0.3s ease-out forwards ${i * 100 + 300}ms`,
                                            opacity: 0
                                        }}
                                    >
                                        {formatHours(hours)}h
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
