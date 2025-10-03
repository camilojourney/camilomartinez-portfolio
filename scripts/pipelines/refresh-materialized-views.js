#!/usr/bin/env node
/**
 * Script to refresh materialized views after data ingestion
 * This should be run after both Strava and WHOOP data have been synced
 */

const { Pool } = require('pg');
require('dotenv').config();

async function refreshMaterializedViews() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });

  // First, ensure views exist by running the creation script if needed
  console.log('Ensuring materialized views exist...');
  const fs = require('fs');
  const path = require('path');
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '../../migrations/create_materialized_views_sept_2025.sql'),
    'utf8'
  );

  try {
    // Create views if they don't exist
    await pool.query(migrationSQL);
    
    // Refresh all materialized views
    console.log('Refreshing materialized views...');
    await pool.query(`
      REFRESH MATERIALIZED VIEW daily_fitness_snapshot;
      REFRESH MATERIALIZED VIEW run_performance_details;
      REFRESH MATERIALIZED VIEW boxing_performance_details;
      REFRESH MATERIALIZED VIEW weightlifting_performance_details;
    `);
    console.log('Successfully refreshed all materialized views');
  } catch (error) {
    console.error('Error creating/refreshing materialized views:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  refreshMaterializedViews()
    .then(() => {
      console.log('View refresh complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('View refresh failed:', error);
      process.exit(1);
    });
}

module.exports = { refreshMaterializedViews };