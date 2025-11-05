# 🚀 Vercel Deployment Guide

> **Quick Reference** · **Last Updated:** November 5, 2025
> **For:** Deploying Next.js frontend to Vercel

---

## TL;DR

This project uses Vercel for frontend hosting with automatic deployments from `main` branch.

```bash
# Quick deployment
git push origin main  # Auto-deploys to production

# Preview deployment
git push origin feature-branch  # Auto-creates preview URL
```

---

## Project Configuration

### Environment Variables

**Required in Vercel Dashboard:**
```bash
# Core
NEXT_PUBLIC_SITE_URL=https://camilomartinez.co
NODE_ENV=production

# Backend API
NEXT_PUBLIC_FASTAPI_URL=https://api.camilomartinez.co  # Optional

# AI/Analytics
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ANALYTICS_ID=...  # If using analytics

# Integrations
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...

# Database (if using from frontend)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

**Set via Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add each variable for Production environment
3. Optionally add for Preview/Development

---

## Build Configuration

**Vercel automatically detects** Next.js projects. Current settings:

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

### Custom Build Settings (if needed)

Override in `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci --legacy-peer-deps"
}
```

---

## Deployment Workflow

### Automatic Deployments

**Production (`main` branch):**
```bash
git push origin main
# → Deploys to camilomartinez.co
# → Runs: install → build → deploy
# → ~2-3 minutes
```

**Preview (feature branches):**
```bash
git push origin feature-name
# → Creates preview URL: feature-name-camilomartinez.vercel.app
# → Perfect for testing before merge
```

### Manual Deployment

```bash
# Install Vercel CLI (one time)
npm i -g vercel

# Deploy current directory
vercel

# Deploy to production
vercel --prod
```

---

## Cron Jobs

**Configured in `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/cron/astoria-update",
      "schedule": "0 2 * * 0"
    },
    {
      "path": "/api/cron/evaluate-chats",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Protect cron endpoints** with secret:
```typescript
// In your API route
if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## Performance Optimization

### ISR (Incremental Static Regeneration)

```typescript
// In page.tsx
export const revalidate = 3600; // Revalidate every hour
```

### Edge Functions

For geographically distributed API routes:
```typescript
export const runtime = 'edge';
```

### Image Optimization

Next.js automatically optimizes images via Vercel:
```tsx
<Image
  src="/image.jpg"
  alt="..."
  width={800}
  height={600}
  priority  // For above-the-fold images
/>
```

---

## Monitoring

### View Deployment Status

1. **Vercel Dashboard**: vercel.com/your-project
2. **CLI**: `vercel logs`
3. **GitHub**: Check Actions tab for deployment status

### Analytics

Vercel provides built-in analytics:
- Real User Monitoring (RUM)
- Web Vitals tracking
- Geographic distribution

Access via Dashboard → Analytics

---

## Troubleshooting

### Build Failures

**Check build logs:**
```bash
vercel logs [deployment-url]
```

**Common issues:**
- Missing environment variables → Add in Dashboard
- TypeScript errors → Fix locally first: `npm run build`
- Dependency conflicts → Try `npm ci --legacy-peer-deps`

### Deployment Stuck

**Redeploy:**
```bash
vercel --prod --force
```

### Environment Variables Not Working

1. Ensure variables are set for correct environment (Production/Preview/Development)
2. Variables starting with `NEXT_PUBLIC_` are exposed to browser
3. Non-prefixed variables are server-side only
4. **Redeploy after adding variables**

---

## Custom Domain

**Current setup:** `camilomartinez.co`

To add/change:
1. Go to Project Settings → Domains
2. Add domain
3. Configure DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: camilomartinez-portfolio.vercel.app
   ```

---

## Security

### Environment Secrets

**Never commit secrets to git:**
```bash
# .env.local (gitignored)
DATABASE_URL=...
OPENAI_API_KEY=...
```

Set in Vercel Dashboard instead.

### Rate Limiting

Use Vercel's Edge Config for rate limiting:
```typescript
import { get } from '@vercel/edge-config';

export async function middleware(req: Request) {
  const rateLimit = await get('rate-limit');
  // Check rate limit logic
}
```

---

## Cost Management

**Free tier includes:**
- Unlimited deployments
- 100 GB bandwidth
- Automatic HTTPS
- Preview deployments

**Pro tier adds:**
- Priority support
- Advanced analytics
- Team collaboration

**Monitor usage:** Dashboard → Usage

---

## Quick Commands Reference

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Promote deployment to production
vercel promote [deployment-url]

# Environment variables
vercel env pull  # Download to .env.local
vercel env add   # Add new variable
```

---

## Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Edge Functions**: https://vercel.com/docs/functions/edge-functions
- **Cron Jobs**: https://vercel.com/docs/cron-jobs

---

*For backend deployment (Railway), see: `/backend/README.md`*
