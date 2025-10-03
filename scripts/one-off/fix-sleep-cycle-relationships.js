#!/usr/bin/env node
/**
 * Script to fix sleep-cycle relationships in WHOOP data
 */

const { Pool } = require('pg');
require('dotenv').config();

async function fixSleepCycleRelationships() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Analyzing sleep-cycle relationships...');

    // First, check all sleep records without cycle_id that should have one
    const missingCyclesQuery = `
      WITH sleep_cycle_candidates AS (
        SELECT 
          ws.id as sleep_id,
          ws.user_id,
          ws.start_time::date as sleep_date,
          wc.id as potential_cycle_id
        FROM whoop_sleep ws
        JOIN whoop_cycles wc ON 
          ws.user_id = wc.user_id AND
          ws.start_time::date = wc.start_time::date
        WHERE ws.cycle_id IS NULL
          AND ws.is_nap = false  -- Only fix main sleep sessions
      )
      SELECT * FROM sleep_cycle_candidates;
    `;

    console.log('Finding sleep records without cycles...');
    const missingCycles = await pool.query(missingCyclesQuery);
    console.log(`Found ${missingCycles.rows.length} sleep records that need cycle IDs`);

    if (missingCycles.rows.length > 0) {
      // Update sleep records with their corresponding cycle IDs
      const updateQuery = `
        WITH sleep_cycle_matches AS (
          SELECT 
            ws.id as sleep_id,
            wc.id as cycle_id
          FROM whoop_sleep ws
          JOIN whoop_cycles wc ON 
            ws.user_id = wc.user_id AND
            ws.start_time::date = wc.start_time::date
          WHERE ws.cycle_id IS NULL
            AND ws.is_nap = false
        )
        UPDATE whoop_sleep ws
        SET cycle_id = scm.cycle_id
        FROM sleep_cycle_matches scm
        WHERE ws.id = scm.sleep_id
        RETURNING ws.id, ws.start_time::date as date, ws.cycle_id;
      `;

      console.log('Updating sleep-cycle relationships...');
      const updateResult = await pool.query(updateQuery);
      console.log(`Updated ${updateResult.rows.length} sleep records with cycle IDs`);
      console.log('Updated records:', updateResult.rows);

      // Verify the materialized view
      console.log('Refreshing materialized views...');
      await pool.query('SELECT refresh_materialized_views()');
      console.log('Materialized views refreshed');
    }

    // Verify the fixes
    const verificationQuery = `
      SELECT 
        DATE_TRUNC('day', ws.start_time)::date as date,
        COUNT(*) FILTER (WHERE ws.cycle_id IS NOT NULL) as linked_sleeps,
        COUNT(*) FILTER (WHERE ws.cycle_id IS NULL) as unlinked_sleeps
      FROM whoop_sleep ws
      WHERE ws.is_nap = false
        AND ws.start_time >= NOW() - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date DESC;
    `;

    console.log('\nVerifying sleep-cycle relationships for the last 30 days:');
    const verificationResult = await pool.query(verificationQuery);
    console.log('Verification results:');
    console.table(verificationResult.rows);

  } catch (error) {
    console.error('Error fixing sleep-cycle relationships:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixSleepCycleRelationships()
    .then(() => {
      console.log('Sleep-cycle relationship fix complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}