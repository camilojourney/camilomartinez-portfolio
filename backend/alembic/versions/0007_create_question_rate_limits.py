"""Create question rate limits table"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0007_create_question_rate_limits"
down_revision = "0006_create_query_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                CREATE TABLE IF NOT EXISTS question_rate_limits (
                    id SERIAL PRIMARY KEY,
                    ip_address INET NOT NULL UNIQUE,
                    question_count INTEGER NOT NULL DEFAULT 0,
                    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_question_rate_limits_ip ON question_rate_limits(ip_address);
                CREATE INDEX IF NOT EXISTS idx_question_rate_limits_reset_date ON question_rate_limits(last_reset_date);

                COMMENT ON TABLE question_rate_limits IS 'Tracks daily question limits per IP address to prevent API abuse';
                COMMENT ON COLUMN question_rate_limits.ip_address IS 'Client IP address (IPv4 or IPv6)';
                COMMENT ON COLUMN question_rate_limits.question_count IS 'Number of questions asked today';
                COMMENT ON COLUMN question_rate_limits.last_reset_date IS 'Date when the counter was last reset (daily reset)';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS question_rate_limits;"))
