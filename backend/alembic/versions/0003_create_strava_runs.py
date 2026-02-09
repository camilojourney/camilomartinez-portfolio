"""Create strava_runs table"""

from textwrap import dedent

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0003_create_strava_runs"
down_revision = "0002_create_strava_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                CREATE TABLE IF NOT EXISTS strava_runs (
                    id BIGINT PRIMARY KEY,
                    user_id BIGINT REFERENCES strava_users(id),
                    name VARCHAR(255),
                    sport_type VARCHAR(50),
                    start_date TIMESTAMP WITH TIME ZONE,
                    distance_meters DOUBLE PRECISION,
                    summary_polyline TEXT,
                    detailed_polyline TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_strava_runs_user_id ON strava_runs(user_id);
                CREATE INDEX IF NOT EXISTS idx_strava_runs_date ON strava_runs(start_date);
                CREATE INDEX IF NOT EXISTS idx_strava_runs_sport_type ON strava_runs(sport_type);
                CREATE INDEX IF NOT EXISTS idx_strava_runs_user_date ON strava_runs(user_id, start_date);

                COMMENT ON TABLE strava_runs IS 'Stores individual Strava activities for Astoria Conquest street coverage tracking';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS strava_runs CASCADE;"))
