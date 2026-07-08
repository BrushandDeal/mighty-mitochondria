import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, useScroll } from '@react-three/drei'
import { IcosahedronGeometry, Vector3 } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { ROTATION_SPEED, interiorFactor } from '../journeyRanges.js'

/*
 * MitochondrionScene — the bean-shaped outer body (JOURNEY.md Scenes 0 / 1).
 *
 * A semi-translucent, bean-shaped mitochondrion that slowly rotates, with a soft
 * cyan/teal glow, floating in dark space. Its surface is given organic, irregular
 * contours by displacing the vertices of a base icosphere along their normals with
 * layered value noise (the conventional "noise-displaced geometry" technique), so
 * it reads as a living structure rather than a perfect geometric ellipsoid.
 *
 * As the camera slips inside for Scene 3, this whole outer body FADES OUT (shell,
 * halo, and its interior light) and its spin eases to a stop, so it does not block
 * or clip the interior reveal. Scroll back up and it fades in again. That fade is
 * driven by `interiorFactor` from journeyRanges.js.
 *
 * Colour grammar: the base body and halo are cyan/teal STRUCTURE colours, NOT
 * gold. Gold stays reserved exclusively for energy (JOURNEY.md section 4), which
 * the ATP synthase payoff later depends on. Note: the old gold placeholder "inner
 * core" was removed here; the real inner membrane and cristae now live in
 * InnerMembraneScene.jsx.
 */

// The base body and its halo read as living STRUCTURE, so they use cyan/teal, not
// gold. GOLD remains only for the floating dust below (a separate ambient element
// left unchanged in this pass).
const BODY = '#33c2d4' // deep cyan/teal for the translucent shell and its inner light
const HALO = '#46d0e2' // a slightly brighter cyan for the soft halo bloom
const GOLD = '#ffcf70' // used ONLY by the floating dust (Sparkles) below

const SHELL_OPACITY = 0.55
const HALO_OPACITY = 0.08
const LIGHT_INTENSITY = 6

// --- Organic form: noise-displaced geometry --------------------------------
// A near-perfect ellipsoid reads as computer-generated. The conventional fix is
// to displace the vertices of a base mesh along their normals with layered value
// noise (fractional Brownian motion), then recompute normals. Deterministic (a
// fixed hash, no Math.random), so the shape is stable across reloads.

const hash3 = (x, y, z) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123
  return s - Math.floor(s) // 0..1
}
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const mix = (a, b, t) => a + (b - a) * t

// Smooth 3D value noise: hash the 8 lattice corners and trilinearly blend them.
const valueNoise = (x, y, z) => {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  const ux = fade(x - ix)
  const uy = fade(y - iy)
  const uz = fade(z - iz)
  const n000 = hash3(ix, iy, iz)
  const n100 = hash3(ix + 1, iy, iz)
  const n010 = hash3(ix, iy + 1, iz)
  const n110 = hash3(ix + 1, iy + 1, iz)
  const n001 = hash3(ix, iy, iz + 1)
  const n101 = hash3(ix + 1, iy, iz + 1)
  const n011 = hash3(ix, iy + 1, iz + 1)
  const n111 = hash3(ix + 1, iy + 1, iz + 1)
  const x00 = mix(n000, n100, ux)
  const x10 = mix(n010, n110, ux)
  const x01 = mix(n001, n101, ux)
  const x11 = mix(n011, n111, ux)
  return mix(mix(x00, x10, uy), mix(x01, x11, uy), uz) // 0..1
}

// Fractional Brownian motion: sum octaves of noise, roughly -1..1.
const fbm = (x, y, z, octaves, gain) => {
  let amp = 0.5
  let f = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * (valueNoise(x * f, y * f, z * f) * 2 - 1)
    norm += amp
    amp *= gain
    f *= 2
  }
  return sum / norm
}

const FORM_FREQ = 1.6 // broad lumps, not high-frequency chatter
const FORM_AMP = 0.14 // +/-14% radius: clearly irregular, still bean-shaped

// A second, finer, low-amplitude noise layer riding on top of the broad form adds
// micro-irregularity so the surface reads as a living membrane rather than a
// smooth shell. Amplitude is a fraction of the form's, and recomputed normals let
// it catch light, so it shows as fine surface texture WITHOUT changing the
// silhouette (the broad contours from FORM_* are untouched).
const MICRO_FREQ = 5.5 // finer ripples across the surface
const MICRO_AMP = 0.025 // subtle: about a sixth of the form amplitude

// Build the organic body geometry once: an icosphere (even triangle distribution,
// no UV-sphere pole pinching) displaced along its radius by low-frequency fbm
// (broad form) plus a finer octave (micro surface detail).
const makeBodyGeometry = () => {
  const geo = new IcosahedronGeometry(1, 5) // ~20k tris, smooth base to displace
  const pos = geo.attributes.position
  const v = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    const form = fbm(v.x * FORM_FREQ, v.y * FORM_FREQ, v.z * FORM_FREQ, 3, 0.5)
    const micro = fbm(v.x * MICRO_FREQ, v.y * MICRO_FREQ, v.z * MICRO_FREQ, 2, 0.5)
    const r = 1 + FORM_AMP * form + MICRO_AMP * micro
    pos.setXYZ(i, v.x * r, v.y * r, v.z * r)
  }
  geo.computeVertexNormals()
  return geo
}

export function MitochondrionScene() {
  const group = useRef()
  const shellMat = useRef()
  const haloMat = useRef()
  const light = useRef()
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()

  // The displaced organic geometry, built once.
  const bodyGeometry = useMemo(() => makeBodyGeometry(), [])

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
      {/* The translucent outer body: the noise-displaced icosphere, squashed
          along two axes into a bean. `transparent` + a low `opacity` let the
          inner membrane show faintly through, and let it fade out on entry. */}
      <mesh scale={[1.7, 1, 1]} geometry={bodyGeometry}>
        <meshStandardMaterial
          ref={shellMat}
          color={BODY}
          emissive={BODY}
          emissiveIntensity={0.35}
          transparent
          opacity={SHELL_OPACITY}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* A soft halo: a large sphere rendered from the inside (BackSide) with an
          additive blend fades from cyan to nothing, faking a gentle bloom without
          any extra post-processing library. True bloom is a later polish step. */}
      <mesh scale={[3.2, 2.4, 2.4]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          ref={haloMat}
          color={HALO}
          transparent
          opacity={HALO_OPACITY}
          side={2 /* THREE.BackSide */}
          blending={2 /* THREE.AdditiveBlending */}
          depthWrite={false}
        />
      </mesh>

      {/* A cool cyan light living inside the organelle, so the shell is lit from
          within rather than looking flat. Fades out on entry. (This is the
          organelle's own glow, not App.jsx's global lighting rig.) */}
      <pointLight ref={light} color={BODY} intensity={LIGHT_INTENSITY} distance={12} decay={2} />

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
