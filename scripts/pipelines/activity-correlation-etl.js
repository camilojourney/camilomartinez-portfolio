/**
 * Cross-Platform Activity Correlation ETL
 * 
 * Professional approach to correlating Strava runs with WHOOP workouts
 * Uses multiple matching algorithms with confidence scoring
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * @typedef {Object} CorrelationCandidate
 * @property {number} stravaRunId
 * @property {string} whoopWorkoutId
 * @property {number} userId
 * @property {number} timeDiffMinutes
 * @property {number} [distanceDiffPercent]
 * @property {number} confidence
 * @property {string} method
 */

class ActivityCorrelationService {
  
  /**
   * Main ETL process - run this daily after data sync
   */
  async processAllUserCorrelations() {
    console.log('🔄 Starting cross-platform activity correlation ETL...');

    // Get unprocessed activities
    const candidates = await this.findCorrelationCandidates();

    if (candidates.length === 0) {
      console.log('✅ No new correlation candidates found');
      return;
    }

    console.log(`📊 Found ${candidates.length} potential correlations`);

    // Filter and rank candidates by confidence
    const validCorrelations = candidates.filter(c => c.confidence >= 0.7);
    console.log(`✅ ${validCorrelations.length} correlations passed confidence threshold (>= 0.7)`);

    // Insert new correlations
    await this.insertCorrelations(validCorrelations);

    console.log('✅ Activity correlation ETL completed');
  }
  
  /**
   * Find correlation candidates using multiple algorithms
   */
  async findCorrelationCandidates(userId = null) {
    // Match activities within 10 minutes of each other
    // NOTE: Not filtering by user_id since Strava and WHOOP have different user IDs
    const query = `
      SELECT
        s.id as strava_run_id,
        w.id as whoop_workout_id,
        s.user_id as strava_user_id,
        w.user_id as whoop_user_id,
        EXTRACT(EPOCH FROM (w.start_time - s.start_date)) / 60 as time_diff_minutes,
        s.distance_meters as strava_distance,
        w.distance_meters as whoop_distance,
        CASE
          WHEN s.distance_meters > 0 AND w.distance_meters > 0
          THEN ABS(s.distance_meters - w.distance_meters) * 100.0 / s.distance_meters
          ELSE NULL
        END as distance_diff_percent
      FROM strava_runs s
      JOIN whoop_workouts w
        ON w.start_time BETWEEN (s.start_date - INTERVAL '10 minutes') AND (s.start_date + INTERVAL '10 minutes')
      WHERE NOT EXISTS (
        SELECT 1 FROM activity_correlations ac
        WHERE ac.strava_run_id = s.id OR ac.whoop_workout_id = w.id
      )
      AND w.sport_name = 'running'
      ORDER BY s.start_date DESC
    `;

    const result = await pool.query(query);

    return result.rows.map(row => ({
      stravaRunId: row.strava_run_id,
      whoopWorkoutId: row.whoop_workout_id,
      userId: row.strava_user_id,
      timeDiffMinutes: row.time_diff_minutes,
      distanceDiffPercent: row.distance_diff_percent,
      confidence: this.calculateConfidence(row),
      method: this.determineMethod(row)
    }));
  }
  
  /**
   * Calculate confidence score based on multiple factors
   */
  calculateConfidence(row) {
    let confidence = 0.8; // High base confidence since we match exact hour
    
    // Distance-based confidence (if both have distance)
    if (row.distance_diff_percent !== null) {
      if (row.distance_diff_percent <= 5) {
        confidence += 0.2; // Very close distance
      } else if (row.distance_diff_percent <= 15) {
        confidence += 0.1; // Close distance
      } else if (row.distance_diff_percent > 30) {
        confidence -= 0.1; // Distance differs significantly
      }
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Determine correlation method used
   */
  determineMethod(row) {
    if (row.distance_diff_percent !== null && row.distance_diff_percent <= 10) {
      return 'exact_hour_distance_match';
    } else {
      return 'exact_hour_match';
    }
  }
  
  /**
   * Insert correlation records
   */
  async insertCorrelations(correlations) {
    if (correlations.length === 0) return;
    
    // Just insert the IDs - that's all we need!
    for (const correlation of correlations) {
      await pool.query(`
        INSERT INTO activity_correlations 
        (strava_run_id, whoop_workout_id)
        VALUES ($1, $2)
        ON CONFLICT (strava_run_id, whoop_workout_id) DO NOTHING
      `, [correlation.stravaRunId, correlation.whoopWorkoutId]);
    }
    
    console.log(`✅ Matched ${correlations.length} activities`);
  }
  
  /**
   * Get correlated activities for analysis
   */
  async getCorrelatedActivities(limit = 50) {
    console.log('\n🔍 Checking matched activities...');

    // Just get the basic info about matches
    const query = `
      SELECT
        sr.name as strava_name,
        sr.start_date as strava_start,
        ww.sport_name as whoop_sport,
        ww.start_time as whoop_start
      FROM activity_correlations ac
      JOIN strava_runs sr ON ac.strava_run_id = sr.id
      JOIN whoop_workouts ww ON ac.whoop_workout_id = ww.id
      ORDER BY sr.start_date DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

// CLI usage
if (require.main === module) {
  const service = new ActivityCorrelationService();

  if (process.argv[2] === 'process' || !process.argv[2]) {
    service.processAllUserCorrelations()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ ETL failed:', error);
        process.exit(1);
      });
  } else if (process.argv[2] === 'query') {
    service.getCorrelatedActivities()
      .then(activities => {
        console.log('\n📊 Your Correlated Activities:');
        console.table(activities);
        console.log(`\n✨ Total Activities: ${activities.length}`);
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Query failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  node activity-correlation-etl.js           # Process correlations (default)');
    console.log('  node activity-correlation-etl.js process   # Same as above');
    console.log('  node activity-correlation-etl.js query     # Show your correlated activities');
  }
}

module.exports = ActivityCorrelationService;
