'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type {
  AstoriaStats as AstoriaStatsType,
  StravaRun,
  HeartRateZoneKey,
  HeartRateZonesDisplay,
} from '@/types/astoria';
import { HEART_RATE_ZONE_DEFINITIONS, aggregateZoneDurations } from '@/lib/astoria/zones';

interface RunStats {
  total_runs: number;
  total_distance: number;
  total_time: number;
  avg_speed: number;
  avg_suffer_score: number;
  avg_whoop_strain: number;
  total_kilojoules: number;
  zones_distribution: HeartRateZonesDisplay;
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

      const weekKey = startOfWeek.toISOString().split('T')[0] ?? ''; // YYYY-MM-DD format
      const miles = (run.distance_meters || 0) / 1609.34; // Convert to miles

      if (weekKey) {
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + miles;
      }
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
  const zoneTotals = aggregateZoneDurations(runs)

  const runStats: RunStats = {
    total_runs: runs.length,
    total_distance: runs.reduce((sum, run) => sum + (run.distance_meters || 0), 0) / 1000, // Convert to km
    total_time: runs.reduce((sum, run) => sum + (run.duration_seconds || 0), 0) / 3600, // Convert to hours
    avg_speed: runs.reduce((sum, run) => sum + (run.average_speed_mps || 0), 0) / runs.length,
    avg_suffer_score: runs.reduce((sum, run) => sum + (run.suffer_score || 0), 0) / runs.length,
    avg_whoop_strain: runs.reduce((sum, run) => sum + (run.whoop_strain || 0), 0) / runs.length,
    total_kilojoules: runs.reduce((sum, run) => sum + (run.kilojoules || 0), 0),
    zones_distribution: zoneTotals,
  };

  const weeklyData = weeklyMilesData();
  const totalZoneSeconds = Object.values(zoneTotals).reduce((a, b) => a + b, 0);

  // Calculate pace data for each run
  const paceData = runs
    .map((run, index) => {
      const date = new Date(run.date || run.start_date);
      const speedMps = run.average_speed_mps || 0;
      // Convert m/s to min/km: (1000m / speedMps) / 60s
      const paceMinPerKm = speedMps > 0 ? (1000 / speedMps) / 60 : 0;

      return {
        runNumber: run.run_number || index + 1,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pace: Number(paceMinPerKm.toFixed(2))
      };
    })
    .sort((a, b) => a.runNumber - b.runNumber);

  return (
    <div className="space-y-6 p-4">
      {/* Charts Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Miles Chart */}
        {weeklyData.length > 0 && (
          <div className="bg-black/20 rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Weekly Miles Progress</h3>
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

        {/* Pace History Chart */}
        {paceData.length > 0 && (
          <div className="bg-black/20 rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Pace History</h3>
            <p className="text-sm text-gray-400 mb-4">Lower is faster!</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    label={{ value: 'min/km', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any) => {
                      const minutes = Math.floor(value);
                      const seconds = Math.round((value - minutes) * 60);
                      return [`${minutes}:${seconds.toString().padStart(2, '0')} /km`, 'Pace'];
                    }}
                    labelFormatter={(label: any) => `Run on ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="pace"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#1F2937' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

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
        <div className="col-span-full space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Heart Rate Zones Distribution</h3>
            <div className="h-4 w-full rounded-full overflow-hidden bg-gray-700 flex">
              {HEART_RATE_ZONE_DEFINITIONS.map((zone) => {
                const seconds = zoneTotals[zone.key];
                if (!seconds || totalZoneSeconds === 0) {
                  return null;
                }
                const percentage = (seconds / totalZoneSeconds) * 100;
                const minutes = seconds / 60;
                return (
                  <div
                    key={zone.key}
                    className={`${zone.barClass} h-full transition-all`}
                    style={{ width: `${percentage}%` }}
                    title={`${zone.label}: ${minutes.toFixed(1)} minutes (${percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HEART_RATE_ZONE_DEFINITIONS.map((zone) => {
              const seconds = zoneTotals[zone.key];
              const minutes = seconds / 60;
              const percentage = totalZoneSeconds ? (seconds / totalZoneSeconds) * 100 : 0;

              return (
                <div key={zone.key} className="bg-black/15 border border-white/10 rounded-xl p-4 flex gap-3">
                  <span className={`inline-flex w-1.5 rounded-full ${zone.barClass}`} aria-hidden />
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-foreground font-semibold">{zone.label}</span>
                      <span className="text-muted-foreground text-sm">{zone.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{zone.subtitle}</p>
                    <p className="text-xs text-muted-foreground">{zone.intensity} · {zone.heartRate}</p>
                    <p className="text-xs text-muted-foreground">{zone.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {minutes.toFixed(1)} minutes ({percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
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
