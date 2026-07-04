import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

/*
 * MitochondrionScene — the Phase 1 placeholder.
 *
 * A semi-translucent, bean-shaped mitochondrion that slowly rotates, with a
 * warm golden glow, floating in dark space. This stands in for JOURNEY.md's
 * Scene 0 / Scene 1 ("a bean-shaped mitochondrion, semi-translucent so the
 * inner folds glow faintly through the surface").
 *
 * It is written as ONE self-contained component on purpose. Later scenes from
 * JOURNEY.md (outer membrane, cristae, matrix, ATP synthase, ...) become their
 * own sibling files in this /scenes folder and get dropped into App.jsx the
 * same way, without rearchitecting.
 *
 * The gold is the site's reserved "energy" colour (see JOURNEY.md section 4).
 */

const GOLD = '#ffcf70'

export function MitochondrionScene() {
  const group = useRef()
  const prefersReducedMotion = usePrefersReducedMotion()

  // Turn the whole organelle slowly, once per frame. `delta` is the number of
  // seconds since the last frame, so the speed is the same on fast and slow
  // screens. If the visitor asked for reduced motion, we simply don't rotate.
  useFrame((_state, delta) => {
    if (prefersReducedMotion) return
    if (group.current) {
      group.current.rotation.y += delta * 0.15
    }
  })

  return (
    <group ref={group}>
      {/* The translucent outer body. A sphere squashed along two axes reads as
          a bean-shaped ellipsoid. `transparent` + a low `opacity` let the inner
          glow show through, like the folds glowing through the surface. */}
      <mesh scale={[1.7, 1, 1]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.35}
          transparent
          opacity={0.55}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* A smaller, brighter inner core. Seen through the translucent shell it
          gives the "inner glow" hint. This is a placeholder for the real folded
          cristae that a later phase will model. */}
      <mesh scale={[1.4, 0.7, 0.7]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={1.4}
          transparent
          opacity={0.45}
          roughness={0.5}
        />
      </mesh>

      {/* A soft halo: a large sphere rendered from the inside (BackSide) with an
          additive blend fades from gold to nothing, faking a gentle bloom without
          any extra post-processing library. True bloom is a later polish step. */}
      <mesh scale={[3.2, 2.4, 2.4]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={GOLD}
          transparent
          opacity={0.08}
          side={2 /* THREE.BackSide */}
          blending={2 /* THREE.AdditiveBlending */}
          depthWrite={false}
        />
      </mesh>

      {/* A warm light living inside the organelle, so the shell is lit from
          within rather than looking flat. */}
      <pointLight color={GOLD} intensity={6} distance={12} decay={2} />

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
