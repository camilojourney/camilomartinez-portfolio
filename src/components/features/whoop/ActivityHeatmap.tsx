'use client';

import React, { useState } from 'react';

interface ActivityHeatmapProps {
    data: Array<{
        formatted_date: string;
        strain: number | string;
    }>;
    monthlyData?: Array<{
        month: string; // Expects "YYYY-MM" format
        average_strain: number;
        days_count: number;
    }>;
}

interface DayData {
    date: string;
    strain: number;
    count: number;
}

// State for the chart tooltip
interface HoveredMonth {
    label: string;
    average_strain: number;
    weekStart: string; // YYYY-MM-DD
    weekEnd: string;   // YYYY-MM-DD
    x: number;
    y: number;
}

// Weekly strain datapoint used by the mini chart
interface WeeklyStrainData {
    weekIndex: number;
    averageStrain: number;
    firstDate: string; // YYYY-MM-DD
    daysWithData: number;
}

const TOOLTIP_OFFSET_PX = 28;

export function ActivityHeatmap({ data, monthlyData }: ActivityHeatmapProps) {
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [hoveredMonth, setHoveredMonth] = useState<HoveredMonth | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

    const mainContainerRef = React.useRef<HTMLDivElement>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const calendarContainerRef = React.useRef<HTMLDivElement>(null);
    const weeklyChartScrollRef = React.useRef<HTMLDivElement>(null);

    // Color and label utility functions (unchanged)
    const getStrainColor = (strain: number): string => {
        if (strain === 0) return 'bg-gray-900';
        if (strain < 3) return 'bg-green-900/30';
        if (strain < 6) return 'bg-green-800/50';
        if (strain < 8) return 'bg-green-700/60';
        if (strain < 10) return 'bg-green-600/70';
        if (strain < 12) return 'bg-green-500/80';
        if (strain < 14) return 'bg-green-400/90';
        if (strain < 16) return 'bg-green-400';
        if (strain < 18) return 'bg-green-300';
        if (strain < 20) return 'bg-green-200';
        return 'bg-green-100';
    };

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
    
    // Data processing functions
    const generateCalendarData = (): DayData[] => {
        const yearData = data.filter(cycle => new Date(cycle.formatted_date + 'T00:00:00').getFullYear() === selectedYear);
        const strainMap = new Map<string, number>();
        yearData.forEach(cycle => {
            const strainValue = typeof cycle.strain === 'number' ? cycle.strain : parseFloat(cycle.strain) || 0;
            strainMap.set(cycle.formatted_date, (strainMap.get(cycle.formatted_date) || 0) + strainValue);
        });

        return Array.from(strainMap.entries())
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, strain]) => ({
                date,
                strain,
                count: strain > 0 ? 1 : 0
            }));
    };

    const getAvailableYears = (): number[] => Array.from(new Set(data.map(cycle => new Date(cycle.formatted_date).getFullYear()))).sort((a, b) => b - a);
    
    const organizeIntoWeeks = (days: DayData[], firstRecordedDate: string | null, lastRecordedDate: string | null) => {
        if (!selectedYear) return [];

        const dayMap = new Map(days.map(day => [day.date, day]));
        const yearEndDate = new Date(selectedYear, 11, 31);
        const calendarEndDate = new Date(yearEndDate);
        calendarEndDate.setDate(calendarEndDate.getDate() + (6 - yearEndDate.getDay()));
        const yearStartDate = new Date(selectedYear, 0, 1);
        const calendarStartDate = new Date(yearStartDate);
        calendarStartDate.setDate(calendarStartDate.getDate() - yearStartDate.getDay());

        const weeks: DayData[][] = [];
        let currentWeek: DayData[] = [];

        for (let day = new Date(calendarEndDate); day >= calendarStartDate; day.setDate(day.getDate() - 1)) {
            const dateStr = day.toISOString().split('T')[0] ?? '';
            const beforeFirst = firstRecordedDate ? dateStr < firstRecordedDate : false;
            const afterLast = lastRecordedDate ? dateStr > lastRecordedDate : false;

            let dayData: DayData;
            if (beforeFirst || afterLast) {
                dayData = { date: '', strain: 0, count: 0 };
            } else {
                dayData = dayMap.get(dateStr) || {
                    date: day.getFullYear() === selectedYear ? dateStr : '',
                    strain: 0,
                    count: 0
                };
            }

            currentWeek.unshift(dayData);

            if (currentWeek.length === 7) {
                weeks.unshift(currentWeek);
                currentWeek = [];
            }
        }

        if (currentWeek.length > 0) {
            weeks.unshift(currentWeek);
        }

        let trimmedWeeks = weeks;

        if (trimmedWeeks.length > 0) {
            const firstWeekWithData = trimmedWeeks.findIndex(week => week.some(day => day.date));
            if (firstWeekWithData > 0) {
                trimmedWeeks = trimmedWeeks.slice(firstWeekWithData);
            }
        }

        if (lastRecordedDate) {
            let lastWeekWithData = -1;
            trimmedWeeks.forEach((week, idx) => {
                if (week.some(day => day.date)) {
                    lastWeekWithData = idx;
                }
            });
            if (lastWeekWithData >= 0 && lastWeekWithData < trimmedWeeks.length - 1) {
                trimmedWeeks = trimmedWeeks.slice(0, lastWeekWithData + 1);
            }
        }

        return trimmedWeeks;
    };

    const calendarData = generateCalendarData();
    const firstRecordedDate = calendarData.length > 0 ? calendarData[0]?.date ?? null : null;
    const lastRecordedDate = calendarData.length > 0 ? calendarData[calendarData.length - 1]?.date ?? null : null;
    const weeks = organizeIntoWeeks(calendarData, firstRecordedDate, lastRecordedDate);

    // *****************************************************************
    // ***** WEEKLY STRAIN DATA CALCULATION *****
    // *****************************************************************
    const getWeeklyStrainData = (): WeeklyStrainData[] => {
        return weeks
            .map((week, weekIndex) => {
                const weekDays = week.filter(day => day.date && day.strain > 0);
                if (weekDays.length === 0) return null;

                const totalStrain = weekDays.reduce((sum, day) => sum + day.strain, 0);
                const averageStrain = totalStrain / weekDays.length;
                const firstDate = week.find(day => day.date)?.date;
                if (!firstDate) return null;

                return {
                    weekIndex,
                    averageStrain,
                    firstDate,
                    daysWithData: weekDays.length
                };
            })
            .filter((week): week is WeeklyStrainData => week !== null);
    };

    // *****************************************************************
    // ***** REVISED getMonthLabels TO SHOW ALL MONTHS *****
    // *****************************************************************
    const getMonthLabels = () => {
        const labels = new Map<number, string>(); // weekIndex -> monthShortName
        const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthRanges = new Map<number, { min: number; max: number }>();

        weeks.forEach((week, weekIndex) => {
            week.forEach(day => {
                if (!day.date) return;
                const date = new Date(day.date + 'T00:00:00');
                if (date.getFullYear() !== selectedYear) return;
                const monthIndex = date.getMonth();
                const range = monthRanges.get(monthIndex);
                if (!range) {
                    monthRanges.set(monthIndex, { min: weekIndex, max: weekIndex });
                } else {
                    range.min = Math.min(range.min, weekIndex);
                    range.max = Math.max(range.max, weekIndex);
                }
            });
        });

        monthRanges.forEach((range, monthIndex) => {
            const centerIndex = Math.round((range.min + range.max) / 2);
            const monthLabel = allMonths[monthIndex] ?? '';
            labels.set(centerIndex, monthLabel);
        });

        return labels;
    };
    
    const monthLabels = getMonthLabels();
    const weeklyStrainData: WeeklyStrainData[] = getWeeklyStrainData();
    const weeklyStrainByWeekIndex = React.useMemo(() => {
        return new Map(weeklyStrainData.map(week => [week.weekIndex, week]));
    }, [weeklyStrainData]);

    // Calculate stats
    const totalActiveDays = calendarData.filter(day => day.count > 0).length;
    const strainDays = calendarData.filter(day => day.strain > 0);
    const averageStrain = strainDays.length > 0 ? strainDays.reduce((sum, day) => sum + day.strain, 0) / strainDays.length : 0;
    
    // Calculate percentage of weeks that met the 10+ strain goal
    const TARGET_STRAIN = 10;
    const weeksAtGoal = weeklyStrainData.filter(week => week.averageStrain >= TARGET_STRAIN).length;
    const totalWeeks = weeklyStrainData.length;
    const weeklySuccessRate = totalWeeks > 0 ? (weeksAtGoal / totalWeeks) * 100 : 0;
    
    const availableYears = getAvailableYears();

    // Event Handlers
    const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
        if (day.date && mainContainerRef.current) {
            if (hoveredDay?.date !== day.date) {
                setHoveredDay(day);

                const containerRect = mainContainerRef.current.getBoundingClientRect();
                const cellRect = (event.currentTarget as HTMLElement).getBoundingClientRect();

                // Calculate position relative to the container
                const x = cellRect.left - containerRect.left + cellRect.width / 2;
                const y = cellRect.top - containerRect.top;

                setTooltipPosition({ x, y });
            }
        }
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
        setTooltipPosition(null);
    };

    const handleClick = (day: DayData) => {
        if (day.date) {
            setSelectedDay(prev => (prev?.date === day.date ? null : day));
        }
    };

    // Effects for scrolling and tooltips
    React.useEffect(() => {
        const heatmapContainer = scrollContainerRef.current;
        const weeklyContainer = weeklyChartScrollRef.current;
        if (!heatmapContainer || !weeklyContainer) return;

        let syncingFromHeatmap = false;
        let syncingFromWeekly = false;

        const getMaxScroll = () => Math.max(heatmapContainer.scrollWidth - heatmapContainer.clientWidth, 0);

        const clampScroll = (value: number) => {
            const maxScroll = getMaxScroll();
            return Math.min(Math.max(value, 0), maxScroll);
        };

        const syncFromHeatmap = () => {
            if (syncingFromWeekly) return;
            syncingFromHeatmap = true;
            const clamped = clampScroll(heatmapContainer.scrollLeft);
            heatmapContainer.scrollLeft = clamped;
            weeklyContainer.scrollLeft = clamped;
            requestAnimationFrame(() => {
                syncingFromHeatmap = false;
            });
        };

        const syncFromWeekly = () => {
            if (syncingFromHeatmap) return;
            syncingFromWeekly = true;
            const clamped = clampScroll(weeklyContainer.scrollLeft);
            weeklyContainer.scrollLeft = clamped;
            heatmapContainer.scrollLeft = clamped;
            requestAnimationFrame(() => {
                syncingFromWeekly = false;
            });
        };

        heatmapContainer.addEventListener('scroll', syncFromHeatmap, { passive: true });
        weeklyContainer.addEventListener('scroll', syncFromWeekly, { passive: true });

        const targetScrollLeft = clampScroll(heatmapContainer.scrollWidth - heatmapContainer.clientWidth);
        heatmapContainer.scrollLeft = targetScrollLeft;
        weeklyContainer.scrollLeft = targetScrollLeft;

        return () => {
            heatmapContainer.removeEventListener('scroll', syncFromHeatmap);
            weeklyContainer.removeEventListener('scroll', syncFromWeekly);
        };
    }, [weeks.length, weeklyStrainData.length, selectedYear]);

    return (
        <div ref={mainContainerRef} className="liquid-glass-card relative backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8">
            {/* Header, Year Selector, Stats Summary (Unchanged) */}

            <div className="mt-1 mb-3 flex items-center justify-center">
                <div className="flex items-center gap-1 bg-white/[0.03] p-2 rounded-2xl">
                    {availableYears.map(year => (
                        <button key={year} onClick={() => setSelectedYear(year)} className={`px-4 py-2 rounded-xl text-sm ${selectedYear === year ? 'bg-green-400 text-black' : 'text-white/70 hover:bg-white/5'}`}>
                            {year}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center"><div className="text-3xl font-light text-green-400">{totalActiveDays}</div><div className="text-muted-foreground text-sm">Active Days</div></div>
                <div className="text-center"><div className="text-3xl font-light text-green-400">{(averageStrain || 0).toFixed(1)}</div><div className="text-muted-foreground text-sm">Avg Strain</div></div>
                <div className="text-center">
                    <div className="text-3xl font-light text-green-400">{weeklySuccessRate.toFixed(0)}%</div>
                    <div className="text-muted-foreground text-sm">Weeks at Goal</div>
                    <div className="text-muted-foreground text-xs mt-1">{weeksAtGoal}/{totalWeeks} weeks ≥10</div>
                </div>
            </div>
            
            {/* Calendar */}
            <div ref={calendarContainerRef} className="relative overflow-hidden">
                <div ref={scrollContainerRef} className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-green-400/30">
                    <div className="inline-block mx-auto">
                        {/* Heatmap Month labels - NOW perfectly aligned */}
                        <div className="flex gap-1 mb-2 ml-[3.25rem] min-w-max">
                            {weeks.map((_, weekIndex) => (
                                <div key={weekIndex} className="w-3 text-xs text-muted-foreground text-left">
                                    {monthLabels.get(weekIndex) || ''}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-1 min-w-max">
                            {/* Weekday labels */}
                            <div className="flex flex-col gap-1 mr-3 sticky left-0 z-10 bg-slate-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded-r-md shadow-lg">
                                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                    <div key={index} className="w-6 h-3 flex items-center text-xs text-foreground font-medium">
                                        {(index === 1 && 'Mon') || (index === 3 && 'Wed') || (index === 5 && 'Fri')}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="flex gap-1 min-w-max">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-1">
                                        {week.map((day, dayIndex) => (
                                            <div
                                                key={`${weekIndex}-${dayIndex}`}
                                                className={`w-3 h-3 rounded-sm transition-transform hover:scale-125 cursor-pointer ${day.date ? (day.strain > 0 ? getStrainColor(day.strain) : 'bg-gray-900/50') : 'bg-transparent'} ${hoveredDay?.date === day.date || selectedDay?.date === day.date ? 'ring-2 ring-green-400' : ''}`}
                                                onMouseEnter={e => handleMouseEnter(day, e)}
                                                onMouseLeave={handleMouseLeave}
                                                onClick={() => handleClick(day)}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-3 mt-6 text-xs text-muted-foreground">
                    <span className="font-light">Less</span>
                    <div className="flex gap-0.5 relative">
                        <div className="w-2.5 h-2.5 bg-gray-900 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">0: No Activity</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-900/30 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">1-2: Recovery Day</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-800/50 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">3-5: Rest Day</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-700/60 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">6-7: Light Activity</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-600/70 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">8-9: Moderate Activity</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-500/80 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">10-11: Good Training</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-400/90 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">12-13: Solid Training</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-400 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">14-15: High Training</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-300 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">16-17: Very High Training</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-200 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">18-19: Elite Performance</div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-green-100 rounded-sm cursor-help group">
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-foreground px-2 py-1 rounded text-xs whitespace-nowrap">20-21: Exceptional Performance</div>
                        </div>
                    </div>
                    <span className="font-light">More</span>
                </div>

                {/* Weekly Strain Chart */}
                {weeklyStrainData && weeklyStrainData.length > 0 && (
                    <div className="mt-8">
                        <div className="text-center mb-4">
                            <h3 className="text-lg text-cyan-400">Weekly Average Strain: Chasing the 10 Goal ⚡</h3>
                            <p className="text-sm text-muted-foreground">
                                Each dot represents my weekly average strain. Consistency above 10 means optimal fitness growth.
                            </p>
                        </div>
                        
                        {/* Scrollable chart container */}
                        <div ref={weeklyChartScrollRef} className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-white/5">
                            <div className="inline-block min-w-full">
                                <div className="h-32 relative min-w-max">
                                    {/* Goal Line */}
                                    <div className="absolute w-full border-t border-yellow-400/50 border-dashed" style={{ top: `${100 - (10 / 22) * 100}%`, left: '3.25rem', right: 0 }} />
                                    
                                    {/* Chart Data Points */}
                                    <div className="absolute inset-0 flex gap-1 ml-[3.25rem] min-w-max">
                                        {weeks.map((week, weekIndex) => {
                                            const weekData = weeklyStrainByWeekIndex.get(weekIndex);

                                            return (
                                                <div key={weekIndex} className="w-3 h-full relative">
                                                    {weekData && (
                                                        <div
                                                            className="absolute w-2 h-2 rounded-full cursor-pointer transition-transform hover:scale-150"
                                                            style={{
                                                                top: `calc(${100 - (weekData.averageStrain / 22) * 100}%)`,
                                                                left: '2px', // Centered in the 3px week column
                                                                transform: 'translateY(-50%)',
                                                                backgroundColor: weekData.averageStrain >= 9.9 ? 'rgb(34 197 94)' : 'rgb(239 68 68)'
                                                            }}
                                                            onMouseEnter={e => {
                                                                if (mainContainerRef.current) {
                                                                    const containerRect = mainContainerRef.current.getBoundingClientRect();
                                                                    const dotRect = e.currentTarget.getBoundingClientRect();
                                                                    const startDate = new Date(weekData.firstDate + 'T00:00:00');
                                                                    const endDate = new Date(startDate);
                                                                    endDate.setDate(startDate.getDate() + 6);
                                                                    const weekLabel = `Week of ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

                                                                    // Calculate position relative to the container
                                                                    const x = dotRect.left - containerRect.left + dotRect.width / 2;
                                                                    const y = dotRect.top - containerRect.top;

                                                                    setHoveredMonth({
                                                                        label: weekLabel,
                                                                        average_strain: weekData.averageStrain,
                                                                        weekStart: weekData.firstDate,
                                                                        weekEnd: endDate.toISOString().split('T')[0] ?? '',
                                                                        x,
                                                                        y
                                                                    });
                                                                }
                                                            }}
                                                            onMouseLeave={() => setHoveredMonth(null)}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Chart Month labels - Aligned with heatmap */}
                                <div className="flex gap-1 mt-2 ml-[3.25rem] min-w-max">
                                   {weeks.map((_, weekIndex) => (
                                        <div key={weekIndex} className="w-3 text-xs text-muted-foreground text-left">
                                            {monthLabels.get(weekIndex) || ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Weekly Strain Legend and Stats */}
                        <div className="mt-6 flex flex-col gap-4">
                            {/* Legend */}
                            <div className="flex justify-center items-center gap-6 p-4 bg-black/20 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                                    <span className="text-muted-foreground text-sm">Above Goal (10+)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                                    <span className="text-muted-foreground text-sm">Below Goal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5 bg-yellow-400 border-dashed"></div>
                                    <span className="text-muted-foreground text-sm">Target (10)</span>
                                </div>
                            </div>

                            {/* 3-Month Performance Stats */}
                            {(() => {
                                // Get last 12 weeks of data (approximately 3 months)
                                const last12Weeks = weeklyStrainData.slice(-12);
                                const totalWeeks = last12Weeks.length;
                                const TARGET_STRAIN = 9.9;
                                const successfulWeeks = last12Weeks.filter(week => week.averageStrain >= TARGET_STRAIN).length;
                                const successRate = (successfulWeeks / totalWeeks) * 100;
                                const averageStrain = last12Weeks.reduce((sum, week) => sum + week.averageStrain, 0) / totalWeeks;

                                return (
                                    <div className="flex justify-center items-center gap-8 p-4 bg-black/20 rounded-xl">
                                        <div className="text-center">
                                            <div className="text-muted-foreground text-sm mb-1">Last 3 Months</div>
                                            <div className="text-xl font-semibold text-cyan-400">{successRate.toFixed(1)}%</div>
                                            <div className="text-muted-foreground text-xs">Success Rate</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-muted-foreground text-sm mb-1">Weeks at Goal</div>
                                            <div className="text-xl font-semibold text-cyan-400">{successfulWeeks} of {totalWeeks}</div>
                                            <div className="text-muted-foreground text-xs">Last 12 Weeks</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-muted-foreground text-sm mb-1">Average Strain</div>
                                            <div className="text-xl font-semibold text-cyan-400">
                                                {averageStrain.toFixed(1)}
                                            </div>
                                            <div className={`text-xs ${averageStrain >= TARGET_STRAIN ? 'text-green-400' : 'text-red-400'}`}>
                                                {averageStrain >= TARGET_STRAIN ? 'At Goal! 🎯' : `${(TARGET_STRAIN - averageStrain).toFixed(1)} Below Goal`}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* *************************************************************** */}
            {/* ***** NEW, SIMPLIFIED & CORRECTED HEATMAP TOOLTIP ***** */}
            {/* *************************************************************** */}
            {hoveredDay && tooltipPosition && (
                <div
                    className="absolute pointer-events-none z-[9999]"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translate(-50%, calc(-100% - 8px))',
                    }}
                >
                    <div className="bg-black/95 backdrop-blur-sm border-2 border-green-400 rounded-lg p-3 shadow-2xl min-w-[180px] max-w-[220px]">
                        <div className="text-foreground text-sm font-medium mb-2">
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

            {/* Weekly Chart Tooltip */}
            {hoveredMonth && (
                <div
                    className="absolute pointer-events-none z-[10000]"
                    style={{
                        left: hoveredMonth.x,
                        top: hoveredMonth.y,
                        transform: 'translate(-50%, calc(-100% - 8px))'
                    }}
                >
                    <div className="bg-black/95 backdrop-blur-sm border-2 border-yellow-400 rounded-lg p-3 shadow-2xl min-w-[160px]">
                        <div className="text-foreground text-sm font-medium mb-1">
                            {hoveredMonth.label}
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                            {new Date(hoveredMonth.weekStart + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' → '}
                            {new Date(hoveredMonth.weekEnd + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-300 text-sm">Average Strain:</span>
                            <span className="text-yellow-400 text-lg font-bold">
                                {hoveredMonth.average_strain.toFixed(1)}
                            </span>
                        </div>
                        <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
                            Goal: 10.0+ strain per week
                        </div>
                        <div className="text-xs mt-1">
                            {hoveredMonth.average_strain >= 9.9 ? 
                                <span className="text-green-400">🎯 Goal Achieved!</span> : 
                                <span className="text-red-400">📈 Below Goal ({(9.9 - hoveredMonth.average_strain).toFixed(1)} short)</span>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}