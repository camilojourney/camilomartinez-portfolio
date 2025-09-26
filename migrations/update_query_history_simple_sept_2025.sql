-- Update query_history table to support AI Trainer evaluation cycles (simple version)
-- September 26, 2025

-- Add details column for AI Trainer system
ALTER TABLE query_history 
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- Clear existing cycle_id values and drop foreign key first
UPDATE query_history SET cycle_id = NULL WHERE cycle_id IS NOT NULL;

-- Drop existing foreign key constraint if it exists
ALTER TABLE query_history 
DROP CONSTRAINT IF EXISTS query_history_cycle_id_fkey;

-- Now safely update the column type to UUID
ALTER TABLE query_history 
ALTER COLUMN cycle_id TYPE UUID USING NULL;

-- Add comments for columns
COMMENT ON COLUMN query_history.details IS 'Additional metadata about the query execution (error details, response format, etc.)';
COMMENT ON COLUMN query_history.cycle_id IS 'References evaluation_cycles.id when query was part of an automated evaluation';