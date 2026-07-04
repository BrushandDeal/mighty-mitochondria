import { useThree, useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { Vector3 } from 'three'

/*
 * CameraRig — links page scrolling to camera movement.
 *
 * useScroll() (from drei, only works inside <ScrollControls>) gives us
 * `scroll.offset`: a single number from 0 (top of the page) to 1 (bottom).
 * We turn that number into a camera position that orbits around the
 * mitochondrion at the origin and eases closer as you scroll down.
 *
 * This is the core "scroll drives the camera on a rail" idea from JOURNEY.md.
 * Later phases will hand different scroll ranges to different scenes; the
 * mechanism stays the same, which is why this lives in its own reusable file.
 */

// A scratch vector we reuse every frame instead of allocating a new one.
const target = new Vector3()

// Linear interpolation: blend from `a` to `b` by fraction `t` (0..1).
const lerp = (a, b, t) => a + (b - a) * t

export function CameraRig() {
  const scroll = useScroll()
  const { camera } = useThree()

  useFrame((_state, delta) => {
    const offset = scroll.offset // 0 at top, 1 at bottom

    // Orbit a little over a half-turn around the organelle as you scroll,
    // and dolly (move) from far to near. These numbers are just a pleasant
    // placeholder path for Phase 1.
    const angle = offset * Math.PI * 1.2
    const radius = lerp(7, 4.2, offset)
    const height = lerp(0.4, 1.4, offset)

    target.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius)

    // Ease the camera toward the target instead of snapping, so scrolling
    // feels smooth. The `1 - Math.pow(...)` form makes the easing behave the
    // same regardless of frame rate.
    const smoothing = 1 - Math.pow(0.001, delta)
    camera.position.lerp(target, smoothing)
    camera.lookAt(0, 0, 0)
  })

  return null
}
