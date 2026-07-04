import { useThree, useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { Vector3 } from 'three'

/*
 * CameraRig — links page scrolling to camera movement, using WAYPOINTS.
 *
 * useScroll() (from drei, only works inside <ScrollControls>) gives us
 * `scroll.offset`: a single number from 0 (top of the page) to 1 (bottom).
 *
 * A "waypoint" is a saved camera pose pinned to a scroll position:
 *   at     — where on the scroll (0 = top, 1 = bottom) this pose is reached
 *   pos    — where the camera sits in the 3D world
 *   lookAt — the point the camera aims at
 *
 * As you scroll, the camera smoothly blends ("lerps", i.e. gradually mixes)
 * from one waypoint to the next. To add a future scene, add another waypoint in
 * scroll order and lengthen ScrollControls' `pages` in App.jsx to match.
 *
 * The organelle is centred at the origin (0,0,0). Its outer body is an ellipsoid
 * (a squashed sphere) with half-widths 1.7 x 1 x 1, so its front surface sits at
 * about z = 1. The last waypoints sit just outside that surface.
 */
const WAYPOINTS = [
  // Scene 0 / 1 — far overview, drifting in.
  { at: 0.0, pos: [0, 0.5, 7.0], lookAt: [0, 0, 0] },
  // Scene 1 — medium approach (smooth dolly-in from far to medium).
  { at: 0.28, pos: [1.2, 0.6, 4.8], lookAt: [0, 0, 0] },
  // Scene 2 — closing on the outer membrane surface.
  { at: 0.47, pos: [0.4, 0.25, 3.0], lookAt: [0, 0, 0.6] },
  // Scene 2 — right at the membrane; the small sideways shift of the camera
  // (x: 0.4 -> 0.85) while looking at the surface creates gentle parallax.
  { at: 0.6, pos: [0.85, 0.15, 2.4], lookAt: [0.25, 0, 1.0] },
  // Scene 3 — slip through the (now fading) outer membrane, near the axis so
  // there is depth to travel through, into the narrow intermembrane space.
  { at: 0.7, pos: [0.15, 0.05, 0.92], lookAt: [0, 0, 0] },
  // Scene 3 — begin the sweep: drop to one end of the fold stack, off to the
  // near side, looking along the folds.
  { at: 0.82, pos: [-1.05, 0.08, 1.05], lookAt: [-0.4, 0, 0.15] },
  // Scene 3 — sweep to the far end past wall after wall of cristae (the sideways
  // travel reveals the folds one by one).
  { at: 1.0, pos: [1.05, 0.05, 1.05], lookAt: [0.4, 0, 0.15] },
]

// Linear interpolation: blend from `a` to `b` by fraction `t` (0..1).
const lerp = (a, b, t) => a + (b - a) * t
// Ease t so movement accelerates and decelerates instead of being mechanical.
const smoothstep = (t) => t * t * (3 - 2 * t)
const clamp01 = (v) => Math.min(1, Math.max(0, v))

// Scratch objects reused every frame instead of allocating new ones.
const posTarget = new Vector3()
const lookTarget = new Vector3()
const currentLook = new Vector3(0, 0, 0) // persists so the aim eases too

export function CameraRig() {
  const scroll = useScroll()
  const { camera } = useThree()

  useFrame((_state, delta) => {
    const offset = scroll.offset // 0 at top, 1 at bottom

    // Find the pair of waypoints [a, b] the current scroll sits between.
    let a = WAYPOINTS[0]
    let b = WAYPOINTS[WAYPOINTS.length - 1]
    for (let i = 0; i < WAYPOINTS.length - 1; i++) {
      if (offset >= WAYPOINTS[i].at && offset <= WAYPOINTS[i + 1].at) {
        a = WAYPOINTS[i]
        b = WAYPOINTS[i + 1]
        break
      }
    }

    // How far between a and b we are (0..1), eased for a cinematic feel.
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

    // Ease the camera toward the target each frame instead of snapping. The
    // `1 - Math.pow(...)` form keeps the easing consistent across frame rates.
    const smoothing = 1 - Math.pow(0.001, delta)
    camera.position.lerp(posTarget, smoothing)
    currentLook.lerp(lookTarget, smoothing)
    camera.lookAt(currentLook)
  })

  return null
}
