// Check database schema and test data insertion
// Load environment variables manually
const fs = require('fs');
const os = require('os');
const envPath = process.env.CAMILO_ENV_PATH || `${os.homedir()}/.config/secrets/camilomartinez-portfolio-local.env`;
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key] = value.replace(/"/g, '');
    }
});

const { sql } = require('@vercel/postgres');

async function checkDatabaseSchema() {
    try {
        console.log('🔍 Checking database schema...\n');
        
        // Check if tables exist
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%whoop%' OR table_name LIKE '%cycle%' OR table_name LIKE '%sleep%' OR table_name LIKE '%recovery%' OR table_name LIKE '%workout%'
            ORDER BY table_name
        `;
        
        console.log('📋 Available tables:');
        tables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        if (tables.rows.length === 0) {
            console.log('❌ No WHOOP-related tables found!');
            return;
        }
        
        // Check recent data in each table
        console.log('\n📊 Recent data in tables:');
        
        for (const table of tables.rows) {
            try {
                let countResult;
                if (table.table_name === 'whoop_users') {
                    countResult = await sql`SELECT COUNT(*) as count FROM whoop_users`;
                } else if (table.table_name === 'whoop_cycles') {
                    countResult = await sql`SELECT COUNT(*) as count FROM whoop_cycles`;
                } else if (table.table_name === 'whoop_sleep') {
                    countResult = await sql`SELECT COUNT(*) as count FROM whoop_sleep`;
                } else if (table.table_name === 'whoop_recovery') {
                    countResult = await sql`SELECT COUNT(*) as count FROM whoop_recovery`;
                } else if (table.table_name === 'whoop_workouts') {
                    countResult = await sql`SELECT COUNT(*) as count FROM whoop_workouts`;
                } else {
                    console.log(`  ${table.table_name}: Skipping unknown table`);
                    continue;
                }
                
                const count = countResult.rows[0].count;
                
                if (count > 0) {
                    // Get the most recent record
                    let recentResult;
                    if (table.table_name === 'whoop_users') {
                        recentResult = await sql`SELECT id, updated_at FROM whoop_users ORDER BY updated_at DESC LIMIT 1`;
                    } else if (table.table_name === 'whoop_cycles') {
                        recentResult = await sql`SELECT id, end_time FROM whoop_cycles ORDER BY end_time DESC LIMIT 1`;
                    } else if (table.table_name === 'whoop_sleep') {
                        recentResult = await sql`SELECT id, end_time FROM whoop_sleep ORDER BY end_time DESC LIMIT 1`;
                    } else if (table.table_name === 'whoop_recovery') {
                        recentResult = await sql`SELECT cycle_id, created_at FROM whoop_recovery ORDER BY created_at DESC LIMIT 1`;
                    } else if (table.table_name === 'whoop_workouts') {
                        recentResult = await sql`SELECT id, end_time FROM whoop_workouts ORDER BY end_time DESC LIMIT 1`;
                    }
                    
                    const recent = recentResult.rows[0];
                    const timestamp = recent.created_at || recent.updated_at || recent.end_time || 'No timestamp';
                    
                    console.log(`  ${table.table_name}: ${count} records (latest: ${timestamp})`);
                } else {
                    console.log(`  ${table.table_name}: ${count} records (empty)`);
                }
            } catch (error) {
                console.log(`  ${table.table_name}: Error checking data - ${error.message}`);
            }
        }
        
        // Test a simple insert to see if database writes work
        console.log('\n🧪 Testing database write capabilities...');
        
        try {
            console.log(`Testing update on whoop_users...`);
            
            const testResult = await sql`
                UPDATE whoop_users 
                SET updated_at = NOW() 
                WHERE id = (SELECT id FROM whoop_users LIMIT 1)
                RETURNING id, updated_at
            `;
            
            if (testResult.rows.length > 0) {
                console.log(`✅ Database write test successful! Updated user ${testResult.rows[0].id} at ${testResult.rows[0].updated_at}`);
            } else {
                console.log(`⚠️ No users found to test update`);
            }
        } catch (error) {
            console.error(`❌ Database write test failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('💥 Error checking database schema:', error);
    }
}

checkDatabaseSchema();
