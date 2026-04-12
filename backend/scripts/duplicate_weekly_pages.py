#!/usr/bin/env python3
"""
Create weekly Notion pages from 9 consolidated identity templates.

Modes:
1. Default: create pages for the current week.
2. --test: create pages for next week.
3. --week-start YYYY-MM-DD: create pages for one specific historical week.
4. --from-summary-all: create pages for every week present in weekly_habits_summary.

The script skips weeks that already have pages unless --force is provided.
"""
import argparse
import asyncio
import os
from datetime import datetime, timedelta, date

import requests
from sqlalchemy import text

from app.config.database import async_session_factory

IDENTITY_TEMPLATES = [
    {
        "emoji": "🏋️",
        "identity": "I am an athlete",
        "goal": "Athletes show up — the sessions follow",
        "system": "Training is my default, not my exception",
        "constraints": "Gym bag always ready; no excuses on low-energy days",
        "metric": "Training sessions",
        "metric_type": "Count",
        "area": ["Health"],
    },
    {
        "emoji": "⏰",
        "identity": "I train at the same time daily",
        "goal": "Same time, every day — that's just what I do",
        "system": "Breakfast → bike → gym — it's automatic",
        "constraints": "No meetings before 11 AM",
        "metric": "Average workout time + consistency",
        "metric_type": "Hours + Std",
        "area": ["Health"],
    },
    {
        "emoji": "🧘",
        "identity": "I live in the present",
        "goal": "Present people make space for stillness",
        "system": "Two pauses per day to reset",
        "constraints": "Phone off during meditation",
        "metric": "Meditation sessions",
        "metric_type": "Count",
        "area": ["Health"],
    },
    {
        "emoji": "🌅",
        "identity": "I wake at the same time daily",
        "goal": "Consistency builds a stable foundation",
        "system": "My alarm is a promise I keep to myself",
        "constraints": "No screens after 11 PM",
        "metric": "Average wake time + consistency",
        "metric_type": "Hours + Std",
        "area": ["Health"],
    },
    {
        "emoji": "🌙",
        "identity": "I sleep at the same time nightly",
        "goal": "Sleep is preparation, not leftover time",
        "system": "Evening ritual → lights out",
        "constraints": "Bedroom is for sleep only",
        "metric": "Average sleep time + consistency",
        "metric_type": "Hours + Std",
        "area": ["Health"],
    },
    {
        "emoji": "🌆",
        "identity": "I close my day with intention",
        "goal": "I end my day ready to recover",
        "system": "Clean body, clean mind, clean cutoff",
        "constraints": "Shower before bed, no exceptions",
        "metric": "Days ended with intention",
        "metric_type": "Count",
        "area": ["Health"],
    },
    {
        "emoji": "🎯",
        "identity": "I am a focused builder",
        "goal": "Focused builders create in long blocks",
        "system": "One task, full attention — that's how I work",
        "constraints": "Phone in another room during deep work",
        "metric": "Deep work sessions + hours",
        "metric_type": "Count + Hours",
        "area": ["Work"],
    },
    {
        "emoji": "📵",
        "identity": "I protect my attention",
        "goal": "Distractions don't deserve my time",
        "system": "My phone is a tool, not an escape",
        "constraints": "No short-form apps on phone",
        "metric": "Screen time under limit",
        "metric_type": "Count",
        "area": ["Work"],
    },
    {
        "emoji": "🚀",
        "identity": "I build by shipping",
        "goal": "Builders ship — planning alone is dreaming",
        "system": "Done > perfect",
        "constraints": "Ship something every week, no matter how small",
        "metric": "Features/commits shipped",
        "metric_type": "Count",
        "area": ["Work"],
    },
]

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

if not NOTION_TOKEN or not DATABASE_ID:
    raise ValueError(
        "❌ Missing required environment variables!\n"
        "Please set:\n"
        '  export NOTION_TOKEN="ntn_..."\n'
        '  export NOTION_DATABASE_ID="2e3e98e3..."\n'
    )

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
}


def get_week_bounds(dt: datetime) -> tuple[datetime, datetime]:
    days_since_sunday = dt.weekday() + 1
    if dt.weekday() == 6:
        days_since_sunday = 0
    week_start = (dt - timedelta(days=days_since_sunday)).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=6)
    return week_start, week_end


def check_pages_exist_for_week(week_start_date: str) -> list[dict]:
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    payload = {
        "filter": {
            "property": "Date",
            "date": {"equals": week_start_date}
        },
        "page_size": 100,
    }
    response = requests.post(url, headers=HEADERS, json=payload)
    response.raise_for_status()
    return response.json().get("results", [])


def create_page_from_template(template: dict, week_start: str, week_end: str) -> bool:
    url = "https://api.notion.com/v1/pages"
    properties = {
        "Identity": {"title": [{"text": {"content": template["identity"]}}]},
        "Goal (Outcome)": {"rich_text": [{"text": {"content": template["goal"]}}]},
        "Constraints / Environment (Friction Rules)": {"rich_text": [{"text": {"content": template["constraints"]}}]},
        "Weekly Metric": {"rich_text": [{"text": {"content": template["metric"]}}]},
        "Metric Type": {"rich_text": [{"text": {"content": template["metric_type"]}}]},
        "Area": {"multi_select": [{"name": area} for area in template["area"]]},
        "Date": {"date": {"start": week_start, "end": week_end}},
        "Hours": {"rich_text": []},
        "Count": {"rich_text": []},
    }

    # Std field exists on newer consolidated pages but not on the earliest ones.
    properties["Std"] = {"rich_text": []}

    payload = {
        "parent": {"database_id": DATABASE_ID},
        "properties": properties,
        "icon": {"type": "emoji", "emoji": template["emoji"]},
    }

    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as exc:
        print(f"   ❌ Error: {exc}")
        if hasattr(exc, 'response') and exc.response is not None:
            print(f"      Response: {exc.response.text}")
        return False


async def summary_weeks() -> list[tuple[date, date]]:
    async with async_session_factory() as db:
        res = await db.execute(text("""
            SELECT week_start_date, week_end_date
            FROM weekly_habits_summary
            ORDER BY week_start_date
        """))
        return [(row[0], row[1]) for row in res.fetchall()]


async def create_for_week(week_start: date, week_end: date, force: bool) -> tuple[int, int, bool]:
    existing_pages = check_pages_exist_for_week(week_start.isoformat())
    if existing_pages and not force:
        print(f"   ⏭️  {week_start} already has {len(existing_pages)} pages — skipping")
        return (0, 0, True)

    if existing_pages and force:
        print(f"   ⚠️  {week_start} already has {len(existing_pages)} pages — creating anyway due to --force")

    success_count = 0
    for template in IDENTITY_TEMPLATES:
        if create_page_from_template(template, week_start.isoformat(), week_end.isoformat()):
            success_count += 1
    return (success_count, len(IDENTITY_TEMPLATES), False)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Create weekly Notion pages from identity templates")
    parser.add_argument("--test", action="store_true", help="Create pages for next week instead of current week")
    parser.add_argument("--force", action="store_true", help="Create pages even if the target week already exists")
    parser.add_argument("--week-start", help="Specific week start date (Sunday) in YYYY-MM-DD format")
    parser.add_argument("--from-summary-all", action="store_true", help="Create pages for every week present in weekly_habits_summary")
    args = parser.parse_args()

    print("=" * 100)
    print("📋 Create Weekly Notion Pages from 9 Identity Templates")
    print("=" * 100)

    targets: list[tuple[date, date]] = []
    if args.from_summary_all:
        targets = await summary_weeks()
    elif args.week_start:
        ws = datetime.fromisoformat(args.week_start).date()
        targets = [(ws, ws + timedelta(days=6))]
    else:
        today = datetime.now()
        current_week_start, current_week_end = get_week_bounds(today)
        if args.test:
            target_week_start = current_week_start + timedelta(days=7)
            target_week_end = current_week_end + timedelta(days=7)
        else:
            target_week_start = current_week_start
            target_week_end = current_week_end
        targets = [(target_week_start.date(), target_week_end.date())]

    created_weeks = 0
    skipped_weeks = 0
    total_created_pages = 0

    for week_start, week_end in targets:
        print(f"\n📅 Processing week: {week_start} to {week_end}")
        created, attempted, skipped = await create_for_week(week_start, week_end, args.force)
        total_created_pages += created
        if skipped:
            skipped_weeks += 1
        elif created:
            created_weeks += 1
            print(f"   ✅ Created {created}/{attempted} pages")
        else:
            print("   ❌ No pages created")

    print("\n" + "=" * 100)
    print(f"✅ Created {total_created_pages} pages across {created_weeks} weeks")
    print(f"⏭️  Skipped {skipped_weeks} weeks that already existed")
    print("=" * 100)


if __name__ == "__main__":
    asyncio.run(main())
