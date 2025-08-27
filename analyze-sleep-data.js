// Quick analysis script to understand sleep vs cycle data
const { sql } = require('@vercel/postgres');

async function analyzeSleepData() {
    try {
        // Check for naps in sleep data
        const napsQuery = await sql`
            SELECT 
                COUNT(*) as total_sleep,
                COUNT(*) FILTER (WHERE nap = true) as nap_count,
                COUNT(*) FILTER (WHERE nap = false OR nap IS NULL) as regular_sleep_count
            FROM whoop_sleep
        `;
        
        console.log('Sleep Analysis:');
        console.log('Total Sleep Records:', napsQuery.rows[0].total_sleep);
        console.log('Naps:', napsQuery.rows[0].nap_count);
        console.log('Regular Sleep:', napsQuery.rows[0].regular_sleep_count);
        
        // Check date ranges
        const dateRanges = await sql`
            SELECT 
                'cycles' as type,
                MIN(DATE(start_time)) as earliest_date,
                MAX(DATE(start_time)) as latest_date,
                COUNT(*) as count
            FROM whoop_cycles
            UNION ALL
            SELECT 
                'sleep' as type,
                MIN(DATE(start_time)) as earliest_date,
                MAX(DATE(start_time)) as latest_date,
                COUNT(*) as count
            FROM whoop_sleep
            ORDER BY type
        `;
        
        console.log('\nDate Range Comparison:');
        dateRanges.rows.forEach(row => {
            console.log(`${row.type}: ${row.count} records from ${row.earliest_date} to ${row.latest_date}`);
        });
        
        // Check for sleep records on same dates
        const dailyComparison = await sql`
            WITH daily_counts AS (
                SELECT 
                    DATE(start_time) as date,
                    COUNT(*) as sleep_count
                FROM whoop_sleep 
                GROUP BY DATE(start_time)
            ),
            cycle_counts AS (
                SELECT 
                    DATE(start_time) as date,
                    COUNT(*) as cycle_count
                FROM whoop_cycles 
                GROUP BY DATE(start_time)
            )
            SELECT 
                d.date,
                d.sleep_count,
                COALESCE(c.cycle_count, 0) as cycle_count,
                d.sleep_count - COALESCE(c.cycle_count, 0) as difference
            FROM daily_counts d
            LEFT JOIN cycle_counts c ON d.date = c.date
            WHERE d.sleep_count > 1 OR d.sleep_count != COALESCE(c.cycle_count, 0)
            ORDER BY d.date DESC
            LIMIT 10
        `;
        
        console.log('\nDays with Multiple Sleep Records or Mismatches:');
        dailyComparison.rows.forEach(row => {
            console.log(`${row.date}: ${row.sleep_count} sleep, ${row.cycle_count} cycles (diff: ${row.difference})`);
        });
        
    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

analyzeSleepData();
