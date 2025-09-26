-- Add HNSW Index to schema_embeddings
-- September 26, 2025

-- Ensure pgvector extension exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index for faster vector similarity search
-- This significantly improves performVectorSearch query performance
CREATE INDEX IF NOT EXISTS idx_schema_embeddings_hnsw 
ON schema_embeddings 
USING hnsw (embedding vector_cosine_ops);  -- Dimension matches text-embedding-3-small

-- Add helpful comment to the index
COMMENT ON INDEX idx_schema_embeddings_hnsw IS 
'HNSW index for fast approximate nearest neighbor search on schema embeddings. 
Optimized for text-embedding-3-small (1536 dimensions).';