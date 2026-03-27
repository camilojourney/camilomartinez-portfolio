'use client'

import { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  /** Animation variant: fade-up (default), fade-left, fade-right, scale */
  variant?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale'
  /** Duration in ms */
  duration?: number
  /** Stagger children instead of animating the container */
  stagger?: boolean
  /** Stagger delay between children in ms */
  staggerDelay?: number
  as?: string
}

const variantStyles = {
  'fade-up': {
    hidden: 'translate-y-6 opacity-0',
    visible: 'translate-y-0 opacity-100',
  },
  'fade-left': {
    hidden: '-translate-x-6 opacity-0',
    visible: 'translate-x-0 opacity-100',
  },
  'fade-right': {
    hidden: 'translate-x-6 opacity-0',
    visible: 'translate-x-0 opacity-100',
  },
  scale: {
    hidden: 'scale-95 opacity-0',
    visible: 'scale-100 opacity-100',
  },
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  variant = 'fade-up',
  duration = 700,
  stagger = false,
  staggerDelay = 80,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
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
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  if (prefersReducedMotion) {
    return (
      <div ref={ref as any} className={className}>
        {children}
      </div>
    )
  }

  const styles = variantStyles[variant]

  if (stagger) {
    return (
      <div ref={ref as any} className={className}>
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div
                key={i}
                className={`transition-all ${isVisible ? styles.visible : styles.hidden}`}
                style={{
                  transitionDuration: `${duration}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: isVisible ? `${delay + i * staggerDelay}ms` : '0ms',
                }}
              >
                {child}
              </div>
            ))
          : children}
      </div>
    )
  }

  return (
    <div
      ref={ref as any}
      className={`transition-all ${isVisible ? styles.visible : styles.hidden} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: isVisible ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </div>
  )
}
