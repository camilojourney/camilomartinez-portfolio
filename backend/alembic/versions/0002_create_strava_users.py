"""Create strava_users table"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0002_create_strava_users"
down_revision = "0001_initial_whoop_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                CREATE TABLE IF NOT EXISTS strava_users (
                    id BIGINT PRIMARY KEY,
                    email VARCHAR(255),
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    username VARCHAR(100),
                    city VARCHAR(100),
                    state VARCHAR(100),
                    country VARCHAR(100),
                    sex VARCHAR(1),
                    profile_picture_url TEXT,
                    access_token TEXT,
                    refresh_token TEXT,
                    token_expires_at TIMESTAMP WITH TIME ZONE,
                    scopes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_strava_users_email ON strava_users(email);
                CREATE INDEX IF NOT EXISTS idx_strava_users_refresh_token ON strava_users(refresh_token) WHERE refresh_token IS NOT NULL;
                CREATE INDEX IF NOT EXISTS idx_strava_users_token_expires ON strava_users(token_expires_at);

                COMMENT ON TABLE strava_users IS 'Stores Strava user authentication data and profile information for Astoria Conquest integration';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS strava_users CASCADE;"))
