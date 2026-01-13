#!/usr/bin/env python3
"""
Create Notion pages for a specific week (for backfilling data)

Usage:
    python scripts/create_pages_for_specific_week.py 2026-01-04

This will create pages for the week starting on the given Sunday.
"""
import asyncio
import os
import sys
import requests
from datetime import datetime, date
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


def create_notion_page(title: str, week_start: date, week_end: date, count: str = None, hours: str = None) -> bool:
    """Create a new Notion page in the database"""
    url = "https://api.notion.com/v1/pages"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    properties = {
        "Identity": {"title": [{"text": {"content": title}}]},
        "Date": {
            "date": {
                "start": week_start.isoformat(),
                "end": week_end.isoformat()
            }
        }
    }

    # Add Count if provided (it's rich_text, not number)
    if count is not None:
        properties["Count"] = {"rich_text": [{"text": {"content": count}}]}

    # Add Hours if provided and not empty
    if hours is not None and hours != "--:--" and hours != "-- min":
        properties["Hours"] = {"rich_text": [{"text": {"content": hours}}]}

    data = {
        "parent": {"database_id": DATABASE_ID},
        "properties": properties
    }

    response = requests.post(url, headers=headers, json=data)
    return response.status_code == 200


async def create_pages_for_week(week_start_str: str):
    """Create Notion pages for a specific week"""
    try:
        week_start_date = datetime.strptime(week_start_str, "%Y-%m-%d").date()
    except ValueError:
        print(f"❌ Invalid date format. Use YYYY-MM-DD (e.g., 2026-01-04)")
        return

    # Verify it's a Sunday
    if week_start_date.weekday() != 6:  # 6 = Sunday
        print(f"❌ {week_start_str} is not a Sunday. Please provide a Sunday date.")
        return

    async with async_session_factory() as db:
        # Get data for this specific week
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
            WHERE week_start_date = :week_start
        """), {"week_start": week_start_date})

        row = result.fetchone()
        if not row:
            print(f"❌ No data found for week starting {week_start_str}")
            print(f"   Run populate_weekly_habits.py first to calculate the data.")
            return

        week_start = row[0]
        week_end = row[1]
        meditation_count = row[2] or 0
        training_days = row[3] or 0
        avg_wake = row[4]
        std_wake = row[5]
        avg_workout = row[6]
        std_workout = row[7]
        avg_sleep_start = row[8]
        std_sleep_start = row[9]

        print("=" * 80)
        print(f"📊 Creating Notion Pages for Week: {week_start} to {week_end}")
        print("=" * 80)
        print()
        print(f"📈 Data Summary:")
        print(f"   Training Days: {training_days}")
        print(f"   Meditation: {meditation_count}")
        print(f"   Avg Wake: {format_time(avg_wake)}")
        print(f"   Avg Workout: {format_time(avg_workout)}")
        print()
        print("2️⃣  Creating pages...")
        print()

        # Format date range for titles
        start_str = week_start.strftime("%b %d")
        end_str = week_end.strftime("%b %d, %Y")
        date_range = f"{start_str} - {end_str}"

        # Define all pages to create
        pages = [
            (f"Training Days ({date_range})", f"{training_days}/7 days", None),
            (f"Meditation Sessions ({date_range})", f"{meditation_count}/10 sessions", None),
            (f"Wake Time Average ({date_range})", None, format_time(avg_wake)),
            (f"Wake Time Std Dev ({date_range})", None, format_time_minutes(std_wake)),
            (f"Workout Time Average ({date_range})", None, format_time(avg_workout)),
            (f"Workout Time Std Dev ({date_range})", None, format_time_minutes(std_workout)),
            (f"Sleep Start Time Average ({date_range})", None, format_time(avg_sleep_start)),
            (f"Sleep Start Time Std Dev ({date_range})", None, format_time_minutes(std_sleep_start)),
        ]

        success_count = 0
        for title, count, hours in pages:
            if create_notion_page(title, week_start, week_end, count, hours):
                value = count if count else hours
                print(f"   ✅ Created: {title.split('(')[0].strip()} = {value}")
                success_count += 1
            else:
                print(f"   ❌ Failed: {title}")

        print()
        print("=" * 80)
        print(f"✅ Successfully created {success_count}/8 pages for week {date_range}")
        print("=" * 80)
        print()
        print("💡 Check your Notion database!")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/create_pages_for_specific_week.py YYYY-MM-DD")
        print("Example: python scripts/create_pages_for_specific_week.py 2026-01-04")
        sys.exit(1)

    week_start = sys.argv[1]
    asyncio.run(create_pages_for_week(week_start))
