'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import LiquidNav from '@/components/shared/liquid-nav';
import { AstoriaStats } from '@/components/features/astoria-conquest/AstoriaStats';
import { MapContainer } from '@/components/features/astoria-conquest/MapContainer';
import { RunCard } from '@/components/features/astoria-conquest/RunCard';
import { RunSelector } from '@/components/features/astoria-conquest/RunSelector';
import Link from 'next/link';
import { extractZoneDurations } from '@/lib/astoria/zones';
import type { 
  StravaRun, 
  RunCardData,
  AstoriaStats as AstoriaStatsType
} from '@/types/astoria';

interface AstoriaConquestClientProps {
  baseMap: any;
  coveredStreets: any;
  stats: {
    covered_miles: number;
    total_miles: number;
    covered_segments: number;
    total_segments: number;
    percent_complete: number;
    last_updated: string;
  };
  runs: StravaRun[];
  runStats: AstoriaStatsType;
}

export function AstoriaConquestClient({ 
  baseMap, 
  coveredStreets, 
  stats, 
  runs, 
  runStats 
}: AstoriaConquestClientProps) {
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  const sortedRuns = [...runs].sort((a, b) => {
    const orderA = typeof a.run_number === 'number' ? a.run_number : new Date(a.date).getTime();
    const orderB = typeof b.run_number === 'number' ? b.run_number : new Date(b.date).getTime();
    return orderA - orderB;
  });

  const selectedRun = selectedRunId
    ? sortedRuns.find(run => run.id === selectedRunId) ?? null
    : null;

  const displayedStats: AstoriaStatsType = selectedRun
    ? { ...runStats, runs: [selectedRun] }
    : runStats;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <LiquidNav currentPage="apps" />

      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] bg-black/40 mt-24 md:mt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            <div className="mb-4">
              <Link
                href="/projects/astoria-conquest"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/70 transition-colors duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:text-cyan-200"
              >
                <span>Read how I built this</span>
                <span aria-hidden className="text-lg">→</span>
              </Link>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Astoria Conquest</h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
              Running every street in Astoria, Queens. Follow my journey as I explore the neighborhood, one run at a time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-400">Streets Covered</h3>
            <p className="text-3xl font-bold">{stats?.percent_complete}%</p>
            <p className="text-sm text-gray-400">
              {stats?.covered_segments} of {stats?.total_segments} streets
            </p>
          </div>
          <div className="bg-black/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-400">Total Distance</h3>
            <p className="text-3xl font-bold">{stats?.covered_miles.toFixed(1)} mi</p>
            <p className="text-sm text-gray-400">Across {runStats?.total_runs || 0} runs</p>
          </div>
          <div className="bg-black/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-400">Total Elevation</h3>
            <p className="text-3xl font-bold">{(runStats?.total_elevation || 0).toFixed(0)}m</p>
            <p className="text-sm text-gray-400">Cumulative gain</p>
          </div>
        </div>

        {/* Run Selector */}
        <RunSelector
          runs={sortedRuns}
          selectedRunId={selectedRunId}
          onRunSelect={setSelectedRunId}
        />

        {/* Map and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
          <div className="space-y-8">
            <div className="bg-black/20 rounded-xl p-4 aspect-[4/3]">
              <MapContainer 
                baseMapData={baseMap} 
                coveredStreetsData={coveredStreets || { type: "FeatureCollection", features: [] }}
                selectedRun={selectedRun || undefined}
              />
            </div>
            
            <div className="bg-black/20 rounded-xl p-6">
              <AstoriaStats 
                stats={displayedStats}
              />
            </div>
          </div>

          {/* Run Cards */}
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {(selectedRun ? [selectedRun] : sortedRuns).map((run: StravaRun) => {
              const runData: RunCardData = {
                ...run,
                heart_rate_zones: extractZoneDurations(run.heart_rate_zones),
              };

              return (
                <RunCard 
                  key={run.id} 
                  run={runData}
                  isSelected={run.id === selectedRunId}
                  onClick={() => setSelectedRunId(run.id === selectedRunId ? null : run.id)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-4 pb-8">
        Last updated: {stats?.last_updated}
      </p>
    </div>
  );
}
