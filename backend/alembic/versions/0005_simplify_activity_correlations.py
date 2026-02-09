"""Simplify activity correlations table"""


import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0005_simplify_activity"
down_revision = "0004_extend_strava_runs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Skip this migration - tables are already in the correct state
    pass


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS activity_correlations;"))
