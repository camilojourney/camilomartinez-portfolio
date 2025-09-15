const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');
dotenv.config();

async function checkForeignKeyIssue() {
    try {
        console.log('🔍 Checking foreign key constraint issue...');
        
        // Check the constraint details
        const constraintInfo = await sql`
            SELECT 
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = 'whoop_sleep'
                AND tc.constraint_name = 'fk_whoop_sleep_v1_id'
        `;
        
        console.log('📋 Foreign key constraint details:');
        constraintInfo.rows.forEach(row => {
            console.log(`  ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
        });
        
        // Check recent sleep data that might be causing issues
        const recentSleep = await sql`
            SELECT v1_id, created_at 
            FROM whoop_sleep 
            ORDER BY created_at DESC 
            LIMIT 5
        `;
        
        console.log('\n📋 Recent sleep records:');
        recentSleep.rows.forEach(row => {
            console.log(`  v1_id: ${row.v1_id}, created: ${row.created_at}`);
        });
        
        // Check if there are any v1_id values in sleep that don't exist in workouts
        const orphanCheck = await sql`
            SELECT s.v1_id 
            FROM whoop_sleep s
            LEFT JOIN whoop_workouts w ON s.v1_id = w.v1_id
            WHERE w.v1_id IS NULL
            LIMIT 10
        `;
        
        console.log('\n🔍 Orphaned sleep records (v1_id not in workouts):');
        if (orphanCheck.rows.length === 0) {
            console.log('  ✅ No orphaned records found');
        } else {
            orphanCheck.rows.forEach(row => {
                console.log(`  ❌ Orphaned v1_id: ${row.v1_id}`);
            });
        }
        
        // Also check workouts table for recent entries
        const recentWorkouts = await sql`
            SELECT v1_id, created_at 
            FROM whoop_workouts 
            ORDER BY created_at DESC 
            LIMIT 5
        `;
        
        console.log('\n📋 Recent workout records:');
        recentWorkouts.rows.forEach(row => {
            console.log(`  v1_id: ${row.v1_id}, created: ${row.created_at}`);
        });
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

checkForeignKeyIssue();
