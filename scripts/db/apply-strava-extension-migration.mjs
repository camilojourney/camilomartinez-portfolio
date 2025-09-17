#!/usr/bin/env node

/**
 * Apply Strava runs table extension migration
 * Adds performance metrics, timing data, location info, and child tables
 */

import { sql } from '../../src/lib/db/db.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyStravaExtensionMigration() {
    console.log('🔄 Starting Strava runs table extension migration...');
    
    try {
        // Read the migration SQL file
        const migrationPath = join(__dirname, '../..', 'migrations', 'extend_strava_runs_sept_2025.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        console.log('📋 Applying Strava runs extension...');
        
        // Execute the migration
        await sql.unsafe(migrationSQL);
        
        console.log('✅ Strava runs extension migration completed successfully!');
        
        // Verify the changes
        console.log('🔍 Verifying new columns...');
        const columns = await sql`
            SELECT column_name, data_type, is_generated 
            FROM information_schema.columns 
            WHERE table_name = 'strava_runs'
            AND column_name IN (
                'elapsed_time_seconds', 'moving_time_seconds', 'timezone', 'utc_offset_seconds',
                'average_speed_mps', 'max_speed_mps', 'average_cadence', 'average_watts',
                'weighted_average_watts', 'max_watts', 'kilojoules', 'calories',
                'city', 'state', 'country', 'run_miles'
            )
            ORDER BY column_name;
        `;
        
        console.log('📊 New columns added:');
        columns.forEach(col => {
            const generated = col.is_generated === 'ALWAYS' ? ' (GENERATED)' : '';
            console.log(`  ✅ ${col.column_name}: ${col.data_type}${generated}`);
        });
        
        // Check new tables
        console.log('🔍 Verifying new tables...');
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('strava_segment_efforts', 'strava_laps')
            ORDER BY table_name;
        `;
        
        console.log('📋 New tables created:');
        tables.forEach(table => {
            console.log(`  ✅ ${table.table_name}`);
        });
        
        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration
applyStravaExtensionMigration()
    .then(() => {
        console.log('✅ Strava extension migration complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
