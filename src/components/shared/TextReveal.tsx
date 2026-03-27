'use client'

import { useEffect, useRef, useState } from 'react'

interface TextRevealProps {
  /** The text content to reveal word-by-word */
  text: string
  className?: string
  /** Delay before the animation starts (ms) */
  delay?: number
  /** Stagger between words (ms) */
  staggerDelay?: number
  /** HTML tag to render */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
}

/**
 * Reveals text word-by-word with a fade-in-up effect.
 * Falls back to static text if prefers-reduced-motion is set.
 */
export default function TextReveal({
  text,
  className = '',
  delay = 0,
  staggerDelay = 60,
  as: Tag = 'h1',
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  if (prefersReducedMotion) {
    return <Tag ref={ref as any} className={className}>{text}</Tag>
  }

  const words = text.split(' ')

  return (
    <Tag ref={ref as any} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="inline-block transition-all"
            style={{
              transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
              opacity: isVisible ? 1 : 0,
              transitionDuration: '500ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: isVisible ? `${delay + i * staggerDelay}ms` : '0ms',
            }}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </Tag>
  )
}
