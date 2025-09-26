import { sql } from '@vercel/postgres';

interface QueryHistoryEntry {
  userQuestion: string;
  retrievedContext?: string;
  generatedSql?: string;
  wasSuccessful: boolean;
  userFeedback?: number;
  latencyMs: number;
}

/**
 * Logs a query execution to the query_history table
 * @param entry The query history entry to log
 * @returns The created record ID
 */
export async function logQueryHistory(entry: QueryHistoryEntry): Promise<number> {
  const result = await sql`
    INSERT INTO query_history (
      user_question,
      retrieved_context,
      generated_sql,
      was_successful,
      user_feedback,
      latency_ms
    ) VALUES (
      ${entry.userQuestion},
      ${entry.retrievedContext},
      ${entry.generatedSql},
      ${entry.wasSuccessful},
      ${entry.userFeedback ?? 0},
      ${entry.latencyMs}
    )
    RETURNING id
  `;

  return result.rows[0].id;
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
