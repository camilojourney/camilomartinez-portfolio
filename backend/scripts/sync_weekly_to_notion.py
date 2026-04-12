#!/usr/bin/env python3
"""
Update existing Notion pages with weekly Whoop data.

Modes:
1. Default: sync the most recently completed week only.
2. --all: sync every week available in weekly_habits_summary.

This script updates the 5 Whoop-related identities:
- I am an athlete → Count (training sessions)
- I live in the present → Count (meditation sessions)
- I train at the same time daily → Hours (avg) + Std (deviation)
- I wake at the same time daily → Hours (avg) + Std (deviation)
- I sleep at the same time nightly → Hours (avg) + Std (deviation)

DO NOT create new pages - only update existing ones.
"""
import argparse
import asyncio
import os
from datetime import date, timedelta

import requests
from sqlalchemy import text

from app.config.database import async_session_factory

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

WHOOP_IDENTITY_UPDATES = {
    "I am an athlete": lambda row: {"Count": str(row["training"] or 0)},
    "I live in the present": lambda row: {"Count": str(row["meditation"] or 0)},
    "I train at the same time daily": lambda row: {
        "Hours": format_time(row["avg_workout_hour"]),
        "Std": f"{int((row['std_workout_hour'] or 0) * 60)} min",
    },
    "I wake at the same time daily": lambda row: {
        "Hours": format_time(row["avg_wake_hour"]),
        "Std": f"{int((row['std_wake_hour'] or 0) * 60)} min",
    },
    "I sleep at the same time nightly": lambda row: {
        "Hours": format_time(row["avg_sleep_start_hour"]),
        "Std": f"{int((row['std_sleep_start_hour'] or 0) * 60)} min",
    },
}


def format_time(decimal_hour: float | None) -> str:
    if decimal_hour is None:
        return "--:--"
    hours = int(decimal_hour)
    minutes = int((decimal_hour - hours) * 60)
    return f"{hours:02d}:{minutes:02d}"


def get_last_completed_week_bounds(today: date | None = None) -> tuple[date, date]:
    if today is None:
        today = date.today()

    days_since_sunday = today.weekday() + 1
    if today.weekday() == 6:
        days_since_sunday = 0

    current_week_start = today - timedelta(days=days_since_sunday)
    last_week_start = current_week_start - timedelta(days=7)
    last_week_end = last_week_start + timedelta(days=6)
    return last_week_start, last_week_end


async def fetch_summary_rows(all_weeks: bool = False) -> list[dict]:
    expected_week_start, expected_week_end = get_last_completed_week_bounds()

    async with async_session_factory() as db:
        latest_result = await db.execute(text("""
            SELECT week_start_date, week_end_date
            FROM weekly_habits_summary
            ORDER BY week_start_date DESC
            LIMIT 1
        """))
        latest_row = latest_result.fetchone()

        if all_weeks:
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
                ORDER BY week_start_date
            """))
            rows = result.fetchall()
            return [
                {
                    "week_start": row[0],
                    "week_end": row[1],
                    "meditation": row[2] or 0,
                    "training": row[3] or 0,
                    "avg_wake_hour": row[4],
                    "std_wake_hour": row[5],
                    "avg_workout_hour": row[6],
                    "std_workout_hour": row[7],
                    "avg_sleep_start_hour": row[8],
                    "std_sleep_start_hour": row[9],
                }
                for row in rows
            ]

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
            WHERE week_start_date = :expected_week_start
            LIMIT 1
        """), {"expected_week_start": expected_week_start})
        row = result.fetchone()
        if not row:
            latest_week = latest_row[0].isoformat() if latest_row else "none"
            raise RuntimeError(
                "Stale weekly_habits_summary data: "
                f"expected completed week {expected_week_start} → {expected_week_end}, "
                f"but latest available week is {latest_week}. "
                "Daily WHOOP ingestion likely failed; refusing to sync stale data to Notion."
            )

        return [{
            "week_start": row[0],
            "week_end": row[1],
            "meditation": row[2] or 0,
            "training": row[3] or 0,
            "avg_wake_hour": row[4],
            "std_wake_hour": row[5],
            "avg_workout_hour": row[6],
            "std_workout_hour": row[7],
            "avg_sleep_start_hour": row[8],
            "std_sleep_start_hour": row[9],
        }]


def fetch_notion_pages_for_week(week_start: date) -> list[dict]:
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    payload = {
        "filter": {
            "property": "Date",
            "date": {"equals": week_start.isoformat()}
        },
        "page_size": 100,
    }
    response = requests.post(url, headers=HEADERS, json=payload)
    response.raise_for_status()
    return response.json().get("results", [])


def update_notion_page(page_id: str, properties: dict[str, str]) -> None:
    update_url = f"https://api.notion.com/v1/pages/{page_id}"
    payload = {
        "properties": {
            field: {"rich_text": [{"text": {"content": value}}]}
            for field, value in properties.items()
        }
    }
    response = requests.patch(update_url, headers=HEADERS, json=payload)
    response.raise_for_status()


async def main() -> None:
    parser = argparse.ArgumentParser(description="Sync weekly Whoop data into existing Notion pages")
    parser.add_argument("--all", action="store_true", help="Sync all available historical weeks")
    args = parser.parse_args()

    rows = await fetch_summary_rows(all_weeks=args.all)
    total_pages_updated = 0
    total_weeks_updated = 0

    for row in rows:
        week_start = row["week_start"]
        week_end = row["week_end"]
        print("=" * 80)
        print(f"📊 Syncing Whoop Data to Notion for Week: {week_start} to {week_end}")
        print("=" * 80)
        print(f"   Training sessions: {row['training']}")
        print(f"   Meditation sessions: {row['meditation']}")
        print(f"   Avg wake time: {format_time(row['avg_wake_hour'])}")
        print(f"   Avg workout time: {format_time(row['avg_workout_hour'])}")
        print(f"   Avg sleep start: {format_time(row['avg_sleep_start_hour'])}")

        pages = fetch_notion_pages_for_week(week_start)
        if not pages:
            print(f"⚠️  No pages found for week starting {week_start}")
            continue

        print(f"1️⃣  Found {len(pages)} pages for this week")
        updated_this_week = 0

        for page in pages:
            title_prop = page["properties"].get("Identity", {}).get("title", [])
            if not title_prop:
                continue
            identity_name = title_prop[0]["text"]["content"]
            if identity_name not in WHOOP_IDENTITY_UPDATES:
                continue

            fields_to_update = WHOOP_IDENTITY_UPDATES[identity_name](row)
            try:
                update_notion_page(page["id"], fields_to_update)
                values_str = ", ".join(f"{k}={v}" for k, v in fields_to_update.items())
                print(f"   ✅ {identity_name}: {values_str}")
                updated_this_week += 1
                total_pages_updated += 1
            except requests.RequestException as exc:
                print(f"   ❌ Failed to update {identity_name}: {exc}")

        if updated_this_week:
            total_weeks_updated += 1
        print(f"✅ Week updated: {updated_this_week}/5 Whoop identities")
        print()

    print("=" * 80)
    if args.all:
        print(f"✅ Historical sync complete: {total_pages_updated} page updates across {total_weeks_updated} weeks")
    else:
        print(f"✅ Successfully updated {total_pages_updated}/5 Whoop-related identities in Notion")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
