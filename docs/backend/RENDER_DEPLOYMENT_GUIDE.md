# Render.com Backend Deployment Guide

Complete guide to deploy your Python backend (FastAPI + Flask webhooks) to Render.com's free tier.

## 🎯 Architecture Overview

```
Vercel (Next.js)  →  HTTP Webhooks  →  Render.com (Python Backend)
                                             ↓
                                    PostgreSQL (Vercel Postgres)
```

---

## 📋 Prerequisites

- ✅ GitHub account (Render deploys from GitHub)
- ✅ Render.com account (free)
- ✅ PostgreSQL database URL (you have this from Vercel)

---

## 🚀 Step 1: Sign Up for Render.com

1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub (recommended - enables auto-deploy)
4. Authorize Render to access your GitHub repos

---

## 🔧 Step 2: Create Web Service

### 2.1 Connect Repository
1. In Render dashboard, click "New +" → "Web Service"
2. Click "Connect a repository"
3. Find `camilomartinez-portfolio` and click "Connect"

### 2.2 Configure Service
Fill in these settings:

**Basic Settings:**
- **Name:** `astoria-worker` (or any name you prefer)
- **Region:** `Oregon (US West)` (closest to Vercel)
- **Branch:** `main`
- **Root Directory:** Leave empty (Render will find render.yaml)
- **Runtime:** `Python 3`

**Build & Start Commands:**
- **Build Command:** `cd backend && pip install -r requirements.txt`
- **Start Command:** `cd backend && gunicorn app.api.worker_webhook:app --bind 0.0.0.0:$PORT --timeout 300`

**Instance Type:**
- Select **Free** tier
  - 750 hours/month free
  - Sleeps after 15 min inactivity
  - Wakes in ~30 seconds on request

### 2.3 Environment Variables
Click "Advanced" → "Add Environment Variable" and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `PYTHON_VERSION` | `3.11.0` | Python version |
| `POSTGRES_URL_NONPRISMA` | `postgres://user:pass@host.vercel-storage.com:5432/db` | Copy from Vercel (NOT POSTGRES_PRISMA_URL!) |
| `DATABASE_URL` | `postgres://user:pass@host.vercel-storage.com:5432/db` | Same as above |
| `WORKER_WEBHOOK_SECRET` | Generate random 32-char string | Use: `openssl rand -hex 16` |

**How to get PostgreSQL URL:**
1. Go to Vercel dashboard
2. Go to your project → Storage → Postgres
3. Copy `.env.local` tab content
4. Find `POSTGRES_URL_NONPRISMA` value

### 2.4 Health Check
- **Health Check Path:** `/health`
- This tells Render your service is running

### 2.5 Deploy!
Click **"Create Web Service"**

Render will:
1. Clone your repo
2. Install dependencies
3. Start gunicorn server
4. Assign you a URL like: `https://astoria-worker-xyz.onrender.com`

⏱️ **First deployment takes 3-5 minutes**

---

## ✅ Step 3: Verify Deployment

### 3.1 Check Health Endpoint
Once deployed, test the health endpoint:

```bash
curl https://your-service-name.onrender.com/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "astoria-worker",
  "version": "1.0.0"
}
```

### 3.2 Check Render Logs
1. Go to your service in Render dashboard
2. Click "Logs" tab
3. You should see:
```
Starting gunicorn...
Listening at: http://0.0.0.0:10000
```

---

## 🔗 Step 4: Connect Vercel to Render

### 4.1 Get Your Render URL
In Render dashboard, copy your service URL:
```
https://astoria-worker-xyz.onrender.com
```

### 4.2 Add Environment Variables to Vercel
1. Go to Vercel dashboard
2. Your project → Settings → Environment Variables
3. Add these variables for **all environments** (Production, Preview, Development):

| Key | Value |
|-----|-------|
| `ASTORIA_WORKER_URL` | `https://astoria-worker-xyz.onrender.com` |
| `WORKER_WEBHOOK_SECRET` | Same 32-char string you used in Render |

### 4.3 Redeploy Vercel
After adding env vars:
1. Go to Deployments tab
2. Click "..." on latest deployment → "Redeploy"
3. This makes new env vars available

---

## 🧪 Step 5: Test the Integration

### 5.1 Test Correlation Endpoint
```bash
curl -X POST https://astoria-worker-xyz.onrender.com/webhook/correlate-activities \
  -H "Authorization: Bearer <WEBHOOK_SECRET>" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "status": "success",
  "candidates_found": 5,
  "correlations_created": 5,
  "timestamp": "2025-11-12T20:00:00.000000"
}
```

### 5.2 Test from Vercel
Test that Vercel can call your backend:

```bash
curl -X POST https://www.camilomartinez.co/api/cron/strava-monday-sync?dryRun=true
```

Should return:
```json
{
  "ok": true,
  "endpoint": "strava-monday-sync",
  "includes": ["strava-weekly-sync", "astoria-update"]
}
```

---

## 🔄 Step 6: Update Monday Cron (Optional)

Now update your Monday cron to call correlation:

This is already done in your code! The Monday sync will automatically:
1. ✅ Sync Strava activities
2. 🆕 **Call `/webhook/correlate-activities`** (NEW!)
3. ✅ Update Astoria map

---

## 📊 Monitoring & Maintenance

### Check Deployment Status
**Render Dashboard:**
- https://dashboard.render.com
- Monitor uptime, requests, logs

### Free Tier Limitations
⚠️ **Service sleeps after 15 min inactivity**
- First request after sleep takes ~30 seconds
- Subsequent requests are instant
- Not an issue for weekly cron jobs

### Upgrade Options
If you need 24/7 uptime:
- **Starter Plan:** $7/month per service
- No sleep, always-on
- Better for production

---

## 🐛 Troubleshooting

### Issue: "Application failed to respond"
**Solution:** Check Render logs for Python errors
```bash
# In Render dashboard → Logs tab
# Look for import errors or missing dependencies
```

### Issue: "Unauthorized" when calling webhook
**Solution:** Verify secrets match
```bash
# Check Render env vars match Vercel env vars
echo $WORKER_WEBHOOK_SECRET  # In Render logs
```

### Issue: "Module not found" for correlation
**Solution:** Check requirements.txt includes all dependencies
```bash
# In backend/requirements.txt, ensure you have:
sqlalchemy>=2.0.0
asyncpg
psycopg2-binary
```

### Issue: Service won't start
**Solution:** Check build logs
1. Go to Render dashboard
2. Click "Events" tab
3. Look for build failures
4. Common issues:
   - Missing dependencies in requirements.txt
   - Python version mismatch
   - Import path errors

---

## 📚 Additional Resources

**Render Documentation:**
- Web Services: https://render.com/docs/web-services
- Environment Variables: https://render.com/docs/environment-variables
- Health Checks: https://render.com/docs/health-checks

**Your Backend Code:**
- Flask Webhook: [backend/app/api/worker_webhook.py](../../backend/app/api/worker_webhook.py)
- Correlation Logic: [backend/app/workers/tasks/strava.py](../../backend/app/workers/tasks/strava.py)
- Render Config: [render.yaml](../../render.yaml)

---

## 🎓 Learning Outcomes

By deploying to Render, you'll learn:
- ✅ How to deploy Python backends separately from frontend
- ✅ Webhook authentication patterns
- ✅ Environment variable management across services
- ✅ Microservices architecture (frontend + backend)
- ✅ Health checks and monitoring
- ✅ Serverless vs. persistent server tradeoffs

---

## 🚀 Next Steps

After deployment:
1. ✅ Test correlation endpoint works
2. ✅ Wait for Monday cron to run automatically
3. ✅ Check Render logs to see correlation results
4. ✅ Monitor Astoria map updates with enriched WHOOP data

**Your backend is now learning FastAPI patterns!** 🎉
