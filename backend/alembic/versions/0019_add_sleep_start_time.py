"""add sleep start time tracking

Revision ID: 0019_sleep_start_time
Revises: 0018_weekly_habits_summary
Create Date: 2026-01-12

"""
import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0019_sleep_start_time"
down_revision = "0018_weekly_habits_summary"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add sleep start time columns to weekly_habits_summary"""
    op.add_column(
        "weekly_habits_summary",
        sa.Column(
            "avg_sleep_start_hour",
            sa.Numeric(precision=5, scale=2),
            nullable=True,
            comment="Average sleep start hour (decimal, e.g., 0.5 = 12:30 AM)",
        ),
    )
    op.add_column(
        "weekly_habits_summary",
        sa.Column(
            "std_sleep_start_hour",
            sa.Numeric(precision=5, scale=2),
            nullable=True,
            comment="Standard deviation of sleep start hour",
        ),
    )


def downgrade() -> None:
    """Remove sleep start time columns"""
    op.drop_column("weekly_habits_summary", "std_sleep_start_hour")
    op.drop_column("weekly_habits_summary", "avg_sleep_start_hour")
