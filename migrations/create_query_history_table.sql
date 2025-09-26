-- Create query_history table for tracking AI agent performance
CREATE TABLE query_history (
    id SERIAL PRIMARY KEY,
    user_question TEXT NOT NULL,
    retrieved_context TEXT, -- Log the context the RAG step found
    generated_sql TEXT,
    was_successful BOOLEAN,
    user_feedback SMALLINT, -- e.g., -1 for downvote, 0 for no vote, 1 for upvote
    latency_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_query_history_created_at ON query_history(created_at);
CREATE INDEX idx_query_history_was_successful ON query_history(was_successful);

-- Add comment to explain the table's purpose
COMMENT ON TABLE query_history IS 'Tracks AI query performance, user feedback, and generates training data for fine-tuning';
COMMENT ON COLUMN query_history.user_feedback IS '-1 for downvote, 0 for no vote, 1 for upvote';