'use client'

import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  strength?: number
  as?: 'button' | 'a' | 'div'
  href?: string
  target?: string
  rel?: string
  onClick?: () => void
}

export default function MagneticButton({
  children,
  className = '',
  strength = 0.3,
  as = 'div',
  href,
  target,
  rel,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 300, damping: 20 })
  const springY = useSpring(y, { stiffness: 300, damping: 20 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduceMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength
    x.set(deltaX)
    y.set(deltaY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const Component = motion.div

  const props: Record<string, unknown> = {
    ref,
    className,
    style: { x: springX, y: springY },
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onClick,
  }

  if (as === 'a' && href) {
    return (
      <motion.a
        ref={ref as unknown as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        className={className}
        style={{ x: springX, y: springY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <Component {...props}>
      {children}
    </Component>
  )
}
