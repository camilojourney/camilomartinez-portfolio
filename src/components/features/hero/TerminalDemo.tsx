'use client'

import { useEffect, useRef, useState } from 'react'

const COMMAND = '$ invoz analyze --audio recording.wav'
const OUTPUT_LINES = [
  'Analyzing speech across 7 dimensions...',
  '',
  'Intelligibility       88/100',
  'Accuracy              94/100',
  'Fluency               87/100',
  'Prosody               91/100',
  'Vocabulary            On track',
  '',
  'Top suggestion: Insert pauses after key points',
  'to make the main idea easier to follow',
]

export default function TerminalDemo() {
  const [typedCommand, setTypedCommand] = useState('')
  const [visibleLines, setVisibleLines] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'output' | 'done'>('typing')
  const [hasMounted, setHasMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced) {
        setTypedCommand(COMMAND)
        setVisibleLines(OUTPUT_LINES.length)
        setPhase('done')
        setHasMounted(true)
        return
      }
    }

    setHasMounted(true)

    // Start typing after a delay
    const startDelay = setTimeout(() => {
      let charIndex = 0
      const typeInterval = setInterval(() => {
        charIndex++
        setTypedCommand(COMMAND.slice(0, charIndex))
        if (charIndex >= COMMAND.length) {
          clearInterval(typeInterval)
          // Start showing output after a pause
          setTimeout(() => {
            setPhase('output')
            let lineIndex = 0
            const lineInterval = setInterval(() => {
              lineIndex++
              setVisibleLines(lineIndex)
              if (lineIndex >= OUTPUT_LINES.length) {
                clearInterval(lineInterval)
                setPhase('done')
              }
            }, 120)
          }, 600)
        }
      }, 45)

      return () => clearInterval(typeInterval)
    }, 1200)

    return () => clearTimeout(startDelay)
  }, [])

  if (!hasMounted) return null

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden border border-white/[0.10] bg-black/40 backdrop-blur-xl shadow-2xl shadow-cyan-500/[0.05]"
    >
      {/* Subtle glow behind terminal */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-cyan-500/[0.08] via-transparent to-blue-500/[0.05] pointer-events-none" />

      {/* Title bar */}
      <div className="relative flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-3 text-[11px] text-white/30 font-medium tracking-wide">
          invoz-demo &mdash; zsh
        </span>
      </div>

      {/* Terminal content */}
      <div className="relative p-5 md:p-6 font-mono text-[13px] md:text-sm leading-relaxed min-h-[280px]">
        {/* Command line */}
        <div className="flex items-center">
          <span className="text-emerald-400/80 mr-2 select-none">~</span>
          <span className="text-white/90">{typedCommand}</span>
          {phase === 'typing' && (
            <span className="inline-block w-[8px] h-[18px] bg-white/70 ml-0.5 terminal-cursor" />
          )}
        </div>

        {/* Output lines */}
        {visibleLines > 0 && (
          <div className="mt-3 space-y-0">
            {OUTPUT_LINES.slice(0, visibleLines).map((line, i) => (
              <div
                key={i}
                className={`${
                  line.includes('Score') || line.includes('Fluency') || line.includes('Pitch') || line.includes('Speech Rate') || line.includes('Pause')
                    ? 'text-cyan-300/80'
                    : line.includes('suggestion')
                    ? 'text-emerald-400/70'
                    : line.includes('Analyzing')
                    ? 'text-white/50'
                    : 'text-white/70'
                } ${line.includes('/100') || line.includes('optimal') || line.includes('Natural') ? 'font-medium' : ''}`}
              >
                {line || '\u00A0'}
              </div>
            ))}
          </div>
        )}

        {phase === 'done' && (
          <div className="mt-3 flex items-center">
            <span className="text-emerald-400/80 mr-2 select-none">~</span>
            <span className="inline-block w-[8px] h-[18px] bg-white/70 terminal-cursor" />
          </div>
        )}
      </div>

      <style jsx>{`
        .terminal-cursor {
          animation: terminal-blink 1s step-end infinite;
        }
        @keyframes terminal-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .terminal-cursor {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
