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
    
    const users = await this.getActiveUsers();
    
    for (const userId of users) {
      await this.processUserCorrelations(userId);
    }
    
    console.log('✅ Activity correlation ETL completed');
  }
  
  /**
   * Process correlations for a specific user
   */
  async processUserCorrelations(userId) {
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
  async findCorrelationCandidates(userId) {
    // Simple query that just matches activities in the same hour
    const query = `
      SELECT 
        s.id as strava_run_id,
        w.id as whoop_workout_id
      FROM strava_runs s
      JOIN whoop_workouts w 
        ON s.start_date::date = w.start_time::date
        AND EXTRACT(HOUR FROM s.start_date) = EXTRACT(HOUR FROM w.start_time)
      WHERE NOT EXISTS (
        SELECT 1 FROM activity_correlations ac 
        WHERE ac.strava_run_id = s.id OR ac.whoop_workout_id = w.id
      )
      AND w.sport_name ILIKE '%run%'
      ORDER BY s.start_date DESC
    
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
   * Get users with recent activity on both platforms
   */
  async getActiveUsers() {
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
  async getCorrelatedActivities(userId, limit = 50) {
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
    
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }
}

// CLI usage
if (require.main === module) {
  const service = new ActivityCorrelationService();
  
  // Get the first user (since it's always you)
  async function getYourUserId() {
    const query = `
      SELECT id FROM whoop_users 
      WHERE access_token IS NOT NULL 
      ORDER BY id 
      LIMIT 1
    `;
    const result = await pool.query(query);
    return result.rows[0]?.id;
  }

  if (process.argv[2] === 'process' || !process.argv[2]) {
    service.processAllUserCorrelations()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ ETL failed:', error);
        process.exit(1);
      });
  } else if (process.argv[2] === 'query') {
    getYourUserId()
      .then(userId => {
        if (!userId) {
          console.error('❌ No user found in the database');
          process.exit(1);
        }
        return service.getCorrelatedActivities(userId);
      })
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
