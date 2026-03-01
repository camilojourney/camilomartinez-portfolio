'use client';

import { Card } from '@/components/ui/Card';
import LiquidNav from '@/components/shared/liquid-nav';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { projects } from '../../data/projects';
import type { ProjectStatus } from '../../data/projects';

type NavKey = 'projects' | 'about' | 'blog' | 'contact';

const statusStyles: Record<ProjectStatus, { label: string; className: string }> = {
  live: {
    label: 'Live',
    className: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  },
  prototype: {
    label: 'Prototype',
    className: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
  },
  concept: {
    label: 'Concept',
    className: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
  },
};

const defaultStatusStyle = statusStyles.prototype;

function getPreviewClasses(slug: string) {
  if (slug === 'astoria-conquest') {
    return {
      container: 'bg-slate-950',
      image: 'object-contain object-center scale-90 md:scale-95',
    };
  }

  return {
    container: 'bg-white/5',
    image: 'object-cover object-center',
  };
}

export default function ProjectsShowcase({ currentPage = 'projects' }: { currentPage?: NavKey }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage={currentPage} />

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
            AI Engineering<br />Consulting
          </h1>
          <p className="text-xl md:text-2xl text-white/70 leading-relaxed max-w-3xl mx-auto mb-10">
            I help companies build <span className="text-cyan-400 font-semibold">production ML systems</span>,{' '}
            <span className="text-blue-400 font-semibold">data pipelines</span>, and{' '}
            <span className="text-purple-400 font-semibold">AI-powered products</span> that actually ship.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/20"
          >
            <span>Start a Project</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        {/* Services Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.06] hover:border-cyan-400/20 transition-all duration-500">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">ML Systems</h3>
              <p className="text-white/60 text-sm leading-relaxed">End-to-end machine learning pipelines — from data ingestion to production deployment with monitoring.</p>
            </div>
            <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.06] hover:border-blue-400/20 transition-all duration-500">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/20 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">RAG & LLM Integration</h3>
              <p className="text-white/60 text-sm leading-relaxed">Custom RAG architectures, multi-agent systems, and LLM-powered features integrated into your product.</p>
            </div>
            <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.06] hover:border-purple-400/20 transition-all duration-500">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/20 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Data Engineering</h3>
              <p className="text-white/60 text-sm leading-relaxed">Scalable data pipelines, real-time analytics, and API integrations that power business decisions.</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-16 space-y-12">
          <section className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white/95">Case Studies</h2>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed">
                Real systems I've built — from concept to production.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {projects.map((project) => {
                const statusStyle = statusStyles[project.status] ?? defaultStatusStyle;
                const previewClasses = getPreviewClasses(project.slug);
                const appHref = project.appHref;
                const appLabel = project.appLabel || (project.isExternalApp ? 'Launch live app' : 'View live app');

                return (
                  <Card
                    key={project.slug}
                    className="h-full border-white/10 bg-white/[0.05] transition-all duration-300 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/20"
                  >
                    <div className="p-8 flex flex-col gap-5 h-full">
                      <div className="flex items-start justify-between gap-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.className}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current/80 animate-pulse"></span>
                          {statusStyle.label}
                        </span>
                      </div>

                      <Link href={project.caseStudyHref} className="group inline-flex flex-col gap-3">
                        <h3 className="text-2xl font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">
                          {project.title}
                        </h3>
                      </Link>

                      <p className="text-white/70 text-sm leading-relaxed">{project.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span key={tag} className="text-xs font-medium text-white/60 border border-white/15 px-3 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto flex flex-col gap-3">
                        <Link
                          href={project.caseStudyHref}
                          className="group block rounded-2xl border border-purple-400/40 bg-purple-500/10 p-4 transition-all duration-300 hover:border-purple-300/60 hover:bg-purple-500/20"
                        >
                          <div className={`relative w-full h-40 rounded-xl overflow-hidden border border-purple-400/30 ${previewClasses.container}`}>
                            {project.previewImage ? (
                              <Image
                                src={project.previewImage}
                                alt={`${project.title} preview`}
                                fill
                                className={previewClasses.image}
                                sizes="(min-width: 768px) 300px, 100vw"
                                priority={project.status === 'live'}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-purple-500/10">
                                <span className="text-xs uppercase tracking-[0.2em] text-purple-200/60">
                                  Preview coming soon
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-200 transition-all duration-300 group-hover:border-purple-300/60 group-hover:bg-purple-500/30 group-hover:text-purple-100">
                            <span>Read case study</span>
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </Link>

                        {appHref && (
                          <Link
                            href={appHref}
                            {...(project.isExternalApp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:text-cyan-200"
                          >
                            <span>{appLabel}</span>
                            <span aria-hidden className="text-lg">{project.isExternalApp ? '↗' : '→'}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
