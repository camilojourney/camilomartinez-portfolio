"""Refactor to self-improving RAG system with unified embeddings and enhanced query history"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0016_refactor_self_improving_rag"
down_revision = "0015_add_schema_embedding_index"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector;"))

    op.execute(
        sa.text(
            dedent(
                """
                -- ========================================
                -- STEP 1: Create New Unified Embeddings Table
                -- ========================================

                CREATE TABLE IF NOT EXISTS embeddings (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    embedding VECTOR(1536) NOT NULL,
                    embedding_type TEXT NOT NULL CHECK (embedding_type IN ('schema', 'profile', 'learning', 'hyde')),
                    metadata JSONB NOT NULL DEFAULT '{}',
                    confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
                    source_query_id INTEGER,  -- Will add FK constraint after query_history enhancements
                    is_validated BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                COMMENT ON TABLE embeddings IS 'Unified embedding storage for schema, profile, and self-learning contexts';
                COMMENT ON COLUMN embeddings.embedding_type IS 'Discriminator: schema (DB descriptions), profile (Camilo), learning (from failures), hyde (hypothetical documents)';
                COMMENT ON COLUMN embeddings.is_validated IS 'For learning/hyde types: requires human-in-the-loop approval before active use';
                COMMENT ON COLUMN embeddings.source_query_id IS 'References query_history.id for learning/hyde embeddings to track origin';
                COMMENT ON COLUMN embeddings.metadata IS 'Flexible JSONB for type-specific data (table_name, column_name, generation_method, etc.)';

                -- ========================================
                -- STEP 2: Migrate Existing schema_embeddings Data (if table exists)
                -- ========================================

                -- Conditionally migrate data only if schema_embeddings table exists
                DO $$
                BEGIN
                    -- Check if schema_embeddings table exists
                    IF EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'schema_embeddings'
                    ) THEN
                        -- Check if required columns exist (table_name, column_name, description, embedding)
                        IF EXISTS (
                            SELECT FROM information_schema.columns 
                            WHERE table_schema = 'public' 
                            AND table_name = 'schema_embeddings' 
                            AND column_name = 'table_name'
                        ) THEN
                            -- Table exists with expected structure, proceed with migration
                            INSERT INTO embeddings (content, embedding, embedding_type, metadata, is_validated, created_at)
                            SELECT
                                description AS content,
                                embedding,
                                'schema' AS embedding_type,
                                jsonb_build_object(
                                    'table_name', table_name,
                                    'column_name', column_name,
                                    'migrated_from', 'schema_embeddings',
                                    'original_id', id
                                ) AS metadata,
                                TRUE AS is_validated,  -- Existing schema embeddings are pre-validated
                                COALESCE(created_at, NOW()) AS created_at
                            FROM schema_embeddings
                            WHERE embedding IS NOT NULL;  -- Only migrate valid embeddings
                            
                            RAISE NOTICE 'Successfully migrated data from schema_embeddings table';
                        ELSE
                            RAISE NOTICE 'schema_embeddings table exists but missing expected columns - skipping data migration';
                        END IF;
                    ELSE
                        RAISE NOTICE 'schema_embeddings table does not exist - skipping data migration (will generate fresh embeddings)';
                    END IF;
                END $$;

                -- ========================================
                -- STEP 3: Enhance query_history Table
                -- ========================================

                ALTER TABLE query_history
                    ADD COLUMN IF NOT EXISTS failure_type TEXT CHECK (failure_type IN (
                        'MISSING_CONTEXT',
                        'SYNTAX_ERROR',
                        'INCORRECT_LOGIC',
                        'TIMEOUT',
                        'AMBIGUOUS_QUESTION',
                        'PERMISSION_DENIED'
                    )),
                    ADD COLUMN IF NOT EXISTS learned_pattern JSONB,
                    ADD COLUMN IF NOT EXISTS corrective_embeddings INTEGER[],
                    ADD COLUMN IF NOT EXISTS improvement_applied BOOLEAN DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS retrieval_confidence FLOAT CHECK (retrieval_confidence >= 0.0 AND retrieval_confidence <= 1.0),
                    ADD COLUMN IF NOT EXISTS natural_language_response TEXT,
                    ADD COLUMN IF NOT EXISTS execution_result JSONB,
                    ADD COLUMN IF NOT EXISTS tokens_used INTEGER,
                    ADD COLUMN IF NOT EXISTS user_id TEXT,
                    ADD COLUMN IF NOT EXISTS session_id TEXT;

                COMMENT ON COLUMN query_history.failure_type IS 'Granular failure classification for targeted remediation';
                COMMENT ON COLUMN query_history.learned_pattern IS 'Machine-readable JSON: {pattern_type, status (pending_review|approved|rejected|auto_approved), confidence, corrective_action}';
                COMMENT ON COLUMN query_history.corrective_embeddings IS 'Array of embedding IDs created to fix this failure';
                COMMENT ON COLUMN query_history.improvement_applied IS 'Whether self-improving agent has processed this failure';
                COMMENT ON COLUMN query_history.retrieval_confidence IS 'Average cosine similarity of retrieved embeddings (0.0-1.0)';

                -- ========================================
                -- STEP 4: Create Indexes for Performance
                -- ========================================

                -- Embeddings table indexes
                CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw
                    ON embeddings USING hnsw (embedding vector_cosine_ops);
                CREATE INDEX IF NOT EXISTS idx_embeddings_type
                    ON embeddings(embedding_type);
                CREATE INDEX IF NOT EXISTS idx_embeddings_validated
                    ON embeddings(is_validated) WHERE embedding_type IN ('learning', 'hyde');
                CREATE INDEX IF NOT EXISTS idx_embeddings_source
                    ON embeddings(source_query_id) WHERE source_query_id IS NOT NULL;
                CREATE INDEX IF NOT EXISTS idx_embeddings_metadata
                    ON embeddings USING gin(metadata);

                -- Query history indexes
                CREATE INDEX IF NOT EXISTS idx_query_history_created_at
                    ON query_history(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_query_history_failure_type
                    ON query_history(failure_type) WHERE failure_type IS NOT NULL;
                CREATE INDEX IF NOT EXISTS idx_query_history_feedback
                    ON query_history(user_feedback) WHERE user_feedback IS NOT NULL;
                CREATE INDEX IF NOT EXISTS idx_query_history_improvement
                    ON query_history(improvement_applied);
                CREATE INDEX IF NOT EXISTS idx_query_history_learned_pattern
                    ON query_history USING gin(learned_pattern) WHERE learned_pattern IS NOT NULL;
                CREATE INDEX IF NOT EXISTS idx_query_history_user_id
                    ON query_history(user_id) WHERE user_id IS NOT NULL;

                -- ========================================
                -- STEP 5: Add Foreign Key Constraint
                -- ========================================

                ALTER TABLE embeddings
                    ADD CONSTRAINT fk_embeddings_source_query
                    FOREIGN KEY (source_query_id)
                    REFERENCES query_history(id)
                    ON DELETE SET NULL;

                -- ========================================
                -- STEP 6: Drop Old Tables (After Migration)
                -- ========================================

                DROP TABLE IF EXISTS rate_limit_bypasses CASCADE;
                DROP TABLE IF EXISTS question_rate_limits CASCADE;
                DROP TABLE IF EXISTS evaluation_cycles CASCADE;
                DROP TABLE IF EXISTS ai_trainer_evaluations CASCADE;
                DROP TABLE IF EXISTS embedding_documents CASCADE;
                DROP TABLE IF EXISTS schema_embeddings CASCADE;

                -- ========================================
                -- STEP 7: Create Helper Views for Monitoring
                -- ========================================

                -- View: Self-improvement effectiveness metrics
                CREATE OR REPLACE VIEW self_improvement_metrics AS
                SELECT
                    COUNT(*) FILTER (WHERE learned_pattern IS NOT NULL) AS total_patterns_learned,
                    COUNT(*) FILTER (WHERE learned_pattern->>'status' = 'auto_approved') AS auto_approved,
                    COUNT(*) FILTER (WHERE learned_pattern->>'status' = 'pending_review') AS pending_review,
                    COUNT(*) FILTER (WHERE learned_pattern->>'status' = 'approved') AS manually_approved,
                    COUNT(*) FILTER (WHERE learned_pattern->>'status' = 'rejected') AS rejected,
                    COUNT(*) FILTER (WHERE failure_type = 'MISSING_CONTEXT') AS missing_context_failures,
                    COUNT(*) FILTER (WHERE failure_type = 'INCORRECT_LOGIC') AS incorrect_logic_failures,
                    COUNT(*) FILTER (WHERE failure_type = 'SYNTAX_ERROR') AS syntax_errors,
                    ROUND(CAST(AVG((learned_pattern->>'confidence')::FLOAT) * 100 AS NUMERIC), 2) AS avg_pattern_confidence,
                    COUNT(DISTINCT user_id) AS unique_users,
                    DATE_TRUNC('day', created_at) AS date
                FROM query_history
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE_TRUNC('day', created_at)
                ORDER BY date DESC;

                COMMENT ON VIEW self_improvement_metrics IS 'Daily metrics for self-improving RAG system effectiveness';

                -- View: Embedding usage analytics
                CREATE OR REPLACE VIEW embedding_analytics AS
                SELECT
                    embedding_type,
                    COUNT(*) AS total_embeddings,
                    COUNT(*) FILTER (WHERE is_validated = TRUE) AS validated_embeddings,
                    COUNT(*) FILTER (WHERE is_validated = FALSE) AS pending_validation,
                    AVG(confidence_score) FILTER (WHERE confidence_score IS NOT NULL) AS avg_confidence,
                    COUNT(DISTINCT source_query_id) FILTER (WHERE source_query_id IS NOT NULL) AS from_failures,
                    MIN(created_at) AS first_created,
                    MAX(created_at) AS last_created
                FROM embeddings
                GROUP BY embedding_type;

                COMMENT ON VIEW embedding_analytics IS 'Analytics on embedding types, validation status, and sources';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                -- Drop views
                DROP VIEW IF EXISTS self_improvement_metrics CASCADE;
                DROP VIEW IF EXISTS embedding_analytics CASCADE;

                -- Restore old tables (partial - data loss expected)
                CREATE TABLE IF NOT EXISTS schema_embeddings (
                    id SERIAL PRIMARY KEY,
                    table_name TEXT,
                    column_name TEXT,
                    description TEXT NOT NULL,
                    embedding VECTOR(1536) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Migrate schema embeddings back
                INSERT INTO schema_embeddings (table_name, column_name, description, embedding, created_at)
                SELECT
                    metadata->>'table_name',
                    metadata->>'column_name',
                    content,
                    embedding,
                    created_at
                FROM embeddings
                WHERE embedding_type = 'schema';

                -- Remove query_history enhancements
                ALTER TABLE query_history
                    DROP COLUMN IF EXISTS failure_type,
                    DROP COLUMN IF EXISTS learned_pattern,
                    DROP COLUMN IF EXISTS corrective_embeddings,
                    DROP COLUMN IF EXISTS improvement_applied,
                    DROP COLUMN IF EXISTS retrieval_confidence,
                    DROP COLUMN IF EXISTS natural_language_response,
                    DROP COLUMN IF EXISTS execution_result,
                    DROP COLUMN IF EXISTS tokens_used,
                    DROP COLUMN IF EXISTS user_id,
                    DROP COLUMN IF EXISTS session_id;

                -- Drop new embeddings table
                DROP TABLE IF EXISTS embeddings CASCADE;

                -- Recreate old tables (empty - manual restoration needed)
                CREATE TABLE IF NOT EXISTS question_rate_limits (
                    id SERIAL PRIMARY KEY,
                    ip_address INET NOT NULL UNIQUE,
                    question_count INTEGER NOT NULL DEFAULT 0,
                    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

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
                """
            )
        )
    )
