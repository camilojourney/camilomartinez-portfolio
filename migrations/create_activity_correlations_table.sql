-- Create activity correlations table for cross-platform relationships
-- This table stores pre-computed relationships between Strava runs and WHOOP workouts

CREATE TABLE IF NOT EXISTS activity_correlations (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    strava_run_id BIGINT NOT NULL,
    whoop_workout_id VARCHAR(36) NOT NULL,
    correlation_confidence DECIMAL(3,2) DEFAULT 0.85, -- 0.0 to 1.0 confidence score
    correlation_method VARCHAR(50) DEFAULT 'datetime_match', -- How the correlation was determined
    time_diff_minutes INTEGER, -- Difference in start times (minutes)
    distance_diff_percent DECIMAL(5,2), -- Difference in distance if both have it
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_correlation_user FOREIGN KEY (user_id) REFERENCES whoop_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_correlation_strava FOREIGN KEY (strava_run_id) REFERENCES strava_runs(id) ON DELETE CASCADE,
    CONSTRAINT fk_correlation_whoop FOREIGN KEY (whoop_workout_id) REFERENCES whoop_workouts(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate correlations
    CONSTRAINT uk_activity_correlation UNIQUE (strava_run_id, whoop_workout_id),
    
    -- Index for performance
    INDEX idx_correlations_user_date (user_id, created_at),
    INDEX idx_correlations_strava (strava_run_id),
    INDEX idx_correlations_whoop (whoop_workout_id)
);

-- Add comments for documentation
COMMENT ON TABLE activity_correlations IS 'Cross-platform correlations between Strava runs and WHOOP workouts';
COMMENT ON COLUMN activity_correlations.correlation_confidence IS 'Confidence score 0.0-1.0 for relationship accuracy';
COMMENT ON COLUMN activity_correlations.correlation_method IS 'Algorithm used: datetime_match, distance_match, manual';
COMMENT ON COLUMN activity_correlations.time_diff_minutes IS 'Start time difference in minutes (positive = WHOOP later)';
COMMENT ON COLUMN activity_correlations.distance_diff_percent IS 'Distance difference as percentage (positive = WHOOP longer)';
