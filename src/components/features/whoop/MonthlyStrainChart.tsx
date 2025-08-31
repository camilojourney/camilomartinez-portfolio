'use client'

import { useMemo } from 'react'

interface MonthlyStrainData {
    month: string;
    average_strain: number;
    days_count: number;
}

interface MonthlyStrainChartProps {
    data: MonthlyStrainData[];
}

export function MonthlyStrainChart({ data }: MonthlyStrainChartProps) {
    const monthlyAverages = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            console.log('MonthlyStrainChart: No valid data provided');
            return [];
        }

        console.log('MonthlyStrainChart: Processing', data.length, 'monthly records');
        
        // Data is already aggregated by month from SQL, just format it for display
        const result = data
            .map((item) => {
                if (!item || !item.month) {
                    console.log('MonthlyStrainChart: Invalid item:', item);
                    return null;
                }
                
                const average = Number(item.average_strain);
                if (isNaN(average) || average <= 0) {
                    console.log('MonthlyStrainChart: Skipping invalid average:', item.average_strain, 'for month:', item.month);
                    return null;
                }
                
                // Fix: Parse month properly without timezone issues
                const [year, month] = item.month.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthIndex = parseInt(month) - 1; // Convert to 0-based index
                
                return {
                    month: item.month,
                    average: average,
                    monthName: `${monthNames[monthIndex]} ${year}`,
                    daysCount: item.days_count
                };
            })
            .filter(item => item !== null) // Remove invalid items
            .sort((a, b) => a!.month.localeCompare(b!.month))
            .slice(-12); // Show last 12 months
            
        console.log('MonthlyStrainChart: Processed', result.length, 'valid months');
        return result.filter(Boolean); // TypeScript safety
    }, [data]);

    const maxValue = Math.max(...monthlyAverages.map(m => m.average), 10) + 2;

    console.log('MonthlyStrainChart: About to render with', monthlyAverages.length, 'months');

    if (monthlyAverages.length === 0) {
        console.log('MonthlyStrainChart: Rendering NO DATA state');
        return (
            <div className="h-24 flex items-center justify-center text-white/60 bg-red-500/20 rounded-lg border border-red-400/50">
                <p className="text-sm">📊 Monthly Chart: No data ({data?.length || 0} raw items received)</p>
            </div>
        );
    }

    console.log('MonthlyStrainChart: Rendering line chart with', monthlyAverages.length, 'months');
    return (
        <div className="w-full h-40 relative bg-black/20 rounded-lg p-4 border border-white/5 mb-6">
            {/* Title */}
            <div className="text-cyan-400 font-semibold text-sm mb-3 text-center">
                Monthly Progress: Chasing the 10 Strain Goal ⚡
            </div>
            
            {/* Chart Container with month labels inside */}
            <div className="relative w-full h-20">
                {/* Goal line - dotted horizontal line at 10 */}
                <div 
                    className="absolute w-full border-t-2 border-yellow-400 border-dotted opacity-80"
                    style={{ bottom: `${(10 / maxValue) * 100}%` }}
                ></div>
                
                {/* Line Chart */}
                <svg className="absolute inset-0 w-full h-full" style={{ marginLeft: '18px' }}>
                    {/* Line path */}
                    <path
                        d={monthlyAverages.map((month, index) => {
                            const x = (index / Math.max(1, monthlyAverages.length - 1)) * 100;
                            const y = 100 - (month.average / maxValue) * 100;
                            return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                        }).join(' ')}
                        stroke="rgb(34 197 94)" // green-500
                        strokeWidth="3"
                        fill="none"
                        className="drop-shadow-sm"
                    />
                    
                    {/* Data points */}
                    {monthlyAverages.map((month, index) => {
                        const x = (index / Math.max(1, monthlyAverages.length - 1)) * 100;
                        const y = 100 - (month.average / maxValue) * 100;
                        const isAboveGoal = month.average >= 10;
                        
                        return (
                            <g key={month.month}>
                                {/* Point circle */}
                                <circle
                                    cx={`${x}%`}
                                    cy={`${y}%`}
                                    r="4"
                                    fill={isAboveGoal ? 'rgb(34 197 94)' : 'rgb(239 68 68)'} // green-500 or red-500
                                    stroke="white"
                                    strokeWidth="2"
                                    className="cursor-pointer hover:r-6 transition-all"
                                />
                                
                                {/* Tooltip on hover */}
                                <circle
                                    cx={`${x}%`}
                                    cy={`${y}%`}
                                    r="12"
                                    fill="transparent"
                                    className="cursor-pointer"
                                >
                                    <title>
                                        {month.monthName}: {month.average.toFixed(1)} avg strain ({month.daysCount} days)
                                    </title>
                                </circle>
                            </g>
                        );
                    })}
                </svg>
            </div>
            
            {/* Month labels - simplified to not interfere with heatmap */}
            <div className="flex gap-1 ml-[18px] min-w-max mt-2">
                {monthlyAverages.map((month, index) => {
                    const [year, monthNum] = month.month.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthIndex = parseInt(monthNum) - 1;
                    const spacing = index * 45; // Approximate spacing
                    
                    return (
                        <div 
                            key={month.month} 
                            className="text-xs text-white/60 font-medium text-center"
                            style={{ marginLeft: spacing > 0 ? `${spacing}px` : '0' }}
                        >
                            {monthNames[monthIndex]}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
