# 🤖 GitHub Actions Weekly Automation Setup

## ✅ What Was Created

1. **`.github/workflows/weekly-notion-sync.yml`** - Automation workflow that runs every Sunday at 6 AM EST
2. **Updated `update_notion_goals.py`** - Now uses environment variables for security

---

## 🔐 Step 1: Add GitHub Secrets

You need to add 3 secrets to your GitHub repository. These are stored securely and never exposed in logs.

### How to add secrets:

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/1-camilomartinez-portfolio`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret** button
5. Add each of these 3 secrets:

#### Secret 1: `DATABASE_URL`
**Name:** `DATABASE_URL`  
**Value:** Your Render Postgres connection string

```
postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

**Where to find it:**
- Go to your Render dashboard → Database → Internal Connection String
- **Important:** Use the INTERNAL connection string (faster, no external network)

---

#### Secret 2: `NOTION_TOKEN`
**Name:** `NOTION_TOKEN`  
**Value:** Your Notion integration token

**Where to find it:**
- Go to your Notion integration settings
- Copy the "Internal Integration Token"
- Starts with `ntn_`

---

#### Secret 3: `NOTION_DATABASE_ID`
**Name:** `NOTION_DATABASE_ID`  
**Value:** 
```
2e3e98e30a3080c6a15ae087562cf137
```

---

## 🧪 Step 2: Test the Workflow

Before waiting for Sunday, test it manually:

1. Go to **Actions** tab in GitHub
2. Click **📊 Weekly Notion Sync** workflow (left sidebar)
3. Click **Run workflow** dropdown (right side)
4. Click the green **Run workflow** button
5. Watch it run! Should complete in ~2-3 minutes

**What to check:**
- ✅ All 6 steps should be green
- ✅ Step 5 should show "Calculating last week's habits data..."
- ✅ Step 6 should show "8/8 goal pages updated"
- ✅ Check your Notion - all 8 pages should have Jan 4-10 data

---

## 📅 Step 3: How It Works Weekly

Every **Sunday at 6:00 AM EST** (11:00 UTC), GitHub will automatically:

1. **Wake up** a fresh Ubuntu server
2. **Clone** your repository
3. **Install** Python + dependencies
4. **Run** `populate_weekly_habits.py` → Calculates last completed week (e.g., Jan 11-17)
5. **Run** `update_notion_goals.py` → Updates your 8 Notion goal pages
6. **Shut down** - All done!

**Timeline:**
- Takes 2-3 minutes total
- By 6:05 AM, your Notion is ready for weekly review ☕

---

## 🔍 Monitoring

### Check if it ran:
1. Go to **Actions** tab in GitHub
2. See all runs - green ✅ = success, red ❌ = failed

### If it fails:
1. Click the failed run
2. Click the red step to see error logs
3. Common issues:
   - **Database connection error** → Check `DATABASE_URL` secret is correct
   - **Notion API error** → Check `NOTION_TOKEN` is valid
   - **No data** → Check `populate_weekly_habits.py` ran successfully

---

## 🎯 Local Testing

To test locally without waiting for Sunday:

```bash
cd backend

# Set environment variables (use your actual tokens)
export NOTION_TOKEN="ntn_YOUR_TOKEN_HERE"
export NOTION_DATABASE_ID="YOUR_DATABASE_ID_HERE"

# Run the scripts
uv run python scripts/populate_weekly_habits.py --show --limit 3
uv run python scripts/update_notion_goals.py
```

---

## 🛑 Pause/Disable Automation

If you need to stop the automation temporarily:

1. Go to **Actions** tab
2. Click **📊 Weekly Notion Sync**
3. Click **⋯** (three dots) → **Disable workflow**

To re-enable: Same steps → **Enable workflow**

---

## 🔄 Change Schedule

Want it to run at a different time? Edit `.github/workflows/weekly-notion-sync.yml`:

```yaml
# Current: Sunday 6:00 AM EST (11:00 UTC)
- cron: '0 11 * * 0'

# Examples:
# Sunday 8:00 AM EST (13:00 UTC)
- cron: '0 13 * * 0'

# Monday 6:00 AM EST (11:00 UTC)
- cron: '0 11 * * 1'
```

**Cron format:** `minute hour day-of-month month day-of-week`
- Day: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- Always use UTC time (EST + 5 hours)

---

## 💡 Why This Works Better Than Alternatives

| Feature | GitHub Actions | Render Cron | Local Cron |
|---------|---------------|-------------|------------|
| **Cost** | ✅ Free | ❌ $7/month | ✅ Free |
| **Reliability** | ✅ Always runs | ✅ Always runs | ❌ Computer must be on |
| **Monitoring** | ✅ GitHub UI | ⚠️ Render logs | ❌ None |
| **Setup** | ✅ One YAML file | ⚠️ New service | ⚠️ Crontab config |
| **Secrets** | ✅ GitHub Secrets | ✅ Env vars | ❌ Exposed locally |

---

## 🎉 You're Done!

Once you add the GitHub secrets, your automation is live! Every Sunday at 6 AM, your Notion will automatically update with last week's data, ready for your weekly review.

**Next Sunday morning:**
1. Wake up ☕
2. Open Notion
3. See all your metrics already filled in
4. Start your weekly review immediately!
