-- Update query_history table to support AI Trainer evaluation cycles
-- September 26, 2025

-- Add details column for AI Trainer system (cycle_id already exists)
ALTER TABLE query_history 
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- Drop existing foreign key constraint if it exists
ALTER TABLE query_history 
DROP CONSTRAINT IF EXISTS query_history_cycle_id_fkey;

-- Update cycle_id column to match evaluation_cycles.id type (UUID) and allow NULL
ALTER TABLE query_history 
ALTER COLUMN cycle_id DROP NOT NULL,
ALTER COLUMN cycle_id TYPE UUID USING (
  CASE 
    WHEN cycle_id IS NULL THEN NULL
    ELSE cycle_id::text::uuid
  END
);

-- Add foreign key constraint back to evaluation_cycles table
ALTER TABLE query_history 
ADD CONSTRAINT query_history_cycle_id_fkey 
FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id) ON DELETE SET NULL;

-- Add index for cycle queries (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_query_history_cycle_id ON query_history(cycle_id);

-- Add comments for columns
COMMENT ON COLUMN query_history.details IS 'Additional metadata about the query execution (error details, response format, etc.)';
COMMENT ON COLUMN query_history.cycle_id IS 'References evaluation_cycles.id when query was part of an automated evaluation';