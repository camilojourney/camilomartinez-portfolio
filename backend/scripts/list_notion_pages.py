#!/usr/bin/env python3
"""List all pages in Notion database to understand structure"""
import requests
import json
import os

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "2e3e98e30a3080c6a15ae087562cf137")

def list_all_pages():
    """List all pages in the database"""
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    all_pages = []
    has_more = True
    start_cursor = None

    while has_more:
        body = {"page_size": 100}
        if start_cursor:
            body["start_cursor"] = start_cursor

        response = requests.post(url, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()

        all_pages.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        start_cursor = data.get("next_cursor")

    print(f"Found {len(all_pages)} pages\n")
    print("=" * 100)

    for i, page in enumerate(all_pages, 1):
        props = page.get("properties", {})

        # Get title (Identity field)
        identity = props.get("Identity", {}).get("title", [])
        title = identity[0].get("plain_text", "N/A") if identity else "N/A"

        # Get other key fields
        goal = props.get("Goal (Outcome)", {}).get("rich_text", [])
        goal_text = goal[0].get("plain_text", "") if goal else ""

        system = props.get("System (What I Do Repeatedly)", {}).get("rich_text", [])
        system_text = system[0].get("plain_text", "") if system else ""

        metric = props.get("Weekly Metric", {}).get("rich_text", [])
        metric_text = metric[0].get("plain_text", "") if metric else ""

        count = props.get("Count", {}).get("rich_text", [])
        count_text = count[0].get("plain_text", "") if count else ""

        hours = props.get("Hours", {}).get("rich_text", [])
        hours_text = hours[0].get("plain_text", "") if hours else ""

        date = props.get("Date", {}).get("date", {})
        date_str = f"{date.get('start', 'N/A')}" if date else "N/A"

        print(f"\n{i}. [{title}]")
        print(f"   ID: {page['id']}")
        print(f"   Date: {date_str}")
        print(f"   Goal: {goal_text[:80]}...")
        print(f"   System: {system_text[:80]}...")
        print(f"   Metric: {metric_text[:80]}...")
        print(f"   Count: {count_text}")
        print(f"   Hours: {hours_text}")
        print("-" * 100)

if __name__ == "__main__":
    list_all_pages()
