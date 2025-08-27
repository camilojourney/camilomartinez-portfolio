# WHOOP API V2 Integration

This document outlines the current V2 implementation of the WHOOP API integration in the portfolio site.

## Overview

The portfolio uses WHOOP API V2 to collect and display fitness data, with features including:
- OAuth 2.0 authentication
- Automated daily data collection
- Historical data backfilling
- Real-time analytics visualization

## API Integration

### Authentication Flow
1. User initiates OAuth 2.0 flow via NextAuth.js
2. Obtain access token and refresh token
3. Store tokens securely in database
4. Auto-refresh tokens when expired

### Data Collection
- **Daily Sync**: Automated collection at 2:00 PM UTC
- **Historical Data**: Optional backfill for past 30 days
- **Rate Limiting**: Respects API limits with exponential backoff

### Endpoints

#### Core API Routes
```typescript
/api/whoop-collector-v2     // Main collection endpoint
/api/view-data              // Data retrieval for charts
/api/sync-status           // Sync status and health
/api/update-token          // Token refresh handler
```

#### Cron Jobs
```typescript
/api/cron/daily-data-fetch  // Daily automated collection
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  whoop_user_id TEXT,
  whoop_access_token TEXT,
  whoop_refresh_token TEXT,
  token_expires_at TIMESTAMP
);
```

### WHOOP Data Tables
```sql
CREATE TABLE whoop_cycles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  start TIMESTAMP,
  end TIMESTAMP,
  strain FLOAT,
  average_heart_rate FLOAT
);

CREATE TABLE whoop_sleep (
  id TEXT PRIMARY KEY,
  cycle_id TEXT,
  user_id TEXT REFERENCES users(id),
  start TIMESTAMP,
  end TIMESTAMP,
  score FLOAT,
  hrv FLOAT,
  respiratory_rate FLOAT
);

CREATE TABLE whoop_recovery (
  id TEXT PRIMARY KEY,
  sleep_id TEXT,
  user_id TEXT REFERENCES users(id),
  score FLOAT,
  resting_heart_rate INT,
  hrv_ms FLOAT
);

CREATE TABLE whoop_workouts (
  id TEXT PRIMARY KEY,
  cycle_id TEXT,
  user_id TEXT REFERENCES users(id),
  sport_id INT,
  start TIMESTAMP,
  end TIMESTAMP,
  strain FLOAT,
  average_heart_rate FLOAT,
  max_heart_rate FLOAT
);
```

## Error Handling

The system implements comprehensive error handling:
- Connection issues: Automatic retry with backoff
- Invalid tokens: Automatic refresh flow
- Rate limits: Queue system with delays
- Data validation: TypeScript type checking

## Visualization Components

The following React components handle data display:
- `RecoveryChart`: Daily recovery scores
- `StrainVsRecoveryChart`: Correlation analysis
- `ActivityHeatmap`: Training consistency
- `ActivityDistributionChart`: Sport type breakdown

## Development Notes

### Local Setup
1. Copy `.env.example` to `16. In your `.env` file, add:`
2. Add WHOOP API credentials
3. Set up local PostgreSQL database
4. Run migrations

### Required Environment Variables
```bash
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
POSTGRES_URL=
```

### Production Deployment
- Deploy to Vercel
- Set up Vercel Postgres
- Configure Vercel Cron jobs
- Set environment variables

## Migration from V1

The V2 implementation represents a complete rewrite from V1, with:
- Updated API endpoints
- New database schema
- Improved error handling
- Better type safety
- More efficient data collection

All V1 endpoints have been deprecated and removed.
