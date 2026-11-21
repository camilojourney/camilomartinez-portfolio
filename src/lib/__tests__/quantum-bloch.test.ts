import { describe, expect, it } from 'vitest'
import {
  INITIAL_BLOCH_STATE,
  antipodeState,
  buildEntanglementWavePath,
  computeBlochLayout,
  formatBlochReadout,
  formatMeasurementTally,
  measureSingletPair,
  projectBlochVector,
  shortestAngleDelta,
  steerFromPointer,
} from '@/lib/quantum-bloch'

describe('quantum-bloch layout and geometry', () => {
  it('computes desktop layout with 80px spheres and a valid wave span', () => {
    const layout = computeBlochLayout(600, 120)

    expect(layout.width).toBe(600)
    expect(layout.height).toBe(120)
    expect(layout.radius).toBe(40)
    expect(layout.spheres[0].name).toBe('A')
    expect(layout.spheres[1].name).toBe('B')
    expect(layout.spheres[0].cx).toBe(52)
    expect(layout.spheres[1].cx).toBe(548)
    expect(layout.waveStart).toBe(98)
    expect(layout.waveEnd).toBe(502)
    expect(layout.labelZeroY).toBeGreaterThan(0)
    expect(layout.labelOneY).toBeLessThan(layout.nameY)
    expect(layout.nameY).toBeLessThanOrEqual(layout.height)
  })

  it('computes narrow (<600px) 96px-tall layout with 60px spheres and non-overlapping labels', () => {
    const layout = computeBlochLayout(358, 96)

    expect(layout.radius).toBe(30)
    expect(layout.spheres[0].cx).toBe(42)
    expect(layout.spheres[1].cx).toBe(316)
    expect(layout.waveEnd - layout.waveStart).toBeGreaterThan(150)
    // Keep vertical clearance between the |1> pole label and A/B sphere label
    expect(layout.nameY - layout.labelOneY).toBeGreaterThanOrEqual(11)
    expect(layout.labelZeroY).toBeGreaterThanOrEqual(8)
    expect(layout.nameY).toBeLessThanOrEqual(96)
  })

  it('clamps tiny or zero widths so geometry stays well-formed', () => {
    const layout = computeBlochLayout(0, 0)

    expect(layout.width).toBe(240)
    expect(layout.height).toBe(120)
    expect(layout.waveEnd).toBeGreaterThan(layout.waveStart)
  })

  it('projects north pole, south pole, and equator points accurately', () => {
    const north = projectBlochVector(100, 60, 40, 0, 0)
    expect(north.x).toBeCloseTo(100, 6)
    expect(north.y).toBeCloseTo(20, 6)

    const south = projectBlochVector(100, 60, 40, Math.PI, 0)
    expect(south.x).toBeCloseTo(100, 6)
    expect(south.y).toBeCloseTo(100, 6)

    const eqX = projectBlochVector(100, 60, 40, Math.PI / 2, 0)
    expect(eqX.x).toBeCloseTo(140, 6)
    expect(eqX.y).toBeCloseTo(60, 6)

    const eqY = projectBlochVector(100, 60, 40, Math.PI / 2, Math.PI / 2)
    expect(eqY.x).toBeCloseTo(100, 6)
    expect(eqY.y).toBeCloseTo(60 + 40 * 0.28, 6)
  })

  it('keeps singlet partner vectors exactly antipodal across sampled states', () => {
    for (let i = 0; i <= 20; i += 1) {
      const theta = (Math.PI * i) / 20
      for (let j = 0; j < 12; j += 1) {
        const phi = -Math.PI + (Math.PI * 2 * j) / 12
        const partner = antipodeState(theta, phi)
        const a = projectBlochVector(0, 0, 40, theta, phi)
        const b = projectBlochVector(0, 0, 40, partner.theta, partner.phi)
        expect(a.x + b.x).toBeCloseTo(0, 6)
        expect(a.y + b.y).toBeCloseTo(0, 6)
      }
    }
  })
})

describe('entanglement wave and angle utilities', () => {
  it('builds a tapered travelling wave path whose amplitude scales with swell', () => {
    const restPath = buildEntanglementWavePath(100, 500, 60, 0, 0)
    const excitedPath = buildEntanglementWavePath(100, 500, 60, 1, 0)

    expect(restPath.startsWith('M100.0 60.0')).toBe(true)
    expect(restPath).toContain(' L')

    const maxExcursion = (path: string, cy: number) =>
      Math.max(
        ...path
          .split(/[ML]/)
          .filter(Boolean)
          .map((pair) => Math.abs(Number(pair.trim().split(' ')[1]) - cy)),
      )

    expect(maxExcursion(restPath, 60)).toBeLessThanOrEqual(3.05)
    expect(maxExcursion(excitedPath, 60)).toBeGreaterThan(10)
    expect(maxExcursion(excitedPath, 60)).toBeLessThanOrEqual(12.05)
  })

  it('returns an empty wave path when span is non-positive', () => {
    expect(buildEntanglementWavePath(200, 200, 60, 0.5, 0)).toBe('')
    expect(buildEntanglementWavePath(220, 180, 60, 0.5, 0)).toBe('')
  })

  it('computes shortest signed angular delta across branch cuts and multi-turn drift', () => {
    expect(shortestAngleDelta(3.1, -3.1)).toBeCloseTo(Math.PI * 2 - 6.2, 6)
    expect(shortestAngleDelta(-3.1, 3.1)).toBeCloseTo(-(Math.PI * 2 - 6.2), 6)
    expect(Math.abs(shortestAngleDelta(15.2, 0.2))).toBeLessThanOrEqual(Math.PI)
  })
})

describe('pointer steering, measurement, and readout formatting', () => {
  it('steers sphere A directly when pointer is near A and mirrors when near B', () => {
    const layout = computeBlochLayout(600, 120)
    const atCenterA = steerFromPointer(layout.spheres[0].cx, layout.cy, layout)
    expect(atCenterA.pointerNear).toBe(true)
    expect(atCenterA.swell).toBeCloseTo(1, 6)
    expect(atCenterA.theta).toBeCloseTo(0, 6)

    const atCenterB = steerFromPointer(layout.spheres[1].cx, layout.cy, layout)
    expect(atCenterB.pointerNear).toBe(true)
    expect(atCenterB.swell).toBeCloseTo(1, 6)
    expect(atCenterB.theta).toBeCloseTo(Math.PI, 6)

    const farMidpoint = steerFromPointer(300, layout.cy, layout)
    expect(farMidpoint.pointerNear).toBe(false)
    expect(farMidpoint.swell).toBe(0)
  })

  it('measures singlet pairs with Born probabilities and always opposite outcomes', () => {
    const north = measureSingletPair(0, 0.999)
    expect(north).toEqual({ outA: 0, outB: 1, p0Percent: 100, collapsedTheta: 0 })

    const south = measureSingletPair(Math.PI, 0)
    expect(south).toEqual({ outA: 1, outB: 0, p0Percent: 0, collapsedTheta: Math.PI })

    const eqZero = measureSingletPair(Math.PI / 2, 0.49)
    expect(eqZero).toEqual({ outA: 0, outB: 1, p0Percent: 50, collapsedTheta: 0 })

    const eqOne = measureSingletPair(Math.PI / 2, 0.5)
    expect(eqOne).toEqual({ outA: 1, outB: 0, p0Percent: 50, collapsedTheta: Math.PI })

    for (let i = 0; i <= 10; i += 1) {
      const theta = (Math.PI * i) / 10
      for (const r of [0, 0.1, 0.5, 0.9, 0.9999]) {
        const res = measureSingletPair(theta, r)
        expect(res.outA + res.outB).toBe(1)
        expect(res.collapsedTheta).toBe(res.outA === 0 ? 0 : Math.PI)
      }
    }
  })

  it.each([
    [0, '+ 0.71', '- 0.71'],
    [Math.PI / 2, '+ 0.71i', '- 0.71i'],
    [Math.PI, '- 0.71', '+ 0.71'],
    [3 * Math.PI / 2, '- 0.71i', '+ 0.71i'],
    [Math.PI / 4, '+ (0.50+0.50i)', '+ (-0.50-0.50i)'],
    [-Math.PI / 4, '+ (0.50-0.50i)', '+ (-0.50+0.50i)'],
    [3 * Math.PI / 4, '+ (-0.50+0.50i)', '+ (0.50-0.50i)'],
    [5 * Math.PI / 4, '+ (-0.50-0.50i)', '+ (0.50+0.50i)'],
    [-4 * Math.PI, '+ 0.71', '- 0.71'],
  ] as const)('includes opposite relative phases at azimuth %s', (phi, aTerm, bTerm) => {
    expect(formatBlochReadout(Math.PI / 2, phi, true)).toEqual({
      a: `0.71|0⟩ ${aTerm}|1⟩`,
      b: `0.71|0⟩ ${bTerm}|1⟩`,
      p0Percent: 50,
      measured: true,
    })
  })

  it.each([0, Math.PI])('keeps polar readouts finite and probabilities complementary at theta %s', (theta) => {
    const readout = formatBlochReadout(theta, 0, true)
    expect(readout.a).toBe(theta === 0 ? '1.00|0⟩ + 0.00|1⟩' : '0.00|0⟩ + 1.00|1⟩')
    expect(readout.b).toBe(theta === 0 ? '0.00|0⟩ - 1.00|1⟩' : '1.00|0⟩ + 0.00|1⟩')
    expect(readout.p0Percent).toBe(theta === 0 ? 100 : 0)
  })

  it('formats the initial complex expansions and measurement tally', () => {
    const readout = formatBlochReadout(INITIAL_BLOCH_STATE.theta, INITIAL_BLOCH_STATE.phi, false)
    expect(readout).toEqual({
      a: '0.90|0⟩ + (0.36-0.25i)|1⟩',
      b: '0.43|0⟩ + (-0.74+0.51i)|1⟩',
      p0Percent: 81,
      measured: false,
    })

    const single = formatMeasurementTally(1, {
      outA: 0,
      outB: 1,
      p0Percent: 81,
      collapsedTheta: 0,
    })
    expect(single).toBe(
      'Pair 1: A |0⟩, B |1⟩ (P(A=0) was 81%). 1 pair measured, opposite every time.',
    )

    const multiple = formatMeasurementTally(3, {
      outA: 1,
      outB: 0,
      p0Percent: 19,
      collapsedTheta: Math.PI,
    })
    expect(multiple).toBe(
      'Pair 3: A |1⟩, B |0⟩ (P(A=0) was 19%). 3 pairs measured, opposite every time.',
    )
  })
})
