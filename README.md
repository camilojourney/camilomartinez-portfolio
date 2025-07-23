# Camilo Martinez - AI Developer Portfolio

A premium, interactive portfolio showcasing expertise in AI development, data analytics, and full-stack development. Built with Next.js 15 and featuring a unique glassmorphism design system.

## 🚀 Features

- **Interactive Chatbot**: An AI-powered "About Me" section with natural conversation flow
- **Live WHOOP Integration**: Real-time fitness data visualization with OAuth 2.0 authentication
- **Activity Heatmap**: GitHub-style visualization of daily training intensity and consistency
- **Automated Data Sync**: Daily automatic WHOOP data collection at 2:00 PM UTC
- **Project Showcase**: Detailed case studies with professional project presentations
- **Premium UI/UX**: Apple 2025-inspired "liquid glass" design system
- **Blog System**: MDX and Markdown support for technical writing
- **Performance Optimized**: SEO optimized with dynamic OG images, sitemap, RSS feed
- **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Vercel deployment

## 🎯 Pages & Features

### Core Pages
- **Home**: Professional landing with skills showcase and availability status
- **Projects**: Interactive gallery with detailed case studies for each project
- **About**: Features the innovative AI chatbot for interactive biography
- **Blog**: Technical writing and insights with syntax highlighting
- **Contact**: Professional contact form with social links
- **Live Data**: Real-time WHOOP fitness data demo with OAuth integration
- **WHOOP Dashboard**: Data collection management and analytics interface
- **My Stats**: Personal performance analytics and data visualization

### Key Technical Features
- Dynamic project detail pages with comprehensive case studies
- Real-time chat interface with glassmorphism UI
- WHOOP API integration with OAuth 2.0 authentication
- Training consistency tracking with GitHub-style heatmap
- Year-over-year fitness data comparison
- Automatic daily data synchronization (2:00 PM UTC)
- Personal fitness analytics with advanced data visualization
- Intelligent strain tracking with categorized intensity levels
- Responsive design with smooth animations and transitions
- Professional typography using Geist font
- Advanced CSS with backdrop filters and glass morphism effects

## 🛠 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS v4 with custom glassmorphism components
- **Authentication**: NextAuth.js with OAuth 2.0 (WHOOP integration)
- **Database**: Vercel Postgres for WHOOP data storage
- **Content**: MDX for blog posts with syntax highlighting
- **APIs**: WHOOP REST API v2 integration (fresh v2 setup - migrated from v1 before Oct 1, 2025 deadline)
- **Automation**: Vercel Cron Jobs for daily data sync
- **Deployment**: Vercel with Speed Insights and Web Analytics
- **Performance**: Optimized images, SEO, and Core Web Vitals

## 🏃‍♂️ WHOOP Integration

This portfolio features a comprehensive WHOOP fitness data integration that demonstrates real-world API integration, data visualization, and automated workflows.

### Features
- **OAuth 2.0 Authentication** with WHOOP
- **Automated Daily Sync** at 2:00 PM UTC using Vercel Cron Jobs
- **Historical Data Backfill** for importing past records
- **Real-time Analytics** with interactive charts and visualizations
- **Production-ready Error Handling** and logging
- **Clean API Architecture** with proper separation of concerns

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
/
├── app/                          # Next.js 15 App Router
│   ├── about/                    # AI chatbot page
│   ├── api/                      # Clean API routes
│   │   ├── auth/[...nextauth]/   # NextAuth.js OAuth configuration
│   │   ├── whoop-collector/      # Historical data collection
│   │   ├── whoop-collector-daily/# Daily data sync
│   │   ├── view-data/           # Analytics data endpoint
│   │   ├── sync-status/         # User sync status & recommendations
│   │   └── cron/daily-whoop-sync/# Automated daily sync (Vercel Cron)
│   ├── blog/                    # Blog system with MDX
│   ├── components/              # Reusable UI components
│   ├── contact/                 # Contact form
│   ├── live-data/              # Public WHOOP data demo
│   ├── my-stats/               # Personal analytics dashboard
│   ├── projects/               # Project showcase
│   ├── signin/                 # Authentication page
│   └── whoop-dashboard/        # Data collection management
├── components/                  # Chart and visualization components
├── lib/                        # Core utilities and configurations
│   ├── auth.ts                # NextAuth.js configuration
│   ├── whoop-client.ts        # WHOOP API client
│   ├── whoop-database.ts      # Database service layer
│   └── whoop-sports.ts        # WHOOP sports activity mapping
├── public/                     # Static assets
├── types/                      # TypeScript type definitions
└── vercel.json                # Vercel configuration with cron jobs
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
