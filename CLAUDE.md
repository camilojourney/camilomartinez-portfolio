# Claude Code Guidelines

## Project Structure

### Backend Scripts Organization

**Production scripts** (`backend/scripts/`):
Only scripts used by GitHub Actions or essential for maintenance.

| Script | Purpose | Used By |
|--------|---------|---------|
| `populate_weekly_habits.py` | Calculate weekly Whoop data → PostgreSQL | GitHub Actions |
| `sync_weekly_to_notion.py` | Update Notion pages with Whoop data | GitHub Actions |
| `duplicate_weekly_pages.py` | Create new week's 9 identity templates | GitHub Actions |
| `list_notion_pages.py` | Debug: view current Notion pages | Manual |
| `health-check.py` | Check system health | Manual |

**Archived scripts** (`backend/scripts/_archive/`):
One-time migrations, replaced scripts, or test utilities. Kept for reference only.

### When Creating New Scripts

1. **Temporary/test scripts**: Create in `backend/scripts/_archive/` or delete after use
2. **Production scripts**: Only add to `backend/scripts/` if used by automation
3. **One-time migrations**: After running successfully, move to `_archive/`

## Weekly Notion Automation

### The 9 Identity Templates

The system uses 9 consolidated identities with Pull motivation language:

| # | Identity | Data Source | Fields |
|---|----------|-------------|--------|
| 1 | I am an athlete | Whoop | Count |
| 2 | I train at the same time daily | Whoop | Hours + Std |
| 3 | I live in the present | Whoop | Count |
| 4 | I wake at the same time daily | Whoop | Hours + Std |
| 5 | I sleep at the same time nightly | Whoop | Hours + Std |
| 6 | I close my day with intention | Manual | Count |
| 7 | I am a focused builder | Manual | Count + Hours |
| 8 | I protect my attention | Manual | Count |
| 9 | I build by shipping | Manual | Count |

### GitHub Actions Workflow

Runs every Sunday at 6:00 AM EST:
1. `populate_weekly_habits.py` - Calculates last week's Whoop data
2. `sync_weekly_to_notion.py` - Updates existing Notion pages
3. `duplicate_weekly_pages.py` - Creates next week's template pages

## Environment Variables

Required for Notion scripts:
- `NOTION_TOKEN` - Notion integration token
- `NOTION_DATABASE_ID` - Weekly review database ID
- `DATABASE_URL` - PostgreSQL connection string

## Notion Database Schema

Key properties in the Notion database:
- `Identity` (title) - The identity name
- `Goal (Outcome)` (rich_text) - Pull motivation goal
- `System (What I Do Repeatedly)` (rich_text) - The system/habit
- `Date` (date) - Week start-end range
- `Hours` (rich_text) - Average time (HH:MM format)
- `Std` (rich_text) - Standard deviation in minutes
- `Count` (rich_text) - Number of sessions
- `Area` (multi_select) - Health or Work
