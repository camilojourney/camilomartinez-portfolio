"""Standardize WHOOP schema naming"""

from textwrap import dedent

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0012_schema_standardization"
down_revision = "0011_nullable_sleep_fk"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                ALTER TABLE whoop_workouts RENAME COLUMN distance_meter TO distance_meters;

                ALTER TABLE whoop_workouts ALTER COLUMN average_heart_rate TYPE numeric(5,1);
                ALTER TABLE whoop_workouts ALTER COLUMN max_heart_rate TYPE numeric(5,1);
                ALTER TABLE whoop_cycles ALTER COLUMN average_heart_rate TYPE numeric(5,1);
                ALTER TABLE whoop_cycles ALTER COLUMN max_heart_rate TYPE numeric(5,1);

                ALTER TABLE whoop_recovery RENAME COLUMN resting_heart_rate TO resting_heart_rate_bpm;
                ALTER TABLE whoop_workouts RENAME COLUMN average_heart_rate TO avg_heart_rate_bpm;
                ALTER TABLE whoop_workouts RENAME COLUMN max_heart_rate TO max_heart_rate_bpm;
                ALTER TABLE whoop_cycles RENAME COLUMN average_heart_rate TO avg_heart_rate_bpm;
                ALTER TABLE whoop_cycles RENAME COLUMN max_heart_rate TO max_heart_rate_bpm;

                ALTER TABLE whoop_workouts RENAME COLUMN zone_zero_milli TO hr_zone_0_ms;
                ALTER TABLE whoop_workouts RENAME COLUMN zone_one_milli TO hr_zone_1_ms;
                ALTER TABLE whoop_workouts RENAME COLUMN zone_two_milli TO hr_zone_2_ms;
                ALTER TABLE whoop_workouts RENAME COLUMN zone_three_milli TO hr_zone_3_ms;
                ALTER TABLE whoop_workouts RENAME COLUMN zone_four_milli TO hr_zone_4_ms;
                ALTER TABLE whoop_workouts RENAME COLUMN zone_five_milli TO hr_zone_5_ms;

                ALTER TABLE whoop_sleep RENAME COLUMN nap TO is_nap;
                ALTER TABLE whoop_recovery RENAME COLUMN recovery_score TO recovery_percentage;

                COMMENT ON COLUMN whoop_workouts.distance_meters IS 'Distance covered in meters (standardized with strava_runs)';
                COMMENT ON COLUMN whoop_workouts.avg_heart_rate_bpm IS 'Average heart rate in beats per minute (decimal precision)';
                COMMENT ON COLUMN whoop_workouts.max_heart_rate_bpm IS 'Maximum heart rate in beats per minute (decimal precision)';
                COMMENT ON COLUMN whoop_workouts.hr_zone_0_ms IS 'Time in heart rate zone 0 (50-60% max HR) in milliseconds';
                COMMENT ON COLUMN whoop_workouts.hr_zone_1_ms IS 'Time in heart rate zone 1 (60-70% max HR) in milliseconds';
                COMMENT ON COLUMN whoop_workouts.hr_zone_2_ms IS 'Time in heart rate zone 2 (70-80% max HR) in milliseconds';
                COMMENT ON COLUMN whoop_workouts.hr_zone_3_ms IS 'Time in heart rate zone 3 (80-90% max HR) in milliseconds';
                COMMENT ON COLUMN whoop_workouts.hr_zone_4_ms IS 'Time in heart rate zone 4 (90-95% max HR) in milliseconds';
                COMMENT ON COLUMN whoop_workouts.hr_zone_5_ms IS 'Time in heart rate zone 5 (95-100+ max HR) in milliseconds';
                COMMENT ON COLUMN whoop_recovery.resting_heart_rate_bpm IS 'Resting heart rate in beats per minute (measured during sleep)';
                COMMENT ON COLUMN whoop_recovery.recovery_percentage IS 'Recovery score as percentage 0-100 (renamed from recovery_score for consistency)';
                COMMENT ON COLUMN whoop_sleep.is_nap IS 'Boolean indicating if this is a nap (true) or overnight sleep (false)';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                ALTER TABLE whoop_recovery RENAME COLUMN recovery_percentage TO recovery_score;
                ALTER TABLE whoop_sleep RENAME COLUMN is_nap TO nap;

                ALTER TABLE whoop_workouts RENAME COLUMN hr_zone_0_ms TO zone_zero_milli;
                ALTER TABLE whoop_workouts RENAME COLUMN hr_zone_1_ms TO zone_one_milli;
                ALTER TABLE whoop_workouts RENAME COLUMN hr_zone_2_ms TO zone_two_milli;
                ALTER TABLE whoop_workouts RENAME COLUMN hr_zone_3_ms TO zone_three_milli;
                ALTER TABLE whoop_workouts RENAME COLUMN hr_zone_4_ms TO zone_four_milli;
                ALTER TABLE whoop_workouts RENAME COLUMN hr_zone_5_ms TO zone_five_milli;

                ALTER TABLE whoop_workouts RENAME COLUMN avg_heart_rate_bpm TO average_heart_rate;
                ALTER TABLE whoop_workouts RENAME COLUMN max_heart_rate_bpm TO max_heart_rate;
                ALTER TABLE whoop_cycles RENAME COLUMN avg_heart_rate_bpm TO average_heart_rate;
                ALTER TABLE whoop_cycles RENAME COLUMN max_heart_rate_bpm TO max_heart_rate;
                ALTER TABLE whoop_recovery RENAME COLUMN resting_heart_rate_bpm TO resting_heart_rate;

                ALTER TABLE whoop_workouts ALTER COLUMN average_heart_rate TYPE INTEGER USING ROUND(average_heart_rate);
                ALTER TABLE whoop_workouts ALTER COLUMN max_heart_rate TYPE INTEGER USING ROUND(max_heart_rate);
                ALTER TABLE whoop_cycles ALTER COLUMN average_heart_rate TYPE INTEGER USING ROUND(average_heart_rate);
                ALTER TABLE whoop_cycles ALTER COLUMN max_heart_rate TYPE INTEGER USING ROUND(max_heart_rate);

                ALTER TABLE whoop_workouts RENAME COLUMN distance_meters TO distance_meter;
                """
            )
        )
    )
