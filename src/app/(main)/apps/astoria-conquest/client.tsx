'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LiquidNav from '@/components/shared/liquid-nav';
import { AstoriaStats } from '@/components/features/astoria-conquest/AstoriaStats';
import { MapContainer } from '@/components/features/astoria-conquest/MapContainer';
import { RunCard } from '@/components/features/astoria-conquest/RunCard';
import { RunSelector } from '@/components/features/astoria-conquest/RunSelector';
import Link from 'next/link'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { extractZoneDurations } from '@/lib/astoria/zones';
import ScrollReveal from '@/components/shared/scroll-reveal';
import TextReveal from '@/components/shared/text-reveal';
import MagneticButton from '@/components/shared/magnetic-button';
import type {
  StravaRun,
  RunCardData,
  AstoriaStats as AstoriaStatsType
} from '@/types/astoria';
import type { FeatureCollection, Geometry } from 'geojson';

interface RawRunData {
  id: number;
  run_number?: number;
  name: string;
  date: string;
  distance_meters: number;
  duration_seconds: number;
  polyline?: string;
  average_speed_mps?: number;
  total_elevation_gain?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  suffer_score?: number;
  whoop_strain?: number;
  kilojoules?: number;
  heart_rate_zones?: {
    rest?: number;
    light?: number;
    moderate?: number;
    hard?: number;
    peak?: number;
    max?: number;
  };
}

interface RawStatsData {
  summary: {
    total_miles: number;
    covered_miles: number;
    percent_complete: number;
    total_segments: number;
    covered_segments: number;
    total_runs: number;
    last_updated: string;
  };
  runs: RawRunData[];
}

export function AstoriaConquestClient() {
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    baseMap: FeatureCollection<Geometry>;
    coveredStreets: FeatureCollection<Geometry>;
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
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch all three data files in parallel
        const [baseMapRes, coveredStreetsRes, statsRes] = await Promise.all([
          fetch('/api/astoria/base-map'),
          fetch('/api/astoria/covered-streets'),
          fetch('/api/astoria/stats')
        ]);

        if (!baseMapRes.ok || !coveredStreetsRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch map data');
        }

        const baseMap = await baseMapRes.json();
        const coveredStreets = await coveredStreetsRes.json();
        const rawStats: RawStatsData = await statsRes.json();

        // Transform runs to match StravaRun interface
        const transformedRuns: StravaRun[] = (rawStats.runs || []).map((run) => ({
          id: run.id,
          run_number: run.run_number || 0,
          name: run.name,
          date: run.date,
          start_date: run.date,
          distance_meters: run.distance_meters,
          duration_seconds: run.duration_seconds,
          total_elevation_gain: run.total_elevation_gain || 0,
          average_speed_mps: run.distance_meters / run.duration_seconds,
          max_speed: 0,
          avg_heart_rate: run.avg_heart_rate || 0,
          max_heart_rate: run.max_heart_rate || 0,
          suffer_score: run.suffer_score || 0,
          whoop_strain: run.whoop_strain || 0,
          kilojoules: run.kilojoules || 0,
          polyline: run.polyline || "",
          heart_rate_zones: {
            zone1_seconds: run.heart_rate_zones?.rest || 0,
            zone2_seconds: run.heart_rate_zones?.light || 0,
            zone3_seconds: run.heart_rate_zones?.moderate || 0,
            zone4_seconds: run.heart_rate_zones?.hard || 0,
            zone5_seconds: run.heart_rate_zones?.peak || 0,
            zone6_seconds: run.heart_rate_zones?.max || 0
          }
        }));

        setData({
          baseMap,
          coveredStreets,
          stats: {
            covered_miles: rawStats.summary.covered_miles,
            total_miles: rawStats.summary.total_miles,
            covered_segments: rawStats.summary.covered_segments,
            total_segments: rawStats.summary.total_segments,
            percent_complete: rawStats.summary.percent_complete,
            last_updated: rawStats.summary.last_updated
          },
          runs: transformedRuns,
          runStats: {
            total_runs: rawStats.summary.total_runs,
            total_distance: rawStats.summary.covered_miles * 1609.34,
            total_elevation: transformedRuns.reduce((sum, run) => sum + run.total_elevation_gain, 0),
            total_time: transformedRuns.reduce((sum, run) => sum + run.duration_seconds, 0),
            avg_heart_rate: transformedRuns.reduce((sum, run) => sum + run.avg_heart_rate, 0) / (transformedRuns.length || 1),
            max_heart_rate: Math.max(...transformedRuns.map(run => run.max_heart_rate)),
            runs: transformedRuns
          }
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading Astoria data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Loading state - premium skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-foreground">
        <LiquidNav currentPage="apps" />
        <div className="pt-32 flex flex-col items-center justify-center px-4">
          <div className="max-w-7xl w-full">
            <div className="mb-12 conquest-loader-pulse">
              <div className="h-12 w-64 bg-white/5 rounded-xl mb-4 mx-auto"></div>
              <div className="h-6 w-96 bg-white/5 rounded-lg mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="chart-skeleton h-28 rounded-xl"></div>
              <div className="chart-skeleton h-28 rounded-xl"></div>
            </div>
            <div className="chart-skeleton h-[400px] rounded-xl mb-8 flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin h-10 w-10 mx-auto text-cyan-400/50 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-muted-foreground text-sm">Loading map data...</p>
                <div className="mt-3 w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
                  <div className="h-full bg-gradient-to-r from-cyan-400/40 to-blue-400/40 conquest-loader-bar rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-foreground">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error Loading Data</h1>
          <p className="text-gray-400 mb-4">{error || 'Unable to load the required data files.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { baseMap, coveredStreets, stats, runs, runStats } = data;

  // Sort runs chronologically for buttons/selector (Run #1 → Run #4)
  const runsForButtons = [...runs].sort((a, b) => {
    const orderA = typeof a.run_number === 'number' ? a.run_number : new Date(a.date).getTime();
    const orderB = typeof b.run_number === 'number' ? b.run_number : new Date(b.date).getTime();
    return orderA - orderB;
  });

  // Sort runs in REVERSE chronological order (newest first) for display cards
  const sortedRuns = [...runs].sort((a, b) => {
    const orderA = typeof a.run_number === 'number' ? a.run_number : new Date(a.date).getTime();
    const orderB = typeof b.run_number === 'number' ? b.run_number : new Date(b.date).getTime();
    return orderB - orderA; // Show newest first
  });

  const selectedRun = selectedRunId
    ? sortedRuns.find(run => run.id === selectedRunId) ?? null
    : null;

  const displayedStats: AstoriaStatsType = selectedRun
    ? { ...runStats, runs: [selectedRun] }
    : runStats;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-foreground">
      <LiquidNav currentPage="apps" />

      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] bg-black/40 mt-24 md:mt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            <ScrollReveal delay={0.1}>
              <div className="mb-4">
                <MagneticButton
                  as="a"
                  href="/projects/astoria-conquest"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/70 transition-colors duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:text-cyan-200"
                >
                  <span>Read how I built this</span>
                  <span aria-hidden className="text-lg">&#8594;</span>
                </MagneticButton>
              </div>
            </ScrollReveal>
            <TextReveal as="h1" className="text-5xl md:text-6xl font-bold mb-4" delay={0.2}>
              Astoria Conquest
            </TextReveal>
            <ScrollReveal delay={0.4}>
              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
                Running every street in Astoria, Queens. Follow my journey as I explore the neighborhood, one run at a time.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal staggerIndex={0}>
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-6 stat-card-hover">
              <h3 className="text-lg font-semibold text-gray-400">Streets Covered</h3>
              <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{stats?.percent_complete}%</p>
              <p className="text-sm text-gray-400 mt-1">
                {stats?.covered_segments} of {stats?.total_segments} streets
              </p>
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-1000"
                  style={{ width: `${stats?.percent_complete || 0}%` }}
                />
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal staggerIndex={1}>
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-6 stat-card-hover">
              <h3 className="text-lg font-semibold text-gray-400">Total Distance</h3>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{stats?.covered_miles.toFixed(1)} mi</p>
              <p className="text-sm text-gray-400 mt-1">Across {runStats?.total_runs || 0} runs</p>
            </div>
          </ScrollReveal>
        </div>

        {/* Run Selector */}
        <ScrollReveal delay={0.1}>
          <RunSelector
            runs={runsForButtons}
            selectedRunId={selectedRunId}
            onRunSelect={setSelectedRunId}
          />
        </ScrollReveal>

        {/* Map and Run Cards */}
        <ScrollReveal delay={0.15}>
          <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-6">
            <div className="grid grid-cols-1 xl:grid-cols-[3fr,2fr] gap-6 items-start">
              <div className="bg-black/10 rounded-lg p-4 aspect-[4/3] animate-map-reveal">
                <MapContainer
                  baseMapData={baseMap}
                  coveredStreetsData={coveredStreets || { type: "FeatureCollection", features: [] }}
                  selectedRun={selectedRun || undefined}
                />
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {(selectedRun ? [selectedRun] : sortedRuns).map((run: StravaRun, index: number) => {
                  const runData: RunCardData = {
                    ...run,
                    heart_rate_zones: extractZoneDurations(run.heart_rate_zones),
                  };

                  return (
                    <ScrollReveal key={run.id} staggerIndex={index} staggerDelay={0.06}>
                      <RunCard
                        run={runData}
                        isSelected={run.id === selectedRunId}
                        onClick={() => setSelectedRunId(run.id === selectedRunId ? null : run.id)}
                      />
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Charts and Stats below */}
        <ScrollReveal>
          <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-6">
            <AstoriaStats stats={displayedStats} />
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <p className="text-center text-xs text-gray-500 mt-4 pb-8">
          Last updated: {stats?.last_updated}
        </p>
      </ScrollReveal>
    </div>
  );
}
