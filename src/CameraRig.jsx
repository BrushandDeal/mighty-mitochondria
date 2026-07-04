import { useThree, useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { Vector3 } from 'three'
import { GATE1_OFFSET, SPIRAL_END } from './journeyRanges.js'

/*
 * CameraRig — links page scrolling to camera movement.
 *
 * useScroll() (from drei, only works inside <ScrollControls>) gives us
 * `scroll.offset`: a single number from 0 (top of the page) to 1 (bottom).
 *
 * Two mechanisms:
 *  1. WAYPOINTS — a list of camera poses pinned to scroll positions, smoothly
 *     blended ("lerped") between. Used before the gate AND after the spiral
 *     (for Scene 5).
 *  2. The SPIRAL DIVE — between the gate (GATE1_OFFSET) and SPIRAL_END, the
 *     camera follows a spiral computed directly: it winds inward and settles
 *     into the matrix. This is JOURNEY.md's signature reward.
 *
 * The organelle is centred at the origin. Its outer body is an ellipsoid with
 * half-widths 1.7 x 1 x 1 (front near z = 1); the sealed inner membrane is about
 * 1.45 x 0.8 x 0.8. Scene 5's stations sit on the inner membrane's +z face.
 */
const WAYPOINTS = [
  // Scene 0 / 1 — far overview, drifting in.
  { at: 0.0, pos: [0, 0.5, 7.0], lookAt: [0, 0, 0] },
  // Scene 1 — medium approach (smooth dolly-in from far to medium).
  { at: 0.1, pos: [1.2, 0.6, 4.8], lookAt: [0, 0, 0] },
  // Scene 2 — closing on the outer membrane surface.
  { at: 0.175, pos: [0.4, 0.25, 3.0], lookAt: [0, 0, 0.6] },
  // Scene 2 — right at the membrane; small sideways shift gives gentle parallax.
  { at: 0.242, pos: [0.85, 0.15, 2.4], lookAt: [0.25, 0, 1.0] },
  // Scene 3 — slip through the (now fading) outer membrane into the gap.
  { at: 0.292, pos: [0.15, 0.05, 0.92], lookAt: [0, 0, 0] },
  // Scene 3 — begin the sweep at one end of the fold stack.
  { at: 0.35, pos: [-1.05, 0.08, 1.05], lookAt: [-0.4, 0, 0.15] },
  // Scene 3 — sweep to the far end past wall after wall of cristae.
  { at: 0.4, pos: [1.05, 0.05, 1.05], lookAt: [0.4, 0, 0.15] },
  // Gate 1 hold — sweep-end pose, aim re-centred so the spiral begins seamlessly.
  { at: GATE1_OFFSET, pos: [1.05, 0.05, 1.05], lookAt: [0, 0, 0] },

  // --- Scene 5 (electron transport chain) waypoints, after the spiral ---
  // Spiral-end pose (matches the spiral's final position exactly for a seamless
  // hand-off): floating in the matrix.
  { at: SPIRAL_END, pos: [0.672, 0, 0.672], lookAt: [0, 0, 0] },
  // Turn from the matrix centre to face the inner-membrane wall (matrix side).
  { at: 0.708, pos: [0.1, 0.2, 0.15], lookAt: [-0.3, 0, 0.6] },
  // Establish: at the left end of the station row, looking at the first pumper.
  { at: 0.75, pos: [-1.05, 0.22, 0.08], lookAt: [-0.6, 0, 0.62] },
  // Track along the row to the middle pumper.
  { at: 0.792, pos: [0.1, 0.18, 0.12], lookAt: [0.3, 0, 0.78] },
  // Track to the far pumper at the end of the row (end of the part-one track).
  { at: 0.833, pos: [0.85, 0.16, 0.1], lookAt: [0.95, 0, 0.62] },

  // --- Complex II beat (part two): swing back to the odd-one-out and hold ---
  // Swing: sweep leftward from the far pumper to frame Complex II (x = -0.3),
  // angled low so the electron rising from the matrix side is visible.
  { at: 0.93, pos: [-0.95, 0.18, 0.12], lookAt: [-0.3, -0.05, 0.72] },
  // Hold: settle and linger on Complex II so the side entry and the absence of
  // any pumping are both readable.
  { at: 1.0, pos: [-0.8, 0.12, 0.13], lookAt: [-0.3, -0.05, 0.74] },
]

// Linear interpolation and eased helpers.
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (t) => t * t * (3 - 2 * t)
// A gentler ease (zero velocity AND acceleration at both ends) for the dive.
const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const clamp01 = (v) => Math.min(1, Math.max(0, v))

// Spiral-dive parameters. Start pose matches the Gate 1 hold pose [1.05, _, 1.05]
// so the transition is seamless: that point is at angle 45 degrees, radius ~1.485.
const SPIRAL_START_ANGLE = Math.PI / 4
const SPIRAL_START_RADIUS = Math.hypot(1.05, 1.05)
const SPIRAL_SETTLE_RADIUS = 0.95 // where the float settles — kept back so the
// matrix has breathing room rather than filling the frame
const SPIRAL_TURNS = 1.0 // a single gentle turn, not a dizzying wind

// Scratch objects reused every frame instead of allocating new ones.
const posTarget = new Vector3()
const lookTarget = new Vector3()
const currentLook = new Vector3(0, 0, 0) // persists so the aim eases too

export function CameraRig() {
  const scroll = useScroll()
  const { camera } = useThree()

  useFrame((_state, delta) => {
    const offset = scroll.offset // 0 at top, 1 at bottom

    if (offset >= GATE1_OFFSET && offset <= SPIRAL_END) {
      // --- Spiral dive into the matrix ---
      const u = clamp01((offset - GATE1_OFFSET) / (SPIRAL_END - GATE1_OFFSET))
      // Ease the angle too, so the turn accelerates in and decelerates to a rest
      // rather than sweeping at a constant, mechanical rate.
      const angle = SPIRAL_START_ANGLE + smootherstep(u) * SPIRAL_TURNS * Math.PI * 2
      // Wind inward on the same gentle ease, so the whole dive settles smoothly.
      const radius = lerp(SPIRAL_START_RADIUS, SPIRAL_SETTLE_RADIUS, smootherstep(u))
      const y = lerp(0.05, 0.0, u)
      posTarget.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius)
      lookTarget.set(0, 0, 0)
    } else {
      // --- Waypoint rail (before the gate, and again for Scene 5) ---
      let a = WAYPOINTS[0]
      let b = WAYPOINTS[WAYPOINTS.length - 1]
      for (let i = 0; i < WAYPOINTS.length - 1; i++) {
        if (offset >= WAYPOINTS[i].at && offset <= WAYPOINTS[i + 1].at) {
          a = WAYPOINTS[i]
          b = WAYPOINTS[i + 1]
          break
        }
      }
      const span = b.at - a.at || 1
      const t = smoothstep(clamp01((offset - a.at) / span))
      posTarget.set(
        lerp(a.pos[0], b.pos[0], t),
        lerp(a.pos[1], b.pos[1], t),
        lerp(a.pos[2], b.pos[2], t)
      )
      lookTarget.set(
        lerp(a.lookAt[0], b.lookAt[0], t),
        lerp(a.lookAt[1], b.lookAt[1], t),
        lerp(a.lookAt[2], b.lookAt[2], t)
      )
    }

    // Ease the camera toward the target each frame instead of snapping. The
    // `1 - Math.pow(...)` form keeps the easing consistent across frame rates.
    const smoothing = 1 - Math.pow(0.001, delta)
    camera.position.lerp(posTarget, smoothing)
    currentLook.lerp(lookTarget, smoothing)
    camera.lookAt(currentLook)
  })

  return null
}
