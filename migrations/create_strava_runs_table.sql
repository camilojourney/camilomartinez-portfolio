-- Create strava_runs table to store individual Strava activities
-- This table stores running activities for the Astoria Conquest feature

CREATE TABLE IF NOT EXISTS strava_runs (
    id BIGINT PRIMARY KEY,                       -- Strava activity ID
    user_id BIGINT REFERENCES strava_users(id),  -- FK to athlete

    -- Basics
    name VARCHAR(255),                           -- Activity name
    sport_type VARCHAR(50),                      -- Run, Ride, etc.
    start_date TIMESTAMP WITH TIME ZONE,         -- When the run started

    -- Map / geometry
    distance_meters DOUBLE PRECISION,            -- Total distance
    summary_polyline TEXT,                       -- Encoded polyline (for quick draw)
    detailed_polyline TEXT,                      -- Optional: higher fidelity

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_strava_runs_user_id ON strava_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_runs_date ON strava_runs(start_date);
CREATE INDEX IF NOT EXISTS idx_strava_runs_sport_type ON strava_runs(sport_type);

-- Composite index for user + date queries (common for progress tracking)
CREATE INDEX IF NOT EXISTS idx_strava_runs_user_date ON strava_runs(user_id, start_date);

-- Add comment explaining the table
COMMENT ON TABLE strava_runs IS 'Stores individual Strava activities for Astoria Conquest street coverage tracking';
