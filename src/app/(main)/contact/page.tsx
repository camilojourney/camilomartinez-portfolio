"use client"

import LiquidNav from '@/components/shared/liquid-nav'

export default function ContactPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <LiquidNav currentPage="contact" />
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
                    <div className="text-center mb-20">
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
                            Get In Touch
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                            Ready to discuss your next{' '}
                            <span className="text-cyan-400 font-semibold">AI project</span> or{' '}
                            <span className="text-blue-400 font-semibold">data initiative</span>?{' '}
                            Let's connect and explore how we can work together.
                        </p>
                    </div>

                    {/* Contact Cards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                        {/* Contact Information Card */}
                        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500">
                            <div className="p-8">
                                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8">
                                    Contact Information
                                </h2>
                                
                                <div className="space-y-6">
                                    {/* Email */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Email</h3>
                                            <a 
                                                href="mailto:camilo@example.com" 
                                                className="text-white/70 hover:text-cyan-300 transition-colors duration-300"
                                            >
                                                camilo@example.com
                                            </a>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Location</h3>
                                            <p className="text-white/70">New York City, NY</p>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Phone</h3>
                                            <a 
                                                href="tel:+1234567890" 
                                                className="text-white/70 hover:text-green-300 transition-colors duration-300"
                                            >
                                                +1 (234) 567-8900
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Links Card */}
                        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500">
                            <div className="p-8">
                                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8">
                                    Professional Links
                                </h2>
                                
                                <div className="space-y-6">
                                    {/* LinkedIn */}
                                    <a 
                                        href="https://linkedin.com/in/camilo-martinez" 
                                        className="flex items-start gap-4 group hover:bg-white/[0.02] rounded-xl p-3 -m-3 transition-all duration-300"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-blue-300/40 transition-colors duration-300">
                                            <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                            </svg>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-medium group-hover:text-blue-300 transition-colors duration-300">LinkedIn</h3>
                                                <svg className="w-4 h-4 text-white/40 group-hover:text-blue-300/80 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </div>
                                            <p className="text-white/70 text-sm">Professional network & career updates</p>
                                        </div>
                                    </a>

                                    {/* GitHub */}
                                    <a 
                                        href="https://github.com/camilo-martinez" 
                                        className="flex items-start gap-4 group hover:bg-white/[0.02] rounded-xl p-3 -m-3 transition-all duration-300"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-400/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-gray-300/40 transition-colors duration-300">
                                            <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-medium group-hover:text-gray-300 transition-colors duration-300">GitHub</h3>
                                                <svg className="w-4 h-4 text-white/40 group-hover:text-gray-300/80 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </div>
                                            <p className="text-white/70 text-sm">Code repositories & open source projects</p>
                                        </div>
                                    </a>

                                    {/* Portfolio Website */}
                                    <a 
                                        href="https://camilomartinez.dev" 
                                        className="flex items-start gap-4 group hover:bg-white/[0.02] rounded-xl p-3 -m-3 transition-all duration-300"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-400/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-cyan-300/40 transition-colors duration-300">
                                            <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-medium group-hover:text-cyan-300 transition-colors duration-300">Portfolio</h3>
                                                <svg className="w-4 h-4 text-white/40 group-hover:text-cyan-300/80 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </div>
                                            <p className="text-white/70 text-sm">Complete portfolio & project showcase</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Availability Card */}
                    <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 max-w-4xl mx-auto">
                        <div className="p-8 text-center">
                            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">
                                Let's Work Together
                            </h2>
                            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                                I'm currently available for AI consulting projects, data analytics work, 
                                and full-stack development opportunities. Whether you're looking to build 
                                something new or optimize existing systems, I'd love to hear about your project.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="mailto:camilo@example.com?subject=Project%20Inquiry"
                                    className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/20"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>Send Email</span>
                                </a>
                                
                                <a
                                    href="https://linkedin.com/in/camilo-martinez"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-blue-400/30 hover:to-indigo-400/30 hover:border-blue-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
                                >
                                    <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                    <span>Connect on LinkedIn</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
