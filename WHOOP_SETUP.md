# 🚀 WHOOP API V1 Integration Setup Guide

Your WHOOP V1 API integration is ready! This version uses the latest V1 endpoints for maximum compatibility and performance.

## Step 1: Create Your WHOOP Developer App

1. Go to [WHOOP Developer Portal](https://developer.whoop.com/)
2. Log in with your WHOOP account
3. Click "Create App"
4. Fill out the form:
   - **App Name**: `Camilo's Portfolio Analytics`
   - **Privacy Policy**: Your portfolio URL (e.g., `https://camilomartinez.co`)
   - **Redirect URIs**: Add BOTH of these:
     - `http://localhost:3002/api/auth/callback/whoop` (for testing)
     - `https://yourdomain.com/api/auth/callback/whoop` (for production)
   - **Scopes**: Select all `read:*` permissions for V1 API:
     - `read:recovery`
     - `read:cycles`
     - `read:sleep`
     - `read:workout`
     - `read:profile`
     - `read:body_measurement`

5. **Save your credentials** - you'll get a Client ID and Client Secret

## Step 2: Set Up Environment Variables

Create a `.env.local` file in your project root with:

```bash
WHOOP_CLIENT_ID=your_client_id_here
WHOOP_CLIENT_SECRET=your_client_secret_here
AUTH_SECRET=your_random_secret_here
POSTGRES_URL=your_neon_database_url_here
```

**Generate AUTH_SECRET**: Use this site: https://generate-secret.vercel.app/

## Step 3: Set Up Database

1. Create a Neon PostgreSQL database
2. Run the database schema from `database-schema.sql`
3. Add your `POSTGRES_URL` to environment variables

## Step 4: Test Locally

1. Restart your dev server: `pnpm dev`
2. Go to `http://localhost:3002/my-stats`
3. Click "Connect WHOOP Account" if needed
4. Log in with your WHOOP credentials
5. Use the data collector: `POST http://localhost:3002/api/whoop-collector`
6. You should see your analytics dashboard with real data!

## Step 5: Deploy to Production

1. Add the same environment variables to Vercel:
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add all four variables
2. Update your WHOOP app redirect URI to match your production domain
3. Deploy and test!

## What You've Built

✅ **Complete WHOOP V1 API Integration** with all sport types supported
✅ **Automatic Sport Name Mapping** - Converts 270+ sport IDs to readable names
✅ **Secure OAuth 2.0 Integration** with WHOOP
✅ **Real-time Data Visualization** with charts
✅ **Professional Error Handling** and loading states
✅ **Responsive Design** matching your glassmorphism theme
✅ **TypeScript Support** for type safety
✅ **Normalized Database Schema** with proper relationships

## Features

- **Sport Recognition**: Automatically converts WHOOP sport IDs (0-272) to readable sport names
- **Your Main Sports**: Focuses on Weightlifting (45), Running (0), Boxing (39), and Table Tennis (230)
- **All Sports Supported**: Full mapping of 270+ WHOOP sports from Activity to Public Speaking
- **Data Collection**: Collects cycles, sleep, recovery, and workout data from V1 API
- **Analytics Dashboard**: Weekly patterns, strain vs HRV, sleep consistency, and workout heatmaps

## Pages Created

- `/my-stats` - Main WHOOP analytics dashboard with sport-specific insights
- `/auth/error` - Handles authentication errors
- `/api/whoop-collector` - Data collection endpoint with sport name mapping

This integration demonstrates:
- **Advanced API Integration** with complete sport mapping
- **Data Science Analytics** with real fitness correlations
- **Modern Database Design** with normalized V1 schema
- **Professional Data Visualization** with interactive charts
- **Production-Ready Architecture** with proper error handling

**You now have a world-class fitness analytics dashboard with complete sport recognition!** 🎉

## Supported Sports

Your system now recognizes all 270+ WHOOP sports including:
- Traditional: Running, Cycling, Swimming, Weightlifting
- Combat: Boxing, Wrestling, Martial Arts, Jiu Jitsu
- Team: Basketball, Soccer, Football, Hockey
- Unique: Gaming, Meditation, Cooking, Public Speaking
- And many more...
