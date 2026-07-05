import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial, MeshBasicMaterial, AdditiveBlending } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { page } from '../journeyRanges.js'

/*
 * BiggerStoryScene — JOURNEY.md Scene 8, "The bigger story (settled)". A calm
 * constellation of four "did you know" beats. The camera (see CameraRig) drifts
 * out past the heart tissue into open dark space and glides from node to node;
 * each node brightens as we reach it, while a short card (in App.jsx) names the
 * beat. This is still settled science, so it sits BEFORE the threshold.
 *
 * The four beats trace to RESEARCH.md:
 *  1. Endosymbiosis: once free-living bacteria, hence their own DNA (line 56).
 *  2. Maternal inheritance, "essentially all" (line 58).
 *  3. Help trigger apoptosis by releasing cytochrome c (line 60).
 *  4. Beyond ATP: heat, calcium storage, hormone synthesis (line 62).
 *
 * Colour grammar (JOURNEY.md section 4): these nodes are STRUCTURE, not energy,
 * so they read in the site's cyan/teal, never gold. Gold stays reserved for ATP.
 *
 * The nodes are strung along +z (out beyond the origin, where every earlier scene
 * lives), so when the camera faces them it faces AWAY from the tissue and the old
 * content falls behind it (and into fog). That is why Scene 7 needs no fade-out.
 */

const CYAN = '#40cfe0' // structure colour (deliberately not gold)
const CYAN_EMISSIVE = '#2ea6c4' // a slightly deeper teal glow

// Each node: its world position and the page it is centred on (the beat). The
// last node HOLDS its glow through Quiz Gate 3 instead of fading back.
const NODES = [
  { pos: [-3, 0.8, 20], at: 25.2, hold: false },
  { pos: [3, -0.4, 26], at: 26.7, hold: false },
  { pos: [-2.5, 0.9, 32], at: 28.2, hold: false },
  { pos: [2.8, -0.2, 38], at: 30.0, hold: true },
]

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// A node's activation, 0.2 (a faint glimmer, so upcoming nodes read as a distant
// constellation) rising to 1 as the camera arrives, then easing back (except the
// last node, which holds lit into the gate).
const activation = (offset, at, hold) => {
  const inRamp = clamp01((offset - page(at - 1.3)) / page(1.3))
  const outRamp = hold ? 0 : clamp01((offset - page(at + 0.6)) / page(1.4))
  return 0.2 + 0.8 * inRamp * (1 - outRamp)
}

export function BiggerStoryScene() {
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()
  const nodeRefs = useRef([])
  const timeRef = useRef(0)

  // Per-node materials so each can glow on its own schedule. Core = lit teal
  // sphere; halo = a larger additive-blended sphere faking a soft bloom.
  const coreMats = useMemo(
    () =>
      NODES.map(
        () =>
          new MeshStandardMaterial({
            color: CYAN,
            emissive: CYAN_EMISSIVE,
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.0,
            transparent: true,
            opacity: 0,
          })
      ),
    []
  )
  const haloMats = useMemo(
    () =>
      NODES.map(
        () =>
          new MeshBasicMaterial({
            color: CYAN,
            transparent: true,
            opacity: 0,
            blending: AdditiveBlending,
            depthWrite: false,
          })
      ),
    []
  )

  useFrame((_state, delta) => {
    const offset = scroll.offset
    // presence: fade the whole constellation in as the camera drifts out to it
    // (page 24.2 -> 25), and hold to the end of the ride.
    const presence = clamp01((offset - page(24.2)) / page(0.8))

    if (!prefersReducedMotion) timeRef.current += delta
    const t = timeRef.current

    for (let i = 0; i < NODES.length; i++) {
      const act = activation(offset, NODES[i].at, NODES[i].hold)
      coreMats[i].opacity = presence
      coreMats[i].emissiveIntensity = 0.3 + 1.7 * act
      haloMats[i].opacity = presence * (0.05 + 0.2 * act)
      // A gentle idle bob so the nodes feel alive without being busy.
      const g = nodeRefs.current[i]
      if (g) g.position.y = NODES[i].pos[1] + (prefersReducedMotion ? 0 : 0.06 * Math.sin(t * 0.8 + i))
    }
  })

  return (
    <group>
      {NODES.map((n, i) => (
        <group key={i} ref={(el) => (nodeRefs.current[i] = el)} position={n.pos}>
          <mesh material={coreMats[i]}>
            <sphereGeometry args={[0.45, 24, 24]} />
          </mesh>
          <mesh material={haloMats[i]}>
            <sphereGeometry args={[1.1, 24, 24]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
