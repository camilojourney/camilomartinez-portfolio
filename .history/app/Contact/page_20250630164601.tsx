"use client"

export default function ContactPage() {
    return (
        <section className="fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-40">
            {/* Navigation overlay */}
            <div className="absolute top-0 left-0 w-full z-50 p-8">
                <nav className="flex space-x-6">
                    <a href="/" className="text-white hover:text-cyan-400 transition-colors">home</a>
                    <a href="/blog" className="text-white hover:text-cyan-400 transition-colors">blog</a>
                    <a href="/contact" className="text-white hover:text-cyan-400 transition-colors">contact</a>
                </nav>
            </div>
            
            {/* Animated background elements */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 animate-fade-in">
                            Let's Connect
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto mb-8 rounded-full"></div>
                        <p className="text-xl text-gray-300 leading-relaxed max-w-lg mx-auto animate-fade-in-delay">
                            Ready to build something extraordinary together? I'm always excited to discuss innovative projects and collaborate with ambitious teams.
                        </p>
                    </div>

                    {/* Contact Cards */}
                    <div className="space-y-6 mb-12">
                        {/* Email Card */}
                        <div className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                            <a
                                href="mailto:camilomartinez.ai@outlook.com?subject=I would like to connect with you&body=Hi Camilo,%0D%0A%0D%0AI would love to connect with you and discuss potential opportunities.%0D%0A%0D%0ABest regards"
                                className="relative flex items-center justify-center p-6 bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700 hover:border-cyan-400/50 transition-all duration-300 group-hover:scale-105"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">Send Email</p>
                                        <p className="text-cyan-400 font-mono">camilomartinez.ai@outlook.com</p>
                                    </div>
                                </div>
                            </a>
                        </div>

                        {/* Social Links */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* LinkedIn */}
                            <div className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                                <a
                                    href="https://www.linkedin.com/in/camilomartinez-ai/?utm_source=portfolio&utm_medium=contact&utm_campaign=connect"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative flex items-center justify-center p-4 bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700 hover:border-blue-400/50 transition-all duration-300 group-hover:scale-105"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                            </svg>
                                        </div>
                                        <span className="text-white font-semibold group-hover:text-blue-400 transition-colors">Connect on LinkedIn</span>
                                    </div>
                                </a>
                            </div>

                            {/* GitHub */}
                            <div className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                                <a
                                    href="https://github.com/camilomartinez777"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative flex items-center justify-center p-4 bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700 hover:border-purple-400/50 transition-all duration-300 group-hover:scale-105"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                            </svg>
                                        </div>
                                        <span className="text-white font-semibold group-hover:text-purple-400 transition-colors">GitHub</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="animate-fade-in-delay-2">
                        <p className="text-gray-400 mb-6">Based in the intersection of data and creativity</p>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Available for new opportunities</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
