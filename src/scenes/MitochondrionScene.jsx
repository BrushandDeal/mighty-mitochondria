import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, useScroll } from '@react-three/drei'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { ROTATION_SPEED, interiorFactor } from '../journeyRanges.js'

/*
 * MitochondrionScene — the bean-shaped outer body (JOURNEY.md Scenes 0 / 1).
 *
 * A semi-translucent, bean-shaped mitochondrion that slowly rotates, with a warm
 * golden glow, floating in dark space.
 *
 * As the camera slips inside for Scene 3, this whole outer body FADES OUT (shell,
 * halo, and its warm interior light) and its spin eases to a stop, so it does not
 * block or clip the interior reveal. Scroll back up and it fades in again. That
 * fade is driven by `interiorFactor` from journeyRanges.js.
 *
 * The gold is the site's reserved "energy" colour (JOURNEY.md section 4). Note:
 * the old gold placeholder "inner core" was removed here — the real inner
 * membrane and cristae now live in InnerMembraneScene.jsx.
 */

const GOLD = '#ffcf70'

const SHELL_OPACITY = 0.55
const HALO_OPACITY = 0.08
const LIGHT_INTENSITY = 6

export function MitochondrionScene() {
  const group = useRef()
  const shellMat = useRef()
  const haloMat = useRef()
  const light = useRef()
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()

  useFrame((_state, delta) => {
    // `vis` is 1 while outside the organelle and drops to 0 as we go inside.
    const vis = 1 - interiorFactor(scroll.offset)

    // Fade the whole outer body by its scroll-driven visibility.
    if (shellMat.current) shellMat.current.opacity = SHELL_OPACITY * vis
    if (haloMat.current) haloMat.current.opacity = HALO_OPACITY * vis
    if (light.current) light.current.intensity = LIGHT_INTENSITY * vis

    // Turn slowly, easing the spin to a stop as the body fades (so the interior
    // is steady for Scene 3's fold sweep). Frozen entirely under reduced motion.
    if (!prefersReducedMotion && group.current) {
      group.current.rotation.y += delta * ROTATION_SPEED * vis
    }
  })

  return (
    <group ref={group}>
      {/* The translucent outer body. A sphere squashed along two axes reads as
          a bean-shaped ellipsoid. `transparent` + a low `opacity` let the inner
          membrane show faintly through, and let it fade out on entry. */}
      <mesh scale={[1.7, 1, 1]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          ref={shellMat}
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.35}
          transparent
          opacity={SHELL_OPACITY}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* A soft halo: a large sphere rendered from the inside (BackSide) with an
          additive blend fades from gold to nothing, faking a gentle bloom without
          any extra post-processing library. True bloom is a later polish step. */}
      <mesh scale={[3.2, 2.4, 2.4]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          ref={haloMat}
          color={GOLD}
          transparent
          opacity={HALO_OPACITY}
          side={2 /* THREE.BackSide */}
          blending={2 /* THREE.AdditiveBlending */}
          depthWrite={false}
        />
      </mesh>

      {/* A warm light living inside the organelle, so the shell is lit from
          within rather than looking flat. Fades out on entry. */}
      <pointLight ref={light} color={GOLD} intensity={LIGHT_INTENSITY} distance={12} decay={2} />

      {/* Floating dust drifting around the organelle (JOURNEY.md Scene 0's
          "floating dust particles"). drei's Sparkles is the standard, cheap way
          to do this. Kept sparse so the scene stays calm, not busy. */}
      <Sparkles
        count={40}
        scale={[10, 6, 6]}
        size={2}
        speed={prefersReducedMotion ? 0 : 0.3}
        opacity={0.5}
        color={GOLD}
      />
    </group>
  )
}
