'use client';

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

  const zoneColors: { [key: string]: string } = {
    zone1: 'bg-blue-500',   // Recovery
    zone2: 'bg-green-500',  // Endurance
    zone3: 'bg-yellow-500', // Tempo
    zone4: 'bg-orange-500', // Threshold
    zone5: 'bg-red-500'     // VO2 Max
  };

  const totalSeconds = Object.values(runStats.zones_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
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