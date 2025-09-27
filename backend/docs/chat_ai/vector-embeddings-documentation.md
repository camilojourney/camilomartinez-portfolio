# Vector Embeddings and Materialized Views

> A comprehensive guide to AI-powered fitness data analysis through materialized views and vector embeddings.

## Table of Contents
1. [Daily Fitness Snapshot](#daily-fitness-snapshot)
2. [Run Performance Details](#run-performance-details)
3. [Boxing Performance Details](#boxing-performance-details)
4. [Weightlifting Performance Details](#weightlifting-performance-details)

## Daily Fitness Snapshot
`daily_fitness_snapshot` provides a comprehensive daily summary of a user's fitness metrics combining WHOOP cycle, recovery, sleep, and workout data.

### Fields
| Column Name | Type | Description | Vector Context |
|------------|------|-------------|----------------|
| user_id | uuid | Unique identifier for the user | Primary key for user association |
| date | date | Calendar date of the fitness snapshot | Temporal dimension for embeddings |
| whoop_recovery_score | float | Daily recovery percentage from WHOOP | Key indicator for overall readiness |
| whoop_hrv | float | Heart Rate Variability (RMSSD) in milliseconds | Autonomic nervous system status |
| whoop_sleep_performance_percent | float | Sleep quality percentage | Sleep quality indicator |
| whoop_hours_in_bed | float | Total time spent in bed (hours) | Sleep duration metric |
| whoop_day_strain | float | Accumulated daily cardiovascular load | Overall daily exertion |
| whoop_workout_count | integer | Total number of workouts for the day | Activity frequency |
| whoop_running_minutes | float | Total running duration (minutes) | Running volume |
| whoop_boxing_minutes | float | Total boxing duration (minutes) | Boxing volume |
| whoop_weight_training_minutes | float | Total weight training duration (minutes) | Strength training volume |
| whoop_meditation_sessions | integer | Number of meditation sessions | Mental wellness frequency |
| whoop_meditation_minutes | float | Total meditation duration (minutes) | Mental wellness volume |
| whoop_sauna_minutes | float | Total sauna duration (minutes) | Recovery activity volume |

## Run Performance Details
`run_performance_details` combines Strava run data with WHOOP metrics for detailed running analysis.

### Fields
| Column Name | Type | Description | Vector Context |
|------------|------|-------------|----------------|
| strava_run_id | uuid | Unique identifier for the Strava run | Primary key for run correlation |
| run_name | text | User-provided name of the run | Descriptive context |
| run_start_date | timestamp | Start time of the run | Temporal alignment |
| total_distance_miles | float | Total distance in miles | Run volume |
| avg_pace_min_per_mile | float | Average pace in minutes per mile | Performance intensity |
| whoop_strain | float | WHOOP strain score for the run | Cardiovascular load |
| whoop_avg_hr | integer | Average heart rate during run | Cardiovascular intensity |
| whoop_hr_zone1_mins | float | Time in HR Zone 1 (minutes) | Recovery/easy effort |
| whoop_hr_zone2_mins | float | Time in HR Zone 2 (minutes) | Base/aerobic effort |
| whoop_hr_zone3_mins | float | Time in HR Zone 3 (minutes) | Tempo effort |
| whoop_hr_zone4_mins | float | Time in HR Zone 4 (minutes) | Threshold effort |
| whoop_hr_zone5_mins | float | Time in HR Zone 5 (minutes) | Maximum effort |
| split_number | integer | Mile split number | Interval identification |
| split_distance_meters | float | Split distance in meters | Raw metric for precise calculations |
| split_average_speed_mps | float | Split pace in meters per second | Raw performance metric |
| split_distance_miles | float | Split distance in miles | Human-readable distance |
| split_pace_min_per_mile | float | Split pace in minutes per mile | Human-readable pace |

## Boxing Performance Details
`boxing_performance_details` focuses on boxing-specific workout metrics from WHOOP.

### Fields
| Column Name | Type | Description | Vector Context |
|------------|------|-------------|----------------|
| whoop_workout_id | uuid | Unique identifier for workout | Primary key for session |
| start_time | timestamp | Session start time | Temporal tracking |
| strain | float | WHOOP strain score | Session intensity |
| avg_heart_rate_bpm | integer | Average heart rate | Cardiovascular load |
| max_heart_rate_bpm | integer | Maximum heart rate | Peak intensity |
| duration_minutes | float | Session duration in minutes | Volume metric |
| strain_density | float | Strain per minute ratio | Efficiency metric |
| whoop_hr_zone0_mins | float | Time in rest zone (minutes) | Recovery periods |
| whoop_hr_zone1_mins | float | Time in Zone 1 (minutes) | Warm-up/cool-down |
| whoop_hr_zone2_mins | float | Time in Zone 2 (minutes) | Technical work |
| whoop_hr_zone3_mins | float | Time in Zone 3 (minutes) | Moderate intensity |
| whoop_hr_zone4_mins | float | Time in Zone 4 (minutes) | High intensity |
| whoop_hr_zone5_mins | float | Time in Zone 5 (minutes) | Maximum effort |

## Weightlifting Performance Details
`weightlifting_performance_details` captures strength training metrics from WHOOP.

### Fields
| Column Name | Type | Description | Vector Context |
|------------|------|-------------|----------------|
| whoop_workout_id | uuid | Unique identifier for workout | Primary key for session |
| start_time | timestamp | Session start time | Temporal tracking |
| strain | float | WHOOP strain score | Session intensity |
| avg_heart_rate_bpm | integer | Average heart rate | Cardiovascular load |
| max_heart_rate_bpm | integer | Maximum heart rate | Peak intensity |
| duration_minutes | float | Session duration in minutes | Volume metric |
| strain_density | float | Strain per minute ratio | Efficiency metric |
| whoop_hr_zone0_mins | float | Time in rest zone (minutes) | Rest periods |
| whoop_hr_zone1_mins | float | Time in Zone 1 (minutes) | Warm-up/recovery |
| whoop_hr_zone2_mins | float | Time in Zone 2 (minutes) | Active recovery |
| whoop_hr_zone3_mins | float | Time in Zone 3 (minutes) | Working sets |
| whoop_hr_zone4_mins | float | Time in Zone 4 (minutes) | Heavy sets |
| whoop_hr_zone5_mins | float | Time in Zone 5 (minutes) | Maximum effort |

## Vector Embedding Strategy

Each view is designed to support efficient vector embeddings for AI analysis:

1. **Temporal Consistency**: All views maintain temporal alignment through timestamps and dates
2. **Normalized Metrics**: Values are converted to standard units (miles, minutes, etc.)
3. **Raw Data Access**: Original metrics are preserved for precise calculations
4. **Contextual Grouping**: Related metrics are grouped for semantic understanding
5. **Performance Indicators**: Each view includes both volume and intensity metrics

### Embedding Use Cases

- **Activity Pattern Recognition**: Identify training patterns and trends
- **Recovery Analysis**: Correlate strain with recovery metrics
- **Performance Prediction**: Project expected performance based on historical data
- **Anomaly Detection**: Identify unusual training or recovery patterns
- **Recommendation Generation**: Suggest optimal training adjustments

### Notes on Embedding Generation

- Each view supports both individual field embeddings and composite embeddings
- Temporal factors are weighted in embedding calculations
- Numerical values are normalized to prevent scale-based bias
- Categorical data (sport types) uses domain-specific encoding
- Missing values are handled through COALESCE to ensure consistent vectors