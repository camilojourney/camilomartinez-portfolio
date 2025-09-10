// Check whoop_users table schema
const fs = require('fs');

// Load environment variables from .env
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key] = value.replace(/"/g, '');
  }
});

const { sql } = require('@vercel/postgres');

async function checkWhoopUsersSchema() {
  try {
    console.log('📋 Checking whoop_users table structure...\n');
    
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'whoop_users' 
      ORDER BY ordinal_position
    `;
    
    console.log('Current whoop_users table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWhoopUsersSchema();
