import { OpenAI } from 'openai';
import { Pool } from 'pg';

const openai = new OpenAI();
const pool = new Pool({ 
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Performs a vector similarity search against schema embeddings.
 * Uses OpenAI's text-embedding-3-small model for embedding generation
 * and PostgreSQL's vector similarity search for retrieval.
 * 
 * @param question - The natural language question to find relevant schema context for
 * @param limit - Maximum number of relevant schema descriptions to return (default: 12)
 * @returns A string containing relevant schema descriptions, separated by newlines
 */
export async function performVectorSearch(question: string, limit: number = 12): Promise<string> {
  const client = await pool.connect();
  try {
    console.log(`[Vector Search] Generating embedding for question: "${question.substring(0, 50)}..."`);
    
    // Generate embedding for the question using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    
    if (!embeddingResponse?.data?.[0]?.embedding) {
      throw new Error('OpenAI embedding API returned invalid response');
    }
    
    const vector = embeddingResponse.data[0].embedding;
    console.log(`[Vector Search] Generated embedding with ${vector.length} dimensions`);

    // Query to find the most similar schema descriptions using vector similarity
    const result = await client.query(
      `SELECT CONCAT('View: ', view_name, ', Column: ', column_name, '. Description: ', description) as context
       FROM schema_embeddings
       ORDER BY embedding <=> $1
       LIMIT $2`,
      [`[${vector.join(',')}]`, limit]
    );

    console.log(`[Vector Search] Found ${result.rows.length} schema matches for question`);
    
    if (result.rows.length === 0) {
      throw new Error('No schema embeddings found. The schema_embeddings table may be empty or the vector similarity search failed.');
    }

    const contexts: string[] = [];
    const contextSet = new Set<string>();

    for (const row of result.rows) {
      if (!contextSet.has(row.context)) {
        contexts.push(row.context);
        contextSet.add(row.context);
      }
    }

    // If the question implies a temporal ordering, make sure we surface date/time columns
    const lowerQuestion = question.toLowerCase();
    const temporalKeywords = [
      'recent',
      'latest',
      'today',
      'yesterday',
      'last',
      'current',
      'newest',
      'trend',
      'over time',
      'past',
      'this week',
      'this month',
      'this year',
      'day',
      'week',
      'month',
      'year',
      'days',
      'weeks',
      'months',
      'years',
      'daily',
      'weekly',
      'monthly',
      'yearly',
      'previous',
      'prior',
      'quarter',
      'q1',
      'q2',
      'q3',
      'q4',
      'ytd',
      'year-to-date',
      'jan', 'january',
      'feb', 'february',
      'mar', 'march',
      'apr', 'april',
      'may',
      'jun', 'june',
      'jul', 'july',
      'aug', 'august',
      'sep', 'sept', 'september',
      'oct', 'october',
      'nov', 'november',
      'dec', 'december'
    ];
    const needsTemporalContext = temporalKeywords.some(keyword => lowerQuestion.includes(keyword));

    const viewNames = new Set<string>();

    for (const context of contexts) {
      const match = context.match(/View:\s*([^,]+)/i);
      if (match) {
        viewNames.add(match[1].trim());
      }
    }

    const alwaysIncludeTemporalColumns: Record<string, string[]> = {
      daily_fitness_snapshot: ['snapshot_date'],
    };

    const fetchTemporalColumns = async (viewName: string, limitHint: number = 3) => {
      const temporalResult = await client.query(
        `SELECT CONCAT('View: ', view_name, ', Column: ', column_name, '. Description: ', description) AS context
         FROM schema_embeddings
         WHERE view_name = $1
           AND column_name <> $1
           AND (
             column_name ILIKE '%date%' OR
             column_name ILIKE '%time%' OR
             column_name ILIKE '%day%' OR
             column_name ILIKE '%week%' OR
             column_name ILIKE '%month%' OR
             column_name ILIKE '%year%' OR
             column_name ILIKE '%start%' OR
             column_name ILIKE '%end%' OR
             description ILIKE '%date%' OR
             description ILIKE '%recent%' OR
             description ILIKE '%time%'
           )
         ORDER BY 
           CASE 
             WHEN column_name ILIKE '%snapshot_date%' THEN 0
             WHEN column_name ILIKE '%date%' THEN 1
             WHEN column_name ILIKE '%time%' THEN 2
             WHEN column_name ILIKE '%start%' THEN 3
             ELSE 4
           END,
           column_name
         LIMIT $2`,
        [viewName, limitHint]
      );

      for (const temporalRow of temporalResult.rows) {
        if (!contextSet.has(temporalRow.context)) {
          contexts.push(temporalRow.context);
          contextSet.add(temporalRow.context);
        }
      }
    };

    if (needsTemporalContext) {
      for (const viewName of viewNames) {
        try {
          await fetchTemporalColumns(viewName);
        } catch (temporalError) {
          console.warn('[Vector Search] Failed to enrich temporal context for view:', viewName, temporalError);
        }
      }
    }

    for (const [viewName, preferredColumns] of Object.entries(alwaysIncludeTemporalColumns)) {
      if (!viewNames.has(viewName)) continue;
      for (const columnName of preferredColumns) {
        try {
          const explicitColumn = await client.query(
            `SELECT CONCAT('View: ', view_name, ', Column: ', column_name, '. Description: ', description) AS context
             FROM schema_embeddings
             WHERE view_name = $1 AND column_name = $2
             LIMIT 1`,
            [viewName, columnName]
          );

          for (const explicitRow of explicitColumn.rows) {
            if (!contextSet.has(explicitRow.context)) {
              contexts.push(explicitRow.context);
              contextSet.add(explicitRow.context);
            }
          }
        } catch (preferredError) {
          console.warn('[Vector Search] Failed to include preferred temporal column:', `${viewName}.${columnName}`, preferredError);
        }
      }
    }

    const contextString = contexts.join('\n');

    if (!contextString || contextString.trim().length === 0) {
      throw new Error('Schema embeddings returned empty context. This indicates malformed data in schema_embeddings table.');
    }
    
    return contextString;
  } catch (error) {
    console.error('Error in performVectorSearch:', error);
    throw new Error('Failed to perform semantic search on schema. Please try again.');
  } finally {
    client.release();
  }
}
