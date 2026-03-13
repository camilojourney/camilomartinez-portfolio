'use client';

import { Card } from '@/components/ui/Card';
import LiquidNav from '@/components/shared/liquid-nav';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <LiquidNav currentPage="about" />
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
                            About Me
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                            Applied AI Engineer specializing in{' '}
                            <span className="text-cyan-400 font-semibold">audio/speech ML</span> and{' '}
                            <span className="text-blue-400 font-semibold">multi-agent systems</span>.
                        </p>
                    </div>

                    {/* Story Section */}
                    <Card className="border-white/10 mb-8">
                        <div className="p-8 md:p-10">
                            <h2 className="text-2xl font-semibold text-white mb-6">The Journey</h2>
                            <div className="space-y-4 text-white/70 leading-relaxed">
                                <p>
                                    I started in petroleum engineering in Colombia, where I built the analytical rigor that shapes how I think about systems today. Moved to New York City and pivoted to data, pursuing a Master of Science in Business Analytics at Baruch College (CUNY).
                                </p>
                                <p>
                                    While bartending four nights a week to fund my education, I started building AI applications full-time during the day. Not demos or tutorials, but real production systems. Ten of them and counting.
                                </p>
                                <p>
                                    The turning point was Invoz.ai. I read 46 research papers on speech processing and built a production pipeline that scores spoken English across 11 dimensions using Whisper, wav2vec2, Parselmouth, and Silero VAD. That project taught me what it means to go deep on a problem, and it became my engineering identity.
                                </p>
                                <p>
                                    Then came Holus: a federated multi-agent orchestrator with Redis pub/sub, silo isolation, guardrails, and self-improvement loops. Building agent infrastructure taught me that the hard problems in AI are not the models but the systems around them.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Skills Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <Card className="border-white/10">
                            <div className="p-8">
                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 rounded-xl flex items-center justify-center mb-5">
                                    <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-3">Audio/Speech ML</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Whisper, wav2vec2, Parselmouth, Silero VAD. Pronunciation scoring, prosody analysis, phoneme alignment. 11-dimension SQI scoring with $10.65 margin per session.
                                </p>
                            </div>
                        </Card>

                        <Card className="border-white/10">
                            <div className="p-8">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/20 rounded-xl flex items-center justify-center mb-5">
                                    <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-3">Multi-Agent Systems</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    LangGraph orchestration, Redis pub/sub event bus, guardrails, health preflight, observability dashboards, silo isolation, self-improvement loops.
                                </p>
                            </div>
                        </Card>

                        <Card className="border-white/10">
                            <div className="p-8">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/20 rounded-xl flex items-center justify-center mb-5">
                                    <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-3">Full-Stack & Data</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    TypeScript, Next.js, React, FastAPI, PostgreSQL, Redis. Real-time data pipelines, WHOOP/Strava integrations, production deployments.
                                </p>
                            </div>
                        </Card>

                        <Card className="border-white/10">
                            <div className="p-8">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/20 rounded-xl flex items-center justify-center mb-5">
                                    <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-3">Business-Aware AI</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Business analytics background means I think about unit economics, pricing models, and cost-per-inference at the architecture stage, not after.
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Values Section */}
                    <Card className="border-white/10 mb-8">
                        <div className="p-8 md:p-10">
                            <h2 className="text-2xl font-semibold text-white mb-6">How I Work</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex gap-3">
                                    <span className="text-cyan-400 font-bold text-lg mt-0.5">1</span>
                                    <div>
                                        <p className="text-white font-medium">Systems over motivation</p>
                                        <p className="text-white/50 text-sm">Structures work, willpower doesn&apos;t.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-cyan-400 font-bold text-lg mt-0.5">2</span>
                                    <div>
                                        <p className="text-white font-medium">Truth over comfort</p>
                                        <p className="text-white/50 text-sm">Honest self-assessment, no self-deception.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-cyan-400 font-bold text-lg mt-0.5">3</span>
                                    <div>
                                        <p className="text-white font-medium">One thing at a time</p>
                                        <p className="text-white/50 text-sm">Depth beats breadth. Every time.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-cyan-400 font-bold text-lg mt-0.5">4</span>
                                    <div>
                                        <p className="text-white font-medium">Ship then measure</p>
                                        <p className="text-white/50 text-sm">Output is the proof. No performing.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* CTA */}
                    <div className="text-center">
                        <p className="text-white/60 text-lg mb-6">
                            Actively seeking Applied AI Engineer roles. Available immediately.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="mailto:juancamilomabe@gmail.com?subject=AI%20Engineer%20Opportunity"
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/20"
                            >
                                <span>Send Email</span>
                                <ArrowRight className="w-5 h-5" />
                            </a>
                            <a
                                href="https://www.linkedin.com/in/camilomartinez-ai/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-blue-400/30 hover:to-indigo-400/30 hover:border-blue-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
                            >
                                <span>Connect on LinkedIn</span>
                                <ArrowRight className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
