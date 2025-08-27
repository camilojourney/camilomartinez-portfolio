# Camilo Martinez - AI Developer Portfolio 🚀

A modern, interactive portfolio showcasing expertise in AI development, data analytics, and full-stack development. Built with Next.js 15 App Router and featuring a unique liquid glass design system.

## 🧠 **Full-Stack Developer Learning Guide**

*This README serves as both project documentation and a comprehensive guide for understanding modern full-stack development, debugging methodologies, and system architecture.*

### **🎯 How to Think Like a Full-Stack Developer**

Full-stack development isn't just about knowing multiple technologies—it's about understanding how systems connect and debugging across the entire stack. This project demonstrates real-world patterns you'll encounter in production.

#### **The Mental Model: Data Flow Architecture**

Think of your application as a **data pipeline** with clear boundaries:

```
User Request → Authentication → API → Business Logic → Database → Response → UI
```

Every bug or feature request can be traced through this pipeline. When something breaks, you debug **systematically through each layer**.

### **🏗️ Architecture Philosophy: Separation of Concerns**

This project follows a core principle: **every file and folder has a single, clear job**. Think of it like a well-organized restaurant:

| Folder | Restaurant Analogy | Technical Purpose | Debugging Strategy |
|--------|-------------------|------------------|-------------------|
| `src/app/` | The Menu & Host 🗺️ | Defines routes and pages | Check URL structure, routing issues |
| `src/components/` | The LEGO Bricks 🧱 | Reusable UI building blocks | Test component isolation, props |
| `src/lib/` | The Kitchen & Pantry ⚙️ | Business logic, APIs, database | Debug data transformation, API calls |
| `src/types/` | The Recipe Cards 📋 | Data shape definitions | Verify data structure matches expectations |
| `public/` | The Art on Walls 🖼️ | Static assets | Check file paths, loading issues |

### **🔍 Real-World Debugging Case Study: WHOOP Integration**

This project includes a complete WHOOP API integration that demonstrates common full-stack debugging scenarios you'll face in production.

#### **Problem 1: Limited Data Collection**
```
🐛 Issue: Only getting 25 days of data instead of historical data
🔍 Debug Process:
1. Check API response structure
2. Verify pagination implementation  
3. Read API documentation for correct method
4. Test with small data sets first
✅ Solution: Changed from page-based to token-based pagination
```

#### **Problem 2: Data Quality Issues**
```
🐛 Issue: Collecting incomplete/ongoing activities
🔍 Debug Process:
1. Analyze what constitutes "complete" data
2. Identify filter criteria (end_time presence)
3. Implement filtering at collection time
4. Test with edge cases (current day activities)
✅ Solution: Filter records without end_time at API level
```

#### **Problem 3: Authentication in Production**
```
🐛 Issue: OAuth tokens expiring, manual processes don't scale
🔍 Debug Process:
1. Understand token lifecycle (access vs refresh tokens)
2. Implement automatic token renewal
3. Set up secure automation with proper secrets
4. Monitor and log for production debugging
✅ Solution: Vercel Cron with refresh token automation
```

### **⚡ Fast Debugging Methodology**

When you encounter a bug, follow this systematic approach:

#### **1. Isolate the Layer**
```bash
# Is it Frontend? Test the API directly
curl -X POST "https://yourapi.com/endpoint" -H "Content-Type: application/json"

# Is it Backend? Check the logs
console.log("Data at this point:", data)

# Is it Database? Test the query
SELECT * FROM table WHERE condition LIMIT 5;

# Is it Authentication? Verify tokens
console.log("Session:", session, "Token expires:", expiresAt)
```

#### **2. Check the Data Flow**
```typescript
// Add debugging at each step
console.log("1. Raw API response:", apiResponse);
console.log("2. Processed data:", processedData);
console.log("3. Database input:", dbInput);
console.log("4. Database output:", dbOutput);
console.log("5. UI props:", props);
```

#### **3. Use TypeScript as Your Debugging Tool**
```typescript
// TypeScript will catch many issues before runtime
interface WhoopActivity {
  id: string;
  end_time?: string;  // Optional = might be incomplete
}

// This will error if you try to access end_time without checking
const completeActivities = activities.filter(a => a.end_time); // ✅ Safe
```

### **🔧 Production-Ready Patterns Demonstrated**

#### **Automated Data Collection with Error Handling**
```typescript
// src/app/api/cron/daily-data-fetch/route.ts
export async function POST() {
  try {
    const results = await collectWhoopData();
    
    // Log success details for monitoring
    console.log(`✅ Collected: ${results.cycles} cycles, ${results.sleep} sleep records`);
    
    return Response.json({ success: true, results });
  } catch (error) {
    // Comprehensive error logging for debugging
    console.error("❌ Data collection failed:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return Response.json({ error: "Collection failed" }, { status: 500 });
  }
}
```

#### **OAuth Token Management with Automatic Refresh**
```typescript
// src/lib/auth.ts - Production-ready token handling
async function refreshAccessToken(token) {
  try {
    const response = await fetch('https://api.whoop.com/oauth/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
        client_id: process.env.WHOOP_CLIENT_ID,
        client_secret: process.env.WHOOP_CLIENT_SECRET,
      }),
    });

    if (!response.ok) throw new Error('Token refresh failed');
    
    const refreshedTokens = await response.json();
    
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}
```

#### **Rate-Limited API Client with Retry Logic**
```typescript
// src/lib/whoop.ts - Production API client
export class WhoopV2Client {
  private async makeRequest(endpoint: string, params: any = {}) {
    const url = new URL(`https://api.prod.whoop.com/developer/v2${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (response.status === 429) {
      // Rate limited - wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.makeRequest(endpoint, params);
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
```

### **📊 System Architecture: How Everything Fits Together**

#### **Data Collection Flow**
```
1. User authenticates via WHOOP OAuth
   ↓
2. Vercel Cron triggers daily at 2:00 PM UTC
   ↓
3. API fetches data using token-based pagination
   ↓
4. Data filtered for completeness (end_time required)
   ↓
5. Stored in Vercel Postgres with upsert operations
   ↓
6. Frontend displays via React components with real-time updates
```

#### **Authentication Architecture**
```
NextAuth.js ←→ WHOOP OAuth 2.0 ←→ Vercel Postgres
     ↓              ↓                    ↓
Session Storage  Token Refresh     User Data Storage
     ↓              ↓                    ↓
React Context    Automatic Renewal   Database Queries
```

### **🚀 Key Technologies & Why They Were Chosen**

| Technology | Purpose | Why This Choice | Debugging Tips |
|------------|---------|-----------------|----------------|
| **Next.js 15** | Full-stack framework | App Router for modern routing, built-in API routes | Use `console.log` in API routes, check Network tab |
| **TypeScript** | Type safety | Catch errors at compile time, better IDE support | Red squiggles = fix before running |
| **Vercel** | Deployment platform | Seamless Next.js integration, built-in analytics | Check Function logs in dashboard |
| **Vercel Postgres** | Database | Serverless, auto-scaling, managed | Use Vercel dashboard query editor |
| **NextAuth.js** | Authentication | OAuth integration, session management | Check session object in browser dev tools |
| **Tailwind CSS** | Styling | Utility-first, responsive design | Use browser inspector to see applied classes |

### **🎯 Production Monitoring & Debugging**

#### **What to Monitor**
```typescript
// Key metrics to track in production
const productionMetrics = {
  // Data collection success rate
  dailySyncSuccess: "Check Vercel Function logs daily",
  
  // API performance  
  apiResponseTimes: "Monitor via Vercel Analytics",
  
  // User authentication
  authFailures: "NextAuth debug logs",
  
  // Database performance
  queryTimes: "Postgres slow query logs",
  
  // Error rates
  errorFrequency: "Console error tracking"
};
```

#### **Debugging in Production**
```bash
# Vercel CLI for real-time logs
vercel logs --follow

# Check specific function
vercel logs --function=api/cron/daily-data-fetch

# Database inspection
# Use Vercel Postgres dashboard query editor
```

## ✨ **Project Features & Implementation**

### **🤖 AI-Powered About Section**
Interactive chatbot using OpenAI API with conversation memory and context awareness.

### **🏃‍♂️ WHOOP Integration**
Complete fitness data pipeline with OAuth 2.0, automated daily collection, and real-time visualization.

### **📊 Data Visualization**
GitHub-style activity heatmaps, recovery trends, and performance analytics using custom React components.

### **🎨 Liquid Glass Design System**
Modern glassmorphism UI with backdrop filters, dynamic gradients, and smooth animations.

### **📝 MDX Blog System**
Technical writing platform with syntax highlighting, SEO optimization, and dynamic routing.

### **⚡ Performance Optimization**
Static generation, image optimization, code splitting, and Web Vitals monitoring.

## 🚀 **Getting Started**

### **Prerequisites**
```bash
node >= 18.0.0
pnpm >= 8.0.0
```

### **Installation**
```bash
# Clone repository
git clone https://github.com/camilojourney/camilomartinez-portfolio.git
cd camilomartinez-portfolio

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
pnpm dev
```

### **Environment Variables**
```bash
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# WHOOP Integration
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret

# Database
POSTGRES_URL=your_vercel_postgres_url

# OpenAI (for chatbot)
OPENAI_API_KEY=your_openai_key

# Automation
CRON_SECRET=your_cron_secret
```

## 📁 **Architecture Overview**

### **Directory Structure Philosophy**
```
src/
├── app/                    # 🗺️ Routes & Pages (Next.js App Router)
│   ├── (main)/            # Main site pages
│   ├── api/               # Backend API endpoints  
│   └── layout.tsx         # Root layout
├── components/            # 🧱 React Components
│   ├── ui/               # Base components (buttons, cards)
│   ├── shared/           # Layout components (nav, footer)
│   └── features/         # Feature-specific components
├── lib/                  # ⚙️ Business Logic & Utilities
│   ├── db/              # Database operations
│   ├── config/          # App configuration
│   └── utils/           # Helper functions
├── types/               # 📝 TypeScript definitions
├── styles/              # 🎨 Global CSS and animations
└── scripts/            # 🔧 Build and utility scripts
```

### **Key Files & Their Purpose**

#### **Core Application**
- `src/app/layout.tsx` - Root layout with navigation and providers
- `src/app/(main)/page.tsx` - Homepage with hero and project highlights
- `src/components/features/Chatbot.tsx` - AI-powered about section

#### **WHOOP Integration**
- `src/lib/whoop.ts` - WHOOP API V2 client with pagination and error handling
- `src/app/api/whoop-collector-v2/route.ts` - Enhanced data collection endpoint
- `src/app/api/cron/daily-data-fetch/route.ts` - Automated daily sync
- `src/lib/db/whoop-database.ts` - Database operations for WHOOP data

#### **Authentication & Security**
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration with OAuth
- `src/lib/auth.ts` - Session management and token refresh logic

#### **Design System**
- `src/components/shared/liquid-*.tsx` - Glassmorphism components
- `src/styles/globals.css` - CSS variables and design tokens
- `tailwind.config.js` - Tailwind configuration with custom theme

## 🔄 **WHOOP Data Pipeline**

### **Data Collection Architecture**
```
OAuth Authentication → Historical Backfill → Daily Automation → Data Processing → Visualization
```

### **API Endpoints**
- `POST /api/whoop-collector-v2` - Manual/historical data collection
- `POST /api/cron/daily-data-fetch` - Automated daily sync (2:00 PM UTC)
- `GET /api/view-data` - Analytics data retrieval
- `GET /api/sync-status` - Collection status monitoring

### **Data Types Collected**
- **Cycles**: Daily strain and recovery cycles
- **Sleep**: Duration, efficiency, stages, HRV
- **Recovery**: Recovery score, HRV, RHR
- **Workouts**: Activities, strain, duration, sport type

### **Quality Assurance**
- Filters incomplete records (missing `end_time`)
- Rate limiting and retry logic
- Comprehensive error logging
- Data validation with TypeScript

## 🎨 **Design System**

### **Liquid Glass Theme**
- **Glassmorphism**: Backdrop filters with blur effects
- **Dynamic Gradients**: Animated background patterns
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 compliant with proper contrast

### **Component Hierarchy**
```
ui/ (atoms) → shared/ (molecules) → features/ (organisms) → app/ (templates)
```

## 📊 **Performance & Monitoring**

### **Optimization Strategies**
- Static generation where possible
- Image optimization with Next.js Image
- Code splitting by route
- Font optimization with Geist
- Bundle size monitoring

### **Production Monitoring**
- Vercel Analytics for performance
- Function logs for debugging
- Error tracking and alerting
- Database query monitoring

## 🧪 **Development Workflow**

### **Testing Strategy**
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Build verification
pnpm build

# Production preview
pnpm start
```

### **Debugging Commands**
```bash
# Local development with logs
pnpm dev

# Check environment variables
node -e "console.log(process.env)"

# Database connection test
# Run test query in Vercel dashboard

# API testing
curl -X POST "http://localhost:3000/api/test-endpoint"
```

## 🚀 **Deployment**

### **Vercel Configuration**
```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/daily-data-fetch", "schedule": "0 14 * * *" }
  ]
}
```

### **Environment Setup**
1. **Vercel Dashboard**: Configure environment variables
2. **Database**: Set up Vercel Postgres
3. **WHOOP API**: Register OAuth application
4. **OpenAI**: Set up API key for chatbot

## 📄 **License & Contact**

**Open Source**: MIT License

**Contact**:
- **Website**: [camilomartinez.co](https://camilomartinez.co)
- **Email**: contact@camilomartinez.co
- **GitHub**: [camilojourney](https://github.com/camilojourney)

---

*This project serves as both a portfolio and a learning resource for modern full-stack development. Every architectural decision is documented to help fellow developers understand the "why" behind the code.*
