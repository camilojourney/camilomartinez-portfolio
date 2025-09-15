const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');
dotenv.config();

async function removeConstraintCompletely() {
    try {
        console.log('🔧 Removing foreign key constraint completely...');
        console.log('📋 Reason: Sleep and workouts are independent in WHOOP API v2');
        
        // Drop the constraint completely
        await sql`ALTER TABLE whoop_sleep DROP CONSTRAINT IF EXISTS fk_whoop_sleep_v1_id`;
        console.log('✅ Foreign key constraint removed');
        
        // Verify constraint is gone
        const constraintCheck = await sql`
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'whoop_sleep'::regclass 
            AND conname = 'fk_whoop_sleep_v1_id'
        `;
        
        if (constraintCheck.rows.length === 0) {
            console.log('✅ Confirmed: No foreign key constraint exists');
        } else {
            console.log('⚠️ Warning: Constraint still exists');
        }
        
        console.log('\n📊 Sleep and workout relationship:');
        console.log('• Sleep records can exist independently (v1_id can be NULL)');
        console.log('• Workout records exist independently');
        console.log('• Some sleep may reference workouts (when v1_id is present)');
        console.log('• This is normal WHOOP API v2 behavior');
        
        // Test insertion with NULL v1_id
        console.log('\n🧪 Testing sleep insertion without workout reference...');
        try {
            await sql`
                INSERT INTO whoop_sleep (id, v1_id, user_id, created_at, updated_at) 
                VALUES ('test-sleep-123', NULL, 23292971, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            `;
            console.log('✅ Sleep record with NULL v1_id inserted successfully');
            
            // Clean up
            await sql`DELETE FROM whoop_sleep WHERE id = 'test-sleep-123'`;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

removeConstraintCompletely();
