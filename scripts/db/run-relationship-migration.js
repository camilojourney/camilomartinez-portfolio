// 📂 scripts/db/run-relationship-migration.js

import dotenv from 'dotenv';
dotenv.config();

import { sql } from '../../src/lib/db/db.ts';
import fs from 'fs';

async function runRelationshipMigration() {
  console.log('🚀 Running WHOOP Sleep-Workouts Relationship Migration...\n');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('/Users/camilo/camilomartinez-portfolio/migrations/add_relationship_whoop_sleep_workouts.sql', 'utf8');
    
    console.log('📖 Reading migration file...');
    console.log('File length:', migrationSQL.length, 'characters');
    
    // Execute the migration SQL directly since it uses DO blocks
    console.log('🔧 Executing relationship migration...');
    
    try {
      const result = await sql.query(migrationSQL);
      console.log('✅ Migration executed successfully!\n');
    } catch (error) {
      console.log('⚠️ Error:', error.message, '\n');
      throw error;
    }
    
    // Verify the changes
    console.log('🔍 Verifying migration results...\n');
    
    // Check if v1_id column exists in whoop_sleep
    const sleepColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'whoop_sleep' 
      AND column_name IN ('v1_id', 'activity_v1_id')
      ORDER BY column_name;
    `;
    
    console.log('📊 whoop_sleep v1_id related columns:');
    if (sleepColumns.rows.length > 0) {
      sleepColumns.rows.forEach(col => {
        console.log(`  ✅ ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('  ❌ No v1_id or activity_v1_id columns found');
    }
    
    // Check if foreign key constraint exists
    const constraints = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'whoop_sleep' 
      AND constraint_name = 'fk_whoop_sleep_v1_id';
    `;
    
    console.log('\n🔗 Foreign key constraints:');
    if (constraints.rows.length > 0) {
      constraints.rows.forEach(constraint => {
        console.log(`  ✅ ${constraint.constraint_name} (${constraint.constraint_type})`);
      });
    } else {
      console.log('  ❌ No foreign key constraint found');
    }
    
    // Check sample data
    const sampleData = await sql`
      SELECT COUNT(*) as total_sleep_records,
             COUNT(v1_id) as records_with_v1_id
      FROM whoop_sleep;
    `;
    
    console.log('\n📈 Data verification:');
    if (sampleData.rows.length > 0) {
      const data = sampleData.rows[0];
      console.log(`  📊 Total sleep records: ${data.total_sleep_records}`);
      console.log(`  🔗 Records with v1_id: ${data.records_with_v1_id}`);
    }
    
    console.log('\n✅ Relationship migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runRelationshipMigration();
