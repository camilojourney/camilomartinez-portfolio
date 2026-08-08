import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import StandardPage from '@/components/shared/standard-page'
import { Card } from '@/components/ui/Card'
import { HOLUS_OBSERVATORY_DESTINATION_DECISION } from '@/data/project-destinations'

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
        outcome: 'The result is a more engaging, interactive portfolio experience that gives recruiters a direct way to ask about my background, projects, and availability.',
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
        imageUrl: '/images/previews_main/self_improving_ai_chat.png'
    },
    {
        slug: 'ai-advisor-board',
        title: 'AI Advisor Board',
        summary: 'Multi-agent advisory system where specialized directors collaborate through structured deliberation.',
        fullDescription: 'AI Advisor Board simulates a leadership meeting by assigning LLM agents to roles such as Sales, Customer Success, Product, and Research. Each director contributes domain expertise, challenges assumptions, and drafts a unified recommendation using structured prompts and critique loops.',
        problem: 'Executives need to synthesize perspectives from multiple stakeholders quickly, but real meetings are expensive and constrained by scheduling.',
        solution: 'Built autonomous directors with shared memory and turn-based debate. Each round the agents surface risks, customer sentiment, and data-backed insights before converging on an action plan.',
        outcome: 'Produces concise strategy briefs that highlight risks, objections, and follow-up actions for review.',
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
        outcome: 'A concept for keeping content creation consistent across channels while preserving brand voice and review workflows.',
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
        imageUrl: '/images/previews_main/socia_media_creation.png'
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
        imageUrl: '/images/previews_main/agents_board.png'
    },
    {
        slug: 'astoria-conquest',
        title: 'Astoria Conquest - Interactive Running Map',
        summary: 'A data-driven running exploration app that visualizes GPS routes on an interactive street map of Astoria, Queens.',
        fullDescription: 'This project combines GPS tracking, interactive mapping, and gamification to turn running into an exploration experience. Using real GPS data from running sessions, it creates a visual coverage map showing which streets have been covered.',
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
        imageUrl: '/images/previews_main/fitness.png'
    },
    {
        slug: 'holus',
        title: 'Holus Content Engine',
        summary: 'Multi-agent AI system that observes analytics, reasons about content strategy, and coordinates specialized agents to create and publish across platforms.',
        fullDescription: 'Holus is a multi-agent content engine that automates the full content lifecycle - from deciding what to create, to producing it, to learning from results. It coordinates specialized agents (writers, researchers, evaluators) that communicate through MCP tool calls to independent production silos: Pilaster for images, Genpeli for video, and a social media platform for publishing.',
        problem: 'Solo founders building multiple AI products can\'t keep up with content marketing across several platforms. Each product has a different audience, different formats, and different performance patterns. The work is repetitive but requires judgment - you need strategy, not just scheduling.',
        solution: 'An autonomous agent loop: OBSERVE what performed well via analytics → REASON about strategy using Claude Opus → ACT by dispatching to specialized content agents → EVALUATE every piece with domain-expert judges before publishing. The system learns weekly and adjusts its own strategy.',
        outcome: 'Content creation goes from manual and sporadic to continuous and data-driven. Every piece is quality-scored before publishing. The system improves its own prompts and strategy based on what actually performs.',
        techStack: ['Python 3.12', 'Claude API', 'Redis', 'FastAPI', 'Pydantic', 'MCP'],
        features: [
            'Specialized agents organized by role: managers, specialists, evaluators, ops',
            'ReAct agent loop: observe → reason → act → evaluate',
            '7 domain-expert quality judges with category-specific rubrics',
            'MCP integration with Pilaster, Genpeli, and Social Media silos',
            'Self-improvement loop: trajectory logging, weekly learning, strategy adaptation',
            'Three-layer prompt resolution for A/B testing agent prompts',
        ],
        status: 'live',
        demoUrl: 'https://public-phi-rouge-11.vercel.app',
        imageUrl: '/images/previews_main/socia_media_creation.png',
        appLink: 'https://public-phi-rouge-11.vercel.app',
    },
    {
        slug: 'holus-observatory',
        title: 'Holus Observatory - Multi-Agent Monitoring Dashboard',
        summary: 'Real-time observability dashboard for a multi-agent AI system - tracks agent status, quality scores, content pipeline, engagement, and follower growth.',
        fullDescription: 'Holus Observatory is the monitoring frontend for the Holus multi-agent system. It reads from the agent registry, trajectory logs, evaluation history, and content queue to provide a real-time view of what agents are doing, how well they perform, and what content they produce.',
        problem: 'When AI agents run autonomously, you need visibility into what they are doing, which ones are performing well, and where quality is dropping. Without observability, autonomous systems become black boxes.',
        solution: 'A Next.js dashboard that reads from the Holus backend (AGENTS.yaml, trajectory.jsonl, eval_history.jsonl, content-queue) and displays: agent grid with status badges, quality heatmap (agents x days), content pipeline kanban, engagement tracker with platform filters, follower growth charts, and system health monitoring.',
        outcome: 'Recruiters can inspect a working observability surface, and operators can identify quality drops, stalled agents, or content bottlenecks at a glance.',
        techStack: ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'FastAPI', 'SSE', 'Vercel'],
        features: [
            'Agent grid with live status badges (active/idle/running)',
            'Quality heatmap - agents x days with color-coded scores',
            'Content pipeline kanban (draft → review → published)',
            'Engagement tracker with platform filters and sparkline charts',
            'Follower growth chart with daily net change bars',
            'System health monitoring with service latency',
        ],
        status: 'live',
        demoUrl: HOLUS_OBSERVATORY_DESTINATION_DECISION.canonicalHref ?? undefined,
        imageUrl: '/images/previews_main/holus_observatory.png',
        appLink: HOLUS_OBSERVATORY_DESTINATION_DECISION.canonicalHref ?? undefined,
    },
    {
        slug: 'pilaster',
        title: 'Pilaster - AI Image Generation Platform',
        summary: 'Version control and memory system for AI image generation. Tracks every iteration with intent notes, parameter diffs, and failure pattern warnings across multiple backends.',
        fullDescription: 'Pilaster is an AI image generation platform with memory. It owns three layers: a character registry (LoRAs, reference sheets, metadata for consistent characters), a generation abstraction (backend-agnostic interface for ComfyUI, Replicate, Runway, DALL-E, or any future engine), and experiment memory (tracks every generation with outcomes and quality scores, learns what works, warns before repeating failures).',
        problem: 'AI image generation is a cycle of trial and error with no institutional memory. Creators lose track of which prompts worked, which settings produced good results, and which approaches failed. Every session starts from scratch. Switching between backends (ComfyUI, DALL-E, Replicate) means losing all context.',
        solution: 'A platform that remembers everything. Every generation is tracked with intent, parameters, and quality score. Characters stay consistent via a registry of LoRAs and reference images. Structured prompt recipes decompose intent into reusable dimensions (subject, style, composition, lighting) that work identically across all backends.',
        outcome: 'Image generation goes from random experimentation to informed decision-making. The system learns from every attempt, reuses successful patterns, and warns before repeating known failures - across any backend.',
        techStack: ['Next.js 15', 'TypeScript', 'Python', 'Supabase', 'PostgreSQL', 'ComfyUI', 'MCP Server'],
        features: [
            'Character registry with LoRAs and reference sheets for consistency',
            'Backend-agnostic generation - ComfyUI, DALL-E, Replicate, Runway',
            'Structured prompt recipes that map to ComfyUI nodes',
            'Experiment memory - tracks outcomes, learns from failures',
            'Version control with intent notes and parameter diffs',
            'MCP server for agent integration (8 tools)',
        ],
        status: 'live',
        demoUrl: 'https://pilaster.ai',
        imageUrl: '/images/previews_main/pilaster.png',
        appLink: 'https://pilaster.ai',
    },
    {
        slug: 'genpeli',
        title: 'Genpeli - AI Video Editing Pipeline',
        summary: 'Local-first AI video editing pipeline. Smart cuts, word-by-word captions, audio normalization, and social media delivery for short-form content.',
        fullDescription: 'Genpeli takes raw video footage and turns it into polished social-ready clips - automatically. It uses Whisper for transcription, a judge model for intelligent cut detection, FFmpeg for processing, and word-by-word caption rendering. The entire pipeline runs locally or on serverless GPUs.',
        problem: 'Content creators spend hours manually cutting videos, adding captions, and reformatting for different platforms. The process is repetitive, time-consuming, and requires expensive editing software. Short-form content demands high volume but each piece still needs manual polish.',
        solution: 'An automated post-production pipeline. Upload raw footage → Whisper transcribes → a judge model scores every potential cut point (speech energy, sentence boundaries, hook words) → FFmpeg renders with word-by-word captions and normalized audio → export in the right format for each platform.',
        outcome: 'What used to take hours of manual editing now runs in minutes. Upload raw footage, get back polished clips with captions - ready to post on any platform.',
        techStack: ['Python', 'FastAPI', 'Whisper', 'FFmpeg', 'Modal.com', 'React', 'Tailwind CSS'],
        features: [
            'AI-powered cut detection - scores speech energy, sentence boundaries, topic changes',
            'Word-by-word captions with speaker-level timing',
            'Audio normalization and enhancement',
            'Platform-optimized export (vertical/square/horizontal)',
            'Serverless GPU processing via Modal.com',
        ],
        status: 'live',
        demoUrl: 'https://www.editai.ai',
        imageUrl: '/images/previews_main/genpeli.png',
        appLink: 'https://www.editai.ai',
    },
    {
        slug: 'invoz-ai',
        title: 'Invoz - Audio ML Pipeline',
        summary: 'Audio ML pipeline built from 46 research papers. Scores spoken English across 11 dimensions using Whisper, wav2vec2, Parselmouth, Silero VAD, and LLM-based coaching.',
        fullDescription: 'Invoz is a production ML pipeline that analyzes spoken English across 11 scoring dimensions - 7 acoustic (pitch variability, speech rate, pause patterns, volume dynamics, filler words, articulation clarity, rhythm) and 4 linguistic (vocabulary richness, grammar accuracy, coherence, discourse markers). Built from 46 research papers in speech pathology and computational linguistics.',
        problem: 'Non-native English speakers get generic feedback like "speak more clearly" with no specifics. Existing tools score pronunciation at the word level but miss the acoustic and linguistic patterns that actually make speech effective - rhythm, pause placement, vocabulary range, discourse structure.',
        solution: 'A multi-model pipeline: Whisper for transcription, wav2vec2 for phoneme-level analysis, Parselmouth for acoustic features (F0, jitter, shimmer), Silero VAD for precise speech/silence segmentation, and Claude for linguistic coaching. Each dimension is scored independently with research-backed rubrics.',
        outcome: 'Speakers get actionable, dimension-specific feedback instead of generic advice like "speak better." Production-deployed at invoz.io.',
        techStack: ['Python', 'FastAPI', 'Whisper', 'wav2vec2', 'Parselmouth', 'Silero VAD', 'Claude API'],
        features: [
            '11-dimension scoring (7 acoustic + 4 linguistic)',
            'Research-backed rubrics from 46 papers',
            'Phoneme-level pronunciation analysis via wav2vec2',
            'Acoustic feature extraction (pitch, jitter, shimmer) via Parselmouth',
            'LLM-powered coaching with specific improvement suggestions',
            'Real-time processing with streaming results',
        ],
        status: 'live',
        demoUrl: 'https://invoz.io',
        imageUrl: '/images/previews_main/invoz.png',
        appLink: 'https://invoz.io',
    },
    {
        slug: 'job-tracker',
        title: 'Job Tracker CRM',
        summary: 'End-to-end job search CRM with Kanban workflow, AI-generated cover letters, resume tailoring, and pipeline management.',
        fullDescription: 'Job Tracker is a full-stack CRM built specifically for job searching. It tracks every application through a Kanban pipeline (Applied → Interview → Offer → Hired), generates tailored cover letters using Claude, scores role fit against a target profile, and surfaces follow-up actions.',
        problem: 'Job searching is a full-time job. Tracking applications across spreadsheets, writing custom cover letters for each role, and staying on top of follow-ups is overwhelming and error-prone. You lose track of where you are with each company.',
        solution: 'A Kanban-style CRM that treats job applications like a sales pipeline. AI generates cover letters tailored to each role, scores fit against your target profile, and reminds you when follow-ups are due. Everything in one view.',
        outcome: 'Job searching goes from scattered spreadsheets to a structured pipeline. Currently used personally to manage an active job search.',
        techStack: ['Python', 'FastAPI', 'SQLite', 'Claude API', 'Next.js', 'TypeScript', 'Vercel'],
        features: [
            'Kanban pipeline: Applied → Interview → Offer → Hired',
            'AI fit scoring against target role profile',
            'Claude-powered cover letter generation',
            'Resume bullet tailoring per role',
            'Application status tracking and follow-up reminders',
            'PDF export for cover letters',
        ],
        status: 'live',
        demoUrl: 'https://job-tracker-swart-eta.vercel.app',
        imageUrl: '/images/previews_main/job_tracker.png',
        appLink: 'https://job-tracker-swart-eta.vercel.app',
    },
    {
        slug: 'holusight',
        title: 'Holusight - Hybrid Document Search',
        summary: 'Hybrid document retrieval system combining BM25, vector search, and reciprocal rank fusion reranking with answer synthesis.',
        fullDescription: 'Holusight is a local-first document intelligence engine. Point it at a folder of documents and it builds a hybrid search index - combining BM25 keyword search (SQLite FTS5) with vector embeddings (LanceDB) merged via Reciprocal Rank Fusion. Ask a question in natural language, get a synthesized answer with source citations.',
        problem: 'Critical knowledge is locked in PDFs, Word files, and wikis. Standard search returns results - not answers. LLMs hallucinate without grounding. Existing RAG tools require cloud upload and expensive SaaS contracts.',
        solution: 'A local Python library + web UI that runs entirely on your machine. Index any folder in seconds, search with hybrid BM25 + vector retrieval, and get LLM-synthesized answers grounded in your actual documents. Pluggable LLM backends: Claude, OpenAI, Azure, or Ollama for fully offline use.',
        outcome: 'Document search goes from keyword guessing to natural language Q&A. Runs locally - no data leaves the machine. Pluggable into any stack via Python API, CLI, or Streamlit chat UI.',
        techStack: ['Python', 'LanceDB', 'SQLite FTS5', 'Claude API', 'Streamlit', 'BM25 + RRF'],
        features: [
            'Hybrid BM25 + vector search merged with Reciprocal Rank Fusion',
            'LLM answer synthesis grounded in document chunks (no hallucination)',
            'Pluggable LLM backends - Claude, OpenAI, Azure OpenAI, Ollama (offline)',
            'Local-first - all data stays on your machine',
            'Python API + CLI + Streamlit web chat UI',
            'Supports PDF, Word, Markdown, plain text',
        ],
        status: 'in-progress',
        imageUrl: '/images/previews_main/holusight.png',
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
                        className="mobile-link-target inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium"
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
                                        className="mobile-link-target liquid-glass-btn backdrop-blur-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 px-6 py-3 rounded-xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg inline-flex items-center gap-2 text-sm font-medium"
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
                                        className="mobile-link-target liquid-glass-btn backdrop-blur-lg bg-white/[0.05] border border-white/[0.12] text-white/80 px-6 py-3 rounded-xl hover:bg-white/[0.08] hover:border-white/[0.16] hover:text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg inline-flex items-center gap-2 text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        View Code
                                    </Link>
                                )}
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-[-0.03em]">
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
                                className="mobile-link-target inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white/80 transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:text-cyan-100"
                            >
                                <span>View Live App</span>
                                <span aria-hidden className="text-lg">{isExternalAppLink ? '↗' : '→'}</span>
                            </Link>
                        )}

                        <Link
                            href="/contact"
                            className="mobile-link-target liquid-glass-cta-btn backdrop-blur-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 inline-flex items-center gap-3"
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
