import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';

export async function GET() {
    try {
        const result = await sql`
            SELECT
                TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date,
                strain::decimal as strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            ORDER BY start_time DESC
            LIMIT 10
        `;
        
        // Ensure proper data serialization for client components
        const processedData = result.rows.map(row => ({
            formatted_date: String(row.formatted_date),
            strain: parseFloat(String(row.strain))
        }));
        
        console.log('Test API: Strain Data from DB:', processedData.length, 'records');
        console.log('Test API: Sample data:', processedData.slice(0, 3));
        
        return NextResponse.json({
            success: true,
            count: processedData.length,
            data: processedData,
            sample: processedData.slice(0, 3)
        });
    } catch (error) {
        console.error('Test API: Error fetching strain data:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
