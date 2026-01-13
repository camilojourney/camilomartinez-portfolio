# Weekly Review Notion Automation

## Overview

This automation updates your "My Week" Notion database with properly formatted weekly review pages.

## What it does

1. **Calculates the last completed week** (Sunday → Saturday in NY timezone)
2. **Finds or creates a page** for that week in your Notion database
3. **Updates the page** with:
   - Title in Spanish format: "Dic 21 - 27 / 2025"
   - Date range (Sunday start → Saturday end)
   - Quarter information (e.g., "Q4 Oct 1 - Dic 31")

## Files

- `update_weekly_review_page.py` - Main script to update weekly review pages
- `test_weekly_review_dates.py` - Test script for date calculations

## Setup

### Environment Variables

```bash
export NOTION_TOKEN="ntn_..."
export NOTION_WEEKLY_REVIEW_DATABASE_ID="0ec996bbe6d5459f83fe548dbaaaca51"
```

### Database Properties

The script expects these properties in your Notion database:
- `Name` (title) - The week title
- `Date` (date range) - Sunday start → Saturday end
- `Quarter` (rich_text) - Quarter information

## Usage

### Run Manually

```bash
cd backend
export NOTION_TOKEN="ntn_..."
export NOTION_WEEKLY_REVIEW_DATABASE_ID="0ec996bbe6d5459f83fe548dbaaaca51"
uv run python scripts/update_weekly_review_page.py
```

### Run Tests

```bash
cd backend
uv run python scripts/test_weekly_review_dates.py
```

## How it Works

### Last Completed Week Logic

The script always targets the **last completed** Sunday-Saturday week:

- **If today is Sunday (Jan 11)**: Last week was Jan 4-10
- **If today is Tuesday (Jan 14)**: Last week was Jan 4-10
- **If today is Saturday (Jan 17)**: Last week was Jan 4-10
- **If today is Sunday (Jan 18)**: Last week was Jan 11-17

### Title Format

Titles use Spanish month abbreviations:

- January → "Ene"
- February → "Feb"
- March → "Mar"
- April → "Abr"
- May → "May"
- June → "Jun"
- July → "Jul"
- August → "Ago"
- September → "Sep"
- October → "Oct"
- November → "Nov"
- December → "Dic"

Example titles:
- "Ene 4 - 10 / 2026"
- "Dic 21 - 27 / 2025"
- "Jun 15 - 21 / 2024"

### Quarter Calculation

The script automatically determines the quarter based on the week's start date:

- Q1: Jan 1 - Mar 31 → "Q1 Ene 1 - Mar 31"
- Q2: Apr 1 - Jun 30 → "Q2 Abr 1 - Jun 30"
- Q3: Jul 1 - Sep 30 → "Q3 Jul 1 - Sep 30"
- Q4: Oct 1 - Dec 31 → "Q4 Oct 1 - Dic 31"

## Examples

### Example 1: Running on Sunday

```
Today: Sunday, January 11, 2026
Last completed week: Sunday, January 4 → Saturday, January 10

Result:
- Title: "Ene 4 - 10 / 2026"
- Date: 2026-01-04 → 2026-01-10
- Quarter: "Q1 Ene 1 - Mar 31"
```

### Example 2: Running mid-week

```
Today: Wednesday, January 14, 2026
Last completed week: Sunday, January 4 → Saturday, January 10

Result:
- Title: "Ene 4 - 10 / 2026"
- Date: 2026-01-04 → 2026-01-10
- Quarter: "Q1 Ene 1 - Mar 31"
```

### Example 3: Year-end week

```
Today: Sunday, December 28, 2025
Last completed week: Sunday, December 21 → Saturday, December 27

Result:
- Title: "Dic 21 - 27 / 2025"
- Date: 2025-12-21 → 2025-12-27
- Quarter: "Q4 Oct 1 - Dic 31"
```

## Automation

### GitHub Actions

To run this weekly on Sundays, add to your `.github/workflows/weekly-notion-sync.yml`:

```yaml
- name: 📅 Update Weekly Review Page
  env:
    NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
    NOTION_WEEKLY_REVIEW_DATABASE_ID: ${{ secrets.NOTION_WEEKLY_REVIEW_DATABASE_ID }}
  run: |
    echo "📅 Updating weekly review page..."
    uv run python scripts/update_weekly_review_page.py
```

### Cron Schedule

Run every Sunday at 6:00 AM EST:

```yaml
on:
  schedule:
    - cron: '0 11 * * 0'  # 11:00 UTC = 6:00 AM EST
```

## Troubleshooting

### "No page found for this week"

The script automatically creates a new page if one doesn't exist. If you see an error, check:

1. Your Notion token is valid
2. Your database ID is correct
3. The Notion integration has access to the database

### Wrong week calculated

Make sure you're in the America/New_York timezone. The script uses NY time for all calculations.

### Date format incorrect

The script always uses:
- Start date: Sunday at 00:00
- End date: Saturday at 23:59:59
- Format: YYYY-MM-DD for Notion API

Notion will display this as "December 21, 2025 → December 27, 2025"

## Notes

- The script **does NOT** modify page content/blocks, only properties
- It **always** updates the Name, Date, and Quarter fields
- It runs safely multiple times (idempotent) - re-running won't create duplicates
- Timezone: All calculations use America/New_York
