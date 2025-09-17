-- Extend strava_runs table with essential Strava API fields
-- Migration: extend_strava_runs_sept_2025.sql

-- 1A) Add essential timing and performance columns
ALTER TABLE strava_runs
  -- timing fields
  ADD COLUMN IF NOT EXISTS elapsed_time_seconds     integer,
  ADD COLUMN IF NOT EXISTS start_date               timestamp,
  ADD COLUMN IF NOT EXISTS start_date_local         timestamp,
  ADD COLUMN IF NOT EXISTS utc_offset_seconds       integer,

  -- performance metrics
  ADD COLUMN IF NOT EXISTS average_speed_mps        numeric,
  ADD COLUMN IF NOT EXISTS max_speed_mps            numeric,
  ADD COLUMN IF NOT EXISTS total_elevation_gain     numeric,
  ADD COLUMN IF NOT EXISTS elev_high                numeric,
  ADD COLUMN IF NOT EXISTS elev_low                 numeric,
  ADD COLUMN IF NOT EXISTS suffer_score             numeric,
  ADD COLUMN IF NOT EXISTS perceived_exertion       integer,

  -- location coordinates
  ADD COLUMN IF NOT EXISTS start_latlng             point,
  ADD COLUMN IF NOT EXISTS end_latlng               point,

  -- map data
  ADD COLUMN IF NOT EXISTS polyline                 text,
  ADD COLUMN IF NOT EXISTS summary_polyline         text,

  -- splits and notes
  ADD COLUMN IF NOT EXISTS private_note             text;

-- 1C) Create normalized splits table
CREATE TABLE IF NOT EXISTS strava_run_splits (
  id                              bigserial PRIMARY KEY,
  strava_run_id                   bigint NOT NULL,
  split_type                      text NOT NULL, -- 'metric' or 'standard'
  split_number                    integer NOT NULL,
  distance_meters                 numeric NOT NULL,
  elapsed_time_seconds            integer NOT NULL,
  moving_time_seconds             integer NOT NULL,
  elevation_difference_meters     numeric,
  average_speed_mps               numeric NOT NULL,
  average_grade_adjusted_speed    numeric,
  pace_zone                       integer,
  
  CONSTRAINT fk_strava_run_splits_run 
    FOREIGN KEY (strava_run_id) 
    REFERENCES strava_runs(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT unique_split_per_run 
    UNIQUE (strava_run_id, split_type, split_number)
);

-- 1B) Add helpful indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_strava_runs_user_date       ON strava_runs (user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_strava_runs_sport_date      ON strava_runs (sport_type, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_strava_runs_suffer_score    ON strava_runs (suffer_score DESC) WHERE suffer_score IS NOT NULL;

-- Splits table indexes
CREATE INDEX IF NOT EXISTS idx_splits_run_type             ON strava_run_splits (strava_run_id, split_type);
CREATE INDEX IF NOT EXISTS idx_splits_speed                ON strava_run_splits (average_speed_mps DESC);
CREATE INDEX IF NOT EXISTS idx_splits_distance_time        ON strava_run_splits (distance_meters, elapsed_time_seconds);

-- Comments for documentation
COMMENT ON COLUMN strava_runs.elapsed_time_seconds IS 'Total elapsed time including stops and pauses';
COMMENT ON COLUMN strava_runs.start_date IS 'Activity start time in UTC (from Strava API)';
COMMENT ON COLUMN strava_runs.start_date_local IS 'Activity start time in local timezone';
COMMENT ON COLUMN strava_runs.utc_offset_seconds IS 'UTC offset in seconds from start_date_local';
COMMENT ON COLUMN strava_runs.average_speed_mps IS 'Average speed in meters per second';
COMMENT ON COLUMN strava_runs.max_speed_mps IS 'Maximum speed in meters per second';
COMMENT ON COLUMN strava_runs.total_elevation_gain IS 'Total elevation gained during activity';
COMMENT ON COLUMN strava_runs.elev_high IS 'Highest elevation point in meters';
COMMENT ON COLUMN strava_runs.elev_low IS 'Lowest elevation point in meters';
COMMENT ON COLUMN strava_runs.suffer_score IS 'Strava suffer score (0-1000+)';
COMMENT ON COLUMN strava_runs.perceived_exertion IS 'Perceived exertion rating (1-10)';
COMMENT ON COLUMN strava_runs.start_latlng IS 'Starting coordinates [lat, lng]';
COMMENT ON COLUMN strava_runs.end_latlng IS 'Ending coordinates [lat, lng]';
COMMENT ON COLUMN strava_runs.polyline IS 'Detailed route polyline from Strava map';
COMMENT ON COLUMN strava_runs.summary_polyline IS 'Simplified route polyline from Strava map';
COMMENT ON COLUMN strava_runs.private_note IS 'Private notes about the activity';

-- Splits table comments
COMMENT ON TABLE strava_run_splits IS 'Normalized split data from Strava activities (metric and standard)';
COMMENT ON COLUMN strava_run_splits.split_type IS 'Type of split: metric (1km) or standard (1 mile)';
COMMENT ON COLUMN strava_run_splits.split_number IS 'Sequential split number within the activity';
COMMENT ON COLUMN strava_run_splits.distance_meters IS 'Distance covered in this split (meters)';
COMMENT ON COLUMN strava_run_splits.elapsed_time_seconds IS 'Total time for this split including stops';
COMMENT ON COLUMN strava_run_splits.moving_time_seconds IS 'Moving time for this split excluding stops';
COMMENT ON COLUMN strava_run_splits.elevation_difference_meters IS 'Net elevation change during this split';
COMMENT ON COLUMN strava_run_splits.average_speed_mps IS 'Average speed for this split (meters per second)';
COMMENT ON COLUMN strava_run_splits.average_grade_adjusted_speed IS 'Grade-adjusted average speed';

