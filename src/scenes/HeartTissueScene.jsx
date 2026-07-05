import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { page } from '../journeyRanges.js'

/*
 * HeartTissueScene — JOURNEY.md Scene 7, "Zoom out to the body (where the energy
 * goes)". After Quiz Gate 2, the camera spirals OUT of the mitochondrion; this
 * scene is what it lands in: a heart-muscle cell packed wall-to-wall with
 * mitochondria, pulsing like a heartbeat.
 *
 * Fact this scene teaches (RESEARCH.md Part A): human heart muscle is roughly a
 * QUARTER mitochondria by volume (direct morphometry, about 23%). The copy in
 * App.jsx says "about a quarter", never a third.
 *
 * Colour grammar (JOURNEY.md section 4): gold is reserved for energy (the ATP we
 * just watched get minted). So the many mitochondria of the tissue read in the
 * site's STRUCTURAL blue/teal, NOT gold. They are the machinery, not the currency.
 *
 * The field is a cloud of small bean-shaped mitochondria spread around the origin
 * (where our one hero organelle still sits, tiny now). The camera settles far
 * back at Scene 7's waypoints and looks in at the whole packed cloud.
 */

const TEAL = '#2f9fb2' // structural blue/teal (deliberately NOT gold)
const TEAL_EMISSIVE = '#164e59' // a cool inner glow, kept dim so nothing reads as energy

const COUNT = 44 // enough to read as "packed wall to wall" without churning the GPU

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// A double-thump heartbeat envelope over one cycle u in [0, 1): a strong "lub"
// near the start, a softer "dub" after it, then rest. Returns roughly 0..1.
const thump = (u, centre, width) => {
  const d = (u - centre) / width
  return Math.exp(-d * d)
}
const heartbeat = (u) => thump(u, 0.12, 0.05) + 0.6 * thump(u, 0.28, 0.05)

export function HeartTissueScene() {
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()
  const groupRef = useRef(null)
  const timeRef = useRef(0)

  // One shared material so the whole field fades in together (opacity = presence).
  const mat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: TEAL,
        emissive: TEAL_EMISSIVE,
        emissiveIntensity: 0.55,
        roughness: 0.55,
        metalness: 0.05,
        transparent: true,
        opacity: 0,
      }),
    []
  )

  // Deterministic-enough scatter, computed once: a flattened ellipsoidal cloud of
  // little beans around the origin, each with its own size and tilt.
  const beans = useMemo(() => {
    const list = []
    for (let i = 0; i < COUNT; i++) {
      const r = 3 + Math.random() * 8 // ring from just outside the hero organelle to far out
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI * 0.7 // squashed vertically, like a cell interior
      list.push({
        pos: [r * Math.cos(phi) * Math.cos(theta), r * Math.sin(phi) * 0.6, r * Math.cos(phi) * Math.sin(theta)],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        size: 0.32 + Math.random() * 0.4,
      })
    }
    return list
  }, [])

  useFrame((_state, delta) => {
    // presence: fade the tissue in during the outward spiral (page 20 -> 22) so it
    // is already there when the camera settles, and hold it to the end of the ride.
    const presence = clamp01((scroll.offset - page(20)) / page(2))
    mat.opacity = presence

    if (!prefersReducedMotion) timeRef.current += delta
    const t = timeRef.current

    // Rhythmic heartbeat: the whole field swells on the "lub-dub" and eases back.
    // ~1 beat per 0.9s. A gentle scale + a lift in the cool glow, never gold.
    const u = ((t / 0.9) % 1 + 1) % 1
    const beat = prefersReducedMotion ? 0 : heartbeat(u)
    if (groupRef.current) {
      const s = 1 + 0.04 * beat
      groupRef.current.scale.setScalar(s)
    }
    mat.emissiveIntensity = 0.5 + 0.5 * beat
  })

  return (
    <group ref={groupRef}>
      {beans.map((b, i) => (
        <mesh key={i} position={b.pos} rotation={b.rot} scale={[b.size * 1.7, b.size, b.size]} material={mat}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
      ))}
    </group>
  )
}
