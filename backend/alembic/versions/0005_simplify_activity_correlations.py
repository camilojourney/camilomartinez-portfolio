"""Simplify activity correlations table"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0005_simplify_activity_correlations"
down_revision = "0004_extend_strava_runs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                DROP TABLE IF EXISTS activity_correlations;

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
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS activity_correlations;"))
