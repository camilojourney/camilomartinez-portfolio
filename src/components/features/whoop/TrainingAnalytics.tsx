'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MonthlyTrainingDays } from './MonthlyTrainingDays';

interface WorkoutData {
    id: string;
    sport_name: string;
    start_time: string;
    end_time: string;
}

interface MonthlyTrainingDaysData {
    month: string;
    trainingDays: number;
    daysInMonth: number;
}

interface TrainingAnalyticsProps {
    workoutData: WorkoutData[];
    monthlyTrainingDays: MonthlyTrainingDaysData[];
}

interface MonthlyData {
    name: string;
    Weightlifting: number;
    Running: number;
    Boxing: number;
    WeightliftingSessions: number;
    RunningSessions: number;
    BoxingSessions: number;
}

interface YearlyTotals {
    Weightlifting: number;
    Running: number;
    Boxing: number;
    WeightliftingSessions: number;
    RunningSessions: number;
    BoxingSessions: number;
}

export function TrainingAnalytics({ workoutData, monthlyTrainingDays }: TrainingAnalyticsProps) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isMounted, setIsMounted] = useState(false);
    const [hoveredBar, setHoveredBar] = useState<{
        sport: string;
        month: string;
        hours: number;
        sessions: number;
        x: number;
        y: number;
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const monthlyChartScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Get available years from data
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        workoutData.forEach(workout => {
            const year = new Date(workout.start_time).getFullYear();
            years.add(year);
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [workoutData]);

    // Process workout data by selected year
    const processedData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const monthlyData: MonthlyData[] = months.map(month => ({
            name: month,
            Weightlifting: 0,
            Running: 0,
            Boxing: 0,
            WeightliftingSessions: 0,
            RunningSessions: 0,
            BoxingSessions: 0
        }));

        const yearlyTotals: YearlyTotals = {
            Weightlifting: 0,
            Running: 0,
            Boxing: 0,
            WeightliftingSessions: 0,
            RunningSessions: 0,
            BoxingSessions: 0
        };

        const yearData = workoutData.filter(workout => {
            const workoutYear = new Date(workout.start_time).getFullYear();
            return workoutYear === selectedYear;
        });

        yearData.forEach(workout => {
            const start = new Date(workout.start_time);
            const end = new Date(workout.end_time);
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const monthIndex = start.getMonth();

            const sportName = workout.sport_name.toLowerCase();
            let sportCategory: keyof YearlyTotals | undefined;

            if (sportName === 'weightlifting' || sportName === 'weightlifting_msk') {
                sportCategory = 'Weightlifting';
            } else if (sportName === 'running') {
                sportCategory = 'Running';
            } else if (sportName === 'boxing') {
                sportCategory = 'Boxing';
            }

            if (!sportCategory) return;
            
            const monthData = monthlyData[monthIndex];
            if (!monthData) return;

            monthData[sportCategory] += durationHours;
            const sessionKey = `${sportCategory}Sessions` as keyof MonthlyData;
            (monthData[sessionKey] as number) += 1;

            yearlyTotals[sportCategory] += durationHours;
            const yearlySessionKey = `${sportCategory}Sessions` as keyof YearlyTotals;
            (yearlyTotals[yearlySessionKey] as number) += 1;
        });

        return { monthlyData, yearlyTotals };
    }, [workoutData, selectedYear]);

    const visibleMonthlyData = useMemo(() => {
        if (!processedData.monthlyData.length) return processedData.monthlyData;

        const monthlyTotals = processedData.monthlyData.map(month =>
            month.Weightlifting + month.Running + month.Boxing
        );
        const firstIndex = monthlyTotals.findIndex(total => total > 0);
        let lastIndex = -1;

        for (let i = monthlyTotals.length - 1; i >= 0; i--) {
            const total = monthlyTotals[i];
            if (total !== undefined && total > 0) {
                lastIndex = i;
                break;
            }
        }

        if (firstIndex === -1 || lastIndex === -1) {
            return processedData.monthlyData;
        }

        return processedData.monthlyData.slice(firstIndex, lastIndex + 1);
    }, [processedData.monthlyData]);

    const sportColors = {
        Weightlifting: 'url(#gradient-green)',
        Running: 'url(#gradient-blue)',
        Boxing: 'url(#gradient-orange)'
    };

    const sportSolidColors = {
        Weightlifting: '#4ade80',
        Running: '#3b82f6',
        Boxing: '#f97316'
    };

    const barChartWidth = 700;
    const barChartHeight = 400;
    const donutChartSize = 300;
    const padding = { top: 40, right: 60, bottom: 60, left: 60 };
    const monthsToDisplay = visibleMonthlyData.length || 1;
    const barGroupWidth = (barChartWidth - padding.left - padding.right) / monthsToDisplay;
    const groupPadding = barGroupWidth * 0.2;
    const barWidth = (barGroupWidth - groupPadding) / 3;

    const maxHours = useMemo(() => {
        let max = 0;
        visibleMonthlyData.forEach(month => {
            const monthTotal = month.Weightlifting + month.Running + month.Boxing;
            if (monthTotal > max) max = monthTotal;
        });
        return Math.ceil(max * 1.2);
    }, [visibleMonthlyData]);

    const yScale = (hours: number) => (barChartHeight - padding.top - padding.bottom) * (1 - hours / maxHours);

    const totalHoursYear = processedData.yearlyTotals.Weightlifting +
        processedData.yearlyTotals.Running +
        processedData.yearlyTotals.Boxing;

    const donutData = useMemo(() => {
        const result: Array<{
            sport: string;
            hours: number;
            percentage: number;
            startAngle: number;
            endAngle: number;
        }> = [];
        let startAngle = -Math.PI / 2;

        const sports = ['Weightlifting', 'Running', 'Boxing'] as const;

        for (const sport of sports) {
            const hours = processedData.yearlyTotals[sport];
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

    const formatHours = (hours: number) => hours.toFixed(1);

    useEffect(() => {
        if (!monthlyChartScrollRef.current) return;
        const container = monthlyChartScrollRef.current;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        if (maxScrollLeft > 0) {
            container.scrollLeft = maxScrollLeft;
        }
    }, [visibleMonthlyData.length]);

    if (!workoutData || workoutData.length === 0) {
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

    return (
        <div ref={containerRef} className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-3 sm:p-8 relative">
            {/* Year Selector */}
            <div className="mt-1 mb-6 flex items-center justify-center">
                <div className="flex items-center gap-1 bg-white/[0.03] p-2 rounded-2xl">
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-4 py-2 rounded-xl text-sm transition-all ${
                                selectedYear === year
                                    ? 'bg-purple-400 text-black font-medium'
                                    : 'text-white/70 hover:bg-white/5'
                            }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Bar Chart */}
                <div className="lg:col-span-2 bg-black/20 rounded-2xl p-2 sm:p-6">
                    <h3 className="text-lg font-light text-white mb-4 text-center">Monthly Training Hours</h3>

                    <div className="flex justify-center gap-6 mb-4">
                        {Object.entries(sportSolidColors).map(([sport, color]) => (
                            <div key={sport} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                                <span className="text-white/80 text-sm">{sport}</span>
                            </div>
                        ))}
                    </div>

                    <div ref={monthlyChartScrollRef} className="overflow-x-auto">
                        <svg
                            viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
                            className="w-full h-auto min-w-[600px]"
                            preserveAspectRatio="xMidYMid meet"
                        >
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

                            <line x1={padding.left} y1={barChartHeight - padding.bottom} x2={barChartWidth - padding.right} y2={barChartHeight - padding.bottom} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={barChartHeight - padding.bottom} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

                            {[0, maxHours / 4, maxHours / 2, maxHours * 3 / 4, maxHours].map((hours, i) => (
                                <g key={i}>
                                    <text x={padding.left - 10} y={padding.top + yScale(hours)} textAnchor="end" fill="rgba(255,255,255,0.6)" fontSize="12" dominantBaseline="middle">
                                        {Math.round(hours)}h
                                    </text>
                                    <line x1={padding.left - 5} y1={padding.top + yScale(hours)} x2={padding.left} y2={padding.top + yScale(hours)} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                                </g>
                            ))}

                            {visibleMonthlyData.map((month, i) => (
                                <text key={i} x={padding.left + i * barGroupWidth + barGroupWidth / 2} y={barChartHeight - padding.bottom + 20} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="12">
                                    {month.name}
                                </text>
                            ))}

                            <text x={20} y={barChartHeight / 2} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="14" fontWeight="300" transform={`rotate(-90, 20, ${barChartHeight / 2})`}>
                                Hours
                            </text>

                            {visibleMonthlyData.map((month, monthIndex) => {
                                const groupXStart = padding.left + monthIndex * barGroupWidth + groupPadding / 2;

                                return (
                                    <g key={monthIndex} className="bar-group">
                                        <rect x={groupXStart} y={padding.top + yScale(month.Weightlifting)} width={barWidth} height={barChartHeight - padding.bottom - padding.top - yScale(month.Weightlifting)} fill={sportColors.Weightlifting} opacity="0.8" className="bar-anim hover:opacity-100 transition-opacity cursor-pointer" rx="2" style={{ animationDelay: `${monthIndex * 50}ms` }} onMouseEnter={(e) => {
                                            if (containerRef.current) {
                                                const containerRect = containerRef.current.getBoundingClientRect();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredBar({
                                                    sport: 'Weightlifting',
                                                    month: month.name,
                                                    hours: month.Weightlifting,
                                                    sessions: month.WeightliftingSessions,
                                                    x: rect.left - containerRect.left + rect.width / 2,
                                                    y: rect.top - containerRect.top
                                                });
                                            }
                                        }} onMouseLeave={() => setHoveredBar(null)} />
                                        <rect x={groupXStart + barWidth} y={padding.top + yScale(month.Running)} width={barWidth} height={barChartHeight - padding.bottom - padding.top - yScale(month.Running)} fill={sportColors.Running} opacity="0.8" className="bar-anim hover:opacity-100 transition-opacity cursor-pointer" rx="2" style={{ animationDelay: `${monthIndex * 50 + 50}ms` }} onMouseEnter={(e) => {
                                            if (containerRef.current) {
                                                const containerRect = containerRef.current.getBoundingClientRect();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredBar({
                                                    sport: 'Running',
                                                    month: month.name,
                                                    hours: month.Running,
                                                    sessions: month.RunningSessions,
                                                    x: rect.left - containerRect.left + rect.width / 2,
                                                    y: rect.top - containerRect.top
                                                });
                                            }
                                        }} onMouseLeave={() => setHoveredBar(null)} />
                                        <rect x={groupXStart + barWidth * 2} y={padding.top + yScale(month.Boxing)} width={barWidth} height={barChartHeight - padding.bottom - padding.top - yScale(month.Boxing)} fill={sportColors.Boxing} opacity="0.8" className="bar-anim hover:opacity-100 transition-opacity cursor-pointer" rx="2" style={{ animationDelay: `${monthIndex * 50 + 100}ms` }} onMouseEnter={(e) => {
                                            if (containerRef.current) {
                                                const containerRect = containerRef.current.getBoundingClientRect();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredBar({
                                                    sport: 'Boxing',
                                                    month: month.name,
                                                    hours: month.Boxing,
                                                    sessions: month.BoxingSessions,
                                                    x: rect.left - containerRect.left + rect.width / 2,
                                                    y: rect.top - containerRect.top
                                                });
                                            }
                                        }} onMouseLeave={() => setHoveredBar(null)} />
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Yearly Donut Chart */}
                <div className="lg:col-span-1 bg-black/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-4">
                    <h3 className="text-lg font-light text-white mb-2 text-center">Yearly Distribution</h3>

                    <div className="flex flex-col items-center">
                        {!isMounted ? (
                            <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center">
                                <div className="w-[85%] h-[85%] rounded-full relative bg-white/5 animate-pulse">
                                    <div className="absolute inset-0 m-auto w-[50%] h-[50%] bg-black/40 rounded-full flex items-center justify-center flex-col">
                                        <span className="text-white/90 text-base font-medium">LOADING</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center">
                                <div className="relative w-[85%] h-[85%] animate-fadeIn">
                                    <div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            background: donutData.length > 0
                                                ? `conic-gradient(from 0deg, ${donutData.map((segment, i) => {
                                                    const startPercentage = i === 0 ? 0 : donutData
                                                        .slice(0, i)
                                                        .reduce((sum, s) => sum + s.percentage, 0) * 100;
                                                    const endPercentage = startPercentage + segment.percentage * 100;
                                                    return `${sportSolidColors[segment.sport as keyof typeof sportSolidColors]} ${startPercentage}% ${endPercentage}%`;
                                                }).join(', ')})`
                                                : '#4ade80',
                                            boxShadow: '0 0 20px rgba(0,0,0,0.3) inset, 0 4px 12px rgba(0,0,0,0.4)',
                                        }}
                                    />
                                    <div className="absolute inset-0 m-auto w-[58%] h-[58%] rounded-full bg-[#1a1625] shadow-2xl"
                                         style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.1), inset 0 2px 8px rgba(0,0,0,0.6)' }}
                                    />
                                    <div className="absolute inset-0 m-auto w-[50%] h-[50%] rounded-full flex items-center justify-center flex-col animate-scaleIn">
                                        <span className="text-white/90 text-base font-medium mb-[-2px]">TOTAL</span>
                                        <span className="text-white text-4xl font-bold mt-1">{formatHours(totalHoursYear)}</span>
                                        <span className="text-white/90 text-base font-medium mt-1">HOURS</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 space-y-3 w-full max-w-[300px]">
                            {Object.entries(processedData.yearlyTotals)
                                .filter(([sport]) => !sport.includes('Sessions'))
                                .map(([sport, hours], i) => {
                                    const sessionKey = `${sport}Sessions` as keyof YearlyTotals;
                                    const sessions = processedData.yearlyTotals[sessionKey];
                                    return (
                                        <div key={i} className="flex items-center justify-between gap-8">
                                            <div className="flex items-center gap-2 flex-1">
                                                <div
                                                    className="w-4 h-4 rounded-full flex-shrink-0"
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
                                            <div className="flex flex-col items-end flex-shrink-0">
                                                <span
                                                    className="text-white/80 text-sm md:text-base"
                                                    style={{
                                                        animation: `fadeIn 0.3s ease-out forwards ${i * 100 + 300}ms`,
                                                        opacity: 0
                                                    }}
                                                >
                                                    {formatHours(hours)}h
                                                </span>
                                                <span
                                                    className="text-white/50 text-xs"
                                                    style={{
                                                        animation: `fadeIn 0.3s ease-out forwards ${i * 100 + 300}ms`,
                                                        opacity: 0
                                                    }}
                                                >
                                                    {sessions} sessions
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredBar && (
                <div
                    className="absolute pointer-events-none z-[10000]"
                    style={{
                        left: hoveredBar.x,
                        top: hoveredBar.y,
                        transform: 'translate(-50%, calc(-100% - 12px))'
                    }}
                >
                    <div className="bg-black/95 backdrop-blur-sm border-2 border-purple-400 rounded-lg p-3 shadow-2xl min-w-[200px]">
                        <div className="text-white text-sm font-semibold mb-2">
                            {hoveredBar.month} - {hoveredBar.sport}
                        </div>
                        <div className="border-t border-purple-400/30 pt-2 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 text-xs">Total Hours:</span>
                                <span className="text-purple-400 text-base font-bold">
                                    {hoveredBar.hours.toFixed(1)}h
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 text-xs">Sessions:</span>
                                <span className="text-pink-400 text-base font-bold">
                                    {hoveredBar.sessions}
                                </span>
                            </div>
                            {hoveredBar.sessions > 0 && (
                                <div className="flex items-center justify-between border-t border-purple-400/20 pt-1 mt-1">
                                    <span className="text-gray-400 text-xs">Avg per session:</span>
                                    <span className="text-cyan-400 text-sm font-semibold">
                                        {(hoveredBar.hours / hoveredBar.sessions).toFixed(1)}h
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Training Days Chart Below */}
            <MonthlyTrainingDays data={monthlyTrainingDays} selectedYear={selectedYear} />
        </div>
    );
}
