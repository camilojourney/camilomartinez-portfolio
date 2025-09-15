// 📂 scripts/db/run-recovery-cycles-migration.js

import dotenv from 'dotenv';
dotenv.config();

import { sql } from '../../src/lib/db/db.ts';
import fs from 'fs';

async function runRecoveryCyclesMigration() {
  console.log('🚀 Running Recovery-Cycles Relationship Migration...\n');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('/Users/camilo/camilomartinez-portfolio/migrations/add_recovery_cycles_relationship.sql', 'utf8');
    
    console.log('📖 Reading migration file...');
    console.log('File length:', migrationSQL.length, 'characters');
    
    // Execute the migration SQL
    console.log('🔧 Executing recovery → cycles relationship migration...');
    
    try {
      const result = await sql.query(migrationSQL);
      console.log('✅ Migration executed successfully!\n');
    } catch (error) {
      console.log('⚠️ Error:', error.message, '\n');
      throw error;
    }
    
    // Verify the changes
    console.log('🔍 Verifying migration results...\n');
    
    // Check if foreign key constraint exists
    const constraints = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'whoop_recovery' 
      AND constraint_name = 'fk_whoop_recovery_cycle_id';
    `;
    
    console.log('🔗 Foreign key constraints:');
    if (constraints.rows.length > 0) {
      constraints.rows.forEach(constraint => {
        console.log(`  ✅ ${constraint.constraint_name} (${constraint.constraint_type})`);
      });
    } else {
      console.log('  ❌ No foreign key constraint found');
    }
    
    // Verify data integrity
    const dataCheck = await sql`
      SELECT 
        COUNT(*) as total_recovery,
        COUNT(DISTINCT cycle_id) as unique_cycles_referenced
      FROM whoop_recovery;
    `;
    
    console.log('\n📈 Data verification:');
    if (dataCheck.rows.length > 0) {
      const data = dataCheck.rows[0];
      console.log(`  📊 Total recovery records: ${data.total_recovery}`);
      console.log(`  🔗 Unique cycles referenced: ${data.unique_cycles_referenced}`);
    }
    
    console.log('\n✅ Recovery → Cycles relationship migration completed successfully!');
    console.log('🎯 This constraint ensures that recovery records always reference valid cycles,');
    console.log('   which is critical for the updateSleepCycleRelationships() method.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runRecoveryCyclesMigration();
