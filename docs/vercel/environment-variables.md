# Vercel Environment Variables Management

## Understanding Environment Variables in Vercel

When you deploy to Vercel, your local `.env` files and Vercel's environment variables are **separate**:

- ✅ `.env.local` → Used by your **local dev environment**
- ✅ Vercel Environment Variables → Used by your **deployed app**
- ❌ They **do NOT sync automatically**

## Quick Reference

### Pull Environment Variables from Vercel

```bash
# Download all environment variables from Vercel to .env.local
vercel env pull .env.local

# Specify environment (development, preview, production)
vercel env pull .env.production production
```

### Push Environment Variables to Vercel

**Important:** Vercel does NOT have a direct bulk push command. You must add variables individually.

**Method 1: CLI (one at a time)**
```bash
# Add a single variable interactively
vercel env add VARIABLE_NAME

# Example: Add API key
vercel env add OPENAI_API_KEY
# Then select which environments: development, preview, production
```

**Method 2: Vercel Dashboard (best for multiple variables)**
1. Go to: https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/settings/environment-variables
2. Click **"Add New"** for each variable
3. Paste name and value
4. Select environments (development, preview, production)
5. Click **"Save"**
6. Pull all to local: `npm run env:pull`

### List Current Variables

```bash
# List all environment variables on Vercel
vercel env ls

# List for specific environment
vercel env ls production
```

### Remove a Variable

```bash
vercel env rm VARIABLE_NAME
```

## The 3 Ways to Manage Environment Variables

### Option 1: Manual Management (Vercel Dashboard)

**Best for:** Small projects, one-time setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `camilo-martinez-portfolio`
3. Go to **Settings** → **Environment Variables**
4. Add/Edit/Remove variables
5. Pull to local: `vercel env pull .env.local`

**Pros:**
- Visual interface
- Easy to understand
- Good for non-technical team members

**Cons:**
- Manual process
- Easy to forget to sync
- No version control

### Option 2: Vercel CLI (Recommended)

**Best for:** Regular syncing, automation

```bash
# Initial setup - link your project
vercel link

# Pull latest from Vercel
vercel env pull .env.local

# Add new variables
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY

# View what's on Vercel
vercel env ls
```

**Pros:**
- Fast and scriptable
- Works in automation
- Official Vercel tool

**Cons:**
- Still somewhat manual
- Need to remember to run commands

### Option 3: Automated Sync Script (Best for This Project)

**Best for:** Teams, frequent changes, automation pipelines

See [Environment Sync Script](#automated-sync-script) below.

## Your Current Environment Variables

This project uses **30 environment variables**:

### Database (Neon/Postgres)
```
DATABASE_URL                    # Pooled connection
DATABASE_URL_UNPOOLED           # Direct connection
POSTGRES_URL                    # Main Vercel Postgres URL
POSTGRES_URL_NON_POOLING        # Non-pooled connection
POSTGRES_URL_NO_SSL             # No SSL connection
POSTGRES_PRISMA_URL             # Prisma-specific URL
PGHOST                          # Database host
PGHOST_UNPOOLED                 # Direct host
PGDATABASE                      # Database name
PGUSER                          # Database user
PGPASSWORD                      # Database password
POSTGRES_HOST                   # Alternative host
POSTGRES_DATABASE               # Alternative database name
POSTGRES_USER                   # Alternative user
POSTGRES_PASSWORD               # Alternative password
NEON_PROJECT_ID                 # Neon project identifier
```

### Authentication
```
AUTH_SECRET                     # NextAuth encryption key
NEXTAUTH_URL                    # Your domain (https://camilomartinez.co)
```

### API Keys
```
OPENAI_API_KEY                  # OpenAI API access
WHOOP_CLIENT_ID                 # WHOOP OAuth client ID
WHOOP_CLIENT_SECRET             # WHOOP OAuth secret
WHOOP_ACCESS_TOKEN              # Active WHOOP token
STRAVA_CLIENT_ID                # Strava OAuth client ID
STRAVA_CLIENT_SECRET            # Strava OAuth secret
```

### Cron Job Security
```
CRON_SECRET                     # WHOOP daily fetch endpoint
STRAVA_CRON_SECRET              # Strava weekly sync endpoint
```

### Stack Auth (User Management)
```
NEXT_PUBLIC_STACK_PROJECT_ID
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
STACK_SECRET_SERVER_KEY
```

## Common Workflows

### First Time Setup

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link to your project
vercel link --project=camilo-martinez-portfolio

# 4. Pull environment variables
vercel env pull .env.local
```

### Adding a New Environment Variable

**Option A: Add via CLI (for single variables)**
```bash
vercel env add NEW_VARIABLE_NAME
# Select environments: development, preview, production
# Enter the value

# Pull to local
npm run env:pull
```

**Option B: Add via Dashboard (better for multiple variables)**
1. Go to: https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/settings/environment-variables
2. Click **"Add New"**
3. Enter name and value
4. Select environments (development, preview, production)
5. Click **"Save"**
6. Repeat for all variables you need to add
7. Pull all to local:
   ```bash
   npm run env:pull
   npm run dev
   ```

### Updating an Existing Variable

```bash
# 1. Remove the old one
vercel env rm VARIABLE_NAME

# 2. Add it again with new value
vercel env add VARIABLE_NAME

# 3. Pull to local
vercel env pull .env.local
```

### Syncing After Team Member Changes

```bash
# Pull latest from Vercel
vercel env pull .env.local

# Restart your dev server
npm run dev
```

### Before Deployment

```bash
# Make sure Vercel has latest environment variables
vercel env ls  # Check what's on Vercel

# If you added new variables locally, add them to Vercel
vercel env add NEW_VAR

# Then deploy
vercel deploy --prod
```

## Automated Sync Script

Create `scripts/sync-env.sh` (see next section) to automate this.

## Environment-Specific Variables

Vercel has 3 environments:

1. **Development** - Used for `vercel dev` and local development
2. **Preview** - Used for preview deployments (PRs, branches)
3. **Production** - Used for production deployments (`main` branch)

When adding variables, you can choose which environments get which values.

Example:
```bash
# Add API key for all environments
vercel env add OPENAI_API_KEY
# Select: development, preview, production

# Add debug flag only for development
vercel env add DEBUG_MODE
# Select: development only
```

## Security Best Practices

### DO:
- ✅ Use different secrets for development vs production
- ✅ Rotate secrets regularly (especially API keys)
- ✅ Use `.env.local` for local development (auto-ignored by git)
- ✅ Keep `.env.example` updated in git (no real values)
- ✅ Use strong random strings for `AUTH_SECRET` and `CRON_SECRET`

### DON'T:
- ❌ Never commit `.env.local` to git
- ❌ Never share secrets in Slack/Discord/Email
- ❌ Don't use the same secrets across projects
- ❌ Don't hardcode secrets in code

## Troubleshooting

### "No credentials found" error
```bash
# Login again
vercel login
```

### "Project not linked" error
```bash
# Link to correct project
vercel link --project=camilo-martinez-portfolio
```

### Environment variables not working locally
```bash
# Pull latest from Vercel
vercel env pull .env.local

# Restart dev server
npm run dev
```

### Environment variables not working in production
```bash
# Check what's on Vercel
vercel env ls production

# If missing, add them
vercel env add MISSING_VAR
# Select: production

# Redeploy
vercel deploy --prod
```

## Reference Links

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Vercel CLI Reference](https://vercel.com/docs/cli/env)
- [Your Vercel Dashboard](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/settings/environment-variables)
