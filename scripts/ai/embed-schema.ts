import { OpenAI } from 'openai';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Ensure you have pgvector installed in your database: CREATE EXTENSION IF NOT EXISTS vector;
const { Pool } = pg;

const openai = new OpenAI(); // Assumes OPENAI_API_KEY is in your .env file
const pool = new Pool({ 
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: {
    rejectUnauthorized: true
  }
});

// This is the AI's "knowledge base". High-quality descriptions are critical for accuracy.
const schemaDescriptions = [
  // --- VIEW-LEVEL DESCRIPTIONS ---
  { 
    type: 'view', 
    name: 'daily_fitness_snapshot',
    description: "A comprehensive daily summary of all fitness and wellness metrics. Best for analyzing trends over time and the correlation between sleep, recovery, and activity. Contains daily WHOOP data (recovery score, HRV, sleep, strain) and aggregated workout data for running, boxing, meditation, and sauna use."
  },
  {
    type: 'view', 
    name: 'run_performance_details',
    description: "A granular, in-depth analysis of individual running activities. Best for answering questions about performance *during* a single run, like split times, pace changes, and heart rate zones for a specific run."
  },
  {
    type: 'view', 
    name: 'boxing_performance_details',
    description: "A detailed log of every boxing workout. Use for specific questions about boxing session duration, strain, intensity (strain_density), and time spent in each heart rate zone."
  },
  {
    type: 'view', 
    name: 'weightlifting_performance_details',
    description: "A detailed log of every weightlifting or strength training workout. Use for specific questions about lifting session duration, strain, intensity (strain_density), and cardiovascular response (heart rate zones)."
  },

  // --- COLUMN-LEVEL DESCRIPTIONS: daily_fitness_snapshot ---
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'user_id', 
    description: "Type: UUID. Unique identifier for the user. Used for multi-user data segregation and relationship mapping."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'date', 
    description: "Type: DATE (YYYY-MM-DD). The calendar date for this daily snapshot. Used for temporal analysis and trend identification."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_recovery_score', 
    description: "Unit: Percentage (0-100, float). Daily recovery score from WHOOP. Higher scores indicate better recovery and readiness for strain is calculated. It is measured overnight from HRV, resting heart rate, sleep performance, and respiratory rate vs your baseline, and scored as Green (67–100% good), Yellow (34–66% moderate), Red (0–33% low)."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_hrv', 
    description: "Unit: Milliseconds (ms, float). Heart Rate Variability using RMSSD calculation. Key indicator of autonomic nervous system recovery."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_sleep_performance_percent', 
    description: "Unit: Percentage (0-100, float). Sleep quality score indicating how well sleep met the body's needs based on cycles and disturbances."
  },
    { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_hours_in_bed', 
    description: "Unit: Hours (float, 3 decimal precision). Total time spent in bed including all sleep sessions (main sleep + naps) for the day, aggregated and converted from milliseconds. Comprehensive measure of total daily sleep time."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_day_strain', 
    description: "Unit: Strain points (0-21, float). Cumulative cardiovascular load score for the day. Measures total physical exertion."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_workout_count', 
    description: "Unit: Count (integer). Total number of distinct workout sessions recorded for the day."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_running_minutes', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time spent running. Converted from milliseconds for endurance volume tracking."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_boxing_minutes', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time spent boxing. Converted from milliseconds for combat training volume."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_weight_training_minutes', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time spent weight training. Converted from milliseconds for strength volume."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_meditation_sessions', 
    description: "Unit: Count (integer). Number of distinct meditation sessions completed. Each session is a discrete practice period."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_meditation_minutes', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time spent meditating. Converted from milliseconds for mental wellness tracking."
  },
  { 
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'whoop_sauna_minutes', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time spent in sauna. Converted from milliseconds for heat exposure tracking."
  },

  // --- COLUMN-LEVEL DESCRIPTIONS: run_performance_details ---
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'strava_run_id', 
    description: "Type: UUID. Unique identifier for the Strava run activity. Links to external Strava data."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'run_name', 
    description: "Type: Text. User-provided name of the run from Strava. Used for workout/route identification."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'run_start_date', 
    description: "Type: TIMESTAMP WITH TIME ZONE (ISO 8601). Precise start time of the run, including timezone information. for each split has the same start, since is the start of the whole run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'total_distance_miles', 
    description: "Unit: Miles (float, 4 decimal precision). Total distance of the entire run, converted from meters. This value is repeated for all splits of the same run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'avg_pace_min_per_mile', 
    description: "Unit: Minutes per mile (float, 2 decimal precision). Overall average pace for the entire run. This summary value is repeated for all splits of the same run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'whoop_strain', 
    description: "Unit: Strain points (0-21, float). WHOOP cardiovascular load score for the entire run. This summary value is repeated for all splits of the same run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'whoop_avg_hr', 
    description: "Unit: Beats per minute (BPM, integer). Average heart rate for the entire run. This summary value is repeated for all splits of the same run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'whoop_hr_zone1_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time in Zone 1 (recovery) for the entire run. This summary value is repeated for all splits of the same run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'whoop_hr_zone2_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time in Zone 2 (aerobic) for the entire run. This summary value is repeated for all splits of the same run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'whoop_hr_zone3_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time in Zone 3 (tempo) for the entire run. This summary value is repeated for all splits of the same run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'whoop_hr_zone4_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time in Zone 4 (threshold) for the entire run. This summary value is repeated for all splits of the same run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'whoop_hr_zone5_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Total time in Zone 5 (maximum) for the entire run. This summary value is repeated for all splits of the same run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'split_number', 
    description: "Unit: Integer (1-based). Sequential number identifying each mile split in the run."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'split_distance_meters', 
    description: "Unit: Meters (float, 2 decimal precision). Raw distance measurement for each split from Strava."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'split_average_speed_mps', 
    description: "Unit: Meters per second (float, 4 decimal precision). Raw speed measurement from Strava for each split."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'split_distance_miles', 
    description: "Unit: Miles (float, 4 decimal precision). Split distance converted from meters for imperial measurement."
  },
  { 
    type: 'column', 
    view: 'run_performance_details', 
    name: 'split_pace_min_per_mile', 
    description: "Unit: Minutes per mile (float, 2 decimal precision). Split pace calculated from meters/second data."
  },

  // --- COLUMN-LEVEL DESCRIPTIONS: boxing_performance_details ---
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'whoop_workout_id', 
    description: "Type: UUID. Unique identifier for the boxing workout. Links to other WHOOP data tables."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'start_time', 
    description: "Type: TIMESTAMP WITH TIME ZONE (ISO 8601). Exact start time of boxing session including timezone."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'strain', 
    description: "Unit: Strain points (0-21, float). WHOOP cardiovascular load score for the boxing session."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'avg_heart_rate_bpm', 
    description: "Unit: Beats per minute (BPM, integer). Average heart rate during the boxing session."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'max_heart_rate_bpm', 
    description: "Unit: Beats per minute (BPM, integer). Peak heart rate reached during the boxing session."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'duration_minutes', 
    description: "Unit: Minutes (float, 2 decimal precision). Total boxing session length, converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'strain_density', 
    description: "Unit: Strain per minute (float, 4 decimal precision). Workout efficiency metric (strain/duration)."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'whoop_hr_zone0_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 0 (rest), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'whoop_hr_zone1_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 1 (warm-up), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'whoop_hr_zone2_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 2 (technique), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'whoop_hr_zone3_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 3 (moderate), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'whoop_hr_zone4_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 4 (high), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'boxing_performance_details', 
    name: 'whoop_hr_zone5_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 5 (maximum), converted from milliseconds."
  },

  // --- COLUMN-LEVEL DESCRIPTIONS: weightlifting_performance_details ---
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'whoop_workout_id', 
    description: "Type: UUID. Unique identifier for the weightlifting session. Links to other WHOOP data tables."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'start_time', 
    description: "Type: TIMESTAMP WITH TIME ZONE (ISO 8601). Exact start time of weightlifting session including timezone."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'strain', 
    description: "Unit: Strain points (0-21, float). WHOOP cardiovascular load score for the weightlifting session."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'avg_heart_rate_bpm', 
    description: "Unit: Beats per minute (BPM, integer). Average heart rate during the weightlifting session."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'max_heart_rate_bpm', 
    description: "Unit: Beats per minute (BPM, integer). Peak heart rate reached during the weightlifting session."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'duration_minutes', 
    description: "Unit: Minutes (float, 2 decimal precision). Total weightlifting session length, converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'strain_density', 
    description: "Unit: Strain per minute (float, 4 decimal precision). Workout efficiency metric (strain/duration)."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'whoop_hr_zone0_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 0 (rest), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'whoop_hr_zone1_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 1 (warm-up), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'whoop_hr_zone2_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 2 (building), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'whoop_hr_zone3_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 3 (working), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'whoop_hr_zone4_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 4 (heavy), converted from milliseconds."
  },
  { 
    type: 'column', 
    view: 'weightlifting_performance_details', 
    name: 'whoop_hr_zone5_mins', 
    description: "Unit: Minutes (float, 2 decimal precision). Time in Zone 5 (maximum), converted from milliseconds."
  }
];

async function createEmbeddings() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Schema Embedding Process ---');
    
    // 1. Set up the table (idempotent)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_embeddings (
        id SERIAL PRIMARY KEY,
        view_name TEXT,
        column_name TEXT,
        description TEXT NOT NULL,
        embedding VECTOR(1536) NOT NULL
      );
    `);
    console.log('Table schema_embeddings is ready.');

    // 2. Clear old embeddings to ensure freshness
    await client.query('TRUNCATE TABLE schema_embeddings;');
    console.log('Cleared old embeddings.');

    // 3. Generate and insert new embeddings
    for (const item of schemaDescriptions) {
      const inputText = item.type === 'view'
        ? `View: ${item.name}. Description: ${item.description}`
        : `View: ${item.view}, Column: ${item.name}. Description: ${item.description}`;

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: inputText,
      });

      const vector = embeddingResponse.data[0].embedding;

      await client.query(
        'INSERT INTO schema_embeddings (view_name, column_name, description, embedding) VALUES ($1, $2, $3, $4)',
        [item.view || item.name, item.name, item.description, `[${vector.join(',')}]`]
      );
      console.log(`Embedded and inserted: ${item.name}`);
    }

    console.log('--- Schema Embedding Process Completed Successfully ---');
  } catch (error) {
    console.error('An error occurred during the embedding process:', error);
  } finally {
    client.release();
  }
}

createEmbeddings().then(() => pool.end());