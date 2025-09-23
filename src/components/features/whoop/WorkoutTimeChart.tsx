"use client";

import React from 'react';
import { format, parse } from 'date-fns';

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
  const validData = data.filter(point => {
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
  });
  
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

  // Convert goal time to minutes for comparison
  const [goalHours, goalMinutes] = goalTime.split(':').map(Number);
  const goalTimeInMinutes = goalHours * 60 + goalMinutes;
  
  // Calculate chart dimensions and scales
  const width = 1000;
  const height = 300;
  const padding = { top: 40, right: 20, bottom: 40, left: 60 };
  
  // Find min and max time values for scaling Y-axis - use validData
  const minTimeValue = Math.min(
    ...validData.map(d => d.timeAsMinutes),
    goalTimeInMinutes - 30 // Ensure goal is visible even if all workouts are after
  );
  const maxTimeValue = Math.max(
    ...validData.map(d => d.timeAsMinutes),
    goalTimeInMinutes + 30 // Ensure goal is visible even if all workouts are before
  );
  
  // Time formatting helper
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Scale X position based on data index - use validData length for consistency
  const xScale = (index: number) => {
    const chartWidth = width - padding.left - padding.right;
    // Use validData.length instead of data.length for consistency
    const step = chartWidth / (validData.length - 1 || 1);
    return padding.left + index * step;
  };
  
  // Scale Y position based on time
  const yScale = (timeInMinutes: number) => {
    const chartHeight = height - padding.top - padding.bottom;
    const range = maxTimeValue - minTimeValue;
    const normalized = (timeInMinutes - minTimeValue) / range;
    return height - padding.bottom - (normalized * chartHeight);
  };
  
  // Simplify month markers to use a maximum of 6 evenly-spaced entries
  let displayMonths = [];
  
  // Handle case with very few data points
  if (validData.length <= 6) {
    // With few points, show each month
    displayMonths = validData.map((d, index) => {
      try {
        const date = parse(d.date, 'yyyy-MM-dd', new Date());

        return { 
          month: format(date, 'MMM'), 
          x: xScale(index) 
        };
      } catch (error) {
        return { 
          month: 'Unknown',
          x: xScale(index) 
        };
      }
    });
  } else {
    // With many points, create evenly spaced month markers (maximum 6)
    const step = Math.max(1, Math.floor(validData.length / 6));
    
    for (let i = 0; i < validData.length; i += step) {
      const index = Math.min(i, validData.length - 1);
      try {
        const date = parseISO(validData[index].date);
        displayMonths.push({
          month: format(date, 'MMM'),
          x: xScale(index)
        });
      } catch (error) {
        displayMonths.push({
          month: 'Unknown',
          x: xScale(index)
        });
      }
    }
  }
  
  console.log('Generated month markers:', displayMonths.length);

  return (
    <div className="w-full overflow-hidden">
      <h2 className="text-2xl text-center text-cyan-400 mb-2">
        Workout Start Times ⏰
      </h2>
      <p className="text-center text-gray-300 mb-6">
        Each dot represents the first workout of the day. Green dots indicate workouts before {goalTime}.
      </p>
      
      <div className="overflow-x-auto pb-4">
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
        
        {/* Time labels (Y-axis) */}
        {[minTimeValue, goalTimeInMinutes, maxTimeValue].map(time => (
          <g key={time}>
            <line 
              x1={padding.left - 5} 
              y1={yScale(time)} 
              x2={padding.left} 
              y2={yScale(time)} 
              stroke="gray" 
              strokeWidth="1" 
            />
            <text 
              x={padding.left - 10} 
              y={yScale(time)} 
              textAnchor="end" 
              dominantBaseline="middle" 
              fill="gray" 
              fontSize="12"
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
        {validData.map((point, i) => {
          try {
            // Parse date safely
            const dateObj = parse(String(point.date), 'yyyy-MM-dd', new Date());

            const formattedDate = format(dateObj, 'MMM dd');
            
            // Determine if workout is before goal time
            const isBeforeGoal = point.timeAsMinutes <= goalTimeInMinutes;
            
            // Calculate point size (make recent points larger)
            const isRecentPoint = i >= validData.length - 10;
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
                >
                  <title>{`${formattedDate}: ${point.time}`}</title>
                </circle>
              </g>
            );
          } catch (error) {
            console.error(`Error rendering point for date: ${point.date}`, error);
            return null; // Skip rendering this point
          }
        })}
      </svg>
      </div>
    </div>
  );
};

export default WorkoutTimeChart;