const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');
dotenv.config();

async function temporarilyDisableConstraint() {
    try {
        console.log('🔧 Temporarily disabling foreign key constraint...');
        
        // Drop the constraint temporarily
        await sql`ALTER TABLE whoop_sleep DROP CONSTRAINT IF EXISTS fk_whoop_sleep_v1_id`;
        console.log('✅ Constraint dropped - daily fetch should work now');
        
        console.log('\n📋 After daily fetch completes, we can:');
        console.log('1. Check what v1_id values were inserted');
        console.log('2. Clean up any invalid references');
        console.log('3. Re-add the constraint properly');
        
        console.log('\n🔄 To re-enable the constraint later, run:');
        console.log('ALTER TABLE whoop_sleep ADD CONSTRAINT fk_whoop_sleep_v1_id FOREIGN KEY (v1_id) REFERENCES whoop_workouts(v1_id) ON DELETE SET NULL;');
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

temporarilyDisableConstraint();
