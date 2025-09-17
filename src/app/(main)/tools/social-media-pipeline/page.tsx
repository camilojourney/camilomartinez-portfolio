'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Twitter, Hash, Copy, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import LiquidPage from '@/components/shared/liquid-page'

export default function SocialMediaPipelinePage() {
  const [inputText, setInputText] = useState('')
  const [inputMode, setInputMode] = useState<'short' | 'long'>('short')
  const [outputText, setOutputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)

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
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (inputMode === 'short') {
      setOutputText(`🚀 Refined Tweet:\n\n${inputText}\n\n#AI #ContentCreation #TechInsights`)
    } else {
      const words = inputText.split(' ')
      const chunks = []
      let currentChunk = ''
      
      for (const word of words) {
        if ((currentChunk + ' ' + word).length <= 270) {
          currentChunk += (currentChunk ? ' ' : '') + word
        } else {
          chunks.push(currentChunk)
          currentChunk = word
        }
      }
      if (currentChunk) chunks.push(currentChunk)
      
      const threadText = chunks.map((chunk, index) => 
        `${index + 1}/${chunks.length} ${chunk}`
      ).join('\n\n')
      
      setOutputText(`🧵 Thread Ready:\n\n${threadText}\n\n#AI #ContentCreation #TechInsights`)
    }
    
    setIsProcessing(false)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(outputText)
  }

  return (
    <LiquidPage currentPage="tools" backgroundVariant="purple">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
          Social Media Pipeline
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
          Transform any thought into polished social media content. 
          AI-powered optimization for Twitter/X and Threads.
        </p>
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

          {/* Output Area */}
          <div className="space-y-4">
            {outputText ? (
              <div className="relative">
                <div className="w-full h-40 p-4 bg-white/[0.05] border border-white/[0.15] rounded-2xl text-white text-sm leading-relaxed overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">{outputText}</pre>
                </div>
                
                <button
                  onClick={copyToClipboard}
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

            {/* Action Buttons */}
            {outputText && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Ready to post</span>
                </div>

                <div className="flex items-center space-x-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(outputText.replace('🚀 Refined Tweet:\n\n', '').replace('🧵 Thread Ready:\n\n', ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-400 rounded-lg transition-all duration-300"
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="text-sm">Post to X</span>
                  </a>
                  
                  <button
                    onClick={copyToClipboard}
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
