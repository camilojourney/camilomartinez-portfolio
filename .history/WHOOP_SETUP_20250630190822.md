# 🚀 WHOOP API Integration Setup Guide

Your WHOOP integration is ready! Follow these steps to make it live:

## Step 1: Create Your WHOOP Developer App

1. Go to [WHOOP Developer Portal](https://developer.whoop.com/)
2. Log in with your WHOOP account
3. Click "Create App"
4. Fill out the form:
   - **App Name**: `Camilo's Portfolio`
   - **Privacy Policy**: Your portfolio URL (e.g., `https://camilomartinez.co`)
   - **Redirect URIs**: Add BOTH of these:
     - `http://localhost:3002/api/auth/callback/whoop` (for testing)
     - `https://yourdomain.com/api/auth/callback/whoop` (for production)
   - **Scopes**: Select all `read:*` permissions:
     - `read:recovery`
     - `read:cycles`
     - `read:sleep`
     - `read:workout`
     - `read:profile`
     - `read:body_measurement`
     - `offline_access` (important for refresh tokens)

5. **Save your credentials** - you'll get a Client ID and Client Secret

## Step 2: Set Up Environment Variables

Create a `.env.local` file in your project root with:

```bash
WHOOP_CLIENT_ID=your_client_id_here
WHOOP_CLIENT_SECRET=your_client_secret_here
AUTH_SECRET=your_random_secret_here
```

**Generate AUTH_SECRET**: Use this site: https://generate-secret.vercel.app/

## Step 3: Test Locally

1. Restart your dev server: `pnpm dev`
2. Go to `http://localhost:3002/live-data`
3. Click "Connect WHOOP Account"
4. Log in with your WHOOP credentials
5. You should see your live recovery data!

## Step 4: Deploy to Production

1. Add the same environment variables to Vercel:
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add all three variables
2. Update your WHOOP app redirect URI to match your production domain
3. Deploy and test!

## What You've Built

✅ **Secure OAuth 2.0 Integration** with WHOOP
✅ **Real-time Data Visualization** with charts
✅ **Professional Error Handling** and loading states
✅ **Responsive Design** matching your glassmorphism theme
✅ **TypeScript Support** for type safety

## Pages Created

- `/live-data` - Main WHOOP demo page
- `/auth/error` - Handles authentication errors
- Home page updated with WHOOP demo card

This integration demonstrates:
- API integration skills
- OAuth 2.0 authentication
- Data visualization
- Professional error handling
- Modern React patterns

**You now have a legendary portfolio feature that shows real-time fitness data!** 🎉
