// 📂 src/lib/db/rate-limiting.ts
import { Pool } from 'pg';

// Use the same database connection as other parts of the app
const pool = new Pool({ 
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const DAILY_QUESTION_LIMIT = 5;

export interface RateLimitStatus {
  isBlocked: boolean;
  questionsUsed: number;
  questionsRemaining: number;
  resetDate: string;
}

/**
 * Execute a parameterized database query for rate limiting operations
 */
async function executeRateLimitQuery(sql: string, params: any[] = []): Promise<any[]> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('[Rate Limit DB Error]', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Check if an IP address has exceeded their daily question limit
 * @param ipAddress - The client's IP address
 * @returns Rate limit status including whether blocked and remaining questions
 */
export async function checkRateLimit(ipAddress: string): Promise<RateLimitStatus> {
  try {
    // First, try to get existing record for this IP
    const existingRecords = await executeRateLimitQuery(`
      SELECT question_count, last_reset_date 
      FROM question_rate_limits 
      WHERE ip_address = $1
    `, [ipAddress]);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    let questionsUsed = 0;

    if (existingRecords && existingRecords.length > 0) {
      const record = existingRecords[0];
      const lastResetDate = record.last_reset_date;
      
      // Convert database date to YYYY-MM-DD format for comparison
      const lastResetDateStr = lastResetDate instanceof Date 
        ? lastResetDate.toISOString().split('T')[0]
        : new Date(lastResetDate).toISOString().split('T')[0];
      
      // Check if we need to reset the counter for a new day
      if (lastResetDateStr !== today) {
        // Reset counter for new day
        await executeRateLimitQuery(`
          UPDATE question_rate_limits 
          SET question_count = 0, last_reset_date = $1, updated_at = CURRENT_TIMESTAMP
          WHERE ip_address = $2
        `, [today, ipAddress]);
        questionsUsed = 0;
      } else {
        questionsUsed = parseInt(record.question_count) || 0;
      }
    } else {
      // Create new record for this IP
      await executeRateLimitQuery(`
        INSERT INTO question_rate_limits (ip_address, question_count, last_reset_date)
        VALUES ($1, 0, $2)
        ON CONFLICT (ip_address) DO NOTHING
      `, [ipAddress, today]);
      questionsUsed = 0;
    }

    const questionsRemaining = Math.max(0, DAILY_QUESTION_LIMIT - questionsUsed);
    const isBlocked = questionsUsed >= DAILY_QUESTION_LIMIT;

    return {
      isBlocked,
      questionsUsed,
      questionsRemaining,
      resetDate: today,
    };
  } catch (error) {
    console.error('[Rate Limit Check Error]', error);
    // On error, allow the request but log the issue
    return {
      isBlocked: false,
      questionsUsed: 0,
      questionsRemaining: DAILY_QUESTION_LIMIT,
      resetDate: new Date().toISOString().split('T')[0],
    };
  }
}

/**
 * Increment the question count for an IP address
 * @param ipAddress - The client's IP address
 * @returns Updated rate limit status
 */
export async function incrementQuestionCount(ipAddress: string): Promise<RateLimitStatus> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Increment the counter or create new record
    await executeRateLimitQuery(`
      INSERT INTO question_rate_limits (ip_address, question_count, last_reset_date)
      VALUES ($1, 1, $2)
      ON CONFLICT (ip_address) DO UPDATE SET
        question_count = CASE 
          WHEN question_rate_limits.last_reset_date = $2 THEN question_rate_limits.question_count + 1
          ELSE 1
        END,
        last_reset_date = $2,
        updated_at = CURRENT_TIMESTAMP
    `, [ipAddress, today]);

    // Return updated status
    return await checkRateLimit(ipAddress);
  } catch (error) {
    console.error('[Rate Limit Increment Error]', error);
    // On error, return current status without incrementing
    return await checkRateLimit(ipAddress);
  }
}

/**
 * Get the client's IP address from the request
 * @param request - Next.js request object
 * @returns IP address string
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers (for proxies, load balancers, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  if (remoteAddr) {
    return remoteAddr.trim();
  }
  
  // Fallback IP if we can't determine the real IP
  return '127.0.0.1';
}

/**
 * Clean up old rate limit records (optional maintenance function)
 * @param daysToKeep - Number of days of records to keep (default: 7)
 */
export async function cleanupOldRateLimitRecords(daysToKeep: number = 7): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const result = await executeRateLimitQuery(`
      DELETE FROM question_rate_limits 
      WHERE last_reset_date < $1
    `, [cutoffDateStr]);
    
    console.log(`🧹 Cleaned up ${result?.length || 0} old rate limit records`);
  } catch (error) {
    console.error('[Rate Limit Cleanup Error]', error);
  }
}