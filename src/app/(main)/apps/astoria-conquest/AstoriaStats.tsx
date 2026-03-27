'use client';

import ScrollReveal from '@/components/shared/scroll-reveal';

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

  const zoneMinutes = [
    totalZones.zone1 / 60,
    totalZones.zone2 / 60,
    totalZones.zone3 / 60,
    totalZones.zone4 / 60,
    totalZones.zone5 / 60,
  ].map(minutes => Math.round(minutes * 10) / 10);

  const totalMinutes = zoneMinutes.reduce((a, b) => a + b, 0);
  const zonePercentages = zoneMinutes.map(minutes =>
    totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0
  );

  const avgPace = stats.total_distance > 0
    ? ((stats.total_time / 60) / (stats.total_distance / 1609.34)).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          Training Analysis
        </h2>
      </ScrollReveal>

      {/* Heart Rate Distribution */}
      <ScrollReveal delay={0.1}>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-300">Heart Rate Distribution</h3>
            <div className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-lg">
              Avg HR: <span className="text-cyan-400 font-medium">{Math.round(stats.avg_heart_rate)} bpm</span>
            </div>
          </div>

          {/* Zone Distribution Bar */}
          <div className="h-8 bg-black/40 rounded-full overflow-hidden flex shadow-inner">
            {zonePercentages.map((percentage, idx) => (
              <div
                key={idx}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: zoneColors[idx],
                }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-700 relative group"
              >
                {/* Percentage label on hover */}
                {percentage > 8 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
                    {Math.round(percentage)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Zone Legend */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {zoneNames.map((zone, idx) => {
              const color = zoneColors[idx] ?? '#888';
              const minutes = zoneMinutes[idx] ?? 0;
              const percentage = zonePercentages[idx] ?? 0;
              return (
                <div key={idx} className="flex flex-col items-center p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full shadow-lg"
                      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
                    />
                    <span className="text-sm text-gray-300 font-medium">{zone}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {minutes}min ({Math.round(percentage)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Pace', value: `${avgPace}`, unit: 'min/mi', color: 'text-cyan-400' },
          { label: 'Max HR', value: `${stats.max_heart_rate}`, unit: 'bpm', color: 'text-pink-400' },
          { label: 'Total Time', value: `${Math.round(stats.total_time / 3600)}`, unit: 'hours', color: 'text-purple-400' },
          { label: 'Total Runs', value: `${stats.total_runs}`, unit: 'runs', color: 'text-green-400' },
        ].map((stat, idx) => (
          <ScrollReveal key={idx} staggerIndex={idx} staggerDelay={0.08}>
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-4 stat-card-hover">
              <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
                <span className="text-sm font-normal text-gray-500 ml-1">{stat.unit}</span>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
