#!/usr/bin/env python3
"""
Migrate 2026 Notion pages to use the new 9 consolidated identities with Pull motivation

This script:
1. Fetches all 2026 pages from Notion
2. Maps old identities to new consolidated identities
3. Updates pages with new Identity, Goal, System text
4. Preserves existing data (Hours, Count, Std) where applicable
5. Deletes duplicate/redundant pages after merging

Run with: uv run python scripts/migrate_2026_to_new_identities.py
"""
import os
import requests
from datetime import datetime

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

if not NOTION_TOKEN or not DATABASE_ID:
    raise ValueError(
        "❌ Missing required environment variables!\n"
        "Please set:\n"
        "  export NOTION_TOKEN=\"ntn_...\"\n"
        "  export NOTION_DATABASE_ID=\"2e3e98e3...\"\n"
    )

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}

# Mapping from old identities to new consolidated identities
# Format: "old identity substring" -> new identity config
IDENTITY_MAPPING = {
    # ==========================================
    # 1. I am an athlete (Training count)
    # ==========================================
    "I am an athlete": {
        "identity": "I am an athlete",
        "goal": "Athletes show up — the sessions follow",
        "system": "Training is my default, not my exception",
        "emoji": "🏋️",
        "merge_field": "Count",
    },
    "I'm an Athlete": {
        "identity": "I am an athlete",
        "goal": "Athletes show up — the sessions follow",
        "system": "Training is my default, not my exception",
        "emoji": "🏋️",
        "merge_field": "Count",
    },
    "Training Days": {
        "identity": "I am an athlete",
        "goal": "Athletes show up — the sessions follow",
        "system": "Training is my default, not my exception",
        "emoji": "🏋️",
        "merge_field": "Count",
    },
    "Training sessions": {
        "identity": "I am an athlete",
        "goal": "Athletes show up — the sessions follow",
        "system": "Training is my default, not my exception",
        "emoji": "🏋️",
        "merge_field": "Count",
    },

    # ==========================================
    # 2. I train at the same time daily (Workout Avg + Std)
    # ==========================================
    "training time": {
        "identity": "I train at the same time daily",
        "goal": "Same time, every day — that's just what I do",
        "system": "Breakfast → bike → gym — it's automatic",
        "emoji": "⏰",
        "merge_field": "Hours",
    },
    "consistency of my workouts": {
        "identity": "I train at the same time daily",
        "goal": "Same time, every day — that's just what I do",
        "system": "Breakfast → bike → gym — it's automatic",
        "emoji": "⏰",
        "merge_field": "Hours",
    },
    "Workout Time (Avg)": {
        "identity": "I train at the same time daily",
        "goal": "Same time, every day — that's just what I do",
        "system": "Breakfast → bike → gym — it's automatic",
        "emoji": "⏰",
        "merge_field": "Hours",
    },
    "Workout Time (Std)": {
        "identity": "I train at the same time daily",
        "goal": "Same time, every day — that's just what I do",
        "system": "Breakfast → bike → gym — it's automatic",
        "emoji": "⏰",
        "merge_field": "Std",
    },
    "Average Time I start working out": {
        "identity": "I train at the same time daily",
        "goal": "Same time, every day — that's just what I do",
        "system": "Breakfast → bike → gym — it's automatic",
        "emoji": "⏰",
        "merge_field": "Hours",
    },
    "Average std Time I start working out": {
        "identity": "I train at the same time daily",
        "goal": "Same time, every day — that's just what I do",
        "system": "Breakfast → bike → gym — it's automatic",
        "emoji": "⏰",
        "merge_field": "Std",
    },

    # ==========================================
    # 3. I live in the present (Meditation count)
    # ==========================================
    "I live in the present": {
        "identity": "I live in the present",
        "goal": "Present people make space for stillness",
        "system": "Two pauses per day to reset",
        "emoji": "🧘",
        "merge_field": "Count",
    },
    "stillness": {
        "identity": "I live in the present",
        "goal": "Present people make space for stillness",
        "system": "Two pauses per day to reset",
        "emoji": "🧘",
        "merge_field": "Count",
    },
    "Meditation": {
        "identity": "I live in the present",
        "goal": "Present people make space for stillness",
        "system": "Two pauses per day to reset",
        "emoji": "🧘",
        "merge_field": "Count",
    },

    # ==========================================
    # 4. I wake at the same time daily (Wake Avg + Std)
    # ==========================================
    "I wake at the same time daily": {
        "identity": "I wake at the same time daily",
        "goal": "Consistency builds a stable foundation",
        "system": "My alarm is a promise I keep to myself",
        "emoji": "🌅",
        "merge_field": "Hours",
    },
    "start my day intentionally": {
        "identity": "I wake at the same time daily",
        "goal": "Consistency builds a stable foundation",
        "system": "My alarm is a promise I keep to myself",
        "emoji": "🌅",
        "merge_field": "Hours",
    },
    "wake-time": {
        "identity": "I wake at the same time daily",
        "goal": "Consistency builds a stable foundation",
        "system": "My alarm is a promise I keep to myself",
        "emoji": "🌅",
        "merge_field": "Hours",
    },
    "Wake Time (Avg)": {
        "identity": "I wake at the same time daily",
        "goal": "Consistency builds a stable foundation",
        "system": "My alarm is a promise I keep to myself",
        "emoji": "🌅",
        "merge_field": "Hours",
    },
    "Wake Time (Std)": {
        "identity": "I wake at the same time daily",
        "goal": "Consistency builds a stable foundation",
        "system": "My alarm is a promise I keep to myself",
        "emoji": "🌅",
        "merge_field": "Std",
    },
    "Days within wake-time (average": {
        "identity": "I wake at the same time daily",
        "goal": "Consistency builds a stable foundation",
        "system": "My alarm is a promise I keep to myself",
        "emoji": "🌅",
        "merge_field": "Hours",
    },
    "Days within wake-time window (Average standard deviation)": {
        "identity": "I wake at the same time daily",
        "goal": "Consistency builds a stable foundation",
        "system": "My alarm is a promise I keep to myself",
        "emoji": "🌅",
        "merge_field": "Std",
    },

    # ==========================================
    # 5. I sleep at the same time nightly (Sleep Avg + Std)
    # ==========================================
    "I sleep at the same time nightly": {
        "identity": "I sleep at the same time nightly",
        "goal": "Sleep is preparation, not leftover time",
        "system": "Evening ritual → lights out",
        "emoji": "🌙",
        "merge_field": "Hours",
    },
    "sleep to recover": {
        "identity": "I sleep at the same time nightly",
        "goal": "Sleep is preparation, not leftover time",
        "system": "Evening ritual → lights out",
        "emoji": "🌙",
        "merge_field": "Hours",
    },
    "sleep time": {
        "identity": "I sleep at the same time nightly",
        "goal": "Sleep is preparation, not leftover time",
        "system": "Evening ritual → lights out",
        "emoji": "🌙",
        "merge_field": "Hours",
    },
    "Sleep Start (Avg)": {
        "identity": "I sleep at the same time nightly",
        "goal": "Sleep is preparation, not leftover time",
        "system": "Evening ritual → lights out",
        "emoji": "🌙",
        "merge_field": "Hours",
    },
    "Sleep Start (Std)": {
        "identity": "I sleep at the same time nightly",
        "goal": "Sleep is preparation, not leftover time",
        "system": "Evening ritual → lights out",
        "emoji": "🌙",
        "merge_field": "Std",
    },
    "Average Time I start sleeping": {
        "identity": "I sleep at the same time nightly",
        "goal": "Sleep is preparation, not leftover time",
        "system": "Evening ritual → lights out",
        "emoji": "🌙",
        "merge_field": "Hours",
    },
    "Average std Time I start sleeping": {
        "identity": "I sleep at the same time nightly",
        "goal": "Sleep is preparation, not leftover time",
        "system": "Evening ritual → lights out",
        "emoji": "🌙",
        "merge_field": "Std",
    },

    # ==========================================
    # 6. I close my day with intention
    # ==========================================
    "I close my day": {
        "identity": "I close my day with intention",
        "goal": "I end my day ready to recover",
        "system": "Clean body, clean mind, clean cutoff",
        "emoji": "🌆",
        "merge_field": "Count",
    },
    "close my day cleanly": {
        "identity": "I close my day with intention",
        "goal": "I end my day ready to recover",
        "system": "Clean body, clean mind, clean cutoff",
        "emoji": "🌆",
        "merge_field": "Count",
    },
    "evening routine": {
        "identity": "I close my day with intention",
        "goal": "I end my day ready to recover",
        "system": "Clean body, clean mind, clean cutoff",
        "emoji": "🌆",
        "merge_field": "Count",
    },
    "end of the day": {
        "identity": "I close my day with intention",
        "goal": "I end my day ready to recover",
        "system": "Clean body, clean mind, clean cutoff",
        "emoji": "🌆",
        "merge_field": "Count",
    },
    "recover like an athlete": {
        "identity": "I close my day with intention",
        "goal": "I end my day ready to recover",
        "system": "Clean body, clean mind, clean cutoff",
        "emoji": "🌆",
        "merge_field": "Count",
    },

    # ==========================================
    # 7. I am a focused builder (Deep work)
    # ==========================================
    "I am a focused builder": {
        "identity": "I am a focused builder",
        "goal": "Focused builders create in long blocks",
        "system": "One task, full attention — that's how I work",
        "emoji": "🎯",
        "merge_field": "Hours",
    },
    "deep work": {
        "identity": "I am a focused builder",
        "goal": "Focused builders create in long blocks",
        "system": "One task, full attention — that's how I work",
        "emoji": "🎯",
        "merge_field": "Hours",
    },
    "focused builder": {
        "identity": "I am a focused builder",
        "goal": "Focused builders create in long blocks",
        "system": "One task, full attention — that's how I work",
        "emoji": "🎯",
        "merge_field": "Hours",
    },

    # ==========================================
    # 8. I protect my attention (Screen time)
    # ==========================================
    "I protect my attention": {
        "identity": "I protect my attention",
        "goal": "Distractions don't deserve my time",
        "system": "My phone is a tool, not an escape",
        "emoji": "📵",
        "merge_field": "Count",
    },
    "screen time": {
        "identity": "I protect my attention",
        "goal": "Distractions don't deserve my time",
        "system": "My phone is a tool, not an escape",
        "emoji": "📵",
        "merge_field": "Count",
    },
    "phone": {
        "identity": "I protect my attention",
        "goal": "Distractions don't deserve my time",
        "system": "My phone is a tool, not an escape",
        "emoji": "📵",
        "merge_field": "Count",
    },

    # ==========================================
    # 9. I build by shipping
    # ==========================================
    "I build by shipping": {
        "identity": "I build by shipping",
        "goal": "Builders ship — planning alone is dreaming",
        "system": "Done > perfect",
        "emoji": "🚀",
        "merge_field": "Count",
    },
    "ship": {
        "identity": "I build by shipping",
        "goal": "Builders ship — planning alone is dreaming",
        "system": "Done > perfect",
        "emoji": "🚀",
        "merge_field": "Count",
    },
    "commit": {
        "identity": "I build by shipping",
        "goal": "Builders ship — planning alone is dreaming",
        "system": "Done > perfect",
        "emoji": "🚀",
        "merge_field": "Count",
    },
    "intentional with relationships": {
        "identity": "I build by shipping",
        "goal": "Builders ship — planning alone is dreaming",
        "system": "Done > perfect",
        "emoji": "🚀",
        "merge_field": "Count",
    },
}


def get_all_2026_pages():
    """Fetch all pages from 2026"""
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"

    all_pages = []
    has_more = True
    start_cursor = None

    while has_more:
        body = {
            "page_size": 100,
            "filter": {
                "property": "Date",
                "date": {
                    "on_or_after": "2026-01-01"
                }
            }
        }
        if start_cursor:
            body["start_cursor"] = start_cursor

        response = requests.post(url, headers=HEADERS, json=body)
        response.raise_for_status()
        data = response.json()

        all_pages.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        start_cursor = data.get("next_cursor")

    return all_pages


def get_page_info(page):
    """Extract key info from a page"""
    props = page.get("properties", {})

    # Get identity (title)
    identity_prop = props.get("Identity", {}).get("title", [])
    identity = identity_prop[0]["plain_text"] if identity_prop else "Unknown"

    # Get weekly metric
    metric_prop = props.get("Weekly Metric", {}).get("rich_text", [])
    metric = metric_prop[0]["plain_text"] if metric_prop else ""

    # Get date
    date_prop = props.get("Date", {}).get("date", {})
    date_start = date_prop.get("start", "") if date_prop else ""

    # Get Hours value
    hours_prop = props.get("Hours", {}).get("rich_text", [])
    hours = hours_prop[0]["plain_text"] if hours_prop else ""

    # Get Count value
    count_prop = props.get("Count", {}).get("rich_text", [])
    count = count_prop[0]["plain_text"] if count_prop else ""

    # Get icon
    icon = page.get("icon", {})
    emoji = icon.get("emoji", "") if icon and icon.get("type") == "emoji" else ""

    return {
        "id": page["id"],
        "identity": identity,
        "metric": metric,
        "date": date_start,
        "hours": hours,
        "count": count,
        "emoji": emoji,
    }


def find_matching_identity(page_info):
    """Find which new identity this page should map to"""
    identity = page_info["identity"].lower()
    metric = page_info["metric"].lower()

    # Check against all mappings
    for key, config in IDENTITY_MAPPING.items():
        if key.lower() in identity or key.lower() in metric:
            return config

    return None


def update_page(page_id, new_config, preserve_data=None):
    """Update a page with new identity config"""
    url = f"https://api.notion.com/v1/pages/{page_id}"

    properties = {
        "Identity": {
            "title": [{"text": {"content": new_config["identity"]}}]
        },
        "Goal (Outcome)": {
            "rich_text": [{"text": {"content": new_config["goal"]}}]
        },
        "System (What I Do Repeatedly)": {
            "rich_text": [{"text": {"content": new_config["system"]}}]
        },
    }

    # Preserve data if provided
    if preserve_data:
        for field, value in preserve_data.items():
            if value:
                properties[field] = {"rich_text": [{"text": {"content": value}}]}

    payload = {
        "properties": properties,
        "icon": {"type": "emoji", "emoji": new_config["emoji"]}
    }

    response = requests.patch(url, headers=HEADERS, json=payload)
    return response.status_code == 200


def delete_page(page_id):
    """Archive (delete) a page"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    payload = {"archived": True}
    response = requests.patch(url, headers=HEADERS, json=payload)
    return response.status_code == 200


def main():
    print("=" * 80)
    print("🔄 Migrating 2026 Notion Pages to New Identity System")
    print("=" * 80)
    print()

    # Fetch all 2026 pages
    print("1️⃣  Fetching all 2026 pages...")
    pages = get_all_2026_pages()
    print(f"   Found {len(pages)} pages")
    print()

    # Group pages by week and identity for merging
    pages_by_week = {}
    for page in pages:
        info = get_page_info(page)
        week = info["date"]
        if week not in pages_by_week:
            pages_by_week[week] = []
        pages_by_week[week].append(info)

    print(f"2️⃣  Found {len(pages_by_week)} weeks of data")
    print()

    # Process each week
    print("3️⃣  Processing pages...")
    print()

    updated = 0
    deleted = 0
    skipped = 0

    for week, week_pages in sorted(pages_by_week.items()):
        print(f"\n   📅 Week: {week}")

        # Group by target identity for merging
        identity_groups = {}
        for page_info in week_pages:
            config = find_matching_identity(page_info)
            if config:
                target_id = config["identity"]
                if target_id not in identity_groups:
                    identity_groups[target_id] = {"config": config, "pages": []}
                identity_groups[target_id]["pages"].append(page_info)
            else:
                print(f"      ⚠️  No mapping for: {page_info['identity']}")
                skipped += 1

        # Process each identity group
        for target_identity, group in identity_groups.items():
            pages_in_group = group["pages"]
            config = group["config"]

            if len(pages_in_group) == 1:
                # Single page - just update it
                page = pages_in_group[0]
                preserve = {}
                if page["hours"]:
                    preserve["Hours"] = page["hours"]
                if page["count"]:
                    preserve["Count"] = page["count"]

                if update_page(page["id"], config, preserve):
                    print(f"      ✅ Updated: {page['identity']} → {target_identity}")
                    updated += 1
                else:
                    print(f"      ❌ Failed: {page['identity']}")
            else:
                # Multiple pages need merging
                # Keep the first one, merge data from others, delete duplicates
                primary = pages_in_group[0]
                preserve = {}

                # Collect data from all pages
                for page in pages_in_group:
                    if page["hours"] and "Hours" not in preserve:
                        preserve["Hours"] = page["hours"]
                    if page["count"] and "Count" not in preserve:
                        preserve["Count"] = page["count"]
                    # Check if this is a Std page
                    if "std" in page["metric"].lower() and page["hours"]:
                        preserve["Std"] = page["hours"]

                # Update primary page with merged data
                if update_page(primary["id"], config, preserve):
                    print(f"      ✅ Merged {len(pages_in_group)} pages → {target_identity}")
                    updated += 1

                    # Delete duplicate pages
                    for page in pages_in_group[1:]:
                        if delete_page(page["id"]):
                            print(f"         🗑️  Deleted duplicate: {page['identity']}")
                            deleted += 1
                else:
                    print(f"      ❌ Failed to merge: {target_identity}")

    print()
    print("=" * 80)
    print(f"✅ Migration complete!")
    print(f"   • Updated: {updated} pages")
    print(f"   • Deleted: {deleted} duplicates")
    print(f"   • Skipped: {skipped} (no mapping)")
    print("=" * 80)


if __name__ == "__main__":
    main()
