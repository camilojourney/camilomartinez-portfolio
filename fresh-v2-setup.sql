-- WHOOP V2 Fresh Database Setup
-- Since you only have 1 year of data, this approach is simpler than migration
-- ⚠️ This will DELETE all existing WHOOP data and start fresh with v2 schema

-- =============================================
-- STEP 1: BACKUP EXISTING DATA (OPTIONAL)
-- =============================================

-- Uncomment these lines if you want to keep a backup of your current data
-- CREATE TABLE whoop_backup_sleep AS SELECT * FROM whoop_sleep;
-- CREATE TABLE whoop_backup_workouts AS SELECT * FROM whoop_workouts;
-- CREATE TABLE whoop_backup_recovery AS SELECT * FROM whoop_recovery;
-- CREATE TABLE whoop_backup_cycles AS SELECT * FROM whoop_cycles;
-- CREATE TABLE whoop_backup_users AS SELECT * FROM whoop_users;

-- =============================================
-- STEP 2: DROP ALL EXISTING TABLES
-- =============================================

DROP TABLE IF EXISTS whoop_workouts CASCADE;
DROP TABLE IF EXISTS whoop_recovery CASCADE;
DROP TABLE IF EXISTS whoop_sleep CASCADE;
DROP TABLE IF EXISTS whoop_cycles CASCADE;
DROP TABLE IF EXISTS whoop_users CASCADE;

-- =============================================
-- STEP 3: CREATE V2-READY TABLES
-- =============================================

-- Users table (unchanged from v1)
CREATE TABLE whoop_users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255)
);

-- Cycles table (unchanged from v1)
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

-- Sleep table (v2 with UUID primary key)
CREATE TABLE whoop_sleep (
    id VARCHAR(36) PRIMARY KEY, -- UUID from v2 API
    activity_v1_id BIGINT, -- v1 ID for backwards compatibility (optional)
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

-- Recovery table (v2 with UUID sleep_id reference)
CREATE TABLE whoop_recovery (
    cycle_id BIGINT PRIMARY KEY,
    sleep_id VARCHAR(36) REFERENCES whoop_sleep(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES whoop_users(id) ON DELETE CASCADE,
    score_state TEXT,
    recovery_score DECIMAL(5, 2),
    resting_heart_rate DECIMAL(5, 2),
    hrv_rmssd_milli DECIMAL(8, 4),
    spo2_percentage DECIMAL(5, 2),
    skin_temp_celsius DECIMAL(4, 2)
);

-- Workouts table (v2 with UUID primary key)
CREATE TABLE whoop_workouts (
    id VARCHAR(36) PRIMARY KEY, -- UUID from v2 API
    activity_v1_id BIGINT, -- v1 ID for backwards compatibility (optional)
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

-- =============================================
-- STEP 4: ADD PERFORMANCE INDEXES
-- =============================================

CREATE INDEX idx_whoop_sleep_user_id ON whoop_sleep(user_id);
CREATE INDEX idx_whoop_sleep_cycle_id ON whoop_sleep(cycle_id);
CREATE INDEX idx_whoop_sleep_activity_v1_id ON whoop_sleep(activity_v1_id);
CREATE INDEX idx_whoop_workouts_user_id ON whoop_workouts(user_id);
CREATE INDEX idx_whoop_workouts_activity_v1_id ON whoop_workouts(activity_v1_id);
CREATE INDEX idx_whoop_cycles_user_id ON whoop_cycles(user_id);
CREATE INDEX idx_whoop_recovery_user_id ON whoop_recovery(user_id);

-- =============================================
-- STEP 5: ADD TABLE COMMENTS
-- =============================================

COMMENT ON TABLE whoop_users IS 'Stores WHOOP user profile information (V2 API)';
COMMENT ON TABLE whoop_cycles IS 'Stores 24-hour physiological cycle data (V2 API)';
COMMENT ON TABLE whoop_sleep IS 'Stores sleep activity data with UUID IDs (V2 API)';
COMMENT ON TABLE whoop_recovery IS 'Stores daily recovery scores and biometric data (V2 API)';
COMMENT ON TABLE whoop_workouts IS 'Stores workout data with UUID IDs (V2 API)';

-- =============================================
-- VERIFICATION
-- =============================================

-- Show the new table structure
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name LIKE 'whoop_%'
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Verify foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name LIKE 'whoop_%';

SELECT 'V2 Database Setup Complete! 🎉' as status,
       'Ready for WhoopV2Client data collection' as next_step;
