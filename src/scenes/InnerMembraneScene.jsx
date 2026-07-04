import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { matrixFactor } from '../journeyRanges.js'

/*
 * InnerMembraneScene — JOURNEY.md Scene 3, "inner membrane & cristae (the folds)".
 *
 * Facts this scene teaches (RESEARCH.md Part A):
 *  - The inner membrane is folded into cristae, which increase surface area for
 *    the energy-producing machinery.
 *  - The inner membrane is sealed (highly selective).
 *
 * So we build a SEALED inner membrane (a closed translucent cyan ellipsoid, a
 * bit inside the outer one — the gap between them is the "intermembrane space")
 * and fill it with CRISTAE: a stack of thin folds, wall after wall.
 *
 * Guardrails baked in:
 *  - Nothing crosses the inner membrane. There are no molecules or machinery
 *    inside here — only the folded architecture (empty). The seal is load-bearing
 *    setup for a later scene, so it must read as sealed.
 *  - Cyan only. The "energy shimmer" JOURNEY asks for is kept COOL (cyan), never
 *    gold, so the gold payoff at ATP synthase is not spent early.
 *
 * This replaces the old gold placeholder core that used to live in
 * MitochondrionScene.jsx.
 */

// Half-widths of the SEALED inner membrane. Smaller than the outer body
// (1.7 x 1 x 1), so the space between them is the intermembrane space.
const IA = 1.45
const IB = 0.8
const IC = 0.8

const CYAN = '#40cfe0' // structure / membrane colour (JOURNEY.md section 4)

const CRISTAE_COUNT = 13

export function InnerMembraneScene() {
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()

  // One shared material for all the folds, so the cool "shimmer" (a slow pulse
  // of the glow) is unified and cheap. Disposed on unmount to free GPU memory.
  const cristaeMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CYAN,
        emissive: CYAN,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.75,
        roughness: 0.5,
        metalness: 0.1,
      }),
    []
  )
  useEffect(() => () => cristaeMat.dispose(), [cristaeMat])

  // Work out each fold: its position along the long axis and its radius, so the
  // folds nest inside the sealed membrane (widest in the middle, smaller at the
  // ends). Runs once, not every frame.
  const cristae = useMemo(() => {
    const list = []
    for (let i = 0; i < CRISTAE_COUNT; i++) {
      // Spread folds along the long (x) axis, leaving a margin at the tips.
      const x = -1.15 + (i / (CRISTAE_COUNT - 1)) * 2.3
      // Radius of the inner membrane's cross-section here, pulled in slightly so
      // the fold sits just inside the sealed surface.
      const r = IB * Math.sqrt(Math.max(0, 1 - (x / IA) ** 2)) * 0.9
      list.push({ x, r })
    }
    return list
  }, [])

  useFrame((_state) => {
    // The inner membrane does NOT spin: Scene 5 pins stations to this wall and
    // needs a fixed, known orientation. (The bean and pores still spin in their
    // own scenes, so the cold open still feels alive.)

    // The cool energy shimmer: a subtle, slow brightening of the folds. Held
    // steady when the visitor prefers reduced motion.
    if (!prefersReducedMotion) {
      const t = _state.clock.elapsedTime
      cristaeMat.emissiveIntensity = 0.5 + 0.15 * Math.sin(t * 1.2)
    }

    // Dim the folds to a backdrop once we dive into the matrix, so the matrix
    // contents read clearly. They stay faintly visible, framing the space.
    cristaeMat.opacity = 0.75 * (1 - 0.55 * matrixFactor(scroll.offset))
  })

  return (
    <group>
      {/* The sealed inner membrane: a closed, faint, translucent cyan surface.
          Nothing passes through it — that is the point. */}
      <mesh scale={[IA, IB, IC]}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial
          color={CYAN}
          emissive={CYAN}
          emissiveIntensity={0.15}
          transparent
          opacity={0.18}
          roughness={0.6}
          side={2 /* THREE.DoubleSide, so the seal reads from inside and out */}
          depthWrite={false}
        />
      </mesh>

      {/* The cristae: thin folds stacked along the length, wall after wall. Each
          is a thin disc oriented across the long axis; the shared material gives
          them the unified cool shimmer. */}
      {cristae.map((c, i) => (
        <mesh
          key={i}
          position={[c.x, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={cristaeMat}
        >
          <cylinderGeometry args={[c.r, c.r, 0.04, 24]} />
        </mesh>
      ))}

      {/* A soft cyan light inside so the folds have form once the warm outer
          light has faded away on entry. */}
      <pointLight color={CYAN} intensity={3} distance={8} decay={2} />
    </group>
  )
}
