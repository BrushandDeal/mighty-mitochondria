import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial, MeshBasicMaterial, AdditiveBlending } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { page } from '../journeyRanges.js'

/*
 * ThresholdScene — JOURNEY.md "THRESHOLD, Leaving settled ground". Not a fact
 * card: a doorway. A cool-blue portal ring sits across the camera's forward path
 * (centred at z = 52); the camera flies straight through its hole as the palette
 * cools (see FrontierEnvironment in App.jsx). Crossing it is the on-screen signal
 * that we are leaving settled textbook science and entering active research.
 *
 * A default torus lies in the xy-plane with its axis along z, so a torus placed
 * here with no rotation opens toward the +z-moving camera: it passes through the
 * hole. Cooler blue than the settled cyan, and never gold.
 */

const COOL = '#4f9dff' // cool blue, the boundary colour (distinct from settled cyan)
const RING_POS = [0.6, 0.3, 52] // on the camera's forward line (see CameraRig)

const clamp01 = (v) => Math.min(1, Math.max(0, v))

export function ThresholdScene() {
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()
  const ringRef = useRef(null)
  const timeRef = useRef(0)

  const coreMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: COOL,
        emissive: COOL,
        emissiveIntensity: 1.4,
        roughness: 0.4,
        metalness: 0.0,
        transparent: true,
        opacity: 0,
      }),
    []
  )
  const haloMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: COOL,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    []
  )

  useFrame((_state, delta) => {
    const offset = scroll.offset
    // Fade the portal in as we approach (page 33.3 -> 34), then back out once we
    // have passed through it (page 35.6 -> 36.6) so it never lingers behind us.
    const inAmount = clamp01((offset - page(33.3)) / page(0.7))
    const outAmount = 1 - clamp01((offset - page(35.6)) / page(1.0))
    const presence = inAmount * outAmount
    coreMat.opacity = presence
    haloMat.opacity = presence * 0.4

    if (!prefersReducedMotion) timeRef.current += delta
    // A slow rotation so the ring shimmers rather than sitting dead still.
    if (ringRef.current && !prefersReducedMotion) ringRef.current.rotation.z = timeRef.current * 0.25
  })

  return (
    <group ref={ringRef} position={RING_POS}>
      <mesh material={coreMat}>
        <torusGeometry args={[4, 0.18, 20, 64]} />
      </mesh>
      <mesh material={haloMat}>
        <torusGeometry args={[4, 0.5, 20, 64]} />
      </mesh>
    </group>
  )
}
