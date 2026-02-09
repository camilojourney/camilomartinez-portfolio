import { sql } from '@vercel/postgres';

interface QueryHistoryEntry {
  userQuestion: string;
  retrievedContext?: string;
  generatedSql?: string;
  wasSuccessful: boolean;
  userFeedback?: number;
  latencyMs: number;
  failureDetails?: string;
  userFriendlyAnswer?: string;
}

/**
 * Logs a query execution to the query_history table
 * @param entry The query history entry to log
 * @returns The created record ID
 */
export async function logQueryHistory(entry: QueryHistoryEntry): Promise<number> {
  // Prepare details object with failure information
  const details: any = {};
  
  if (!entry.wasSuccessful) {
    if (!entry.retrievedContext) {
      details.schema_retrieval_failed = true;
      details.failure_stage = 'schema_retrieval';
    }
    if (!entry.generatedSql) {
      details.sql_generation_failed = true;
      details.failure_stage = details.failure_stage || 'sql_generation';
    }
    if (entry.failureDetails) {
      details.error_message = entry.failureDetails;
    }
    details.failure_timestamp = new Date().toISOString();
  }

  const result = await sql`
    INSERT INTO query_history (
      user_question,
      retrieved_context,
      generated_sql,
      was_successful,
      user_feedback,
      latency_ms,
      details,
      user_friendly_answer
    ) VALUES (
      ${entry.userQuestion},
      ${entry.retrievedContext},
      ${entry.generatedSql},
      ${entry.wasSuccessful},
      ${entry.userFeedback ?? 0},
      ${entry.latencyMs},
      ${Object.keys(details).length > 0 ? JSON.stringify(details) : null},
      ${entry.userFriendlyAnswer}
    )
    RETURNING id
  `;

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to insert query_history row (no id returned).');
  }
  return row.id;
}

/**
 * Updates user feedback for a previously logged query execution.
 */
export async function updateQueryFeedback({
  id,
  feedback,
}: {
  id: number;
  feedback: number;
}): Promise<void> {
  const sanitizedFeedback = Math.max(-1, Math.min(1, feedback));
  const result = await sql`
    UPDATE query_history
    SET user_feedback = ${sanitizedFeedback}
    WHERE id = ${id}
  `;

  if (result.rowCount === 0) {
    throw new Error(`No query_history record found for id ${id}`);
  }
}
