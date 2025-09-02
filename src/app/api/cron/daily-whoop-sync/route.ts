import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Verify cron secret for security
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    console.error('[CRON] Invalid cron secret provided');
    return new NextResponse("Unauthorized", { status: 401 });
  }

  console.log("[CRON] Daily WHOOP sync started at", new Date().toISOString());

  try {
    // Ensure we have the required environment variables
    if (!process.env.CRON_SECRET) {
      throw new Error('CRON_SECRET environment variable is not set');
    }

    // Determine the base URL for the fetch
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const fullUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    
    console.log(`[CRON] Calling data fetch endpoint: ${fullUrl}/api/cron/daily-data-fetch`);
    
    // Call the existing working daily-data-fetch endpoint
    const response = await fetch(`${fullUrl}/api/cron/daily-data-fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": process.env.CRON_SECRET
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CRON] Data fetch failed with status: ${response.status}`);
      console.error(`[CRON] Error response: ${errorText}`);
      throw new Error(`Daily sync failed with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log("[CRON] Daily sync completed successfully:", {
      success: data.success,
      timestamp: data.timestamp,
      dataProcessed: data.data
    });

    return NextResponse.json({ 
      ok: true, 
      success: true,
      data,
      timestamp: new Date().toISOString(),
      message: "Daily WHOOP sync completed successfully" 
    });
  } catch (error) {
    console.error("[CRON] Daily sync failed:", error);
    console.error("[CRON] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'set' : 'not set',
        VERCEL_URL: process.env.VERCEL_URL ? 'set' : 'not set',
        CRON_SECRET: process.env.CRON_SECRET ? 'set' : 'not set'
      }
    });
    
    return NextResponse.json({ 
      ok: false, 
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
      timestamp: new Date().toISOString(),
      message: "Daily WHOOP sync failed"
    }, { status: 500 });
  }
}
