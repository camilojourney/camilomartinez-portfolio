// Test cron job data insertion to reproduce the issue
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key] = value.replace(/"/g, '');
});

const { sql } = require('@vercel/postgres');

async function testDataInsertion() {
    try {
        console.log('🧪 Testing actual data insertion like the cron job does...\n');
        
        // Simulate what the cron job does
        console.log('1. Testing WHOOP API call simulation...');
        
        // Get the user from database like cron job does
        const users = await sql`
            SELECT id, access_token, first_name, last_name
            FROM whoop_users 
            WHERE access_token IS NOT NULL
            LIMIT 1
        `;
        
        if (users.rows.length === 0) {
            console.log('❌ No users with access tokens found');
            return;
        }
        
        const user = users.rows[0];
        console.log(`✅ Found user: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
        
        // Test actual WHOOP API call
        console.log('\n2. Testing real WHOOP API call...');
        
        const response = await fetch('https://api.prod.whoop.com/developer/v1/cycle', {
            headers: {
                'Authorization': `Bearer ${user.access_token}`,
                'Accept': 'application/json'
            }
        });
        
        console.log(`API Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ WHOOP API call failed:', errorData);
            return;
        }
        
        const data = await response.json();
        console.log(`✅ WHOOP API returned ${data.records ? data.records.length : 0} cycles`);
        
        if (data.records && data.records.length > 0) {
            console.log('\n3. Testing database insertion...');
            
            // Test inserting one cycle
            const testCycle = data.records[0];
            console.log(`Testing insertion of cycle: ${testCycle.id}`);
            
            try {
                await sql`
                    INSERT INTO whoop_cycles (
                        id, user_id, start_time, end_time, timezone_offset,
                        score_state, strain, kilojoule, average_heart_rate, max_heart_rate
                    )
                    VALUES (
                        ${testCycle.id}, ${testCycle.user_id}, ${testCycle.start}, ${testCycle.end},
                        ${testCycle.timezone_offset}, ${testCycle.score_state}, ${testCycle.score ? testCycle.score.strain : null},
                        ${testCycle.score ? testCycle.score.kilojoule : null}, 
                        ${testCycle.score ? testCycle.score.average_heart_rate : null}, 
                        ${testCycle.score ? testCycle.score.max_heart_rate : null}
                    )
                    ON CONFLICT (id)
                    DO UPDATE SET
                        start_time = EXCLUDED.start_time,
                        end_time = EXCLUDED.end_time,
                        score_state = EXCLUDED.score_state,
                        strain = EXCLUDED.strain,
                        kilojoule = EXCLUDED.kilojoule,
                        average_heart_rate = EXCLUDED.average_heart_rate,
                        max_heart_rate = EXCLUDED.max_heart_rate
                `;
                
                console.log('✅ Cycle insertion successful');
                
                // Check if it was actually inserted
                const checkResult = await sql`
                    SELECT id, end_time FROM whoop_cycles 
                    WHERE id = ${testCycle.id}
                `;
                
                if (checkResult.rows.length > 0) {
                    console.log(`✅ Verified: Cycle ${testCycle.id} exists in database`);
                } else {
                    console.log(`❌ Cycle ${testCycle.id} not found in database after insert`);
                }
                
            } catch (error) {
                console.error('❌ Cycle insertion failed:', error.message);
            }
        }
        
        // Test recovery API and insertion
        console.log('\n4. Testing recovery data...');
        
        const recoveryResponse = await fetch('https://api.prod.whoop.com/developer/v1/recovery', {
            headers: {
                'Authorization': `Bearer ${user.access_token}`,
                'Accept': 'application/json'
            }
        });
        
        console.log(`Recovery API Response: ${recoveryResponse.status} ${recoveryResponse.statusText}`);
        
        if (recoveryResponse.ok) {
            const recoveryData = await recoveryResponse.json();
            console.log(`✅ Recovery API returned ${recoveryData.records ? recoveryData.records.length : 0} records`);
            
            if (recoveryData.records && recoveryData.records.length > 0) {
                const testRecovery = recoveryData.records[0];
                console.log(`Testing recovery insertion for cycle: ${testRecovery.cycle_id}`);
                
                try {
                    await sql`
                        INSERT INTO whoop_recovery (
                            cycle_id, sleep_id, user_id, score_state,
                            recovery_score, resting_heart_rate, hrv_rmssd_milli,
                            spo2_percentage, skin_temp_celsius
                        )
                        VALUES (
                            ${testRecovery.cycle_id}, ${testRecovery.sleep_id}, ${testRecovery.user_id}, 
                            ${testRecovery.score_state},
                            ${testRecovery.score ? testRecovery.score.recovery_score : null},
                            ${testRecovery.score ? testRecovery.score.resting_heart_rate : null},
                            ${testRecovery.score ? testRecovery.score.hrv_rmssd_milli : null},
                            ${testRecovery.score ? testRecovery.score.spo2_percentage : null},
                            ${testRecovery.score ? testRecovery.score.skin_temp_celsius : null}
                        )
                        ON CONFLICT (cycle_id)
                        DO UPDATE SET
                            sleep_id = EXCLUDED.sleep_id,
                            score_state = EXCLUDED.score_state,
                            recovery_score = EXCLUDED.recovery_score,
                            resting_heart_rate = EXCLUDED.resting_heart_rate,
                            hrv_rmssd_milli = EXCLUDED.hrv_rmssd_milli,
                            spo2_percentage = EXCLUDED.spo2_percentage,
                            skin_temp_celsius = EXCLUDED.skin_temp_celsius
                    `;
                    
                    console.log('✅ Recovery insertion successful');
                } catch (error) {
                    console.error('❌ Recovery insertion failed:', error.message);
                }
            }
        }
        
    } catch (error) {
        console.error('💥 Error testing data insertion:', error);
    }
}

testDataInsertion();
