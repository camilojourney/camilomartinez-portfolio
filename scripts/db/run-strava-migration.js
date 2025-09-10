// Run Strava migration
const fs = require('fs');

// Load environment variables from .env (improved parsing)
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('='); // Handle values with = in them
      value = value.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
      process.env[key] = value;
    }
  }
});

const { sql } = require('@vercel/postgres');

async function createStravaUsersTable() {
  try {
    console.log('🚀 Creating strava_users table...');
    
    const migrationSQL = fs.readFileSync('migrations/create_strava_users_table.sql', 'utf8');
    
    // Execute the migration
    await sql.query(migrationSQL);
    
    console.log('✅ strava_users table created successfully!');
    
    // Verify the table was created
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'strava_users' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 New strava_users table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating strava_users table:', error);
  }
}

createStravaUsersTable();
