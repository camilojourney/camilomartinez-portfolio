"""Standardize *_milli columns to *_ms"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0013_standardize_milli_suffix"
down_revision = "0012_schema_standardization"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                ALTER TABLE whoop_sleep RENAME COLUMN total_in_bed_time_milli TO total_in_bed_time_ms;
                ALTER TABLE whoop_sleep RENAME COLUMN total_awake_time_milli TO total_awake_time_ms;
                ALTER TABLE whoop_sleep RENAME COLUMN total_no_data_time_milli TO total_no_data_time_ms;
                ALTER TABLE whoop_sleep RENAME COLUMN total_light_sleep_time_milli TO total_light_sleep_time_ms;
                ALTER TABLE whoop_sleep RENAME COLUMN total_slow_wave_sleep_time_milli TO total_slow_wave_sleep_time_ms;
                ALTER TABLE whoop_sleep RENAME COLUMN total_rem_sleep_time_milli TO total_rem_sleep_time_ms;
                ALTER TABLE whoop_sleep RENAME COLUMN baseline_milli TO baseline_ms;
                ALTER TABLE whoop_sleep RENAME COLUMN need_from_sleep_debt_milli TO need_from_sleep_debt_ms;
                ALTER TABLE whoop_sleep RENAME COLUMN need_from_recent_strain_milli TO need_from_recent_strain_ms;
                ALTER TABLE whoop_sleep RENAME COLUMN need_from_recent_nap_milli TO need_from_recent_nap_ms;

                ALTER TABLE whoop_recovery RENAME COLUMN hrv_rmssd_milli TO hrv_rmssd_ms;

                COMMENT ON COLUMN whoop_sleep.total_in_bed_time_ms IS 'Total time in bed in milliseconds';
                COMMENT ON COLUMN whoop_sleep.total_awake_time_ms IS 'Time awake during sleep period in milliseconds';
                COMMENT ON COLUMN whoop_sleep.total_no_data_time_ms IS 'Time with no data during sleep period in milliseconds';
                COMMENT ON COLUMN whoop_sleep.total_light_sleep_time_ms IS 'Light sleep duration in milliseconds';
                COMMENT ON COLUMN whoop_sleep.total_slow_wave_sleep_time_ms IS 'Deep sleep duration in milliseconds';
                COMMENT ON COLUMN whoop_sleep.total_rem_sleep_time_ms IS 'REM sleep duration in milliseconds';
                COMMENT ON COLUMN whoop_sleep.baseline_ms IS 'Baseline sleep need in milliseconds';
                COMMENT ON COLUMN whoop_sleep.need_from_sleep_debt_ms IS 'Additional sleep needed from debt in milliseconds';
                COMMENT ON COLUMN whoop_sleep.need_from_recent_strain_ms IS 'Additional sleep needed from recent strain in milliseconds';
                COMMENT ON COLUMN whoop_sleep.need_from_recent_nap_ms IS 'Sleep need offset from recent naps in milliseconds';
                COMMENT ON COLUMN whoop_recovery.hrv_rmssd_ms IS 'Heart rate variability (RMSSD) in milliseconds';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                ALTER TABLE whoop_recovery RENAME COLUMN hrv_rmssd_ms TO hrv_rmssd_milli;

                ALTER TABLE whoop_sleep RENAME COLUMN need_from_recent_nap_ms TO need_from_recent_nap_milli;
                ALTER TABLE whoop_sleep RENAME COLUMN need_from_recent_strain_ms TO need_from_recent_strain_milli;
                ALTER TABLE whoop_sleep RENAME COLUMN need_from_sleep_debt_ms TO need_from_sleep_debt_milli;
                ALTER TABLE whoop_sleep RENAME COLUMN baseline_ms TO baseline_milli;
                ALTER TABLE whoop_sleep RENAME COLUMN total_rem_sleep_time_ms TO total_rem_sleep_time_milli;
                ALTER TABLE whoop_sleep RENAME COLUMN total_slow_wave_sleep_time_ms TO total_slow_wave_sleep_time_milli;
                ALTER TABLE whoop_sleep RENAME COLUMN total_light_sleep_time_ms TO total_light_sleep_time_milli;
                ALTER TABLE whoop_sleep RENAME COLUMN total_no_data_time_ms TO total_no_data_time_milli;
                ALTER TABLE whoop_sleep RENAME COLUMN total_awake_time_ms TO total_awake_time_milli;
                ALTER TABLE whoop_sleep RENAME COLUMN total_in_bed_time_ms TO total_in_bed_time_milli;
                """
            )
        )
    )
