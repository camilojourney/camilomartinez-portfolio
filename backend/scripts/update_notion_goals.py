#!/usr/bin/env python3
"""
Update existing Notion goal pages with last week's data

This script finds the corresponding goal pages and updates them
with the metrics from the last completed week.
"""
import asyncio
import os
import requests
from datetime import datetime
from sqlalchemy import text
from app.config.database import async_session_factory

# Notion credentials from environment variables
# REQUIRED: Set these in your shell or GitHub Secrets:
#   export NOTION_TOKEN="ntn_..."
#   export NOTION_DATABASE_ID="2e3e98e3..."
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

if not NOTION_TOKEN or not DATABASE_ID:
    raise ValueError(
        "❌ Missing required environment variables!\n"
        "Please set:\n"
        "  export NOTION_TOKEN=\"ntn_...\"\n"
        "  export NOTION_DATABASE_ID=\"2e3e98e3...\"\n"
    )

# Map goal pages to metrics
GOAL_PAGE_IDS = {
    "training_days": "2e3e98e3-0a30-803f-a46d-e3dee9d312f0",  # I am an athlete
    "meditation": "2e3e98e3-0a30-80dc-bd36-e948300b0947",     # I live in the present
    "wake_time_avg": "2e3e98e3-0a30-80f9-8fc8-dce2c41053b6",  # I start my day intentionally
    "wake_time_std": "2e6e98e3-0a30-80c7-bc3d-fc74241f36e7",  # I start my day intentionally, Low standard deviation
    "workout_time_avg": "2e6e98e3-0a30-80e8-8829-c1855a5eb252",  # I like consistency of my workouts (avg)
    "workout_time_std": "2e6e98e3-0a30-801e-8004-da8f11af95dc",  # I like consistency of my workouts (std)
    "sleep_time_avg": "2e6e98e3-0a30-809c-ad95-d2d1c093c3a3",  # I like to sleep to recover my body (avg)
    "sleep_time_std": "2e6e98e3-0a30-80fb-82e0-e7f09b82e70f",  # I like to sleep to recover my body (std)
}


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


async def get_last_week_data():
    """Get last completed week's data from database"""
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
            return None

        return {
            "week_start": row[0],
            "week_end": row[1],
            "meditation_count": row[2] or 0,
            "training_days": row[3] or 0,
            "avg_wake": row[4],
            "std_wake": row[5],
            "avg_workout": row[6],
            "std_workout": row[7],
            "avg_sleep_start": row[8],
            "std_sleep_start": row[9],
        }


def update_notion_page(page_id: str, properties: dict) -> bool:
    """Update a Notion page with new properties"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    payload = {"properties": properties}

    try:
        response = requests.patch(url, headers=headers, json=payload)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"      Response: {e.response.text}")
        return False


async def main():
    """Main function"""
    print("=" * 80)
    print("📊 Updating Notion Goal Pages with Last Week's Data")
    print("=" * 80)

    # Get last week's data
    print("\n1️⃣  Fetching last week's data from database...")
    week_data = await get_last_week_data()

    if not week_data:
        return

    week_label = f"{week_data['week_start'].strftime('%b %d')} - {week_data['week_end'].strftime('%b %d, %Y')}"
    print(f"   Found week: {week_label}")

    # Date range for updating (proper Notion format)
    date_range = {
        "start": week_data["week_start"].isoformat(),
        "end": week_data["week_end"].isoformat()
    }

    print("\n2️⃣  Updating goal pages...")
    success_count = 0

    # 1. Training Days
    print(f"\n   📝 Updating: Training Days")
    if update_notion_page(GOAL_PAGE_IDS["training_days"], {
        "Count": {"rich_text": [{"text": {"content": f"{week_data['training_days']}"}}]},
        "Date": {"date": date_range}
    }):
        print(f"      ✅ Set to: {week_data['training_days']}/7 days")
        success_count += 1

    # 2. Meditation Sessions
    print(f"\n   📝 Updating: Meditation Sessions")
    if update_notion_page(GOAL_PAGE_IDS["meditation"], {
        "Count": {"rich_text": [{"text": {"content": f"{week_data['meditation_count']}"}}]},
        "Date": {"date": date_range}
    }):
        print(f"      ✅ Set to: {week_data['meditation_count']}/10 sessions")
        success_count += 1

    # 3. Wake Time Average
    wake_time = format_time(week_data["avg_wake"])
    print(f"\n   📝 Updating: Wake Time (Average)")
    if update_notion_page(GOAL_PAGE_IDS["wake_time_avg"], {
        "Hours": {"rich_text": [{"text": {"content": wake_time}}]},
        "Date": {"date": date_range}
    }):
        print(f"      ✅ Set to: {wake_time}")
        success_count += 1

    # 4. Wake Time Std Dev
    wake_std = format_time_minutes(week_data["std_wake"])
    print(f"\n   📝 Updating: Wake Time (Std Deviation)")
    if update_notion_page(GOAL_PAGE_IDS["wake_time_std"], {
        "Hours": {"rich_text": [{"text": {"content": wake_std}}]},
        "Date": {"date": date_range}
    }):
        print(f"      ✅ Set to: {wake_std}")
        success_count += 1

    # 5. Workout Time Average
    workout_time = format_time(week_data["avg_workout"])
    print(f"\n   📝 Updating: Workout Time (Average)")
    if update_notion_page(GOAL_PAGE_IDS["workout_time_avg"], {
        "Hours": {"rich_text": [{"text": {"content": workout_time}}]},
        "Date": {"date": date_range}
    }):
        print(f"      ✅ Set to: {workout_time}")
        success_count += 1

    # 6. Workout Time Std Dev
    workout_std = format_time_minutes(week_data["std_workout"])
    print(f"\n   📝 Updating: Workout Time (Std Deviation)")
    if update_notion_page(GOAL_PAGE_IDS["workout_time_std"], {
        "Hours": {"rich_text": [{"text": {"content": workout_std}}]},
        "Date": {"date": date_range}
    }):
        print(f"      ✅ Set to: {workout_std}")
        success_count += 1

    # 7. Sleep Start Time Average
    sleep_time = format_time(week_data["avg_sleep_start"])
    print(f"\n   📝 Updating: Sleep Start Time (Average)")
    if update_notion_page(GOAL_PAGE_IDS["sleep_time_avg"], {
        "Hours": {"rich_text": [{"text": {"content": sleep_time}}]},
        "Date": {"date": date_range}
    }):
        print(f"      ✅ Set to: {sleep_time}")
        success_count += 1

    # 8. Sleep Start Time Std Dev
    sleep_std = format_time_minutes(week_data["std_sleep_start"])
    print(f"\n   📝 Updating: Sleep Start Time (Std Deviation)")
    if update_notion_page(GOAL_PAGE_IDS["sleep_time_std"], {
        "Hours": {"rich_text": [{"text": {"content": sleep_std}}]},
        "Date": {"date": date_range}
    }):
        print(f"      ✅ Set to: {sleep_std}")
        success_count += 1

    print("\n" + "=" * 80)
    print(f"✅ Successfully updated {success_count}/8 goal pages for week {week_label}")
    print("=" * 80)

    print("\n💡 Check your Notion database - the pages should now show last week's data!")


if __name__ == "__main__":
    asyncio.run(main())
