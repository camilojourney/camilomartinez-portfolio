# Vercel Quick Start Guide

**TL;DR**: Everything you need to get started in 5 minutes.

## ⚡ Super Quick Commands

```bash
# Pull environment variables from Vercel
npm run env:pull

# Check status
npm run env:status

# Pull env + start dev server
npm run env:sync

# Deploy to production
vercel --prod
```

## 🚀 First Time Setup (5 minutes)

### 1. Install Vercel CLI (one time only)
```bash
npm install -g vercel
```

### 2. Login to Vercel (one time only)
```bash
vercel login
```

### 3. Pull Environment Variables
```bash
npm run env:pull
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Development
```bash
npm run dev
```

**Done!** Your app should be running at http://localhost:3000

## 📋 Daily Workflow

```bash
# Morning: Pull latest environment variables (if needed)
npm run env:pull

# Start development
npm run dev

# Make your changes...
# Test locally...

# Deploy when ready
git add .
git commit -m "Your changes"
git push origin main
# ✨ Vercel auto-deploys to production!
```

## 🔧 Common Tasks

### Check if Everything is Set Up
```bash
npm run env:status
```

You should see:
- ✓ Vercel CLI installed
- ✓ Project linked: camilo-martinez-portfolio
- ✓ Local .env file exists (30 variables)

### Add a New Environment Variable

**Option 1: Using CLI (one variable at a time)**
```bash
# Add to Vercel
vercel env add VARIABLE_NAME

# Pull to local
npm run env:pull

# Restart dev server
npm run dev
```

**Option 2: Using Dashboard (better for multiple variables)**
1. Go to: https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/settings/environment-variables
2. Click **"Add New"** for each variable
3. Paste name and value
4. Select all environments you need (development, preview, production)
5. Click **"Save"**
6. Pull all variables to local:
   ```bash
   npm run env:pull
   npm run dev
   ```

### View What's on Vercel
```bash
npm run env:list
```

### Test Database Connection
```bash
npm run test:db-schema
```

You should see:
- ✅ Database connected
- List of tables and record counts

## 🐛 Troubleshooting

### "Environment variable not found"
```bash
# Pull latest from Vercel
npm run env:pull

# Restart dev server
npm run dev
```

### "Cannot connect to database"
```bash
# Check environment variables
npm run env:status

# Test connection
npm run test:db-schema
```

### "Vercel CLI not found"
```bash
# Install it
npm install -g vercel

# Verify
vercel --version
```

### "Project not linked"
```bash
# Link to your project
vercel link --project=camilo-martinez-portfolio
```

## 📚 Learn More

- [Full Environment Variables Guide](./environment-variables.md)
- [Complete CLI Reference](./cli-reference.md)
- [Main Vercel Documentation](./README.md)

## 🎯 Most Important Commands

| Command | What It Does |
|---------|-------------|
| `npm run env:pull` | Download environment variables from Vercel |
| `npm run env:status` | Check setup status |
| `npm run dev` | Start development server |
| `npm run test:db-schema` | Test database connection |
| `vercel --prod` | Deploy to production |

## ✨ You're Ready!

You now have:
- ✅ Vercel CLI installed
- ✅ Project linked to Vercel
- ✅ All 30 environment variables downloaded
- ✅ Database connection working
- ✅ Development server ready to start

Just run `npm run dev` and start coding! 🎉
