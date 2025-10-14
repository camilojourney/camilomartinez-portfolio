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
    slug: 'trading-bot',
    title: 'Algorithmic Trading Bot',
    description: 'Agentic trading research platform with execution monitoring and guardrails.',
    tags: ['Agents', 'Finance', 'Automation'],
    status: 'prototype',
    caseStudyHref: '/projects/trading-bot',
    appHref: '/apps/trading-bot',
    previewImage: '/images/previews_main/trading_.bot.png',
  },
];
