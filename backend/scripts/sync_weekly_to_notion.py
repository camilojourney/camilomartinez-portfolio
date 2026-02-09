#!/usr/bin/env python3
"""
Update existing Notion pages with weekly Whoop data

This script:
1. Gets the last completed week's data from PostgreSQL
2. Finds existing Notion pages for that week (by Identity name)
3. Updates the 5 Whoop-related identities:
   - I am an athlete → Count (training sessions)
   - I live in the present → Count (meditation sessions)
   - I train at the same time daily → Hours (avg) + Std (deviation)
   - I wake at the same time daily → Hours (avg) + Std (deviation)
   - I sleep at the same time nightly → Hours (avg) + Std (deviation)

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
    print("📈 Data Summary:")
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
        print("   Make sure duplicate_weekly_pages.py ran successfully")
        return

    print(f"1️⃣  Found {len(pages)} pages for this week")
    print()

    # Map Identity names to their data updates
    # New consolidated structure: 6 Whoop-related identities (3 merged pairs + 2 counts)
    # Each identity maps to the fields that need updating
    identity_updates = {
        # Count-based metrics
        "I am an athlete": {"Count": str(training)},
        "I live in the present": {"Count": str(meditation)},
        # Time-based metrics (merged avg + std into same page)
        "I train at the same time daily": {"Hours": avg_workout, "Std": f"{std_workout} min"},
        "I wake at the same time daily": {"Hours": avg_wake, "Std": f"{std_wake} min"},
        "I sleep at the same time nightly": {"Hours": avg_sleep, "Std": f"{std_sleep} min"},
    }

    print("2️⃣  Updating Whoop metrics in Notion pages...")
    print()

    updated_count = 0
    for page in pages:
        # Get the Identity (title) of this page
        identity_prop = page["properties"].get("Identity", {}).get("title", [])
        if not identity_prop:
            continue

        identity_name = identity_prop[0]["text"]["content"]

        # Check if this page matches any of our Whoop-related identities
        if identity_name in identity_updates:
            fields_to_update = identity_updates[identity_name]

            # Build the update payload with all fields for this identity
            update_url = f"https://api.notion.com/v1/pages/{page['id']}"
            properties = {}

            for field, value in fields_to_update.items():
                properties[field] = {"rich_text": [{"text": {"content": value}}]}

            update_data = {"properties": properties}

            resp = requests.patch(update_url, headers=headers, json=update_data)
            if resp.status_code == 200:
                values_str = ", ".join(f"{k}={v}" for k, v in fields_to_update.items())
                print(f"   ✅ {identity_name}: {values_str}")
                updated_count += 1
            else:
                print(f"   ❌ Failed to update {identity_name}: {resp.text[:100]}")

    print()
    print("=" * 80)
    print(f"✅ Successfully updated {updated_count}/5 Whoop-related identities in Notion")
    print("=" * 80)
    print()


if __name__ == "__main__":
    asyncio.run(main())
