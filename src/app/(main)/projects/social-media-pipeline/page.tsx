'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CaseStudy, CaseStudyCta, CaseStudyHeader, CaseStudySection, TechList } from '@/components/projects/case-study'

interface Example {
  title: string
  raw: string
  outputs: {
    tweet?: string
    thread?: string[]
    captions?: string[]
    reel?: string
    spanish?: string
  }
}

const examples: Example[] = [
  {
    title: 'Personal insight to tweet',
    raw: "been thinking about this whole AI thing and honestly its kinda scary but also exciting like we're literally living through a revolution but most people don't realize it yet. the speed of change is insane",
    outputs: {
      tweet:
        "Been thinking about this whole AI thing.\n\nHonestly? It's scary but exciting.\n\nWe're literally living through a revolution, but most people don't realize it yet.\n\nThe speed of change is insane.",
      captions: [
        "We're living through an AI revolution\nMost people don't even realize it\nThe speed of change is unprecedented",
        'Sometimes the most profound changes\nhappen so gradually we barely notice\nUntil suddenly, everything is different',
        'Are you aware you\'re witnessing history?\nHow has AI already changed your daily life?',
      ],
    },
  },
  {
    title: 'Long thought to thread',
    raw: "I've been studying successful entrepreneurs for years and noticed something interesting. Most people think success comes from having the perfect idea or being the smartest person in the room. But that's not what I've observed. The entrepreneurs who actually make it have one thing in common: they're obsessed with solving real problems for real people. They don't fall in love with their solutions, they fall in love with the problems. This mindset shift changes everything about how you approach business.",
    outputs: {
      thread: [
        "I've studied successful entrepreneurs for years and noticed something counterintuitive:\n\nIt's not about having the perfect idea or being the smartest person.\n\nHere's what actually separates those who make it:",
        "1/ The entrepreneurs who succeed are obsessed with solving real problems for real people.\n\nThey don't fall in love with their solutions.",
        '2/ They fall in love with the problems.\n\nThis simple mindset shift changes everything about how you approach business.',
        "When you're obsessed with problems, you stay flexible with solutions.\n\nWhen you're obsessed with solutions, you become blind to better alternatives.",
      ],
      reel:
        "ACT I: The hook\nMost entrepreneurs get this backwards.\n\nACT II: Value proposition\nStudying successful founders revealed a counterintuitive pattern.\n\nACT III: Key content\nThe entrepreneurs who actually make it aren't obsessed with their solutions. They're obsessed with solving real problems for real people. They fall in love with the problems, not their answers. This mindset shift changes everything because when you're obsessed with problems, you stay flexible with solutions. When you're obsessed with solutions, you become blind to better alternatives.\n\nACT IV: Call to action\nWhat problem are you obsessed with solving?",
    },
  },
  {
    title: 'Technical insight to multi-format',
    raw: "Just realized something about code reviews. Everyone talks about catching bugs but the real value is knowledge transfer. When a senior dev reviews junior code, both people learn. The junior learns better patterns, the senior learns about new approaches and different perspectives. It's not just quality control, it's collaborative learning.",
    outputs: {
      tweet:
        "Just realized something about code reviews.\n\nEveryone talks about catching bugs, but the real value is knowledge transfer.\n\nSenior devs learn new perspectives.\nJunior devs learn better patterns.\n\nIt's collaborative learning, not just quality control.",
      spanish:
        'Acabo de darme cuenta de algo sobre las revisiones de código.\n\nTodos hablan de encontrar errores, pero el verdadero valor es la transferencia de conocimiento.\n\nLos desarrolladores senior aprenden nuevas perspectivas.\nLos junior aprenden mejores patrones.\n\nEs aprendizaje colaborativo, no solo control de calidad.',
      reel:
        "ACT I: The hook\nCode reviews aren't what you think.\n\nACT II: Value proposition\nEveryone focuses on bug catching, but that's missing the point.\n\nACT III: Key content\nThe real magic happens in knowledge transfer. When a senior developer reviews junior code, both people learn something valuable. The junior developer learns better patterns and practices. The senior developer learns about fresh approaches and different perspectives. It transforms from quality control into collaborative learning.\n\nACT IV: Call to action\nWhat's the most valuable thing you've learned from a code review?",
    },
  },
]

const features = [
  ['Smart mode detection', 'Automatically switches between tweet mode (up to 280 characters) and thread mode beyond that.'],
  ['Multi-format generation', 'Creates tweets, threads, reel scripts, and captions from a single input.'],
  ['Bilingual support', 'DeepL integration for high-quality Spanish translations.'],
  ['Voice preservation', 'Prompts are built to keep your authentic voice and tone intact.'],
  ['One-click actions', 'Copy content or share directly to social platforms with a single click.'],
  ['Platform optimization', 'Content optimized for X, Instagram, and other social platforms.'],
] as const

function Output({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <p className="caption mb-2 text-xs font-medium uppercase tracking-wide">{label}</p>
      {children}
    </div>
  )
}

export default function SocialMediaPipelineProjectPage() {
  const [activeExample, setActiveExample] = useState(0)
  const active = examples[activeExample] ?? examples[0]
  if (!active) return null

  return (
    <CaseStudy>
      <CaseStudyHeader
        status="Live"
        title="Social Media Pipeline"
        lede="AI-powered content transformation that preserves your authentic voice while maximizing engagement."
        facts={[
          ['Input', 'One raw thought'],
          ['Output', 'Tweets, threads, reel scripts, captions, Spanish'],
          ['Stack', 'Next.js, OpenAI, DeepL, TypeScript'],
        ]}
        actions={
          <>
            <Link href="/apps/social-media-pipeline" className="btn-primary">
              View live app
            </Link>
            <a
              href="https://github.com/camilojourney/camilomartinez-portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              View source
            </a>
          </>
        }
      />

      <figure className="thumb thumb-contain mt-10 aspect-[2/1] md:mt-14">
        <Image
          src="/images/previews_main/socia_media_creation.png"
          alt="Social media pipeline content generation preview"
          fill
          sizes="(min-width: 1280px) 72rem, 100vw"
          className="object-contain"
          priority
        />
      </figure>

      <div className="mt-6 md:mt-10">
        <CaseStudySection title="The problem" id="problem">
          <ul>
            <li>Authentic thoughts get lost in algorithm optimization.</li>
            <li>Content creators sacrifice their voice for engagement.</li>
            <li>Manual adaptation across platforms is time-consuming.</li>
            <li>Bilingual creators need separate content strategies.</li>
          </ul>
        </CaseStudySection>

        <CaseStudySection title="The solution" id="solution">
          <ul>
            <li>Preserve authentic voice while optimizing structure.</li>
            <li>Enhance clarity without changing personality.</li>
            <li>Generate multiple formats from one input.</li>
            <li>Automatic bilingual content with DeepL integration.</li>
          </ul>
        </CaseStudySection>
      </div>

      {/* Live examples */}
      <section className="border-b border-line py-10 md:py-14" aria-labelledby="examples-heading">
        <div className="grid gap-4 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <h2 id="examples-heading" className="title-md">
              The transformation
            </h2>
            <p className="body-muted mt-2 text-[0.9375rem]">Pick an input to see every format the pipeline produces from it.</p>
            <div className="mt-5 flex flex-col gap-2" role="tablist" aria-label="Examples">
              {examples.map((example, index) => {
                const selected = activeExample === index
                return (
                  <button
                    key={example.title}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveExample(index)}
                    className={`min-h-11 rounded-md border px-4 py-2 text-left text-sm font-medium transition-colors ${
                      selected ? 'border-ink bg-ink text-page' : 'border-line-strong text-ink hover:border-ink'
                    }`}
                  >
                    {example.title}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-6 md:col-span-8 lg:grid-cols-2" role="tabpanel">
            <div className="panel p-5">
              <p className="caption mb-2 text-xs font-medium uppercase tracking-wide">Raw input</p>
              <p className="text-[0.9375rem] italic leading-relaxed text-ink">&ldquo;{active.raw}&rdquo;</p>
              <p className="caption mt-3 text-xs">{active.raw.length} characters</p>
            </div>

            <div className="panel p-5">
              {active.outputs.thread ? (
                <Output label="X thread">
                  <ol className="space-y-2">
                    {active.outputs.thread.map((tweet, i) => (
                      <li key={i} className="whitespace-pre-wrap rounded-md bg-surface-2 p-3 text-sm leading-relaxed text-ink">
                        {tweet}
                      </li>
                    ))}
                  </ol>
                </Output>
              ) : (
                <Output label="Optimized tweet">
                  <p className="whitespace-pre-wrap rounded-md bg-surface-2 p-3 text-sm leading-relaxed text-ink">{active.outputs.tweet}</p>
                </Output>
              )}

              {active.outputs.reel && (
                <Output label="Instagram reel script">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{active.outputs.reel}</pre>
                </Output>
              )}

              {active.outputs.captions && (
                <Output label="Caption variations">
                  <ol className="space-y-2">
                    {active.outputs.captions.map((caption, i) => (
                      <li key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                        <span className="font-semibold">Option {i + 1}.</span> {caption}
                      </li>
                    ))}
                  </ol>
                </Output>
              )}

              {active.outputs.spanish && (
                <Output label="Spanish translation">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink" lang="es">
                    {active.outputs.spanish}
                  </p>
                </Output>
              )}
            </div>
          </div>
        </div>
      </section>

      <CaseStudySection title="Technical features" id="features">
        <dl className="not-prose row-list">
          {features.map(([name, detail]) => (
            <div key={name} className="grid gap-1 py-3 sm:grid-cols-12 sm:gap-6">
              <dt className="text-[0.9375rem] font-semibold text-ink sm:col-span-4">{name}</dt>
              <dd className="text-[0.9375rem] text-muted sm:col-span-8">{detail}</dd>
            </div>
          ))}
        </dl>
      </CaseStudySection>

      <CaseStudySection title="Built with" id="stack">
        <TechList items={['Next.js 13', 'OpenAI GPT', 'DeepL API', 'TypeScript']} />
      </CaseStudySection>

      <CaseStudyCta
        title="Ready to amplify your authentic voice?"
        body="Transform your thoughts into engaging content while preserving what makes you unique. Want to see how this was built? The technical story covers implementation details with code examples."
        href="/apps/social-media-pipeline"
        label="View live app"
        secondary={{ href: '/docs/social-media-pipeline-implementation.html', label: 'Read the technical story', external: true }}
      />
    </CaseStudy>
  )
}
