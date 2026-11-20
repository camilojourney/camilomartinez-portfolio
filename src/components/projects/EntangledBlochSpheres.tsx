'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  ELLIPSE_TILT,
  INITIAL_BLOCH_STATE,
  KEYBOARD_ROTATION_STEP,
  antipodeState,
  buildEntanglementWavePath,
  computeBlochLayout,
  formatBlochReadout,
  formatMeasurementTally,
  measureSingletPair,
  projectBlochVector,
  shortestAngleDelta,
  steerFromPointer,
  type BlochLayout,
} from '@/lib/quantum-bloch'

const INITIAL_LAYOUT = computeBlochLayout(600, 120)
const INITIAL_PARTNER = antipodeState(INITIAL_BLOCH_STATE.theta, INITIAL_BLOCH_STATE.phi)
const INITIAL_VECTORS = [
  projectBlochVector(
    INITIAL_LAYOUT.spheres[0].cx,
    INITIAL_LAYOUT.cy,
    INITIAL_LAYOUT.radius,
    INITIAL_BLOCH_STATE.theta,
    INITIAL_BLOCH_STATE.phi,
  ),
  projectBlochVector(
    INITIAL_LAYOUT.spheres[1].cx,
    INITIAL_LAYOUT.cy,
    INITIAL_LAYOUT.radius,
    INITIAL_PARTNER.theta,
    INITIAL_PARTNER.phi,
  ),
] as const
const INITIAL_WAVE_PATH = buildEntanglementWavePath(
  INITIAL_LAYOUT.waveStart,
  INITIAL_LAYOUT.waveEnd,
  INITIAL_LAYOUT.cy,
  0,
  0,
)
const INITIAL_READOUT = formatBlochReadout(INITIAL_BLOCH_STATE.theta, false)

const HOLD_DURATION_MS = 1100
const FLASH_DURATION_MS = 1000
const WAVE_SPEED_RAD_PER_SEC = 2.2
const IDLE_DRIFT_RAD_PER_SEC = 0.25
const BUTTON_ARIA_LABEL =
  'Two entangled qubits on Bloch spheres, joined by a wave. Move the pointer near either sphere to steer its state; the partner always takes the opposite state. Arrow keys rotate, Enter or Space measures both.'

interface SphereRefs {
  body: SVGCircleElement | null
  eq: SVGEllipseElement | null
  mer: SVGEllipseElement | null
  ax: SVGLineElement | null
  l0: SVGTextElement | null
  l1: SVGTextElement | null
  vec: SVGLineElement | null
  tip: SVGCircleElement | null
  label: SVGTextElement | null
}

interface ReadoutRefs {
  a: HTMLSpanElement | null
  b: HTMLSpanElement | null
  p: HTMLSpanElement | null
  measured: HTMLSpanElement | null
}

interface AnimationState {
  theta: number
  phi: number
  tTheta: number
  tPhi: number
  swell: number
  tSwell: number
  phase: number
  heldUntil: number
  pairs: number
  pointerNear: boolean
}

function emptySphereRefs(): SphereRefs {
  return {
    body: null,
    eq: null,
    mer: null,
    ax: null,
    l0: null,
    l1: null,
    vec: null,
    tip: null,
    label: null,
  }
}

function setAttrs(el: SVGElement | null, attrs: Record<string, string | number>) {
  if (!el) return
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value))
  }
}

function applySphereLayout(refs: SphereRefs, cx: number, layout: BlochLayout) {
  const { radius: r, cy } = layout
  setAttrs(refs.body, { cx, cy, r })
  setAttrs(refs.eq, { cx, cy, rx: r, ry: r * ELLIPSE_TILT })
  setAttrs(refs.mer, { cx, cy, rx: r * ELLIPSE_TILT, ry: r })
  setAttrs(refs.ax, { x1: cx, x2: cx, y1: cy - r, y2: cy + r })
  setAttrs(refs.l0, { x: cx + 4, y: layout.labelZeroY })
  setAttrs(refs.l1, { x: cx + 4, y: layout.labelOneY })
  setAttrs(refs.label, { x: cx, y: layout.nameY })
  setAttrs(refs.vec, { x1: cx, y1: cy })
}

function paintBlochState(
  spheres: readonly [SphereRefs, SphereRefs],
  waveEl: SVGPathElement | null,
  readoutEls: ReadoutRefs,
  lastReadoutKey: { current: string },
  layout: BlochLayout,
  state: AnimationState,
) {
  const hot = state.swell > 0.3

  for (const i of [0, 1] as const) {
    const refs = spheres[i]
    const sphere = layout.spheres[i]
    const angles = i === 0 ? { theta: state.theta, phi: state.phi } : antipodeState(state.theta, state.phi)
    const pt = projectBlochVector(sphere.cx, layout.cy, layout.radius, angles.theta, angles.phi)

    setAttrs(refs.vec, { x2: pt.x.toFixed(2), y2: pt.y.toFixed(2) })
    setAttrs(refs.tip, { cx: pt.x.toFixed(2), cy: pt.y.toFixed(2) })
    if (refs.body) {
      if (hot) refs.body.setAttribute('data-hot', 'true')
      else refs.body.removeAttribute('data-hot')
    }
  }

  waveEl?.setAttribute(
    'd',
    buildEntanglementWavePath(layout.waveStart, layout.waveEnd, layout.cy, state.swell, state.phase),
  )

  const isMeasured = state.heldUntil > 0
  const readout = formatBlochReadout(state.theta, isMeasured)
  const key = `${readout.a}|${readout.b}|${readout.p0Percent}|${isMeasured ? 1 : 0}`
  // Skip DOM text writes during idle drift when theta and measurement state are unchanged.
  if (key === lastReadoutKey.current) return

  lastReadoutKey.current = key
  if (readoutEls.a) readoutEls.a.textContent = `A: ${readout.a}|0⟩ + ${readout.b}|1⟩`
  if (readoutEls.b) readoutEls.b.textContent = `B: ${readout.b}|0⟩ + ${readout.a}|1⟩`
  if (readoutEls.p) readoutEls.p.textContent = `P(A=0) = ${readout.p0Percent}%`
  readoutEls.measured?.classList.toggle('hidden', !isMeasured)
}

function advanceBlochFrame(
  state: AnimationState,
  dt: number,
  ts: number,
  reducedMotion: boolean,
): boolean {
  if (state.heldUntil > 0 && ts >= state.heldUntil) {
    state.heldUntil = 0
  }

  if (reducedMotion) {
    state.theta = state.tTheta
    state.phi = state.tPhi
    state.swell = state.tSwell
    return false
  }

  state.phase += dt * WAVE_SPEED_RAD_PER_SEC
  if (!state.pointerNear && state.heldUntil === 0) {
    state.tPhi += dt * IDLE_DRIFT_RAD_PER_SEC
  }

  // Frame-rate-independent smoothing calibrated to 0.16 / 0.12 at 60Hz.
  const angleEase = dt > 0 ? 1 - Math.pow(1 - 0.16, dt * 60) : 0.16
  const swellEase = dt > 0 ? 1 - Math.pow(1 - 0.12, dt * 60) : 0.12
  state.theta += (state.tTheta - state.theta) * angleEase
  state.phi += shortestAngleDelta(state.phi, state.tPhi) * angleEase
  state.swell += (state.tSwell - state.swell) * swellEase

  return true
}

function applyPointerSteer(
  pending: { clientX: number; clientY: number } | null,
  btn: HTMLButtonElement | null,
  layout: BlochLayout,
  state: AnimationState,
) {
  if (!pending || !btn) return
  const rect = btn.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return

  const x = ((pending.clientX - rect.left) * layout.width) / rect.width
  const y = ((pending.clientY - rect.top) * layout.height) / rect.height
  const steered = steerFromPointer(x, y, layout)
  state.tSwell = steered.swell
  state.pointerNear = steered.pointerNear
  if (state.heldUntil === 0) {
    state.tTheta = steered.theta
    state.tPhi = steered.phi
  }
}

function applyKeyRotation(key: string, state: AnimationState): boolean {
  const actions: Record<string, () => void> = {
    ArrowLeft: () => {
      state.tPhi -= KEYBOARD_ROTATION_STEP
    },
    ArrowRight: () => {
      state.tPhi += KEYBOARD_ROTATION_STEP
    },
    ArrowUp: () => {
      state.tTheta = Math.max(0, state.tTheta - KEYBOARD_ROTATION_STEP)
    },
    ArrowDown: () => {
      state.tTheta = Math.min(Math.PI, state.tTheta + KEYBOARD_ROTATION_STEP)
    },
  }
  const action = actions[key]
  if (!action) return false
  action()
  state.heldUntil = 0
  state.pointerNear = true
  return true
}

function setPoleHitFlash(
  spheres: readonly [SphereRefs, SphereRefs],
  outA: 0 | 1,
  outB: 0 | 1,
  timers: { flash: ReturnType<typeof setTimeout> | null },
) {
  const [refsA, refsB] = spheres
  for (const pole of [refsA.l0, refsA.l1, refsB.l0, refsB.l1]) {
    pole?.removeAttribute('data-hit')
  }

  const hitA = outA === 0 ? refsA.l0 : refsA.l1
  const hitB = outB === 0 ? refsB.l0 : refsB.l1
  hitA?.setAttribute('data-hit', 'true')
  hitB?.setAttribute('data-hit', 'true')

  if (timers.flash) clearTimeout(timers.flash)
  timers.flash = setTimeout(() => {
    hitA?.removeAttribute('data-hit')
    hitB?.removeAttribute('data-hit')
    timers.flash = null
  }, FLASH_DURATION_MS)
}

export default function EntangledBlochSpheres() {
  const [tallyText, setTallyText] = useState('Click to measure the pair.')

  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const waveRef = useRef<SVGPathElement | null>(null)
  const readoutRefs = useRef<ReadoutRefs>({ a: null, b: null, p: null, measured: null })
  const sphereRefs = useRef<[SphereRefs, SphereRefs]>([emptySphereRefs(), emptySphereRefs()])

  const layoutRef = useRef<BlochLayout>(INITIAL_LAYOUT)
  const rafRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const isVisibleRef = useRef<boolean>(true)
  const reducedMotionRef = useRef<boolean>(false)
  const pendingPointerRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const timersRef = useRef<{
    flash: ReturnType<typeof setTimeout> | null
    hold: ReturnType<typeof setTimeout> | null
  }>({ flash: null, hold: null })
  const lastReadoutKeyRef = useRef<string>(
    `${INITIAL_READOUT.a}|${INITIAL_READOUT.b}|${INITIAL_READOUT.p0Percent}|0`,
  )

  const stateRef = useRef<AnimationState>({
    theta: INITIAL_BLOCH_STATE.theta,
    phi: INITIAL_BLOCH_STATE.phi,
    tTheta: INITIAL_BLOCH_STATE.theta,
    tPhi: INITIAL_BLOCH_STATE.phi,
    swell: 0,
    tSwell: 0,
    phase: 0,
    heldUntil: 0,
    pairs: 0,
    pointerNear: false,
  })

  const paint = useCallback(() => {
    paintBlochState(
      sphereRefs.current,
      waveRef.current,
      readoutRefs.current,
      lastReadoutKeyRef,
      layoutRef.current,
      stateRef.current,
    )
  }, [])

  const syncLayout = useCallback(() => {
    const btn = buttonRef.current
    const svg = svgRef.current
    if (!btn || !svg) return

    const rect = btn.getBoundingClientRect()
    const layout = computeBlochLayout(rect.width, rect.height)
    layoutRef.current = layout
    svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`)

    for (const i of [0, 1] as const) {
      applySphereLayout(sphereRefs.current[i], layout.spheres[i].cx, layout)
    }
    paint()
  }, [paint])

  const stopLoop = useCallback(() => {
    if (!rafRef.current) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }, [])

  const kick = useCallback(() => {
    if (rafRef.current) return

    const step = (ts: number) => {
      rafRef.current = 0
      const dt = lastFrameRef.current > 0 ? Math.min(0.05, Math.max(0, (ts - lastFrameRef.current) / 1000)) : 0
      lastFrameRef.current = ts

      const pending = pendingPointerRef.current
      pendingPointerRef.current = null
      applyPointerSteer(pending, buttonRef.current, layoutRef.current, stateRef.current)

      const keepRunning = advanceBlochFrame(stateRef.current, dt, ts, reducedMotionRef.current)
      paint()

      if (keepRunning && !document.hidden && isVisibleRef.current) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    lastFrameRef.current = performance.now()
    rafRef.current = requestAnimationFrame(step)
  }, [paint])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = mq.matches

    const syncRunningState = () => {
      if (reducedMotionRef.current || document.hidden || !isVisibleRef.current) {
        stopLoop()
        paint()
      } else {
        kick()
      }
    }

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches
      syncRunningState()
    }

    mq.addEventListener('change', onMotionChange)
    document.addEventListener('visibilitychange', syncRunningState)

    const btn = buttonRef.current
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncLayout) : null
    if (btn) resizeObserver?.observe(btn)

    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              isVisibleRef.current = entries.some((entry) => entry.isIntersecting)
              syncRunningState()
            },
            { threshold: 0 },
          )
        : null
    if (btn) intersectionObserver?.observe(btn)

    const timers = timersRef.current
    syncLayout()
    syncRunningState()

    return () => {
      stopLoop()
      if (timers.flash) clearTimeout(timers.flash)
      if (timers.hold) clearTimeout(timers.hold)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      mq.removeEventListener('change', onMotionChange)
      document.removeEventListener('visibilitychange', syncRunningState)
    }
  }, [kick, paint, stopLoop, syncLayout])

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      pendingPointerRef.current = { clientX: event.clientX, clientY: event.clientY }
      kick()
    },
    [kick],
  )

  const handlePointerLeave = useCallback(() => {
    pendingPointerRef.current = null
    stateRef.current.tSwell = 0
    stateRef.current.pointerNear = false
    kick()
  }, [kick])

  const handleMeasure = useCallback(() => {
    const state = stateRef.current
    const outcome = measureSingletPair(state.theta)
    state.tTheta = outcome.collapsedTheta
    state.theta = outcome.collapsedTheta
    state.heldUntil = performance.now() + HOLD_DURATION_MS
    state.pairs += 1

    const timers = timersRef.current
    setPoleHitFlash(sphereRefs.current, outcome.outA, outcome.outB, timers)

    if (timers.hold) clearTimeout(timers.hold)
    timers.hold = setTimeout(() => {
      stateRef.current.heldUntil = 0
      timers.hold = null
      paint()
    }, HOLD_DURATION_MS)

    setTallyText(formatMeasurementTally(state.pairs, outcome))
    paint()
    if (!reducedMotionRef.current) kick()
  }, [kick, paint])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!applyKeyRotation(event.key, stateRef.current)) return
      event.preventDefault()
      kick()
    },
    [kick],
  )

  const handleBlur = useCallback(() => {
    stateRef.current.pointerNear = false
    if (!reducedMotionRef.current) kick()
  }, [kick])

  return (
    <div className="min-w-0" data-testid="entangled-bloch-spheres">
      <button
        ref={buttonRef}
        type="button"
        className="entangled-pair"
        aria-label={BUTTON_ARIA_LABEL}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleMeasure}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${INITIAL_LAYOUT.width} ${INITIAL_LAYOUT.height}`}
          aria-hidden="true"
        >
          <path ref={waveRef} className="entangled-wave" d={INITIAL_WAVE_PATH} />
          {([0, 1] as const).map((index) => {
            const sphere = INITIAL_LAYOUT.spheres[index]
            const vec = INITIAL_VECTORS[index]
            const r = INITIAL_LAYOUT.radius
            const cy = INITIAL_LAYOUT.cy
            return (
              <g key={sphere.name}>
                <circle
                  ref={(el) => {
                    sphereRefs.current[index].body = el
                  }}
                  className="entangled-sphere"
                  cx={sphere.cx}
                  cy={cy}
                  r={r}
                />
                <ellipse
                  ref={(el) => {
                    sphereRefs.current[index].eq = el
                  }}
                  className="entangled-ring"
                  cx={sphere.cx}
                  cy={cy}
                  rx={r}
                  ry={r * ELLIPSE_TILT}
                />
                <ellipse
                  ref={(el) => {
                    sphereRefs.current[index].mer = el
                  }}
                  className="entangled-ring"
                  cx={sphere.cx}
                  cy={cy}
                  rx={r * ELLIPSE_TILT}
                  ry={r}
                />
                <line
                  ref={(el) => {
                    sphereRefs.current[index].ax = el
                  }}
                  className="entangled-axis"
                  x1={sphere.cx}
                  x2={sphere.cx}
                  y1={cy - r}
                  y2={cy + r}
                />
                <text
                  ref={(el) => {
                    sphereRefs.current[index].l0 = el
                  }}
                  className="entangled-pole"
                  x={sphere.cx + 4}
                  y={INITIAL_LAYOUT.labelZeroY}
                >
                  |0⟩
                </text>
                <text
                  ref={(el) => {
                    sphereRefs.current[index].l1 = el
                  }}
                  className="entangled-pole"
                  x={sphere.cx + 4}
                  y={INITIAL_LAYOUT.labelOneY}
                >
                  |1⟩
                </text>
                <line
                  ref={(el) => {
                    sphereRefs.current[index].vec = el
                  }}
                  className="entangled-vec"
                  x1={sphere.cx}
                  y1={cy}
                  x2={vec.x.toFixed(2)}
                  y2={vec.y.toFixed(2)}
                />
                <circle
                  ref={(el) => {
                    sphereRefs.current[index].tip = el
                  }}
                  className="entangled-tip"
                  cx={vec.x.toFixed(2)}
                  cy={vec.y.toFixed(2)}
                  r={3.5}
                />
                <text
                  ref={(el) => {
                    sphereRefs.current[index].label = el
                  }}
                  className="entangled-name"
                  x={sphere.cx}
                  y={INITIAL_LAYOUT.nameY}
                  textAnchor="middle"
                >
                  {sphere.name}
                </text>
              </g>
            )
          })}
        </svg>
      </button>
      <div className="entangled-foot">
        <p className="font-mono tabular-nums" aria-hidden="true">
          <span
            ref={(el) => {
              readoutRefs.current.a = el
            }}
            className="mr-3 inline-block whitespace-nowrap"
          >
            A: {INITIAL_READOUT.a}|0⟩ + {INITIAL_READOUT.b}|1⟩
          </span>
          <span
            ref={(el) => {
              readoutRefs.current.b = el
            }}
            className="mr-3 inline-block whitespace-nowrap"
          >
            B: {INITIAL_READOUT.b}|0⟩ + {INITIAL_READOUT.a}|1⟩
          </span>
          <span
            ref={(el) => {
              readoutRefs.current.p = el
            }}
            className="inline-block whitespace-nowrap"
          >
            P(A=0) = {INITIAL_READOUT.p0Percent}%
          </span>
          <span
            ref={(el) => {
              readoutRefs.current.measured = el
            }}
            className="ml-3 hidden whitespace-nowrap"
          >
            measured
          </span>
        </p>
        <p role="status" aria-live="polite">
          {tallyText}
        </p>
      </div>
    </div>
  )
}
