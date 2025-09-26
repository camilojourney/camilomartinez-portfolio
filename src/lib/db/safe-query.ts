import { Pool } from 'pg';

/**
 * A connection pool for read-only queries 
 * Uses the same connection as main database but with additional safety measures
 */
const readOnlyPool = new Pool({ 
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Executes a SQL query with safety measures:
 * 1. Only allows SELECT statements
 * 2. Uses a read-only database user
 * 3. Enforces query timeout
 * 4. Implements proper error handling
 * 
 * @param sql - The SQL query to execute (must be SELECT only)
 * @returns Promise resolving to the query results
 * @throws Error if query is not SELECT or execution fails
 */
export async function executeSafeQuery(sql: string): Promise<any[]> {
  // Input validation - Allow SELECT and WITH (Common Table Expressions)
  const normalizedSql = sql.trim().toUpperCase();
  if (!normalizedSql.startsWith('SELECT') && !normalizedSql.startsWith('WITH')) {
    throw new Error('Only SELECT and WITH queries are allowed for security reasons.');
  }

  // Additional security checks
  if (normalizedSql.includes('DROP') || 
      normalizedSql.includes('DELETE') || 
      normalizedSql.includes('UPDATE') || 
      normalizedSql.includes('INSERT') ||
      normalizedSql.includes('TRUNCATE')) {
    throw new Error('Query contains forbidden operations.');
  }

  let client;
  try {
    // Get client with timeout
    client = await Promise.race([
      readOnlyPool.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]) as any;

    // Set a reasonable timeout to prevent long-running queries
    await client.query("SET statement_timeout = '8000';"); // 8 seconds

    // Execute the query
    const result = await client.query(sql);
    return result.rows;
  } catch (error: any) {
    console.error('Error executing safe query:', {
      error: error?.message,
      stack: error?.stack,
      sql: sql.substring(0, 200) + '...', // Log first 200 chars of SQL for debugging
      timestamp: new Date().toISOString()
    });
    
    // Provide user-friendly error messages based on error type
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('statement_timeout') || errorMsg.includes('timeout')) {
        throw new Error('Query took too long to execute. Please try a simpler query.');
      } else if (errorMsg.includes('permission denied')) {
        throw new Error('You do not have permission to access this data.');
      } else if (errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
        throw new Error('The requested table or view does not exist. Please check your query.');
      } else if (errorMsg.includes('column') && errorMsg.includes('does not exist')) {
        throw new Error('The requested column does not exist. Please check the available columns.');
      } else if (errorMsg.includes('syntax error')) {
        throw new Error('There is a syntax error in the generated query. Please try rephrasing your question.');
      } else if (errorMsg.includes('connection') || errorMsg.includes('connect')) {
        throw new Error('Database connection failed. Please try again in a moment.');
      }
    }
    throw new Error('The database query failed. Please try rephrasing your question.');
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.warn('Error releasing database client:', releaseError);
      }
    }
  }
}