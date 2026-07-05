import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial, DoubleSide } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { page } from '../journeyRanges.js'

/*
 * WholeCellScene — JOURNEY.md Scene 10, "Closing". The camera pulls back to a
 * whole cell: a large translucent membrane holding many small mitochondria that
 * glow together, a gentle final swell. This is where the closing copy (App.jsx)
 * lands and the ride comes to rest.
 *
 * Colour grammar: the mitochondria glow in the structural teal (gold stays
 * reserved for energy, even in the finale). The membrane is a faint cool shell.
 *
 * The cell is centred far out on the forward path (z = 88) so the pull-back frames
 * it whole; everything earlier sits behind the camera by now.
 */

const CENTER = [0, 0.6, 88]
const MEMBRANE = '#3f74a0' // faint cool shell
const MITO = '#2f9fb2' // structural teal (not gold)
const MITO_EMISSIVE = '#164e59'
const CELL_R = 5 // cell radius
const COUNT = 42 // many mitochondria, "packed" but not churning the GPU

const clamp01 = (v) => Math.min(1, Math.max(0, v))

export function WholeCellScene() {
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()
  const timeRef = useRef(0)

  const membraneMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: MEMBRANE,
        emissive: MEMBRANE,
        emissiveIntensity: 0.15,
        roughness: 0.6,
        metalness: 0.0,
        transparent: true,
        opacity: 0,
        side: DoubleSide,
        depthWrite: false,
      }),
    []
  )

  // One shared material so all the interior mitochondria fade and breathe together.
  const mitoMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: MITO,
        emissive: MITO_EMISSIVE,
        emissiveIntensity: 0.5,
        roughness: 0.5,
        metalness: 0.05,
        transparent: true,
        opacity: 0,
      }),
    []
  )

  // Scatter the interior mitochondria once, inside the membrane.
  const mitos = useMemo(() => {
    const list = []
    for (let i = 0; i < COUNT; i++) {
      // A point inside the sphere (rejection-free: scale a random direction by a
      // cube-rooted radius for a roughly even fill).
      const u = Math.random()
      const r = CELL_R * 0.85 * Math.cbrt(u)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      list.push({
        pos: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        size: 0.28 + Math.random() * 0.3,
      })
    }
    return list
  }, [])

  useFrame((_state, delta) => {
    // presence: fade the cell in as the camera pulls back to it (page 41 -> 42.2),
    // and hold to the very end.
    const presence = clamp01((scroll.offset - page(41)) / page(1.2))
    membraneMat.opacity = presence * 0.1

    if (!prefersReducedMotion) timeRef.current += delta
    const t = timeRef.current
    // A slow collective breathing swell (calmer than the Scene 7 heartbeat).
    const breathe = prefersReducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.8)
    mitoMat.opacity = presence
    mitoMat.emissiveIntensity = 0.4 + 0.5 * breathe
  })

  return (
    <group position={CENTER}>
      <mesh material={membraneMat}>
        <sphereGeometry args={[CELL_R, 32, 32]} />
      </mesh>
      {mitos.map((m, i) => (
        <mesh key={i} position={m.pos} rotation={m.rot} scale={[m.size * 1.7, m.size, m.size]} material={mitoMat}>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
      ))}
    </group>
  )
}
