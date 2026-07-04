import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial, Vector3 } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { matrixFactor } from '../journeyRanges.js'

/*
 * MatrixScene — JOURNEY.md Scene 4, "the matrix (the engine room)".
 *
 * Facts this scene teaches (RESEARCH.md Part A):
 *  - The matrix contains the mitochondrion's own DNA — small and CIRCULAR —
 *    separate from the cell's nuclear DNA.
 *  - It also holds enzymes (the citric acid cycle) and ribosomes.
 *
 * So the centrepiece is a glowing CIRCULAR loop of mtDNA, with small floating
 * enzyme/ribosome specks drifting around it, in a faint warm haze.
 *
 * Guardrails baked in:
 *  - No electron transport chain complexes and no ATP synthase — those are
 *    Scenes 5 and 6.
 *  - Colour: the DNA loop and enzymes are COOL (pale cyan), and the "warm haze"
 *    is a MUTED tan, deliberately NOT the saturated energy-gold, so the gold
 *    payoff at ATP synthase is preserved.
 *  - Everything here stays invisible until the gate is passed (matrixFactor), so
 *    the earlier scenes are not polluted by matrix contents showing through.
 */

const DNA = '#bfeff5' // pale, cool, luminous — mtDNA and enzymes (not energy gold)
const HAZE = '#d9b48a' // muted, desaturated warm — the "warm ambient haze"

const ENZYME_COUNT = 14

// A deterministic spread of points inside a small sphere for the enzyme specks.
function enzymePositions(n) {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    // Radius varies a little so they don't sit on one shell.
    const rad = 0.28 + ((i % 3) / 3) * 0.24
    pts.push(new Vector3(Math.cos(theta) * r * rad, y * rad, Math.sin(theta) * r * rad))
  }
  return pts
}

export function MatrixScene() {
  const dnaRef = useRef()
  const enzymeGroup = useRef()
  const hazeLight = useRef()
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()

  // Shared materials so the whole scene can be faded in together (opacity driven
  // by matrixFactor). Disposed on unmount.
  const dnaMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: DNA,
        emissive: DNA,
        emissiveIntensity: 0.5, // kept low so entering the matrix isn't harsh
        transparent: true,
        opacity: 0,
        roughness: 0.4,
      }),
    []
  )
  const enzymeMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: DNA,
        emissive: DNA,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0,
        roughness: 0.5,
      }),
    []
  )
  useEffect(
    () => () => {
      dnaMat.dispose()
      enzymeMat.dispose()
    },
    [dnaMat, enzymeMat]
  )

  const enzymes = useMemo(() => enzymePositions(ENZYME_COUNT), [])

  useFrame((_state, delta) => {
    // Fade everything in as the spiral carries us into the matrix.
    const m = matrixFactor(scroll.offset)
    dnaMat.opacity = m
    enzymeMat.opacity = 0.85 * m
    if (hazeLight.current) hazeLight.current.intensity = 1.1 * m // soft, not blazing

    // Gentle drift: the DNA loop turns slowly, the enzyme cluster turns the other
    // way. Frozen under reduced motion.
    if (!prefersReducedMotion) {
      if (dnaRef.current) {
        dnaRef.current.rotation.y += delta * 0.25
        dnaRef.current.rotation.x += delta * 0.1
      }
      if (enzymeGroup.current) {
        enzymeGroup.current.rotation.y -= delta * 0.12
      }
    }
  })

  return (
    <group>
      {/* mtDNA: a glowing circular loop, small and central. */}
      <mesh ref={dnaRef} material={dnaMat}>
        <torusGeometry args={[0.36, 0.022, 16, 80]} />
      </mesh>

      {/* Floating enzymes / ribosomes: small cool specks drifting around it. */}
      <group ref={enzymeGroup}>
        {enzymes.map((p, i) => (
          <mesh key={i} position={p} material={enzymeMat}>
            <sphereGeometry args={[0.03, 10, 10]} />
          </mesh>
        ))}
      </group>

      {/* The muted warm haze: a soft, desaturated warm light (NOT energy-gold). */}
      <pointLight ref={hazeLight} color={HAZE} intensity={0} distance={4} decay={2} />
    </group>
  )
}
