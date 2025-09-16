/**
 * Cross-Platform Activity Correlation ETL
 * 
 * Professional approach to correlating Strava runs with WHOOP workouts
 * Uses multiple matching algorithms with confidence scoring
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface CorrelationCandidate {
  stravaRunId: number;
  whoopWorkoutId: string;
  userId: number;
  timeDiffMinutes: number;
  distanceDiffPercent?: number;
  confidence: number;
  method: string;
}

export class ActivityCorrelationService {
  
  /**
   * Main ETL process - run this daily after data sync
   */
  async processAllUserCorrelations(): Promise<void> {
    console.log('🔄 Starting cross-platform activity correlation ETL...');
    
    const users = await this.getActiveUsers();
    
    for (const userId of users) {
      await this.processUserCorrelations(userId);
    }
    
    console.log('✅ Activity correlation ETL completed');
  }
  
  /**
   * Process correlations for a specific user
   */
  async processUserCorrelations(userId: number): Promise<void> {
    console.log(`Processing correlations for user ${userId}...`);
    
    // Get unprocessed activities from last 30 days
    const candidates = await this.findCorrelationCandidates(userId);
    
    if (candidates.length === 0) {
      console.log(`No new correlation candidates for user ${userId}`);
      return;
    }
    
    // Filter and rank candidates by confidence
    const validCorrelations = candidates.filter(c => c.confidence >= 0.7);
    
    // Insert new correlations
    await this.insertCorrelations(validCorrelations);
    
    console.log(`✅ Processed ${validCorrelations.length} correlations for user ${userId}`);
  }
  
  /**
   * Find correlation candidates using multiple algorithms
   */
  private async findCorrelationCandidates(userId: number): Promise<CorrelationCandidate[]> {
    const query = `
      WITH strava_activities AS (
        SELECT 
          sr.id as strava_run_id,
          sr.start_date,
          sr.distance_meters,
          sr.user_id
        FROM strava_runs sr
        WHERE sr.user_id = $1
          AND sr.start_date >= NOW() - INTERVAL '30 days'
          AND NOT EXISTS (
            SELECT 1 FROM activity_correlations ac 
            WHERE ac.strava_run_id = sr.id
          )
      ),
      whoop_activities AS (
        SELECT 
          ww.id as whoop_workout_id,
          ww.start_time,
          ww.distance_meters,
          ww.sport_name,
          ww.user_id
        FROM whoop_workouts ww
        WHERE ww.user_id = $1
          AND ww.start_time >= NOW() - INTERVAL '30 days'
          AND ww.sport_name ILIKE '%run%'
          AND NOT EXISTS (
            SELECT 1 FROM activity_correlations ac 
            WHERE ac.whoop_workout_id = ww.id
          )
      )
      SELECT 
        sa.strava_run_id,
        wa.whoop_workout_id,
        sa.user_id,
        ABS(EXTRACT(EPOCH FROM (sa.start_date - wa.start_time)) / 60)::INTEGER as time_diff_minutes,
        CASE 
          WHEN sa.distance_meters > 0 AND wa.distance_meters > 0 
          THEN ABS((sa.distance_meters - wa.distance_meters) / sa.distance_meters * 100)
          ELSE NULL 
        END as distance_diff_percent
      FROM strava_activities sa
      CROSS JOIN whoop_activities wa
      WHERE ABS(EXTRACT(EPOCH FROM (sa.start_date - wa.start_time)) / 60) <= 120 -- Within 2 hours
      ORDER BY time_diff_minutes ASC
    `;
    
    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      stravaRunId: row.strava_run_id,
      whoopWorkoutId: row.whoop_workout_id,
      userId: row.user_id,
      timeDiffMinutes: row.time_diff_minutes,
      distanceDiffPercent: row.distance_diff_percent,
      confidence: this.calculateConfidence(row),
      method: this.determineMethod(row)
    }));
  }
  
  /**
   * Calculate confidence score based on multiple factors
   */
  private calculateConfidence(row: any): number {
    let confidence = 0.5; // Base confidence
    
    // Time-based confidence (closer = higher confidence)
    if (row.time_diff_minutes <= 5) {
      confidence += 0.4; // Very close timing
    } else if (row.time_diff_minutes <= 15) {
      confidence += 0.3; // Close timing
    } else if (row.time_diff_minutes <= 60) {
      confidence += 0.2; // Reasonable timing
    } else {
      confidence += 0.1; // Loose timing
    }
    
    // Distance-based confidence (if both have distance)
    if (row.distance_diff_percent !== null) {
      if (row.distance_diff_percent <= 5) {
        confidence += 0.3; // Very close distance
      } else if (row.distance_diff_percent <= 15) {
        confidence += 0.2; // Close distance
      } else if (row.distance_diff_percent <= 30) {
        confidence += 0.1; // Reasonable distance difference
      }
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Determine correlation method used
   */
  private determineMethod(row: any): string {
    if (row.time_diff_minutes <= 15 && row.distance_diff_percent !== null && row.distance_diff_percent <= 10) {
      return 'datetime_distance_match';
    } else if (row.time_diff_minutes <= 15) {
      return 'datetime_match';
    } else if (row.distance_diff_percent !== null && row.distance_diff_percent <= 5) {
      return 'distance_match';
    } else {
      return 'loose_datetime_match';
    }
  }
  
  /**
   * Insert correlation records
   */
  private async insertCorrelations(correlations: CorrelationCandidate[]): Promise<void> {
    if (correlations.length === 0) return;
    
    const values = correlations.map(c => 
      `(${c.userId}, ${c.stravaRunId}, '${c.whoopWorkoutId}', ${c.confidence}, '${c.method}', ${c.timeDiffMinutes}, ${c.distanceDiffPercent || 'NULL'})`
    ).join(',');
    
    const query = `
      INSERT INTO activity_correlations 
      (user_id, strava_run_id, whoop_workout_id, correlation_confidence, correlation_method, time_diff_minutes, distance_diff_percent)
      VALUES ${values}
      ON CONFLICT (strava_run_id, whoop_workout_id) DO UPDATE SET
        correlation_confidence = EXCLUDED.correlation_confidence,
        correlation_method = EXCLUDED.correlation_method,
        updated_at = NOW()
    `;
    
    await pool.query(query);
  }
  
  /**
   * Get users with recent activity on both platforms
   */
  private async getActiveUsers(): Promise<number[]> {
    const query = `
      SELECT DISTINCT wu.id
      FROM whoop_users wu
      WHERE EXISTS (
        SELECT 1 FROM strava_runs sr 
        WHERE sr.user_id = wu.id 
        AND sr.start_date >= NOW() - INTERVAL '30 days'
      )
      AND EXISTS (
        SELECT 1 FROM whoop_workouts ww 
        WHERE ww.user_id = wu.id 
        AND ww.start_time >= NOW() - INTERVAL '30 days'
        AND ww.sport_name ILIKE '%run%'
      )
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.id);
  }
  
  /**
   * Get correlated activities for analysis
   */
  async getCorrelatedActivities(userId: number, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT 
        sr.name as strava_name,
        sr.distance_meters/1000 as strava_km,
        sr.start_date as strava_start,
        ww.sport_name as whoop_sport,
        ww.strain as whoop_strain,
        ww.average_heart_rate,
        ww.distance_meters/1000 as whoop_km,
        ww.start_time as whoop_start,
        ac.correlation_confidence,
        ac.correlation_method,
        ac.time_diff_minutes
      FROM activity_correlations ac
      JOIN strava_runs sr ON ac.strava_run_id = sr.id
      JOIN whoop_workouts ww ON ac.whoop_workout_id = ww.id
      WHERE ac.user_id = $1
      ORDER BY sr.start_date DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }
}

export default ActivityCorrelationService;
