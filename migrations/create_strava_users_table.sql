-- Create strava_users table following the same pattern as whoop_users
-- This will store Strava authentication tokens per user for the Astoria Conquest feature

CREATE TABLE IF NOT EXISTS strava_users (
    id BIGINT PRIMARY KEY,                                    -- Strava athlete ID
    email VARCHAR(255),                                       -- User email from Strava profile
    first_name VARCHAR(100),                                  -- First name from Strava profile  
    last_name VARCHAR(100),                                   -- Last name from Strava profile
    username VARCHAR(100),                                    -- Strava username
    city VARCHAR(100),                                        -- User's city
    state VARCHAR(100),                                       -- User's state
    country VARCHAR(100),                                     -- User's country
    sex VARCHAR(1),                                           -- Gender (M/F)
    profile_picture_url TEXT,                                 -- Strava profile picture URL
    
    -- OAuth Token Management (same pattern as whoop_users)
    access_token TEXT,                                        -- Short-lived access token (6 hours)
    refresh_token TEXT,                                       -- Long-lived refresh token 
    token_expires_at TIMESTAMP WITH TIME ZONE,               -- When access token expires
    scopes TEXT,                                              -- Granted OAuth scopes (comma-separated)
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_strava_users_email ON strava_users(email);
CREATE INDEX IF NOT EXISTS idx_strava_users_refresh_token ON strava_users(refresh_token) WHERE refresh_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_strava_users_token_expires ON strava_users(token_expires_at);

-- Add comment explaining the table
COMMENT ON TABLE strava_users IS 'Stores Strava user authentication data and profile information for Astoria Conquest integration';
