#!/usr/bin/env python3
"""
Test Notion API connection and explore database structure
"""
import requests
import json
import os

# Notion credentials from environment variables
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "2e3e98e30a3080c6a15ae087562cf137")

def test_notion_connection():
    """Test connection to Notion API and retrieve database structure"""

    # Test 1: Get database schema
    print("=" * 80)
    print("TEST 1: Retrieving Database Schema")
    print("=" * 80)

    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": "2022-06-28"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        database_info = response.json()

        print(f"\n✅ Connection successful!")
        print(f"Database Title: {database_info.get('title', [{}])[0].get('plain_text', 'N/A')}")
        print(f"\nDatabase Properties (Columns):")
        print("-" * 80)

        properties = database_info.get('properties', {})
        for prop_name, prop_details in properties.items():
            prop_type = prop_details.get('type', 'unknown')
            print(f"  • {prop_name:30} → Type: {prop_type}")

            # Show options for select/status properties
            if prop_type in ['select', 'multi_select']:
                options = prop_details.get(prop_type, {}).get('options', [])
                if options:
                    print(f"    Options: {', '.join([opt['name'] for opt in options])}")

        print("\n" + "=" * 80)
        print("TEST 2: Querying Existing Pages (first 5)")
        print("=" * 80)

        # Test 2: Query some existing pages
        query_url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
        query_body = {
            "page_size": 5,
            "sorts": [
                {
                    "timestamp": "created_time",
                    "direction": "descending"
                }
            ]
        }

        response = requests.post(query_url, headers=headers, json=query_body)
        response.raise_for_status()
        query_results = response.json()

        pages = query_results.get('results', [])
        print(f"\nFound {len(pages)} recent pages:")
        print("-" * 80)

        for i, page in enumerate(pages, 1):
            page_props = page.get('properties', {})
            print(f"\nPage {i}:")
            for prop_name, prop_value in page_props.items():
                prop_type = prop_value.get('type')

                # Extract value based on type
                if prop_type == 'title':
                    value = prop_value.get('title', [{}])[0].get('plain_text', 'N/A')
                elif prop_type == 'rich_text':
                    value = prop_value.get('rich_text', [{}])[0].get('plain_text', 'N/A') if prop_value.get('rich_text') else 'Empty'
                elif prop_type == 'number':
                    value = prop_value.get('number', 'N/A')
                elif prop_type == 'select':
                    value = prop_value.get('select', {}).get('name', 'N/A') if prop_value.get('select') else 'Empty'
                elif prop_type == 'status':
                    value = prop_value.get('status', {}).get('name', 'N/A') if prop_value.get('status') else 'Empty'
                elif prop_type == 'date':
                    date_obj = prop_value.get('date', {})
                    value = date_obj.get('start', 'N/A') if date_obj else 'Empty'
                elif prop_type == 'checkbox':
                    value = prop_value.get('checkbox', False)
                else:
                    value = f"<{prop_type}>"

                print(f"  {prop_name:30} = {value}")

        # Save full schema to file for reference
        print("\n" + "=" * 80)
        print("Saving full schema to 'notion_schema.json'")
        print("=" * 80)

        with open('/Users/camilomartinez/github/1-camilomartinez-portfolio/backend/scripts/notion_schema.json', 'w') as f:
            json.dump(database_info, f, indent=2)
        print("✅ Schema saved!")

        return database_info, pages

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None, None

if __name__ == "__main__":
    test_notion_connection()
