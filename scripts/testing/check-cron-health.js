// 📂 scripts/testing/check-cron-health.js

import dotenv from 'dotenv';
dotenv.config();

import { sql } from '../../src/lib/db/db.ts';

async function checkCronJobHealth() {
    console.log('🏥 WHOOP Daily Fetch Cron Job Health Check\n');
    
    try {
        // Check 1: Database connectivity and basic schema
        console.log('1️⃣ Checking database connectivity and schema...');
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'whoop_%'
            ORDER BY table_name;
        `;
        
        console.log(`   ✅ Database connected - Found ${tables.rows.length} WHOOP tables:`);
        tables.rows.forEach(t => console.log(`      - ${t.table_name}`));
        
        // Check 2: User token status
        console.log('\n2️⃣ Checking user token status...');
        const userStatus = await sql`
            SELECT 
                COUNT(*) as total_users,
                COUNT(access_token) as users_with_access_token,
                COUNT(refresh_token) as users_with_refresh_token,
                COUNT(CASE WHEN token_expires_at > NOW() THEN 1 END) as users_with_valid_tokens
            FROM whoop_users;
        `;
        
        const us = userStatus.rows[0];
        console.log(`   📊 User token status:`);
        console.log(`      - Total users: ${us.total_users}`);
        console.log(`      - With access tokens: ${us.users_with_access_token}`);
        console.log(`      - With refresh tokens: ${us.users_with_refresh_token}`);
        console.log(`      - With valid tokens: ${us.users_with_valid_tokens}`);
        
        if (us.users_with_refresh_token === 0) {
            console.log('   ⚠️  WARNING: No users have refresh tokens - OAuth authentication needed');
        }
        
        // Check 3: Recent data activity (last 7 days)
        console.log('\n3️⃣ Checking recent data activity (last 7 days)...');
        const recentData = await sql`
            SELECT 
                'cycles' as data_type,
                COUNT(*) as count,
                MAX(updated_at) as latest_update
            FROM whoop_cycles 
            WHERE updated_at >= NOW() - INTERVAL '7 days'
            
            UNION ALL
            
            SELECT 
                'sleep' as data_type,
                COUNT(*) as count,
                MAX(updated_at) as latest_update
            FROM whoop_sleep 
            WHERE updated_at >= NOW() - INTERVAL '7 days'
            
            UNION ALL
            
            SELECT 
                'recovery' as data_type,
                COUNT(*) as count,
                MAX(updated_at) as latest_update
            FROM whoop_recovery 
            WHERE updated_at >= NOW() - INTERVAL '7 days'
            
            UNION ALL
            
            SELECT 
                'workouts' as data_type,
                COUNT(*) as count,
                MAX(updated_at) as latest_update
            FROM whoop_workouts 
            WHERE updated_at >= NOW() - INTERVAL '7 days'
            
            ORDER BY data_type;
        `;
        
        console.log(`   📈 Recent data activity (last 7 days):`);
        recentData.rows.forEach(r => {
            const lastUpdate = r.latest_update ? new Date(r.latest_update).toLocaleString() : 'No updates';
            console.log(`      - ${r.data_type}: ${r.count} records (latest: ${lastUpdate})`);
        });
        
        // Check 4: Foreign key constraint integrity
        console.log('\n4️⃣ Checking foreign key constraint integrity...');
        const fkConstraints = await sql`
            SELECT 
                tc.table_name,
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu 
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name IN ('whoop_recovery', 'whoop_cycles', 'whoop_sleep', 'whoop_workouts')
            ORDER BY tc.table_name, tc.constraint_name;
        `;
        
        console.log(`   🔗 Foreign key constraints (${fkConstraints.rows.length} total):`);
        fkConstraints.rows.forEach(fk => {
            console.log(`      - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        
        // Check 5: Data integrity violations
        console.log('\n5️⃣ Checking for data integrity violations...');
        
        // Check for orphaned recovery records (should be none with FK constraints)
        const orphanedRecovery = await sql`
            SELECT COUNT(*) as count
            FROM whoop_recovery r
            LEFT JOIN whoop_cycles c ON r.cycle_id = c.id
            WHERE r.cycle_id IS NOT NULL AND c.id IS NULL;
        `;
        
        // Check for orphaned sleep v1_id references
        const orphanedSleepWorkouts = await sql`
            SELECT COUNT(*) as count
            FROM whoop_sleep s
            LEFT JOIN whoop_workouts w ON s.v1_id = w.v1_id
            WHERE s.v1_id IS NOT NULL AND w.v1_id IS NULL;
        `;
        
        console.log(`   🔍 Data integrity check:`);
        console.log(`      - Orphaned recovery → cycles: ${orphanedRecovery.rows[0].count} (should be 0)`);
        console.log(`      - Orphaned sleep → workouts: ${orphanedSleepWorkouts.rows[0].count} (should be 0)`);
        
        // Check 6: Environment variables for cron job
        console.log('\n6️⃣ Checking cron job environment...');
        const cronSecret = process.env.CRON_SECRET;
        const postgresUrl = process.env.POSTGRES_URL;
        
        console.log(`   🔑 Environment check:`);
        console.log(`      - CRON_SECRET: ${cronSecret ? '✅ Set' : '❌ Missing'}`);
        console.log(`      - POSTGRES_URL: ${postgresUrl ? '✅ Set' : '❌ Missing'}`);
        
        // Check 7: Data freshness (most recent records)
        console.log('\n7️⃣ Checking data freshness...');
        const dataFreshness = await sql`
            SELECT 
                'Most recent cycle' as description,
                MAX(end_time) as timestamp,
                EXTRACT(EPOCH FROM (NOW() - MAX(end_time)))/3600 as hours_ago
            FROM whoop_cycles
            
            UNION ALL
            
            SELECT 
                'Most recent sleep' as description,
                MAX(end_time) as timestamp,
                EXTRACT(EPOCH FROM (NOW() - MAX(end_time)))/3600 as hours_ago
            FROM whoop_sleep
            
            UNION ALL
            
            SELECT 
                'Most recent workout' as description,
                MAX(end_time) as timestamp,
                EXTRACT(EPOCH FROM (NOW() - MAX(end_time)))/3600 as hours_ago
            FROM whoop_workouts;
        `;
        
        console.log(`   🕐 Data freshness:`);
        dataFreshness.rows.forEach(df => {
            const hoursAgo = df.hours_ago ? Math.round(df.hours_ago * 10) / 10 : 'Unknown';
            const timestamp = df.timestamp ? new Date(df.timestamp).toLocaleString() : 'No data';
            console.log(`      - ${df.description}: ${timestamp} (${hoursAgo}h ago)`);
        });
        
        // Summary
        console.log('\n📋 HEALTH CHECK SUMMARY:');
        
        const issues = [];
        if (us.users_with_refresh_token === 0) issues.push('No users with refresh tokens');
        if (orphanedRecovery.rows[0].count > 0) issues.push('Orphaned recovery records');
        if (orphanedSleepWorkouts.rows[0].count > 0) issues.push('Orphaned sleep-workout references');
        if (!cronSecret) issues.push('Missing CRON_SECRET');
        if (!postgresUrl) issues.push('Missing POSTGRES_URL');
        
        if (issues.length === 0) {
            console.log('   ✅ ALL SYSTEMS HEALTHY - Cron job ready for operation');
        } else {
            console.log('   ⚠️  ISSUES FOUND:');
            issues.forEach(issue => console.log(`      - ${issue}`));
        }
        
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        process.exit(1);
    }
}

checkCronJobHealth();
