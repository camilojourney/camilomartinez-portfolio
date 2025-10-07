"""Create query history table"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0006_create_query_history"
down_revision = "0005_simplify_activity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                CREATE TABLE IF NOT EXISTS query_history (
                    id SERIAL PRIMARY KEY,
                    user_question TEXT NOT NULL,
                    retrieved_context TEXT,
                    generated_sql TEXT,
                    was_successful BOOLEAN,
                    user_feedback SMALLINT,
                    latency_ms INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_query_history_created_at ON query_history(created_at);
                CREATE INDEX IF NOT EXISTS idx_query_history_was_successful ON query_history(was_successful);

                COMMENT ON TABLE query_history IS 'Tracks AI query performance, user feedback, and generates training data for fine-tuning';
                COMMENT ON COLUMN query_history.user_feedback IS '-1 for downvote, 0 for no vote, 1 for upvote';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS query_history CASCADE;"))
