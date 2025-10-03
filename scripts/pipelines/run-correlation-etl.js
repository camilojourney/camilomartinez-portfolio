#!/usr/bin/env node

/**
 * Simple runner for the Activity Correlation ETL
 * Usage: node run-correlation-etl.js [process|query <userId>|create-table]
 */

import { sql } from '../../src/lib/db/db.ts';

class SimpleCorrelationETL {
  
  async createTable() {
    console.log('🔄 Creating activity_correlations table...');
    
    try {
      // Create the main table
      await sql`
        CREATE TABLE IF NOT EXISTS activity_correlations (
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL,
            strava_run_id BIGINT NOT NULL,
            whoop_workout_id VARCHAR(36) NOT NULL,
            correlation_confidence DECIMAL(3,2) DEFAULT 0.85,
            correlation_method VARCHAR(50) DEFAULT 'datetime_match',
            time_diff_minutes INTEGER,
            distance_diff_percent DECIMAL(5,2),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            -- Unique constraint to prevent duplicate correlations
            CONSTRAINT uk_activity_correlation UNIQUE (strava_run_id, whoop_workout_id)
        )
      `;
      
      console.log('✅ activity_correlations table created successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Error creating table:', error.message);
      throw error;
    }
  }
  
  async processCorrelations() {
    console.log('🔄 Starting cross-platform activity correlation...');
    
    const insertQuery = `
      INSERT INTO activity_correlations (
        user_id, 
        strava_run_id, 
        whoop_workout_id, 
        correlation_confidence, 
        correlation_method, 
        time_diff_minutes,
        distance_diff_percent
      )
      SELECT 
        s.user_id,
        s.id as strava_run_id,
        w.id as whoop_workout_id,
        CASE 
          WHEN time_diff <= 5 THEN 0.95
          WHEN time_diff <= 15 THEN 0.85
          WHEN time_diff <= 60 THEN 0.75
          ELSE 0.65
        END as correlation_confidence,
        CASE 
          WHEN time_diff <= 15 AND distance_diff <= 10 THEN 'datetime_distance_match'
          WHEN time_diff <= 15 THEN 'datetime_match'
          ELSE 'loose_datetime_match'
        END as correlation_method,
        time_diff as time_diff_minutes,
        distance_diff as distance_diff_percent
      FROM (
        SELECT 
          s.*,
          w.*,
          ABS(EXTRACT(EPOCH FROM (s.start_date - w.start_time)) / 60) as time_diff,
          CASE 
            WHEN s.distance_meters > 0 AND w.distance_meters > 0 
            THEN ABS((s.distance_meters - w.distance_meters) / s.distance_meters * 100)
            ELSE NULL 
          END as distance_diff
        FROM strava_runs s
        CROSS JOIN whoop_workouts w
        WHERE s.user_id = w.user_id
          AND s.start_date >= NOW() - INTERVAL '90 days'
          AND w.start_time >= NOW() - INTERVAL '90 days'
          AND w.sport_name ILIKE '%run%'
          AND ABS(EXTRACT(EPOCH FROM (s.start_date - w.start_time)) / 60) <= 120
          AND NOT EXISTS (
            SELECT 1 FROM activity_correlations ac 
            WHERE ac.strava_run_id = s.id 
            OR ac.whoop_workout_id = w.id
          )
      ) matches
      WHERE time_diff <= 120
      ON CONFLICT (strava_run_id, whoop_workout_id) DO NOTHING
    `;
    
    try {
      const result = await sql.query(insertQuery);
      console.log(`✅ Processed ${result.rowCount} new activity correlations`);
      return result.rowCount;
    } catch (error) {
      console.error('❌ Error processing correlations:', error.message);
      throw error;
    }
  }
  
  async queryCorrelations(userId) {
    const result = await sql`
      SELECT 
        sr.name as strava_name,
        sr.distance_meters/1000 as strava_km,
        TO_CHAR(sr.start_date, 'YYYY-MM-DD HH24:MI') as strava_start,
        ww.sport_name as whoop_sport,
        ww.strain as whoop_strain,
        ww.average_heart_rate,
        COALESCE(ww.distance_meters/1000, 0) as whoop_km,
        TO_CHAR(ww.start_time, 'YYYY-MM-DD HH24:MI') as whoop_start,
        ROUND(ac.correlation_confidence::numeric, 2) as confidence,
        ac.correlation_method as method,
        ac.time_diff_minutes as time_diff_min
      FROM activity_correlations ac
      JOIN strava_runs sr ON ac.strava_run_id = sr.id
      JOIN whoop_workouts ww ON ac.whoop_workout_id = ww.id
      WHERE ac.user_id = ${userId}
      ORDER BY sr.start_date DESC
      LIMIT 20
    `;
    
    return result.rows;
  }
  
  async getStats() {
    const result = await sql`
      SELECT 
        COUNT(*) as total_correlations,
        AVG(correlation_confidence) as avg_confidence,
        COUNT(DISTINCT user_id) as users_with_correlations,
        correlation_method,
        COUNT(*) as method_count
      FROM activity_correlations
      GROUP BY correlation_method
      ORDER BY method_count DESC
    `;
    
    return result.rows;
  }
}

// CLI Usage
async function main() {
  const etl = new SimpleCorrelationETL();
  
  try {
    if (process.argv[2] === 'create-table') {
      await etl.createTable();
      
    } else if (process.argv[2] === 'process') {
      await etl.processCorrelations();
      
    } else if (process.argv[2] === 'query' && process.argv[3]) {
      const userId = parseInt(process.argv[3]);
      const activities = await etl.queryCorrelations(userId);
      
      console.log('📊 Correlated Activities:');
      console.table(activities);
      
    } else if (process.argv[2] === 'stats') {
      const stats = await etl.getStats();
      console.log('📈 Correlation Statistics:');
      console.table(stats);
      
    } else {
      console.log('🏃‍♂️ Cross-Platform Activity Correlation ETL');
      console.log('');
      console.log('Usage:');
      console.log('  node run-correlation-etl.mjs create-table     # Create the correlations table');
      console.log('  node run-correlation-etl.mjs process          # Process new correlations');
      console.log('  node run-correlation-etl.mjs query <userId>   # Query correlations for user');
      console.log('  node run-correlation-etl.mjs stats            # Show correlation statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node run-correlation-etl.mjs create-table');
      console.log('  node run-correlation-etl.mjs process');
      console.log('  node run-correlation-etl.mjs query 123');
      console.log('  node run-correlation-etl.mjs stats');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
