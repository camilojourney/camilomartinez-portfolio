// Project metadata and types for portfolio showcase
export type ProjectStatus = 'live' | 'prototype' | 'in-progress' | 'concept';

export interface ProjectMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  status: ProjectStatus;
  caseStudyHref: string;
  appHref?: string;
  appLabel?: string;
  previewImage?: string;
  isExternalApp?: boolean;
}

export const projects: ProjectMeta[] = [
  {
    slug: 'fitness-dashboard',
    title: 'Fitness Dashboard',
    description: 'Real-time health analytics combining WHOOP + Strava data pipelines.',
    tags: ['Data Engineering', 'APIs', 'Real-time'],
    status: 'live',
    caseStudyHref: '/projects/fitness-dashboard',
    appHref: '/apps/fitness-dashboard',
    previewImage: '/images/previews_main/fitness.png',
  },
  {
    slug: 'astoria-conquest',
    title: 'Astoria Conquest',
    description: 'Geospatial routing and map visualization to run every street in Astoria, Queens.',
    tags: ['Graph Theory', 'Mapping', 'Visualization'],
    status: 'live',
    caseStudyHref: '/projects/astoria-conquest',
    appHref: '/apps/astoria-conquest',
    previewImage: '/images/previews_main/astoria_conquest.png',
  },
  {
    slug: 'social-media-pipeline',
    title: 'Social Media Pipeline',
    description: 'LLM-powered content generator that translates raw insights into polished posts.',
    tags: ['LLMs', 'Automation', 'Content'],
    status: 'live',
    caseStudyHref: '/projects/social-media-pipeline',
    appHref: '/apps/social-media-pipeline',
    previewImage: '/images/previews_main/socia_media_creation.png',
  },
  {
    slug: 'ai-advisor-board',
    title: 'AI Advisor Board',
    description: 'Multi-agent advisory directors debating strategy, risk, and customer voice.',
    tags: ['Multi-Agent', 'Strategy', 'LLM Systems'],
    status: 'live',
    caseStudyHref: '/projects/ai-advisor-board',
    appHref: 'https://ai-advisor-board.vercel.app',
    appLabel: 'Launch live app',
    previewImage: '/images/previews_main/agents_board.png',
    isExternalApp: true,
  },
  {
    slug: 'interactive-chatbot',
    title: 'Self-Improving AI Chatbot',
    description: 'RAG-powered conversational agent that evaluates its answers and expands its knowledge base autonomously.',
    tags: ['RAG', 'NLP', 'Self-Improvement'],
    status: 'live',
    caseStudyHref: '/projects/interactive-chatbot',
    appHref: '/about',
    appLabel: 'Try the chatbot',
    previewImage: '/images/previews_main/self_improving_ai_chat.png',
  },
  {
    slug: 'invoz-ai',
    title: 'Invoz.ai',
    description: 'Privacy-first, on-device speech coach: dictation + real-time grammar correction + personalized pronunciation feedback powered by federated learning.',
    tags: ['Speech AI', 'Accessibility', 'Productivity'],
    status: 'in-progress',
    caseStudyHref: '/projects/invoz-ai',
    previewImage: '/images/previews_main/image.png',
  },
  {
    slug: 'focus-time',
    title: 'Focus Time',
    description: 'macOS menu bar timer for hyperfocus awareness—periodic check-ins help you stay accountable during deep work sessions and review focus patterns.',
    tags: ['Tauri 2', 'Rust', 'macOS', 'ADHD Tools'],
    status: 'live',
    caseStudyHref: '/projects/focus-time',
    appHref: '/apps/focus-time',
    appLabel: 'Download app',
    previewImage: '/images/previews_main/Hyper-awareness.png',
  },
];
