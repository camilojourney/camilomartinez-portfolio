#!/usr/bin/env python3
"""
Update existing Notion pages with data from the database

This script:
1. Finds existing pages in Notion for a specific week
2. Updates their Count/Hours fields with data from weekly_habits_summary table

Usage:
    python scripts/update_existing_notion_pages.py 2026-01-04
"""
import asyncio
import os
import sys
import requests
from datetime import datetime, date, timedelta
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


def format_time_minutes(decimal_hour: float | None) -> str:
    """Convert decimal hour to minutes for std display"""
    if decimal_hour is None:
        return "-- min"
    total_minutes = int(decimal_hour * 60)
    return f"{total_minutes} min"


def get_pages_for_week(week_start: date, week_end: date):
    """Get all pages in Notion for a specific week"""
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    # Filter by date range
    data = {
        "filter": {
            "property": "Date",
            "date": {
                "on_or_after": week_start.isoformat()
            }
        }
    }

    response = requests.post(url, headers=headers, json=data)
    if response.status_code != 200:
        print(f"❌ Error fetching pages: {response.text}")
        return []

    all_pages = response.json().get("results", [])

    # Filter to only pages in this specific week
    week_pages = []
    for page in all_pages:
        date_prop = page["properties"].get("Date", {}).get("date")
        if date_prop:
            page_start = datetime.fromisoformat(date_prop["start"]).date()
            page_end = datetime.fromisoformat(date_prop["end"]).date() if date_prop.get("end") else page_start

            # Check if this page is for our target week
            if page_start == week_start and page_end == week_end:
                week_pages.append(page)

    return week_pages


def update_page(page_id: str, count: str = None, hours: str = None) -> bool:
    """Update a Notion page with new Count/Hours values"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    properties = {}

    if count is not None:
        properties["Count"] = {"rich_text": [{"text": {"content": count}}]}

    if hours is not None and hours != "--:--" and hours != "-- min":
        properties["Hours"] = {"rich_text": [{"text": {"content": hours}}]}

    data = {"properties": properties}

    response = requests.patch(url, headers=headers, json=data)
    return response.status_code == 200


async def update_pages_for_week(week_start_str: str):
    """Update existing Notion pages for a specific week with data from database"""
    try:
        week_start_date = datetime.strptime(week_start_str, "%Y-%m-%d").date()
    except ValueError:
        print(f"❌ Invalid date format. Use YYYY-MM-DD (e.g., 2026-01-04)")
        return

    # Verify it's a Sunday
    if week_start_date.weekday() != 6:  # 6 = Sunday
        print(f"❌ {week_start_str} is not a Sunday. Please provide a Sunday date.")
        return

    week_end_date = week_start_date + timedelta(days=6)

    # Get data from database
    async with async_session_factory() as db:
        result = await db.execute(text("""
            SELECT
                meditation_count,
                workout_count,
                avg_wake_hour,
                std_wake_hour,
                avg_workout_hour,
                std_workout_hour,
                avg_sleep_start_hour,
                std_sleep_start_hour
            FROM weekly_habits_summary
            WHERE week_start_date = :week_start
        """), {"week_start": week_start_date})

        row = result.fetchone()
        if not row:
            print(f"❌ No data found for week starting {week_start_str}")
            return

        meditation_count = row[0] or 0
        training_days = row[1] or 0
        avg_wake = row[2]
        std_wake = row[3]
        avg_workout = row[4]
        std_workout = row[5]
        avg_sleep_start = row[6]
        std_sleep_start = row[7]

    print("=" * 80)
    print(f"📊 Updating Notion Pages for Week: {week_start_date} to {week_end_date}")
    print("=" * 80)
    print()

    # Get existing pages
    print("1️⃣  Finding existing pages in Notion...")
    pages = get_pages_for_week(week_start_date, week_end_date)

    if not pages:
        print(f"❌ No pages found for this week in Notion")
        print(f"   Run duplicate_weekly_pages.py first to create the template pages.")
        return

    print(f"   Found {len(pages)} pages for this week")
    print()

    # Map metric names to their data
    metric_data = {
        "Training Days": (f"{training_days}/7 days", None),
        "Meditation Sessions": (f"{meditation_count}/10 sessions", None),
        "Wake Time Average": (None, format_time(avg_wake)),
        "Wake Time Std Dev": (None, format_time_minutes(std_wake)),
        "Workout Time Average": (None, format_time(avg_workout)),
        "Workout Time Std Dev": (None, format_time_minutes(std_workout)),
        "Sleep Start Time Average": (None, format_time(avg_sleep_start)),
        "Sleep Start Time Std Dev": (None, format_time_minutes(std_sleep_start)),
    }

    print("2️⃣  Updating pages with data...")
    print()

    updated_count = 0
    for page in pages:
        # Get the page title
        title_prop = page["properties"].get("Identity", {}).get("title", [])
        if not title_prop:
            continue

        full_title = title_prop[0]["text"]["content"]

        # Extract metric name (before the date part)
        metric_name = full_title.split("(")[0].strip()

        # Find matching data
        if metric_name in metric_data:
            count, hours = metric_data[metric_name]

            if update_page(page["id"], count, hours):
                value = count if count else hours
                print(f"   ✅ Updated: {metric_name} = {value}")
                updated_count += 1
            else:
                print(f"   ❌ Failed: {metric_name}")

    print()
    print("=" * 80)
    print(f"✅ Successfully updated {updated_count}/{len(pages)} pages")
    print("=" * 80)
    print()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/update_existing_notion_pages.py YYYY-MM-DD")
        print("Example: python scripts/update_existing_notion_pages.py 2026-01-04")
        sys.exit(1)

    week_start = sys.argv[1]
    asyncio.run(update_pages_for_week(week_start))
