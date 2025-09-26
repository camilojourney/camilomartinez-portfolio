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
 * @param limit - Maximum number of relevant schema descriptions to return (default: 10)
 * @returns A string containing relevant schema descriptions, separated by newlines
 */
export async function performVectorSearch(question: string, limit: number = 10): Promise<string> {
  const client = await pool.connect();
  try {
    // Generate embedding for the question using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    const vector = embeddingResponse.data[0].embedding;

    // Query to find the most similar schema descriptions using vector similarity
    const result = await client.query(
      `SELECT CONCAT('View: ', view_name, ', Column: ', column_name, '. Description: ', description) as context
       FROM schema_embeddings
       ORDER BY embedding <=> $1
       LIMIT $2`,
      [`[${vector.join(',')}]`, limit]
    );

    return result.rows.map(row => row.context).join('\n');
  } catch (error) {
    console.error('Error in performVectorSearch:', error);
    throw new Error('Failed to perform semantic search on schema. Please try again.');
  } finally {
    client.release();
  }
}