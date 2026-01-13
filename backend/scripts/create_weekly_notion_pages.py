#!/usr/bin/env python3
"""
Create new Notion pages for each weekly metric

This script creates 8 new pages in Notion for each completed week:
- Training days count
- Meditation sessions count  
- Wake time average
- Wake time std deviation
- Workout time average
- Workout time std deviation
- Sleep start time average
- Sleep start time std deviation

Each page is pre-filled with the data, and you can manually add Goal, System, Constraints.
"""
import asyncio
import os
import requests
from datetime import datetime
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


def create_notion_page(title: str, date_range: dict, count: str = None, hours: str = None) -> bool:
    """Create a new Notion page in the database"""
    url = "https://api.notion.com/v1/pages"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    
    properties = {
        "Identity": {"title": [{"text": {"content": title}}]},
        "Date": {"date": date_range},
    }
    
    # Add Count or Hours field depending on what's provided
    if count is not None:
        properties["Count"] = {"rich_text": [{"text": {"content": count}}]}
    
    if hours is not None:
        properties["Hours"] = {"rich_text": [{"text": {"content": hours}}]}
    
    payload = {
        "parent": {"database_id": DATABASE_ID},
        "properties": properties
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
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
    print("📊 Creating New Notion Pages for Last Week")
    print("=" * 80)
    
    # Get last week's data
    print("\n1️⃣  Fetching last week's data from database...")
    week_data = await get_last_week_data()
    
    if not week_data:
        return
    
    week_label = f"{week_data['week_start'].strftime('%b %d')} - {week_data['week_end'].strftime('%b %d, %Y')}"
    print(f"   Found week: {week_label}")
    
    # Date range for the pages
    date_range = {
        "start": week_data["week_start"].isoformat(),
        "end": week_data["week_end"].isoformat()
    }
    
    print("\n2️⃣  Creating new pages...")
    success_count = 0
    
    # 1. Training Days
    print(f"\n   📝 Creating: Training Days ({week_label})")
    if create_notion_page(
        title=f"Training Days - {week_label}",
        date_range=date_range,
        count=f"{week_data['training_days']}"
    ):
        print(f"      ✅ Created with: {week_data['training_days']}/7 days")
        success_count += 1
    
    # 2. Meditation Sessions
    print(f"\n   📝 Creating: Meditation Sessions ({week_label})")
    if create_notion_page(
        title=f"Meditation Sessions - {week_label}",
        date_range=date_range,
        count=f"{week_data['meditation_count']}"
    ):
        print(f"      ✅ Created with: {week_data['meditation_count']}/10 sessions")
        success_count += 1
    
    # 3. Wake Time Average
    wake_time = format_time(week_data["avg_wake"])
    print(f"\n   📝 Creating: Wake Time Average ({week_label})")
    if create_notion_page(
        title=f"Wake Time (Avg) - {week_label}",
        date_range=date_range,
        hours=wake_time
    ):
        print(f"      ✅ Created with: {wake_time}")
        success_count += 1
    
    # 4. Wake Time Std Dev
    wake_std = format_time_minutes(week_data["std_wake"])
    print(f"\n   📝 Creating: Wake Time Std Dev ({week_label})")
    if create_notion_page(
        title=f"Wake Time (Std) - {week_label}",
        date_range=date_range,
        hours=wake_std
    ):
        print(f"      ✅ Created with: {wake_std}")
        success_count += 1
    
    # 5. Workout Time Average
    workout_time = format_time(week_data["avg_workout"])
    print(f"\n   📝 Creating: Workout Time Average ({week_label})")
    if create_notion_page(
        title=f"Workout Time (Avg) - {week_label}",
        date_range=date_range,
        hours=workout_time
    ):
        print(f"      ✅ Created with: {workout_time}")
        success_count += 1
    
    # 6. Workout Time Std Dev
    workout_std = format_time_minutes(week_data["std_workout"])
    print(f"\n   📝 Creating: Workout Time Std Dev ({week_label})")
    if create_notion_page(
        title=f"Workout Time (Std) - {week_label}",
        date_range=date_range,
        hours=workout_std
    ):
        print(f"      ✅ Created with: {workout_std}")
        success_count += 1
    
    # 7. Sleep Start Time Average
    sleep_time = format_time(week_data["avg_sleep_start"])
    print(f"\n   📝 Creating: Sleep Start Time Average ({week_label})")
    if create_notion_page(
        title=f"Sleep Start (Avg) - {week_label}",
        date_range=date_range,
        hours=sleep_time
    ):
        print(f"      ✅ Created with: {sleep_time}")
        success_count += 1
    
    # 8. Sleep Start Time Std Dev
    sleep_std = format_time_minutes(week_data["std_sleep_start"])
    print(f"\n   📝 Creating: Sleep Start Time Std Dev ({week_label})")
    if create_notion_page(
        title=f"Sleep Start (Std) - {week_label}",
        date_range=date_range,
        hours=sleep_std
    ):
        print(f"      ✅ Created with: {sleep_std}")
        success_count += 1
    
    print("\n" + "=" * 80)
    print(f"✅ Successfully created {success_count}/8 new pages for week {week_label}")
    print("=" * 80)
    
    print("\n💡 Check your Notion database - you should see 8 new pages ready for review!")
    print("   You can now manually add Goal, System, and Constraints to each page.")


if __name__ == "__main__":
    asyncio.run(main())
