export interface HeartRateZonesData {
  zone1_seconds: number;
  zone2_seconds: number;
  zone3_seconds: number;
  zone4_seconds: number;
  zone5_seconds: number;
}

export interface HeartRateZonesDisplay {
  rest: number;
  light: number;
  moderate: number;
  hard: number;
  peak: number;
  max: number;
}

export interface StravaRun {
  id: number;
  run_number: number;
  name: string;
  date: string;
  start_date: string;
  distance_meters: number;
  duration_seconds: number;
  total_elevation_gain: number;
  average_speed_mps: number;
  max_speed: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  suffer_score: number;
  whoop_strain: number;
  kilojoules: number;
  polyline: string;
  heart_rate_zones: HeartRateZonesData;
}

import type { GeoJsonObject } from 'geojson';

export type GeoJsonData = GeoJsonObject;

export interface AstoriaProgress {
  total_distance: number;
  total_elevation: number;
  streets_covered: number;
  total_streets: number;
  coverage_percentage: number;
}

export interface AstoriaStats {
  total_runs: number;
  total_distance: number;
  total_elevation: number;
  total_time: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  runs: StravaRun[];
}

export interface AstoriaMapProps {
  baseMapData: GeoJsonData;
  coveredStreetsData: GeoJsonData;
  selectedRun?: StravaRun;
}

export interface MapContainerProps extends AstoriaMapProps {}

export interface AstoriaStatsProps {
  stats: AstoriaStats;
}

export interface RunCardData extends Omit<StravaRun, 'heart_rate_zones'> {
  heart_rate_zones: HeartRateZonesDisplay;
}

export interface RunCardProps {
  run: RunCardData;
  isSelected?: boolean;
  onClick?: () => void;
}