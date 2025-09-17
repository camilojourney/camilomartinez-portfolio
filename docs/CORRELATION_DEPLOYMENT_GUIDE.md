# Cross-Platform Activity Correlation - Deployment Guide

## 🎯 Overview

This guide will help you deploy the professional cross-platform activity correlation system that links Strava runs with WHOOP workouts using a junction table approach.

## 📋 Deployment Steps

### Step 1: Create the Database Table (Production)

Since your environment variables are configured in production, run this command in your Vercel environment or wherever your database is accessible:

```bash
# Create the activity_correlations table
node scripts/data/run-correlation-etl.mjs create-table
```

**Expected Output:**
```
🔄 Creating activity_correlations table...
✅ activity_correlations table created successfully

📋 Table structure:
[Table showing all columns: id, user_id, strava_run_id, whoop_workout_id, etc.]
```

### Step 2: Initial Backfill (Process Historical Data)

Run a 90-day backfill to process all your existing historical data:

```bash
# Process all activities from the last 90 days
node scripts/data/run-correlation-etl.mjs process 90
```

**Expected Output:**
```
🔄 Starting cross-platform activity correlation (90 days)...
✅ Processed [X] new activity correlations
```

### Step 3: Verify the Setup

Check the correlations were created properly:

```bash
# Show correlation statistics
node scripts/data/run-correlation-etl.mjs stats
```

**Expected Output:**
```
📈 Correlation Statistics:
┌─────────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┬──────────────┐
│ total_correlations      │ avg_confidence      │ users_with_...      │ correlation_method  │ method_count │
├─────────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼──────────────┤
│ 45                      │ 0.8733333333333333  │ 1                   │ datetime_match      │ 42           │
│ 45                      │ 0.8733333333333333  │ 1                   │ datetime_distance_m │ 3            │
└─────────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┴──────────────┘
```

If you know your user ID, query specific correlations:

```bash
# Query correlations for a specific user
node scripts/data/run-correlation-etl.mjs query YOUR_USER_ID
```

## 🔄 Ongoing Automation

### Weekly Sync Integration

The correlation processing is now **automatically integrated** into your existing Monday Strava sync! 

**What happens:**
1. Monday 1 PM: Strava weekly sync runs (`strava-weekly-sync.js`)
2. If new activities are found, correlation processing automatically triggers
3. Uses 7-day window for efficient weekly correlation processing
4. Logs output to your existing sync reports

**Your existing cron job will now do:**
```
Monday Strava Sync → New Activities Found → Auto-Run Correlations → Complete
```

### Manual Correlation Processing

If you ever need to run correlations manually:

```bash
# Process last 7 days (weekly maintenance)
node scripts/data/run-correlation-etl.mjs process 7

# Process last 30 days (monthly maintenance)  
node scripts/data/run-correlation-etl.mjs process 30
```

## 📊 Usage Examples

### Query Correlated Activities

```sql
-- Get correlated activities with confidence scores
SELECT 
  sr.name as strava_name,
  sr.distance_meters/1000 as strava_km,
  ww.sport_name as whoop_sport,
  ww.strain as whoop_strain,
  ww.average_heart_rate,
  ac.correlation_confidence,
  ac.time_diff_minutes
FROM activity_correlations ac
JOIN strava_runs sr ON ac.strava_run_id = sr.id
JOIN whoop_workouts ww ON ac.whoop_workout_id = ww.id
WHERE ac.user_id = YOUR_USER_ID 
  AND ac.correlation_confidence >= 0.80
ORDER BY sr.start_date DESC;
```

### Performance Analysis

```sql
-- Compare Strava vs WHOOP distance tracking
SELECT 
  sr.distance_meters/1000 as strava_km,
  ww.distance_meters/1000 as whoop_km,
  ac.distance_diff_percent,
  ww.strain,
  ww.average_heart_rate
FROM activity_correlations ac
JOIN strava_runs sr ON ac.strava_run_id = sr.id
JOIN whoop_workouts ww ON ac.whoop_workout_id = ww.id
WHERE ac.user_id = YOUR_USER_ID 
  AND ac.correlation_confidence >= 0.85
  AND ww.distance_meters > 0;
```

## 🔧 Troubleshooting

### Environment Issues

If you get connection errors:
1. Ensure `POSTGRES_URL` environment variable is set in your deployment environment
2. Run commands in the same environment where your database is accessible (Vercel, production server, etc.)

### No Correlations Found

If no correlations are created:
1. Check you have both Strava runs and WHOOP workouts in the time window
2. Verify WHOOP workouts have `sport_name` containing "run"
3. Check activities are within 2 hours of each other

### Low Confidence Scores

If correlation confidence is low:
- Time differences > 60 minutes reduce confidence
- Missing distance data reduces confidence  
- Adjust the confidence threshold in queries (use 0.70 instead of 0.85)

## 📈 Benefits Achieved

✅ **Performance**: No more complex real-time JOINs  
✅ **Accuracy**: Multi-algorithm correlation with confidence scoring  
✅ **Automation**: Integrated into existing Monday sync workflow  
✅ **Scalability**: Handles growing data volumes efficiently  
✅ **Flexibility**: Manual override and maintenance capabilities  
✅ **Analytics**: Historical correlation tracking and statistics  

## 🎉 Success Metrics

After deployment, you should see:
- Correlation table populated with historical data
- Weekly automatic correlation processing
- Fast query performance for cross-platform analysis
- Confidence scores helping identify accurate matches

Your cross-platform correlation system is now professionally implemented and ready for production use! 🚀
