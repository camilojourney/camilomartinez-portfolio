#!/usr/bin/env python3
"""
Clean up 2026 Notion pages - delete pages outside 9 core identities and merge duplicates

The 9 core identities to keep:
1. I am an athlete
2. I train at the same time daily
3. I live in the present
4. I wake at the same time daily
5. I sleep at the same time nightly
6. I close my day with intention
7. I am a focused builder
8. I protect my attention
9. I build by shipping
"""
import os
import requests

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

if not NOTION_TOKEN or not DATABASE_ID:
    raise ValueError("Missing NOTION_TOKEN or NOTION_DATABASE_ID")

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}

# The 9 core identities we want to keep
CORE_IDENTITIES = {
    "I am an athlete",
    "I train at the same time daily",
    "I live in the present",
    "I wake at the same time daily",
    "I sleep at the same time nightly",
    "I close my day with intention",
    "I am a focused builder",
    "I protect my attention",
    "I build by shipping",
}

# Map old identity names to new ones (for pages not yet migrated)
IDENTITY_RENAMES = {
    "I like consistency of my workouts": "I train at the same time daily",
    "I like to sleep to recover  my body": "I sleep at the same time nightly",
    "I close my day cleanly and recover like an athlete": "I close my day with intention",
    "I start my day intentionally": "I wake at the same time daily",
}


def get_all_2026_pages():
    """Fetch all 2026 pages"""
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    all_pages = []
    has_more = True
    start_cursor = None

    while has_more:
        body = {
            "page_size": 100,
            "filter": {"property": "Date", "date": {"on_or_after": "2026-01-01"}}
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
    """Extract info from page"""
    props = page.get("properties", {})
    identity_prop = props.get("Identity", {}).get("title", [])
    identity = identity_prop[0]["plain_text"] if identity_prop else "Unknown"
    date_prop = props.get("Date", {}).get("date", {})
    date = date_prop.get("start", "") if date_prop else ""

    # Get data values
    hours = props.get("Hours", {}).get("rich_text", [])
    hours_val = hours[0]["plain_text"] if hours else ""
    count = props.get("Count", {}).get("rich_text", [])
    count_val = count[0]["plain_text"] if count else ""
    std = props.get("Std", {}).get("rich_text", [])
    std_val = std[0]["plain_text"] if std else ""

    return {
        "id": page["id"],
        "identity": identity,
        "date": date,
        "hours": hours_val,
        "count": count_val,
        "std": std_val,
    }


def rename_page(page_id, new_identity):
    """Rename a page's identity"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    payload = {
        "properties": {
            "Identity": {"title": [{"text": {"content": new_identity}}]}
        }
    }
    response = requests.patch(url, headers=HEADERS, json=payload)
    return response.status_code == 200


def merge_pages(primary_id, secondary_pages):
    """Merge data from secondary pages into primary, then delete secondaries"""
    # Collect data from all pages
    hours = None
    count = None
    std = None

    for page in secondary_pages:
        if page["hours"] and not hours:
            hours = page["hours"]
        if page["count"] and not count:
            count = page["count"]
        if page["std"] and not std:
            std = page["std"]

    # Update primary with merged data
    url = f"https://api.notion.com/v1/pages/{primary_id}"
    properties = {}
    if hours:
        properties["Hours"] = {"rich_text": [{"text": {"content": hours}}]}
    if count:
        properties["Count"] = {"rich_text": [{"text": {"content": count}}]}
    if std:
        properties["Std"] = {"rich_text": [{"text": {"content": std}}]}

    if properties:
        requests.patch(url, headers=HEADERS, json={"properties": properties})

    # Delete secondary pages
    deleted = 0
    for page in secondary_pages[1:]:  # Skip first (primary)
        delete_url = f"https://api.notion.com/v1/pages/{page['id']}"
        resp = requests.patch(delete_url, headers=HEADERS, json={"archived": True})
        if resp.status_code == 200:
            deleted += 1

    return deleted


def delete_page(page_id):
    """Archive a page"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    response = requests.patch(url, headers=HEADERS, json={"archived": True})
    return response.status_code == 200


def main():
    print("=" * 80)
    print("🧹 Cleaning up 2026 Notion Pages")
    print("=" * 80)
    print()

    pages = get_all_2026_pages()
    print(f"Found {len(pages)} pages")
    print()

    # Group by week
    pages_by_week = {}
    for page in pages:
        info = get_page_info(page)
        week = info["date"]
        if week not in pages_by_week:
            pages_by_week[week] = []
        pages_by_week[week].append(info)

    deleted_count = 0
    renamed_count = 0
    merged_count = 0

    for week, week_pages in sorted(pages_by_week.items()):
        print(f"\n📅 Week: {week}")

        # First pass: rename pages that need renaming
        for page in week_pages:
            if page["identity"] in IDENTITY_RENAMES:
                new_name = IDENTITY_RENAMES[page["identity"]]
                if rename_page(page["id"], new_name):
                    print(f"   ✏️  Renamed: {page['identity']} → {new_name}")
                    page["identity"] = new_name
                    renamed_count += 1

        # Group by identity
        by_identity = {}
        for page in week_pages:
            identity = page["identity"]
            if identity not in by_identity:
                by_identity[identity] = []
            by_identity[identity].append(page)

        # Second pass: delete non-core identities, merge duplicates
        for identity, identity_pages in by_identity.items():
            if identity not in CORE_IDENTITIES:
                # Delete all pages for non-core identities
                for page in identity_pages:
                    if delete_page(page["id"]):
                        print(f"   🗑️  Deleted: {identity}")
                        deleted_count += 1
            elif len(identity_pages) > 1:
                # Merge duplicates
                merged = merge_pages(identity_pages[0]["id"], identity_pages)
                if merged > 0:
                    print(f"   🔄 Merged {len(identity_pages)} → 1: {identity}")
                    merged_count += merged

    print()
    print("=" * 80)
    print(f"✅ Cleanup complete!")
    print(f"   • Renamed: {renamed_count} pages")
    print(f"   • Merged: {merged_count} duplicates")
    print(f"   • Deleted: {deleted_count} non-core pages")
    print("=" * 80)


if __name__ == "__main__":
    main()
