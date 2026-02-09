"""Add AI trainer evaluation tables"""

from textwrap import dedent

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0008_add_ai_trainer_tables"
down_revision = "0007_question_rate_limits"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                CREATE TABLE IF NOT EXISTS evaluation_cycles (
                    id SERIAL PRIMARY KEY,
                    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    end_time TIMESTAMP WITH TIME ZONE,
                    total_questions INTEGER DEFAULT 0,
                    success_count INTEGER DEFAULT 0,
                    success_rate NUMERIC(5, 2) DEFAULT 0.00,
                    failure_analysis TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                ALTER TABLE query_history
                    ADD COLUMN IF NOT EXISTS cycle_id INTEGER REFERENCES evaluation_cycles(id);

                CREATE INDEX IF NOT EXISTS idx_query_history_cycle_id ON query_history(cycle_id);
                CREATE INDEX IF NOT EXISTS idx_evaluation_cycles_start_time ON evaluation_cycles(start_time);

                CREATE OR REPLACE VIEW evaluation_cycle_summary AS
                SELECT
                    id,
                    start_time,
                    end_time,
                    total_questions,
                    success_count,
                    success_rate,
                    CASE
                        WHEN end_time IS NULL THEN 'running'
                        WHEN success_rate >= 95 THEN 'excellent'
                        WHEN success_rate >= 80 THEN 'good'
                        WHEN success_rate >= 60 THEN 'needs_improvement'
                        ELSE 'critical'
                    END AS status,
                    EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time)) AS duration_seconds,
                    DATE_TRUNC('day', start_time) AS cycle_date,
                    failure_analysis IS NOT NULL AND LENGTH(failure_analysis) > 0 AS has_analysis
                FROM evaluation_cycles
                ORDER BY start_time DESC;
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP VIEW IF EXISTS evaluation_cycle_summary;"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_query_history_cycle_id;"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_evaluation_cycles_start_time;"))
    op.execute(sa.text("ALTER TABLE query_history DROP COLUMN IF EXISTS cycle_id;"))
    op.execute(sa.text("DROP TABLE IF EXISTS evaluation_cycles CASCADE;"))
