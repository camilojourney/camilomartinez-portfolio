"use client"

import LiquidPage from '@/components/shared/liquid-page'
import Link from 'next/link'

interface ProjectCardProps {
    title: string
    summary: string
    imageUrl: string
    projectUrl: string
    status?: 'live' | 'in-progress' | 'concept'
    techStack?: string[]
}

function ProjectCard({ title, summary, imageUrl, projectUrl, status = 'live', techStack = [] }: ProjectCardProps) {
    const statusColors = {
        live: 'bg-green-500/20 text-green-300 border-green-400/30',
        'in-progress': 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        concept: 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    }

    return (
        <Link href={projectUrl} className="group">
            <div className="liquid-glass-project-card backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 md:p-8 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/10 h-full">
                {/* Project Image Placeholder */}
                <div className="w-full h-48 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-blue-500/5"></div>
                    <svg className="w-16 h-16 text-cyan-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-lg mb-4 ${statusColors[status]}`}>
                    <div className={`w-2 h-2 rounded-full ${status === 'live' ? 'bg-green-400' : status === 'in-progress' ? 'bg-amber-400' : 'bg-blue-400'} animate-pulse`}></div>
                    {status === 'live' ? 'Live Demo' : status === 'in-progress' ? 'In Progress' : 'Concept'}
                </div>

                {/* Project Title */}
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">
                    {title}
                </h3>

                {/* Project Summary */}
                <p className="text-white/70 leading-relaxed mb-4 text-sm md:text-base">
                    {summary}
                </p>

                {/* Tech Stack */}
                {techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {techStack.slice(0, 3).map(tech => (
                            <span key={tech} className="bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 px-2 py-1 rounded-lg text-xs font-medium">
                                {tech}
                            </span>
                        ))}
                        {techStack.length > 3 && (
                            <span className="text-white/40 text-xs font-medium px-2 py-1">
                                +{techStack.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {/* View Project Arrow */}
                <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:text-cyan-300 transition-colors duration-300 mt-auto pt-4">
                    <span>View Project</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    )
}

export default function ProjectsPage() {
    return (
        <LiquidPage currentPage="projects" backgroundVariant="default">
            {/* Main content card */}
            <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 md:p-12 max-w-7xl w-full shadow-2xl shadow-black/20">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-extralight text-white mb-6 drop-shadow-lg">
                        My Work
                    </h1>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mx-auto mb-8"></div>
                    <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl mx-auto font-light">
                        A collection of projects showcasing my expertise in AI, data analytics, and full-stack development. Each project demonstrates different aspects of my technical skills and problem-solving approach.
                    </p>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <ProjectCard
                        title="Interactive 'About Me' Chatbot"
                        summary="A live demonstration of a full-stack application built with Next.js and NLP to create an engaging, interactive user experience. Features real-time conversation flow and glassmorphism UI design."
                        imageUrl="/images/project-chatbot.png"
                        projectUrl="/projects/interactive-chatbot"
                        status="live"
                        techStack={['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Vercel']}
                    />
                    <ProjectCard
                        title="AI Content Creator"
                        summary="A conceptual application using advanced NLP models to help marketers and writers accelerate their creative workflow. Includes content generation, editing assistance, and optimization features."
                        imageUrl="/images/project-content-creator.png"
                        projectUrl="/projects/ai-content-creator"
                        status="concept"
                        techStack={['Next.js', 'Python', 'OpenAI API', 'NLP Libraries', 'PostgreSQL']}
                    />
                    <ProjectCard
                        title="AI Coaching App"
                        summary="A conceptual personalized coaching application that uses AI to provide tailored guidance for professional development, skill building, and goal achievement based on user data and preferences."
                        imageUrl="/images/project-coach-app.png"
                        projectUrl="/projects/ai-coaching-app"
                        status="concept"
                        techStack={['Next.js', 'Python', 'Machine Learning', 'Database', 'Analytics']}
                    />
                    <ProjectCard
                        title="Data Analytics Portfolio"
                        summary="A comprehensive showcase of data analysis projects demonstrating proficiency in statistical modeling, data visualization, and business intelligence using modern analytics tools."
                        imageUrl="/images/project-analytics.png"
                        projectUrl="/projects/data-analytics-portfolio"
                        status="in-progress"
                        techStack={['Python', 'Pandas', 'Matplotlib', 'SQL', 'Jupyter']}
                    />
                </div>

                {/* Call to Action */}
                <div className="text-center">
                    <p className="text-white/60 mb-6 text-base md:text-lg font-light">
                        Interested in seeing more details about any of these projects?
                    </p>
                    <Link
                        href="/contact"
                        className="liquid-glass-cta-btn backdrop-blur-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 inline-flex items-center gap-3"
                    >
                        <span>Let's discuss your project</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </section>
        </LiquidPage>
    )
}
