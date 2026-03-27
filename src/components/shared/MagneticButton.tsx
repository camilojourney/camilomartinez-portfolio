'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  /** Magnetic pull strength (px). 0 = disabled. */
  strength?: number
  as?: 'a' | 'button'
  [key: string]: any
}

/**
 * Wraps a CTA element with a subtle magnetic hover effect.
 * Respects prefers-reduced-motion by disabling the effect entirely.
 */
export default function MagneticButton({
  children,
  className = '',
  strength = 8,
  as: Tag = 'a',
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      setOffset({ x: dx * strength, y: dy * strength })
    },
    [prefersReducedMotion, strength]
  )

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 })
  }, [])

  return (
    <Tag
      ref={ref as any}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: offset.x === 0 && offset.y === 0
          ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          : 'transform 0.15s ease-out',
      }}
      {...props}
    >
      {children}
    </Tag>
  )
}
