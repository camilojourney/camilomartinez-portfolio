// 📂 scripts/db/run-migration.js
// Simple script to run an SQL migration file using Node

const fs = require('fs');
const postgres = require('@vercel/postgres');
require('dotenv').config({ path: '.env' });

async function runMigration(filePath) {
  console.log(`🔄 Running migration: ${filePath}`);
  
  // Read SQL file
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Create SQL client
  const { sql: db } = postgres;
  
  try {
    // Run the migration in a transaction
    await db`BEGIN`;
    
    console.log('💾 Executing SQL...');
    // Split the SQL file into separate statements
    const statements = sql
      .replace(/\r\n/g, '\n')
      .split(';')
      .filter(statement => statement.trim().length > 0);
    
    for (const statement of statements) {
      await db.query(statement);
      console.log('  ✓ Executed statement');
    }
    
    await db`COMMIT`;
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    await db`ROLLBACK`;
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Get file path from command line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Please provide a migration file path');
  console.log('Usage: node scripts/db/run-migration.js migrations/your-migration.sql');
  process.exit(1);
}

runMigration(filePath).catch(console.error);