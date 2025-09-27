'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { 
  AstoriaStats as AstoriaStatsType, 
  StravaRun, 
  HeartRateZonesData 
} from '@/types/astoria';

type ZoneKey = keyof HeartRateZonesData;
type ZoneColor = {
  [K in ZoneKey]: string;
};

interface RunStats {
  total_runs: number;
  total_distance: number;
  total_time: number;
  avg_speed: number;
  avg_suffer_score: number;
  avg_whoop_strain: number;
  total_kilojoules: number;
  zones_distribution: {
    zone1_seconds: number;
    zone2_seconds: number;
    zone3_seconds: number;
    zone4_seconds: number;
    zone5_seconds: number;
  };
}

interface AstoriaStatsProps {
  stats: AstoriaStatsType;
}

export function AstoriaStats({ stats }: AstoriaStatsProps) {
  const runs = stats.runs;
  
  // Calculate weekly miles data
  const weeklyMilesData = () => {
    const weeklyData: { [week: string]: number } = {};
    
    runs.forEach(run => {
      const date = new Date(run.date || run.start_date);
      // Get the start of the week (Monday)
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startOfWeek.setDate(diff);
      
      const weekKey = startOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD format
      const miles = (run.distance_meters || 0) / 1609.34; // Convert to miles
      
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + miles;
    });
    
    // Convert to array and sort by date
    return Object.entries(weeklyData)
      .map(([week, miles]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        miles: Number(miles.toFixed(2))
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  };

  // Calculate aggregate statistics
  const runStats: RunStats = {
    total_runs: runs.length,
    total_distance: runs.reduce((sum, run) => sum + (run.distance_meters || 0), 0) / 1000, // Convert to km
    total_time: runs.reduce((sum, run) => sum + (run.duration_seconds || 0), 0) / 3600, // Convert to hours
    avg_speed: runs.reduce((sum, run) => sum + (run.average_speed_mps || 0), 0) / runs.length,
    avg_suffer_score: runs.reduce((sum, run) => sum + (run.suffer_score || 0), 0) / runs.length,
    avg_whoop_strain: runs.reduce((sum, run) => sum + (run.whoop_strain || 0), 0) / runs.length,
    total_kilojoules: runs.reduce((sum, run) => sum + (run.kilojoules || 0), 0),
    zones_distribution: {
      zone1_seconds: runs.reduce((sum, run) => sum + (run.heart_rate_zones?.zone1_seconds || 0), 0),
      zone2_seconds: runs.reduce((sum, run) => sum + (run.heart_rate_zones?.zone2_seconds || 0), 0),
      zone3_seconds: runs.reduce((sum, run) => sum + (run.heart_rate_zones?.zone3_seconds || 0), 0),
      zone4_seconds: runs.reduce((sum, run) => sum + (run.heart_rate_zones?.zone4_seconds || 0), 0),
      zone5_seconds: runs.reduce((sum, run) => sum + (run.heart_rate_zones?.zone5_seconds || 0), 0)
    }
  };

  const weeklyData = weeklyMilesData();

  const zoneColors: { [key: string]: string } = {
    zone1: 'bg-blue-500',   // Recovery
    zone2: 'bg-green-500',  // Endurance
    zone3: 'bg-yellow-500', // Tempo
    zone4: 'bg-orange-500', // Threshold
    zone5: 'bg-red-500'     // VO2 Max
  };

  const totalSeconds = Object.values(runStats.zones_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 p-4">
      {/* Weekly Miles Chart */}
      {weeklyData.length > 0 && (
        <div className="bg-black/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Weekly Miles Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="week" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  label={{ value: 'Miles', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: any) => [`${value} miles`, 'Distance']}
                  labelFormatter={(label: any) => `Week of ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="miles" 
                  stroke="#00FFFF" 
                  strokeWidth={3}
                  dot={{ fill: '#00FFFF', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#00FFFF', strokeWidth: 2, fill: '#1F2937' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Runs" 
          value={runStats.total_runs.toString()} 
          unit="runs"
        />
        <StatCard 
          title="Total Distance" 
          value={runStats.total_distance.toFixed(1)} 
          unit="km"
        />
        <StatCard 
          title="Total Time" 
          value={runStats.total_time.toFixed(1)} 
          unit="hours"
        />
        <StatCard 
          title="Avg Speed" 
          value={(runStats.avg_speed * 3.6).toFixed(1)} 
          unit="km/h"
        />
        <StatCard 
          title="Avg Suffer Score" 
          value={runStats.avg_suffer_score.toFixed(0)} 
        />
        <StatCard 
          title="Avg WHOOP Strain" 
          value={runStats.avg_whoop_strain.toFixed(1)} 
        />
        <StatCard 
          title="Total Energy" 
          value={(runStats.total_kilojoules / 1000).toFixed(1)} 
          unit="kKJ"
        />
        <div className="col-span-full">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Heart Rate Zones Distribution</h3>
          <div className="h-4 w-full rounded-full overflow-hidden bg-gray-700 flex">
            {Object.entries(runStats.zones_distribution).map(([zone, seconds], index) => {
              const zoneNumber = zone.replace('zone', '').replace('_seconds', '');
              const colorKey = `zone${zoneNumber}`;
              const percentage = (seconds / totalSeconds) * 100;
              const minutes = seconds / 60;
              
              return (
                <div
                  key={zone}
                  className={`${zoneColors[colorKey]} h-full transition-all`}
                  style={{ width: `${percentage}%` }}
                  title={`Zone ${zoneNumber}: ${minutes.toFixed(1)} minutes (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit }: { title: string; value: string; unit?: string }) {
  return (
    <div className="bg-black/20 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      <p className="mt-1">
        <span className="text-2xl font-bold text-cyan-400">{value}</span>
        {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
      </p>
    </div>
  );
}