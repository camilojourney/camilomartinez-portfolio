const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');
dotenv.config();

async function debugConstraintIssue() {
    try {
        console.log('🔍 Debugging foreign key constraint issue...');
        
        // Check current constraint
        const constraintCheck = await sql`
            SELECT conname, contype, confrelid::regclass as foreign_table,
                   pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'whoop_sleep'::regclass 
            AND conname = 'fk_whoop_sleep_v1_id'
        `;
        
        console.log('📋 Current constraint definition:');
        if (constraintCheck.rows.length > 0) {
            console.log('  Name:', constraintCheck.rows[0].conname);
            console.log('  Definition:', constraintCheck.rows[0].definition);
        } else {
            console.log('  ❌ Constraint not found!');
        }
        
        // Check what values are being inserted that would fail
        console.log('\n🔍 Checking recent failed insertions...');
        
        // Let's see if there's an invalid v1_id value being inserted
        console.log('\n🧪 Testing constraint with sample data...');
        
        try {
            // Test with NULL v1_id
            console.log('Testing with NULL v1_id...');
            await sql`
                INSERT INTO whoop_sleep (id, v1_id, user_id, created_at, updated_at) 
                VALUES (999997, NULL, 23292971, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            `;
            console.log('✅ NULL v1_id insertion successful');
            await sql`DELETE FROM whoop_sleep WHERE id = 999997`;
            
            // Test with invalid v1_id (should fail)
            console.log('Testing with invalid v1_id (999999)...');
            await sql`
                INSERT INTO whoop_sleep (id, v1_id, user_id, created_at, updated_at) 
                VALUES (999996, '999999', 23292971, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            `;
            console.log('❌ Invalid v1_id insertion should have failed!');
            await sql`DELETE FROM whoop_sleep WHERE id = 999996`;
            
        } catch (testError) {
            console.log('✅ Expected error for invalid v1_id:', testError.message.substring(0, 100));
        }
        
        // Check what v1_id values are being processed in the recent fetch
        console.log('\n📊 Recent workout v1_ids available:');
        const recentWorkouts = await sql`
            SELECT v1_id, created_at 
            FROM whoop_workouts 
            WHERE created_at >= NOW() - INTERVAL '3 days'
            ORDER BY created_at DESC
        `;
        
        recentWorkouts.rows.forEach(row => {
            console.log(`  v1_id: ${row.v1_id}, created: ${row.created_at}`);
        });
        
    } catch (error) {
        console.error('💥 Debug failed:', error);
    }
}

debugConstraintIssue();
