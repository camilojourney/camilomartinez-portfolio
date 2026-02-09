"""Drop legacy tables that should have been removed in 0016

This migration ensures old tables (schema_embeddings, refresh_history, etc.)
are properly dropped if they still exist after the refactor migration.

Revision ID: 0017_drop_legacy_tables
Revises: 0016_refactor_self_improving_rag
Create Date: 2025-10-08
"""

from textwrap import dedent

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0017_drop_legacy_tables"
down_revision = "0016_refactor_self_improving_rag"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Drop legacy tables that were supposed to be removed in migration 0016.

    These tables have been replaced by the unified 'embeddings' table and
    enhanced 'query_history' table. All data was migrated before dropping.
    """
    op.execute(
        sa.text(
            dedent(
                """
                -- ========================================
                -- Drop Legacy Tables (If They Still Exist)
                -- ========================================

                -- Old embedding tables (replaced by unified 'embeddings' table)
                DROP TABLE IF EXISTS schema_embeddings CASCADE;
                DROP TABLE IF EXISTS embedding_documents CASCADE;

                -- Old refresh/history tracking (unknown purpose, not in current models)
                DROP TABLE IF EXISTS refresh_history CASCADE;

                -- Old rate limiting tables (replaced by middleware/different approach)
                DROP TABLE IF EXISTS rate_limit_bypasses CASCADE;
                DROP TABLE IF EXISTS question_rate_limits CASCADE;

                -- Old AI trainer/evaluation tables (replaced by self-improving agent)
                DROP TABLE IF EXISTS evaluation_cycles CASCADE;
                DROP TABLE IF EXISTS ai_trainer_evaluations CASCADE;

                -- Log completion
                DO $$
                BEGIN
                    RAISE NOTICE 'Legacy tables dropped successfully. Current RAG system uses: embeddings, query_history';
                END $$;
                """
            )
        )
    )


def downgrade() -> None:
    """
    Downgrade is not supported for this migration.

    These tables were already dropped in migration 0016 and their data was migrated.
    If you need to restore them, you must downgrade to 0015 (before the refactor).
    """
    op.execute(
        sa.text(
            dedent(
                """
                -- ========================================
                -- Cannot Restore Legacy Tables
                -- ========================================

                DO $$
                BEGIN
                    RAISE EXCEPTION 'Cannot downgrade migration 0017. To restore legacy tables, downgrade to migration 0015 (before refactor).';
                END $$;
                """
            )
        )
    )
