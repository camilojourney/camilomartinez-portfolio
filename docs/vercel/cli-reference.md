# Vercel CLI Command Reference

Complete reference for Vercel CLI commands used in this project.

## Installation & Authentication

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Check Who's Logged In
```bash
vercel whoami
```

### Logout
```bash
vercel logout
```

## Project Management

### Link Project to Vercel
```bash
# Interactive linking (will show list of projects)
vercel link

# Link to specific project
vercel link --project=camilo-martinez-portfolio

# Link with auto-confirmation
vercel link --yes
```

### List All Projects
```bash
vercel project ls
```

### View Project Info
```bash
vercel inspect
```

## Environment Variables

### Pull Environment Variables
```bash
# Pull development environment variables to .env.local
vercel env pull .env.local

# Pull specific environment
vercel env pull .env.production production
vercel env pull .env.preview preview
```

### List Environment Variables
```bash
# List all environment variables
vercel env ls

# List for specific environment
vercel env ls development
vercel env ls preview
vercel env ls production
```

### Add Environment Variable
```bash
# Interactive add (will ask for value and environments)
vercel env add VARIABLE_NAME

# Example: Add an API key
vercel env add OPENAI_API_KEY
# Then you'll be prompted to:
# 1. Enter the value
# 2. Select environments (development, preview, production)
```

### Remove Environment Variable
```bash
# Remove a variable (will ask which environment)
vercel env rm VARIABLE_NAME

# Example
vercel env rm OLD_API_KEY
```

## Deployment

### Deploy to Preview
```bash
# Deploy current directory (creates preview deployment)
vercel

# Deploy with alias
vercel --name my-preview

# Deploy specific folder
vercel ./dist
```

### Deploy to Production
```bash
# Deploy to production
vercel --prod

# Deploy without prompts
vercel --prod --yes
```

### List Deployments
```bash
# List recent deployments
vercel list

# List with more details
vercel list --meta
```

### View Deployment Logs
```bash
# View logs for latest deployment
vercel logs

# View logs for specific deployment
vercel logs <deployment-url>
```

### Cancel Deployment
```bash
vercel cancel <deployment-url>
```

## Development

### Run Local Development Server
```bash
# Start dev server with Vercel environment
vercel dev

# Specify port
vercel dev --port 3001
```

This runs your Next.js app with:
- Vercel environment variables
- Serverless function simulation
- Edge function support

## Domains

### List Domains
```bash
vercel domains ls
```

### Add Domain
```bash
vercel domains add example.com
```

### Remove Domain
```bash
vercel domains rm example.com
```

## Project Settings

### View Project Settings
```bash
vercel project ls
```

### Open Project in Browser
```bash
# Open Vercel dashboard for current project
vercel --browse
```

## Secrets (Team-wide Variables)

Secrets are encrypted environment variables shared across all projects in a team.

### Add Secret
```bash
vercel secrets add secret-name secret-value
```

### List Secrets
```bash
vercel secrets ls
```

### Remove Secret
```bash
vercel secrets rm secret-name
```

### Use Secret in Environment Variable
In Vercel Dashboard, reference a secret with `@secret-name`:
```
DATABASE_URL = @database-url-secret
```

## Useful Commands for This Project

### Daily Workflow

```bash
# Start local development
npm run dev

# Or use Vercel dev for serverless functions
vercel dev
```

### Sync Environment Variables

```bash
# Pull latest from Vercel
vercel env pull .env.local

# Check what's on Vercel
vercel env ls

# Add new variable
vercel env add NEW_VAR

# Or use the sync script
./scripts/sync-env.sh pull
```

### Deployment

```bash
# Deploy to preview (for testing)
vercel

# Deploy to production
vercel --prod
```

### Debugging

```bash
# Check project link
cat .vercel/project.json

# View deployment logs
vercel logs

# List recent deployments
vercel list
```

## Environment Types

Vercel has 3 environment types:

### Development
- Used for local development (`vercel dev`)
- Used when pulling with `vercel env pull`
- Not used in actual deployments

### Preview
- Used for all non-production deployments
- Triggered by pushes to non-main branches
- Triggered by pull requests
- Triggered by `vercel` command

### Production
- Used for production deployments
- Triggered by pushes to main branch
- Triggered by `vercel --prod` command

## Common Workflows

### First Time Setup
```bash
# 1. Install CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link --project=camilo-martinez-portfolio

# 4. Pull environment variables
vercel env pull .env.local

# 5. Install dependencies
npm install

# 6. Start dev server
npm run dev
```

### Adding a New Environment Variable
```bash
# 1. Add on Vercel
vercel env add NEW_VARIABLE

# 2. Select environments (development, preview, production)
# 3. Enter the value

# 4. Pull to local
vercel env pull .env.local

# 5. Restart dev server
npm run dev
```

### Deploying a New Feature
```bash
# 1. Make sure code is committed
git add .
git commit -m "Add new feature"

# 2. Deploy to preview first
vercel

# 3. Test the preview URL
# 4. If good, merge to main and deploy to production
git push origin main
# (Vercel will auto-deploy on push to main)

# Or manually deploy to production
vercel --prod
```

### Troubleshooting Environment Variables
```bash
# 1. Check what's on Vercel
vercel env ls

# 2. Pull latest
vercel env pull .env.local

# 3. Verify local file
cat .env.local | grep VARIABLE_NAME

# 4. Restart dev server
npm run dev
```

## Advanced Usage

### Deploy with Build Environment Variables
```bash
# Set build-time environment variable
vercel --build-env NODE_ENV=production
```

### Deploy with Custom Name
```bash
vercel --name my-custom-deployment
```

### Deploy with Specific Branch
```bash
vercel --target production --branch main
```

### View Build Logs
```bash
vercel logs <deployment-url> --follow
```

## CLI Flags Reference

| Flag | Description | Example |
|------|-------------|---------|
| `--prod` | Deploy to production | `vercel --prod` |
| `--yes` | Skip confirmation prompts | `vercel link --yes` |
| `--force` | Force rebuild | `vercel --force` |
| `--no-wait` | Don't wait for deployment to finish | `vercel --no-wait` |
| `--debug` | Show debug information | `vercel --debug` |
| `--token <token>` | Use specific token | `vercel --token xxx` |
| `--scope <team>` | Set team scope | `vercel --scope team-name` |
| `--cwd <dir>` | Change working directory | `vercel --cwd ./app` |

## Getting Help

### View CLI Help
```bash
# General help
vercel help

# Help for specific command
vercel env help
vercel deploy help
```

### Check Version
```bash
vercel --version
```

## Automation & CI/CD

### Using in GitHub Actions
```yaml
- name: Deploy to Vercel
  run: |
    npm install -g vercel
    vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
    vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
    vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Using in Scripts
```bash
#!/bin/bash
# Deploy script
vercel --prod --yes --token="${VERCEL_TOKEN}"
```

## Project-Specific Info

### Your Project
- **Name**: `camilo-martinez-portfolio`
- **Team**: `juancamilos-projects-0340fa98`
- **Production URL**: https://camilomartinez.co
- **Vercel URL**: https://portfolio-starter-kit-juancamilos-projects-0340fa98.vercel.app

### Quick Links
- [Vercel Dashboard](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio)
- [Environment Variables](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/settings/environment-variables)
- [Deployments](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/deployments)
- [Domains](https://vercel.com/juancamilos-projects-0340fa98/camilo-martinez-portfolio/settings/domains)

## Resources

- [Official Vercel CLI Docs](https://vercel.com/docs/cli)
- [Environment Variables Guide](https://vercel.com/docs/projects/environment-variables)
- [Deployment Guide](https://vercel.com/docs/deployments/overview)
