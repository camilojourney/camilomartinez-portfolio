// Project metadata and types for portfolio showcase
export type ProjectStatus = 'live' | 'prototype' | 'in-progress' | 'concept';
export type ProjectCategory = 'Live App' | 'Data Science';

export type ProjectTier = 1 | 2 | 3;

export interface ProjectMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  status: ProjectStatus;
  category: ProjectCategory;
  tier: ProjectTier;
  caseStudyHref: string;
  appHref?: string;
  appLabel?: string;
  apiHref?: string;
  apiLabel?: string;
  previewImage?: string;
  isExternalApp?: boolean;
}

export const projects: ProjectMeta[] = [
  // === TIER 1: Spike projects — lead every resume ===
  {
    slug: 'invoz-ai',
    title: 'Invoz',
    description:
      'Production audio ML pipeline synthesized from 46 research papers. Scores spoken English across 11 dimensions (7 acoustic + 4 linguistic) with sub-2s latency per utterance. Whisper, wav2vec2, Parselmouth, Silero VAD orchestrated through a FastAPI service processing 500+ sessions/day.',
    tags: ['Audio/Speech ML', 'Signal Processing', 'Production ML'],
    status: 'live',
    category: 'Live App',
    tier: 1,
    caseStudyHref: '/projects/invoz-ai',
    appHref: 'https://invoz.io',
    appLabel: 'View live app',
    isExternalApp: true,
    previewImage: '/images/previews_main/invoz.png',
  },
  {
    slug: 'holus-observatory',
    title: 'Holus Observatory',
    description:
      'Real-time observability dashboard monitoring 32 autonomous agents across reasoning, generation, review, and publishing stages. WebSocket-driven event stream with <200ms display latency, agent health scoring, and cross-platform content lifecycle tracking.',
    tags: ['Observability', 'Multi-Agent', 'Next.js'],
    status: 'live',
    category: 'Live App',
    tier: 1,
    caseStudyHref: '/projects/holus-observatory',
    appHref: 'https://holus-observatory.vercel.app',
    appLabel: 'Watch agents live',
    isExternalApp: true,
    previewImage: '/images/previews_main/holus_observatory.png',
  },
  {
    slug: 'holus',
    title: 'Social Media Automatization',
    description:
      'Federated publishing API that transforms a single input into platform-native content for 5 networks (X, Threads, LinkedIn, Instagram, Facebook). 32-agent orchestration with Redis pub/sub event bus, silo isolation, guardrails, and autonomous self-improvement loops.',
    tags: ['Publishing API', 'Multi-Agent', 'FastAPI'],
    status: 'live',
    category: 'Live App',
    tier: 1,
    caseStudyHref: '/projects/holus',
    appHref: 'https://public-phi-rouge-11.vercel.app',
    appLabel: 'Try content generator',
    apiHref: 'https://social-media-api-docs.vercel.app',
    apiLabel: 'API Docs',
    isExternalApp: true,
    previewImage: '/images/previews_main/socia_media_creation.png',
  },
  // === TIER 2: Strong supporting projects ===
  {
    slug: 'pilaster',
    title: 'Pilaster',
    description:
      'Version control system purpose-built for AI generation workflows. Tracks iteration history with intent notes, parameter diffs, and failure pattern detection across ComfyUI and multi-backend pipelines. Reduced creative iteration time by ~40% through structured experiment tracking.',
    tags: ['Creative Tooling', 'Version Control', 'Next.js'],
    status: 'live',
    category: 'Live App',
    tier: 2,
    caseStudyHref: '/projects/pilaster',
    appHref: 'https://pilaster.ai',
    appLabel: 'View live app',
    isExternalApp: true,
    previewImage: '/images/previews_main/pilaster.png',
  },
  {
    slug: 'ai-advisor-board',
    title: 'AI Advisory Board',
    description:
      'Multi-agent deliberation system with specialized agents debating strategy, sales, and market positioning to reach consensus decisions. 3rd place at Datadog Hackathon. Implements structured argumentation with confidence scoring and dissent tracking.',
    tags: ['Multi-Agent', 'Hackathon', 'LLM Systems'],
    status: 'live',
    category: 'Live App',
    tier: 2,
    caseStudyHref: '/projects/ai-advisor-board',
    appHref: 'https://ai-advisor-board.vercel.app',
    appLabel: 'Launch live app',
    previewImage: '/images/previews_main/agents_board.png',
    isExternalApp: true,
  },
  {
    slug: 'holusight',
    title: 'Holusight',
    description:
      'Hybrid retrieval system combining BM25 lexical search, vector embeddings, and reciprocal rank fusion (RRF) reranking. Claude-powered answer synthesis with citation grounding. Achieves 89% relevance on internal benchmarks vs. 62% for vector-only baseline.',
    tags: ['RAG', 'Search', 'AI Engineering'],
    status: 'live',
    category: 'Live App',
    tier: 2,
    caseStudyHref: '/projects/holusight',
    appHref: 'https://holusight.com',
    appLabel: 'View live app',
    isExternalApp: true,
    previewImage: '/images/previews_main/holusight.png',
  },
  {
    slug: 'job-tracker',
    title: 'Job Tracker CRM',
    description:
      'Full-stack job search CRM with Kanban pipeline, AI-generated cover letters via LLM, and resume tailoring engine. FastAPI backend with PostgreSQL, React frontend. Dogfooded daily to manage 200+ applications with automated status tracking.',
    tags: ['Full-Stack', 'FastAPI', 'React'],
    status: 'live',
    category: 'Live App',
    tier: 2,
    caseStudyHref: '/projects/job-tracker',
    appHref: 'https://job-tracker-swart-eta.vercel.app',
    appLabel: 'View live app',
    isExternalApp: true,
    previewImage: '/images/previews_main/job_tracker.png',
  },
  {
    slug: 'genpeli',
    title: 'Genpeli',
    description:
      'Local-first video editing pipeline automating smart cuts, word-level caption generation (Whisper), audio normalization, and multi-platform delivery. Processes a 10-min raw clip to publish-ready short-form in under 3 minutes on consumer hardware.',
    tags: ['Video AI', 'FFmpeg', 'Whisper'],
    status: 'live',
    category: 'Live App',
    tier: 2,
    caseStudyHref: '/projects/genpeli',
    appHref: 'https://www.editai.ai',
    appLabel: 'Try live demo',
    isExternalApp: true,
    previewImage: '/images/previews_main/genpeli.png',
  },
  // === TIER 3: Supporting projects ===
  {
    slug: 'interactive-chatbot',
    title: 'How I Built This Chatbot',
    description:
      'Self-improving chatbot with LLM-as-judge evaluation (PoLL consensus across 3 model families), RLHF feedback loop, live biometric context injection from WHOOP/Strava APIs, and autonomous knowledge graph expansion.',
    tags: ['LLM Evaluation', 'RAG', 'Self-Improvement'],
    status: 'live',
    category: 'Live App',
    tier: 3,
    caseStudyHref: '/projects/interactive-chatbot',
    appHref: '/about',
    appLabel: 'Try the chatbot',
    previewImage: '/images/previews_main/self_improving_ai_chat.png',
  },
  {
    slug: 'fitness-dashboard',
    title: 'Fitness Dashboard',
    description:
      'Real-time health analytics dashboard pulling HRV, sleep, strain, and activity data from WHOOP and Strava APIs. Natural language querying via RAG-style contextual retrieval with daily automated ingestion pipeline.',
    tags: ['Data Engineering', 'APIs', 'Real-time'],
    status: 'live',
    category: 'Live App',
    tier: 3,
    caseStudyHref: '/projects/fitness-dashboard',
    appHref: '/apps/fitness-dashboard',
    previewImage: '/images/previews_main/fitness.png',
  },
  {
    slug: 'focus-time',
    title: 'Focus Time',
    description:
      'Native macOS menu bar app built with Tauri 2 and Rust. Periodic check-ins during deep work sessions with focus pattern analytics and session history. <2MB binary, zero Electron overhead.',
    tags: ['Tauri 2', 'Rust', 'macOS'],
    status: 'live',
    category: 'Live App',
    tier: 3,
    caseStudyHref: '/projects/focus-time',
    appHref: '/apps/focus-time',
    appLabel: 'Download app',
    previewImage: '/images/previews_main/Hyper-awareness.png',
  },
  {
    slug: 'astoria-conquest',
    title: 'Astoria Conquest',
    description:
      'Graph-theory routing engine solving a Chinese Postman variant to run every street in Astoria, Queens. Geospatial visualization with route optimization and progress tracking across 180+ street segments.',
    tags: ['Graph Theory', 'Mapping', 'Visualization'],
    status: 'live',
    category: 'Live App',
    tier: 3,
    caseStudyHref: '/projects/astoria-conquest',
    appHref: '/apps/astoria-conquest',
    previewImage: '/images/previews_main/astoria_conquest.png',
  },
  {
    slug: 'accountability-partner',
    title: 'Accountability Partner',
    description:
      'Public accountability system pulling WHOOP workout data via API to surface daily training compliance. Streak tracking, missed-day alerts, and public visibility as a forcing function for consistency.',
    tags: ['Accountability', 'Data Visualization', 'WHOOP API'],
    status: 'live',
    category: 'Live App',
    tier: 3,
    caseStudyHref: '/projects/accountability-partner',
    appHref: '/apps/accountability-partner',
    previewImage: '/images/previews_main/accountable.png',
  },
  {
    slug: 'nlp-data-science',
    title: 'NLP Data Science',
    description:
      'Research presentation on phoneme-level pronunciation error detection using NLP techniques. Built with Quarto and Python, covering acoustic feature extraction, error classification, and the research that later became Invoz.',
    tags: ['NLP', 'Data Science', 'Python'],
    status: 'live',
    category: 'Data Science',
    tier: 3,
    caseStudyHref: '/projects/nlp-data-science',
    previewImage: '/images/previews_main/clear_speech.png',
  },
  {
    slug: 'hrv-research',
    title: 'HRV Research',
    description:
      'ML analysis on 18 months of personal WHOOP data identifying key HRV drivers. Feature importance via gradient boosting, Shapley values for interpretability, and actionable recovery protocol recommendations backed by statistical significance testing.',
    tags: ['Machine Learning', 'Data Science', 'Health Analytics'],
    status: 'live',
    category: 'Data Science',
    tier: 3,
    caseStudyHref: '/projects/hrv-research',
    previewImage: '/images/previews_main/Recovery_vs_strain.png',
  },
  {
    slug: 'uber-nyc-dashboard',
    title: 'Uber NYC · Spring 2025',
    description:
      'Plotly Dash dashboard analyzing how NYC rideshare demand (Uber, Lyft, Taxi) aligned with weather and Uber stock performance across Apr–May 2025. 5 coordinated charts, rain-bucket lift analysis, temperature-trip correlations, and day-of-week seasonality. Baruch College · Group 6.',
    tags: ['Plotly Dash', 'Data Analysis', 'Python'],
    status: 'live',
    category: 'Data Science',
    tier: 3,
    caseStudyHref: 'https://uber.camilomartinez.co',
    appHref: 'https://uber.camilomartinez.co',
    appLabel: 'View live dashboard',
    isExternalApp: true,
    previewImage: '/images/previews_main/uber_dashboard.png',
  },
];
