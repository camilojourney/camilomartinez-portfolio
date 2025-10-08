-- Cleanup script for old RAG system tables
-- Run this to remove zombie tables that should have been dropped in migration 0016

-- These tables were replaced by the unified 'embeddings' table
-- All data was migrated before dropping, so this is safe

BEGIN;

-- Check what we're about to drop
SELECT 'Checking tables to drop...' as status;

SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('schema_embeddings', 'refresh_history', 'rate_limit_bypasses', 
                     'question_rate_limits', 'evaluation_cycles', 'ai_trainer_evaluations', 
                     'embedding_documents')
ORDER BY table_name;

-- Drop the old tables (if they exist)
DROP TABLE IF EXISTS refresh_history CASCADE;
DROP TABLE IF EXISTS schema_embeddings CASCADE;
DROP TABLE IF EXISTS rate_limit_bypasses CASCADE;
DROP TABLE IF EXISTS question_rate_limits CASCADE;
DROP TABLE IF EXISTS evaluation_cycles CASCADE;
DROP TABLE IF EXISTS ai_trainer_evaluations CASCADE;
DROP TABLE IF EXISTS embedding_documents CASCADE;

SELECT 'Old tables dropped successfully!' as status;

-- Verify current tables
SELECT 'Current tables:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('embeddings', 'query_history')
ORDER BY table_name;

COMMIT;

-- To run this script:
-- psql -U camilo -d portfolio -f scripts/cleanup_old_tables.sql
