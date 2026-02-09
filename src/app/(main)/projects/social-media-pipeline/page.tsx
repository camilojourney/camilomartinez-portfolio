'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Twitter, Hash, Copy, Zap, Globe, Play, MessageCircle, Heart, Share } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import StandardPage from '@/components/shared/standard-page'

export default function SocialMediaPipelineProjectPage() {
  const [activeExample, setActiveExample] = useState(0)

  const examples = [
    {
      title: "Personal Insight → Engaging Tweet",
      raw: "been thinking about this whole AI thing and honestly its kinda scary but also exciting like we're literally living through a revolution but most people don't realize it yet. the speed of change is insane",
      outputs: {
        tweet: "Been thinking about this whole AI thing.\n\nHonestly? It's scary but exciting.\n\nWe're literally living through a revolution, but most people don't realize it yet.\n\nThe speed of change is insane.",
        captions: [
          "🚀 We're living through an AI revolution\nMost people don't even realize it\nThe speed of change is unprecedented",
          "🤔 Sometimes the most profound changes\nhappen so gradually we barely notice\nUntil suddenly, everything is different",
          "❓ Are you aware you're witnessing history?\nHow has AI already changed your daily life?"
        ]
      }
    },
    {
      title: "Long Thought → Twitter Thread",
      raw: "I've been studying successful entrepreneurs for years and noticed something interesting. Most people think success comes from having the perfect idea or being the smartest person in the room. But that's not what I've observed. The entrepreneurs who actually make it have one thing in common: they're obsessed with solving real problems for real people. They don't fall in love with their solutions, they fall in love with the problems. This mindset shift changes everything about how you approach business.",
      outputs: {
        thread: [
          "I've studied successful entrepreneurs for years and noticed something counterintuitive:\n\nIt's not about having the perfect idea or being the smartest person.\n\nHere's what actually separates those who make it: 🧵",
          "1/ The entrepreneurs who succeed are obsessed with solving real problems for real people.\n\nThey don't fall in love with their solutions.",
          "2/ They fall in love with the problems.\n\nThis simple mindset shift changes everything about how you approach business.",
          "When you're obsessed with problems, you stay flexible with solutions.\n\nWhen you're obsessed with solutions, you become blind to better alternatives."
        ],
        reel: "🎬 ACT I: The Hook\nMost entrepreneurs get this backwards.\n\n💡 ACT II: Value Proposition\nStudying successful founders revealed a counterintuitive pattern.\n\n📚 ACT III: Key Content\nThe entrepreneurs who actually make it aren't obsessed with their solutions—they're obsessed with solving real problems for real people. They fall in love with the problems, not their answers. This mindset shift changes everything because when you're obsessed with problems, you stay flexible with solutions. When you're obsessed with solutions, you become blind to better alternatives.\n\n📢 ACT IV: Call-to-Action\nWhat problem are you obsessed with solving?"
      }
    },
    {
      title: "Technical Insight → Multi-Format Content",
      raw: "Just realized something about code reviews. Everyone talks about catching bugs but the real value is knowledge transfer. When a senior dev reviews junior code, both people learn. The junior learns better patterns, the senior learns about new approaches and different perspectives. It's not just quality control, it's collaborative learning.",
      outputs: {
        tweet: "Just realized something about code reviews.\n\nEveryone talks about catching bugs, but the real value is knowledge transfer.\n\nSenior devs learn new perspectives.\nJunior devs learn better patterns.\n\nIt's collaborative learning, not just quality control.",
        spanish: "Acabo de darme cuenta de algo sobre las revisiones de código.\n\nTodos hablan de encontrar errores, pero el verdadero valor es la transferencia de conocimiento.\n\nLos desarrolladores senior aprenden nuevas perspectivas.\nLos junior aprenden mejores patrones.\n\nEs aprendizaje colaborativo, no solo control de calidad.",
        reel: "🎬 ACT I: The Hook\nCode reviews aren't what you think.\n\n💡 ACT II: Value Proposition\nEveryone focuses on bug catching, but that's missing the point.\n\n📚 ACT III: Key Content\nThe real magic happens in knowledge transfer. When a senior developer reviews junior code, both people learn something valuable. The junior developer learns better patterns and practices. The senior developer learns about fresh approaches and different perspectives. It transforms from quality control into collaborative learning.\n\n📢 ACT IV: Call-to-Action\nWhat's the most valuable thing you've learned from a code review?"
      }
    }
  ]

  const active = examples[activeExample] ?? examples[0]
  if (!active) return null

  return (
    <StandardPage currentPage="projects" maxWidth="wide">
      <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent leading-tight">
          Social Media Pipeline
        </h1>
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
          AI-powered content transformation that preserves your authentic voice while maximizing engagement
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/apps/social-media-pipeline"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            <Zap className="w-5 h-5" />
            <span>View Live App</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/camilojourney/camilomartinez-portfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300"
          >
            <span>View Source</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl overflow-hidden mb-16">
        <div className="relative w-full h-64 md:h-80 bg-slate-950">
          <Image
            src="/images/previews_main/socia_media_creation.png"
            alt="Social media pipeline content generation preview"
            fill
            className="object-contain object-center md:scale-95 scale-95"
            priority
          />
        </div>
      </div>

      {/* The Problem & Solution */}
      <section className="mb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 border-red-400/20 bg-red-500/10">
            <h3 className="text-2xl font-bold text-red-300 mb-4">❌ The Problem</h3>
            <ul className="space-y-3 text-white/80">
              <li>• Authentic thoughts get lost in algorithm optimization</li>
              <li>• Content creators sacrifice their voice for engagement</li>
              <li>• Manual adaptation across platforms is time-consuming</li>
              <li>• Bilingual creators need separate content strategies</li>
            </ul>
          </Card>

          <Card className="p-8 border-green-400/20 bg-green-500/10">
            <h3 className="text-2xl font-bold text-green-300 mb-4">✅ The Solution</h3>
            <ul className="space-y-3 text-white/80">
              <li>• Preserve authentic voice while optimizing structure</li>
              <li>• Enhance clarity without changing personality</li>
              <li>• Generate multiple formats from one input</li>
              <li>• Automatic bilingual content with DeepL integration</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Live Examples */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          See the Transformation in Action
        </h2>

        {/* Example Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setActiveExample(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeExample === index
                  ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                  : 'bg-white/[0.05] text-white/60 border border-white/[0.15] hover:bg-white/[0.08]'
              }`}
            >
              {example.title}
            </button>
          ))}
        </div>

        {/* Active Example Display */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Input */}
            <Card className="p-6 border-white/10 bg-white/[0.03]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <span>📝</span>
                <span>Raw Input (Authentic)</span>
              </h3>
	              <div className="p-4 bg-white/[0.05] border border-white/[0.15] rounded-lg">
	                <p className="text-white/80 text-sm leading-relaxed italic">
	                  "{active.raw}"
	                </p>
	              </div>
	              <div className="mt-4 text-xs text-white/50">
	                Character count: {active.raw.length}
	              </div>
	            </Card>

	            {/* Outputs */}
            <Card className="p-6 border-white/10 bg-white/[0.03]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <span>✨</span>
                <span>AI-Enhanced Outputs</span>
              </h3>
              
	              <div className="space-y-4">
	                {/* Tweet/Thread Output */}
	                <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
	                  <h4 className="font-medium text-blue-300 mb-2 flex items-center space-x-2">
	                    {active.outputs.thread ? (
	                      <>
	                        <Hash className="w-4 h-4" />
	                        <span>Twitter Thread</span>
	                      </>
                    ) : (
                      <>
                        <Twitter className="w-4 h-4" />
                        <span>Optimized Tweet</span>
	                      </>
	                    )}
	                  </h4>
	                  <div className="text-white/90 text-sm space-y-2">
	                    {active.outputs.thread ? (
	                      active.outputs.thread.map((tweet, i) => (
	                        <div key={i} className="p-2 bg-black/20 rounded border-l-2 border-blue-400/50">
	                          {tweet}
	                        </div>
	                      ))
	                    ) : (
	                      <div className="p-2 bg-black/20 rounded border-l-2 border-blue-400/50">
	                        {active.outputs.tweet}
	                      </div>
	                    )}
	                  </div>
	                </div>

	                {/* Reel Script */}
	                {active.outputs.reel && (
	                  <div className="p-4 bg-purple-500/10 border border-purple-400/20 rounded-lg">
	                    <h4 className="font-medium text-purple-300 mb-2 flex items-center space-x-2">
	                      <Play className="w-4 h-4" />
	                      <span>Instagram Reel Script</span>
	                    </h4>
	                    <div className="text-white/90 text-sm">
	                      <pre className="whitespace-pre-wrap font-sans">
	                        {active.outputs.reel}
	                      </pre>
	                    </div>
	                  </div>
	                )}

                {/* Captions */}
                <div className="p-4 bg-green-500/10 border border-green-400/20 rounded-lg">
	                  <h4 className="font-medium text-green-300 mb-2 flex items-center space-x-2">
	                    <MessageCircle className="w-4 h-4" />
	                    <span>Caption Variations</span>
	                  </h4>
	                  <div className="space-y-2 text-white/90 text-sm">
	                    {active.outputs.captions?.map((caption, i) => (
	                      <div key={i} className="p-2 bg-black/20 rounded">
	                        <span className="text-green-400 font-medium">Option {i + 1}: </span>
	                        {caption}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spanish Translation (if available) */}
                {active.outputs.spanish && (
                  <div className="p-4 bg-orange-500/10 border border-orange-400/20 rounded-lg">
                    <h4 className="font-medium text-orange-300 mb-2 flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Spanish Translation</span>
                    </h4>
                    <div className="text-white/90 text-sm p-2 bg-black/20 rounded">
                      {active.outputs.spanish}
                    </div>
                  </div>
                )}
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Technical Features
        </h2>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Card className="p-6 text-center border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Mode Detection</h3>
            <p className="text-white/60 text-sm">
              Automatically switches between tweet mode (&le;280 chars) and thread mode (&gt;280 chars)
            </p>
          </Card>

          <Card className="p-6 text-center border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Format Generation</h3>
            <p className="text-white/60 text-sm">
              Creates tweets, threads, reel scripts, and captions from a single input
            </p>
          </Card>

          <Card className="p-6 text-center border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Bilingual Support</h3>
            <p className="text-white/60 text-sm">
              DeepL integration for high-quality Spanish translations
            </p>
          </Card>

          <Card className="p-6 text-center border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Voice Preservation</h3>
            <p className="text-white/60 text-sm">
              Advanced prompts ensure your authentic voice and tone remain intact
            </p>
          </Card>

          <Card className="p-6 text-center border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Copy className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">One-Click Actions</h3>
            <p className="text-white/60 text-sm">
              Copy content or share directly to social platforms with a single click
            </p>
          </Card>

          <Card className="p-6 text-center border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Share className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Platform Optimization</h3>
            <p className="text-white/60 text-sm">
              Content optimized for Twitter/X, Instagram, and other social platforms
            </p>
          </Card>

        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Built With
        </h2>

        <div className="max-w-4xl mx-auto">
          <Card className="p-8 border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">Next</span>
                </div>
                <h4 className="text-white font-medium">Next.js 13</h4>
                <p className="text-white/60 text-sm">React Framework</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">AI</span>
                </div>
                <h4 className="text-white font-medium">OpenAI GPT</h4>
                <p className="text-white/60 text-sm">Content Processing</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">DL</span>
                </div>
                <h4 className="text-white font-medium">DeepL API</h4>
                <p className="text-white/60 text-sm">Translation</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">TS</span>
                </div>
                <h4 className="text-white font-medium">TypeScript</h4>
                <p className="text-white/60 text-sm">Type Safety</p>
              </div>

            </div>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <Card className="p-12 border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Amplify Your Authentic Voice?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Transform your thoughts into engaging content while preserving what makes you unique.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apps/social-media-pipeline"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <Zap className="w-5 h-5" />
              <span>View Live App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/docs/social-media-pipeline-implementation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300"
            >
              <span>📖</span>
              <span>Read the Technical Story</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="text-white/60 text-sm mt-4">
            Want to see how this was built? Check out the complete technical documentation with code examples and implementation details.
          </p>
        </Card>
      </section>
      </div>
    </StandardPage>
  )
}
