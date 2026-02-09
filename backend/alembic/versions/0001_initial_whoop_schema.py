"""Initial WHOOP schema"""

from textwrap import dedent

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0001_initial_whoop_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                CREATE TABLE IF NOT EXISTS whoop_users (
                    id BIGINT PRIMARY KEY,
                    email VARCHAR(255),
                    first_name VARCHAR(255),
                    last_name VARCHAR(255),
                    access_token TEXT,
                    refresh_token TEXT,
                    token_expires_at TIMESTAMPTZ,
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS whoop_cycles (
                    id BIGINT PRIMARY KEY,
                    user_id BIGINT REFERENCES whoop_users(id) ON DELETE CASCADE,
                    start_time TIMESTAMPTZ,
                    end_time TIMESTAMPTZ,
                    timezone_offset VARCHAR(10),
                    score_state TEXT,
                    strain DECIMAL(8, 6),
                    kilojoule DECIMAL(12, 4),
                    average_heart_rate INT,
                    max_heart_rate INT,
                    created_at TIMESTAMPTZ,
                    updated_at TIMESTAMPTZ
                );

                CREATE TABLE IF NOT EXISTS whoop_sleep (
                    id VARCHAR(36) PRIMARY KEY,
                    v1_id BIGINT,
                    user_id BIGINT REFERENCES whoop_users(id) ON DELETE CASCADE,
                    cycle_id BIGINT REFERENCES whoop_cycles(id) ON DELETE SET NULL,
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
                    total_no_data_time_milli BIGINT,
                    total_light_sleep_time_milli BIGINT,
                    total_slow_wave_sleep_time_milli BIGINT,
                    total_rem_sleep_time_milli BIGINT,
                    sleep_cycle_count INT,
                    disturbance_count INT,
                    baseline_milli BIGINT,
                    need_from_sleep_debt_milli BIGINT,
                    need_from_recent_strain_milli BIGINT,
                    need_from_recent_nap_milli BIGINT,
                    created_at TIMESTAMPTZ,
                    updated_at TIMESTAMPTZ
                );

                CREATE TABLE IF NOT EXISTS whoop_recovery (
                    cycle_id BIGINT PRIMARY KEY,
                    sleep_id VARCHAR(36) REFERENCES whoop_sleep(id) ON DELETE CASCADE,
                    user_id BIGINT REFERENCES whoop_users(id) ON DELETE CASCADE,
                    score_state TEXT,
                    recovery_score DECIMAL(5, 2),
                    resting_heart_rate DECIMAL(5, 2),
                    hrv_rmssd_milli DECIMAL(8, 4),
                    spo2_percentage DECIMAL(5, 2),
                    skin_temp_celsius DECIMAL(4, 2),
                    created_at TIMESTAMPTZ,
                    updated_at TIMESTAMPTZ
                );

                CREATE TABLE IF NOT EXISTS whoop_workouts (
                    id VARCHAR(36) PRIMARY KEY,
                    v1_id BIGINT,
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
                    zone_five_milli BIGINT,
                    created_at TIMESTAMPTZ,
                    updated_at TIMESTAMPTZ
                );

                CREATE INDEX IF NOT EXISTS idx_whoop_sleep_user_id ON whoop_sleep(user_id);
                CREATE INDEX IF NOT EXISTS idx_whoop_sleep_cycle_id ON whoop_sleep(cycle_id);
                CREATE INDEX IF NOT EXISTS idx_whoop_sleep_v1_id ON whoop_sleep(v1_id);
                CREATE INDEX IF NOT EXISTS idx_whoop_workouts_user_id ON whoop_workouts(user_id);
                CREATE INDEX IF NOT EXISTS idx_whoop_workouts_v1_id ON whoop_workouts(v1_id);
                CREATE INDEX IF NOT EXISTS idx_whoop_cycles_user_id ON whoop_cycles(user_id);
                CREATE INDEX IF NOT EXISTS idx_whoop_recovery_user_id ON whoop_recovery(user_id);

                COMMENT ON TABLE whoop_users IS 'Stores WHOOP user profile information (V2 API)';
                COMMENT ON TABLE whoop_cycles IS 'Stores 24-hour physiological cycle data (V2 API)';
                COMMENT ON TABLE whoop_sleep IS 'Stores sleep activity data with UUID IDs (V2 API)';
                COMMENT ON TABLE whoop_recovery IS 'Stores daily recovery scores and biometric data (V2 API)';
                COMMENT ON TABLE whoop_workouts IS 'Stores workout data with UUID IDs (V2 API)';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                DROP TABLE IF EXISTS whoop_workouts CASCADE;
                DROP TABLE IF EXISTS whoop_recovery CASCADE;
                DROP TABLE IF EXISTS whoop_sleep CASCADE;
                DROP TABLE IF EXISTS whoop_cycles CASCADE;
                DROP TABLE IF EXISTS whoop_users CASCADE;
                """
            )
        )
    )
