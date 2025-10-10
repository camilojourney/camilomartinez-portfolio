'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Twitter, Hash, Copy, Zap, Globe, AlertCircle, Sparkles, ArrowLeft, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ApiClient } from '@/lib/api/config'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import LiquidNav from '@/components/shared/liquid-nav'

interface ProcessedContent {
  success: boolean
  data?: {
    original: {
      text: string
      characterCount: number
      mode: 'tweet' | 'thread'
    }
    english: {
      refined: string
      reelScript?: string
      captions: string[]
      emotions: string[]
      category: string
    }
    spanish?: {
      refined: string
      reelScript?: string
      captions: string[]
    }
    metadata: {
      emotions: string[]
      category: string
      processedAt: string
    }
  }
  error?: string
  details?: string
}

export default function SocialMediaPipelinePage() {
  const [inputText, setInputText] = useState('')
  const [inputMode, setInputMode] = useState<'short' | 'long'>('short')
  const [outputContent, setOutputContent] = useState<ProcessedContent | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)
  const [language, setLanguage] = useState<'en' | 'es' | 'both'>('en')
  const [activeTab, setActiveTab] = useState<'content' | 'captions' | 'reel'>('content')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Update character count and mode
  useEffect(() => {
    setCharacterCount(inputText.length)
    if (inputText.length <= 280) {
      setInputMode('short')
    } else {
      setInputMode('long')
    }
  }, [inputText])

  const handleProcess = async () => {
    if (!inputText.trim()) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await ApiClient.post<ProcessedContent>('/api/tools/social-media-pipeline', {
        text: inputText,
        language,
      }, { fallback: '/api/tools/social-media-pipeline' })

      if (result?.success === false) {
        throw new Error(result.error || 'Failed to process content')
      }

      setOutputContent(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getCurrentContent = () => {
    if (!outputContent?.data) return ''

    const isSpanish = language === 'es'
    const content = isSpanish ? outputContent.data.spanish : outputContent.data.english

    if (!content) return ''

    switch (activeTab) {
      case 'content':
        return content.refined
      case 'captions':
        return content.captions.map((caption, index) =>
          `📝 Caption Option ${index + 1}\n${caption}`
        ).join('\n\n' + '─'.repeat(50) + '\n\n')
      case 'reel':
        if (!content.reelScript) return 'No reel script available for this content'

        const acts = content.reelScript.split('\n\n')
        return acts.map((act, index) => {
          const actNames = ['🎬 ACT I: The Hook', '💡 ACT II: Value Proposition', '📚 ACT III: Key Content', '📢 ACT IV: Call-to-Action']
          const actName = actNames[index] || `📝 ACT ${index + 1}`
          return `${actName}\n${act.trim()}`
        }).join('\n\n' + '═'.repeat(60) + '\n\n')
      default:
        return content.refined
    }
  }

  const getContentForLanguage = (lang: 'english' | 'spanish') => {
    if (!outputContent?.data) return ''

    const content = lang === 'spanish' ? outputContent.data.spanish : outputContent.data.english
    if (!content) return ''

    switch (activeTab) {
      case 'content':
        return content.refined
      case 'captions':
        return content.captions.map((caption, index) =>
          `📝 Caption Option ${index + 1}\n${caption}`
        ).join('\n\n' + '─'.repeat(50) + '\n\n')
      case 'reel':
        if (!content.reelScript) return 'No reel script available for this content'

        const acts = content.reelScript.split('\n\n')
        return acts.map((act, index) => {
          const actNames = ['🎬 ACT I: The Hook', '💡 ACT II: Value Proposition', '📚 ACT III: Key Content', '📢 ACT IV: Call-to-Action']
          const actName = actNames[index] || `📝 ACT ${index + 1}`
          return `${actName}\n${act.trim()}`
        }).join('\n\n' + '═'.repeat(60) + '\n\n')
      default:
        return content.refined
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="apps" />
      {/* Animated Background - matching home page */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-pink-900/30 animate-gradient-xy"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative pt-24 md:pt-32 px-4 md:px-6 pb-20">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-7xl mx-auto mb-6"
        >
          <Link
            href="/apps"
            className="inline-flex items-center space-x-2 text-white/60 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Apps</span>
          </Link>
        </motion.div>

        {/* Hero Section */}
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
            <span className="text-purple-300 text-sm font-medium">AI-Powered Content Generation</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
            Social Media Pipeline
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-8">
            Transform any thought into <span className="text-purple-400 font-semibold">polished social media content</span>.
            AI-powered optimization for{' '}
            <span className="text-pink-400 font-semibold">Twitter/X</span> and{' '}
            <span className="text-cyan-400 font-semibold">Threads</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/projects/social-media-pipeline"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
            >
              <BookOpen className="w-5 h-5" />
              <span>Read how I built this →</span>
            </Link>
            <a
              href="/docs/social-media-pipeline-implementation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
            >
              <span>📖</span>
              <span>Technical Docs</span>
            </a>
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
        >

          {/* Input Section */}
          <Card className="p-8 border-white/10 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-white">Your Thought</h2>
              </div>
              <p className="text-white/60 text-sm">
                Share your idea, insight, or announcement. The AI will optimize it for maximum engagement.
              </p>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              <div className="relative group">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="What's on your mind? Share your thoughts, insights, or announcements..."
                  className="w-full h-48 p-4 bg-white/[0.05] border border-white/[0.15] rounded-2xl text-white placeholder-white/40 resize-none focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.08] transition-all duration-300 group-hover:border-white/25"
                  style={{ fontSize: '16px' }}
                />

                {/* Character Counter */}
                <div className="absolute bottom-4 right-4 flex items-center space-x-3">
                  <div className={`text-sm font-medium transition-colors ${
                    characterCount <= 280 ? 'text-green-400' : characterCount <= 1000 ? 'text-orange-400' : 'text-pink-400'
                  }`}>
                    {characterCount}
                  </div>
                  <div className={`w-16 h-2 rounded-full bg-white/10 overflow-hidden`}>
                    <motion.div
                      className={`h-full transition-colors duration-300 ${
                        characterCount <= 280 ? 'bg-green-400' : characterCount <= 1000 ? 'bg-orange-400' : 'bg-pink-400'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((characterCount / 280) * 100, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>

              {/* Mode & Language Selection */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <AnimatePresence mode="wait">
                    {inputMode === 'short' ? (
                      <motion.div
                        key="short"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-green-400/20 to-emerald-400/20 border border-green-400/30 rounded-lg"
                      >
                        <Twitter className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Single Tweet</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="long"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-orange-400/20 to-pink-400/20 border border-orange-400/30 rounded-lg"
                      >
                        <Hash className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400 text-sm font-medium">Thread Mode</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Language Selection */}
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 border border-blue-400/30 rounded-lg">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'en' | 'es' | 'both')}
                      className="bg-transparent text-blue-400 text-sm font-medium border-none outline-none cursor-pointer"
                    >
                      <option value="en" className="bg-gray-900">English</option>
                      <option value="es" className="bg-gray-900">Spanish</option>
                      <option value="both" className="bg-gray-900">Both</option>
                    </select>
                  </div>
                </div>

                <motion.button
                  onClick={handleProcess}
                  disabled={!inputText.trim() || isProcessing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50 disabled:shadow-none"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Generate Content</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </Card>

          {/* Output Section */}
          <Card className="p-8 border-white/10 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-white">Optimized Content</h2>
              </div>
              <p className="text-white/60 text-sm">
                AI-refined content ready for social media. Optimized for engagement and clarity.
              </p>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg flex items-center space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-red-400 font-medium">Processing Error</p>
                    <p className="text-red-300/80 text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Tabs */}
            {outputContent?.data && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 flex flex-wrap gap-2"
              >
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    activeTab === 'content'
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border border-purple-400/50'
                      : 'bg-white/[0.05] text-white/60 border border-white/[0.15] hover:bg-white/[0.08]'
                  }`}
                >
                  {outputContent.data.original.mode === 'tweet' ? (
                    <>
                      <Twitter className="w-4 h-4" />
                      <span>Tweet</span>
                    </>
                  ) : (
                    <>
                      <Hash className="w-4 h-4" />
                      <span>Thread</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('captions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    activeTab === 'captions'
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border border-purple-400/50'
                      : 'bg-white/[0.05] text-white/60 border border-white/[0.15] hover:bg-white/[0.08]'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>Captions</span>
                  <span className="bg-white/10 text-white/70 px-1.5 py-0.5 rounded text-xs">
                    {outputContent.data.english.captions.length}
                  </span>
                </button>

                {outputContent.data.english.reelScript && (
                  <button
                    onClick={() => setActiveTab('reel')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                      activeTab === 'reel'
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border border-purple-400/50'
                        : 'bg-white/[0.05] text-white/60 border border-white/[0.15] hover:bg-white/[0.08]'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Reel Script</span>
                  </button>
                )}
              </motion.div>
            )}

            {/* Output Area */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {outputContent?.data ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative"
                  >
                    <div className="w-full min-h-48 p-4 bg-white/[0.05] border border-white/[0.15] rounded-2xl text-white text-sm leading-relaxed overflow-y-auto max-h-96">
                      {language === 'both' && outputContent.data.spanish ? (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-blue-300 font-medium mb-3 flex items-center space-x-2 border-b border-blue-400/20 pb-2">
                              <span>🇺🇸</span>
                              <span>English</span>
                            </h4>
                            <pre className="whitespace-pre-wrap font-sans text-white/90 leading-relaxed">
                              {getContentForLanguage('english')}
                            </pre>
                          </div>
                          <div className="border-t border-white/10 pt-6">
                            <h4 className="text-orange-300 font-medium mb-3 flex items-center space-x-2 border-b border-orange-400/20 pb-2">
                              <span>🇪🇸</span>
                              <span>Spanish</span>
                            </h4>
                            <pre className="whitespace-pre-wrap font-sans text-white/90 leading-relaxed">
                              {getContentForLanguage('spanish')}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                            <h4 className="text-white/80 font-medium flex items-center space-x-2">
                              <span>{language === 'es' ? '🇪🇸' : '🇬🇧'}</span>
                              <span>{language === 'es' ? 'Spanish' : 'English'}</span>
                            </h4>
                          </div>
                          <pre className="whitespace-pre-wrap font-sans text-white/90 leading-relaxed">
                            {getCurrentContent()}
                          </pre>
                        </div>
                      )}
                    </div>

                    <motion.button
                      onClick={() => copyToClipboard(getCurrentContent())}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-300"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <span className="text-green-400 text-xs">✓</span>
                      ) : (
                        <Copy className="w-4 h-4 text-white" />
                      )}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-48 p-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl flex flex-col items-center justify-center text-white/40 text-sm"
                  >
                    <Sparkles className="w-12 h-12 mb-3 text-purple-400/30" />
                    <p>Your optimized content will appear here...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Metadata Tags */}
              {outputContent?.data && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 text-xs"
                >
                  <div className="px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 rounded-lg border border-green-400/30 flex items-center space-x-1.5">
                    <span>📂</span>
                    <span>{outputContent.data.metadata.category}</span>
                  </div>
                  {outputContent.data.metadata.emotions.slice(0, 3).map((emotion) => (
                    <div key={emotion} className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-lg border border-blue-400/30 flex items-center space-x-1.5">
                      <span>😊</span>
                      <span>{emotion}</span>
                    </div>
                  ))}
                  <div className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-lg border border-purple-400/30 flex items-center space-x-1.5">
                    <span>📊</span>
                    <span>{outputContent.data.original.characterCount} chars</span>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              {outputContent?.data && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-sm font-medium">Ready to post</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getCurrentContent())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-400/30 text-blue-400 rounded-lg transition-all duration-300"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="text-sm">Post to X</span>
                    </a>

                    <button
                      onClick={() => copyToClipboard(getCurrentContent())}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/30 text-purple-400 rounded-lg transition-all duration-300"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy All</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white/95">
            Powerful Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-8 text-center border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-white/[0.05] hover:to-white/[0.02] transition-all duration-300 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20"
              >
                <Twitter className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-green-400 transition-colors">
                Smart Tweet Optimization
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Transforms thoughts into engaging tweets with optimal structure and hashtags for maximum reach.
              </p>
            </Card>

            <Card className="p-8 text-center border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-white/[0.05] hover:to-white/[0.02] transition-all duration-300 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20"
              >
                <Hash className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-orange-400 transition-colors">
                Automatic Threading
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Long content automatically split into perfectly sized thread segments with smooth flow.
              </p>
            </Card>

            <Card className="p-8 text-center border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-white/[0.05] hover:to-white/[0.02] transition-all duration-300 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20"
              >
                <Zap className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors">
                Multi-Platform Ready
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Content optimized for Twitter/X, Threads, and other social platforms in multiple languages.
              </p>
            </Card>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
