#!/usr/bin/env python3
"""
Update existing Notion pages with weekly Whoop data

This script:
1. Gets the last completed week's data from PostgreSQL
2. Finds existing Notion pages for that week
3. Updates the 8 Whoop-related metrics in those pages

DO NOT create new pages - only update existing ones!
"""
import asyncio
import os
import requests
from sqlalchemy import text
from app.config.database import async_session_factory

# Notion credentials from environment variables
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

if not NOTION_TOKEN or not DATABASE_ID:
    raise ValueError(
        "❌ Missing required environment variables!\n"
        "Please set:\n"
        "  export NOTION_TOKEN=\"ntn_...\"\n"
        "  export NOTION_DATABASE_ID=\"2e3e98e3...\"\n"
    )


def format_time(decimal_hour: float | None) -> str:
    """Convert decimal hour to HH:MM format"""
    if decimal_hour is None:
        return "--:--"
    hours = int(decimal_hour)
    minutes = int((decimal_hour - hours) * 60)
    return f"{hours:02d}:{minutes:02d}"


async def main():
    """Update existing Notion pages with Whoop data"""

    # Get the most recent week's data from database
    async with async_session_factory() as db:
        result = await db.execute(text("""
            SELECT
                week_start_date,
                week_end_date,
                meditation_count,
                workout_count,
                avg_wake_hour,
                std_wake_hour,
                avg_workout_hour,
                std_workout_hour,
                avg_sleep_start_hour,
                std_sleep_start_hour
            FROM weekly_habits_summary
            ORDER BY week_start_date DESC
            LIMIT 1
        """))

        row = result.fetchone()
        if not row:
            print("❌ No data found in weekly_habits_summary")
            return

        week_start = row[0]
        week_end = row[1]
        meditation = row[2] or 0
        training = row[3] or 0
        avg_wake = format_time(row[4])
        std_wake = int(row[5] * 60) if row[5] else 0
        avg_workout = format_time(row[6])
        std_workout = int(row[7] * 60) if row[7] else 0
        avg_sleep = format_time(row[8])
        std_sleep = int(row[9] * 60) if row[9] else 0

    print("=" * 80)
    print(f"📊 Syncing Whoop Data to Notion for Week: {week_start} to {week_end}")
    print("=" * 80)
    print()
    print(f"📈 Data Summary:")
    print(f"   Training sessions: {training}")
    print(f"   Meditation sessions: {meditation}")
    print(f"   Avg wake time: {avg_wake}")
    print(f"   Std wake time: {std_wake} min")
    print(f"   Avg workout time: {avg_workout}")
    print(f"   Std workout time: {std_workout} min")
    print(f"   Avg sleep start: {avg_sleep}")
    print(f"   Std sleep start: {std_sleep} min")
    print()

    # Get all pages for this week from Notion
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    data = {
        "filter": {
            "property": "Date",
            "date": {
                "equals": week_start.isoformat()
            }
        }
    }

    response = requests.post(url, headers=headers, json=data)
    if response.status_code != 200:
        print(f"❌ Error fetching pages: {response.text}")
        return

    pages = response.json().get("results", [])

    if not pages:
        print(f"⚠️  No pages found for week starting {week_start}")
        print(f"   Make sure duplicate_weekly_pages.py ran successfully")
        return

    print(f"1️⃣  Found {len(pages)} pages for this week")
    print()

    # Map weekly metric keywords to data (8 metrics total)
    updates = {
        "Meditation sessions": ("Count", str(meditation)),
        "Training sessions": ("Count", str(training)),
        "Days within wake-time (average per week": ("Hours", avg_wake),
        "Days within wake-time window (Average standard deviation)": ("Hours", f"{std_wake} min"),
        "Average Time I start working out": ("Hours", avg_workout),
        "Average std Time I start working out": ("Hours", f"{std_workout} min"),
        "Average Time I start sleeping": ("Hours", avg_sleep),
        "Average std Time I start sleeping": ("Hours", f"{std_sleep} min"),
    }

    print("2️⃣  Updating Whoop metrics in Notion pages...")
    print()

    updated_count = 0
    for page in pages:
        weekly_metric_prop = page["properties"].get("Weekly Metric", {}).get("rich_text", [])
        if not weekly_metric_prop:
            continue

        weekly_metric = weekly_metric_prop[0]["text"]["content"]

        # Check if this page matches any of our Whoop metrics
        for metric_name, (field, value) in updates.items():
            if metric_name in weekly_metric:
                # Update the page
                update_url = f"https://api.notion.com/v1/pages/{page['id']}"
                update_data = {
                    "properties": {
                        field: {"rich_text": [{"text": {"content": value}}]}
                    }
                }

                resp = requests.patch(update_url, headers=headers, json=update_data)
                if resp.status_code == 200:
                    title = page["properties"]["Identity"]["title"][0]["text"]["content"]
                    print(f"   ✅ {title}: {value}")
                    updated_count += 1
                else:
                    print(f"   ❌ Failed to update: {resp.text[:100]}")
                break

    print()
    print("=" * 80)
    print(f"✅ Successfully updated {updated_count}/8 Whoop metrics in Notion")
    print("=" * 80)
    print()


if __name__ == "__main__":
    asyncio.run(main())



if __name__ == "__main__":
    asyncio.run(main())
