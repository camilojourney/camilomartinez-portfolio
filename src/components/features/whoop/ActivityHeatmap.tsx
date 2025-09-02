'use client';

import React, { useState, useLayoutEffect } from 'react';

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
    monthName: string;
    average_strain: number;
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

export function ActivityHeatmap({ data, monthlyData }: ActivityHeatmapProps) {
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
    const [hoveredCellRef, setHoveredCellRef] = useState<HTMLElement | null>(null);
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
    const [selectedCellRef, setSelectedCellRef] = useState<HTMLElement | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [tooltipTransform, setTooltipTransform] = useState('translate(-50%, -100%)');
    const [hoveredMonth, setHoveredMonth] = useState<HoveredMonth | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
    
    const tooltipRef = React.useRef<HTMLDivElement>(null);
    const mainContainerRef = React.useRef<HTMLDivElement>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const calendarContainerRef = React.useRef<HTMLDivElement>(null);

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
            .map(([date, strain]) => ({ date, strain, count: strain > 0 ? 1 : 0 }));
    };

    const getAvailableYears = (): number[] => Array.from(new Set(data.map(cycle => new Date(cycle.formatted_date).getFullYear()))).sort((a, b) => b - a);
    
    const organizeIntoWeeks = (days: DayData[]) => {
        if (!selectedYear) return [];
        const dayMap = new Map(days.map(day => [day.date, day]));
        const yearStartDate = new Date(selectedYear, 0, 1);
        const calendarStartDate = new Date(yearStartDate);
        calendarStartDate.setDate(calendarStartDate.getDate() - yearStartDate.getDay());
        const calendarEndDate = new Date(new Date(selectedYear, 11, 31));
        calendarEndDate.setDate(calendarEndDate.getDate() + (6 - calendarEndDate.getDay()));
        const weeks: DayData[][] = [];
        let currentWeek: DayData[] = [];
        for (let day = new Date(calendarStartDate); day <= calendarEndDate; day.setDate(day.getDate() + 1)) {
            const dateStr = day.toISOString().split('T')[0];
            const dayData = dayMap.get(dateStr) || {
                date: day.getFullYear() === selectedYear ? dateStr : '',
                strain: 0,
                count: 0
            };
            currentWeek.push(dayData);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }
        // Ensure consistent 53 weeks (or trim if slightly over in a leap year)
        while (weeks.length < 53) {
            weeks.push(Array(7).fill({ date: '', strain: 0, count: 0 }));
        }
        return weeks.slice(0, 53);
    };

    const calendarData = generateCalendarData();
    const weeks = organizeIntoWeeks(calendarData);

    // *****************************************************************
    // ***** WEEKLY STRAIN DATA CALCULATION *****
    // *****************************************************************
    const getWeeklyStrainData = (): WeeklyStrainData[] => {
        return weeks.map((week, weekIndex) => {
            const weekDays = week.filter(day => day.date && day.strain > 0);
            if (weekDays.length === 0) return null;
            
            const totalStrain = weekDays.reduce((sum, day) => sum + day.strain, 0);
            const averageStrain = totalStrain / weekDays.length;
            
            // Get the first valid date for reference
            const firstDate = week.find(day => day.date)?.date;
            if (!firstDate) return null;
            
            return {
                weekIndex,
                averageStrain,
                firstDate,
                daysWithData: weekDays.length
            };
        }).filter((week): week is WeeklyStrainData => week !== null);
    };

    // *****************************************************************
    // ***** REVISED getMonthLabels TO SHOW ALL MONTHS *****
    // *****************************************************************
    const getMonthLabels = () => {
        const labels = new Map<number, string>(); // weekIndex -> monthShortName
        const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const seenMonths = new Set<number>(); // month index (0-11)

        weeks.forEach((week, weekIndex) => {
            // Find the first actual day in the week that belongs to the selected year
            const firstValidDay = week.find(day => day.date && new Date(day.date).getFullYear() === selectedYear);

            if (firstValidDay) {
                const date = new Date(firstValidDay.date + 'T00:00:00');
                const monthIndex = date.getMonth();

                if (!seenMonths.has(monthIndex)) {
                    // Check if the first day of the *month* itself falls within this week
                    // This ensures we label at the true start of the month's appearance
                    let dayOfMonth = date.getDate();
                    if (dayOfMonth === 1 || weekIndex === 0) { // Label if it's the 1st or if it's the very first week (for Jan)
                        labels.set(weekIndex, allMonths[monthIndex]);
                        seenMonths.add(monthIndex);
                    }
                }
            }
        });

        // Ensure all 12 months are represented by finding appropriate weeks
        allMonths.forEach((monthName, monthIndex) => {
            if (!seenMonths.has(monthIndex)) {
                // Find a week that contains days from this month
                const weekWithMonth = weeks.findIndex(week => {
                    return week.some(day => {
                        if (!day.date) return false;
                        const date = new Date(day.date + 'T00:00:00');
                        return date.getFullYear() === selectedYear && date.getMonth() === monthIndex;
                    });
                });
                
                if (weekWithMonth !== -1 && !labels.has(weekWithMonth)) {
                    labels.set(weekWithMonth, monthName);
                    seenMonths.add(monthIndex);
                }
            }
        });

        return labels;
    };
    
    const monthLabels = getMonthLabels();
    const weeklyStrainData: WeeklyStrainData[] = getWeeklyStrainData();

    // Calculate stats
    const totalActiveDays = calendarData.filter(day => day.count > 0).length;
    const strainDays = calendarData.filter(day => day.strain > 0);
    const averageStrain = strainDays.length > 0 ? strainDays.reduce((sum, day) => sum + day.strain, 0) / strainDays.length : 0;
    const maxStrainDay = calendarData.reduce((max, day) => day.strain > max.strain ? day : max, { strain: 0, date: '', count: 0 });
    const availableYears = getAvailableYears();

    // Event Handlers
    const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
        if (day.date) {
            setHoveredDay(day);
            const cell = event.target as HTMLElement;
            const rect = cell.getBoundingClientRect();
            // Set the position for the tooltip
            setTooltipPosition({
                x: rect.left + rect.width / 2, // Center of the square
                y: rect.top, // Top of the square
            });
        }
    };
    
    const handleMouseLeave = () => {
        setHoveredDay(null);
        setHoveredCellRef(null);
        // Clear the position on leave
        setTooltipPosition(null);
    };
    const handleClick = (day: DayData, event: React.MouseEvent) => {
        if (day.date) {
            setSelectedDay(prev => (prev?.date === day.date ? null : day));
            setSelectedCellRef(prev => (prev === event.target ? null : event.target as HTMLElement));
        }
    };

    // Effects for scrolling and tooltips
    React.useEffect(() => {
        if (scrollContainerRef.current && weeks.length > 0) {
            // Center the content horizontally
            const container = scrollContainerRef.current;
            const centerPosition = (container.scrollWidth - container.clientWidth) / 2;
            container.scrollLeft = Math.max(0, centerPosition);
        }
    }, [weeks]);

    // *****************************************************************
    // ***** REVISED useLayoutEffect FOR HEATMAP TOOLTIP CENTERING *****
    // *****************************************************************
    useLayoutEffect(() => {
        const activeCellRef = selectedCellRef || hoveredCellRef;
        if (activeCellRef && tooltipRef.current && mainContainerRef.current && scrollContainerRef.current) {
            const tooltipElement = tooltipRef.current;
            const mainContainerRect = mainContainerRef.current.getBoundingClientRect();
            const scrollContainerScrollLeft = scrollContainerRef.current.scrollLeft;
            const activeCellRect = activeCellRef.getBoundingClientRect();

            // Calculate tooltip's desired center position relative to the calendar's content
            const targetLeft = activeCellRect.left + (activeCellRect.width / 2);
            
            // Initial positioning for measurement
            tooltipElement.style.left = `${targetLeft}px`;
            tooltipElement.style.top = `${activeCellRect.top}px`;
            tooltipElement.style.transform = `translate(-50%, -100%)`; // Default vertical position

            // A small timeout to allow initial render before measuring
            setTimeout(() => {
                if (!tooltipRef.current || !mainContainerRef.current) return;
                const currentTooltipRect = tooltipRef.current.getBoundingClientRect();
                
                let xOffsetCorrection = 0;

                // Check for collision with the mainContainer's right edge
                const rightOverflow = currentTooltipRect.right - mainContainerRect.right;
                if (rightOverflow > 0) {
                    xOffsetCorrection = -(rightOverflow + 8); // Move left + padding
                }

                // Check for collision with the mainContainer's left edge
                const leftOverflow = mainContainerRect.left - currentTooltipRect.left;
                if (leftOverflow > 0) {
                    xOffsetCorrection = leftOverflow + 8; // Move right + padding
                }
                
                // Apply the final transform with any necessary horizontal corrections
                setTooltipTransform(`translate(calc(-50% + ${xOffsetCorrection}px), -100%)`);
            }, 0);
        } else {
            setTooltipTransform('translate(-50%, -100%)'); // Reset if no active cell
        }
    }, [selectedDay, hoveredDay, selectedCellRef, hoveredCellRef]);


    return (
        <div ref={mainContainerRef} className="liquid-glass-card relative backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8">
            {/* Header, Year Selector, Stats Summary (Unchanged) */}
            <div className="mb-8">
                <h2 className="text-3xl font-light text-white mb-3 flex items-center gap-3">
                    <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                    My Strain Journey {selectedYear === new Date().getFullYear() ? 'This Year' : selectedYear}
                </h2>
                <p className="text-white/70 font-light text-lg leading-relaxed">
                    A month-by-month view of my fitness activities, with brighter green squares representing higher strain days (maximum: 21).
                </p>
            </div>
            <div className="mt-6 mb-8 flex items-center justify-center">
                <div className="flex items-center gap-1 bg-white/[0.03] p-2 rounded-2xl">
                    {availableYears.map(year => (
                        <button key={year} onClick={() => setSelectedYear(year)} className={`px-4 py-2 rounded-xl text-sm ${selectedYear === year ? 'bg-green-400 text-black' : 'text-white/70 hover:bg-white/5'}`}>
                            {year}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center"><div className="text-3xl font-light text-green-400">{totalActiveDays}</div><div className="text-white/60 text-sm">Active Days</div></div>
                <div className="text-center"><div className="text-3xl font-light text-green-400">{(averageStrain || 0).toFixed(1)}</div><div className="text-white/60 text-sm">Avg Strain</div></div>
                <div className="text-center"><div className="text-3xl font-light text-green-400">{(maxStrainDay.strain || 0).toFixed(1)}</div><div className="text-white/60 text-sm">Peak Strain</div></div>
            </div>
            
            {/* Calendar */}
            <div ref={calendarContainerRef} className="relative overflow-hidden">
                <div ref={scrollContainerRef} className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-green-400/30">
                    <div className="inline-block mx-auto">
                        {/* Heatmap Month labels - NOW perfectly aligned */}
                        <div className="flex gap-1 mb-2 ml-[3.25rem] min-w-max">
                            {weeks.map((_, weekIndex) => (
                                <div key={weekIndex} className="w-3 text-xs text-white/50 text-left">
                                    {monthLabels.get(weekIndex) || ''}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-1 min-w-max">
                            {/* Weekday labels */}
                            <div className="flex flex-col gap-1 mr-3 sticky left-0 z-10 bg-slate-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded-r-md shadow-lg">
                                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                    <div key={index} className="w-6 h-3 flex items-center text-xs text-white/90 font-medium">
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
                                                onClick={e => handleClick(day, e)}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-col gap-2 mt-6 text-xs text-white/60">
                    <div className="flex items-center gap-3">
                        <span className="font-light">Less</span>
                        <div className="flex gap-1 relative">
                            <div className="w-3 h-3 bg-gray-900 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">0: No Activity</div>
                            </div>
                            <div className="w-3 h-3 bg-green-900/30 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">1-2: Recovery Day</div>
                            </div>
                            <div className="w-3 h-3 bg-green-800/50 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">3-5: Rest Day</div>
                            </div>
                            <div className="w-3 h-3 bg-green-700/60 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">6-7: Light Activity</div>
                            </div>
                            <div className="w-3 h-3 bg-green-600/70 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">8-9: Moderate Activity</div>
                            </div>
                            <div className="w-3 h-3 bg-green-500/80 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">10-11: Good Training</div>
                            </div>
                            <div className="w-3 h-3 bg-green-400/90 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">12-13: Solid Training</div>
                            </div>
                            <div className="w-3 h-3 bg-green-400 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">14-15: High Training</div>
                            </div>
                            <div className="w-3 h-3 bg-green-300 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">16-17: Very High Training</div>
                            </div>
                            <div className="w-3 h-3 bg-green-200 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">18-19: Elite Performance</div>
                            </div>
                            <div className="w-3 h-3 bg-green-100 rounded-sm cursor-help group">
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap">20-21: Exceptional Performance</div>
                            </div>
                        </div>
                        <span className="font-light">More</span>
                    </div>
                    <div className="text-center text-xs text-white/40 italic">Hover over squares for strain level details (Maximum: 21)</div>
                </div>

                {/* Weekly Strain Chart */}
                {weeklyStrainData && weeklyStrainData.length > 0 && (
                    <div className="mt-8">
                        <div className="text-center mb-4">
                            <h3 className="text-lg text-cyan-400">Weekly Average Strain: Chasing the 10 Goal ⚡</h3>
                            <p className="text-sm text-white/60">
                                Each dot represents my weekly average strain. Consistency above 10 means optimal fitness growth.
                            </p>
                        </div>
                        
                        {/* Scrollable chart container */}
                        <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-white/5">
                            <div className="inline-block min-w-full">
                                <div className="h-32 relative min-w-max">
                                    {/* Goal Line */}
                                    <div className="absolute w-full border-t border-yellow-400/50 border-dashed" style={{ top: `${100 - (10 / 22) * 100}%`, left: '3.25rem', right: 0 }} />
                                    
                                    {/* Chart Data Points */}
                                    <div className="absolute inset-0 flex gap-1 ml-[3.25rem] min-w-max">
                                        {weeks.map((week, weekIndex) => {
                                            const weekData = weeklyStrainData.find(data => data.weekIndex === weekIndex);

                                            return (
                                                <div key={weekIndex} className="w-3 h-full relative">
                                                    {weekData && (
                                                        <div
                                                            className="absolute w-2 h-2 rounded-full cursor-pointer transition-transform hover:scale-150"
                                                            style={{
                                                                top: `calc(${100 - (weekData.averageStrain / 22) * 100}%)`,
                                                                left: '2px', // Centered in the 3px week column
                                                                transform: 'translateY(-50%)',
                                                                backgroundColor: weekData.averageStrain >= 10 ? 'rgb(34 197 94)' : 'rgb(239 68 68)'
                                                            }}
                                                            onMouseEnter={e => {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                const startDate = new Date(weekData.firstDate + 'T00:00:00');
                                                                const endDate = new Date(startDate);
                                                                endDate.setDate(startDate.getDate() + 6);
                                                                const weekLabel = `Week of ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                                                                setHoveredMonth({ 
                                                                    monthName: weekLabel, 
                                                                    average_strain: weekData.averageStrain, 
                                                                    x: rect.left + rect.width / 2, 
                                                                    y: rect.top 
                                                                });
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
                                        <div key={weekIndex} className="w-3 text-xs text-white/50 text-left">
                                            {monthLabels.get(weekIndex) || ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* *************************************************************** */}
            {/* ***** NEW, SIMPLIFIED & CORRECTED HEATMAP TOOLTIP ***** */}
            {/* *************************************************************** */}
            {hoveredDay && tooltipPosition && (
                <div
                    className="fixed pointer-events-none z-[9999]"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translate(-50%, -300%)', // Center horizontally, move up
                        transition: 'opacity 0.2s, transform 0.2s',
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

            {/* Weekly Chart Tooltip */}
            {hoveredMonth && (
                <div
                    className="fixed pointer-events-none z-[10000]"
                    style={{
                        left: hoveredMonth.x,
                        top: hoveredMonth.y, // Keep the Y position from the hover event
                        transform: 'translate(-150%, -180%)' // Move up more for visibility
                    }}
                >
                    <div className="bg-black/95 backdrop-blur-sm border-2 border-yellow-400 rounded-lg p-3 shadow-2xl min-w-[160px]">
                        <div className="text-white text-sm font-medium mb-1">
                            {hoveredMonth.monthName}
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
                            {hoveredMonth.average_strain >= 10 ? 
                                <span className="text-green-400">🎯 Goal Achieved!</span> : 
                                <span className="text-red-400">📈 Below Goal ({(10 - hoveredMonth.average_strain).toFixed(1)} short)</span>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
