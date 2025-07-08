-- STEP 1: DROP ALL EXISTING TABLES TO ENSURE A CLEAN SLATE
-- The "CASCADE" keyword automatically removes any dependencies between tables.

DROP TABLE IF EXISTS whoop_workouts CASCADE;
DROP TABLE IF EXISTS whoop_recovery CASCADE;
DROP TABLE IF EXISTS whoop_sleep CASCADE;
DROP TABLE IF EXISTS whoop_cycles CASCADE;
DROP TABLE IF EXISTS whoop_users CASCADE;


-- STEP 2: CREATE THE NEW, FINAL V1-COMPATIBLE TABLES WITH ALL FIELDS

-- Stores user profile information from the /v1/user/profile/basic endpoint
CREATE TABLE whoop_users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255)
);

-- Stores daily physiological cycle data from the /v1/cycle endpoint
CREATE TABLE whoop_cycles (
    id BIGINT PRIMARY KEY,
    user_id BIGINT REFERENCES whoop_users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    timezone_offset VARCHAR(10),
    score_state TEXT,
    strain DECIMAL(8, 6),
    kilojoule DECIMAL(12, 4),
    average_heart_rate INT,
    max_heart_rate INT
);

-- Stores sleep activity data from the /v1/cycle/{id}/sleep endpoint
CREATE TABLE whoop_sleep (
    id BIGINT PRIMARY KEY,
    user_id BIGINT REFERENCES whoop_users(id) ON DELETE CASCADE,
    cycle_id BIGINT REFERENCES whoop_cycles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    timezone_offset VARCHAR(10),
    nap BOOLEAN,
    score_state TEXT,
    sleep_performance_percentage DECIMAL(5, 2),
    respiratory_rate DECIMAL(5, 2),
    sleep_consistency_percentage DECIMAL(5, 2),
    sleep_efficiency_percentage DECIMAL(5, 2),
    total_in_bed_time_milli BIGINT,
    total_awake_time_milli BIGINT,
    total_light_sleep_time_milli BIGINT,
    total_slow_wave_sleep_time_milli BIGINT,
    total_rem_sleep_time_milli BIGINT,
    disturbance_count INT
);

-- Stores recovery data from the /v1/cycle/{id}/recovery endpoint
CREATE TABLE whoop_recovery (
    cycle_id BIGINT PRIMARY KEY,
    sleep_id BIGINT REFERENCES whoop_sleep(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES whoop_users(id) ON DELETE CASCADE,
    score_state TEXT,
    recovery_score DECIMAL(5, 2),
    resting_heart_rate DECIMAL(5, 2),
    hrv_rmssd_milli DECIMAL(8, 4),
    spo2_percentage DECIMAL(5, 2),
    skin_temp_celsius DECIMAL(4, 2)
);

-- Stores workout activity data from the /v1/activity/workout endpoint
CREATE TABLE whoop_workouts (
    id BIGINT PRIMARY KEY,
    user_id BIGINT REFERENCES whoop_users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    timezone_offset VARCHAR(10),
    sport_id INT,
    sport_name VARCHAR(100),
    score_state TEXT,
    strain DECIMAL(8, 6),
    average_heart_rate INT,
    max_heart_rate INT,
    kilojoule DECIMAL(12, 4),
    distance_meter DECIMAL(12, 4),
    altitude_gain_meter DECIMAL(12, 4),
    altitude_change_meter DECIMAL(12, 4),
    zone_zero_milli BIGINT,
    zone_one_milli BIGINT,
    zone_two_milli BIGINT,
    zone_three_milli BIGINT,
    zone_four_milli BIGINT,
    zone_five_milli BIGINT
);

-- Add comments for documentation
COMMENT ON TABLE whoop_users IS 'Stores WHOOP user profile information (V1 API)';
COMMENT ON TABLE whoop_cycles IS 'Stores 24-hour physiological cycle data (V1 API)';
COMMENT ON TABLE whoop_sleep IS 'Stores sleep activity data including detailed stage summary (V1 API)';
COMMENT ON TABLE whoop_recovery IS 'Stores daily recovery scores and biometric data (V1 API)';
COMMENT ON TABLE whoop_workouts IS 'Stores workout data including heart rate zones (V1 API)';
