#!/usr/bin/env python3
"""
Duplicate all Notion pages from one week to create templates for new weeks

This script:
1. Fetches all pages from a source week (default: current week)
2. Creates exact duplicates with new date ranges
3. Preserves all properties: emojis, Goals, Systems, Constraints, Areas, etc.
4. ONLY updates the Date field and clears Hours/Count fields for data to be filled
"""
import asyncio
import os
import requests
from datetime import datetime, timedelta
from typing import Optional

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


def fetch_pages_for_week(week_start_date: str) -> list[dict]:
    """
    Fetch all pages from Notion database for a specific week

    Args:
        week_start_date: ISO format date string (YYYY-MM-DD) for Sunday

    Returns:
        List of page objects from Notion API
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


def duplicate_page(source_page: dict, new_week_start: str, new_week_end: str) -> bool:
    """
    Create a duplicate of a page with new date range

    Args:
        source_page: Original page object from Notion API
        new_week_start: New week start date (ISO format)
        new_week_end: New week end date (ISO format)

    Returns:
        True if successful, False otherwise
    """
    url = "https://api.notion.com/v1/pages"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    # Get all properties from source page
    source_props = source_page.get("properties", {})

    # Build new properties - copy everything except Date, Hours, Count
    new_properties = {}

    # Copy Identity (title)
    if "Identity" in source_props:
        new_properties["Identity"] = source_props["Identity"]

    # Copy Goal
    if "Goal (Outcome)" in source_props:
        new_properties["Goal (Outcome)"] = source_props["Goal (Outcome)"]

    # Copy System
    if "System (What I Do Repeatedly)" in source_props:
        new_properties["System (What I Do Repeatedly)"] = source_props["System (What I Do Repeatedly)"]

    # Copy Weekly Metric
    if "Weekly Metric" in source_props:
        new_properties["Weekly Metric"] = source_props["Weekly Metric"]

    # Copy Constraints
    if "Constraints / Environment (Friction Rules)" in source_props:
        new_properties["Constraints / Environment (Friction Rules)"] = source_props["Constraints / Environment (Friction Rules)"]

    # Copy Metric Type
    if "Metric Type" in source_props:
        new_properties["Metric Type"] = source_props["Metric Type"]

    # Copy Area (multi-select)
    if "Area" in source_props:
        new_properties["Area"] = source_props["Area"]

    # Copy YES / NO
    if "YES / NO" in source_props:
        new_properties["YES / NO"] = source_props["YES / NO"]

    # Set NEW date range
    new_properties["Date"] = {
        "date": {
            "start": new_week_start,
            "end": new_week_end
        }
    }

    # Clear Hours and Count fields (will be filled by automation)
    new_properties["Hours"] = {
        "rich_text": []
    }

    new_properties["Count"] = {
        "rich_text": []
    }

    # Build the page payload
    page_payload = {
        "parent": {"database_id": DATABASE_ID},
        "properties": new_properties
    }

    # Copy emoji icon if it exists and is an emoji type
    if "icon" in source_page and source_page["icon"]:
        icon = source_page["icon"]
        # Only copy if it's an emoji type, not a URL
        if icon.get("type") == "emoji":
            page_payload["icon"] = icon

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

    parser = argparse.ArgumentParser(description="Duplicate Notion pages for a new week")
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test mode: Use current week as template and create next week (for mid-week testing)"
    )
    args = parser.parse_args()

    print("=" * 100)
    print("📋 Duplicate Notion Pages for Current Week")
    print("=" * 100)

    # Determine which weeks to use
    # On Sunday: "today's week" is the week that just started (has no data yet)
    today = datetime.now()
    current_week_start, current_week_end = get_week_bounds(today)

    if args.test:
        # Test mode: Use today's week as template, create future week
        # Example: If today is Tuesday Jan 14 (in week Jan 11-17)
        #   Template: Jan 11-17 (the week we're in)
        #   Target: Jan 18-24 (next week)
        print("\n⚠️  TEST MODE: Using current week as template")
        template_week_start = current_week_start
        template_week_end = current_week_end
        target_week_start = current_week_start + timedelta(days=7)
        target_week_end = current_week_end + timedelta(days=7)
    else:
        # Production mode: Use completed week as template, create pages for new week
        # Example: If today is Sunday Jan 18 (start of new week)
        #   Template: Jan 11-17 (the week that just ended - has full 7 days of data)
        #   Target: Jan 18-24 (the week that just started - needs new pages)
        template_week_start = current_week_start - timedelta(days=7)
        template_week_end = current_week_end - timedelta(days=7)
        target_week_start = current_week_start
        target_week_end = current_week_end

    print(f"\n📅 Template week (completed): {template_week_start.date()} to {template_week_end.date()}")
    print(f"📅 Creating pages for (new week): {target_week_start.date()} to {target_week_end.date()}")

    # Fetch all pages from template week
    print(f"\n1️⃣  Fetching template pages from template week...")
    source_pages = fetch_pages_for_week(template_week_start.date().isoformat())

    if not source_pages:
        print(f"   ❌ No pages found for week {template_week_start.date()}")
        print("   💡 Try specifying a different source week that has pages")
        return

    print(f"   ✅ Found {len(source_pages)} pages to duplicate")

    # Duplicate each page for target week
    print(f"\n2️⃣  Creating pages for target week...")
    success_count = 0

    for i, page in enumerate(source_pages, 1):
        props = page.get("properties", {})
        icon = page.get("icon", {})
        emoji = icon.get("emoji", "📄") if icon else "📄"

        identity = props.get("Identity", {}).get("title", [])
        title = identity[0].get("plain_text", "Untitled") if identity else "Untitled"

        print(f"\n   {i}/{len(source_pages)} {emoji} {title}")

        if duplicate_page(
            page,
            target_week_start.date().isoformat(),
            target_week_end.date().isoformat()
        ):
            print(f"      ✅ Created duplicate")
            success_count += 1
        else:
            print(f"      ❌ Failed to create duplicate")

    print("\n" + "=" * 100)
    print(f"✅ Successfully duplicated {success_count}/{len(source_pages)} pages")
    print(f"📅 New pages created for week: {target_week_start.date()} to {target_week_end.date()}")
    print("=" * 100)

    print("\n💡 Next steps:")
    print("   1. Check your Notion database for the new pages")
    print("   2. The GitHub Action will populate Hours/Count fields with Whoop data")
    print("   3. Fill in your weekly review manually")


if __name__ == "__main__":
    asyncio.run(main())
