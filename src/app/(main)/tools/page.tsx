'use client'

import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import LiquidPage from '@/components/shared/liquid-page'

export default function ToolsPage() {
  return (
    <LiquidPage currentPage="tools" backgroundVariant="purple">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
          AI-Powered Tools
        </h1>
        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-12">
          Intelligent content creation and productivity tools powered by{' '}
          <span className="text-purple-400 font-semibold">advanced AI models</span> and{' '}
          <span className="text-pink-400 font-semibold">proven systems</span>.
        </p>
      </section>

      {/* Tools Grid */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Social Media Pipeline */}
          <a href="/tools/social-media-pipeline" className="block">
            <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer border-white/10 hover:border-purple-400/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors duration-300">
                  Social Media Pipeline
                </h3>
                
                <p className="text-white/70 mb-6 flex-grow leading-relaxed text-lg">
                  Transform any thought into polished social media content. 
                  Intelligent content optimization for Twitter/X and Threads with automatic thread creation.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Short thoughts → Refined tweets
                  </div>
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                    Long content → Thread creation
                  </div>
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Multi-platform optimization
                  </div>
                </div>
                
                <div className="flex items-center text-purple-400 font-semibold text-lg">
                  <span>Launch Pipeline</span>
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

          {/* Productivity System */}
          <a href="https://camilomartinez.notion.site/Management-253e98e30a3080cd84acca32ff86621a?pvs=74" target="_blank" rel="noopener noreferrer" className="block">
            <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer border-white/10 hover:border-emerald-400/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">✅</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-emerald-400 transition-colors duration-300">
                  Signal-Based Productivity
                </h3>
                
                <p className="text-white/70 mb-6 flex-grow leading-relaxed text-lg">
                  Battle-tested productivity system built on Ivy Lee's method. 
                  Clarity, focus, and execution for teams or solo work.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></span>
                    TASK IVY LEE → Daily execution
                  </div>
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    FRONTLINES → Strategic projects
                  </div>
                  <div className="flex items-center text-sm text-white/60">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Notion templates included
                  </div>
                </div>
                
                <div className="flex items-center text-emerald-400 font-semibold text-lg">
                  <span>Get Templates Free</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                {/* Status indicator */}
                <div className="mt-4 flex items-center">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                  <span className="text-sm text-emerald-400">Proven System</span>
                </div>
              </div>
            </Card>
          </a>

        </div>
      </section>
    </LiquidPage>
  )
}