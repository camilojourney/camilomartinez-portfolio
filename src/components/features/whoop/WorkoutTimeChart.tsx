"use client";

import React from 'react';
import { format, parse, parseISO } from 'date-fns';

type WorkoutTimeDataPoint = {
  date: string;
  time: string;
  timeAsMinutes: number; // Minutes since midnight for easier comparison
  workoutType: string; // Standardized workout type
};

type WorkoutTimeChartProps = {
  data: WorkoutTimeDataPoint[];
  goalTime: string; // Format: "HH:MM" (24-hour)
};

const WorkoutTimeChart: React.FC<WorkoutTimeChartProps> = ({ data, goalTime }) => {
  // ====================================================================
  // ALL HOOKS MUST BE DECLARED FIRST (before any conditional returns)
  // ====================================================================
  
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<SVGSVGElement>(null);
  
  const [isMounted, setIsMounted] = React.useState(false);
  const [containerWidth, setContainerWidth] = React.useState(1000);
  const [hoveredWorkout, setHoveredWorkout] = React.useState<{
    dateLabel: string;
    timeLabel: string;
    rawTime: string;
    workoutType: string;
    x: number;
    y: number;
    isBeforeGoal: boolean;
    showBelow: boolean;
  } | null>(null);

  // Filter valid data and exclude "Other" workout type
  const validData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.filter(point => {
      try {
        if (!point.date) return false;
        if (point.workoutType === 'Other') return false;
        
        const parsed = parseISO(String(point.date));
        return !isNaN(parsed.getTime());
      } catch {
        return false;
      }
    });
  }, [data]);

  const sortedData = React.useMemo(() => {
    return [...validData].sort((a, b) => a.date.localeCompare(b.date));
  }, [validData]);

  const monthGroups = React.useMemo(() => {
    if (!sortedData.length) return [] as Array<{ month: string; startIndex: number; endIndex: number }>;

    const groups: Array<{ month: string; startIndex: number; endIndex: number }> = [];

    sortedData.forEach((point, index) => {
      try {
        const date = parseISO(point.date);
        const monthName = format(date, 'MMM');
        const currentGroup = groups[groups.length - 1];

        if (!currentGroup || currentGroup.month !== monthName) {
          groups.push({ month: monthName, startIndex: index, endIndex: index });
        } else {
          currentGroup.endIndex = index;
        }
      } catch (error) {
        console.error(`Error grouping month for date: ${point.date}`, error);
      }
    });

    return groups;
  }, [sortedData]);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll to the right
  React.useEffect(() => {
    if (scrollContainerRef.current && sortedData.length > 0) {
      const container = scrollContainerRef.current;
      container.scrollLeft = container.scrollWidth;
    }
  }, [sortedData.length]);

  // Update container width on resize
  React.useEffect(() => {
    const updateWidth = () => {
      if (chartRef.current) {
        const width = chartRef.current.parentElement?.clientWidth || 1000;
        setContainerWidth(Math.max(width, 700));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // ====================================================================
  // NOW WE CAN DO CONDITIONAL RETURNS (all hooks already called)
  // ====================================================================

  // Show loading state during SSR
  if (!isMounted) {
    return (
      <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center">
        <div className="text-cyan-400 text-3xl mb-3">⏰</div>
        <p className="text-white/70 text-lg">Loading workout time data...</p>
      </div>
    );
  }

  // Check for data validation errors
  const first = data?.[0];
  if (first && typeof first.timeAsMinutes !== 'number') {
    return (
      <div className="border-2 border-dashed border-red-500/30 rounded-lg p-8 text-center">
        <div className="text-red-400 text-3xl mb-3">⚠️</div>
        <p className="text-white/70 text-lg">Error loading workout chart</p>
        <p className="text-white/50 text-sm mt-2">Invalid workout time data format</p>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="border-2 border-dashed border-amber-500/30 rounded-lg p-8 text-center">
        <div className="text-amber-400 text-3xl mb-3">⏰</div>
        <p className="text-white/70 text-lg">No workout time data available.</p>
        <p className="text-white/50 text-sm mt-2">Check that your database has workout records.</p>
      </div>
    );
  }

  if (validData.length === 0) {
    return (
      <div className="border-2 border-dashed border-red-500/30 rounded-lg p-8 text-center">
        <div className="text-red-400 text-3xl mb-3">⚠️</div>
        <p className="text-white/70 text-lg">No valid workout time data.</p>
        <p className="text-white/50 text-sm mt-2">Data was received but no valid dates were found.</p>
      </div>
    );
  }

  // ====================================================================
  // RENDERING LOGIC (all hooks called, all validations done)
  // ====================================================================

  const [goalHours = 0, goalMinutes = 0] = goalTime.split(':').map(Number);
  const goalTimeInMinutes = goalHours * 60 + goalMinutes;
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 12 ? 12 : hours % 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };
  
  const height = 300;
  const padding = { top: 30, right: 20, bottom: 40, left: 60 };
  const minTimeValue = 6 * 60;
  const maxTimeValue = 12 * 60;

  const xScale = (index: number, containerWidth: number) => {
    const chartWidth = containerWidth - padding.left - padding.right;
    if (sortedData.length <= 1) return padding.left + chartWidth;
    const step = chartWidth / (sortedData.length - 1);
    return padding.left + index * step;
  };
  
  const yScale = (timeInMinutes: number) => {
    const chartHeight = height - padding.top - padding.bottom;
    const range = maxTimeValue - minTimeValue;
    // Clamp timeInMinutes to be within minTimeValue and maxTimeValue
    const clampedTime = Math.max(minTimeValue, Math.min(maxTimeValue, timeInMinutes));
    const normalized = (clampedTime - minTimeValue) / range;
    return height - padding.bottom - (normalized * chartHeight);
  };

  const displayMonths = monthGroups.map(group => {
    const centerIndex = Math.round((group.startIndex + group.endIndex) / 2);
    return {
      month: group.month,
      x: xScale(centerIndex, containerWidth)
    };
  });

  return (
    <div ref={containerRef} className="w-full overflow-hidden relative">
      <div ref={scrollContainerRef} className="overflow-x-auto pb-4">
        <svg ref={chartRef} width="100%" height={height} viewBox={`0 0 ${containerWidth} ${height}`} className="mx-auto" style={{ minWidth: "700px" }}>
        {/* Y-axis and labels */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="gray"
          strokeWidth="1"
        />

        {/* Time labels and grid lines (Y-axis) - Fixed schedule: 6 AM, 9 AM, 12 PM */}
        {(() => {
          // Fixed time markers: 6 AM, 9 AM, 12 PM (noon)
          const timeLabels = [
            6 * 60,   // 6:00 AM
            9 * 60,   // 9:00 AM
            12 * 60,  // 12:00 PM (noon)
          ];

          return timeLabels.map(time => (
            <g key={time}>
              {/* Horizontal grid line */}
              <line
                x1={padding.left}
                y1={yScale(time)}
                x2={containerWidth - padding.right}
                y2={yScale(time)}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                strokeDasharray="4"
              />
              {/* Time label */}
              <text 
                x={padding.left - 10} 
                y={yScale(time)} 
                textAnchor="end" 
                dominantBaseline="middle" 
                fill="rgba(255,255,255,0.6)" 
                fontSize="12"
                className="font-medium"
              >
                {formatTime(time)}
              </text>
            </g>
          ));
        })()}
        
        {/* X-axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={containerWidth - padding.right}
          y2={height - padding.bottom}
          stroke="gray"
          strokeWidth="1"
        />
        
        {/* Month labels (X-axis) */}
        {displayMonths.map(({month, x}) => (
          <text 
            key={`${month}-${x}`} 
            x={x} 
            y={height - padding.bottom + 20} 
            textAnchor="middle" 
            fill="gray" 
            fontSize="14"
          >
            {month}
          </text>
        ))}
        
        {/* Goal time line (yellow dotted) - Only show if within visible range */}
        {goalTimeInMinutes >= minTimeValue && goalTimeInMinutes <= maxTimeValue && (
          <line
            x1={padding.left}
            y1={yScale(goalTimeInMinutes)}
            x2={containerWidth - padding.right}
            y2={yScale(goalTimeInMinutes)}
            stroke="yellow"
            strokeWidth="2"
            strokeDasharray="6,4"
          />
        )}
        
        {/* Data points with enhanced visualization */}
        {sortedData.map((point, i) => {
          try {
            // FIX: Use parseISO to handle both 'yyyy-MM-dd' AND ISO 8601 timestamps
            const dateObj = parseISO(String(point.date));

            const formattedDate = format(dateObj, 'MMM dd');
            
            const isBeforeGoal = point.timeAsMinutes <= goalTimeInMinutes;
            const isRecentPoint = i >= sortedData.length - 10;
            const baseColor = isBeforeGoal ? "#4ade80" : "#f87171";
            const strokeColor = isRecentPoint ? (isBeforeGoal ? "#22c55e" : "#ef4444") : "none";
            
            return (
              <g key={i}>
                <line
                  x1={xScale(i, containerWidth)}
                  y1={yScale(point.timeAsMinutes)}
                  x2={xScale(i, containerWidth)}
                  y2={height - padding.bottom}
                  stroke={isBeforeGoal ? "#22c55e20" : "#ef444420"}
                  strokeWidth="1"
                  strokeDasharray="2"
                />
                {/* Workout type markers */}
                {point.workoutType === 'Running' && (
                  <g
                    onMouseEnter={e => {
                      if (containerRef.current) {
                        const containerRect = containerRef.current.getBoundingClientRect();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parsedTime = parse(point.time, 'HH:mm', new Date());
                        const timeLabel = format(parsedTime, 'h:mm a');

                        // Calculate position relative to container
                        const x = rect.left - containerRect.left + rect.width / 2;
                        const y = rect.top - containerRect.top;

                        // Check if tooltip would be cut off at the top (120px is approx tooltip height)
                        const showBelow = y < 120;

                        setHoveredWorkout({
                          dateLabel: format(dateObj, 'EEE, MMM d, yyyy'),
                          timeLabel,
                          rawTime: point.time,
                          workoutType: point.workoutType,
                          x,
                          y,
                          isBeforeGoal,
                          showBelow
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredWorkout(null)}
                  >
                    {/* Star shape */}
                    <path
                      d={`M ${xScale(i, containerWidth)} ${yScale(point.timeAsMinutes) - 6} 
                          L ${xScale(i, containerWidth) + 2} ${yScale(point.timeAsMinutes) - 2}
                          L ${xScale(i, containerWidth) + 6} ${yScale(point.timeAsMinutes) - 1}
                          L ${xScale(i, containerWidth) + 3} ${yScale(point.timeAsMinutes) + 2}
                          L ${xScale(i, containerWidth) + 4} ${yScale(point.timeAsMinutes) + 6}
                          L ${xScale(i, containerWidth)} ${yScale(point.timeAsMinutes) + 4}
                          L ${xScale(i, containerWidth) - 4} ${yScale(point.timeAsMinutes) + 6}
                          L ${xScale(i, containerWidth) - 3} ${yScale(point.timeAsMinutes) + 2}
                          L ${xScale(i, containerWidth) - 6} ${yScale(point.timeAsMinutes) - 1}
                          L ${xScale(i, containerWidth) - 2} ${yScale(point.timeAsMinutes) - 2} Z`}
                      fill={baseColor}
                      stroke={strokeColor}
                      strokeWidth={isRecentPoint ? 1.5 : 0}
                      opacity="0.8"
                    />
                  </g>
                )}
                {point.workoutType === 'Weightlifting' && (
                  <circle
                    cx={xScale(i, containerWidth)}
                    cy={yScale(point.timeAsMinutes)}
                    r={isRecentPoint ? 6 : 5}
                    fill={baseColor}
                    stroke={strokeColor}
                    strokeWidth={isRecentPoint ? 1.5 : 0}
                    opacity="0.8"
                    onMouseEnter={e => {
                      if (containerRef.current) {
                        const containerRect = containerRef.current.getBoundingClientRect();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parsedTime = parse(point.time, 'HH:mm', new Date());
                        const timeLabel = format(parsedTime, 'h:mm a');

                        // Calculate position relative to container
                        const x = rect.left - containerRect.left + rect.width / 2;
                        const y = rect.top - containerRect.top;

                        // Check if tooltip would be cut off at the top (120px is approx tooltip height)
                        const showBelow = y < 120;

                        setHoveredWorkout({
                          dateLabel: format(dateObj, 'EEE, MMM d, yyyy'),
                          timeLabel,
                          rawTime: point.time,
                          workoutType: point.workoutType,
                          x,
                          y,
                          isBeforeGoal,
                          showBelow
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredWorkout(null)}
                  />
                )}
                {point.workoutType === 'Boxing' && (
                  <g
                    onMouseEnter={e => {
                      if (containerRef.current) {
                        const containerRect = containerRef.current.getBoundingClientRect();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parsedTime = parse(point.time, 'HH:mm', new Date());
                        const timeLabel = format(parsedTime, 'h:mm a');

                        // Calculate position relative to container
                        const x = rect.left - containerRect.left + rect.width / 2;
                        const y = rect.top - containerRect.top;

                        // Check if tooltip would be cut off at the top (120px is approx tooltip height)
                        const showBelow = y < 120;

                        setHoveredWorkout({
                          dateLabel: format(dateObj, 'EEE, MMM d, yyyy'),
                          timeLabel,
                          rawTime: point.time,
                          workoutType: point.workoutType,
                          x,
                          y,
                          isBeforeGoal,
                          showBelow
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredWorkout(null)}
                  >
                    {/* Triangle shape */}
                    <path
                      d={`M ${xScale(i, containerWidth)} ${yScale(point.timeAsMinutes) - 6}
                          L ${xScale(i, containerWidth) + 6} ${yScale(point.timeAsMinutes) + 4}
                          L ${xScale(i, containerWidth) - 6} ${yScale(point.timeAsMinutes) + 4} Z`}
                      fill={baseColor}
                      stroke={strokeColor}
                      strokeWidth={isRecentPoint ? 1.5 : 0}
                      opacity="0.8"
                    />
                  </g>
                )}
              </g>
            );
          } catch {
            return null;
          }
        })}
        </svg>

        {hoveredWorkout && (
          <div
            className="absolute pointer-events-none z-[10000]"
            style={{
              left: hoveredWorkout.x,
              top: hoveredWorkout.y,
              transform: hoveredWorkout.showBelow 
                ? 'translate(-50%, 12px)' 
                : 'translate(-50%, calc(-100% - 12px))'
            }}
          >
            <div className="bg-black/95 backdrop-blur-sm border-2 border-cyan-400 rounded-lg px-3 py-2 shadow-2xl text-xs min-w-[160px]">
              <div className="text-white font-medium mb-1">{hoveredWorkout.dateLabel}</div>
              <div className="text-white/70 mb-1">
                {hoveredWorkout.timeLabel}
                <span className="text-white/40"> ({hoveredWorkout.rawTime})</span>
              </div>
              <div className="text-cyan-400 font-medium mb-1">
                {hoveredWorkout.workoutType}
              </div>
              <div className="text-white/60">
                {hoveredWorkout.isBeforeGoal ? '✅ Before 8:30 AM' : '⏰ After 8:30 AM'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend and Stats */}
      <div className="space-y-4">
        {/* Workout Type Legend */}
        <div className="flex justify-center items-center gap-6 p-3 bg-black/10 rounded-lg">
          <div className="text-white/60 text-sm font-medium">Workout Types:</div>
          <div className="flex items-center gap-1">
            <svg width="14" height="14" className="mr-1">
              <path
                d="M 7 1 L 8.5 4.5 L 12 5 L 9.5 7.5 L 10 11 L 7 9 L 4 11 L 4.5 7.5 L 2 5 L 5.5 4.5 Z"
                fill="#4ade80"
                stroke="#22c55e"
                strokeWidth="1"
                opacity="0.8"
              />
            </svg>
            <span className="text-white/70 text-xs">Running</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="14" height="14" className="mr-1">
              <circle cx="7" cy="7" r="5" fill="#4ade80" stroke="#22c55e" strokeWidth="1.5" opacity="0.8" />
            </svg>
            <span className="text-white/70 text-xs">Weightlifting</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="14" height="14" className="mr-1">
              <path
                d="M 7 2 L 12 12 L 2 12 Z"
                fill="#4ade80"
                stroke="#22c55e"
                strokeWidth="1.5"
                opacity="0.8"
              />
            </svg>
            <span className="text-white/70 text-xs">Boxing</span>
          </div>
        </div>

        {/* Main Legend */}
        <div className="flex justify-center items-center gap-6 p-4 bg-black/20 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#4ade80] border border-white/20"></div>
            <span className="text-white/70 text-sm">Before 8:30 AM (Victory)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#f87171] border border-white/20"></div>
            <span className="text-white/70 text-sm">After 8:30 AM (Room for Growth)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-yellow-400 border-dashed"></div>
            <span className="text-white/70 text-sm">Target Time (8:30 AM)</span>
          </div>
        </div>

        {/* Monthly Average Stats with Improvement Tracking */}
        {(() => {
          // Get last 30 days of data (current month)
          const last30Days = sortedData.slice(-30);
          const totalWorkouts = last30Days.length;
          const workoutsBeforeGoal = last30Days.filter(point => point.timeAsMinutes <= goalTimeInMinutes).length;
          const currentMonthSuccessRate = (workoutsBeforeGoal / totalWorkouts) * 100;
          
          // Calculate average time for current month
          const averageMinutes = last30Days.reduce((sum, point) => sum + point.timeAsMinutes, 0) / totalWorkouts;
          const avgHours = Math.floor(averageMinutes / 60);
          const avgMins = Math.round(averageMinutes % 60);
          const averageTime = `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`;
          
          // Calculate improvement percentage: Current month vs Previous 6 months average
          const improvementData = (() => {
            // Need at least 60 data points (2+ months) to make a meaningful comparison
            if (sortedData.length < 60) {
              return { hasEnoughData: false, improvement: 0, trend: 'neutral' };
            }
            
            // Get previous period data (excluding current month)
            // Use available data up to 6 months, but work with what we have
            const availableHistoricalData = sortedData.slice(0, -30); // Everything except last 30 days
            
            if (availableHistoricalData.length < 30) { // Need at least 30 historical workouts
              return { hasEnoughData: false, improvement: 0, trend: 'neutral' };
            }
            
            // Take the most recent historical data (up to last 6 months worth)
            const maxHistoricalPoints = Math.min(availableHistoricalData.length, 180); // Up to 6 months
            const previousPeriod = availableHistoricalData.slice(-maxHistoricalPoints);
            
            // Calculate success rate for previous period
            const previousWorkoutsBeforeGoal = previousPeriod.filter(point => point.timeAsMinutes <= goalTimeInMinutes).length;
            const previousSuccessRate = (previousWorkoutsBeforeGoal / previousPeriod.length) * 100;
            
            // Calculate improvement percentage
            const improvement = currentMonthSuccessRate - previousSuccessRate;
            const trend = improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable';
            
            return { 
              hasEnoughData: true, 
              improvement, 
              trend,
              previousSuccessRate,
              currentSuccessRate: currentMonthSuccessRate,
              comparisonPeriod: Math.round(previousPeriod.length / 30) // How many months of data used
            };
          })();
          
          return (
            <div className="flex justify-center items-center gap-6 p-4 bg-black/20 rounded-xl">
              <div className="text-center">
                <div className="text-white/60 text-sm mb-1">Last 30 Days Average</div>
                <div className="text-xl font-semibold text-cyan-400">{averageTime}</div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-sm mb-1">Success Rate</div>
                <div className="text-xl font-semibold text-cyan-400">{currentMonthSuccessRate.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-sm mb-1">Early Workouts</div>
                <div className="text-xl font-semibold text-cyan-400">{workoutsBeforeGoal} of {totalWorkouts}</div>
              </div>
              
              {/* Improvement metric as 4th column */}
              <div className="text-center">
                <div className="text-white/60 text-sm mb-1">6-Month Trend</div>
                {improvementData.hasEnoughData ? (
                  <div>
                    <div className={`text-xl font-semibold flex items-center justify-center gap-1 ${
                      improvementData.trend === 'improving' 
                        ? 'text-green-400'
                        : improvementData.trend === 'declining'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}>
                      <span>
                        {improvementData.improvement > 0 ? '+' : ''}{improvementData.improvement.toFixed(1)}%
                      </span>
                      <span className="text-lg">
                        {improvementData.trend === 'improving' ? '📈' : 
                         improvementData.trend === 'declining' ? '📉' : '📊'}
                      </span>
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      {improvementData.previousSuccessRate?.toFixed(1) || '0.0'}% → {improvementData.currentSuccessRate?.toFixed(1) || '0.0'}%
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-amber-400">Need 2mo+ data</div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default WorkoutTimeChart;
