import { Pool } from 'pg';

/**
 * A separate connection pool for read-only queries with reduced privileges
 * IMPORTANT: Use a read-only user for this connection string in your .env file
 */
const readOnlyPool = new Pool({ connectionString: process.env.POSTGRES_READONLY_URL });

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
  // Input validation
  const normalizedSql = sql.trim().toUpperCase();
  if (!normalizedSql.startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed for security reasons.');
  }

  // Additional security checks
  if (normalizedSql.includes('DROP') || 
      normalizedSql.includes('DELETE') || 
      normalizedSql.includes('UPDATE') || 
      normalizedSql.includes('INSERT') ||
      normalizedSql.includes('TRUNCATE')) {
    throw new Error('Query contains forbidden operations.');
  }

  const client = await readOnlyPool.connect();
  try {
    // Set a reasonable timeout to prevent long-running queries
    await client.query("SET statement_timeout = '8000';"); // 8 seconds

    // Execute the query
    const result = await client.query(sql);
    return result.rows;
  } catch (error: any) {
    console.error('Error executing safe query:', error);
    
    // Provide user-friendly error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('statement_timeout')) {
        throw new Error('Query took too long to execute. Please try a simpler query.');
      } else if (error.message.includes('permission denied')) {
        throw new Error('You do not have permission to access this data.');
      }
    }
    throw new Error('The database query failed. Please try rephrasing your question.');
  } finally {
    client.release();
  }
}