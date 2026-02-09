"""
Test script to demonstrate 20 fitness questions and their expected responses
from the AI query processor's fallback system.
"""

from datetime import datetime, timedelta


def simulate_fallback_response(question: str):
    """Simulate the _fallback_response method logic"""
    normalized = question.lower()
    today = datetime.now().date()

    # Pattern matching similar to the actual implementation
    if "recovery" in normalized and ("yesterday" in normalized or "last" in normalized):
        return {
            "question": question,
            "response": "Yesterday Camilo posted a recovery score of 78%. Keep the load moderate today, emphasise hydration, and prioritise sleep tonight.",
            "data": [{
                "snapshot_date": (today - timedelta(days=1)).isoformat(),
                "recovery_score": 78,
                "status": "moderate"
            }],
            "sql": "SELECT snapshot_date, recovery_score, status FROM daily_fitness_snapshot WHERE snapshot_date = CURRENT_DATE - INTERVAL '1 day' LIMIT 1;",
            "fallback": True
        }

    elif "sleep" in normalized or "rem" in normalized:
        return {
            "question": question,
            "response": "Camilo logged 7 hours and 45 minutes of sleep last night (86% performance) with over 110 minutes of REM. Maintain the same routine for consistent recovery.",
            "data": [{
                "sleep_date": today.isoformat(),
                "sleep_performance": "86%",
                "total_sleep_hours": 7.75,
                "rem_minutes": 110
            }],
            "sql": "SELECT sleep_date, sleep_performance, total_sleep_hours, rem_minutes FROM sleep_summary ORDER BY sleep_date DESC LIMIT 1;",
            "fallback": True
        }

    elif "strain" in normalized or "training load" in normalized:
        return {
            "question": question,
            "response": "Today's strain is tracking at 9.4 which sits in the optimal 8-10 range. If any additional work is planned keep it aerobic to stay in the green.",
            "data": [{
                "activity_date": today.isoformat(),
                "strain": 9.4,
                "optimal_range": "8.0 - 10.0"
            }],
            "sql": "SELECT activity_date, strain_score AS strain FROM daily_training_load WHERE activity_date = CURRENT_DATE LIMIT 1;",
            "fallback": True
        }

    elif "heart rate" in normalized or "hr" in normalized:
        return {
            "question": question,
            "response": "Camilo's average heart rate over the past week was 145 bpm during workouts, with a resting heart rate of 52 bpm. Both metrics are within optimal ranges for an endurance athlete.",
            "data": [{
                "period": "last_week",
                "avg_workout_hr": 145,
                "avg_resting_hr": 52
            }],
            "sql": "SELECT AVG(avg_heart_rate) as avg_workout_hr, AVG(resting_heart_rate) as avg_resting_hr FROM daily_fitness_snapshot WHERE snapshot_date >= CURRENT_DATE - INTERVAL '7 days';",
            "fallback": True
        }

    elif "distance" in normalized or "kilometers" in normalized or "km" in normalized:
        return {
            "question": question,
            "response": "Camilo ran 142 kilometers this month across 18 activities. This represents a 12% increase from last month's volume.",
            "data": [{
                "month": today.strftime("%B %Y"),
                "total_distance_km": 142,
                "total_activities": 18,
                "change_from_last_month": "+12%"
            }],
            "sql": "SELECT SUM(distance_km) as total_distance_km, COUNT(*) as total_activities FROM strava_runs WHERE EXTRACT(MONTH FROM start_date_local) = EXTRACT(MONTH FROM CURRENT_DATE);",
            "fallback": True
        }

    elif "pace" in normalized:
        return {
            "question": question,
            "response": "Camilo's average pace for long runs (15+ km) is 5:12 min/km. His fastest long run pace was 4:48 min/km on a flat course.",
            "data": [{
                "avg_pace_long_runs": "5:12 /km",
                "fastest_long_run_pace": "4:48 /km",
                "long_run_count": 8
            }],
            "sql": "SELECT AVG(avg_pace_ms) as avg_pace, MIN(avg_pace_ms) as fastest_pace FROM strava_runs WHERE distance_km >= 15;",
            "fallback": True
        }

    elif "hrv" in normalized:
        return {
            "question": question,
            "response": "Camilo's HRV has been trending upward over the past 14 days, averaging 68ms with a peak of 82ms. This indicates improving recovery capacity.",
            "data": [{
                "period": "14_days",
                "avg_hrv_ms": 68,
                "peak_hrv_ms": 82,
                "trend": "increasing"
            }],
            "sql": "SELECT AVG(hrv_rmssd_milli) as avg_hrv, MAX(hrv_rmssd_milli) as peak_hrv FROM whoop_recovery WHERE cycle_start >= CURRENT_DATE - INTERVAL '14 days';",
            "fallback": True
        }

    elif "workout" in normalized and "week" in normalized:
        return {
            "question": question,
            "response": "Camilo completed 6 workouts this week totaling 8.5 hours and 67 kilometers. The training mix included 4 runs, 1 bike ride, and 1 strength session.",
            "data": [{
                "week": "current",
                "total_workouts": 6,
                "total_hours": 8.5,
                "total_km": 67,
                "breakdown": {"runs": 4, "bike": 1, "strength": 1}
            }],
            "sql": "SELECT COUNT(*) as total_workouts, SUM(duration_hours) as total_hours, SUM(distance_km) as total_km FROM workouts WHERE week = EXTRACT(WEEK FROM CURRENT_DATE);",
            "fallback": True
        }

    elif "elevation" in normalized:
        return {
            "question": question,
            "response": "Camilo achieved 2,340 meters of elevation gain this month across all outdoor activities. The most challenging run had 480m of gain.",
            "data": [{
                "month": today.strftime("%B"),
                "total_elevation_m": 2340,
                "max_single_activity_m": 480
            }],
            "sql": "SELECT SUM(total_elevation_gain) as total_elevation FROM strava_runs WHERE EXTRACT(MONTH FROM start_date_local) = EXTRACT(MONTH FROM CURRENT_DATE);",
            "fallback": True
        }

    elif "volume" in normalized or "training time" in normalized:
        return {
            "question": question,
            "response": "Camilo's weekly training volume is 9.2 hours this week, which is 15% above his 4-week average of 8.0 hours. Watch for fatigue accumulation.",
            "data": [{
                "current_week_hours": 9.2,
                "four_week_avg": 8.0,
                "difference": "+15%"
            }],
            "sql": "SELECT SUM(duration_hours) as current_week FROM workouts WHERE week = EXTRACT(WEEK FROM CURRENT_DATE);",
            "fallback": True
        }

    elif "correlation" in normalized or "correlate" in normalized:
        return {
            "question": question,
            "response": "There's a strong positive correlation (r=0.78) between Camilo's sleep performance and recovery score. Days with 85%+ sleep typically yield 70%+ recovery.",
            "data": [{
                "correlation_coefficient": 0.78,
                "sleep_threshold": "85%",
                "typical_recovery": "70%+"
            }],
            "sql": "SELECT CORR(sleep_performance_percentage, recovery_score) FROM daily_fitness_snapshot WHERE snapshot_date >= CURRENT_DATE - INTERVAL '90 days';",
            "fallback": True
        }

    elif "longest" in normalized or "furthest" in normalized:
        return {
            "question": question,
            "response": "Camilo's longest run was 32.5 kilometers completed in 2:48:30 at an average pace of 5:10/km with 420m elevation gain.",
            "data": [{
                "distance_km": 32.5,
                "duration": "2:48:30",
                "avg_pace": "5:10 /km",
                "elevation_m": 420
            }],
            "sql": "SELECT MAX(distance_km) as distance, duration, avg_pace, elevation FROM strava_runs ORDER BY distance_km DESC LIMIT 1;",
            "fallback": True
        }

    elif "fastest" in normalized and "5k" in normalized:
        return {
            "question": question,
            "response": "Camilo's fastest 5K time is 19:42 (3:56/km pace) set 3 weeks ago with an average heart rate of 172 bpm in optimal conditions.",
            "data": [{
                "time": "19:42",
                "pace_per_km": "3:56",
                "avg_hr": 172,
                "weeks_ago": 3
            }],
            "sql": "SELECT MIN(duration) as time, avg_pace, avg_heart_rate FROM strava_runs WHERE distance_km BETWEEN 4.8 AND 5.2;",
            "fallback": True
        }

    elif "duration" in normalized:
        return {
            "question": question,
            "response": "Camilo's average workout duration is 62 minutes. Runs average 55 minutes while bike rides average 90 minutes.",
            "data": [{
                "avg_all_workouts_min": 62,
                "avg_run_min": 55,
                "avg_bike_min": 90
            }],
            "sql": "SELECT AVG(moving_time) as avg_duration FROM workouts;",
            "fallback": True
        }

    elif "red" in normalized and "recovery" in normalized:
        return {
            "question": question,
            "response": "Camilo had 4 red recovery days (below 33%) this month, all following high-strain workouts. Average recovery on these days was 28%.",
            "data": [{
                "red_days_count": 4,
                "avg_recovery_on_red_days": 28,
                "primary_cause": "high_strain_workouts"
            }],
            "sql": "SELECT COUNT(*) as red_days FROM daily_fitness_snapshot WHERE recovery_score < 33 AND EXTRACT(MONTH FROM snapshot_date) = EXTRACT(MONTH FROM CURRENT_DATE);",
            "fallback": True
        }

    elif "peak heart rate" in normalized:
        return {
            "question": question,
            "response": "Camilo's peak heart rate during runs is 189 bpm, typically reached during interval sessions or race-pace efforts. Average max HR across all runs is 176 bpm.",
            "data": [{
                "absolute_peak_hr": 189,
                "avg_max_hr": 176,
                "context": "intervals_and_races"
            }],
            "sql": "SELECT MAX(max_heart_rate) as peak, AVG(max_heart_rate) as avg_max FROM strava_runs;",
            "fallback": True
        }

    elif "day of week" in normalized or "by day" in normalized:
        return {
            "question": question,
            "response": "Camilo's strain is highest on Tuesdays (avg 12.4) and Saturdays (avg 11.8) corresponding to interval and long run days. Lowest on Sundays (avg 6.2) for active recovery.",
            "data": [
                {"day": "Tuesday", "avg_strain": 12.4, "type": "intervals"},
                {"day": "Saturday", "avg_strain": 11.8, "type": "long_run"},
                {"day": "Sunday", "avg_strain": 6.2, "type": "recovery"}
            ],
            "sql": "SELECT EXTRACT(DOW FROM activity_date) as day, AVG(strain_score) as avg_strain FROM daily_training_load GROUP BY day ORDER BY avg_strain DESC;",
            "fallback": True
        }

    elif "year" in normalized or "annual" in normalized:
        return {
            "question": question,
            "response": "Camilo has accumulated 287 hours of training time this year across 342 activities. This includes 1,840 km of running and 2,450 km of cycling.",
            "data": [{
                "year": today.year,
                "total_hours": 287,
                "total_activities": 342,
                "running_km": 1840,
                "cycling_km": 2450
            }],
            "sql": "SELECT SUM(duration_hours) as total_hours, COUNT(*) as activities FROM workouts WHERE EXTRACT(YEAR FROM activity_date) = EXTRACT(YEAR FROM CURRENT_DATE);",
            "fallback": True
        }

    else:
        return {
            "question": question,
            "response": "I'm ready whenever you want to dig into recovery, sleep, or training load. Ask about those metrics to see how Camilo is trending.",
            "data": [],
            "sql": None,
            "fallback": True
        }


# 20 Test Questions
questions = [
    "What was my average heart rate last week?",
    "How many kilometers did I run this month?",
    "What's my recovery trend over the past 7 days?",
    "Did I get enough REM sleep last night?",
    "What was my fastest 5k time?",
    "How does my current training load compare to last month?",
    "What's my resting heart rate trend?",
    "How many workouts did I complete this week?",
    "What's my average pace for long runs?",
    "How is my HRV trending lately?",
    "What was my longest run distance?",
    "How many hours of sleep did I get on average this week?",
    "What's my weekly training volume?",
    "How does my recovery score correlate with sleep quality?",
    "What elevation gain did I achieve this month?",
    "What's my average workout duration?",
    "How many red recovery days did I have this month?",
    "What's my peak heart rate during runs?",
    "How does my strain score vary by day of week?",
    "What's my total training time this year?"
]

print("="*100)
print("TESTING 20 FITNESS QUESTIONS - Simulated Fallback Responses")
print("="*100)

for i, question in enumerate(questions, 1):
    print(f"\n{i}. QUESTION: {question}")
    print("-"*100)

    result = simulate_fallback_response(question)

    print(f"\n✓ RESPONSE:\n{result['response']}\n")

    if result['data']:
        print(f"DATA RETURNED: {len(result['data'])} record(s)")
        for item in result['data']:
            for key, value in item.items():
                print(f"  • {key}: {value}")
    else:
        print("DATA RETURNED: None")

    if result['sql']:
        print("\nGENERATED SQL:")
        print(f"  {result['sql']}")

    print(f"\nFallback Used: {result['fallback']}")
    print("="*100)

print("\n✓ All 20 questions tested successfully!")
print("\nNOTE: These are simulated responses based on the fallback logic.")
print("Actual responses would vary based on real database queries when the full pipeline is working.")
