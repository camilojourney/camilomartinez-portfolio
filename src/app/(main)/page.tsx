import { Chatbot } from '@/components/features/Chatbot'
import { Card } from '@/components/ui/Card'
import { ArrowRight } from 'lucide-react'
import LiquidNav from '@/components/shared/liquid-nav'

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="home" />
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
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
            Building Intelligent Systems with Data
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-12">
            An AI Engineer and Data Analyst (MSBA) specializing in{' '}
            <span className="text-cyan-400 font-semibold">NLP</span>,{' '}
            <span className="text-blue-400 font-semibold">RAG systems</span>, and{' '}
            <span className="text-purple-400 font-semibold">data pipeline engineering</span>.
          </p>
        </div>

        {/* Featured Dashboards Section */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white/95">
            Explore My Work
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Live Fitness Data Pipeline */}
            <a href="/my-data" className="block">
              <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer border-white/10 hover:border-cyan-400/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📊</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-cyan-400 transition-colors duration-300">
                  Live Fitness Data Pipeline
                </h3>
                
                <p className="text-white/70 mb-6 flex-grow leading-relaxed">
                  Real-time workout heatmaps and recovery analytics powered by WHOOP API integration. 
                  See my daily training patterns and performance metrics visualized in interactive charts.
                </p>
                
                <div className="flex items-center text-cyan-400 font-semibold">
                  <span>View Live Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                {/* Preview visualization hint */}
                  <div className="mt-4 h-2 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-500/20 rounded-full group-hover:from-cyan-400/40 group-hover:via-blue-500/40 group-hover:to-purple-500/40 transition-all duration-300"></div>
                </div>
              </Card>
            </a>            {/* The Astoria Conquest */}
            <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 cursor-pointer border-white/10 hover:border-green-400/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-400 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🗺️</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-green-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-green-400 transition-colors duration-300">
                  A Live Geospatial Goal
                </h3>
                
                <p className="text-white/70 mb-6 flex-grow leading-relaxed">
                  Interactive map tracking my mission to run every street in Astoria, Queens. 
                  Real-time progress updates with geospatial data processing and route visualization.
                </p>
                
                <div className="flex items-center text-green-400 font-semibold">
                  <span>Explore The Map</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                {/* Map progress indicator */}
                <div className="mt-4 flex items-center">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-green-400 to-teal-500 rounded-full group-hover:animate-pulse"></div>
                  </div>
                  <span className="ml-3 text-sm text-white/60 group-hover:text-green-400 transition-colors duration-300">78% Complete</span>
                </div>
              </div>
            </Card>

            {/* AI Content Engine */}
            <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer border-white/10 hover:border-purple-400/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors duration-300">
                  Generative AI in Action
                </h3>
                
                <p className="text-white/70 mb-6 flex-grow leading-relaxed">
                  Interactive content generation engine powered by advanced LLMs. 
                  Create multi-platform content from a single idea with intelligent prompt chaining.
                </p>
                
                <div className="flex items-center text-purple-400 font-semibold">
                  <span>Try The Demo</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                {/* AI animation hint */}
                <div className="mt-4 flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* AI Chatbot - Positioned closer to cards */}
        <div className="mt-8">
          <Chatbot />
        </div>
      </div>
    </div>
  )
}
