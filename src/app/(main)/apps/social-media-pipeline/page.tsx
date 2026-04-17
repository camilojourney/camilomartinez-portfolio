'use client'

import { useState } from 'react'
import { ArrowLeft, Copy, Zap, Sparkles, Twitter, Hash, MessageCircle, Linkedin, Instagram, Facebook, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import LiquidNav from '@/components/shared/liquid-nav'
import type { LucideIcon } from 'lucide-react'

interface Platform {
  key: string
  label: string
  icon: LucideIcon
}

const platforms: Platform[] = [
  { key: 'x-post', label: 'X Post', icon: Twitter },
  { key: 'x-thread', label: 'X Thread', icon: Hash },
  { key: 'threads', label: 'Threads', icon: MessageCircle },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
]

const examples = [
  "Just launched my AI tool after 6 months of building. Feeling excited and exhausted.",
  "Most people use AI like a search engine. The ones treating it like a thinking partner are 10x ahead.",
  "Hot take: most AI engineers are just prompt wrappers. Real AI engineering is evals, pipelines, determinism."
]

interface Result {
  platform: string
  content: string
}

export default function SocialMediaPipelinePage() {
  const [thought, setThought] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)

  const handleTogglePlatform = (key: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  const handleGenerate = async () => {
    if (!thought.trim() || selectedPlatforms.length === 0) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const res = await fetch('/api/tools/social-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thought: thought.trim(), platforms: selectedPlatforms })
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText)
      }

      const data = await res.json()
      setResults(data.results || [])
    } catch (e: any) {
      setError(e.message || 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (platform: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedPlatform(platform)
      setTimeout(() => setCopiedPlatform(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const getPlatformInfo = (key: string) => platforms.find(p => p.key === key)

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="apps" />
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-pink-900/30 animate-gradient-xy"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>

      <div className="relative pt-24 md:pt-32 px-4 md:px-6 pb-20">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-7xl mx-auto mb-6"
        >
          <Link
            href="/apps"
            className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Apps</span>
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-16 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Multi-Platform Generator</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
            Social Media Pipeline
          </h1>
          <p className="text-xl md:text-2xl text-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Transform raw thoughts into platform-optimized posts for X, Threads, LinkedIn, Instagram, and Facebook.
          </p>
        </motion.section>

        {/* Main Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
        >
          {/* Input Card */}
          <Card className="p-8 border-white/10 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-foreground">Your Raw Thought</h2>
              </div>
              <p className="text-muted-foreground text-sm">Enter your idea. AI will adapt it for each platform.</p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  placeholder="What's on your mind..."
                  className="w-full h-40 p-4 bg-white/[0.05] border border-white/[0.15] rounded-2xl text-foreground placeholder-white/40 resize-none focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.08] transition-all"
                  rows={5}
                />
              </div>

              {/* Examples */}
              <div>
                <p className="text-muted-foreground text-sm mb-3 font-medium">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      onClick={() => setThought(example)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-foreground rounded-full transition-all cursor-pointer"
                    >
                      {example}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <p className="text-foreground font-medium mb-4">Platforms ({selectedPlatforms.length}/6)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {platforms.map(({ key, label, icon: Icon }) => (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => handleTogglePlatform(key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center space-x-2 p-3 rounded-xl border transition-all group ${
                        selectedPlatforms.includes(key)
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/40 text-purple-200 shadow-lg shadow-purple-500/20'
                          : 'bg-white/[0.05] border-white/[0.15] text-white/60 hover:bg-white/[0.1] hover:border-white/30 hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={handleGenerate}
                disabled={!thought.trim() || selectedPlatforms.length === 0 || loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-foreground font-medium rounded-xl transition-all shadow-lg hover:shadow-purple-500/50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Generate Posts</span>
                  </>
                )}
              </motion.button>
            </div>
          </Card>

          {/* Output Card */}
          <Card className="p-8 border-white/10 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-foreground">Generated Content</h2>
              </div>
              <p className="text-muted-foreground text-sm">Optimized posts ready to copy & post.</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl flex items-center space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Zap className="w-12 h-12 mb-4 text-purple-400/50 animate-pulse" />
                <p className="text-lg">Generating your posts...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Sparkles className="w-16 h-16 mb-4 text-purple-400/30" />
                <p>Generated posts will appear here</p>
                <p className="text-sm mt-1">Select platforms above and click Generate</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map(({ platform, content }) => {
                  const info = getPlatformInfo(platform)
                  const Icon = info?.icon || Sparkles
                  return (
                    <motion.div
                      key={platform}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative bg-white/[0.05] border border-white/[0.15] rounded-2xl p-6 hover:border-white/30 hover:bg-white/[0.08] transition-all overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                          <Icon className="w-5 h-5 text-purple-400" />
                          <span className="font-semibold text-foreground">{info?.label || platform}</span>
                        </div>
                      </div>

                      {/* Copy Button */}
                      <motion.button
                        onClick={() => copyToClipboard(platform, content)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
                        title="Copy to clipboard"
                      >
                        {copiedPlatform === platform ? (
                          <span className="text-green-400 text-xs font-bold">✓ Copied!</span>
                        ) : (
                          <Copy className="w-4 h-4 text-foreground group-hover:text-foreground" />
                        )}
                      </motion.button>

                      {/* Content */}
                      <pre className="whitespace-pre-wrap text-foreground text-sm leading-relaxed mb-4 max-h-48 overflow-y-auto font-sans">
                        {content}
                      </pre>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-muted-foreground mt-auto">
                        <span>Chars: {content.length}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
