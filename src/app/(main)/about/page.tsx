'use client';

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import LiquidNav from '@/components/shared/liquid-nav'
import Chat from './chat'

export default function AboutPage() {
    const [showChat, setShowChat] = useState(false)

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
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
                            About Me
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                            AI engineer with an MSBA, building production ML systems and data pipelines.{' '}
                            <span className="text-cyan-400 font-semibold">Ask the AI assistant</span>{' '}
                            anything about my experience, approach, or technical background.
                        </p>
                    </div>

                    {/* Main Chat Card */}
                    <Card className="border-white/10 max-w-6xl mx-auto mb-16">
                        <div className="p-8">
                            {/* Ask Questions Button or Chat Component */}
                            <div className="relative">
                                {!showChat ? (
                                    <div className="text-center mb-12">
                                        <button
                                            onClick={() => setShowChat(true)}
                                            className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <svg className="w-6 h-6 text-cyan-300 group-hover:text-cyan-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                Ask me questions
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className={`transition-all duration-700 ease-out ${showChat ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
                                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 mb-8">
                                            {/* Chat Header */}
                                            <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                                                    <span className="text-white/80 text-sm font-medium">AI Assistant Active</span>
                                                </div>
                                                <button
                                                    onClick={() => setShowChat(false)}
                                                    className="bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white/90 hover:bg-white/[0.08] p-2 rounded-xl transition-all duration-300 hover:scale-105"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <Chat />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Quick info cards */}
                    {!showChat && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-white/10">
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-300/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">Try asking about</h3>
                                    <p className="text-white/70 text-sm">"Tell me about your technical skills"</p>
                                </div>
                            </Card>

                            <Card className="border-white/10">
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 border border-purple-300/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">Or explore</h3>
                                    <p className="text-white/70 text-sm">"What's your story?"</p>
                                </div>
                            </Card>

                            <Card className="border-white/10">
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-300/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">Learn about</h3>
                                    <p className="text-white/70 text-sm">"What are your soft skills?"</p>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
