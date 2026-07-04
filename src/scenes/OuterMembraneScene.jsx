import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { ROTATION_SPEED, interiorFactor } from '../journeyRanges.js'

/*
 * OuterMembraneScene — JOURNEY.md Scene 2, "the outer membrane (the gateway)".
 *
 * The one fact this scene teaches (RESEARCH.md): the outer membrane is permeable
 * to SMALL molecules, which pass through channel proteins called porins.
 *
 * So we stud the surface of the existing mitochondrion with porins (small ring-
 * shaped pores) and send small molecules drifting in and out through them.
 *
 * Accuracy guardrails baked into this file:
 *  - Only small molecules move, and only across the OUTER membrane. They hover
 *    right at the outer surface and barely dip inward, never reaching the sealed
 *    inner membrane (that is Scene 3).
 *  - The molecules are cyan/white, never gold. Gold is reserved for energy.
 *
 * The geometry is unchanged from Scene 2. The only addition is that the pores and
 * molecules FADE OUT as the camera slips inside for Scene 3 (and fade back in on
 * scroll-up), so they do not hang in view once we are past them.
 *
 * Coordinate space: this shares the organelle's space. The outer body in
 * MitochondrionScene.jsx is a sphere scaled [1.7, 1, 1], so the surface is an
 * ellipsoid with these half-widths. If that scale ever changes, update A/B/C.
 */

// Half-widths of the outer-membrane ellipsoid. MUST match the outer body's
// scale [1.7, 1, 1] in MitochondrionScene.jsx.
const A = 1.7
const B = 1.0
const C = 1.0

const CYAN = '#40cfe0' // structure / membrane colour (JOURNEY.md section 4)
const MOLECULE = '#e8fbff' // near-white; deliberately NOT gold

const PORIN_COUNT = 16

// How far a molecule travels along the surface normal as it drifts through a
// pore. It reaches OUT to +0.40 (clearly outside) but only dips IN to -0.15, so
// it never gets near the inner membrane. See guardrails above.
const OUT_REACH = 0.4
const IN_REACH = 0.15

// Spread N points evenly over a sphere (a "Fibonacci sphere"). Deterministic,
// so the pores land in the same spots every load — no randomness needed.
function fibonacciDirections(n) {
  const dirs = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2 // from +1 (top) to -1 (bottom)
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    dirs.push([Math.cos(theta) * r, y, Math.sin(theta) * r])
  }
  return dirs
}

export function OuterMembraneScene() {
  const groupRef = useRef()
  const moleculeRefs = useRef([])
  const timeRef = useRef(0)
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()

  // Two shared materials (one for all pores, one for all molecules) so the whole
  // set can be faded together by adjusting a single opacity. Disposed on unmount.
  const porinMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CYAN,
        emissive: CYAN,
        emissiveIntensity: 0.4,
        roughness: 0.5,
        metalness: 0.1,
        transparent: true,
      }),
    []
  )
  const moleculeMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: MOLECULE,
        emissive: CYAN,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        transparent: true,
      }),
    []
  )
  useEffect(
    () => () => {
      porinMat.dispose()
      moleculeMat.dispose()
    },
    [porinMat, moleculeMat]
  )

  // Work out each porin's spot on the surface, the way it should be tilted to
  // lie flat, and the outward direction ("normal") a molecule travels along.
  const porins = useMemo(() => {
    const up = new Vector3(0, 0, 1) // a flat ring's default facing direction
    return fibonacciDirections(PORIN_COUNT).map((d, i) => {
      const dir = new Vector3(d[0], d[1], d[2])
      const pos = new Vector3(dir.x * A, dir.y * B, dir.z * C)
      const normal = new Vector3(dir.x / A, dir.y / B, dir.z / C).normalize()
      const quat = new Quaternion().setFromUnitVectors(up, normal)
      return {
        pos,
        normal,
        quat: [quat.x, quat.y, quat.z, quat.w],
        phase: i * 1.37, // so the molecules don't all move in lockstep
      }
    })
  }, [])

  useFrame((_state, delta) => {
    // Visible (1) while outside; fades to 0 as the camera slips inside.
    const vis = 1 - interiorFactor(scroll.offset)
    porinMat.opacity = vis
    moleculeMat.opacity = vis

    // Rotate in lockstep with the organelle, easing to a stop on entry; frozen
    // under reduced motion.
    if (!prefersReducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * ROTATION_SPEED * vis
    }

    // Advance our own clock (frozen under reduced motion) and drift each
    // molecule in and out along its pore's normal.
    if (!prefersReducedMotion) timeRef.current += delta
    const t = timeRef.current
    for (let i = 0; i < porins.length; i++) {
      const mesh = moleculeRefs.current[i]
      if (!mesh) continue
      const { pos, normal, phase } = porins[i]
      const wave = Math.sin(t * 0.6 + phase) * 0.5 + 0.5
      const along = -IN_REACH + wave * (OUT_REACH + IN_REACH)
      mesh.position.set(
        pos.x + normal.x * along,
        pos.y + normal.y * along,
        pos.z + normal.z * along
      )
    }
  })

  return (
    <group ref={groupRef}>
      {porins.map((p, i) => (
        <group key={i} position={p.pos} quaternion={p.quat}>
          {/* The pore itself: a small flat ring lying on the membrane. */}
          <mesh material={porinMat}>
            <torusGeometry args={[0.1, 0.035, 12, 24]} />
          </mesh>
        </group>
      ))}

      {/* The small molecules. Kept as direct children of the rotating group so
          they travel with the membrane. Positions are set each frame above. */}
      {porins.map((p, i) => (
        <mesh
          key={`mol-${i}`}
          ref={(el) => {
            moleculeRefs.current[i] = el
          }}
          position={p.pos}
          material={moleculeMat}
        >
          <sphereGeometry args={[0.04, 12, 12]} />
        </mesh>
      ))}
    </group>
  )
}
