"use client";

import React from 'react';
import { format, parse, parseISO } from 'date-fns';

type WorkoutTimeDataPoint = {
  date: string;
  time: string;
  timeAsMinutes: number; // Minutes since midnight for easier comparison
};

type WorkoutTimeChartProps = {
  data: WorkoutTimeDataPoint[];
  goalTime: string; // Format: "HH:MM" (24-hour)
};

const WorkoutTimeChart: React.FC<WorkoutTimeChartProps> = ({ data, goalTime }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [hoveredWorkout, setHoveredWorkout] = React.useState<{
    dateLabel: string;
    timeLabel: string;
    rawTime: string;
    x: number;
    y: number;
    isBeforeGoal: boolean;
  } | null>(null);

  // Enhanced debugging
  console.log('WorkoutTimeChart initialization');
  console.log('- Data length:', data?.length || 0);
  console.log('- Sample data:', data && data.length > 0 ? JSON.stringify(data.slice(0, 3)) : 'No data');
  console.log('- Goal time:', goalTime);
  
  // Check for null or empty data
  if (!data || data.length === 0) {
    console.log('❌ No workout time data available for chart');
    return (
      <div className="border-2 border-dashed border-amber-500/30 rounded-lg p-8 text-center">
        <div className="text-amber-400 text-3xl mb-3">⏰</div>
        <p className="text-white/70 text-lg">No workout time data available.</p>
        <p className="text-white/50 text-sm mt-2">Check that your database has workout records.</p>
      </div>
    );
  }

  // More robust validation of date strings
  const validData = React.useMemo(() => data.filter(point => {
    try {
      if (!point.date) {
        console.warn('Found data point with missing date');
        return false;
      }
      
      // Try to parse the date and verify it's valid
      const parsed = parse(String(point.date), 'yyyy-MM-dd', new Date());
      const isValid = !isNaN(parsed.getTime());
      
      if (!isValid) {
        console.error(`Invalid date format: ${point.date}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error filtering data point with date: ${point?.date}`, error);
      return false;
    }
  }), [data]);
  
  console.log(`WorkoutTimeChart filtered data: ${validData.length}/${data.length} valid entries`);
  
  // Display warning if we lost data points during filtering
  if (validData.length < data.length) {
    console.warn(`❗ Filtered out ${data.length - validData.length} invalid data points`);
  }
  
  // Handle case with no valid data
  if (validData.length === 0) {
    console.error('❌ No valid data points after filtering');
    return (
      <div className="border-2 border-dashed border-red-500/30 rounded-lg p-8 text-center">
        <div className="text-red-400 text-3xl mb-3">⚠️</div>
        <p className="text-white/70 text-lg">No valid workout time data.</p>
        <p className="text-white/50 text-sm mt-2">Data was received but no valid dates were found.</p>
      </div>
    );
  }

  const sortedData = React.useMemo(() => {
    return [...validData].sort((a, b) => a.date.localeCompare(b.date));
  }, [validData]);
  
  React.useEffect(() => {
    if (scrollContainerRef.current && sortedData.length > 0) {
      const container = scrollContainerRef.current;
      container.scrollLeft = container.scrollWidth;
    }
  }, [sortedData.length]);

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

  // Convert goal time to minutes for comparison
  const [goalHours, goalMinutes] = goalTime.split(':').map(Number);
  const goalTimeInMinutes = goalHours * 60 + goalMinutes;
  
  // Enhanced time formatting helper with AM/PM
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 12 ? 12 : hours % 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };
  
  // Calculate chart dimensions and scales
  const width = 1000;
  const height = 300;
  const padding = { top: 40, right: 20, bottom: 40, left: 60 };
  
  // Fixed time range from 6 AM to 12 PM
  const minTimeValue = 6 * 60;  // 6:00 AM in minutes
  const maxTimeValue = 12 * 60; // 12:00 PM in minutes;

  // Scale X position based on data index - use validData length for consistency
  const xScale = (index: number) => {
    const chartWidth = width - padding.left - padding.right;
    if (sortedData.length <= 1) {
      return padding.left + chartWidth;
    }
    const step = chartWidth / (sortedData.length - 1);
    return padding.left + index * step;
  };
  
  // Scale Y position based on time
  const yScale = (timeInMinutes: number) => {
    const chartHeight = height - padding.top - padding.bottom;
    const range = maxTimeValue - minTimeValue;
    const normalized = (timeInMinutes - minTimeValue) / range;
    return height - padding.bottom - (normalized * chartHeight);
  };
  
  const displayMonths = monthGroups.map(group => {
    const centerIndex = Math.round((group.startIndex + group.endIndex) / 2);
    return {
      month: group.month,
      x: xScale(centerIndex)
    };
  });

  console.log('Generated month markers:', displayMonths.length);

  return (
    <div className="w-full overflow-hidden">
      <h2 className="text-2xl text-center text-cyan-400 mb-6">
        Workout Start Times ⏰
      </h2>
      
      <div ref={scrollContainerRef} className="overflow-x-auto pb-4 relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto" style={{ minWidth: "700px" }}>
        {/* Y-axis and labels */}
        <line 
          x1={padding.left} 
          y1={padding.top} 
          x2={padding.left} 
          y2={height - padding.bottom} 
          stroke="gray" 
          strokeWidth="1" 
        />
        
        {/* Time labels and grid lines (Y-axis) */}
        {Array.from({ length: 7 }, (_, i) => (6 + i) * 60).map(time => (
          <g key={time}>
            {/* Horizontal grid line */}
            <line 
              x1={padding.left} 
              y1={yScale(time)} 
              x2={width - padding.right} 
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
        ))}
        
        {/* X-axis */}
        <line 
          x1={padding.left} 
          y1={height - padding.bottom} 
          x2={width - padding.right} 
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
        
        {/* Goal time line (yellow dotted) */}
        <line 
          x1={padding.left} 
          y1={yScale(goalTimeInMinutes)} 
          x2={width - padding.right} 
          y2={yScale(goalTimeInMinutes)} 
          stroke="yellow" 
          strokeWidth="1" 
          strokeDasharray="4" 
        />
        
        {/* Data points with enhanced visualization */}
        {sortedData.map((point, i) => {
          try {
            // Parse date safely
            const dateObj = parse(String(point.date), 'yyyy-MM-dd', new Date());

            const formattedDate = format(dateObj, 'MMM dd');
            
            // Determine if workout is before goal time
            const isBeforeGoal = point.timeAsMinutes <= goalTimeInMinutes;
            
            // Calculate point size (make recent points larger)
            const isRecentPoint = i >= sortedData.length - 10;
            const pointSize = isRecentPoint ? 6 : 5;
            
            // Apply stroke for emphasis on recent points
            const strokeColor = isRecentPoint ? (isBeforeGoal ? "#22c55e" : "#ef4444") : "none";
            const strokeWidth = isRecentPoint ? 1.5 : 0;
            
            return (
              <g key={i}>
                {/* Add vertical position line for clarity */}
                <line 
                  x1={xScale(i)}
                  y1={yScale(point.timeAsMinutes)}
                  x2={xScale(i)}
                  y2={height - padding.bottom}
                  stroke={isBeforeGoal ? "#22c55e20" : "#ef444420"}
                  strokeWidth="1"
                  strokeDasharray="2"
                />
                
                {/* Data point */}
                <circle 
                  cx={xScale(i)} 
                  cy={yScale(point.timeAsMinutes)} 
                  r={pointSize} 
                  fill={isBeforeGoal ? "#4ade80" : "#f87171"} 
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity="0.8"
                  onMouseEnter={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const parsedTime = parse(point.time, 'HH:mm', new Date());
                    const timeLabel = format(parsedTime, 'h:mm a');
                    setHoveredWorkout({
                      dateLabel: format(dateObj, 'EEE, MMM d, yyyy'),
                      timeLabel,
                      rawTime: point.time,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      isBeforeGoal
                    });
                  }}
                  onMouseLeave={() => setHoveredWorkout(null)}
                />
              </g>
            );
          } catch (error) {
            console.error(`Error rendering point for date: ${point.date}`, error);
            return null; // Skip rendering this point
          }
        })}
        </svg>

        {hoveredWorkout && (
          <div
            className="fixed pointer-events-none z-[10000]"
            style={{
              left: hoveredWorkout.x,
              top: hoveredWorkout.y,
              transform: 'translate(-50%, calc(-100% - 16px))'
            }}
          >
            <div className="bg-black/95 backdrop-blur-sm border-2 border-cyan-400 rounded-lg px-3 py-2 shadow-2xl text-xs min-w-[160px]">
              <div className="text-white font-medium mb-1">{hoveredWorkout.dateLabel}</div>
              <div className="text-white/70 mb-1">
                {hoveredWorkout.timeLabel}
                <span className="text-white/40"> ({hoveredWorkout.rawTime})</span>
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

        {/* Monthly Average Stats */}
        {(() => {
          // Get last 30 days of data
          const last30Days = sortedData.slice(-30);
          const totalWorkouts = last30Days.length;
          const workoutsBeforeGoal = last30Days.filter(point => point.timeAsMinutes <= goalTimeInMinutes).length;
          const successRate = (workoutsBeforeGoal / totalWorkouts) * 100;
          
          // Calculate average time
          const averageMinutes = last30Days.reduce((sum, point) => sum + point.timeAsMinutes, 0) / totalWorkouts;
          const avgHours = Math.floor(averageMinutes / 60);
          const avgMins = Math.round(averageMinutes % 60);
          const averageTime = `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`;
          
          return (
            <div className="flex justify-center items-center gap-8 p-4 bg-black/20 rounded-xl">
              <div className="text-center">
                <div className="text-white/60 text-sm mb-1">Last 30 Days Average</div>
                <div className="text-xl font-semibold text-cyan-400">{averageTime}</div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-sm mb-1">Success Rate</div>
                <div className="text-xl font-semibold text-cyan-400">{successRate.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-sm mb-1">Early Workouts</div>
                <div className="text-xl font-semibold text-cyan-400">{workoutsBeforeGoal} of {totalWorkouts}</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default WorkoutTimeChart;
