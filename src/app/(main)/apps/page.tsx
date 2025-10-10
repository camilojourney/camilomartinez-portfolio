'use client'

import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import LiquidPage from '@/components/shared/liquid-page'

export default function AppsPage() {
  return (
    <LiquidPage currentPage="apps" backgroundVariant="purple">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
          Try My Apps
        </h1>
        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-12">
          Interactive applications and tools you can{' '}
          <span className="text-purple-400 font-semibold">use right now</span>.{' '}
          Real-time dashboards, AI-powered tools, and{' '}
          <span className="text-cyan-400 font-semibold">data visualizations</span>.
        </p>
      </section>

      {/* Apps Grid */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Fitness Dashboard */}
          <a href="/apps/fitness-dashboard" className="block">
            <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer border-white/10 hover:border-cyan-400/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">📊</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>

                <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-cyan-400 transition-colors duration-300">
                  Fitness Dashboard
                </h3>

                <p className="text-white/70 mb-6 flex-grow leading-relaxed text-lg">
                  Real-time WHOOP + Strava analytics with interactive visualizations. Daily strain, recovery trends, and performance insights.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Updated daily with latest data
                  </div>
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Interactive charts & heatmaps
                  </div>
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Performance metrics tracking
                  </div>
                </div>

                <div className="flex items-center text-cyan-400 font-semibold text-lg">
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>

                {/* Status indicator */}
                <div className="mt-4 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm text-green-400">Live & Updated Daily</span>
                </div>
              </div>
            </Card>
          </a>

          {/* Social Media Pipeline */}
          <a href="/apps/social-media-pipeline" className="block">
            <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer border-white/10 hover:border-purple-400/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">✨</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>

                <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors duration-300">
                  Social Media Pipeline
                </h3>

                <p className="text-white/70 mb-6 flex-grow leading-relaxed text-lg">
                  AI-powered content generator for social media. Transform ideas into optimized tweets, threads, and multi-language content.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Tweet & thread optimization
                  </div>
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                    English & Spanish support
                  </div>
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Instant content generation
                  </div>
                </div>

                <div className="flex items-center text-purple-400 font-semibold text-lg">
                  <span>Try Tool</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>

                {/* Status indicator */}
                <div className="mt-4 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm text-green-400">Live & Ready</span>
                </div>
              </div>
            </Card>
          </a>

          {/* Trading Bot */}
          <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 cursor-not-allowed border-white/10 hover:border-emerald-400/50 opacity-60">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">📈</span>
                </div>
                <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300" />
              </div>

              <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-emerald-400 transition-colors duration-300">
                Trading Bot
              </h3>

              <p className="text-white/70 mb-6 flex-grow leading-relaxed text-lg">
                Algorithmic trading platform with real-time market analysis, strategy backtesting, and risk management.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-white/60">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></span>
                  Real-time market data
                </div>
                <div className="flex items-center text-sm text-white/60">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Strategy backtesting engine
                </div>
                <div className="flex items-center text-sm text-white/60">
                  <span className="w-2 h-2 bg-teal-400 rounded-full mr-3"></span>
                  Advanced risk management
                </div>
              </div>

              <div className="flex items-center text-emerald-400/60 font-semibold text-lg">
                <span>Coming Soon</span>
              </div>

              {/* Status indicator */}
              <div className="mt-4 flex items-center">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-amber-400">In Development</span>
              </div>
            </div>
          </Card>

          {/* Think Clear */}
          <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 cursor-not-allowed border-white/10 hover:border-indigo-400/50 opacity-60">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🧠</span>
                </div>
                <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300" />
              </div>

              <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-indigo-400 transition-colors duration-300">
                Think Clear
              </h3>

              <p className="text-white/70 mb-6 flex-grow leading-relaxed text-lg">
                Cognitive bias detection tool powered by AI. Analyze decisions, identify thinking patterns, and make clearer choices.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-white/60">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></span>
                  Real-time bias detection
                </div>
                <div className="flex items-center text-sm text-white/60">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  Decision analysis framework
                </div>
                <div className="flex items-center text-sm text-white/60">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  AI-powered insights
                </div>
              </div>

              <div className="flex items-center text-indigo-400/60 font-semibold text-lg">
                <span>Coming Soon</span>
              </div>

              {/* Status indicator */}
              <div className="mt-4 flex items-center">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-amber-400">In Development</span>
              </div>
            </div>
          </Card>

        </div>
      </section>
    </LiquidPage>
  )
}
