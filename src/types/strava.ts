// 📂 src/types/strava.ts
/**
 * TypeScript definitions for Strava API integration
 * Used for the Astoria Conquest street running tracker
 */

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  start_date: string; // ISO 8601
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  visibility: string;
  flagged: boolean;
  gear_id?: string;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_cadence?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  heartrate_opt_out: boolean;
  display_hide_heartrate_option: boolean;
  elev_high?: number;
  elev_low?: number;
  upload_id?: number;
  upload_id_str?: string;
  external_id?: string;
  from_accepted_tag: boolean;
  pr_count: number;
  total_photo_count: number;
  has_kudoed: boolean;
  workout_type?: number;
  suffer_score?: number;
  description?: string;
  calories?: number;
  perceived_exertion?: number;
  prefer_perceived_exertion?: boolean;
  segment_efforts?: StravaSegmentEffort[];
  splits_metric?: StravaSplit[];
  splits_standard?: StravaSplit[];
  laps?: StravaLap[];
  gear?: StravaGear;
  partner_brand_tag?: string;
  photos?: StravaPhotoSummary;
  highlighted_kudosers?: StravaAthleteSummary[];
  device_name?: string;
  embed_token?: string;
  segment_leaderboard_opt_out: boolean;
  leaderboard_opt_out: boolean;
  type: 'Run' | 'Ride' | 'Swim' | 'Hike' | 'Walk' | 'AlpineSki' | 'BackcountrySki' | 'Canoeing' | 'Crossfit' | 'EBikeRide' | 'Elliptical' | 'Golf' | 'Handcycle' | 'HighIntensityIntervalTraining' | 'Hockey' | 'IceSkate' | 'InlineSkate' | 'Kayaking' | 'Kitesurf' | 'NordicSki' | 'RockClimbing' | 'RollerSki' | 'Rowing' | 'Sail' | 'Skateboard' | 'Snowboard' | 'Snowshoe' | 'Soccer' | 'StairStepper' | 'StandUpPaddling' | 'Surfing' | 'Tennis' | 'TrailRun' | 'Velomobile' | 'VirtualRide' | 'VirtualRun' | 'WeightTraining' | 'Wheelchair' | 'Windsurf' | 'Workout' | 'Yoga';
}

export interface StravaSegmentEffort {
  id: number;
  resource_state: number;
  name: string;
  activity: StravaMetaActivity;
  athlete: StravaMetaAthlete;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  average_cadence?: number;
  device_watts?: boolean;
  average_watts?: number;
  segment: StravaSegmentSummary;
  kom_rank?: number;
  pr_rank?: number;
  achievements: any[];
  hidden: boolean;
}

export interface StravaSplit {
  distance: number;
  elapsed_time: number;
  elevation_difference: number;
  moving_time: number;
  split: number;
  average_speed: number;
  pace_zone: number;
}

export interface StravaLap {
  id: number;
  resource_state: number;
  name: string;
  activity: StravaMetaActivity;
  athlete: StravaMetaAthlete;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  device_watts?: boolean;
  average_watts?: number;
  lap_index: number;
  split: number;
}

export interface StravaGear {
  id: string;
  primary: boolean;
  name: string;
  nickname?: string;
  resource_state: number;
  retired: boolean;
  distance: number;
  converted_distance: number;
}

export interface StravaPhotoSummary {
  primary?: StravaPhoto;
  use_primary_photo: boolean;
  count: number;
}

export interface StravaPhoto {
  id: number;
  unique_id: string;
  urls: {
    [key: string]: string;
  };
  source: number;
  uploaded_at: string;
  created_at: string;
  caption?: string;
  type: string;
  location?: [number, number];
}

export interface StravaAthleteSummary {
  id: number;
  username?: string;
  resource_state: number;
  firstname: string;
  lastname: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: 'M' | 'F';
  premium: boolean;
  summit: boolean;
  created_at: string;
  updated_at: string;
  badge_type_id: number;
  weight?: number;
  profile_medium?: string;
  profile?: string;
  friend?: 'pending' | 'accepted' | 'blocked';
  follower?: 'pending' | 'accepted' | 'blocked';
}

export interface StravaMetaActivity {
  id: number;
  resource_state: number;
}

export interface StravaMetaAthlete {
  id: number;
  resource_state: number;
}

export interface StravaSegmentSummary {
  id: number;
  resource_state: number;
  name: string;
  activity_type: string;
  distance: number;
  average_grade: number;
  maximum_grade: number;
  elevation_high: number;
  elevation_low: number;
  start_latlng: [number, number];
  end_latlng: [number, number];
  elevation_profile?: string;
  climb_category: number;
  city: string;
  state: string;
  country: string;
  private: boolean;
  hazardous: boolean;
  starred: boolean;
}

// Database types for storing processed Strava data
export interface StoredStravaRun {
  activity_id: number;
  run_date: string; // ISO 8601
  distance_meters: number;
  moving_time_seconds: number;
  average_speed_ms: number;
  total_elevation_gain: number;
  polyline: string; // Encoded polyline from Strava
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface AstoriaStreet {
  id: number;
  name: string;
  street_type?: string; // avenue, street, boulevard, etc.
  length_meters?: number;
  created_at: string;
  updated_at: string;
}

// GeoJSON types for map visualization
export interface StreetGeoJSON {
  type: 'FeatureCollection';
  features: StreetFeature[];
}

export interface StreetFeature {
  type: 'Feature';
  properties: {
    id: number;
    name: string;
    street_type?: string;
    length_meters?: number;
    completion_status: 'completed' | 'partial' | 'unvisited';
    coverage_percentage?: number;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export interface RunGeoJSON {
  type: 'FeatureCollection';
  features: RunFeature[];
}

export interface RunFeature {
  type: 'Feature';
  properties: {
    activity_id: number;
    name: string;
    run_date: string;
    distance_meters: number;
    moving_time_seconds: number;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

// API response types
export interface AstoriaTrackerData {
  allStreetsGeoJSON: StreetGeoJSON;
  runGeometriesGeoJSON: RunGeoJSON;
  stats: AstoriaStats;
}

export interface AstoriaStats {
  totalStreets: number;
  completedStreets: number;
  partialStreets: number;
  unvisitedStreets: number;
  completionPercentage: number;
  totalDistanceMeters: number;
  completedDistanceMeters: number;
  remainingDistanceMeters: number;
  totalRunsCount: number;
  totalRunningTimeSeconds: number;
  averageRunDistanceMeters: number;
  lastRunDate?: string;
  streetsCompletedThisMonth: number;
  monthlyProgressPercentage: number;
}

// Error types
export interface StravaError {
  message: string;
  field?: string;
  code?: string;
}

export interface StravaErrorResponse {
  message: string;
  errors: StravaError[];
}

// Utility types
export type ActivityType = StravaActivity['type'];
export type RunningActivityType = 'Run' | 'TrailRun' | 'VirtualRun';

// Configuration types
export interface StravaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface AstoriaBoundary {
  type: 'Polygon';
  coordinates: [number, number][][];
}
