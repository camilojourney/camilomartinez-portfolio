import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  console.log("[CRON] Daily WHOOP sync started");

  try {
    // Use the enhanced whoop-collector-v2 with daily mode
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/whoop-collector-v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({ mode: "daily" })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Enhanced collector failed with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log("[CRON] Daily sync completed successfully:", {
      cycles: data.newCycles,
      sleep: data.newSleep, 
      recovery: data.newRecovery,
      workouts: data.newWorkouts,
      errors: data.errors?.length || 0
    });

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
