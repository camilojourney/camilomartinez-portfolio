# Astoria Conquest - Automatic Update Setup

This document explains how to set up automatic weekly updates for the Astoria Conquest map.

## Architecture Overview

```
Vercel (Frontend + Cron)
    │
    │ Every Monday @ 1:30 PM
    │
    ▼
/api/cron/astoria-update (Next.js API Route)
    │
    │ HTTP POST with webhook secret
    │
    ▼
Render.com (Python Worker)
    │
    │ Runs update_progress.py script
    │
    ▼
PostgreSQL Database (Neon)
    │
    ▼
Updated GeoJSON files in public/data/astoria-conquest/
```

## Setup Instructions

### Step 1: Deploy Python Worker to Render.com

1. **Create a Render.com account** (if you don't have one):
   - Go to https://render.com
   - Sign up with GitHub (easiest)

2. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Service name: `astoria-worker`
   - Runtime: `Python 3`
   - Region: `Oregon` (or closest to your database)
   - Branch: `main`

3. **Configure Build & Start Commands**:
   ```
   Build Command:  cd backend && pip install -r requirements.txt
   Start Command:  cd backend && gunicorn app.api.worker_webhook:app --bind 0.0.0.0:$PORT --timeout 300
   ```

4. **Set Environment Variables** in Render:
   - `POSTGRES_URL_NONPRISMA`: Your Neon PostgreSQL connection string
   - `DATABASE_URL`: Same as above (fallback)
   - `WORKER_WEBHOOK_SECRET`: Generate a random secret (save this!)
     ```bash
     # Generate a secure secret:
     openssl rand -base64 32
     ```

5. **Deploy** and wait for it to complete (~2-3 minutes)

6. **Copy your worker URL**:
   - After deployment, you'll get a URL like: `https://astoria-worker.onrender.com`
   - Save this URL!

### Step 2: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `ASTORIA_WORKER_URL` | `https://astoria-worker.onrender.com` | Production, Preview, Development |
   | `WORKER_WEBHOOK_SECRET` | `<the secret you generated>` | Production, Preview, Development |
   | `CRON_SECRET` | `cron_secure_astoria_update_2024` | Production, Preview, Development |

4. **Redeploy** your Vercel project to apply the new environment variables

### Step 3: Verify the Setup

1. **Test the Worker Health Check**:
   ```bash
   curl https://astoria-worker.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "astoria-worker",
     "version": "1.0.0"
   }
   ```

2. **Test the Webhook (Manual Trigger)**:
   ```bash
   curl -X POST https://astoria-worker.onrender.com/webhook/astoria-update \
     -H "Authorization: Bearer <<WEBHOOK_SECRET>>" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

3. **Test the Vercel Cron Endpoint**:
   ```bash
   curl -X POST "https://camilomartinez.co/api/cron/astoria-update?secret=cron_secure_astoria_update_2024"
   ```

   Expected response:
   ```json
   {
     "success": true,
     "type": "astoria-update",
     "workerResponse": {...},
     "scheduledBy": "vercel-cron",
     "updatedAt": "2025-10-10T...",
     "durationSeconds": 5.2
   }
   ```

## How It Works

1. **Every Monday at 1:30 PM (EST)**:
   - Vercel Cron triggers `/api/cron/astoria-update`
   - The cron secret validates the request

2. **Vercel calls the Render Worker**:
   - Sends POST request to `https://astoria-worker.onrender.com/webhook/astoria-update`
   - Includes authentication via `Authorization` header

3. **Worker runs the Python script**:
   - Executes `backend/app/scripts/astoria/update_progress.py`
   - Fetches latest Strava runs from database
   - Matches GPS traces to street network
   - Generates updated GeoJSON files
   - Writes to `public/data/astoria-conquest/`

4. **Files are updated**:
   - `astoria-covered-streets.geojson` - Progress visualization
   - `astoria-progress-stats.json` - Statistics and metadata

5. **Next deployment picks up changes**:
   - Commit and push the updated files
   - Or configure auto-commit in the worker

### GitHub Actions (Optional)

If you want to run the same update job in GitHub Actions for testing or redundancy, set the following secrets in the repository settings under **Settings → Secrets & variables → Actions**:

- `DATABASE_URL` (or `POSTGRES_URL_NONPRISMA`) — a Postgres connection string the workflow can use to pull Strava runs and WHOOP data.

The workflow `Astoria Conquest Weekly Update` supports manual runs and safe testing via inputs: on the workflow run page choose 'Run workflow', then you can set `skip_db=true` to skip DB steps (no data fetch) or `commit_changes=true` to allow committing generated assets back to `main`.

## Monitoring

### Check Logs

**Render.com Logs**:
- Go to https://dashboard.render.com
- Click on "astoria-worker"
- View "Logs" tab

**Vercel Logs**:
- Go to Vercel dashboard → Your project
- Click "Deployments" → Select a deployment
- View "Functions" tab → Find `/api/cron/astoria-update`

### Manual Trigger

You can manually trigger an update anytime:

```bash
curl -X POST "https://camilomartinez.co/api/cron/astoria-update?secret=cron_secure_astoria_update_2024&dryRun=false"
```

## Troubleshooting

### Worker Fails to Start
- Check Render logs for Python dependency errors
- Verify `requirements.txt` has all needed packages
- Ensure PostgreSQL connection string is correct

### Cron Not Triggering
- Check Vercel cron logs in dashboard
- Verify the schedule: `30 13 * * 1` (Monday 1:30 PM)
- Ensure cron secret matches in both `vercel.json` and environment

### Script Timeout
- Increase `maxDuration` in `/api/cron/astoria-update/route.ts`
- Optimize the Python script (reduce data processing)
- Consider splitting into smaller tasks

### Database Connection Fails
- Verify `POSTGRES_URL_NONPRISMA` is set correctly
- Check if database allows connections from Render.com IPs
- Test connection directly from Render shell

## Alternative: Use Render Cron Jobs (Simpler!)

Instead of Vercel Cron → Render Worker, you can use Render's built-in cron jobs:

1. In `render.yaml`, uncomment the cron service:
   ```yaml
   - type: cron
     name: astoria-weekly-update
     schedule: "30 13 * * 1"
     buildCommand: "cd backend && pip install -r requirements.txt"
     startCommand: "cd backend && python app/scripts/astoria/update_progress.py"
   ```

2. Deploy to Render - it will automatically run the script every Monday

3. Remove the Vercel cron job from `vercel.json`

**Pros**: Simpler, no webhook needed
**Cons**: Requires Render to access your repository directly

## Cost

- **Render.com Free Tier**:
  - ✅ 750 hours/month (enough for this use case)
  - ⚠️ Spins down after 15 min inactivity
  - ⚠️ Cold start ~30 seconds

- **Render.com Starter Plan ($7/month)**:
  - ✅ Always on (no cold starts)
  - ✅ Better for reliability

## Files Created

- `render.yaml` - Render.com configuration
- `backend/requirements.txt` - Python dependencies
- `backend/app/api/worker_webhook.py` - Flask webhook server
- `src/app/api/cron/astoria-update/route.ts` - Vercel cron endpoint
- `vercel.json` - Added Astoria cron job

## Next Steps

1. ✅ Deploy worker to Render.com
2. ✅ Add environment variables to Vercel
3. ✅ Test the webhook manually
4. ⏰ Wait for Monday 1:30 PM or trigger manually
5. 🎉 Enjoy automatic updates!
