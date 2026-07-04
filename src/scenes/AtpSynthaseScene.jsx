import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial, MeshBasicMaterial, Vector3 } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

/*
 * AtpSynthaseScene — JOURNEY.md Scene 6, "ATP synthase (the discharge, the
 * climax)". The visual peak of the whole ride and its core anti-misconception.
 *
 * Facts this scene teaches (RESEARCH.md Part A):
 *  - ATP synthase is a rotary molecular motor. Protons flowing BACK across the
 *    inner membrane physically spin it.
 *  - That rotation assembles ATP by joining ADP + inorganic phosphate — parts
 *    already present. It does NOT create ATP from nothing.
 *  - The body turns over roughly its own weight in ATP per day by recycling.
 *
 * So: a distinct rotary motor at the front-centre of the inner wall (unlike the
 * Scene 5 pumping cylinders). VIOLET protons rush BACK through it (far side ->
 * matrix, the OPPOSITE of Scene 5) and spin its head. In the matrix, muted cool
 * ADP pieces and small pale phosphate groups float; as the head turns, an ADP and
 * a phosphate are drawn together and a finished GOLD ATP coin pops out.
 *
 * Guardrails baked in:
 *  - Every coin is assembled from a VISIBLE ADP + phosphate that converge first;
 *    a coin NEVER appears from nothing. (The one misconception the site prevents.)
 *  - Protons flow far side -> matrix (inward), the reverse of Scene 5, and ONLY
 *    through this one motor.
 *  - Coins are GOLD (the reserved energy colour finally paying off — peak glow).
 *    Protons stay violet; structure stays cyan. ADP/phosphate are deliberately
 *    duller than the gold and told apart mainly by size and shape.
 *  - No numbers on screen.
 *
 * The motor sits at (0, 0, 0.8) on the +z inner-membrane face, axis along +z;
 * its spinning head is in the matrix around z = 0.5. Matrix side is z < 0.8.
 */

const CYAN = '#40cfe0' // structure
const PROTON = '#cbb8ff' // violet (same as Scene 5)
const GOLD = '#ffcf70' // the ATP coin — the payoff
const ADP = '#8aa0bd' // muted, desaturated cool — larger piece
const PHOS = '#d7dbe0' // pale near-neutral — a small group of tiny dots

const PROTON_COUNT = 6
const MINT_COUNT = 3 // three catalytic sites -> ~three coins per turn
const PHOS_DOTS = 3 // phosphate shown as a small cluster
const SPIN_SPEED = 1.2
const MINT_SPEED = 0.19 // tuned so ~3 coins emerge per full turn
const HEAD_Z = 0.5

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const envelope = (p) => clamp01(p * 5) * clamp01((1 - p) * 5)

export function AtpSynthaseScene() {
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()
  const timeRef = useRef(0)
  const rotorRef = useRef()
  const protonRefs = useRef([])
  const adpRefs = useRef([])
  const phosRefs = useRef([])
  const coinRefs = useRef([])
  const glowLight = useRef()

  const structureMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CYAN,
        emissive: CYAN,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0,
        roughness: 0.4,
        metalness: 0.2,
      }),
    []
  )
  const protonMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: PROTON,
        emissive: PROTON,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0,
      }),
    []
  )
  // The gold coin: PEAK glow — much brighter emissive than anything else here.
  const coinMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: GOLD,
        emissive: GOLD,
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: 0,
        roughness: 0.25,
        metalness: 0.4,
      }),
    []
  )
  // ADP: muted cool, but with enough glow to stay visible against the dark space.
  const adpMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: ADP,
        emissive: ADP,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0,
        roughness: 0.6,
      }),
    []
  )
  const phosMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: PHOS,
        emissive: PHOS,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0,
        roughness: 0.6,
      }),
    []
  )
  // A soft gold halo behind the head to fake bloom without post-processing.
  const haloMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: 2 /* AdditiveBlending */,
      }),
    []
  )
  useEffect(
    () => () => {
      structureMat.dispose()
      protonMat.dispose()
      coinMat.dispose()
      adpMat.dispose()
      phosMat.dispose()
      haloMat.dispose()
    },
    [structureMat, protonMat, coinMat, adpMat, phosMat, haloMat]
  )

  // One "assembler" per catalytic site: where the parts meet, where the ADP and
  // phosphate drift in from, and where the finished coin flies out to.
  const assemblers = useMemo(() => {
    const list = []
    for (let i = 0; i < MINT_COUNT; i++) {
      const a = (i / MINT_COUNT) * Math.PI * 2
      const conv = new Vector3(0.18 * Math.cos(a), 0.18 * Math.sin(a), HEAD_Z)
      const adpStart = new Vector3(0.55 * Math.cos(a + 0.6), 0.55 * Math.sin(a + 0.6), 0.2)
      const phosStart = new Vector3(0.5 * Math.cos(a - 0.6), 0.5 * Math.sin(a - 0.6), 0.15)
      const coinEnd = new Vector3(conv.x + 0.35 * Math.cos(a), conv.y + 0.35 * Math.sin(a), HEAD_Z - 0.5)
      list.push({ conv, adpStart, phosStart, coinEnd, phase: i / MINT_COUNT })
    }
    return list
  }, [])

  // The three catalytic-site markers on the head (rotate with the rotor).
  const siteAngles = useMemo(
    () => Array.from({ length: MINT_COUNT }, (_, i) => (i / MINT_COUNT) * Math.PI * 2),
    []
  )

  useFrame((_state, delta) => {
    // Scene 6 fades in as we leave the Complex II hold. (Re-spaced for pages=22.)
    const presence = clamp01((scroll.offset - 0.83) / 0.04)

    structureMat.opacity = presence
    protonMat.opacity = presence
    coinMat.opacity = presence
    adpMat.opacity = presence
    phosMat.opacity = presence

    if (!prefersReducedMotion) timeRef.current += delta
    const t = timeRef.current

    // The rush of protons spins the motor head.
    if (rotorRef.current && !prefersReducedMotion) {
      rotorRef.current.rotation.z += delta * SPIN_SPEED
    }

    // Peak glow: a gold light at the head that pulses with the minting rhythm.
    if (glowLight.current) {
      glowLight.current.intensity = presence * (2.4 + 1.4 * Math.abs(Math.sin(t * 3)))
    }
    haloMat.opacity = presence * 0.12

    // Protons rush BACK: from the far (intermembrane) side, down through the
    // motor, into the matrix — the OPPOSITE direction from Scene 5.
    for (let i = 0; i < PROTON_COUNT; i++) {
      const mesh = protonRefs.current[i]
      if (!mesh) continue
      const phase = (t * 0.35 + i / PROTON_COUNT) % 1
      const z = 1.15 - phase * 0.55 // 1.15 (far side) down to 0.6 (matrix)
      const ang = i * 2.4 + phase * 0.6
      const r = 0.05 + 0.03 * Math.sin(phase * Math.PI)
      mesh.position.set(r * Math.cos(ang), r * Math.sin(ang), z)
      mesh.scale.setScalar(presence * envelope(phase))
    }

    // Minting: ADP + phosphate converge, then a gold coin pops out of that exact
    // spot and flies into the matrix. Never from nothing.
    for (let i = 0; i < MINT_COUNT; i++) {
      const A = assemblers[i]
      const p = (t * MINT_SPEED + A.phase) % 1
      const adp = adpRefs.current[i]
      const phos = phosRefs.current[i]
      const coin = coinRefs.current[i]
      if (p < 0.55) {
        // Parts drift in and meet at the catalytic site.
        const q = p / 0.55
        if (adp) {
          adp.position.lerpVectors(A.adpStart, A.conv, q)
          adp.scale.setScalar(presence)
        }
        if (phos) {
          phos.position.lerpVectors(A.phosStart, A.conv, q)
          phos.scale.setScalar(presence)
        }
        if (coin) coin.scale.setScalar(0)
      } else {
        // The finished coin emerges from that same spot and flies out, fading.
        const q = (p - 0.55) / 0.45
        if (adp) adp.scale.setScalar(0)
        if (phos) phos.scale.setScalar(0)
        if (coin) {
          coin.position.lerpVectors(A.conv, A.coinEnd, q)
          coin.scale.setScalar(presence * clamp01((1 - q) * 3))
          coin.rotation.z += delta * 4
        }
      }
    }
  })

  return (
    <group>
      {/* F0 base: the proton channel embedded in the membrane (the one door). */}
      <mesh position={[0, 0, 0.78]} rotation={[Math.PI / 2, 0, 0]} material={structureMat}>
        <cylinderGeometry args={[0.15, 0.15, 0.14, 24]} />
      </mesh>

      {/* The rotor: stalk + faceted head + catalytic-site markers. Spins as one. */}
      <group ref={rotorRef}>
        <mesh position={[0, 0, 0.66]} rotation={[Math.PI / 2, 0, 0]} material={structureMat}>
          <cylinderGeometry args={[0.035, 0.035, 0.18, 12]} />
        </mesh>
        {/* Faceted (hexagonal) head — visibly a rotor, unlike the Scene 5 cylinders. */}
        <mesh position={[0, 0, HEAD_Z]} rotation={[Math.PI / 2, 0, 0]} material={structureMat}>
          <cylinderGeometry args={[0.22, 0.22, 0.18, 6]} />
        </mesh>
        {siteAngles.map((a, i) => (
          <mesh key={i} position={[0.2 * Math.cos(a), 0.2 * Math.sin(a), HEAD_Z]} material={structureMat}>
            <sphereGeometry args={[0.045, 10, 10]} />
          </mesh>
        ))}
      </group>

      {/* Gold halo behind the head to bloom the payoff. */}
      <mesh position={[0, 0, HEAD_Z]} material={haloMat}>
        <sphereGeometry args={[0.5, 20, 20]} />
      </mesh>

      {/* Violet protons rushing back through the motor (positions set per frame). */}
      {Array.from({ length: PROTON_COUNT }).map((_, i) => (
        <mesh
          key={`rp-${i}`}
          ref={(el) => {
            protonRefs.current[i] = el
          }}
          material={protonMat}
        >
          <sphereGeometry args={[0.045, 10, 10]} />
        </mesh>
      ))}

      {/* Floating ADP pieces — larger, muted cool (one per assembler). */}
      {Array.from({ length: MINT_COUNT }).map((_, i) => (
        <mesh
          key={`adp-${i}`}
          ref={(el) => {
            adpRefs.current[i] = el
          }}
          material={adpMat}
        >
          <icosahedronGeometry args={[0.075, 0]} />
        </mesh>
      ))}

      {/* Floating phosphate — a small pale cluster of tiny dots (one per assembler). */}
      {Array.from({ length: MINT_COUNT }).map((_, i) => (
        <group
          key={`phos-${i}`}
          ref={(el) => {
            phosRefs.current[i] = el
          }}
        >
          {Array.from({ length: PHOS_DOTS }).map((__, k) => {
            const a = (k / PHOS_DOTS) * Math.PI * 2
            return (
              <mesh key={k} position={[0.03 * Math.cos(a), 0.03 * Math.sin(a), 0]} material={phosMat}>
                <sphereGeometry args={[0.022, 8, 8]} />
              </mesh>
            )
          })}
        </group>
      ))}

      {/* The gold ATP coins — flat discs, peak glow (positions/scale set per frame). */}
      {Array.from({ length: MINT_COUNT }).map((_, i) => (
        <mesh
          key={`coin-${i}`}
          ref={(el) => {
            coinRefs.current[i] = el
          }}
          rotation={[Math.PI / 2, 0, 0]}
          material={coinMat}
        >
          <cylinderGeometry args={[0.09, 0.09, 0.02, 20]} />
        </mesh>
      ))}

      {/* The peak gold glow at the head. */}
      <pointLight ref={glowLight} color={GOLD} intensity={0} position={[0, 0, HEAD_Z]} distance={3} decay={2} />
    </group>
  )
}
