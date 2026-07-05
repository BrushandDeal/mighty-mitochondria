import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial, MeshBasicMaterial, AdditiveBlending } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { page } from '../journeyRanges.js'

/*
 * FrontierScene — JOURNEY.md Scene 9, "The frontier (active research)". A cooler,
 * more open constellation than the settled Scene 8: three glowing nodes, each a
 * research beat named in a card (see App.jsx). This sits AFTER the threshold, so
 * the palette is deliberately bluer/indigo (cooler) than the settled cyan, and
 * still never gold.
 *
 * The three beats trace to RESEARCH.md Part B:
 *  1. Aging: mitochondrial dysfunction is ONE of the hallmarks of aging, not the
 *     single cause (Lopez-Otin 2023).
 *  2. Exercise: endurance training builds more mitochondria, mitochondrial
 *     biogenesis (2025 meta-analysis). No "master switch" overclaim.
 *  3. Disease: MELAS, maternally inherited, hits the hungriest organs; primary
 *     mitochondrial disease is roughly 1 in 5,000.
 *
 * The nodes are strung further out along +z (z = 62, 70, 78), past the portal, so
 * when the camera faces them the threshold and settled content sit behind it.
 */

const INDIGO = '#7d8cff' // cooler blue/indigo (distinct from the settled cyan)
const INDIGO_EMISSIVE = '#4a5cd0'
const HALO = '#8fa0ff'

// Each node: world position and the page it is centred on (the beat).
const NODES = [
  { pos: [-2.5, 0.6, 62], at: 36.6 }, // Aging
  { pos: [2.6, -0.3, 70], at: 38.4 }, // Exercise
  { pos: [-2.0, 0.7, 78], at: 40.2 }, // Disease
]

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// A node's activation: 0.2 (a faint glimmer, so the constellation reads at a
// distance) rising to 1 as the camera arrives, then easing back afterward.
const activation = (offset, at) => {
  const inRamp = clamp01((offset - page(at - 1.5)) / page(1.5))
  const outRamp = clamp01((offset - page(at + 0.6)) / page(1.5))
  return 0.2 + 0.8 * inRamp * (1 - outRamp)
}

export function FrontierScene() {
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()
  const nodeRefs = useRef([])
  const timeRef = useRef(0)

  const coreMats = useMemo(
    () =>
      NODES.map(
        () =>
          new MeshStandardMaterial({
            color: INDIGO,
            emissive: INDIGO_EMISSIVE,
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
            color: HALO,
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
    // presence: fade the frontier constellation in as we cross the threshold
    // (page 35.2 -> 36), and hold to the end of the ride.
    const presence = clamp01((offset - page(35.2)) / page(0.8))

    if (!prefersReducedMotion) timeRef.current += delta
    const t = timeRef.current

    for (let i = 0; i < NODES.length; i++) {
      const act = activation(offset, NODES[i].at)
      coreMats[i].opacity = presence
      coreMats[i].emissiveIntensity = 0.3 + 1.7 * act
      haloMats[i].opacity = presence * (0.05 + 0.2 * act)
      const g = nodeRefs.current[i]
      if (g) g.position.y = NODES[i].pos[1] + (prefersReducedMotion ? 0 : 0.06 * Math.sin(t * 0.7 + i))
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
