'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface ScrollRevealProps {
  children: ReactNode
  direction?: Direction
  delay?: number
  duration?: number
  distance?: number
  className?: string
  once?: boolean
  staggerIndex?: number
  staggerDelay?: number
}

const directionOffset = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'up': return { y: distance }
    case 'down': return { y: -distance }
    case 'left': return { x: distance }
    case 'right': return { x: -distance }
    case 'none': return {}
  }
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 40,
  className = '',
  once = true,
  staggerIndex = 0,
  staggerDelay = 0.08,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  const totalDelay = delay + staggerIndex * staggerDelay

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionOffset(direction, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{
        duration,
        delay: totalDelay,
        ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for premium feel
      }}
    >
      {children}
    </motion.div>
  )
}
