export type SchemaDescription =
  | { type: 'view'; name: string; description: string }
  | { type: 'column'; view: string; name: string; description: string };

export const schemaDescriptions: SchemaDescription[] = [
  {
    type: 'view',
    name: 'daily_fitness_snapshot',
    description:
      'A comprehensive daily summary of all fitness and wellness metrics. Best for analyzing trends over time and the correlation between sleep, recovery, and activity. Contains daily WHOOP data (recovery score, HRV, sleep, strain) and aggregated workout data for running, boxing, meditation, and sauna use.'
  },
  {
    type: 'view',
    name: 'run_performance_details',
    description:
      'A granular, in-depth analysis of individual running activities. Best for answering questions about performance *during* a single run, like split times, pace changes, and heart rate zones for a specific run.'
  },
  {
    type: 'view',
    name: 'boxing_performance_details',
    description:
      'A detailed log of every boxing workout. Use for specific questions about boxing session duration, strain, intensity (strain_density), and time spent in each heart rate zone.'
  },
  {
    type: 'view',
    name: 'weightlifting_performance_details',
    description:
      'A detailed log of every weightlifting or strength training workout. Use for specific questions about lifting session duration, strain, intensity (strain_density), and cardiovascular response (heart rate zones).'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'user_id',
    description:
      'Type: UUID. Unique identifier for the user. Used for multi-user data segregation and relationship mapping.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'snapshot_date',
    description:
      "Type: DATE (YYYY-MM-DD). The calendar date for this daily snapshot. CRITICAL: Use this column for ALL date filtering, sorting by recent/latest, time-based queries, ordering by date, finding data from specific days, weeks, months. Essential for temporal analysis, trend identification, and chronological ordering. Keywords: date, time, recent, latest, chronological, daily, when, day, week, month, yesterday, today, last week."
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_recovery_score',
    description:
      'Unit: Percentage (0-100, float). Daily recovery score from WHOOP. Higher scores indicate better recovery and readiness for strain. Calculated overnight from HRV, resting heart rate, sleep performance, and respiratory rate vs baseline. Scored as Green (67–100% good), Yellow (34–66% moderate), Red (0–33% low).'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_hrv',
    description:
      'Unit: Milliseconds (ms, float). Heart Rate Variability using RMSSD calculation. Key indicator of autonomic nervous system recovery.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_sleep_performance_percent',
    description:
      "Unit: Percentage (0-100, float). Sleep quality score indicating how well sleep met the body's needs based on cycles and disturbances."
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_hours_in_bed',
    description:
      'Unit: Hours (float, 3 decimal precision). Total time spent in bed including all sleep sessions (main sleep + naps) for the day, aggregated and converted from milliseconds. Comprehensive measure of total daily sleep time.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_day_strain',
    description:
      'Unit: Strain points (0-21, float). Cumulative cardiovascular load score for the day. Measures total physical exertion.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_workout_count',
    description:
      'Unit: Count (integer). Total number of distinct workout sessions recorded for the day.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_running_minutes',
    description:
      'Unit: Minutes (float, 2 decimal precision). Total time spent running. Converted from milliseconds for endurance volume tracking.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_boxing_minutes',
    description:
      'Unit: Minutes (float, 2 decimal precision). Total time spent boxing. Converted from milliseconds for combat training volume.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_weight_training_minutes',
    description:
      'Unit: Minutes (float, 2 decimal precision). Total time spent weight training. Converted from milliseconds for strength volume.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_meditation_sessions',
    description:
      'Unit: Count (integer). Number of distinct meditation sessions completed. Each session is a discrete practice period.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_meditation_minutes',
    description:
      'Unit: Minutes (float, 2 decimal precision). Total time spent meditating. Converted from milliseconds for mental wellness tracking.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'whoop_sauna_minutes',
    description:
      'Unit: Minutes (float, 2 decimal precision). Total time spent in sauna. Converted from milliseconds for heat exposure tracking.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'strava_run_count',
    description:
      'Unit: Count (integer). Total number of running activities from Strava for the day. Aggregated from individual run records.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'strava_total_run_miles',
    description:
      'Unit: Miles (float, 2 decimal precision). Cumulative running distance for the day from Strava. Sum of all running activities, converted from meters to miles.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'strava_avg_run_speed_mph',
    description:
      'Unit: Miles per hour (mph, float). Average running speed across all Strava runs for the day. Calculated from total distance divided by total moving time.'
  },
  {
    type: 'column',
    view: 'daily_fitness_snapshot',
    name: 'strava_total_suffer_score',
    description:
      'Unit: Suffer Score points (integer). Cumulative Strava suffer score for all runs. Measures relative effort and intensity of running activities.'
  }
];
