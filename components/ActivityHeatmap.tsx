'use client';

import React, { useState } from 'react';

interface ActivityHeatmapProps {
    data: Array<{
        formatted_date: string;
        strain: number | string;
    }>;
}

interface DayData {
    date: string;
    strain: number;
    count: number;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
    const [hoveredCellRef, setHoveredCellRef] = useState<HTMLElement | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Get strain color based on value with more gradient steps
    const getStrainColor = (strain: number): string => {
        if (strain === 0) return 'bg-gray-900'; // No activity
        if (strain < 3) return 'bg-green-900/30'; // Very light recovery
        if (strain < 6) return 'bg-green-800/50'; // Rest day
        if (strain < 8) return 'bg-green-700/60'; // Light activity2q
        if (strain < 10) return 'bg-green-600/70'; // Moderate activity
        if (strain < 12) return 'bg-green-500/80'; // Good training
        if (strain < 14) return 'bg-green-400/90'; // Solid training
        if (strain < 16) return 'bg-green-400'; // High training
        if (strain < 18) return 'bg-green-300'; // Very high training
        if (strain < 20) return 'bg-green-200'; // Elite performance
        return 'bg-green-100'; // Exceptional performance
    };

    // Get strain intensity label with more detailed categories
    const getStrainLabel = (strain: number): string => {
        if (strain === 0) return 'No Activity';
        if (strain < 3) return 'Recovery Day';
        if (strain < 6) return 'Rest Day';
        if (strain < 8) return 'Light Activity';
        if (strain < 10) return 'Moderate Activity';
        if (strain < 12) return 'Good Training';
        if (strain < 14) return 'Solid Training';
        if (strain < 16) return 'High Training';
        if (strain < 18) return 'Very High Training';
        if (strain < 20) return 'Elite Performance';
        return 'Exceptional Performance';
    };

    // Process the data for calendar display
    const generateCalendarData = (): DayData[] => {
        console.log('Raw data received:', data);

        // Filter data for the selected year and create calendar data
        const yearData = data.filter(cycle => {
            // Add timezone offset to ensure consistent date handling
            const cycleDate = new Date(cycle.formatted_date);
            console.log('Processing date:', cycle.formatted_date, 'as:', cycleDate.toISOString());
            return cycleDate.getFullYear() === selectedYear;
        });

        // Convert to map for accumulating strain values per day
        const strainMap = new Map<string, number>();
        yearData.forEach(cycle => {
            const strainValue = typeof cycle.strain === 'number' ? cycle.strain : parseFloat(cycle.strain) || 0;
            const existingStrain = strainMap.get(cycle.formatted_date) || 0;
            strainMap.set(cycle.formatted_date, existingStrain + strainValue);
        });

        // Sort dates to ensure chronological order
        const sortedDates = Array.from(strainMap.entries())
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, strain]) => {
                console.log('Processing date for display:', date);
                return {
                    date,
                    strain,
                    count: strain > 0 ? 1 : 0
                };
            });

        console.log('Calendar data:', sortedDates);
        return sortedDates;
    };

    // Get available years from data
    const getAvailableYears = (): number[] => {
        const years = new Set<number>();
        data.forEach(cycle => {
            const year = new Date(cycle.formatted_date).getFullYear();
            years.add(year);
        });
        return Array.from(years).sort((a, b) => b - a); // Most recent first
    };

    // Organize days into weeks
    const organizeIntoWeeks = (days: DayData[]) => {
        const weeks: DayData[][] = [];
        let currentWeek: DayData[] = [];

        // Debug log to see the days we're organizing
        console.log('Organizing days:', days);

        // Add empty cells for the first week if it doesn't start on Sunday
        const firstDay = new Date(days[0].date + 'T00:00:00Z');
        console.log('First day being organized:', days[0].date, 'parsed as:', firstDay.toISOString());
        const firstDayOfWeek = firstDay.getDay();
        console.log('First day of week calculation:', firstDayOfWeek);

        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push({
                date: '',
                strain: 0,
                count: 0
            });
        }

        days.forEach((day, index) => {
            currentWeek.push(day);

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        // Fill the last week if needed
        while (currentWeek.length < 7) {
            currentWeek.push({
                date: '',
                strain: 0,
                count: 0
            });
        }
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return weeks;
    };

    const calendarData = generateCalendarData();
    const weeks = organizeIntoWeeks(calendarData);
    const totalActiveDays = calendarData.filter(day => day.count > 0).length;
    const strainDays = calendarData.filter(day => day.strain > 0);
    const averageStrain = strainDays.length > 0 ? strainDays.reduce((sum, day) => sum + day.strain, 0) / strainDays.length : 0;
    const maxStrainDay = calendarData.reduce((max, day) => day.strain > max.strain ? day : max, { strain: 0, date: '', count: 0 });
    const availableYears = getAvailableYears();

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
        if (day.date) {
            setHoveredDay(day);
            setHoveredCellRef(event.target as HTMLElement);
        }
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
        setHoveredCellRef(null);
    };

    return (
        <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-light text-white mb-3 flex items-center gap-3">
                    <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                    My {selectedYear === new Date().getFullYear() ? 'Year' : selectedYear} in Strain: A Commitment to Consistency
                </h2>
                <p className="text-white/70 font-light text-lg leading-relaxed">
                    Like GitHub for fitness—this heatmap reveals my training dedication
                    {selectedYear === new Date().getFullYear() ? ' over the past year' : ` during ${selectedYear}`},
                    with the brightest green representing exceptional performance days (20+ strain).
                </p>

                {/* Year Selector */}
                <div className="mt-6 flex items-center justify-center">
                    <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.1] rounded-2xl p-2 backdrop-blur-sm">
                        {availableYears.map((year) => (
                            <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${selectedYear === year
                                    ? 'bg-green-400 text-black shadow-lg shadow-green-400/20'
                                    : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
                                    }`}
                            >
                                {year}
                            </button>
                        ))}
                        {availableYears.length === 0 && (
                            <div className="px-4 py-2 text-white/50 text-sm">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                    <div className="text-3xl font-light text-green-400 mb-1">{totalActiveDays}</div>
                    <div className="text-white/60 text-sm font-light">Active Days</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-light text-green-400 mb-1">{(averageStrain || 0).toFixed(1)}</div>
                    <div className="text-white/60 text-sm font-light">Avg Strain</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-light text-green-400 mb-1">{(maxStrainDay.strain || 0).toFixed(1)}</div>
                    <div className="text-white/60 text-sm font-light">Peak Strain</div>
                </div>
            </div>

            {/* Calendar */}
            <div className="relative" id="calendar-container">
                {/* Month labels - properly aligned with calendar grid */}
                <div className="flex gap-1 mb-2 ml-[18px]">
                    {weeks.map((week, weekIndex) => {
                        // Get the first day of this week that has a date
                        const firstDayWithDate = week.find(day => day.date);
                        if (!firstDayWithDate) return <div key={weekIndex} className="w-3"></div>;

                        const date = new Date(firstDayWithDate.date + 'T00:00:00');
                        const isFirstWeekOfMonth = date.getDate() <= 7;

                        return (
                            <div key={weekIndex} className="w-3 text-xs text-white/50 font-light text-center">
                                {isFirstWeekOfMonth ? months[date.getMonth()] : ''}
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-1">
                    {/* Weekday labels */}
                    <div className="flex flex-col gap-1 mr-2">
                        {weekdays.map((day, index) => (
                            <div
                                key={`weekday-${index}`}
                                className="w-3 h-3 flex items-center justify-center text-xs text-white/50 font-light"
                            >
                                {index % 2 === 1 ? day : ''}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="flex gap-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {week.map((day, dayIndex) => (
                                    <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={`w-3 h-3 rounded-sm transition-all duration-200 hover:scale-125 hover:shadow-lg cursor-pointer ${day.date ? getStrainColor(day.strain) : 'bg-transparent'
                                            } ${hoveredDay?.date === day.date ? 'ring-2 ring-green-400/60 shadow-green-400/30' : ''}`}
                                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                                        onMouseLeave={handleMouseLeave}
                                        data-week={weekIndex}
                                        data-day={dayIndex}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Enhanced Tooltip - positioned above the calendar */}
                {hoveredDay && hoveredCellRef && (
                    <div
                        className="absolute pointer-events-none z-[9999]"
                        style={{
                            left: hoveredCellRef.offsetLeft + hoveredCellRef.offsetWidth / 2,
                            top: hoveredCellRef.offsetTop - 20,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <div className="bg-black/95 backdrop-blur-sm border-2 border-green-400 rounded-lg p-3 shadow-2xl min-w-[180px] max-w-[220px]">
                            <div className="text-white text-sm font-medium mb-2">
                                {new Date(hoveredDay.date + 'T00:00:00').toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </div>
                            <div className="border-t border-gray-600 pt-2">
                                {hoveredDay.strain > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-gray-300 text-sm">Strain:</span>
                                            <span className="text-green-400 text-lg font-bold">{hoveredDay.strain.toFixed(1)}</span>
                                        </div>
                                        <div className="text-green-300 text-xs font-medium">{getStrainLabel(hoveredDay.strain)}</div>
                                    </>
                                ) : (
                                    <div className="text-gray-400 text-sm text-center">No Activity</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Legend with more gradient colors */}
                <div className="flex items-center gap-3 mt-6 text-xs text-white/60">
                    <span className="font-light">Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-gray-900 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-900/30 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-800/50 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-700/60 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-600/70 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-500/80 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-400/90 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-100 rounded-sm"></div>
                    </div>
                    <span className="font-light">More</span>
                </div>
            </div>
        </div>
    );
}
