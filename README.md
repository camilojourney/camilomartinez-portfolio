# Camilo Martinez - AI Developer Portfolio 🚀

A modern, interactive portfolio showcasing expertise in AI development, data analytics, and full-stack development. Built with Next.js 15 App Router and featuring a unique liquid glass design system.

🧠 The Philosophy: How to Think About This Architecture

To become an expert in app architecture, it's less about memorizing folder names and more about understanding the mental model. This project is built on a core principle: separation of concerns. Every file and folder has a single, clear job.

Think of the application like a well-organized restaurant:

| Folder | Restaurant Analogy | Its Job |
|--------|-------------------|---------|
| src/app/ | The Menu & The Host 🗺️ | Defines what's available to the user (the URLs) and directs them to the right place. The file system is the menu. |
| src/components/ | The LEGO Bricks 🧱 | Contains all the reusable building blocks. You build a button or a navigation bar once, then use it everywhere. This keeps the look and feel consistent and saves you from repeating code. |
| src/lib/ | The Kitchen & The Pantry ⚙️ | This is the "engine room." It handles all the work that isn't directly visible to the user: fetching data from APIs, talking to the database, managing user authentication, and storing reusable logic. Components and pages should be simple; the complex work happens here. |
| public/ | The Art on the Walls 🖼️ | Holds static assets like images and fonts. These are files that are served directly to the browser without any processing. |
| Root Config Files | The Restaurant's Blueprints ⚙️ | These files (package.json, tailwind.config.ts, etc.) define the rules, tools, and settings for the entire project. You set them up once and rarely touch them. |

## 🏗️ Architectural Deep Dive

### 1. The src Directory: Your Code's Sanctuary
All of your application's source code lives here. This creates a clean separation between your code and the project's configuration files.

### 2. The app Directory: Where URLs are Born
This is the most important folder in Next.js. It uses file-system-based routing.
- Pages ((main)/): The (main) folder is a Route Group. It organizes all your user-facing pages without adding (main) to the URL.
- APIs (api/): This is your backend. Each folder inside is a serverless function that your frontend can call.
- Root Files (layout.tsx, not-found.tsx): These special files apply to every single page.

### 3. The components Directory: A Hierarchy of Reusability
Components are organized by their scope and complexity:
- ui/: The most basic, "dumb" elements. Think of buttons, inputs, and cards.
- shared/: More complex components used across many pages, like your site's header and footer.
- features/: Large, self-contained components that handle a specific feature, like the Chatbot or ActivityHeatmap.

### 4. The lib Directory: The Central Nervous System
This is where you consolidate all non-React code to keep your components clean:
- services/: Contains the "business logic" (e.g., WhoopService for WHOOP API)
- db/: Handles all direct database communication
- hooks/: Custom React Hooks for sharing client-side logic
- types/: Defines the "shape" of your data using TypeScript
- utils/: General-purpose helper functions

## ✨ Key Features

- **AI Chatbot**: Interactive "About Me" with natural conversation
- **WHOOP Integration**: Real-time fitness data with OAuth 2.0
- **Activity Visualization**: GitHub-style training heatmap
- **Project Showcase**: Dynamic case studies with MDX
   │   ├── config/         # App configuration
   │   │   └── constants.ts
   │   ├── db/            # Database utilities
   │   │   ├── db.ts
   │   │   └── whoop-database.ts
   │   ├── hooks/         # Custom React hooks
   │   ├── services/      # Business logic
   │   │   ├── auth.ts
   │   │   └── whoop.ts
   │   ├── types/         # TypeScript types
   │   │   ├── auth.d.ts
   │   │   └── whoop.ts
   │   ├── utils/         # Helper functions
   │   │   └── cn.ts
   │   ├── openai.ts      # AI integration
   │   └── whoop.ts       # WHOOP client
   ├── scripts/          # Build scriptsdern Design**: Apple 2025-inspired liquid glass UI
- **Blog System**: Technical writing with syntax highlighting
- **Performance**: SEO optimized with dynamic OG images

## 🏗 Architecture Overview

This portfolio follows a modern, scalable architecture using Next.js 15 App Router:

### Directory Structure Explained

#### 1. Root Directory Organization
- `.next/`: Build output and caching
- `public/`: Static assets (images, favicon)
- `src/`: All application source code
- Configuration files (`.env.example`, `tsconfig.json`, etc.)

#### 2. Source Directory (`src/`) 📁
Main application code organized into logical sections:

- `app/`: Next.js App Router (pages and API routes)
- `components/`: React components by feature and reusability
- `config/`: Application-wide configuration
- `hooks/`: Custom React hooks
- `lib/`: Core utilities and integrations
- `scripts/`: Build and maintenance scripts
- `services/`: Business logic layer
- `styles/`: Global CSS and animations
- `types/`: TypeScript type definitions
- `utils/`: Helper functions

#### 2. App Router (`src/app/`) 🗺️
File-system based routing with co-located components:

- `(main)/` - Main site pages (about, blog, etc.)
- `api/` - Backend API routes
- `auth/` - Authentication pages
- `layout.tsx` - Root layout template

#### 3. Components (`src/components/`) 🧱
Organized by complexity and scope:

- `ui/` - Base UI elements (buttons, cards)
  ```tsx
  // button.tsx - Reusable button component
  import { cva } from 'class-variance-authority';
  
  export const Button = ({ variant, ...props }) => {
    return <button className={buttonVariants({ variant })} {...props} />;
  };
  ```

- `shared/` - Layout components
  ```tsx
  // liquid-page.tsx - Page wrapper with glass effect
  export const LiquidPage = ({ children }) => {
    return <div className="glass-morphism">{children}</div>;
  };
  ```

- `features/` - Feature-specific components
  ```tsx
  // features/whoop/activity-heatmap.tsx
  export const ActivityHeatmap = ({ data }) => {
    return <HeatmapChart data={data} />;
  };
  ```

#### 4. Core Logic (`src/lib/`) ⚙️
All non-React code organized in a single library directory:

```typescript
// lib/services/whoop.ts - Business logic
export class WhoopService {
  async getActivityData() {
    // Fetch and process WHOOP data
  }
}

// lib/config/constants.ts - App configuration
export const API_ENDPOINTS = {
  whoop: '/api/whoop',
  auth: '/api/auth'
};

// lib/hooks/useAuth.ts - Custom React hooks
export const useAuth = () => {
  // Authentication hook logic
};

// lib/types/whoop.ts - TypeScript types
export interface WhoopActivity {
  id: string;
  type: ActivityType;
  score: number;
}

// lib/utils/cn.ts - Helper functions
export const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};
```

#### 5. Types and Utilities (`src/types/`, `src/utils/`) �
Type definitions and helper functions:

```typescript
// types/whoop.ts
export interface WhoopActivity {
  id: string;
  type: 'workout' | 'recovery';
  score: number;
}

// utils/cn.ts - className utility
export const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};
```

## 🛠 Technical Implementation

### Key Technologies

```json
{
  "framework": "Next.js 15 (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS v4",
  "auth": "NextAuth.js + OAuth 2.0",
  "database": "Vercel Postgres",
  "deployment": "Vercel + Analytics"
}
```

### Current Project Structure
camilomartinez-portfolio/
├── .github/
│   └── instructions/
├── public/
│   └── bot.png
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/            # Main site pages
│   │   │   └── page.tsx
│   │   ├── about/             # About section
│   │   │   ├── chat.tsx
│   │   │   └── page.tsx
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   ├── chatbot/
│   │   │   ├── cron/
│   │   │   │   └── daily-data-fetch/
│   │   │   ├── sync-status/
│   │   │   ├── update-token/
│   │   │   ├── view-data/
│   │   │   ├── whoop/
│   │   │   │   ├── auth/
│   │   │   │   └── data/
│   │   │   └── whoop-collector-v2/
│   │   ├── blog/              # Blog section
│   │   │   ├── posts/         # Blog content
│   │   │   │   ├── spaces-vs-tabs.mdx
│   │   │   │   ├── static-typing.mdx
│   │   │   │   └── vim.mdx
│   │   │   ├── [slug]/
│   │   │   ├── page.tsx
│   │   │   └── utils.ts
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/            # React components
│   │   ├── charts/           # Data visualization
│   │   ├── common/           # Common components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── Button.tsx
│   │   ├── features/         # Feature components
│   │   │   ├── auth/
│   │   │   │   ├── AuthButtons.tsx
│   │   │   │   └── AuthProvider.tsx
│   │   │   ├── blog/
│   │   │   │   ├── mdx.tsx
│   │   │   │   └── posts.tsx
│   │   │   ├── whoop/
│   │   │   │   ├── ActivityDistributionChart.tsx
│   │   │   │   ├── ActivityHeatmap.tsx
│   │   │   │   ├── DataCollectionTools.tsx
│   │   │   │   ├── RecoveryChart.tsx
│   │   │   │   └── StrainVsRecoveryChart.tsx
│   │   │   └── Chatbot.tsx
│   │   ├── shared/           # Shared components
│   │   │   ├── footer.tsx
│   │   │   ├── liquid-background.tsx
│   │   │   ├── liquid-nav.tsx
│   │   │   └── liquid-page.tsx
│   │   └── ui/               # UI components
│   │       └── button.tsx
│   ├── lib/                  # Core utilities
│   │   ├── config/          # Configuration
│   │   │   └── constants.ts
│   │   ├── db/              # Database
│   │   │   ├── db.ts
│   │   │   └── whoop-database.ts
│   │   ├── services/        # Services
│   │   │   └── auth.ts
│   │   ├── types/          # TypeScript types
│   │   │   ├── next-auth.d.ts
│   │   │   └── whoop.ts
│   │   ├── utils/          # Utilities
│   │   │   └── cn.ts
│   │   ├── openai.ts       # OpenAI integration
│   │   ├── whoop-client.ts # WHOOP API client
│   │   └── whoop.ts        # WHOOP core logic
│   ├── scripts/             # Build scripts
│   │   ├── get-workout-data.js
│   │   └── whoop-cli.js
│   └── styles/              # Global styles
│       ├── animations.css
│       └── globals.css
├── .env.example              # Environment template
├── .eslintrc.json           # ESLint config
├── .gitignore               # Git ignore rules
├── README.md                # Documentation
├── WHOOP_V2.md             # WHOOP integration docs
├── jsconfig.json            # JavaScript config
├── next-env.d.ts           # Next.js types
├── next.config.mjs          # Next.js config
├── package.json             # Dependencies
├── pnpm-lock.yaml          # Lock file
├── postcss.config.js        # PostCSS config
├── tailwind.config.js       # Tailwind config
├── tsconfig.json           # TypeScript config
└── vercel.json            # Vercel config
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/            # Main site pages
│   │   │   ├── about/
│   │   │   ├── blog/
│   │   │   │   └── [slug]/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/               # API Routes
│   │   │   ├── chatbot/
│   │   │   ├── whoop/
│   │   │   │   ├── auth/
│   │   │   │   └── data/
│   │   │   ├── cron/
│   │   │   │   └── daily-data-fetch/
│   │   │   ├── sync-status/
│   │   │   └── update-token/
│   │   ├── auth/              # Auth pages
│   │   ├── live-data/        # Real-time data views
│   │   ├── my-stats/         # Analytics dashboard
│   │   ├── privacy-policy/
│   │   ├── projects/         # Project showcase
│   │   ├── signin/           # Authentication
│   │   ├── terms-of-service/
│   │   ├── tools/            # Developer tools
│   │   ├── whoop-dashboard/  # WHOOP management
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx         # Homepage
│   │   └── globals.css      # Global styles
│   ├── components/           # React components
│   │   ├── features/        # Feature-specific
│   │   │   ├── auth/
│   │   │   ├── blog/
│   │   │   ├── chatbot.tsx
│   │   │   └── whoop/
│   │   ├── shared/          # Shared layouts
│   │   │   ├── footer.tsx
│   │   │   ├── liquid-nav.tsx
│   │   │   └── liquid-page.tsx
│   │   └── ui/             # Base UI components
│   │       ├── button.tsx
│   │       └── card.tsx
│   ├── config/             # App configuration
│   │   └── constants.ts
│   ├── hooks/             # Custom React hooks
│   ├── lib/              # Core utilities
│   │   ├── openai.ts    # AI integration
│   │   └── whoop.ts     # WHOOP client
│   ├── scripts/         # Build/dev scripts
│   ├── services/        # Business logic
│   │   ├── auth/
│   │   └── whoop/
│   ├── styles/         # Additional styles
│   │   └── globals.css
│   ├── types/         # TypeScript types
│   │   └── whoop.ts
│   └── utils/        # Helper functions
│       └── cn.ts     # className utilities
├── .eslintrc.json
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json



- **Interactive Chatbot**: An AI-powered "About Me" section with natural conversation flow
- **Live WHOOP Integration**: Real-time fitness data visualization with OAuth 2.0 authentication
- **Activity Heatmap**: GitHub-style visualization of daily training intensity and consistency
- **Automated Data Sync**: Daily automatic WHOOP data collection at 2:00 PM UTC
- **Project Showcase**: Detailed case studies with professional project presentations
- **Premium UI/UX**: Apple 2025-inspired "liquid glass" design system
- **Blog System**: MDX and Markdown support for technical writing
- **Performance Optimized**: SEO optimized with dynamic OG images, sitemap, RSS feed
- **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Vercel deployment

## 📱 Features & Pages

### Main Pages
```typescript
// src/app/(main)/page.tsx - Homepage
export default function Home() {
  return (
    <LiquidPage>
      <Hero />
      <SkillsShowcase />
      <ProjectGrid />
    </LiquidPage>
  );
}

// src/app/(main)/about/page.tsx - Interactive About
export default function About() {
  return <Chatbot initialMessage="Ask me anything!" />;
}

// src/app/whoop-dashboard/page.tsx - Data Dashboard
export default function WhoopDashboard() {
  return (
    <div>
      <ActivityHeatmap />
      <RecoveryGraph />
      <WorkoutStats />
    </div>
  );
}
```

### API Routes
```typescript
// src/app/api/chatbot/route.ts - AI Chat Endpoint
export async function POST(req: Request) {
  const { message } = await req.json();
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: message }]
  });
  return Response.json({ reply: response.choices[0].message });
}

// src/app/api/whoop/data/route.ts - WHOOP Data
export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await whoopClient.getActivityData();
  return Response.json(data);
}
```

### Design Features
- Liquid glass morphism with backdrop filters
- Responsive layouts with Tailwind CSS
- Smooth page transitions with Framer Motion
- Dynamic OG images for social sharing
- Geist font for modern typography

## � Getting Started

### Prerequisites
```bash
node >= 18.0.0
pnpm >= 8.0.0
```

### Installation
```bash
# Clone repository
git clone https://github.com/camilojourney/camilomartinez-portfolio.git

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

### Environment Variables
```bash
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret

# WHOOP Integration
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret

# Database
POSTGRES_URL=your_vercel_postgres_url

# OpenAI (for chatbot)
OPENAI_API_KEY=your_openai_key
```

## 🔄 Data Integration

### WHOOP API Integration
```typescript
// src/lib/whoop.ts
export class WhoopClient {
  constructor(private accessToken: string) {}

  async getWorkouts(startDate?: string) {
    return this.fetch('/activity/workout', { start: startDate });
  }

  async getRecovery(startDate?: string) {
    return this.fetch('/recovery', { start: startDate });
  }
}

// src/app/api/cron/daily-data-fetch/route.ts
export async function POST() {
  const date = new Date();
  await whoopClient.syncDailyData();
  return Response.json({ success: true, syncedAt: date });
}
```

### Automated Data Collection
- Daily sync via Vercel Cron (2:00 PM UTC)
- Historical data backfill capability
- Error handling with automatic retries
- Rate limiting and request optimization

### API Endpoints

#### Core Collection Endpoints
- `POST /api/whoop-collector` - Historical data collection (backfill)
- `POST /api/whoop-collector-daily` - Daily data sync
- `GET /api/view-data` - Retrieve analytics data for visualization

#### Management Endpoints
- `GET /api/sync-status` - Check user sync status and recommendations
- `POST /api/cron/daily-whoop-sync` - Automated daily sync (Vercel Cron)

#### Pages
- `/live-data` - Public demo with sample WHOOP data
- `/whoop-dashboard` - Data collection management (requires auth)
- `/my-stats` - Personal analytics and visualizations (requires auth)

### Data Schema

The integration stores comprehensive WHOOP data including:
- **Sleep Data**: Duration, efficiency, stages, heart rate variability
- **Recovery Data**: HRV, RHR, sleep performance, recovery score
- **Workout Data**: Strain, duration, sport activities, heart rate zones
- **Cycle Data**: Daily strain, recovery, sleep need

### Usage

1. **Authentication**: Sign in with WHOOP OAuth 2.0
2. **Historical Collection**: Use the dashboard to backfill past data
3. **Daily Sync**: Automatic collection runs daily at 2:00 PM UTC
4. **Analytics**: View personal insights on the `/my-stats` page

### Setup Requirements

```bash
# Required environment variables
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret
NEXTAUTH_URL=your_domain
NEXTAUTH_SECRET=your_nextauth_secret
POSTGRES_URL=your_vercel_postgres_url
CRON_SECRET=your_cron_secret
```

## Demo

Visit the live portfolio: [camilomartinez.dev](https://camilomartinez.dev)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm package manager
- Vercel account (for deployment and Postgres)
- WHOOP Developer account (for API access)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/camilomartinez-portfolio.git
cd camilomartinez-portfolio
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Add your environment variables
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment

Deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set up environment variables in Vercel dashboard
# Enable Vercel Postgres and configure database
```

## 📁 Complete File Structure & Purpose

### 🗂️ Root Directory
```
camilomartinez-portfolio/
├── .env                        # Environment variables (local, not tracked)
├── .env.example               # Environment template for setup
├── .gitignore                 # Git ignore rules
├── .github/                   # GitHub configuration
│   └── instructions/          # Development guidelines
├── README.md                  # 📖 This documentation file
├── WHOOP_V2.md               # 🏃‍♂️ WHOOP API integration guide
├── jsconfig.json             # JavaScript project configuration
├── next-env.d.ts             # Next.js TypeScript environment types
├── package.json              # 📦 Project dependencies and scripts
├── pnpm-lock.yaml           # 🔒 Dependency version lock file
├── postcss.config.js         # PostCSS configuration for CSS processing
├── tailwind.config.js        # 🎨 Tailwind CSS configuration
├── tsconfig.json            # TypeScript compiler configuration
└── vercel.json              # ⚡ Vercel deployment configuration
```

### 🌍 Public Assets
```
public/
└── bot.png                   # 🤖 Chatbot avatar image
```

### 🎯 Source Code (`src/`)

#### 📱 App Router (`src/app/`)
**Next.js 15 App Router with file-system routing**

##### Main Pages (`src/app/(main)/`)
```
(main)/                       # 🏠 Route group (doesn't affect URL)
├── page.tsx                 # 🏡 Homepage with hero section
├── about/                   # 👤 About me section
│   ├── page.tsx            # About page with AI chatbot
│   └── chat.tsx            # Chat interface component
├── blog/                   # 📝 Blog system
│   ├── page.tsx           # Blog post listing
│   ├── utils.ts           # Blog utilities (MDX processing)
│   ├── [slug]/            # Dynamic blog routes
│   │   └── page.tsx       # Individual blog post pages
│   └── posts/             # Blog content (MDX files)
│       ├── spaces-vs-tabs.mdx    # 🤔 Code formatting debate
│       ├── static-typing.mdx     # 🔧 TypeScript benefits
│       └── vim.mdx               # ⌨️  Vim editor guide
├── contact/                # 📧 Contact form
│   └── page.tsx
├── live-data/              # 📊 Real-time WHOOP data demo
│   └── page.tsx
├── my-stats/               # 📈 Personal analytics dashboard
│   └── page.tsx
├── privacy-policy/         # 🛡️ Privacy policy page
│   └── page.tsx
├── projects/               # 💼 Project showcase
│   ├── page.tsx           # Project listing
│   └── [slug]/            # Dynamic project pages
│       └── page.tsx
├── signin/                 # 🔐 Authentication page
│   └── page.tsx
├── terms-of-service/       # 📜 Terms of service
│   └── page.tsx
├── tools/                  # 🛠️ Developer tools
│   └── page.tsx
└── whoop-dashboard/        # 🏃‍♂️ WHOOP data management
    └── page.tsx
```

##### API Routes (`src/app/api/`)
**Backend serverless functions**
```
api/                         # 🔌 API endpoints
├── auth/                   # 🔑 Authentication
│   └── [...nextauth]/      # NextAuth.js configuration
│       └── route.ts
├── chatbot/                # 🤖 AI chat endpoint
│   └── route.ts           # OpenAI integration
├── cron/                   # ⏰ Scheduled tasks
│   ├── daily-data-fetch/   # Daily WHOOP sync
│   │   └── route.ts
│   └── daily-whoop-sync/   # Alternative sync method
│       └── route.ts
├── sync-status/            # 📊 Sync monitoring
│   └── route.ts
├── update-token/           # 🔄 Token refresh
│   └── route.ts
├── view-data/              # 📈 Data retrieval
│   └── route.ts
├── whoop/                  # 🏃‍♂️ WHOOP API integration
│   ├── auth/               # OAuth authentication
│   │   └── route.ts
│   └── data/               # Data collection
│       └── route.ts
└── whoop-collector-v2/     # 🆕 Enhanced data collector
    └── route.ts
```

##### Special App Files
```
├── auth/error/             # 🚨 Authentication error page
│   └── page.tsx
├── layout.tsx              # 🎨 Root layout template
├── not-found.tsx          # 404 error page
├── og/                    # 📷 Open Graph image generation
│   └── route.tsx
├── robots.ts              # 🤖 SEO robots configuration
├── rss/                   # 📡 RSS feed generation
│   └── route.ts
└── sitemap.ts            # 🗺️ SEO sitemap generation
```

#### 🧱 Components (`src/components/`)
**Reusable React components organized by scope**

##### UI Components (`src/components/ui/`)
```
ui/                         # 🎨 Base design system components
└── button.tsx             # Reusable button with variants
```

##### Common Components (`src/components/common/`)
```
common/                     # 🔄 Commonly used components
├── Button.tsx             # Alternative button implementation
├── Button/                # Button variations (if needed)
└── Input/                 # Input field components (if needed)
```

##### Shared Layout Components (`src/components/shared/`)
```
shared/                     # 🏗️ Layout and navigation
├── footer.tsx             # Site footer
├── liquid-background.tsx   # Animated liquid background
├── liquid-nav.tsx         # Navigation with glass morphism
└── liquid-page.tsx        # Page wrapper with liquid effects
```

##### Feature Components (`src/components/features/`)
**Complex, feature-specific components**
```
features/                   # 🎯 Feature-specific components
├── Chatbot.tsx            # 🤖 AI chat interface
├── auth/                  # 🔐 Authentication components
│   ├── AuthButtons.tsx    # Sign in/out buttons
│   └── AuthProvider.tsx   # Auth context provider
├── blog/                  # 📝 Blog components
│   ├── mdx.tsx           # MDX content renderer
│   └── posts.tsx         # Blog post components
└── whoop/                # 🏃‍♂️ WHOOP data visualizations
    ├── ActivityDistributionChart.tsx  # Activity breakdown
    ├── ActivityHeatmap.tsx           # GitHub-style heatmap
    ├── DataCollectionTools.tsx       # Data management tools
    ├── RecoveryChart.tsx            # Recovery trends
    └── StrainVsRecoveryChart.tsx     # Correlation analysis
```

#### ⚙️ Core Logic (`src/lib/`)
**Non-React business logic and utilities**

##### Configuration (`src/lib/config/`)
```
config/
└── constants.ts           # 🔧 App-wide constants and settings
```

##### Database (`src/lib/db/`)
```
db/                        # 🗄️ Database layer
├── db.ts                 # Vercel Postgres connection
└── whoop-database.ts     # WHOOP data operations
```

##### Services (`src/lib/services/`)
```
services/                  # 🛠️ Business logic layer
└── auth.ts               # Authentication service
```

##### Utilities (`src/lib/utils/`)
```
utils/                     # 🔧 Helper functions
└── cn.ts                 # className merging utility
```

##### External Integrations
```
├── openai.ts             # 🤖 OpenAI API client
├── whoop.ts              # 🏃‍♂️ WHOOP V2 API client (main)
└── whoop-client.ts       # 🏃‍♂️ WHOOP client wrapper
```

#### 🎭 Types (`src/types/`)
**TypeScript type definitions**
```
types/                     # 📝 Type definitions
├── next-auth.d.ts        # NextAuth session types
└── whoop.ts              # WHOOP API response types
```

#### 🎨 Styles (`src/styles/`)
**Global CSS and animations**
```
styles/                    # 🎨 Global styling
├── animations.css         # Custom animations
└── globals.css           # Global styles and CSS variables
```

#### 📜 Scripts (`src/scripts/`)
**Build and utility scripts**
```
scripts/                   # 🔧 Utility scripts
├── get-workout-data.js    # Data export utility
└── whoop-cli.js          # CLI tool for WHOOP data
```

### 📋 File Purpose Guide

#### 🔍 **Core Functionality**
- **`src/app/layout.tsx`** - Root layout with navigation and providers
- **`src/app/(main)/page.tsx`** - Homepage with hero section and project highlights
- **`src/components/features/Chatbot.tsx`** - AI-powered "About Me" chat interface
- **`src/lib/openai.ts`** - OpenAI integration for chatbot functionality

#### 🏃‍♂️ **WHOOP Integration**
- **`src/lib/whoop.ts`** - Main WHOOP API V2 client with data collection
- **`src/lib/db/whoop-database.ts`** - Database operations for WHOOP data
- **`src/app/api/whoop-collector-v2/route.ts`** - Enhanced data collection endpoint
- **`src/components/features/whoop/ActivityHeatmap.tsx`** - GitHub-style activity visualization

#### 🎨 **Design System**
- **`src/components/shared/liquid-*.tsx`** - Liquid glass design components
- **`tailwind.config.js`** - Tailwind CSS configuration with custom colors
- **`src/styles/globals.css`** - CSS variables and global styles
- **`src/styles/animations.css`** - Custom animations for liquid effects

#### 📝 **Content Management**
- **`src/app/(main)/blog/`** - MDX-based blog system
- **`src/app/(main)/projects/`** - Dynamic project showcase
- **`src/app/api/chatbot/route.ts`** - AI chat backend

#### 🔐 **Authentication & Security**
- **`src/app/api/auth/[...nextauth]/route.ts`** - NextAuth configuration
- **`src/lib/services/auth.ts`** - Auth utilities and session management
- **`src/types/next-auth.d.ts`** - Extended NextAuth types

#### 📊 **Analytics & SEO**
- **`src/app/sitemap.ts`** - Dynamic sitemap generation
- **`src/app/robots.ts`** - SEO robots configuration
- **`src/app/rss/route.ts`** - RSS feed for blog posts
- **`src/app/og/route.tsx`** - Dynamic Open Graph images

#### ⚙️ **Configuration**
- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript compiler settings
- **`vercel.json`** - Deployment configuration
- **`.env.example`** - Environment variable template

### 🎯 **Key Features by File**

| File | Primary Purpose | Key Features |
|------|----------------|--------------|
| `src/app/(main)/page.tsx` | Homepage | Hero section, skills showcase, project highlights |
| `src/components/features/Chatbot.tsx` | AI Chat | OpenAI integration, conversational about section |
| `src/lib/whoop.ts` | WHOOP API | Data collection, OAuth, rate limiting |
| `src/components/features/whoop/ActivityHeatmap.tsx` | Data Viz | GitHub-style heatmap, activity tracking |
| `src/app/api/whoop-collector-v2/route.ts` | Data Collection | Automated sync, error handling, batch processing |
| `src/components/shared/liquid-page.tsx` | Design System | Glass morphism, responsive layouts |
| `src/app/(main)/blog/[slug]/page.tsx` | Blog System | MDX rendering, syntax highlighting, SEO |
| `src/lib/db/whoop-database.ts` | Database | CRUD operations, relationship mapping |
```

## 🔧 Technical Implementation

### WHOOP Data Collection System

The WHOOP integration is built with a robust, production-ready architecture:

**Data Flow:**
1. **OAuth Authentication** → User authenticates with WHOOP
2. **Historical Backfill** → Collects past 30 days of data
3. **Daily Automation** → Syncs new data at 2:00 PM UTC
4. **Data Processing** → Matches sleep cycles with recovery data
5. **Visualization** → Renders analytics on dashboard

**Key Technical Features:**
- **Cycle-to-Sleep Matching**: Robust algorithm to match WHOOP cycles with sleep data
- **Error Handling**: Comprehensive error logging and recovery mechanisms
- **Rate Limiting**: Respects WHOOP API rate limits with proper backoff
- **Data Validation**: Type-safe data processing with TypeScript
- **Atomic Operations**: Database transactions for data consistency

### Glassmorphism Design System

The "liquid glass" theme is implemented using:
- **CSS Backdrop Filters**: For frosted glass effects
- **Dynamic Gradients**: Animated background gradients
- **Micro-interactions**: Smooth hover and focus states
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: WCAG 2.1 compliant with proper contrast ratios

### Performance Optimizations

- **Static Generation**: Pre-rendered pages where possible
- **Image Optimization**: Next.js Image component with WebP support
- **Code Splitting**: Automatic route-based code splitting
- **Font Optimization**: Self-hosted Geist font with display: swap
- **Bundle Analysis**: Regular monitoring of bundle size

## 🔒 Security & Privacy

- **OAuth 2.0**: Secure authentication with WHOOP
- **Environment Variables**: Sensitive data stored securely
- **HTTPS Only**: Enforced SSL/TLS encryption
- **Data Encryption**: Database encryption at rest
- **Rate Limiting**: API protection against abuse
- **CORS Configuration**: Proper cross-origin resource sharing

## 🧪 Development & Testing

### Local Development
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Setup
```bash
# Required for WHOOP integration
WHOOP_CLIENT_ID=your_client_id
WHOOP_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000  # or your domain
NEXTAUTH_SECRET=your_secret_key
POSTGRES_URL=your_postgres_connection_string
CRON_SECRET=your_cron_secret
```

## 📈 Analytics & Monitoring

- **Vercel Analytics**: Real-time performance monitoring
- **Speed Insights**: Core Web Vitals tracking
- **Error Logging**: Comprehensive error tracking
- **Database Monitoring**: Query performance optimization
- **API Monitoring**: Endpoint response time tracking

## 🤝 Contributing

This is a personal portfolio project, but feel free to:
- Open issues for bugs or suggestions
- Submit pull requests for improvements
- Use the code as inspiration for your own projects

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Contact

- **Website**: [camilomartinez.dev](https://camilomartinez.dev)
- **Email**: [contact@camilomartinez.dev](mailto:contact@camilomartinez.dev)
- **LinkedIn**: [linkedin.com/in/camilomartinezdev](https://linkedin.com/in/camilomartinezdev)
- **GitHub**: [github.com/camilomartinez](https://github.com/camilomartinez)

---

*Built with ❤️ using Next.js, TypeScript, and the WHOOP API*
