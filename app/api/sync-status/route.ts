import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'WHOOP V2 API Ready',
        timestamp: new Date().toISOString(),
        message: 'Migration to v2 complete. Ready for data collection.'
    });
}
