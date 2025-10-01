import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { AstoriaConquestClient } from './client';
import { metadata as pageMetadata } from './metadata';


export const metadata: Metadata = pageMetadata;

import type { StravaRun } from '@/types/astoria';

interface RunData extends Partial<StravaRun> {
  id: number;
  name: string;
  date: string;
  distance_meters: number;
  duration_seconds: number;
}

interface StatsData {
  summary: {
    total_miles: number;
    covered_miles: number;
    percent_complete: number;
    total_segments: number;
    covered_segments: number;
    total_runs: number;
    last_updated: string;
  };
  runs: RunData[];
}

async function getData() {
  const dataPath = path.join(process.cwd(), 'public/data/astoria-conquest');
  try {
    // Load base map and covered streets
    const baseMap = JSON.parse(await fs.readFile(path.join(dataPath, 'astoria-base-map.geojson'), 'utf-8'));
    let coveredStreets = { type: "FeatureCollection", features: [] };
    
    // Try to load the progress files if they exist
    try {
      coveredStreets = JSON.parse(await fs.readFile(path.join(dataPath, 'astoria-covered-streets.geojson'), 'utf-8'));
    } catch (e) {
      console.log('Progress files not found, using defaults');
    }
    
    return { 
      baseMap, 
      coveredStreets
    };
  } catch (error) {
    console.error('Error loading data:', error);
    // Return null values to trigger error states in the client
    return null;
  }
}

export default async function AstoriaConquestPage() {
  const rawData = await getData();
  if (!rawData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error Loading Data</h1>
          <p className="text-gray-400">Unable to load the required data files.</p>
        </div>
      </div>
    );
  }

  // Transform the stats data structure
  const statsJson = await fs.readFile(path.join(process.cwd(), 'public/data/astoria-conquest/astoria-progress-stats.json'), 'utf-8');
  const rawStats = JSON.parse(statsJson) as StatsData;
  
  // Transform runs to match StravaRun interface
  const transformedRuns: StravaRun[] = (rawStats.runs || []).map((run, index) => ({
    id: run.id,
    run_number: index + 1,
    name: run.name,
    date: run.date,
    start_date: run.date,
    distance_meters: run.distance_meters,
    duration_seconds: run.duration_seconds,
    total_elevation_gain: run.total_elevation_gain || 0,
    average_speed_mps: run.distance_meters / run.duration_seconds,
    max_speed: 0, // This could be calculated from splits if available
    avg_heart_rate: run.avg_heart_rate || 0,
    max_heart_rate: run.max_heart_rate || 0,
    suffer_score: 0,
    whoop_strain: 0,
    kilojoules: 0,
    polyline: "",
    heart_rate_zones: {
      zone1_seconds: 0,
      zone2_seconds: 0,
      zone3_seconds: 0,
      zone4_seconds: 0,
      zone5_seconds: 0
    }
  }));

  const data = {
    ...rawData,
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
      total_distance: rawStats.summary.covered_miles * 1609.34, // Convert miles to meters
      total_elevation: transformedRuns.reduce((sum, run) => sum + run.total_elevation_gain, 0),
      total_time: transformedRuns.reduce((sum, run) => sum + run.duration_seconds, 0),
      avg_heart_rate: transformedRuns.reduce((sum, run) => sum + run.avg_heart_rate, 0) / (transformedRuns.length || 1),
      max_heart_rate: Math.max(...transformedRuns.map(run => run.max_heart_rate)),
      runs: transformedRuns
    }
  };

  return <AstoriaConquestClient {...data} />;
}