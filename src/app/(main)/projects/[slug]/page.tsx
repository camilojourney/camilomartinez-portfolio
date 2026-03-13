import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import StandardPage from '@/components/shared/standard-page'
import { Card } from '@/components/ui/Card'

// Project data structure
interface ProjectData {
    slug: string
    title: string
    summary: string
    fullDescription: string
    problem: string
    solution: string
    outcome: string
    techStack: string[]
    features: string[]
    status: 'live' | 'in-progress' | 'concept'
    demoUrl?: string
    githubUrl?: string
    imageUrl: string
    galleryImages?: string[]
    appLink?: string
}

// Mock project data - in a real app, this would come from a CMS or database
const projects: ProjectData[] = [
    {
        slug: 'interactive-chatbot',
        title: 'Interactive "About Me" Chatbot',
        summary: 'A live demonstration of a full-stack application built with Next.js and NLP to create an engaging, interactive user experience.',
        fullDescription: 'This project showcases my ability to build sophisticated conversational interfaces using modern web technologies. The chatbot serves as an interactive "About Me" section, allowing visitors to naturally explore my background, skills, and experience through conversation.',
        problem: 'Traditional portfolio websites often present information in a static, one-dimensional way. Visitors have to hunt through different sections to find specific information about skills, experience, or background, leading to poor engagement and missed opportunities for meaningful connection.',
        solution: 'I developed an intelligent chatbot that acts as a virtual representative, capable of answering questions about my background, technical skills, and experience in a conversational manner. The system uses natural language processing to understand queries and provides contextual, engaging responses.',
        outcome: 'The result is a more engaging, interactive portfolio experience that increases visitor engagement time by 300% and provides a unique demonstration of my technical capabilities in AI and full-stack development.',
        techStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Vercel', 'NLP Processing'],
        features: [
            'Natural language understanding and response',
            'Glassmorphism UI with smooth animations',
            'Real-time conversation flow',
            'Responsive design for all devices',
            'Suggested question prompts',
            'Typing indicators and smooth transitions'
        ],
        status: 'live',
        demoUrl: '/about',
        imageUrl: '/images/project-chatbot.png',
        galleryImages: [
            '/images/chatbot-1.png',
            '/images/chatbot-2.png',
            '/images/chatbot-3.png'
        ]
    },
    {
        slug: 'ai-advisor-board',
        title: 'AI Advisor Board',
        summary: 'Multi-agent advisory system where specialized directors collaborate through structured deliberation.',
        fullDescription: 'AI Advisor Board simulates a leadership meeting by assigning LLM agents to roles such as Sales, Customer Success, Product, and Research. Each director contributes domain expertise, challenges assumptions, and drafts a unified recommendation using structured prompts and critique loops.',
        problem: 'Executives need to synthesize perspectives from multiple stakeholders quickly, but real meetings are expensive and constrained by scheduling.',
        solution: 'Built autonomous directors with shared memory and turn-based debate. Each round the agents surface risks, customer sentiment, and data-backed insights before converging on an action plan.',
        outcome: 'Produces actionable briefs in minutes, highlighting risks, objections, and follow-up actions. Early pilots reduced prep time for leadership syncs by 70%.',
        techStack: ['Next.js', 'TypeScript', 'OpenAI GPT-4', 'FastAPI', 'PostgreSQL', 'Tailwind CSS'],
        features: [
            'Role-based multi-agent coordination',
            'Deliberation rounds with critique and revision',
            'Memory subsystem for cross-session context',
            'Scenario simulation and what-if analysis',
            'Exportable executive summaries'
        ],
        status: 'live',
        demoUrl: 'https://ai-advisor-board.vercel.app',
        githubUrl: 'https://github.com/Bench-amblee/ai-advisor-board',
        imageUrl: '/images/previews_main/agents_board.png',
        appLink: 'https://ai-advisor-board.vercel.app'
    },
    {
        slug: 'ai-content-creator',
        title: 'AI Content Creator',
        summary: 'A conceptual application using advanced NLP models to help marketers and writers accelerate their creative workflow.',
        fullDescription: 'This conceptual project demonstrates my vision for AI-powered content creation tools that can significantly enhance creative workflows for marketing teams and content creators.',
        problem: 'Content creators and marketing teams spend countless hours generating, editing, and optimizing content across multiple platforms. The process is time-intensive and often lacks consistency in tone and quality across different pieces.',
        solution: 'An intelligent content creation platform that uses advanced NLP models to generate, edit, and optimize content based on brand guidelines, target audience, and platform-specific requirements. The system learns from user preferences and industry best practices.',
        outcome: 'A comprehensive tool that could reduce content creation time by 70% while maintaining high quality and brand consistency. The concept includes features for multi-platform optimization and real-time collaboration.',
        techStack: ['Next.js', 'Python', 'OpenAI API', 'NLP Libraries', 'PostgreSQL', 'Redis'],
        features: [
            'AI-powered content generation',
            'Brand voice and tone consistency',
            'Multi-platform content optimization',
            'Real-time collaboration tools',
            'Performance analytics and insights',
            'Content calendar integration'
        ],
        status: 'concept',
        imageUrl: '/images/project-content-creator.png'
    },
    {
        slug: 'ai-coaching-app',
        title: 'AI Coaching App',
        summary: 'A conceptual personalized coaching application that uses AI to provide tailored guidance for professional development.',
        fullDescription: 'This concept explores how AI can be used to provide personalized professional coaching at scale, combining machine learning with human expertise to create meaningful development experiences.',
        problem: 'Professional coaching is expensive and not accessible to everyone. Many professionals struggle with goal setting, skill development, and career progression without personalized guidance and accountability.',
        solution: 'An AI-powered coaching application that provides personalized guidance based on individual goals, current skills, and career aspirations. The system would use machine learning to track progress and adapt recommendations over time.',
        outcome: 'A scalable coaching solution that makes professional development accessible to a broader audience while providing measurable outcomes and progress tracking.',
        techStack: ['Next.js', 'Python', 'Machine Learning', 'PostgreSQL', 'Analytics APIs'],
        features: [
            'Personalized goal setting and tracking',
            'AI-powered progress analysis',
            'Skill gap identification',
            'Custom learning path recommendations',
            'Progress visualization and reporting',
            'Integration with professional platforms'
        ],
        status: 'concept',
        imageUrl: '/images/project-coach-app.png'
    },
    {
        slug: 'astoria-conquest',
        title: 'Astoria Conquest - Interactive Running Map',
        summary: 'A data-driven running exploration game that visualizes GPS routes on an interactive street map of Astoria, Queens.',
        fullDescription: 'This project combines GPS tracking, interactive mapping, and gamification to turn running into an engaging exploration experience. Using real GPS data from running sessions, it creates a visual "conquest" map showing which streets have been covered.',
        problem: 'Traditional running apps focus on fitness metrics but don\'t capture the exploratory aspect of urban running. Runners often wonder which areas they\'ve covered and which neighborhoods remain unexplored, but existing tools don\'t provide a clear visual representation of their geographic coverage.',
        solution: 'An interactive web application that processes GPS running data to create beautiful visualizations on a custom street map. Each run is converted to an SVG overlay that shows exactly which streets were covered, with different colors and animations to indicate completion status and route characteristics.',
        outcome: 'A unique running visualization tool that gamifies urban exploration while showcasing advanced skills in GPS data processing, interactive mapping, and real-time data visualization. The project demonstrates proficiency in Python data processing, React/TypeScript development, and creative UI/UX design.',
        techStack: ['Next.js', 'React', 'TypeScript', 'Python', 'Tailwind CSS', 'SVG Processing', 'GPS Data Analysis', 'Interactive Maps'],
        features: [
            'GPS route processing and visualization',
            'Interactive street map with zoom and pan',
            'Custom SVG overlay generation for each run',
            'Real-time route selection and filtering',
            'Detailed statistics for each running session',
            'Responsive design with glassmorphism UI',
            'Street network analysis and coverage tracking',
            'Animated route overlays with completion status'
        ],
        status: 'live',
        demoUrl: '/projects/astoria-conquest',
        imageUrl: '/images/previews_main/astoria_conquest.png'
    },
    {
        slug: 'data-analytics-portfolio',
        title: 'Data Analytics Portfolio',
        summary: 'A comprehensive showcase of data analysis projects demonstrating proficiency in statistical modeling and business intelligence.',
        fullDescription: 'This ongoing project showcases my expertise in data analytics through real-world projects that demonstrate statistical modeling, data visualization, and business intelligence capabilities.',
        problem: 'Data analytics projects are often difficult to showcase effectively in a portfolio format, as they involve complex datasets and methodologies that require proper context and explanation.',
        solution: 'A comprehensive portfolio platform that presents data analytics projects with interactive visualizations, detailed methodologies, and clear business impact explanations. Each project includes the problem statement, approach, and measurable outcomes.',
        outcome: 'An effective way to demonstrate data analytics expertise through interactive case studies that clearly communicate both technical proficiency and business value creation.',
        techStack: ['Python', 'Pandas', 'Matplotlib', 'Seaborn', 'SQL', 'Jupyter', 'Streamlit'],
        features: [
            'Interactive data visualizations',
            'Detailed methodology explanations',
            'Business impact measurements',
            'Code repositories and documentation',
            'Statistical model explanations',
            'Real-world dataset examples'
        ],
        status: 'in-progress',
        imageUrl: '/images/project-analytics.png'
    },
    {
        slug: 'holus',
        title: 'Holus — AI Marketing Strategist',
        summary: 'Autonomous content engine with 32 specialized agents that observe analytics, reason about strategy, create content, and learn from results.',
        fullDescription: 'Holus is an AI marketing strategist that promotes a portfolio of AI products (Pilaster, Genpeli, Invoz). It coordinates 32 specialized agents — hook writers, blog writers, carousel architects, SEO researchers, and 7 domain-expert quality judges — to create, evaluate, and publish content across platforms. Every piece of content is scored before publishing.',
        problem: 'Marketing a portfolio of technical AI products requires constant content creation across multiple platforms. Each product has a different audience, different content styles, and different performance patterns. No single person can keep up with the volume and variety needed.',
        solution: 'Holus runs an episodic agent loop: OBSERVE analytics from social media → REASON about strategy using Claude Opus → ACT by dispatching to specialized content agents → EVALUATE every piece with domain-expert judges. The system learns from what performs well and adjusts strategy weekly.',
        outcome: 'A self-improving content engine that produces evaluated, quality-scored content for 3 products across 5 platforms — with full trajectory logging and weekly learning cycles.',
        techStack: ['Python 3.12', 'Claude API', 'Redis', 'FastAPI', 'Pydantic', 'MCP'],
        features: [
            '32 specialized agents organized by role: managers, specialists, evaluators, ops',
            'ReAct agent loop: observe → reason → act → evaluate',
            '7 domain-expert quality judges with category-specific rubrics',
            'MCP integration with Pilaster, Genpeli, and Social Media silos',
            'Self-improvement loop: trajectory logging, weekly learning, strategy adaptation',
            'Three-layer prompt resolution for A/B testing agent prompts',
        ],
        status: 'in-progress',
        imageUrl: '/images/previews_main/agents_board.png',
    },
    {
        slug: 'holus-observatory',
        title: 'Holus Observatory — Multi-Agent Monitoring Dashboard',
        summary: 'Real-time observability dashboard for a 32-agent AI system — tracks agent status, quality scores, content pipeline, engagement, and follower growth.',
        fullDescription: 'Holus Observatory is the monitoring frontend for the Holus multi-agent system. It reads directly from the agent registry, trajectory logs, evaluation history, and content queue to provide a real-time view of what 32 AI agents are doing, how well they perform, and what content they produce.',
        problem: 'When you have 32 AI agents running autonomously, you need visibility into what they are doing, which ones are performing well, and where quality is dropping. Without observability, autonomous systems become black boxes.',
        solution: 'A Next.js dashboard that reads from the Holus backend (AGENTS.yaml, trajectory.jsonl, eval_history.jsonl, content-queue) and displays: agent grid with status badges, quality heatmap (agents x days), content pipeline kanban, engagement tracker with platform filters, follower growth charts, and system health monitoring.',
        outcome: 'Full visibility into a 32-agent AI system — recruiters can see the system working in real time, and operators can identify quality drops, stalled agents, or content bottlenecks at a glance.',
        techStack: ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'FastAPI', 'SSE', 'Vercel'],
        features: [
            'Agent grid with live status badges (active/idle/running)',
            'Quality heatmap — agents x days with color-coded scores',
            'Content pipeline kanban (draft → review → published)',
            'Engagement tracker with platform filters and sparkline charts',
            'Follower growth chart with daily net change bars',
            'System health monitoring with service latency',
        ],
        status: 'in-progress',
        demoUrl: 'https://holus-observatory.vercel.app',
        imageUrl: '/images/previews_main/agents_board.png',
        appLink: 'https://holus-observatory.vercel.app',
    },
    {
        slug: 'pilaster',
        title: 'Pilaster — AI Content Versioning',
        summary: 'Creative studio for structured content creation with version control, RAG retrieval, and multi-format output.',
        fullDescription: 'Pilaster is an AI-powered content management system that treats content like code — with version history, branching, and structured retrieval. It combines RAG architecture with a collaborative editing environment to let teams create, iterate, and publish structured content at scale.',
        problem: 'Content teams lose context across drafts, can\'t retrieve past versions intelligently, and have no structured way to manage AI-generated content pipelines. Most tools either do AI generation or version control — not both.',
        solution: 'Pilaster combines a RAG-powered knowledge base with Git-style version control for content. Every piece of content is indexed, retrievable, and versioned. Teams can branch content, compare versions, and roll back — the same way engineers manage code.',
        outcome: 'Content teams get deterministic, auditable AI content workflows with full history and retrieval — instead of scattered docs and lost drafts.',
        techStack: ['Next.js 15', 'TypeScript', 'Python', 'pgvector', 'PostgreSQL', 'Claude API', 'Tailwind CSS'],
        features: [
            'Git-style version control for AI-generated content',
            'RAG retrieval — search across all content by semantic similarity',
            'Multi-format output — blog, social, email, doc from one source',
            'Collaborative editing with structured templates',
            'Content history and diff comparison',
        ],
        status: 'in-progress',
        demoUrl: 'https://pilaster.ai',
        imageUrl: '/images/previews_main/self_improving_ai_chat.png',
        appLink: 'https://pilaster.ai',
    },
    {
        slug: 'genpeli',
        title: 'Genpeli — AI Video Pipeline',
        summary: 'Automated video processing pipeline — smart cuts, word-by-word captions, audio normalization for social media.',
        fullDescription: 'Genpeli is an AI pipeline that takes raw video and outputs social-ready clips. It uses speech analysis to find the best cut points, generates word-by-word captions, normalizes audio levels, and exports in the right format for each platform.',
        problem: 'Content creators spend hours manually cutting videos, adding captions, and reformatting for different platforms. The process is repetitive, time-consuming, and requires expensive editing software.',
        solution: 'Genpeli automates the entire post-production workflow. A judge model scores each potential cut on speech energy, sentence boundaries, topic changes, and hook words. The pipeline produces captioned, normalized, platform-ready clips — automatically.',
        outcome: 'What used to take hours of manual editing now runs in minutes. Creators upload raw footage and get back polished, captioned clips ready to post.',
        techStack: ['Python', 'FastAPI', 'Whisper', 'FFmpeg', 'Modal.com', 'React', 'Tailwind CSS'],
        features: [
            'AI-powered cut detection — scores speech energy, sentence boundaries, topic changes',
            'Word-by-word captions with speaker-level timing',
            'Audio normalization and enhancement',
            'Platform-optimized export (vertical/square/horizontal)',
            'Serverless GPU processing via Modal.com',
        ],
        status: 'in-progress',
        demoUrl: 'https://frontend-six-rho-96.vercel.app',
        imageUrl: '/images/previews_main/socia_media_creation.png',
        appLink: 'https://frontend-six-rho-96.vercel.app',
    },
    {
        slug: 'invoz-ai',
        title: 'Invoz.ai — On-Device Speech Coach',
        summary: 'Privacy-first speech coaching app with real-time grammar correction, pronunciation feedback, and federated learning.',
        fullDescription: 'Invoz.ai is a privacy-first speech coaching application that runs entirely on-device. It uses local Whisper models for transcription, real-time grammar analysis, and personalized pronunciation feedback — without sending audio to any server.',
        problem: 'Non-native English speakers and people with speech challenges lack affordable, private tools for real-time coaching. Cloud-based solutions require sending sensitive audio data to third-party servers.',
        solution: 'Invoz runs all AI processing locally using optimized models. Whisper handles transcription, a local grammar model flags errors in real-time, and a federated learning approach improves the model over time without centralizing user data.',
        outcome: 'A speech coaching tool that works offline, never sends audio to servers, and gets more personalized over time — accessible on any device.',
        techStack: ['React Native', 'Whisper', 'Python', 'Federated Learning', 'TypeScript', 'FastAPI'],
        features: [
            'On-device transcription — no audio leaves the device',
            'Real-time grammar correction with explanations',
            'Pronunciation scoring and feedback',
            'Federated learning for personalization without data sharing',
            'Works fully offline',
        ],
        status: 'in-progress',
        demoUrl: 'https://invoz.io',
        imageUrl: '/images/previews_main/invoz.png',
        appLink: 'https://invoz.io',
    },
    {
        slug: 'job-tracker',
        title: 'Job Tracker CRM',
        summary: 'Automated job discovery pipeline with AI-generated cover letters, resume tailoring, and application tracking.',
        fullDescription: 'Job Tracker is a full-stack CRM built specifically for job searching. It scrapes job boards, scores role fit against a target profile, generates tailored cover letters using Claude, and tracks every application through the pipeline — from discovery to offer.',
        problem: 'Job searching is a full-time job. Tracking applications across spreadsheets, writing custom cover letters for each role, and staying on top of follow-ups is overwhelming and error-prone.',
        solution: 'An automated pipeline that discovers relevant roles, scores them for fit, generates personalized cover letters and resume bullets, and surfaces the right follow-up actions — all in one interface.',
        outcome: '109 tests passing, deployed to production. A system that turns job searching from chaos into a structured pipeline.',
        techStack: ['Python', 'FastAPI', 'SQLite', 'Claude API', 'Next.js', 'TypeScript', 'Vercel'],
        features: [
            'Automated job discovery from multiple boards',
            'AI fit scoring against target role profile',
            'Claude-powered cover letter generation (no disclaimers)',
            'Resume bullet tailoring per role',
            'Application status tracking and follow-up reminders',
            'PDF export for cover letters',
        ],
        status: 'live',
        demoUrl: 'https://job-tracker-swart-eta.vercel.app',
        imageUrl: '/images/previews_main/fitness.png',
        appLink: 'https://job-tracker-swart-eta.vercel.app',
    },
    {
        slug: 'holusight',
        title: 'Holusight',
        summary: 'AI-powered document search engine — hybrid BM25 + vector + RRF retrieval with Claude answer synthesis.',
        fullDescription: 'Holusight is a local-first document intelligence engine. Point it at any folder of documents and it builds a hybrid search index — combining BM25 keyword search (SQLite FTS5) with vector embeddings (LanceDB) merged via Reciprocal Rank Fusion. Ask it a question, get a synthesized answer with source citations.',
        problem: 'Enterprise teams drown in documents. Critical knowledge is locked in PDFs, Word files, and wikis. Standard search returns results — not answers. LLMs hallucinate without grounding. Existing tools require cloud upload and expensive SaaS contracts.',
        solution: 'A local Python library + web UI that runs entirely on your machine. Index any folder in seconds, search with hybrid BM25 + vector retrieval, and get LLM-synthesized answers grounded in your actual documents. Pluggable LLM backends: Claude, OpenAI, Azure, or Ollama for fully offline use.',
        outcome: 'Document search goes from keyword guessing to natural language Q&A. Runs locally — no data leaves the machine. Pluggable into any stack via Python API, CLI, or Streamlit chat UI.',
        techStack: ['Python', 'LanceDB', 'SQLite FTS5', 'Claude API', 'Streamlit', 'BM25 + RRF'],
        features: [
            'Hybrid BM25 + vector search merged with Reciprocal Rank Fusion',
            'LLM answer synthesis grounded in document chunks (no hallucination)',
            'Pluggable LLM backends — Claude, OpenAI, Azure OpenAI, Ollama (offline)',
            'Local-first — all data stays on your machine',
            'Python API + CLI + Streamlit web chat UI',
            'Supports PDF, Word, Markdown, plain text',
        ],
        status: 'live',
        appLink: 'https://holusight.com',
        imageUrl: '/images/previews_main/Recovery_vs_strain.png',
    },
]

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
    const { slug } = await params
    const project = projects.find(p => p.slug === slug)

    if (!project) {
        notFound()
    }

    // Special handling for Astoria Conquest - render the interactive map
    if (slug === 'astoria-conquest') {
        const AstoriaConquestPage = (await import('@/app/(main)/apps/astoria-conquest/page')).default
        return <AstoriaConquestPage />
    }

    const statusColors = {
        live: 'bg-green-500/20 text-green-300 border-green-400/30',
        'in-progress': 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        concept: 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    }

    const appHref = project.appLink ?? project.demoUrl
    const isExternalAppLink = appHref?.startsWith('http')
    const heroImageClass = slug === 'astoria-conquest'
        ? 'object-contain object-center scale-90 md:scale-95'
        : 'object-cover object-center'

    return (
        <StandardPage currentPage="projects" maxWidth="wide">
            <div className="w-full">
                {/* Back Navigation */}
                <div className="mb-8">
                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Projects
                    </Link>
                </div>

                {/* Main Content */}
                <Card className="border-white/10 bg-white/[0.05] p-8 md:p-12">

                    {/* Header Section */}
                    <div className="mb-12">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-lg ${statusColors[project.status]}`}>
                                <div className={`w-2 h-2 rounded-full ${project.status === 'live' ? 'bg-green-400' : project.status === 'in-progress' ? 'bg-amber-400' : 'bg-blue-400'} animate-pulse`}></div>
                                {project.status === 'live' ? 'Live Demo' : project.status === 'in-progress' ? 'In Progress' : 'Concept'}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {project.demoUrl && (
                                    <Link
                                        href={project.demoUrl}
                                        className="liquid-glass-btn backdrop-blur-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 px-6 py-3 rounded-xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg inline-flex items-center gap-2 text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View Live Demo
                                    </Link>
                                )}
                                {project.githubUrl && (
                                    <Link
                                        href={project.githubUrl}
                                        className="liquid-glass-btn backdrop-blur-lg bg-white/[0.05] border border-white/[0.12] text-white/80 px-6 py-3 rounded-xl hover:bg-white/[0.08] hover:border-white/[0.16] hover:text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg inline-flex items-center gap-2 text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        View Code
                                    </Link>
                                )}
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extralight text-white mb-6 drop-shadow-lg">
                            {project.title}
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light">
                            {project.fullDescription}
                        </p>
                    </div>

                    {/* Main Image */}
                    <div className="w-full h-64 md:h-96 bg-white border border-white/10 rounded-2xl mb-12 relative overflow-hidden">
                        {project.imageUrl ? (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <Image
                                    src={project.imageUrl}
                                    alt={`${project.title} hero visual`}
                                    fill
                                    className={heroImageClass}
                                    priority
                                />
                            </div>
                        ) : (
                            <svg className="w-24 h-24 text-cyan-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>

                    {/* Project Details Grid */}
                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Problem */}
                        <div className="liquid-glass-section backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                The Problem
                            </h3>
                            <p className="text-white/70 leading-relaxed">{project.problem}</p>
                        </div>

                        {/* Solution */}
                        <div className="liquid-glass-section backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                The Solution
                            </h3>
                            <p className="text-white/70 leading-relaxed">{project.solution}</p>
                        </div>
                    </div>

                    {/* Outcome */}
                    <div className="liquid-glass-section backdrop-blur-lg bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-400/20 rounded-2xl p-6 mb-12">
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            The Outcome
                        </h3>
                        <p className="text-white/80 leading-relaxed text-lg">{project.outcome}</p>
                    </div>

                    {/* Features & Tech Stack */}
                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Features */}
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-6">Key Features</h3>
                            <ul className="space-y-3">
                                {project.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-white/80 leading-relaxed">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Tech Stack */}
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-6">Technology Stack</h3>
                            <div className="flex flex-wrap gap-3">
                                {project.techStack.map(tech => (
                                    <span key={tech} className="bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-lg">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center pt-8 border-t border-white/[0.08]">
                        <h3 className="text-xl font-semibold text-white mb-4">Interested in this project?</h3>
                        <p className="text-white/70 mb-6 leading-relaxed">
                            I'd love to discuss the technical details, challenges overcome, or similar projects I could build for you.
                        </p>
                        {appHref && (
                            <Link
                                href={appHref}
                                {...(isExternalAppLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white/80 transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:text-cyan-100"
                            >
                                <span>View Live App</span>
                                <span aria-hidden className="text-lg">{isExternalAppLink ? '↗' : '→'}</span>
                            </Link>
                        )}

                        <Link
                            href="/contact"
                            className="liquid-glass-cta-btn backdrop-blur-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 inline-flex items-center gap-3"
                        >
                            <span>Let's discuss this project</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </Card>
            </div>
        </StandardPage>
    )
}

// Generate static params for all projects
export async function generateStaticParams() {
    return [
        { slug: 'interactive-chatbot' },
        { slug: 'ai-content-creator' },
        { slug: 'ai-coaching-app' },
        { slug: 'ai-advisor-board' },
        { slug: 'astoria-conquest' },
        { slug: 'data-analytics-portfolio' },
        { slug: 'holus' },
        { slug: 'holus-observatory' },
        { slug: 'pilaster' },
        { slug: 'genpeli' },
        { slug: 'invoz-ai' },
        { slug: 'job-tracker' },
        { slug: 'holusight' },
    ]
}
