#!/usr/bin/env node

/**
 * Migration Runner: Create Activity Correlations Table
 * This creates the junction table for cross-platform activity correlations
 */

import { sql } from '../../src/lib/db/db.ts';

async function createActivityCorrelationsTable() {
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
          
          -- Foreign key constraints
          CONSTRAINT fk_correlation_user FOREIGN KEY (user_id) REFERENCES whoop_users(id) ON DELETE CASCADE,
          CONSTRAINT fk_correlation_strava FOREIGN KEY (strava_run_id) REFERENCES strava_runs(id) ON DELETE CASCADE,
          CONSTRAINT fk_correlation_whoop FOREIGN KEY (whoop_workout_id) REFERENCES whoop_workouts(id) ON DELETE CASCADE,
          
          -- Unique constraint to prevent duplicate correlations
          CONSTRAINT uk_activity_correlation UNIQUE (strava_run_id, whoop_workout_id)
      )
    `;
    
    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_correlations_user_date ON activity_correlations (user_id, created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_correlations_strava ON activity_correlations (strava_run_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_correlations_whoop ON activity_correlations (whoop_workout_id)`;
    
    // Add comments for documentation
    await sql`COMMENT ON TABLE activity_correlations IS 'Cross-platform correlations between Strava runs and WHOOP workouts'`;
    await sql`COMMENT ON COLUMN activity_correlations.correlation_confidence IS 'Confidence score 0.0-1.0 for relationship accuracy'`;
    await sql`COMMENT ON COLUMN activity_correlations.correlation_method IS 'Algorithm used: datetime_match, distance_match, manual'`;
    await sql`COMMENT ON COLUMN activity_correlations.time_diff_minutes IS 'Start time difference in minutes (positive = WHOOP later)'`;
    await sql`COMMENT ON COLUMN activity_correlations.distance_diff_percent IS 'Distance difference as percentage (positive = WHOOP longer)'`;
    
    console.log('✅ activity_correlations table created successfully');
    
    // Check if table was created properly
    const result = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'activity_correlations' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await createActivityCorrelationsTable();
    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
