'use client';

interface RunHeartRateZones {
  zone1_seconds: number;
  zone2_seconds: number;
  zone3_seconds: number;
  zone4_seconds: number;
  zone5_seconds: number;
}

interface AstoriaStatsType {
  total_runs: number;
  total_distance: number;
  total_elevation: number;
  total_time: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  runs: Array<{
    heart_rate_zones: RunHeartRateZones;
  }>;
}

interface AstoriaStatsProps {
  stats: AstoriaStatsType;
}

export default function AstoriaStats({ stats }: AstoriaStatsProps) {
  // Calculate combined heart rate zone totals across all runs
  const zoneNames = ["Rest", "Light", "Moderate", "Hard", "Peak"];
  const zoneColors = ["#4ade80", "#22d3ee", "#818cf8", "#e879f9", "#fb7185"];

  const totalZones = stats.runs.reduce(
    (acc, run) => ({
      zone1: acc.zone1 + (run.heart_rate_zones.zone1_seconds || 0),
      zone2: acc.zone2 + (run.heart_rate_zones.zone2_seconds || 0),
      zone3: acc.zone3 + (run.heart_rate_zones.zone3_seconds || 0),
      zone4: acc.zone4 + (run.heart_rate_zones.zone4_seconds || 0),
      zone5: acc.zone5 + (run.heart_rate_zones.zone5_seconds || 0),
    }),
    { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 }
  );

  // Convert seconds to minutes and round to 1 decimal place
  const zoneMinutes = [
    totalZones.zone1 / 60,
    totalZones.zone2 / 60,
    totalZones.zone3 / 60,
    totalZones.zone4 / 60,
    totalZones.zone5 / 60,
  ].map(minutes => Math.round(minutes * 10) / 10);

  // Calculate total minutes for percentage calculation
  const totalMinutes = zoneMinutes.reduce((a, b) => a + b, 0);

  // Calculate percentages
  const zonePercentages = zoneMinutes.map(minutes => 
    totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0
  );

  const avgPace = stats.total_distance > 0 
    ? ((stats.total_time / 60) / (stats.total_distance / 1609.34)).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Training Analysis</h2>
      
      {/* Heart Rate Distribution */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-300">Heart Rate Distribution</h3>
          <div className="text-sm text-gray-400">
            Avg HR: {Math.round(stats.avg_heart_rate)} bpm
          </div>
        </div>
        
        {/* Zone Distribution Bar */}
        <div className="h-6 bg-black/40 rounded-full overflow-hidden flex">
          {zonePercentages.map((percentage, idx) => (
            <div
              key={idx}
              style={{
                width: `${percentage}%`,
                backgroundColor: zoneColors[idx],
              }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
            />
          ))}
        </div>

        {/* Zone Legend */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          {zoneNames.map((zone, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: zoneColors[idx] }}
                />
                <span className="text-sm text-gray-300">{zone}</span>
              </div>
              <span className="text-xs text-gray-400">
                {zoneMinutes[idx]}min ({Math.round(zonePercentages[idx])}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Avg Pace</div>
          <div className="text-xl font-bold">{avgPace} min/mi</div>
        </div>
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Max HR</div>
          <div className="text-xl font-bold">{stats.max_heart_rate} bpm</div>
        </div>
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Time</div>
          <div className="text-xl font-bold">{Math.round(stats.total_time / 3600)}h</div>
        </div>
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Runs</div>
          <div className="text-xl font-bold">{stats.total_runs}</div>
        </div>
      </div>
    </div>
  );
}