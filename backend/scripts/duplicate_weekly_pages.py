#!/usr/bin/env python3
"""
Create weekly Notion pages from 9 consolidated identity templates

This script:
1. Creates 9 identity-based pages with Pull motivation language
2. Sets the date range for the new week
3. Clears Hours/Count/Std fields for automation to fill

The 9 consolidated identities:
1. I am an athlete (Training count - Whoop)
2. I train at the same time daily (Avg + Std - Whoop)
3. I live in the present (Meditation count - Whoop)
4. I wake at the same time daily (Avg + Std - Whoop)
5. I sleep at the same time nightly (Avg + Std - Whoop)
6. I close my day with intention (Manual)
7. I am a focused builder (Manual)
8. I protect my attention (Manual)
9. I build by shipping (Manual)
"""
import asyncio
import os
import requests
from datetime import datetime, timedelta
from typing import Optional

# 9 Consolidated Identity Templates with Pull Motivation
IDENTITY_TEMPLATES = [
    {
        "emoji": "🏋️",
        "identity": "I am an athlete",
        "goal": "Athletes show up — the sessions follow",
        "system": "Training is my default, not my exception",
        "metric": "Training sessions",
        "metric_type": "Count",
        "area": ["Health"],
    },
    {
        "emoji": "⏰",
        "identity": "I train at the same time daily",
        "goal": "Same time, every day — that's just what I do",
        "system": "Breakfast → bike → gym — it's automatic",
        "metric": "Average workout time + consistency",
        "metric_type": "Hours + Std",
        "area": ["Health"],
    },
    {
        "emoji": "🧘",
        "identity": "I live in the present",
        "goal": "Present people make space for stillness",
        "system": "Two pauses per day to reset",
        "metric": "Meditation sessions",
        "metric_type": "Count",
        "area": ["Health"],
    },
    {
        "emoji": "🌅",
        "identity": "I wake at the same time daily",
        "goal": "Consistency builds a stable foundation",
        "system": "My alarm is a promise I keep to myself",
        "metric": "Average wake time + consistency",
        "metric_type": "Hours + Std",
        "area": ["Health"],
    },
    {
        "emoji": "🌙",
        "identity": "I sleep at the same time nightly",
        "goal": "Sleep is preparation, not leftover time",
        "system": "Evening ritual → lights out",
        "metric": "Average sleep time + consistency",
        "metric_type": "Hours + Std",
        "area": ["Health"],
    },
    {
        "emoji": "🌆",
        "identity": "I close my day with intention",
        "goal": "I end my day ready to recover",
        "system": "Clean body, clean mind, clean cutoff",
        "metric": "Days ended with intention",
        "metric_type": "Count",
        "area": ["Health"],
    },
    {
        "emoji": "🎯",
        "identity": "I am a focused builder",
        "goal": "Focused builders create in long blocks",
        "system": "One task, full attention — that's how I work",
        "metric": "Deep work hours",
        "metric_type": "Hours",
        "area": ["Work"],
    },
    {
        "emoji": "📵",
        "identity": "I protect my attention",
        "goal": "Distractions don't deserve my time",
        "system": "My phone is a tool, not an escape",
        "metric": "Screen time under limit",
        "metric_type": "Count",
        "area": ["Work"],
    },
    {
        "emoji": "🚀",
        "identity": "I build by shipping",
        "goal": "Builders ship — planning alone is dreaming",
        "system": "Done > perfect",
        "metric": "Features/commits shipped",
        "metric_type": "Count",
        "area": ["Work"],
    },
]

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


def get_week_bounds(date: datetime) -> tuple[datetime, datetime]:
    """
    Get the Sunday-Saturday bounds for a given date.

    Args:
        date: Any date within the week

    Returns:
        Tuple of (week_start Sunday, week_end Saturday)
    """
    # Get the Sunday of the week containing this date
    days_since_sunday = date.weekday() + 1  # Monday=0, so add 1 to get days since Sunday
    if date.weekday() == 6:  # Sunday
        days_since_sunday = 0

    week_start = (date - timedelta(days=days_since_sunday)).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=6)

    return week_start, week_end


def check_pages_exist_for_week(week_start_date: str) -> list[dict]:
    """
    Check if pages already exist for a specific week

    Args:
        week_start_date: ISO format date string (YYYY-MM-DD) for Sunday

    Returns:
        List of existing page objects from Notion API
    """
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    # Filter for pages with this week's start date
    filter_params = {
        "filter": {
            "property": "Date",
            "date": {
                "equals": week_start_date
            }
        },
        "page_size": 100
    }

    response = requests.post(url, headers=headers, json=filter_params)
    response.raise_for_status()
    data = response.json()

    return data.get("results", [])


def create_page_from_template(template: dict, week_start: str, week_end: str) -> bool:
    """
    Create a new Notion page from an identity template

    Args:
        template: Template dict with identity, goal, system, etc.
        week_start: Week start date (ISO format)
        week_end: Week end date (ISO format)

    Returns:
        True if successful, False otherwise
    """
    url = "https://api.notion.com/v1/pages"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    # Build properties from template
    properties = {
        # Identity (title field)
        "Identity": {
            "title": [{"text": {"content": template["identity"]}}]
        },
        # Goal
        "Goal (Outcome)": {
            "rich_text": [{"text": {"content": template["goal"]}}]
        },
        # System
        "System (What I Do Repeatedly)": {
            "rich_text": [{"text": {"content": template["system"]}}]
        },
        # Weekly Metric
        "Weekly Metric": {
            "rich_text": [{"text": {"content": template["metric"]}}]
        },
        # Metric Type
        "Metric Type": {
            "rich_text": [{"text": {"content": template["metric_type"]}}]
        },
        # Area (multi-select)
        "Area": {
            "multi_select": [{"name": area} for area in template["area"]]
        },
        # Date range
        "Date": {
            "date": {
                "start": week_start,
                "end": week_end
            }
        },
        # Clear data fields (will be filled by automation or manually)
        "Hours": {"rich_text": []},
        "Count": {"rich_text": []},
    }

    # Build the page payload
    page_payload = {
        "parent": {"database_id": DATABASE_ID},
        "properties": properties,
        "icon": {"type": "emoji", "emoji": template["emoji"]}
    }

    # Create the new page
    try:
        response = requests.post(url, headers=headers, json=page_payload)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"      Response: {e.response.text}")
        return False


async def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(description="Create weekly Notion pages from identity templates")
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test mode: Create pages for next week instead of current week"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force creation even if pages already exist for the target week"
    )
    args = parser.parse_args()

    print("=" * 100)
    print("📋 Create Weekly Notion Pages from 9 Identity Templates")
    print("=" * 100)

    # Determine target week
    today = datetime.now()
    current_week_start, current_week_end = get_week_bounds(today)

    if args.test:
        # Test mode: Create pages for next week
        print("\n⚠️  TEST MODE: Creating pages for next week")
        target_week_start = current_week_start + timedelta(days=7)
        target_week_end = current_week_end + timedelta(days=7)
    else:
        # Production mode: Create pages for the current week (the week that just started)
        target_week_start = current_week_start
        target_week_end = current_week_end

    print(f"\n📅 Creating pages for week: {target_week_start.date()} to {target_week_end.date()}")

    # Check if pages already exist for this week
    print(f"\n1️⃣  Checking for existing pages...")
    existing_pages = check_pages_exist_for_week(target_week_start.date().isoformat())

    if existing_pages and not args.force:
        print(f"   ⚠️  Found {len(existing_pages)} pages already exist for this week!")
        print("   💡 Use --force to create anyway (will result in duplicates)")
        return

    if existing_pages:
        print(f"   ⚠️  Found {len(existing_pages)} existing pages, but --force flag set")
    else:
        print("   ✅ No existing pages found")

    # Create pages from templates
    print(f"\n2️⃣  Creating {len(IDENTITY_TEMPLATES)} identity pages...")
    success_count = 0

    for i, template in enumerate(IDENTITY_TEMPLATES, 1):
        print(f"\n   {i}/{len(IDENTITY_TEMPLATES)} {template['emoji']} {template['identity']}")

        if create_page_from_template(
            template,
            target_week_start.date().isoformat(),
            target_week_end.date().isoformat()
        ):
            print(f"      ✅ Created")
            success_count += 1
        else:
            print(f"      ❌ Failed")

    print("\n" + "=" * 100)
    print(f"✅ Successfully created {success_count}/{len(IDENTITY_TEMPLATES)} identity pages")
    print(f"📅 Pages created for week: {target_week_start.date()} to {target_week_end.date()}")
    print("=" * 100)

    print("\n💡 What's next:")
    print("   • 5 pages will be auto-filled by Whoop data (athlete, train time, present, wake time, sleep time)")
    print("   • 4 pages need manual tracking (close day, focused builder, protect attention, build by shipping)")


if __name__ == "__main__":
    asyncio.run(main())
