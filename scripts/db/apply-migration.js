require('dotenv').config();
const { sql } = require('@vercel/postgres');
//.env is loaded at the top


async function applyMigration() {
  try {
    console.log('� Applying Strava database migration...');
    
    console.log('🔧 Applying migration to database...');
    
    // Execute the migration as individual logical blocks
    console.log('🔄 Step 1: Adding columns to strava_runs...');
    await sql`
      ALTER TABLE strava_runs
        -- timing fields
        ADD COLUMN IF NOT EXISTS elapsed_time_seconds     integer,
        ADD COLUMN IF NOT EXISTS start_date               timestamp,
        ADD COLUMN IF NOT EXISTS start_date_local         timestamp,
        ADD COLUMN IF NOT EXISTS utc_offset_seconds       integer,

        -- performance metrics
        ADD COLUMN IF NOT EXISTS average_speed_mps        numeric,
        ADD COLUMN IF NOT EXISTS max_speed_mps            numeric,
        ADD COLUMN IF NOT EXISTS total_elevation_gain     numeric,
        ADD COLUMN IF NOT EXISTS elev_high                numeric,
        ADD COLUMN IF NOT EXISTS elev_low                 numeric,
        ADD COLUMN IF NOT EXISTS suffer_score             numeric,
        ADD COLUMN IF NOT EXISTS perceived_exertion       integer,

        -- location coordinates
        ADD COLUMN IF NOT EXISTS start_latlng             point,
        ADD COLUMN IF NOT EXISTS end_latlng               point,

        -- map data
        ADD COLUMN IF NOT EXISTS polyline                 text,
        ADD COLUMN IF NOT EXISTS summary_polyline         text,

        -- splits and notes
        ADD COLUMN IF NOT EXISTS private_note             text;
    `;
    
    console.log('🔄 Step 2: Creating strava_run_splits table...');
    await sql`
      CREATE TABLE IF NOT EXISTS strava_run_splits (
        id                              bigserial PRIMARY KEY,
        strava_run_id                   bigint NOT NULL,
        split_type                      text NOT NULL,
        split_number                    integer NOT NULL,
        distance_meters                 numeric NOT NULL,
        elapsed_time_seconds            integer NOT NULL,
        moving_time_seconds             integer NOT NULL,
        elevation_difference_meters     numeric,
        average_speed_mps               numeric NOT NULL,
        average_grade_adjusted_speed    numeric,
        pace_zone                       integer,
        
        CONSTRAINT fk_strava_run_splits_run 
          FOREIGN KEY (strava_run_id) 
          REFERENCES strava_runs(id) 
          ON DELETE CASCADE,
          
        CONSTRAINT unique_split_per_run 
          UNIQUE (strava_run_id, split_type, split_number)
      );
    `;
    
    console.log('🔄 Step 3: Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_strava_runs_user_date ON strava_runs (user_id, start_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_strava_runs_sport_date ON strava_runs (sport_type, start_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_strava_runs_suffer_score ON strava_runs (suffer_score DESC) WHERE suffer_score IS NOT NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_splits_run_type ON strava_run_splits (strava_run_id, split_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_splits_speed ON strava_run_splits (average_speed_mps DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_splits_distance_time ON strava_run_splits (distance_meters, elapsed_time_seconds)`;
    
    console.log('🔄 Step 4: Adding column comments...');
    // Main table comments
    await sql`COMMENT ON COLUMN strava_runs.elapsed_time_seconds IS 'Total elapsed time including stops and pauses'`;
    await sql`COMMENT ON COLUMN strava_runs.start_date IS 'Activity start time in UTC (from Strava API)'`;
    await sql`COMMENT ON COLUMN strava_runs.start_date_local IS 'Activity start time in local timezone'`;
    await sql`COMMENT ON COLUMN strava_runs.utc_offset_seconds IS 'UTC offset in seconds from start_date_local'`;
    await sql`COMMENT ON COLUMN strava_runs.average_speed_mps IS 'Average speed in meters per second'`;
    await sql`COMMENT ON COLUMN strava_runs.max_speed_mps IS 'Maximum speed in meters per second'`;
    await sql`COMMENT ON COLUMN strava_runs.total_elevation_gain IS 'Total elevation gained during activity'`;
    await sql`COMMENT ON COLUMN strava_runs.elev_high IS 'Highest elevation point in meters'`;
    await sql`COMMENT ON COLUMN strava_runs.elev_low IS 'Lowest elevation point in meters'`;
    await sql`COMMENT ON COLUMN strava_runs.suffer_score IS 'Strava suffer score (0-1000+)'`;
    await sql`COMMENT ON COLUMN strava_runs.perceived_exertion IS 'Perceived exertion rating (1-10)'`;
    await sql`COMMENT ON COLUMN strava_runs.start_latlng IS 'Starting coordinates [lat, lng]'`;
    await sql`COMMENT ON COLUMN strava_runs.end_latlng IS 'Ending coordinates [lat, lng]'`;
    await sql`COMMENT ON COLUMN strava_runs.polyline IS 'Detailed route polyline from Strava map'`;
    await sql`COMMENT ON COLUMN strava_runs.summary_polyline IS 'Simplified route polyline from Strava map'`;
    await sql`COMMENT ON COLUMN strava_runs.private_note IS 'Private notes about the activity'`;
    
    // Splits table comments
    await sql`COMMENT ON TABLE strava_run_splits IS 'Normalized split data from Strava activities (metric and standard)'`;
    await sql`COMMENT ON COLUMN strava_run_splits.split_type IS 'Type of split: metric (1km) or standard (1 mile)'`;
    await sql`COMMENT ON COLUMN strava_run_splits.split_number IS 'Sequential split number within the activity'`;
    await sql`COMMENT ON COLUMN strava_run_splits.distance_meters IS 'Distance covered in this split (meters)'`;
    await sql`COMMENT ON COLUMN strava_run_splits.elapsed_time_seconds IS 'Total time for this split including stops'`;
    await sql`COMMENT ON COLUMN strava_run_splits.moving_time_seconds IS 'Moving time for this split excluding stops'`;
    await sql`COMMENT ON COLUMN strava_run_splits.elevation_difference_meters IS 'Net elevation change during this split'`;
    await sql`COMMENT ON COLUMN strava_run_splits.average_speed_mps IS 'Average speed for this split (meters per second)'`;
    await sql`COMMENT ON COLUMN strava_run_splits.average_grade_adjusted_speed IS 'Grade-adjusted average speed'`;
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying new columns in strava_runs...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'strava_runs' 
      AND column_name IN ('elapsed_time_seconds', 'start_date', 'average_speed_mps', 'polyline', 'private_note')
      ORDER BY column_name;
    `;
    console.table(columns.rows);
    
    console.log('\n🔍 Verifying strava_run_splits table...');
    const splitsTable = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'strava_run_splits'
      ORDER BY ordinal_position;
    `;
    console.table(splitsTable.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

applyMigration();
