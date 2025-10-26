# Vercel Documentation

Complete guide for managing your Vercel deployment and environment variables.

## Quick Start

```bash
# Pull environment variables from Vercel
./scripts/sync-env.sh pull

# Start development server
npm run dev

# Deploy to production
vercel --prod
```

## Documentation Files

### 📚 [Environment Variables Guide](./environment-variables.md)
Everything you need to know about managing environment variables:
- How environment variables work in Vercel
- Pulling and pushing variables
- Managing secrets
- Security best practices
- Your project's 30 environment variables explained

**Use this when:**
- Setting up the project for the first time
- Adding new API keys or secrets
- Syncing environment variables
- Troubleshooting missing variables

### 🛠️ [CLI Reference](./cli-reference.md)
Complete command reference for Vercel CLI:
- All Vercel CLI commands
- Deployment commands
- Environment variable commands
- Common workflows
- Troubleshooting

**Use this when:**
- Looking up a specific Vercel command
- Deploying to production
- Managing domains
- Debugging deployment issues

### 🔄 [Environment Sync Script](../../scripts/sync-env.sh)
Automated script for syncing environment variables:
```bash
# Pull from Vercel
./scripts/sync-env.sh pull

# Check status
./scripts/sync-env.sh status

# List variables
./scripts/sync-env.sh list

# Add new variable
./scripts/sync-env.sh add VARIABLE_NAME

# Show help
./scripts/sync-env.sh help
```

**Use this when:**
- Syncing environment variables regularly
- Checking what's on Vercel vs local
- Adding or removing variables

## Common Tasks

### First Time Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link to Project** (already done)
   ```bash
   vercel link --project=camilo-martinez-portfolio
   ```

4. **Pull Environment Variables**
   ```bash
   ./scripts/sync-env.sh pull
   # or
   vercel env pull .env.local
   ```

5. **Install Dependencies**
   ```bash
   npm install
   ```

6. **Start Development**
   ```bash
   npm run dev
   ```

### Daily Development

```bash
# 1. Pull latest environment variables (if team members added new ones)
./scripts/sync-env.sh pull

# 2. Start dev server
npm run dev

# 3. Make changes...

# 4. Test locally
npm run build  # Make sure it builds

# 5. Deploy to preview (optional)
vercel

# 6. Commit and push
git add .
git commit -m "Your changes"
git push origin main
# Vercel will auto-deploy to production
```

### Adding a New Environment Variable

**Method 1: Using the Sync Script (Recommended)**
```bash
./scripts/sync-env.sh add NEW_VARIABLE_NAME
# Follow prompts to enter value and select environments
./scripts/sync-env.sh pull  # Pull it to local
```

**Method 2: Using Vercel CLI**
```bash
vercel env add NEW_VARIABLE_NAME
vercel env pull .env.local
```

**Method 3: Using Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/settings/environment-variables)
2. Click "Add New"
3. Enter name, value, select environments
4. Run: `./scripts/sync-env.sh pull`

### Deploying Changes

**Preview Deployment (for testing)**
```bash
vercel
# Test the preview URL, then deploy to production if good
```

**Production Deployment**
```bash
# Option 1: Push to main (auto-deploys)
git push origin main

# Option 2: Manual deploy
vercel --prod
```

### Troubleshooting

**Environment variables not working locally?**
```bash
./scripts/sync-env.sh pull
npm run dev  # Restart dev server
```

**Want to see what's on Vercel?**
```bash
./scripts/sync-env.sh list
```

**Check overall status**
```bash
./scripts/sync-env.sh status
```

**Deployment failing?**
```bash
# Check build logs
vercel logs

# Check environment variables in production
vercel env ls production
```

## Your Project Configuration

### Project Details
- **Name**: `camilo-martinez-portfolio`
- **Team**: `juancamilos-projects-0340fa98`
- **Production URL**: https://camilomartinez.co
- **Preview URL**: https://portfolio-starter-kit-juancamilos-projects-0340fa98.vercel.app

### Environment Variables (30 total)
See [Environment Variables Guide](./environment-variables.md) for complete list.

Key variables:
- **Database**: `POSTGRES_URL`, `DATABASE_URL` (Neon)
- **APIs**: `OPENAI_API_KEY`, `WHOOP_*`, `STRAVA_*`
- **Auth**: `AUTH_SECRET`, `NEXTAUTH_URL`
- **Cron**: `CRON_SECRET`, `STRAVA_CRON_SECRET`

### Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you push to any other branch or open a PR

### Cron Jobs

Your project has 3 scheduled tasks (see [vercel.json](../../vercel.json)):
1. **Daily WHOOP sync** - 7:00 PM daily
2. **Weekly Strava sync** - 1:00 PM every Monday
3. **Astoria map update** - 1:30 PM every Monday

## Security Best Practices

### ✅ DO
- Use the sync script to manage environment variables
- Keep `.env.local` in `.gitignore` (already done)
- Use different secrets for dev/production
- Rotate secrets regularly
- Keep `.env.example` updated (without real values)

### ❌ DON'T
- Never commit `.env.local` to git
- Never share secrets in messages/emails
- Don't use same secrets across projects
- Don't hardcode secrets in code

## Quick Reference

### Sync Script Commands
```bash
./scripts/sync-env.sh pull      # Download from Vercel
./scripts/sync-env.sh list      # List Vercel variables
./scripts/sync-env.sh status    # Check status
./scripts/sync-env.sh add VAR   # Add new variable
./scripts/sync-env.sh remove VAR # Remove variable
./scripts/sync-env.sh help      # Show help
```

### Vercel CLI Commands
```bash
vercel login                    # Login to Vercel
vercel link                     # Link to project
vercel env pull .env.local      # Pull environment variables
vercel env ls                   # List variables
vercel env add VAR              # Add variable
vercel                          # Deploy to preview
vercel --prod                   # Deploy to production
vercel logs                     # View deployment logs
```

### NPM Scripts
```bash
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run start                   # Start production server
npm run db:setup                # Setup database
npm run data:load-streets       # Load Astoria streets
```

## Helpful Links

### Vercel Dashboard
- [Project Overview](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio)
- [Environment Variables](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/settings/environment-variables)
- [Deployments](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/deployments)
- [Domains](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/settings/domains)
- [Storage (Database)](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/stores)

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [CLI Reference](https://vercel.com/docs/cli)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

## Need Help?

1. **Check the status first**
   ```bash
   ./scripts/sync-env.sh status
   ```

2. **Review the guides**
   - [Environment Variables Guide](./environment-variables.md)
   - [CLI Reference](./cli-reference.md)

3. **Check Vercel logs**
   ```bash
   vercel logs
   ```

4. **Still stuck?**
   - Check [Vercel Documentation](https://vercel.com/docs)
   - View deployment logs in [Vercel Dashboard](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/deployments)
