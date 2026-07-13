// Check if recent data was actually saved
const fs = require('fs');
const os = require('os');
const envPath = process.env.CAMILO_ENV_PATH || `${os.homedir()}/.config/secrets/camilomartinez-portfolio-local.env`;
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key] = value.replace(/"/g, '');
});

const { sql } = require('@vercel/postgres');

async function checkRecentData() {
    try {
        console.log('🔍 Checking for data saved in the last 10 minutes...\n');
        
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        // Check whoop_cycles for recent data
        console.log('📊 RECENT CYCLES:');
        const cycles = await sql`
            SELECT id, end_time 
            FROM whoop_cycles 
            WHERE end_time >= ${tenMinutesAgo.toISOString()}
            ORDER BY end_time DESC
            LIMIT 5
        `;
        console.log(`Found ${cycles.rows.length} cycles from last 10 minutes`);
        cycles.rows.forEach(row => {
            console.log(`  Cycle ${row.id}: ${row.end_time}`);
        });
        
        // Check whoop_sleep for recent data
        console.log('\n😴 RECENT SLEEP:');
        const sleep = await sql`
            SELECT id, end_time 
            FROM whoop_sleep 
            WHERE end_time >= ${tenMinutesAgo.toISOString()}
            ORDER BY end_time DESC
            LIMIT 5
        `;
        console.log(`Found ${sleep.rows.length} sleep records from last 10 minutes`);
        sleep.rows.forEach(row => {
            console.log(`  Sleep ${row.id}: ${row.end_time}`);
        });
        
        // Check whoop_recovery (no created_at, so check all recent)
        console.log('\n🔄 RECENT RECOVERY:');
        const recovery = await sql`
            SELECT cycle_id, recovery_percentage 
            FROM whoop_recovery 
            ORDER BY cycle_id DESC
            LIMIT 5
        `;
        console.log(`Found ${recovery.rows.length} recovery records (latest)`);
        recovery.rows.forEach(row => {
            console.log(`  Recovery for cycle ${row.cycle_id}: score ${row.recovery_percentage}`);
        });
        
        // Check whoop_workouts for recent data
        console.log('\n💪 RECENT WORKOUTS:');
        const workouts = await sql`
            SELECT id, end_time 
            FROM whoop_workouts 
            WHERE end_time >= ${tenMinutesAgo.toISOString()}
            ORDER BY end_time DESC
            LIMIT 5
        `;
        console.log(`Found ${workouts.rows.length} workouts from last 10 minutes`);
        workouts.rows.forEach(row => {
            console.log(`  Workout ${row.id}: ${row.end_time}`);
        });
        
        // Overall summary
        const totalRecent = cycles.rows.length + sleep.rows.length + recovery.rows.length + workouts.rows.length;
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`Total recent records: ${totalRecent}`);
        if (totalRecent > 0) {
            console.log('✅ DATA IS BEING SAVED! The fix worked!');
        } else {
            console.log('❌ No recent data found - may still be an issue');
        }
        
    } catch (error) {
        console.error('💥 Error checking recent data:', error);
    }
}

checkRecentData();
