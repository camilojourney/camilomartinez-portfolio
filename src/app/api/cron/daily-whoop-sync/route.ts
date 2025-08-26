import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Call the existing sync logic here
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/daily-data-fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": process.env.CRON_SECRET!
      }
    });

    if (!response.ok) {
      throw new Error(`Sync failed with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Daily sync failed:", error);
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}
