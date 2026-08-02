'use client';

import { Card } from '@/components/ui/Card';
import LiquidNav from '@/components/shared/liquid-nav';
import ScrollReveal from '@/components/shared/scroll-reveal';
import { ArrowRight } from 'lucide-react';
import Chat from './chat';

const timeline = [
    {
        year: '2018',
        title: 'Petroleum Engineering, Colombia',
        description: 'Graduated. Learned to think in systems, constraints, and optimization under pressure.',
        color: 'from-amber-400 to-orange-500',
        dot: 'bg-amber-400',
    },
    {
        year: '2022',
        title: 'NYC -- MS Business Analytics, Baruch',
        description: 'Moved to New York with no safety net. Bartended four nights a week. Built ML projects every other waking hour.',
        color: 'from-blue-400 to-indigo-500',
        dot: 'bg-blue-400',
    },
    {
        year: '2023',
        title: 'Invoz.ai -- From Papers to Production',
        description: 'Read 46 research papers. Built a speech ML pipeline that scores pronunciation across 11 dimensions. First time I felt like a real engineer.',
        color: 'from-cyan-400 to-blue-500',
        dot: 'bg-cyan-400',
    },
    {
        year: '2024',
        title: 'Holus -- The Systems Problem',
        description: '32 autonomous agents. Redis pub/sub. Silo isolation. Proved to myself that the hard part of AI is not the model -- it is everything around it.',
        color: 'from-purple-400 to-violet-500',
        dot: 'bg-purple-400',
    },
    {
        year: 'Now',
        title: '10+ Production Systems, Still Hungry',
        description: 'Shipping audio ML, agent infrastructure, and full-stack applications from Queens. Looking for a team that builds things that matter.',
        color: 'from-emerald-400 to-teal-500',
        dot: 'bg-emerald-400',
    },
];

const skills = [
    {
        title: 'Audio/Speech ML',
        description: 'Whisper, wav2vec2, Parselmouth, Silero VAD. I built a production pronunciation scoring system -- not a wrapper around an API.',
        gradient: 'from-cyan-500/20 to-blue-500/20',
        border: 'border-cyan-400/20',
        icon: (
            <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
        ),
    },
    {
        title: 'Multi-Agent Systems',
        description: 'LangGraph orchestration, Redis event bus, health preflight, observability, silo isolation. I think about agent reliability the way SREs think about uptime.',
        gradient: 'from-blue-500/20 to-indigo-500/20',
        border: 'border-blue-400/20',
        icon: (
            <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        ),
    },
    {
        title: 'Full-Stack & Data',
        description: 'TypeScript, Next.js, FastAPI, PostgreSQL, Redis. I build the entire stack because waiting for someone else to unblock you is a luxury early-stage does not have.',
        gradient: 'from-purple-500/20 to-pink-500/20',
        border: 'border-purple-400/20',
        icon: (
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
        ),
    },
    {
        title: 'Business-Aware Engineering',
        description: 'MS in Business Analytics means I think about cost-per-inference and unit economics at the architecture stage. Not after launch.',
        gradient: 'from-emerald-500/20 to-teal-500/20',
        border: 'border-emerald-400/20',
        icon: (
            <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        ),
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <LiquidNav currentPage="about" />

            {/* Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[#050810]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-[#080d1c] to-[#050810]"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-30">
                    <div className="absolute top-[15%] left-[10%] w-[600px] h-[600px] bg-blue-600/[0.04] rounded-full blur-[160px]"></div>
                    <div className="absolute top-[50%] right-[5%] w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-[140px]"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-32 md:pt-44 px-5 md:px-8 pb-24">
                <div className="max-w-4xl mx-auto">

                    {/* Hero Section */}
                    <div className="text-center mb-24">
                        <div className="hero-stagger hero-stagger-1 flex items-center justify-center gap-4 mb-6">
                            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20"></div>
                            <p className="text-[13px] font-medium tracking-[0.3em] uppercase text-white/30">
                                The person behind the systems
                            </p>
                            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20"></div>
                        </div>
                        <h1 className="hero-stagger hero-stagger-2 text-[2.75rem] md:text-[4rem] lg:text-[5rem] font-bold mb-7 leading-[1.02] tracking-[-0.04em]">
                            <span className="text-white">About</span>{' '}
                            <span className="hero-gradient-text">Camilo</span>
                        </h1>
                        <p className="hero-stagger hero-stagger-3 text-[17px] md:text-[19px] text-white/45 max-w-xl mx-auto leading-[1.75]">
                            Applied AI Engineer. Immigrant. Runner. I build things that work and I do not stop until they ship.
                        </p>
                    </div>

                    {/* Story Section -- authentic, not corporate */}
                    <ScrollReveal>
                    <Card className="border-white/[0.08] bg-white/[0.02] mb-16 rounded-2xl">
                        <div className="p-8 md:p-12">
                            <h2 className="text-[1.5rem] md:text-[1.75rem] font-bold text-white mb-8 tracking-[-0.02em]">The Real Version</h2>
                            <div className="space-y-5 text-white/60 leading-[1.8] text-[16px]">
                                <p>
                                    I studied petroleum engineering in Colombia. Good at it, but knew I wanted something different. Moved to New York with a plan: get a master&apos;s degree, learn to build software, figure out the rest later.
                                </p>
                                <p>
                                    &ldquo;Figure out the rest later&rdquo; turned out to mean bartending four nights a week at a cocktail bar in Manhattan while taking a full course load at Baruch. The other hours went to building things. Not tutorials. Not demos. <span className="text-white/90 font-medium">Actual applications that real people use.</span>
                                </p>
                                <p>
                                    The project that changed everything was <span className="text-cyan-400 font-medium">Invoz</span>. I wanted to build a speech scoring system, so I read 46 research papers on audio processing and taught myself signal processing from scratch. That project became an 11-dimension pronunciation scorer running Whisper, wav2vec2, Parselmouth, and Silero VAD in production. It taught me that going genuinely deep on a hard problem is more valuable than being broadly familiar with easy ones.
                                </p>
                                <p>
                                    Then I built <span className="text-blue-400 font-medium">Holus</span> -- a 32-agent autonomous system with Redis pub/sub, silo isolation, guardrails, and self-improvement loops. That project confirmed what I suspected: <span className="text-white/80 font-medium">the hard problems in AI are not the models. They are the systems around them.</span> Orchestration, reliability, observability, failure recovery -- the stuff that does not make good Twitter threads but determines whether your system works at 3 AM.
                                </p>
                                <p className="text-white/50">
                                    I have shipped 10+ production systems and counting. I run 5 days a week, I am trying to hit every street in Astoria, and I am looking for a team where the bar is high and the problems are real.
                                </p>
                            </div>
                        </div>
                    </Card>
                    </ScrollReveal>

                    {/* Visual break */}
                    <div className="mb-16">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"></div>
                    </div>

                    {/* Visual Timeline */}
                    <ScrollReveal>
                    <div className="mb-16">
                        <h2 className="text-[1.5rem] md:text-[1.75rem] font-bold text-white mb-10 tracking-[-0.02em]">Timeline</h2>
                        <div className="relative">
                            <div className="absolute left-[19px] md:left-[23px] top-2 bottom-2 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

                            <div className="space-y-10">
                                {timeline.map((item, i) => (
                                    <div key={i} className="relative flex gap-5 md:gap-6 group">
                                        <div className="relative z-10 flex-shrink-0 mt-1.5">
                                            <div className={`w-[10px] h-[10px] md:w-3 md:h-3 rounded-full ${item.dot} ring-4 ring-[#050810] group-hover:ring-[#0a0f1c] transition-all duration-300 shadow-[0_0_8px_currentColor]`} />
                                        </div>
                                        <div className="flex-1 pb-2">
                                            <div className="flex items-baseline gap-3 mb-2">
                                                <span className={`text-sm font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                                                    {item.year}
                                                </span>
                                                <h3 className="text-white font-semibold text-[15px]">{item.title}</h3>
                                            </div>
                                            <p className="text-white/45 text-sm leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    </ScrollReveal>

                    {/* Visual break */}
                    <div className="mb-16">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"></div>
                    </div>

                    {/* Skills Grid */}
                    <ScrollReveal>
                    <div className="mb-16">
                        <h2 className="text-[1.5rem] md:text-[1.75rem] font-bold text-white mb-10 tracking-[-0.02em]">What I Build With</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {skills.map((skill) => (
                                <Card key={skill.title} className="border-white/[0.08] bg-white/[0.02] rounded-2xl group hover:border-white/[0.16] hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-0.5">
                                    <div className="p-7">
                                        <div className={`w-10 h-10 bg-gradient-to-br ${skill.gradient} border ${skill.border} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                            {skill.icon}
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-3">{skill.title}</h3>
                                        <p className="text-white/50 text-sm leading-relaxed">
                                            {skill.description}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                    </ScrollReveal>

                    {/* Visual break */}
                    <div className="mb-16">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"></div>
                    </div>

                    {/* Values Section */}
                    <ScrollReveal>
                    <Card className="border-white/[0.08] bg-white/[0.02] mb-16 rounded-2xl">
                        <div className="p-8 md:p-12">
                            <h2 className="text-[1.5rem] md:text-[1.75rem] font-bold text-white mb-10 tracking-[-0.02em]">How I Work</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {[
                                    { n: '01', title: 'Systems over motivation', desc: 'I do not rely on feeling motivated. I build structures that produce output regardless -- automated pipelines, daily commits, public accountability.' },
                                    { n: '02', title: 'Depth over breadth', desc: '46 papers for one feature. 32 agents for one system. I would rather master one hard problem than skim ten easy ones.' },
                                    { n: '03', title: 'Ship then measure', desc: 'Working software is the only credible argument. I ship first, measure impact, then iterate based on what actually happened -- not what I imagined would happen.' },
                                    { n: '04', title: 'Honest about gaps', desc: 'I do not perform expertise I do not have. If I do not know something, I say so, then I go learn it. That is faster than pretending.' },
                                ].map((v) => (
                                    <div key={v.n} className="flex gap-4 group">
                                        <span className="text-cyan-400/40 font-mono text-sm mt-1 group-hover:text-cyan-400/70 transition-colors">{v.n}</span>
                                        <div>
                                            <p className="text-white font-semibold mb-1.5">{v.title}</p>
                                            <p className="text-white/40 text-sm leading-relaxed">{v.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                    </ScrollReveal>

                    {/* Visual break */}
                    <div className="mb-16">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"></div>
                    </div>

                    {/* Chat Widget */}
                    <ScrollReveal>
                    <div className="mb-16">
                        <div className="text-center mb-8">
                            <h2 className="text-[1.5rem] md:text-[1.75rem] font-bold text-white mb-3 tracking-[-0.02em]">Ask Me Anything</h2>
                            <p className="text-white/40 text-[15px]">An AI that knows my background. Try it.</p>
                        </div>
                        <Card className="border-white/[0.08] bg-white/[0.02] rounded-2xl overflow-hidden">
                            <Chat />
                        </Card>
                    </div>
                    </ScrollReveal>

                    {/* CTA */}
                    <ScrollReveal>
                    <div className="text-center">
                        <p className="text-white/40 text-[17px] mb-8 leading-relaxed max-w-md mx-auto">
                            Looking for Applied AI Engineer roles. Available now. Based in NYC.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
                            <a
                                href="mailto:juancamilomabe@gmail.com?subject=AI%20Engineer%20Opportunity"
                                className="group/cta inline-flex items-center justify-center gap-2.5 bg-white text-black text-[15px] font-semibold px-8 py-3.5 rounded-full hover:bg-white/95 transition-all duration-300 shadow-[0_0_24px_rgba(255,255,255,0.06)] hover:shadow-[0_0_48px_rgba(255,255,255,0.12)] hover:scale-[1.02]"
                            >
                                <span>Send Email</span>
                                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-0.5" />
                            </a>
                            <a
                                href="https://www.linkedin.com/in/camilomartinez-ai/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2.5 bg-white/[0.04] border border-white/[0.08] text-white/55 text-[15px] font-medium px-8 py-3.5 rounded-full hover:bg-white/[0.08] hover:text-white/80 hover:border-white/[0.16] transition-all duration-300"
                            >
                                <span>Connect on LinkedIn</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                    </ScrollReveal>
                </div>
            </div>
        </div>
    )
}
