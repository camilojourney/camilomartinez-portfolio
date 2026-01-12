"""Create weekly_habits_summary table for tracking weekly habit patterns

This table stores pre-aggregated weekly summaries to help visualize:
- Meditation consistency
- Workout frequency
- Wake-up time patterns
- Workout timing patterns

Updated each Sunday to reflect the previous week's data.

Revision ID: 0018_weekly_habits_summary
Revises: 0017_drop_legacy_tables
Create Date: 2026-01-12
"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0018_weekly_habits_summary"
down_revision = "0017_drop_legacy_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create weekly_habits_summary table to track habit patterns by week.

    This table aggregates data from whoop_sleep and whoop_workouts to provide
    a clear weekly view of meditation, workouts, and wake-up patterns.
    """
    op.execute(
        sa.text(
            dedent(
                """
                CREATE TABLE IF NOT EXISTS weekly_habits_summary (
                    week_start_date DATE PRIMARY KEY,
                    week_end_date DATE NOT NULL,
                    meditation_count INTEGER DEFAULT 0,
                    workout_count INTEGER DEFAULT 0,
                    avg_wake_hour NUMERIC(4, 2),
                    std_wake_hour NUMERIC(4, 2),
                    avg_workout_hour NUMERIC(4, 2),
                    std_workout_hour NUMERIC(4, 2),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),

                    CONSTRAINT valid_week_range CHECK (week_end_date = week_start_date + INTERVAL '6 days'),
                    CONSTRAINT valid_sunday_start CHECK (EXTRACT(DOW FROM week_start_date) = 0)
                );

                CREATE INDEX IF NOT EXISTS idx_weekly_habits_week_start
                    ON weekly_habits_summary(week_start_date DESC);

                COMMENT ON TABLE weekly_habits_summary IS
                    'Weekly aggregated summary of meditation, workouts, and sleep patterns. Updated every Sunday.';
                COMMENT ON COLUMN weekly_habits_summary.week_start_date IS
                    'Sunday starting the week';
                COMMENT ON COLUMN weekly_habits_summary.week_end_date IS
                    'Saturday ending the week';
                COMMENT ON COLUMN weekly_habits_summary.meditation_count IS
                    'Total meditation sessions during the week';
                COMMENT ON COLUMN weekly_habits_summary.workout_count IS
                    'Number of distinct training days (weightlifting/running/boxing) during the week';
                COMMENT ON COLUMN weekly_habits_summary.avg_wake_hour IS
                    'Average wake-up time as decimal hour in local time (e.g., 7.5 = 7:30 AM)';
                COMMENT ON COLUMN weekly_habits_summary.std_wake_hour IS
                    'Standard deviation of wake-up times in hours (local time)';
                COMMENT ON COLUMN weekly_habits_summary.avg_workout_hour IS
                    'Average workout start time as decimal hour (local time)';
                COMMENT ON COLUMN weekly_habits_summary.std_workout_hour IS
                    'Standard deviation of workout start times in hours (local time)';
                """
            )
        )
    )


def downgrade() -> None:
    """Drop weekly_habits_summary table."""
    op.execute(
        sa.text(
            dedent(
                """
                DROP TABLE IF EXISTS weekly_habits_summary CASCADE;
                """
            )
        )
    )
