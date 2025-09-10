// Run Strava migrations (both users and runs tables)
const fs = require('fs');

// Load environment variables using dotenv
require('dotenv').config();

// Fallback: manual env loading if dotenv fails
if (!process.env.POSTGRES_URL) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('='); // Handle values with = in them
          value = value.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.error('Failed to load .env file:', error.message);
  }
}

const { sql } = require('@vercel/postgres');

async function runStravaMigrations() {
  try {
    console.log('🚀 Running Strava database migrations...\n');
    
    // 1. Create strava_users table
    console.log('📝 Creating strava_users table...');
    const usersMigrationSQL = fs.readFileSync('migrations/create_strava_users_table.sql', 'utf8');
    await sql.query(usersMigrationSQL);
    console.log('✅ strava_users table created successfully!');
    
    // 2. Create strava_runs table
    console.log('\n📝 Creating strava_runs table...');
    const runsMigrationSQL = fs.readFileSync('migrations/create_strava_runs_table.sql', 'utf8');
    await sql.query(runsMigrationSQL);
    console.log('✅ strava_runs table created successfully!');
    
    // 3. Verify both tables were created
    console.log('\n🔍 Verifying table structures...\n');
    
    // Check strava_users table
    const usersResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'strava_users' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 strava_users table structure:');
    usersResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });
    
    // Check strava_runs table
    const runsResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'strava_runs' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 strava_runs table structure:');
    runsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });
    
    // 4. Check foreign key relationship
    const fkResult = await sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'strava_runs'
    `;
    
    console.log('\n🔗 Foreign key relationships:');
    if (fkResult.rows.length > 0) {
      fkResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    } else {
      console.log('  - No foreign keys found (this might be expected for some databases)');
    }
    
    // 5. Check indexes
    const indexResult = await sql`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE tablename IN ('strava_users', 'strava_runs')
      ORDER BY tablename, indexname
    `;
    
    console.log('\n📊 Created indexes:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.indexname}`);
    });
    
    console.log('\n🎉 All Strava migrations completed successfully!');
    console.log('\n🔄 Next steps:');
    console.log('  1. Set up Strava OAuth in your application');
    console.log('  2. Create API endpoints for Strava authentication');
    console.log('  3. Import running activities from Strava API');
    console.log('  4. Implement GPS coordinate matching for Astoria Conquest');
    
  } catch (error) {
    console.error('❌ Error running Strava migrations:', error);
    process.exit(1);
  }
}

runStravaMigrations();
