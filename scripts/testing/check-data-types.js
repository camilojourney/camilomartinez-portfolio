const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');
dotenv.config();

async function checkDataTypes() {
    try {
        console.log('🔍 Checking data types for v1_id columns...');
        
        const sleepColumns = await sql`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'whoop_sleep' AND column_name = 'v1_id'
        `;
        
        const workoutColumns = await sql`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'whoop_workouts' AND column_name = 'v1_id'
        `;
        
        console.log('📋 whoop_sleep.v1_id:');
        sleepColumns.rows.forEach(col => {
            console.log(`  Type: ${col.data_type}, Max Length: ${col.character_maximum_length}`);
        });
        
        console.log('📋 whoop_workouts.v1_id:');
        workoutColumns.rows.forEach(col => {
            console.log(`  Type: ${col.data_type}, Max Length: ${col.character_maximum_length}`);
        });
        
        // Check actual values to see the format
        console.log('\n🔍 Sample v1_id values:');
        const sampleWorkouts = await sql`
            SELECT v1_id, pg_typeof(v1_id) as type_name
            FROM whoop_workouts 
            LIMIT 3
        `;
        
        console.log('whoop_workouts samples:');
        sampleWorkouts.rows.forEach(row => {
            console.log(`  ${row.v1_id} (type: ${row.type_name})`);
        });
        
        const sampleSleep = await sql`
            SELECT v1_id, pg_typeof(v1_id) as type_name
            FROM whoop_sleep 
            WHERE v1_id IS NOT NULL
            LIMIT 3
        `;
        
        console.log('whoop_sleep samples:');
        if (sampleSleep.rows.length > 0) {
            sampleSleep.rows.forEach(row => {
                console.log(`  ${row.v1_id} (type: ${row.type_name})`);
            });
        } else {
            console.log('  No non-null v1_id values found in whoop_sleep');
        }
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

checkDataTypes();
