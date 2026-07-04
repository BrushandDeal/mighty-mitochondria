import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3 } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

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
 *    inner membrane / bright core (that is Scene 3).
 *  - The molecules are cyan/white, never gold. Gold is reserved for energy
 *    (JOURNEY.md section 4), which these molecules are not.
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

// The organelle gently rotates in MitochondrionScene at this speed. We spin this
// scene's group at the exact same rate so the pores stay stuck to the surface.
const ROTATION_SPEED = 0.15

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
  const prefersReducedMotion = usePrefersReducedMotion()

  // Work out each porin's spot on the surface, the way it should be tilted to
  // lie flat, and the outward direction ("normal") a molecule travels along.
  // useMemo means this maths runs once, not every frame.
  const porins = useMemo(() => {
    const up = new Vector3(0, 0, 1) // a flat ring's default facing direction
    return fibonacciDirections(PORIN_COUNT).map((d, i) => {
      const dir = new Vector3(d[0], d[1], d[2])
      // Point on the ellipsoid surface.
      const pos = new Vector3(dir.x * A, dir.y * B, dir.z * C)
      // Outward normal of an ellipsoid at that point.
      const normal = new Vector3(dir.x / A, dir.y / B, dir.z / C).normalize()
      // Rotation that tilts the ring to sit flat against the surface.
      const quat = new Quaternion().setFromUnitVectors(up, normal)
      return {
        pos,
        normal,
        quat: [quat.x, quat.y, quat.z, quat.w],
        // A per-pore phase so the molecules don't all move in lockstep.
        phase: i * 1.37,
      }
    })
  }, [])

  useFrame((_state, delta) => {
    // Rotate in lockstep with the organelle so pores stay on the surface;
    // freeze together when the visitor prefers reduced motion.
    if (!prefersReducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * ROTATION_SPEED
    }

    // Advance our own clock (frozen under reduced motion) and drift each
    // molecule in and out along its pore's normal.
    if (!prefersReducedMotion) timeRef.current += delta
    const t = timeRef.current
    for (let i = 0; i < porins.length; i++) {
      const mesh = moleculeRefs.current[i]
      if (!mesh) continue
      const { pos, normal, phase } = porins[i]
      // wave goes 0..1; map it to the travel range [-IN_REACH, +OUT_REACH].
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
          <mesh>
            <torusGeometry args={[0.1, 0.035, 12, 24]} />
            <meshStandardMaterial
              color={CYAN}
              emissive={CYAN}
              emissiveIntensity={0.4}
              roughness={0.5}
              metalness={0.1}
            />
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
        >
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial
            color={MOLECULE}
            emissive={CYAN}
            emissiveIntensity={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}
