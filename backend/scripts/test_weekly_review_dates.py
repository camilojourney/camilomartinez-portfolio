#!/usr/bin/env python3
"""
Test the weekly review date calculations

This script tests the date calculation logic without making actual Notion API calls.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
import sys
import os
from pathlib import Path

# Set dummy environment variables for testing
os.environ["NOTION_TOKEN"] = "test_token"
os.environ["NOTION_WEEKLY_REVIEW_PAGE_ID"] = "test_page_id"

# Add parent directory to path to import the main script
sys.path.insert(0, str(Path(__file__).resolve().parent))

from update_weekly_review_page import (
    get_last_completed_week,
    format_weekly_title,
    SPANISH_MONTHS
)


def test_date_calculations():
    """Test various scenarios for date calculations."""
    print("=" * 80)
    print("🧪 Testing Weekly Review Date Calculations")
    print("=" * 80)

    ny_tz = ZoneInfo("America/New_York")

    # Test cases: (reference_date, expected_start, expected_end, expected_title)
    test_cases = [
        # Sunday January 11, 2026 (start of new week)
        (
            datetime(2026, 1, 11, 12, 0, 0, tzinfo=ny_tz),
            "2026-01-04",
            "2026-01-10",
            "Ene 4 - 10 / 2026"
        ),
        # Tuesday January 14, 2026 (mid-week)
        (
            datetime(2026, 1, 14, 15, 30, 0, tzinfo=ny_tz),
            "2026-01-04",
            "2026-01-10",
            "Ene 4 - 10 / 2026"
        ),
        # Saturday January 17, 2026 (end of week)
        (
            datetime(2026, 1, 17, 23, 59, 0, tzinfo=ny_tz),
            "2026-01-04",
            "2026-01-10",
            "Ene 4 - 10 / 2026"
        ),
        # Sunday December 21, 2025
        (
            datetime(2025, 12, 21, 6, 0, 0, tzinfo=ny_tz),
            "2025-12-14",
            "2025-12-20",
            "Dic 14 - 20 / 2025"
        ),
        # Wednesday December 25, 2025 (Christmas)
        (
            datetime(2025, 12, 25, 12, 0, 0, tzinfo=ny_tz),
            "2025-12-14",
            "2025-12-20",
            "Dic 14 - 20 / 2025"
        ),
    ]

    all_passed = True

    for i, (ref_date, expected_start, expected_end, expected_title) in enumerate(test_cases, 1):
        print(f"\n📝 Test Case {i}:")
        print(f"   Reference date: {ref_date.strftime('%A, %B %d, %Y at %H:%M %Z')}")

        # Get the last completed week
        week_start, week_end = get_last_completed_week(ref_date)

        # Format dates
        actual_start = week_start.strftime("%Y-%m-%d")
        actual_end = week_end.strftime("%Y-%m-%d")
        actual_title = format_weekly_title(week_start, week_end)

        # Check results
        start_match = actual_start == expected_start
        end_match = actual_end == expected_end
        title_match = actual_title == expected_title

        print(f"   Expected: {expected_start} → {expected_end}")
        print(f"   Actual:   {actual_start} → {actual_end}")
        print(f"   Expected title: {expected_title}")
        print(f"   Actual title:   {actual_title}")

        if start_match and end_match and title_match:
            print("   ✅ PASS")
        else:
            print("   ❌ FAIL")
            all_passed = False

            if not start_match:
                print(f"      Start date mismatch: {actual_start} != {expected_start}")
            if not end_match:
                print(f"      End date mismatch: {actual_end} != {expected_end}")
            if not title_match:
                print(f"      Title mismatch: {actual_title} != {expected_title}")

    print("\n" + "=" * 80)
    if all_passed:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed")
    print("=" * 80)

    return all_passed


def test_spanish_months():
    """Test Spanish month abbreviations."""
    print("\n🌍 Testing Spanish Month Abbreviations:")
    print("-" * 40)

    expected_months = {
        1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr",
        5: "May", 6: "Jun", 7: "Jul", 8: "Ago",
        9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"
    }

    all_correct = True
    for month, expected in expected_months.items():
        actual = SPANISH_MONTHS[month]
        match = actual == expected
        status = "✅" if match else "❌"
        print(f"   {month:2d} → {actual} {status}")
        if not match:
            all_correct = False

    return all_correct


def test_current_week():
    """Test with the actual current date."""
    print("\n📅 Testing with Current Date:")
    print("-" * 40)

    week_start, week_end = get_last_completed_week()
    title = format_weekly_title(week_start, week_end)

    print(f"   Last completed week:")
    print(f"   Start: {week_start.strftime('%A, %B %d, %Y')}")
    print(f"   End:   {week_end.strftime('%A, %B %d, %Y')}")
    print(f"   Title: {title}")
    print(f"   Date range: {week_start.strftime('%Y-%m-%d')} → {week_end.strftime('%Y-%m-%d')}")


if __name__ == "__main__":
    # Run all tests
    test_spanish_months()
    dates_passed = test_date_calculations()
    test_current_week()

    # Exit with appropriate code
    sys.exit(0 if dates_passed else 1)
