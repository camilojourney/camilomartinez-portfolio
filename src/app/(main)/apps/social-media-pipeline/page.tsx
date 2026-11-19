'use client'

import { useState } from 'react'
import { Copy, Twitter, Hash, MessageCircle, Linkedin, Instagram, Facebook } from 'lucide-react'
import Link from 'next/link'
import PageShell from '@/components/shared/page-shell'
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
  const canGenerate = Boolean(thought.trim()) && selectedPlatforms.length > 0 && !loading

  return (
    <PageShell currentPage="apps" maxWidth="wide">
      <Link href="/apps" className="link-quiet mobile-link-target inline-flex items-center gap-2 text-sm">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        All apps
      </Link>

      <header className="rise-in mt-6 border-b border-line pb-10 md:pb-14">
        <span className="status status-live">Live</span>
        <h1 className="display mt-3">Social Media Pipeline</h1>
        <p className="lede mt-6">
          Transform raw thoughts into <em>platform-optimized posts</em> for X, Threads, LinkedIn, Instagram, and
          Facebook.
        </p>
        <Link href="/projects/social-media-pipeline" className="link mt-5 inline-block text-sm">
          Read the case study
        </Link>
      </header>

      <div className="grid gap-10 py-10 md:grid-cols-2 md:gap-12 md:py-14">
        {/* Input */}
        <section aria-labelledby="input-heading">
          <h2 id="input-heading" className="title-md">
            Your raw thought
          </h2>
          <p className="caption mt-1">Enter your idea. AI will adapt it for each platform.</p>

          <label htmlFor="thought" className="sr-only">
            Your raw thought
          </label>
          <textarea
            id="thought"
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="What's on your mind..."
            className="mt-5 h-40 w-full resize-none rounded-md border border-line-strong bg-surface p-4 text-[0.9375rem] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
            rows={5}
          />

          <p className="caption mt-5 mb-2">Examples</p>
          <div className="flex flex-col gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setThought(example)}
                className="rounded-md border border-line px-3 py-2 text-left text-sm text-muted transition-colors hover:border-ink hover:text-ink"
              >
                {example}
              </button>
            ))}
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-ink">
              Platforms <span className="text-muted">({selectedPlatforms.length}/6)</span>
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {platforms.map(({ key, label, icon: Icon }) => {
                const selected = selectedPlatforms.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleTogglePlatform(key)}
                    className={`flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${                      selected
                        ? 'border-ink bg-ink text-page'
                        : 'border-line-strong text-muted hover:border-ink hover:text-ink'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <button onClick={handleGenerate} disabled={!canGenerate} className="btn-primary mt-6 w-full disabled:opacity-40 sm:w-auto">
            {loading ? 'Generating...' : 'Generate posts'}
          </button>
        </section>

        {/* Output */}
        <section aria-labelledby="output-heading" aria-live="polite">
          <h2 id="output-heading" className="title-md">
            Generated content
          </h2>
          <p className="caption mt-1">Optimized posts ready to copy and post.</p>

          {error && (
            <p role="alert" className="mt-5 rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          {loading ? (
            <div className="mt-5 space-y-3" aria-label="Generating">
              {selectedPlatforms.map((p) => (
                <div key={p} className="loading-skeleton h-28" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="panel mt-5 flex h-64 flex-col items-center justify-center text-center">
              <p className="text-ink">Generated posts will appear here</p>
              <p className="caption mt-1">Select platforms and click Generate</p>
            </div>
          ) : (
            <ul className="row-list mt-5">
              {results.map(({ platform, content }) => {
                const info = getPlatformInfo(platform)
                const Icon = info?.icon ?? MessageCircle
                return (
                  <li key={platform} className="py-5 first:pt-0">
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                        <Icon className="h-4 w-4" aria-hidden />
                        {info?.label || platform}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(platform, content)}
                        className="btn-secondary btn-sm"
                        aria-label={`Copy ${info?.label || platform} post`}
                      >
                        {copiedPlatform === platform ? (
                          'Copied'
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap font-sans text-[0.9375rem] leading-relaxed text-ink">
                      {content}
                    </pre>
                    <p className="caption mt-2 text-xs">{content.length} characters</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  )
}
