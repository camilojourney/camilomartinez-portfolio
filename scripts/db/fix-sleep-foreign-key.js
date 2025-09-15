const { sql } = require('@vercel/postgres');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

async function fixSleepForeignKey() {
    try {
        console.log('🔧 Fixing whoop_sleep foreign key constraint...');
        
        console.log('🗑️ Dropping existing constraint...');
        await sql`ALTER TABLE whoop_sleep DROP CONSTRAINT IF EXISTS fk_whoop_sleep_v1_id`;
        
        console.log('✅ Adding new constraint that allows NULL...');
        await sql`
            ALTER TABLE whoop_sleep 
            ADD CONSTRAINT fk_whoop_sleep_v1_id 
            FOREIGN KEY (v1_id) REFERENCES whoop_workouts(v1_id) 
            ON DELETE SET NULL
        `;
        
        console.log('✅ Migration completed successfully!');
        
        // Test the constraint
        console.log('🧪 Testing the new constraint...');
        const testQuery = await sql`
            SELECT COUNT(*) as total,
                   COUNT(v1_id) as with_workout_ref,
                   COUNT(*) - COUNT(v1_id) as without_workout_ref
            FROM whoop_sleep
        `;
        
        const result = testQuery.rows[0];
        console.log(`📊 Sleep records: ${result.total} total, ${result.with_workout_ref} with workout reference, ${result.without_workout_ref} without workout reference`);
        
        // Test inserting a sleep record with NULL v1_id
        console.log('🧪 Testing NULL v1_id insertion...');
        try {
            await sql`
                INSERT INTO whoop_sleep (id, v1_id, user_id, created_at, updated_at) 
                VALUES (999999, NULL, 23292971, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            `;
            console.log('✅ NULL v1_id insertion successful');
            
            // Clean up test record
            await sql`DELETE FROM whoop_sleep WHERE id = 999999`;
            
        } catch (testError) {
            console.error('❌ NULL v1_id insertion failed:', testError.message);
        }
        
    } catch (error) {
        console.error('💥 Migration failed:', error);
    }
}

fixSleepForeignKey();
