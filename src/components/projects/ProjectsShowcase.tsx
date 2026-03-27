'use client';

import { Card } from '@/components/ui/Card';
import LiquidNav from '@/components/shared/liquid-nav';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, FileText, Download } from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';
import { projects } from '../../data/projects';
import type { ProjectStatus, ProjectMeta } from '../../data/projects';

type NavKey = 'projects' | 'about' | 'blog' | 'contact';

const statusStyles: Record<ProjectStatus, { label: string; className: string }> = {
  live: {
    label: 'Live',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  },
  prototype: {
    label: 'Prototype',
    className: 'bg-purple-500/15 text-purple-300 border-purple-400/25',
  },
  concept: {
    label: 'Concept',
    className: 'bg-blue-500/15 text-blue-300 border-blue-400/25',
  },
};

const defaultStatusStyle = statusStyles.prototype;

// Map tags to badge categories for colored badges
const tagCategoryMap: Record<string, string> = {
  'Audio/Speech ML': 'ml', 'Signal Processing': 'ml', 'Production ML': 'ml',
  'Machine Learning': 'ml', 'NLP': 'ml', 'LLM Systems': 'ml', 'LLM Evaluation': 'ml',
  'RAG': 'ml', 'AI Engineering': 'ml', 'Self-Improvement': 'ml', 'Video AI': 'ml',
  'Multi-Agent': 'infra', 'Observability': 'infra', 'Search': 'infra', 'Rust': 'infra',
  'Next.js': 'frontend', 'React': 'frontend', 'Tauri 2': 'frontend', 'macOS': 'frontend',
  'Creative Tooling': 'frontend', 'Version Control': 'frontend',
  'Publishing API': 'api', 'FastAPI': 'api', 'FFmpeg': 'api', 'Whisper': 'ml',
  'Full-Stack': 'api', 'APIs': 'api', 'Real-time': 'api', 'WHOOP API': 'api',
  'Data Engineering': 'data', 'Data Science': 'data', 'Data Visualization': 'data',
  'Graph Theory': 'data', 'Mapping': 'data', 'Visualization': 'data',
  'Health Analytics': 'data', 'Python': 'data', 'Hackathon': 'data',
  'Accountability': 'data',
};

function getBadgeClass(tag: string): string {
  const cat = tagCategoryMap[tag] || 'default';
  return `tech-badge-${cat}`;
}

function getPreviewClasses(slug: string) {
  if (slug === 'astoria-conquest') {
    return {
      container: 'bg-slate-950',
      image: 'object-contain object-center scale-90 md:scale-95',
    };
  }
  return {
    container: 'bg-white/[0.03]',
    image: 'object-cover object-center',
  };
}

const tier1 = projects.filter((p) => p.tier === 1);
const tier2 = projects.filter((p) => p.tier === 2);
const tier3 = projects.filter((p) => p.tier === 3);

/* ── Scroll-driven reveal hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.classList.add('scroll-revealed');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('scroll-revealed');
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`scroll-reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ── Stagger animation for card grids ── */
function useStaggerReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      container.querySelectorAll('[data-stagger-child]').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          container.querySelectorAll('[data-stagger-child]').forEach((el, i) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.animationDelay = `${i * 120}ms`;
            htmlEl.classList.add('card-stagger-animate');
          });
          observer.unobserve(container);
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function StaggerGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useStaggerReveal();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

function ProjectCard({ project, index = 0, featured = false }: { project: ProjectMeta; index?: number; featured?: boolean }) {
  const statusStyle = statusStyles[project.status] ?? defaultStatusStyle;
  const previewClasses = getPreviewClasses(project.slug);
  const appHref = project.appHref;
  const appLabel = project.appLabel || (project.isExternalApp ? 'Launch live app' : 'View live app');
  const apiHref = project.apiHref;
  const apiLabel = project.apiLabel || 'API Docs';
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  return (
      <div
        ref={cardRef}
        data-stagger-child
        className="group h-full project-card-premium opacity-0"
        onMouseMove={handleMouseMove}
      >
        <Card className={`h-full border-white/[0.08] bg-white/[0.02] transition-all duration-500 hover:border-white/[0.20] hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-cyan-500/[0.06] hover:-translate-y-1.5 ${featured ? 'hover:shadow-cyan-500/[0.10]' : ''} rounded-2xl overflow-hidden`}>
          <div className="flex flex-col h-full">
            {/* Preview Image */}
            <Link href={project.caseStudyHref} className="block relative">
              <div className={`relative w-full aspect-[16/10] overflow-hidden ${previewClasses.container}`}>
                {project.previewImage ? (
                  <Image
                    src={project.previewImage}
                    alt={`${project.title} preview`}
                    fill
                    className={`${previewClasses.image} transition-all duration-700 group-hover:scale-[1.03]`}
                    sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
                    priority={project.tier === 1}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
                    <span className="text-xs uppercase tracking-[0.2em] text-white/30">
                      Preview coming soon
                    </span>
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {/* Status badge */}
                <span
                  className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md ${statusStyle.className}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
                  {statusStyle.label}
                </span>
              </div>
            </Link>

            {/* Content */}
            <div className="p-5 md:p-6 flex flex-col gap-3 flex-1">
              <Link href={project.caseStudyHref} className="group/title inline-flex flex-col gap-1">
                <h3 className={`${featured ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'} font-semibold text-white group-hover/title:text-cyan-300 transition-colors duration-300 leading-snug`}>
                  {project.title}
                </h3>
              </Link>

              <p className="text-white/50 text-[14px] leading-[1.7] line-clamp-3">{project.description}</p>

              {/* Tech badges -- color-coded */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[11px] font-medium border px-2.5 py-0.5 rounded-md ${getBadgeClass(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="mt-auto pt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={project.caseStudyHref}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 group/link"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Case study</span>
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200" />
                </Link>

                {appHref && (
                  <>
                    <span className="text-white/10">|</span>
                    <Link
                      href={appHref}
                      {...(project.isExternalApp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400/80 hover:text-cyan-300 transition-colors duration-200"
                    >
                      <span>{appLabel}</span>
                      {project.isExternalApp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </Link>
                  </>
                )}

                {apiHref && (
                  <>
                    <span className="text-white/10">|</span>
                    <Link
                      href={apiHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-white/40 hover:text-violet-300 transition-colors duration-200"
                    >
                      <span>{apiLabel}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
  );
}

export default function ProjectsShowcase({ currentPage = 'projects' }: { currentPage?: NavKey }) {

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage={currentPage} />

      {/* Background -- layered depth with subtle grain */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050810]"></div>
        {/* Primary gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-[#080d1c] to-[#050810]"></div>
        {/* Ambient orbs -- slower, more diffuse, desaturated */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <div className="absolute top-[12%] left-[8%] w-[700px] h-[700px] bg-blue-600/[0.04] rounded-full blur-[160px] animate-liquid-float"></div>
          <div className="absolute top-[40%] right-[3%] w-[550px] h-[550px] bg-indigo-500/[0.035] rounded-full blur-[140px] animate-liquid-float animation-delay-4000"></div>
          <div className="absolute bottom-[8%] left-[30%] w-[450px] h-[450px] bg-cyan-500/[0.02] rounded-full blur-[120px] animate-liquid-float animation-delay-6000"></div>
        </div>
        {/* Subtle grain overlay for texture */}
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}></div>
      </div>

      <main className="pt-28 md:pt-40 lg:pt-44 px-5 md:px-8 pb-24">
        {/* ═══ Hero ═══ */}
        <header className="max-w-3xl mx-auto text-center mb-20 md:mb-32">
          {/* Overline -- role signal with subtle gradient line */}
          <div className="hero-stagger hero-stagger-1 flex items-center justify-center gap-4 mb-8 md:mb-10">
            <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-cyan-400/40"></div>
            <p className="text-[13px] md:text-sm font-semibold tracking-[0.25em] uppercase text-white/40">
              AI Engineer
            </p>
            <div className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-cyan-400/40"></div>
          </div>

          {/* Title -- name as the brand, massive and confident */}
          <h1 className="hero-stagger hero-stagger-2 text-[2.5rem] sm:text-[3.25rem] md:text-[4.25rem] lg:text-[5rem] font-extrabold mb-6 md:mb-8 leading-[1.02] tracking-[-0.045em]">
            <span className="text-white">Camilo</span>
            <br />
            <span className="hero-gradient-text">Martinez</span>
          </h1>

          {/* Subtitle -- proof statement, one clear sentence */}
          <p className="hero-stagger hero-stagger-3 text-[16px] md:text-[18px] lg:text-[20px] text-white/50 leading-[1.7] max-w-xl mx-auto mb-10 md:mb-12">
            I ship <span className="text-cyan-400 font-semibold">audio/speech ML</span> pipelines
            and <span className="text-blue-400 font-semibold">multi-agent systems</span> to production
            — from research papers to real users.
          </p>

          {/* Credibility markers -- concrete, active, scannable */}
          <div className="hero-stagger hero-stagger-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-12 md:mb-14">
            <span className="inline-flex items-center gap-2 text-[13px] md:text-[14px] text-white/50 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 shadow-[0_0_6px_rgba(52,211,153,0.4)]"></span>
              11-dimension speech scorer from 46 papers
            </span>
            <span className="hidden sm:block w-px h-3.5 bg-white/10"></span>
            <span className="inline-flex items-center gap-2 text-[13px] md:text-[14px] text-white/50 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/70 shadow-[0_0_6px_rgba(6,182,212,0.4)]"></span>
              32-agent orchestration system
            </span>
            <span className="hidden sm:block w-px h-3.5 bg-white/10"></span>
            <span className="inline-flex items-center gap-2 text-[13px] md:text-[14px] text-white/50 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/70 shadow-[0_0_6px_rgba(59,130,246,0.4)]"></span>
              NYC &middot; Open to roles
            </span>
          </div>

          {/* CTAs -- primary with glow, secondary with clear affordance */}
          <div className="hero-stagger hero-stagger-5 flex flex-col sm:flex-row gap-3.5 justify-center">
            <a
              href="/contact"
              className="group/cta inline-flex items-center justify-center gap-2.5 bg-white text-black text-[15px] font-semibold px-8 py-3.5 rounded-full hover:bg-white/95 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.08)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get in touch</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-0.5" />
            </a>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 bg-white/[0.06] border border-white/[0.12] text-white/65 text-[15px] font-medium px-8 py-3.5 rounded-full hover:bg-white/[0.10] hover:text-white/90 hover:border-white/[0.20] transition-all duration-300 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Resume</span>
            </a>
          </div>
        </header>

        {/* ═══ Section divider ═══ */}
        <div className="max-w-6xl mx-auto mb-16 md:mb-24">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"></div>
        </div>

        <div className="max-w-6xl mx-auto space-y-24 md:space-y-32">
          {/* Tier 1: Featured Work */}
          <ScrollReveal>
            <section className="space-y-10" aria-labelledby="featured-heading">
              <div className="max-w-3xl mx-auto space-y-2.5">
                <h2 id="featured-heading" className="text-[1.5rem] md:text-[1.875rem] font-bold text-white tracking-[-0.03em] leading-tight">Featured Work</h2>
                <p className="text-[14px] md:text-[15px] text-white/40 leading-relaxed">
                  Production systems — research to deployment.
                </p>
              </div>

              <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tier1.map((project, i) => (
                  <ProjectCard key={project.slug} project={project} index={i} featured />
                ))}
              </StaggerGrid>
            </section>
          </ScrollReveal>

          {/* Tier 2: More Projects */}
          <ScrollReveal>
            <section className="space-y-10" aria-labelledby="more-heading">
              <div className="max-w-3xl mx-auto space-y-2.5">
                <h2 id="more-heading" className="text-[1.5rem] md:text-[1.875rem] font-bold text-white tracking-[-0.03em] leading-tight">More Projects</h2>
                <p className="text-[14px] md:text-[15px] text-white/40 leading-relaxed">
                  Full-stack, AI tooling, and data systems.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tier2.map((project, i) => (
                  <ProjectCard key={project.slug} project={project} index={i} />
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Tier 3: Personal Projects */}
          {tier3.length > 0 && (
            <ScrollReveal>
              <section className="space-y-8" aria-labelledby="personal-heading">
                <div className="flex items-center gap-4 max-w-3xl mx-auto">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.06]"></div>
                  <h2 id="personal-heading" className="text-xs font-medium uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">
                    Personal & Research
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.06]"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tier3.map((project, i) => (
                    <ProjectCard key={project.slug} project={project} index={i} />
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}
        </div>
      </main>
    </div>
  );
}
