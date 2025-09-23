#!/usr/bin/env node

/**
 * Enable PostGIS extension for spatial/geographic data functions
 * Required for st_point() and other spatial functions used in Strava sync
 */

const { Pool } = require('pg');

async function enablePostGIS() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const client = await pool.connect();

  try {
    console.log('🗺️ Enabling PostGIS extension...');
    
    // Enable PostGIS extension
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✅ PostGIS extension enabled successfully');

    // Verify it's working
    const result = await client.query('SELECT PostGIS_Version();');
    console.log(`📍 PostGIS Version: ${result.rows[0].postgis_version}`);

    // Test st_point function
    const testPoint = await client.query('SELECT ST_Point(-73.935242, 40.730610) as test_point;');
    console.log('✅ ST_Point function is working correctly');

  } catch (error) {
    console.error('❌ Error enabling PostGIS:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.log(`
🔧 Fix: Your database user needs SUPERUSER privileges to install extensions.

If using Neon/Supabase, try running this SQL directly in their web console:
   CREATE EXTENSION IF NOT EXISTS postgis;

Or contact your database provider to enable PostGIS.
      `);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

enablePostGIS().catch(console.error);