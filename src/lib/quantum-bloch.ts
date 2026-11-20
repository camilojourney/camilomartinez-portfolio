/**
 * Pure geometry, state, and measurement math for the Concept 4 entangled Bloch spheres.
 * Sphere A shows (theta, phi); sphere B always shows the antipode (pi - theta, phi + pi)
 * representing a singlet entangled pair.
 */

export interface BlochAngles {
  theta: number
  phi: number
}

export interface SphereGeometry {
  name: 'A' | 'B'
  cx: number
}

export interface BlochLayout {
  width: number
  height: number
  radius: number
  cy: number
  spheres: readonly [SphereGeometry, SphereGeometry]
  waveStart: number
  waveEnd: number
  labelZeroY: number
  labelOneY: number
  nameY: number
}

export interface ProjectedPoint {
  x: number
  y: number
}

export interface PointerSteerResult {
  theta: number
  phi: number
  swell: number
  pointerNear: boolean
}

export interface MeasurementOutcome {
  outA: 0 | 1
  outB: 0 | 1
  p0Percent: number
  collapsedTheta: number
}

export interface BlochReadout {
  a: string
  b: string
  p0Percent: number
  measured: boolean
}

export const INITIAL_BLOCH_STATE: Readonly<BlochAngles> = {
  theta: 0.9,
  phi: -0.6,
}

export const KEYBOARD_ROTATION_STEP = Math.PI / 12
export const POINTER_INFLUENCE_RADIUS = 180
export const WAVE_CYCLES = 5
export const WAVE_STEP_PX = 4
export const ELLIPSE_TILT = 0.28

const MIN_WIDTH = 240
const DEFAULT_HEIGHT = 120
const DESKTOP_HEIGHT_THRESHOLD = 110
const DESKTOP_RADIUS = 40
const COMPACT_RADIUS = 30
const SPHERE_EDGE_PADDING = 12
const WAVE_CLEARANCE = 6

export function computeBlochLayout(rawWidth: number, rawHeight: number): BlochLayout {
  const width = Math.max(MIN_WIDTH, rawWidth || 0)
  const height = rawHeight > 0 ? rawHeight : DEFAULT_HEIGHT
  const isDesktop = height >= DESKTOP_HEIGHT_THRESHOLD
  const radius = isDesktop ? DESKTOP_RADIUS : COMPACT_RADIUS
  // Keep vertical clearance between |0>, the sphere, |1>, and the A/B label in both 120px and 96px heights.
  const cy = isDesktop ? radius + 14 : radius + 11
  const cxA = radius + SPHERE_EDGE_PADDING
  const cxB = width - radius - SPHERE_EDGE_PADDING

  return {
    width,
    height,
    radius,
    cy,
    spheres: [
      { name: 'A', cx: cxA },
      { name: 'B', cx: cxB },
    ],
    waveStart: cxA + radius + WAVE_CLEARANCE,
    waveEnd: cxB - radius - WAVE_CLEARANCE,
    labelZeroY: cy - radius - 2,
    labelOneY: cy + radius + 10,
    nameY: height - 2,
  }
}

export function antipodeState(theta: number, phi: number): BlochAngles {
  return {
    theta: Math.PI - theta,
    phi: phi + Math.PI,
  }
}

export function projectBlochVector(
  cx: number,
  cy: number,
  radius: number,
  theta: number,
  phi: number,
): ProjectedPoint {
  const x = Math.sin(theta) * Math.cos(phi)
  const y = Math.sin(theta) * Math.sin(phi)
  const z = Math.cos(theta)
  return {
    x: cx + radius * x,
    y: cy + radius * ELLIPSE_TILT * y - radius * z,
  }
}

export function buildEntanglementWavePath(
  x0: number,
  x1: number,
  cy: number,
  swell: number,
  phase: number,
): string {
  const span = x1 - x0
  if (span <= 0) return ''

  const clampedSwell = Math.max(0, Math.min(1, swell))
  const amplitude = 3 + 9 * clampedSwell
  const k = (Math.PI * 2 * WAVE_CYCLES) / span

  let d = ''
  for (let x = x0; x <= x1; x += WAVE_STEP_PX) {
    const env = Math.sin(((x - x0) / span) * Math.PI)
    const y = cy + amplitude * env * Math.sin(k * x - phase)
    d += `${d ? ' L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
}

/** Shortest signed angle from `from` to `to` in [-pi, pi]. */
export function shortestAngleDelta(from: number, to: number): number {
  const tau = Math.PI * 2
  const wrapped = (((to - from + Math.PI) % tau) + tau) % tau - Math.PI
  return wrapped < -Math.PI ? wrapped + tau : wrapped
}

export function steerFromPointer(
  pointerX: number,
  pointerY: number,
  layout: BlochLayout,
): PointerSteerResult {
  const [sphereA, sphereB] = layout.spheres
  const dA = Math.hypot(pointerX - sphereA.cx, pointerY - layout.cy)
  const dB = Math.hypot(pointerX - sphereB.cx, pointerY - layout.cy)
  const nearestDist = Math.min(dA, dB)
  const swell = Math.max(0, 1 - nearestDist / POINTER_INFLUENCE_RADIUS)
  const pointerNear = nearestDist < POINTER_INFLUENCE_RADIUS

  const nearA = dA < dB
  const targetSphere = nearA ? sphereA : sphereB
  const angle = Math.atan2(pointerY - layout.cy, pointerX - targetSphere.cx)
  const dist = Math.min(1, Math.hypot(pointerX - targetSphere.cx, pointerY - layout.cy) / (layout.radius * 2.2))

  const theta = nearA ? dist * Math.PI : Math.PI - dist * Math.PI
  const phi = nearA ? angle : angle + Math.PI

  return { theta, phi, swell, pointerNear }
}

export function measureSingletPair(theta: number, randomValue: number = Math.random()): MeasurementOutcome {
  // Half-angle identity cos^2(theta/2) = (1 + cos(theta)) / 2 is exact at 0, pi/2, and pi in IEEE-754.
  const p0 = Math.max(0, Math.min(1, (1 + Math.cos(theta)) / 2))
  const outA: 0 | 1 = randomValue < p0 ? 0 : 1
  const outB: 0 | 1 = outA === 0 ? 1 : 0
  return {
    outA,
    outB,
    p0Percent: Math.round(p0 * 100),
    collapsedTheta: outA === 1 ? Math.PI : 0,
  }
}

export function formatBlochReadout(theta: number, measured: boolean): BlochReadout {
  const a = Math.cos(theta / 2)
  const b = Math.sin(theta / 2)
  return {
    a: a.toFixed(2),
    b: b.toFixed(2),
    p0Percent: Math.round(a * a * 100),
    measured,
  }
}

export function formatMeasurementTally(pairs: number, outcome: MeasurementOutcome): string {
  const plural = pairs === 1 ? '' : 's'
  return `Pair ${pairs}: A |${outcome.outA}⟩, B |${outcome.outB}⟩ (P(A=0) was ${outcome.p0Percent}%). ${pairs} pair${plural} measured, opposite every time.`
}
