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
          Resources & Templates
        </h1>
        <p className="text-xl md:text-2xl text-foreground max-w-3xl mx-auto leading-relaxed mb-12">
          Curated learning resources, productivity templates, and valuable insights from{' '}
          <span className="text-purple-400 font-semibold">books</span>,{' '}
          <span className="text-pink-400 font-semibold">systems</span>, and{' '}
          <span className="text-cyan-400 font-semibold">proven frameworks</span>.
        </p>
      </section>

      {/* Resources Grid */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Productivity System Template */}
          <a href="https://camilomartinez.notion.site/Management-253e98e30a3080cd84acca32ff86621a?pvs=74" target="_blank" rel="noopener noreferrer" className="block">
            <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer border-white/10 hover:border-emerald-400/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">✅</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <h3 className="text-3xl font-bold mb-4 text-foreground group-hover:text-emerald-400 transition-colors duration-300">
                  Signal-Based Productivity
                </h3>
                
                <p className="text-muted-foreground mb-6 flex-grow leading-relaxed text-lg">
                  Battle-tested productivity system built on Ivy Lee's method. 
                  Clarity, focus, and execution for teams or solo work.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></span>
                    TASK IVY LEE → Daily execution
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    FRONTLINES → Strategic projects
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
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
                  <span className="text-sm text-emerald-400">Free Template</span>
                </div>
              </div>
            </Card>
          </a>

          {/* Book Recommendations */}
          <a href="/bookshelf" className="block">
            <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer border-white/10 hover:border-amber-400/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">📚</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <h3 className="text-3xl font-bold mb-4 text-foreground group-hover:text-amber-400 transition-colors duration-300">
                  My Bookshelf
                </h3>
                
                <p className="text-muted-foreground mb-6 flex-grow leading-relaxed text-lg">
                  Curated collection of must-read books on AI, data science, systems thinking, and personal development. 
                  Books that shaped my thinking and approach to problem-solving.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                    Technical deep dives
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                    Systems & frameworks
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                    Personal growth
                  </div>
                </div>
                
                <div className="flex items-center text-amber-400 font-semibold text-lg">
                  <span>Browse Books</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                {/* Status indicator */}
                <div className="mt-4 flex items-center">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                  <span className="text-sm text-amber-400">12 Books</span>
                </div>
              </div>
            </Card>
          </a>

          {/* Learning Resources - Placeholder */}
          <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 border-white/10 hover:border-blue-400/50">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🎓</span>
                </div>
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-foreground group-hover:text-blue-400 transition-colors duration-300">
                Learning Frameworks
              </h3>
              
              <p className="text-muted-foreground mb-6 flex-grow leading-relaxed text-lg">
                Proven learning frameworks and mental models from Notion. 
                Templates and systems for effective learning, note-taking, and knowledge management.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Learning systems
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                  Mental models
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  Notion templates
                </div>
              </div>
              
              <div className="flex items-center text-blue-400 font-semibold text-lg">
                <span>Coming Soon</span>
              </div>
              
              {/* Status indicator */}
              <div className="mt-4 flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-blue-400">In Progress</span>
              </div>
            </div>
          </Card>

          {/* Valuable Insights - Placeholder */}
          <Card className="group hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 border-white/10 hover:border-purple-400/50">
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">💡</span>
                </div>
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-foreground group-hover:text-purple-400 transition-colors duration-300">
                Insights & Essays
              </h3>
              
              <p className="text-muted-foreground mb-6 flex-grow leading-relaxed text-lg">
                Collection of valuable insights, essays, and thought pieces on technology, AI, 
                and building systems. Lessons learned from real projects and experiences.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  Technical insights
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                  Project retrospectives
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-fuchsia-400 rounded-full mr-3"></span>
                  Lessons learned
                </div>
              </div>
              
              <div className="flex items-center text-purple-400 font-semibold text-lg">
                <span>Coming Soon</span>
              </div>
              
              {/* Status indicator */}
              <div className="mt-4 flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-purple-400">In Progress</span>
              </div>
            </div>
          </Card>

        </div>
      </section>
    </LiquidPage>
  )
}