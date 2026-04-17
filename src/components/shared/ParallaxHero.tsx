'use client'

import { useEffect, useRef, useState } from 'react'

interface ParallaxHeroProps {
  children: React.ReactNode
  className?: string
  /** Parallax intensity: 0 = none, 1 = full scroll speed offset. Default 0.3 */
  intensity?: number
}

/**
 * Subtle parallax background wrapper that shifts children based on scroll position.
 * Respects prefers-reduced-motion.
 */
export default function ParallaxHero({
  children,
  className = '',
  intensity = 0.3,
}: ParallaxHeroProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [offsetY, setOffsetY] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect()
            // Only apply parallax when element is in viewport
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
              setOffsetY(window.scrollY * intensity)
            }
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [intensity, prefersReducedMotion])

  return (
    <div
      ref={ref}
      className={`parallax-hero ${className}`}
      style={
        prefersReducedMotion
          ? undefined
          : { transform: `translateY(${offsetY}px)`, willChange: 'transform' }
      }
    >
      {children}
    </div>
  )
}
