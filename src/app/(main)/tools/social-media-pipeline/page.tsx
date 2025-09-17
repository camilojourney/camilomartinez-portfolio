'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Twitter, Hash, Copy, Zap, Globe, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import LiquidPage from '@/components/shared/liquid-page'

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
      const response = await fetch('/api/tools/social-media-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          language: language,
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
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
        
        // Format reel script with clear act divisions
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
    <LiquidPage currentPage="tools" backgroundVariant="purple">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
          Social Media Pipeline
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-6">
          Transform any thought into polished social media content. 
          AI-powered optimization for Twitter/X and Threads.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/projects/social-media-pipeline"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300"
          >
            <span>🔍</span>
            <span>See How It Works</span>
          </a>
          <a
            href="/docs/social-media-pipeline-implementation.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300"
          >
            <span>📖</span>
            <span>Technical Documentation</span>
          </a>
        </div>
      </section>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <Card className="p-8 border-white/10 bg-white/[0.03]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Your Thought</h2>
            <p className="text-white/60 text-sm">
              Share your idea, insight, or announcement. 
              The AI will optimize it for maximum engagement.
            </p>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="What's on your mind? Share your thoughts, insights, or announcements..."
                className="w-full h-40 p-4 bg-white/[0.05] border border-white/[0.15] rounded-2xl text-white placeholder-white/40 resize-none focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.08] transition-all duration-300"
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
              
              {/* Character Counter */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-3">
                <div className={`text-sm font-medium ${
                  characterCount <= 280 ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {characterCount} chars
                </div>
                <div className={`w-12 h-2 rounded-full bg-white/10 overflow-hidden`}>
                  <div 
                    className={`h-full transition-all duration-300 ${
                      characterCount <= 280 ? 'bg-green-400' : 'bg-orange-400'
                    }`}
                    style={{ width: `${Math.min((characterCount / 280) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mode Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {inputMode === 'short' ? (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-400/20 border border-green-400/30 rounded-lg">
                    <Twitter className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Single Tweet Mode</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-400/20 border border-orange-400/30 rounded-lg">
                    <Hash className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 text-sm font-medium">Thread Mode</span>
                  </div>
                )}
              </div>

            {/* Language Selection */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-400/20 border border-blue-400/30 rounded-lg">
                <Globe className="w-4 h-4 text-blue-400" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'es' | 'both')}
                  className="bg-transparent text-blue-400 text-sm font-medium border-none outline-none"
                >
                  <option value="en" className="bg-gray-800">English Only</option>
                  <option value="es" className="bg-gray-800">Spanish Only</option>
                  <option value="both" className="bg-gray-800">Both Languages</option>
                </select>
              </div>

              <button
                onClick={handleProcess}
                disabled={!inputText.trim() || isProcessing}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
            </div>
          </div>
        </Card>

        {/* Output Section */}
        <Card className="p-8 border-white/10 bg-white/[0.03]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Optimized Content</h2>
            <p className="text-white/60 text-sm">
              AI-refined content ready for Twitter/X and Threads. 
              Optimized for engagement and clarity.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">Processing Error</p>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Content Tabs */}
          {outputContent?.data && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'content'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
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
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
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
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                      : 'bg-white/[0.05] text-white/60 border border-white/[0.15] hover:bg-white/[0.08]'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Reel Script</span>
                </button>
              )}
              
              {language === 'both' && outputContent.data.spanish && (
                <div className="ml-auto flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500/10 to-orange-500/10 border border-white/10 rounded-lg">
                  <Globe className="w-4 h-4 text-white/60" />
                  <span className="text-white/60 text-xs font-medium">Bilingual Content</span>
                </div>
              )}
            </div>
          )}

          {/* Output Area */}
          <div className="space-y-4">
            {outputContent?.data ? (
              <div className="relative">
                <div className="w-full min-h-40 p-4 bg-white/[0.05] border border-white/[0.15] rounded-2xl text-white text-sm leading-relaxed overflow-y-auto max-h-96">
                  {language === 'both' && outputContent.data.spanish ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-blue-300 font-medium mb-3 flex items-center space-x-2 border-b border-blue-400/20 pb-2">
                          <span>🇬🇧</span>
                          <span>English</span>
                          <span className="ml-auto text-xs text-blue-400/60 bg-blue-500/10 px-2 py-1 rounded">
                            {activeTab === 'content' ? outputContent.data.original.mode : activeTab}
                          </span>
                        </h4>
                        <pre className="whitespace-pre-wrap font-sans text-white/90 leading-relaxed">
                          {getContentForLanguage('english')}
                        </pre>
                      </div>
                      <div className="border-t border-white/10 pt-6">
                        <h4 className="text-orange-300 font-medium mb-3 flex items-center space-x-2 border-b border-orange-400/20 pb-2">
                          <span>🇪🇸</span>
                          <span>Spanish</span>
                          <span className="ml-auto text-xs text-orange-400/60 bg-orange-500/10 px-2 py-1 rounded">
                            {activeTab === 'content' ? outputContent.data.original.mode : activeTab}
                          </span>
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
                        <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                          {activeTab === 'content' ? outputContent.data.original.mode : activeTab}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-white/90 leading-relaxed">
                        {getCurrentContent()}
                      </pre>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => copyToClipboard(getCurrentContent())}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-300"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full h-40 p-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl flex items-center justify-center text-white/40 text-sm">
                Your optimized content will appear here...
              </div>
            )}

            {/* Reel Performance Tips */}
            {outputContent?.data && activeTab === 'reel' && outputContent.data.english.reelScript && (
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-lg">
                <h4 className="text-purple-300 font-medium mb-2 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Reel Performance Tips</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/80">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span>Estimated duration: 15-30 seconds</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span>Pace: ~130 words per minute</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    <span>Hook in first 3 seconds</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    <span>Clear value proposition</span>
                  </div>
                </div>
              </div>
            )}

            {/* Caption Usage Guide */}
            {outputContent?.data && activeTab === 'captions' && (
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-400/20 rounded-lg">
                <h4 className="text-blue-300 font-medium mb-2 flex items-center space-x-2">
                  <Copy className="w-4 h-4" />
                  <span>Caption Usage Guide</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-white/80">
                  <div>
                    <span className="text-yellow-400 font-medium">Option 1:</span>
                    <span className="ml-1">Bold & Direct</span>
                  </div>
                  <div>
                    <span className="text-green-400 font-medium">Option 2:</span>
                    <span className="ml-1">Thoughtful & Inspiring</span>
                  </div>
                  <div>
                    <span className="text-purple-400 font-medium">Option 3:</span>
                    <span className="ml-1">Engaging & Interactive</span>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {outputContent?.data && (
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded border border-green-400/30 flex items-center space-x-1">
                  <span>📂</span>
                  <span>{outputContent.data.metadata.category}</span>
                </div>
                {outputContent.data.metadata.emotions.map((emotion) => (
                  <div key={emotion} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30 flex items-center space-x-1">
                    <span>😊</span>
                    <span>{emotion}</span>
                  </div>
                ))}
                <div className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-400/30 flex items-center space-x-1">
                  <span>📊</span>
                  <span>{outputContent.data.original.characterCount} chars</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {outputContent?.data && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Ready to post</span>
                </div>

                <div className="flex items-center space-x-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getCurrentContent())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-400 rounded-lg transition-all duration-300"
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="text-sm">Post to X</span>
                  </a>
                  
                  <button
                    onClick={() => copyToClipboard(getCurrentContent())}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-400 rounded-lg transition-all duration-300"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* Features Section */}
      <section className="mt-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="p-6 text-center border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Twitter className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Tweet Optimization</h3>
            <p className="text-white/60 text-sm">
              Transforms thoughts into engaging tweets with optimal structure and hashtags.
            </p>
          </Card>

          <Card className="p-6 text-center border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Automatic Threading</h3>
            <p className="text-white/60 text-sm">
              Long content automatically split into perfectly sized thread segments.
            </p>
          </Card>

          <Card className="p-6 text-center border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Platform Ready</h3>
            <p className="text-white/60 text-sm">
              Content optimized for Twitter/X, Threads, and other social platforms.
            </p>
          </Card>

        </div>
      </section>
    </LiquidPage>
  )
}
