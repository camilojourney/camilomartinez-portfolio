# Camilo Martinez - AI Developer Portfolio 🚀

A modern, interactive portfolio showcasing expertise in AI development, data analytics, and full-stack development. Built with Next.js 15 App Router and featuring a unique liquid glass design system.

## ✨ Key Features

- **AI Chatbot**: Interactive "About Me" with natural conversation
- **WHOOP Integration**: Real-time fitness data with OAuth 2.0
- **Activity Visualization**: GitHub-style training heatmap
- **Project Showcase**: Dynamic case studies with MDX   ├── lib/              # Core utilities and business logic
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

### Project Structure
camilomartinez-portfolio/
├── .next/
├── .vscode/
├── public/
│   ├── images/
│   └── favicon.ico
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

## 📁 Project Structure

```
camilomartinez-portfolio/
├── .next/                      # Next.js build output
├── node_modules/               # Dependencies
├── public/                     # Static assets
│   ├── images/                 # Image assets
│   └── favicon.ico            # Site favicon
├── src/                       # Application source code
│   ├── app/                   # Next.js App Router
│   │   ├── (main)/           # Main site pages
│   │   │   ├── about/        # About page with AI chat
│   │   │   ├── blog/         # Blog section
│   │   │   │   ├── [slug]/   # Dynamic blog post pages
│   │   │   │   └── page.tsx  # Blog listing
│   │   │   ├── layout.tsx    # Main layout
│   │   │   └── page.tsx      # Homepage
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── chatbot/      # AI chat endpoints
│   │   │   ├── cron/         # Automated tasks
│   │   │   │   └── daily-data-fetch/
│   │   │   ├── sync-status/  # Sync monitoring
│   │   │   ├── update-token/ # Token management
│   │   │   ├── view-data/    # Data retrieval
│   │   │   └── whoop/        # WHOOP integration
│   │   │       ├── auth/     # WHOOP OAuth
│   │   │       └── data/     # WHOOP data handling
│   │   ├── auth/             # Auth-related pages
│   │   ├── blog/             # Blog system
│   │   ├── contact/          # Contact form
│   │   ├── live-data/        # Real-time data display
│   │   ├── my-stats/         # Analytics dashboard
│   │   ├── og/              # Open Graph images
│   │   ├── privacy-policy/   # Legal pages
│   │   ├── projects/        # Project showcase
│   │   ├── rss/            # RSS feed
│   │   ├── signin/         # Auth pages
│   │   ├── terms-of-service/
│   │   ├── tools/          # Developer tools
│   │   ├── whoop-dashboard/# WHOOP management
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Root page
│   │   ├── not-found.tsx   # 404 page
│   │   ├── robots.ts      # Robots configuration
│   │   └── sitemap.ts     # Sitemap generation
│   ├── components/        # React components
│   │   ├── features/      # Feature-specific
│   │   │   ├── auth/      # Auth components
│   │   │   ├── blog/      # Blog components
│   │   │   ├── chatbot/   # AI chat interface
│   │   │   └── whoop/     # WHOOP visualizations
│   │   ├── shared/        # Shared components
│   │   │   ├── footer.tsx
│   │   │   ├── liquid-nav.tsx
│   │   │   ├── liquid-background.tsx
│   │   │   └── liquid-page.tsx
│   │   └── ui/           # Base UI components
│   │       ├── button.tsx
│   │       └── card.tsx
│   ├── config/          # Configuration
│   │   └── constants.ts # App constants
│   ├── hooks/          # Custom React hooks
│   ├── lib/           # Core utilities
│   │   ├── db/       # Database utilities
│   │   │   ├── db.ts
│   │   │   └── whoop-database.ts
│   │   ├── openai.ts # AI integration
│   │   └── whoop.ts  # WHOOP client
│   ├── scripts/      # Build scripts
│   │   ├── get-workout-data.js
│   │   └── whoop-cli.js
│   ├── services/    # Business logic
│   │   └── auth/    # Auth services
│   │       └── auth.ts
│   ├── styles/     # Global styles
│   │   ├── animations.css
│   │   └── globals.css
│   ├── types/      # TypeScript types
│   │   ├── api/
│   │   ├── auth/
│   │   ├── db/
│   │   └── whoop/
│   └── utils/     # Helper functions
│       └── cn.ts  # className utilities
├── .env.example   # Environment variables template
├── .eslintrc.json # ESLint configuration
├── .gitignore    # Git ignore rules
├── README.md     # Project documentation
├── WHOOP_V2.md   # WHOOP integration docs
├── jsconfig.json # JavaScript configuration
├── next.config.mjs # Next.js configuration
├── package.json   # Project dependencies
├── pnpm-lock.yaml # Lock file
├── postcss.config.js # PostCSS configuration
├── tailwind.config.ts # Tailwind configuration
├── tsconfig.json # TypeScript configuration
└── vercel.json   # Vercel deployment config
```
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
