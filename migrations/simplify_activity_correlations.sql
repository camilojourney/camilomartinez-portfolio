-- 📂 migrations/simplify_activity_correlations.sql
-- Simplify activity_correlations table to just track essential data

-- First, drop the existing table
DROP TABLE IF EXISTS activity_correlations;

-- Recreate with just the essential columns
CREATE TABLE activity_correlations (
    strava_run_id BIGINT NOT NULL,
    whoop_workout_id TEXT NOT NULL,
    time_diff_minutes INTEGER,
    strava_distance_meters DOUBLE PRECISION,
    whoop_distance_meters DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (strava_run_id, whoop_workout_id),
    FOREIGN KEY (strava_run_id) REFERENCES strava_runs(id),
    FOREIGN KEY (whoop_workout_id) REFERENCES whoop_workouts(id)
);