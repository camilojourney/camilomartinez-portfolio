'use client';

import React from 'react';

interface WorkoutHeatmapData {
    date: string;
    workout_count: number;
}

interface Props {
    data: WorkoutHeatmapData[];
}

export default function WorkoutHeatmapStatic({ data }: Props) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-white/60 text-xl mb-2">📅 No Weightlifting Data</div>
                    <div className="text-white/40">No weightlifting data available for heatmap</div>
                </div>
            </div>
        );
    }

    // Create a map of dates to workout count values
    const dataMap = new Map<string, number>();
    data.forEach(item => {
        dataMap.set(item.date, item.workout_count);
    });

    // Get the current year and create calendar grid
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // January 1st
    const endDate = new Date(currentYear, 11, 31); // December 31st

    // Generate all days of the year
    const generateCalendarData = (): Array<{
        date: string;
        day: number;
        month: number;
        weekday: number;
        workout_count: number;
        week: number;
    }> => {
        const days: Array<{
            date: string;
            day: number;
            month: number;
            weekday: number;
            workout_count: number;
            week: number;
        }> = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const workoutCount = dataMap.get(dateStr) || 0;

            days.push({
                date: dateStr,
                day: currentDate.getDate(),
                month: currentDate.getMonth(),
                weekday: currentDate.getDay(),
                workout_count: workoutCount,
                week: Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    };

    const calendarData = generateCalendarData();

    // Get color intensity based on workout count for weightlifting
    const getColor = (workoutCount: number) => {
        if (workoutCount === 0) return 'bg-white/5 border-white/10';
        if (workoutCount === 1) return 'bg-green-400/30 border-green-400/40';
        if (workoutCount === 2) return 'bg-green-400/50 border-green-400/60';
        if (workoutCount === 3) return 'bg-green-400/70 border-green-400/80';
        return 'bg-green-400/90 border-green-400'; // 4+ workouts = super green
    };

    // Group by weeks for display
    const weeks: Array<Array<{
        date: string;
        day: number;
        month: number;
        weekday: number;
        workout_count: number;
        week: number;
    }>> = [];
    for (let i = 0; i < 53; i++) {
        weeks.push(calendarData.filter(day => day.week === i));
    }

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const weekdays = ['Mon', 'Wed', 'Fri'];

    // Calculate summary stats
    const totalWorkouts = data.reduce((sum, d) => sum + d.workout_count, 0);
    const activeDays = data.filter(d => d.workout_count > 0).length;
    const avgWorkouts = activeDays > 0 ? totalWorkouts / activeDays : 0;
    const consistencyRate = (activeDays / 365) * 100;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-semibold text-white mb-2">
                    Weightlifting Annual Heatmap
                </h2>
                <p className="text-gray-300 mb-6">
                    A GitHub-style contribution graph showing weightlifting intensity throughout the year. Each square represents a day, colored by total weightlifting sessions. Reveals seasonal patterns,
                    weekly rhythms, and training consistency over time.
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                    <div className="text-2xl font-bold text-green-400">{totalWorkouts}</div>
                    <div className="text-white/60 text-sm">Total Workouts</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                    <div className="text-2xl font-bold text-blue-400">{activeDays}</div>
                    <div className="text-white/60 text-sm">Active Days</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                    <div className="text-2xl font-bold text-purple-400">{consistencyRate.toFixed(1)}%</div>
                    <div className="text-white/60 text-sm">Consistency Rate</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                    <div className="text-2xl font-bold text-orange-400">{avgWorkouts.toFixed(1)}</div>
                    <div className="text-white/60 text-sm">Avg Sessions/Day</div>
                </div>
            </div>

            {/* Main Heatmap */}
            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">
                        {currentYear} Weightlifting Heatmap
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-white/60">
                        <span>Less</span>
                        <div className="flex space-x-1">
                            <div className="w-3 h-3 bg-white/5 border border-white/10 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-400/30 border border-green-400/40 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-400/50 border border-green-400/60 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-400/70 border border-green-400/80 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-400/90 border border-green-400 rounded-sm"></div>
                        </div>
                        <span>More</span>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="overflow-x-auto">
                    <div className="min-w-full">
                        {/* Month labels */}
                        <div className="flex mb-2">
                            <div className="w-8"></div> {/* Space for weekday labels */}
                            {months.map((month, index) => (
                                <div key={month} className="text-xs text-white/60 px-1" style={{ width: '44px' }}>
                                    {month}
                                </div>
                            ))}
                        </div>

                        {/* Calendar rows - show only Mon, Wed, Fri */}
                        <div className="space-y-1">
                            {weekdays.map((weekday, dayIndex) => (
                                <div key={weekday} className="flex items-center">
                                    <div className="w-8 text-xs text-white/60 pr-2 text-right">
                                        {weekday}
                                    </div>
                                    <div className="flex space-x-1">
                                        {weeks.map((week, weekIndex) => {
                                            // Map weekday names to actual day numbers (Mon=1, Wed=3, Fri=5)
                                            const actualDayNumber = dayIndex === 0 ? 1 : dayIndex === 1 ? 3 : 5;
                                            const dayInWeek = week.find(d => d.weekday === actualDayNumber);
                                            if (!dayInWeek) {
                                                return <div key={weekIndex} className="w-3 h-3"></div>;
                                            }
                                            return (
                                                <div
                                                    key={`${weekIndex}-${dayIndex}`}
                                                    className={`w-3 h-3 rounded-sm border ${getColor(dayInWeek.workout_count)} relative group cursor-default`}
                                                    title={`${dayInWeek.date}: ${dayInWeek.workout_count} workout${dayInWeek.workout_count !== 1 ? 's' : ''}`}
                                                >
                                                    {/* Tooltip on hover */}
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                                                        {new Date(dayInWeek.date).toLocaleDateString()}: {dayInWeek.workout_count} workout{dayInWeek.workout_count !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
