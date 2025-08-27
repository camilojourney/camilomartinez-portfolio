import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Use the same header format as the working daily-data-fetch endpoint
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  console.log("[CRON] Daily WHOOP sync started");

  try {
    // Determine the base URL for the fetch
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Call the existing working daily-data-fetch endpoint
    const response = await fetch(`${baseUrl}/api/cron/daily-data-fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": process.env.CRON_SECRET!
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Daily sync failed with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log("[CRON] Daily sync completed successfully:", data);

    return NextResponse.json({ 
      ok: true, 
      data,
      timestamp: new Date().toISOString(),
      message: "Daily WHOOP sync completed" 
    });
  } catch (error) {
    console.error("[CRON] Daily sync failed:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Sync failed",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
