// 📂 scripts/db/run-migration.js

import { sql } from '@vercel/postgres';
import fs from 'fs';

async function runMigration() {
  console.log('🚀 Running WHOOP V2 Database Migration...\n');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('/Users/camilo/camilomartinez-portfolio/migrations/database-schema-v2.sql', 'utf8');
    
    console.log('📖 Reading migration file...');
    console.log('File length:', migrationSQL.length, 'characters');
    
    // Split into individual statements and execute them
    const statements = migrationSQL
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 10); // Filter out very short statements
    
    console.log('Found', statements.length, 'SQL statements to execute\n');
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.length > 0 && !stmt.startsWith('--')) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        console.log('Statement preview:', stmt.substring(0, 80).replace(/\s+/g, ' ') + '...');
        
        try {
          const result = await sql.query(stmt);
          console.log('✅ Success\n');
        } catch (error) {
          console.log('⚠️ Error:', error.message, '\n');
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Migration execution completed!');
    
    // Verify table creation
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'whoop_%'
      ORDER BY table_name;
    `;
    
    console.log('\n📊 Created WHOOP tables:');
    tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // Check columns for whoop_sleep to verify new fields
    const sleepColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'whoop_sleep' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n🛏️ whoop_sleep columns (showing enhanced schema):');
    sleepColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  }
}

runMigration();
