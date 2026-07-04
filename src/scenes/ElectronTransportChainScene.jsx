import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

/*
 * ElectronTransportChainScene — JOURNEY.md Scene 5 (both parts).
 *
 * Facts this scene teaches (RESEARCH.md Part A):
 *  - The electron transport chain pumps protons FROM the matrix INTO the
 *    intermembrane space, building a gradient.
 *  - That gradient is electrochemical — a real voltage, not just a pile-up.
 *  - The sealed inner membrane holding separated charge behaves like a battery.
 *  - Not every complex pumps: Complexes I, III, IV pump; Complex II does not.
 *  - Complex II is a second entry point where electrons from the citric acid
 *    cycle enter, bypassing Complex I, so that route drives less ATP.
 *
 * PART ONE (the main line): three CYAN pumping stations (Complexes I, III, IV).
 * GOLD electrons hop along the row; each arrival pumps a VIOLET proton from the
 * matrix side across to the intermembrane-space side. As protons accumulate, the
 * far side glows and a qualitative charge meter (in App.jsx, no numbers) climbs.
 *
 * PART TWO (the odd one out): Complex II in the gap at x = -0.3 — a distinct
 * shape and muted-teal tone. Its electron enters from the MATRIX side (up from
 * the interior), not handed down the row, and it pumps NO proton. The camera
 * swings onto it and holds (see CameraRig.jsx).
 *
 * Guardrails baked in:
 *  - Protons pumped matrix -> intermembrane space only (outward). Nothing else
 *    crosses the sealed wall. Complex II pumps zero protons.
 *  - The Complex II electron arrives from the matrix side, never down the row.
 *  - Electrons GOLD (energy), pumping stations/membrane CYAN (structure), protons
 *    a DISTINCT pale violet, Complex II a muted teal — none blur together.
 *  - No ATP, ATP synthase, oxygen, or water (those are later scenes). No numbers.
 *
 * Orientation note: the inner membrane no longer spins, so its +z face is fixed
 * and these world-space positions line up with it.
 */

// Inner membrane half-widths — must match InnerMembraneScene.jsx.
const IA = 1.45
const IB = 0.8
const IC = 0.8

const CYAN = '#40cfe0' // pumping stations / membrane (structure)
const GOLD = '#ffcf70' // electrons (energy)
const PROTON = '#cbb8ff' // pale violet — neither gold nor cyan
const COMPLEX2 = '#3fb7a8' // muted teal — Complex II, the odd one out

// The three PUMPING stations (Complexes I, III, IV) sit at these x positions on
// the +z face.
const STATION_X = [-0.9, 0.3, 0.9]

// Complex II (part two): the odd one out. It sits in the gap at x = -0.3, has a
// different shape and tone, pumps NO protons, and its electron enters from the
// MATRIX side (up from the interior) rather than being handed down the row.
const COMPLEX2_X = -0.3
const COMPLEX2_ELECTRONS = 2

const PROTONS_PER_STATION = 4
const ELECTRON_COUNT = 5

// A point on the inner-membrane +z face at a given x (y = 0).
function surfaceZ(x) {
  return IC * Math.sqrt(Math.max(0, 1 - (x / IA) ** 2))
}

// Outward normal (toward the intermembrane space) of the ellipsoid at that point.
function surfaceNormal(x, z) {
  return new Vector3(x / (IA * IA), 0, z / (IC * IC)).normalize()
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))
// A 0 -> 1 -> 0 envelope so a proton fades in as it leaves the station and fades
// out as it reaches the far side (no popping).
const envelope = (p) => clamp01(p * 5) * clamp01((1 - p) * 5)

export function ElectronTransportChainScene() {
  const scroll = useScroll()
  const prefersReducedMotion = usePrefersReducedMotion()
  const timeRef = useRef(0)
  const electronRefs = useRef([])
  const protonRefs = useRef([])
  const c2ElectronRefs = useRef([])
  const imsLight = useRef()

  // Shared materials so the whole scene fades together (opacity = presence).
  const stationMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CYAN,
        emissive: CYAN,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0,
        roughness: 0.5,
        metalness: 0.1,
      }),
    []
  )
  const electronMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: GOLD,
        emissive: GOLD,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0,
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
  // Complex II gets its own material (muted teal, distinct from the pumpers).
  const complex2Mat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: COMPLEX2,
        emissive: COMPLEX2,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0,
        roughness: 0.5,
        metalness: 0.1,
      }),
    []
  )
  useEffect(
    () => () => {
      stationMat.dispose()
      electronMat.dispose()
      protonMat.dispose()
      complex2Mat.dispose()
    },
    [stationMat, electronMat, protonMat, complex2Mat]
  )

  // Precompute each station's surface point, outward normal, and the tilt that
  // stands it up through the membrane.
  const stations = useMemo(() => {
    const axis = new Vector3(0, 1, 0) // a cylinder's default long axis
    return STATION_X.map((x) => {
      const z = surfaceZ(x)
      const point = new Vector3(x, 0, z)
      const normal = surfaceNormal(x, z)
      const quat = new Quaternion().setFromUnitVectors(axis, normal)
      return { point, normal, quat: [quat.x, quat.y, quat.z, quat.w] }
    })
  }, [])

  // Flatten the protons into one list so we can hold a ref per proton.
  const protons = useMemo(() => {
    const list = []
    stations.forEach((s, si) => {
      for (let k = 0; k < PROTONS_PER_STATION; k++) {
        list.push({ station: s, phase: k / PROTONS_PER_STATION + si * 0.13 })
      }
    })
    return list
  }, [stations])

  // Complex II: its point on the wall, plus the path its electron takes. The
  // electron starts DOWN in the matrix (below and inside), rises up into the
  // station (the side door), then passes on along the wall into the chain.
  const complex2 = useMemo(() => {
    const point = new Vector3(COMPLEX2_X, 0, surfaceZ(COMPLEX2_X))
    const matrixEntry = new Vector3(COMPLEX2_X, -0.5, 0.45) // deep in the matrix
    const chainExit = new Vector3(0.25, 0, 0.75) // on toward the next pumper
    return { point, matrixEntry, chainExit }
  }, [])

  useFrame((_state, delta) => {
    const offset = scroll.offset
    // presence: fades IN as Scene 5 begins (so earlier scenes stay clean) and
    // fades OUT as Scene 6 (ATP synthase) takes over, so the pumping apparatus
    // recedes for the climax. charge: climbs as we track along the row.
    // (All re-spaced for pages=22.)
    const presenceIn = clamp01((offset - 0.552) / 0.027)
    const presenceOut = 1 - clamp01((offset - 0.82) / 0.05)
    const presence = presenceIn * presenceOut
    const charge = clamp01((offset - 0.573) / 0.096)

    stationMat.opacity = presence
    stationMat.emissiveIntensity = 0.4 + 0.7 * charge // membrane glows as it charges
    electronMat.opacity = presence
    protonMat.opacity = presence
    complex2Mat.opacity = presence
    if (imsLight.current) imsLight.current.intensity = 3 * presence * charge

    // Advance the animation clock (frozen under reduced motion).
    if (!prefersReducedMotion) timeRef.current += delta
    const t = timeRef.current

    // Electrons glide along the row (just inside the wall) and loop.
    for (let i = 0; i < ELECTRON_COUNT; i++) {
      const mesh = electronRefs.current[i]
      if (!mesh) continue
      const phase = (t * 0.12 + i / ELECTRON_COUNT) % 1
      const x = -1.2 + phase * 2.4
      mesh.position.set(x, 0, surfaceZ(x) - 0.05)
    }

    // Protons are pumped from the matrix side outward across the wall.
    for (let i = 0; i < protons.length; i++) {
      const mesh = protonRefs.current[i]
      if (!mesh) continue
      const { station, phase } = protons[i]
      const p = (t * 0.3 + phase) % 1
      const along = -0.12 + p * 0.67 // from just inside (-0.12) to outside (+0.55)
      mesh.position.set(
        station.point.x + station.normal.x * along,
        station.point.y + station.normal.y * along,
        station.point.z + station.normal.z * along
      )
      const s = presence * envelope(p)
      mesh.scale.setScalar(s)
    }

    // Complex II's electron: rises from the matrix (first half of its loop),
    // then passes through into the chain (second half). It is NEVER handed down
    // the row, and NO proton is pumped here — that contrast is the whole beat.
    for (let i = 0; i < COMPLEX2_ELECTRONS; i++) {
      const mesh = c2ElectronRefs.current[i]
      if (!mesh) continue
      const p = (t * 0.15 + i / COMPLEX2_ELECTRONS) % 1
      if (p < 0.5) {
        // Side entry: up from the matrix into the station.
        mesh.position.lerpVectors(complex2.matrixEntry, complex2.point, p / 0.5)
      } else {
        // Passes through into the chain along the wall.
        mesh.position.lerpVectors(complex2.point, complex2.chainExit, (p - 0.5) / 0.5)
      }
      mesh.scale.setScalar(presence)
    }
  })

  return (
    <group>
      {/* Three pumping stations embedded in the wall. */}
      {stations.map((s, i) => (
        <mesh key={i} position={s.point} quaternion={s.quat} material={stationMat}>
          <cylinderGeometry args={[0.13, 0.13, 0.34, 20]} />
        </mesh>
      ))}

      {/* Gold electrons hopping along the row (positions set each frame). */}
      {Array.from({ length: ELECTRON_COUNT }).map((_, i) => (
        <mesh
          key={`e-${i}`}
          ref={(el) => {
            electronRefs.current[i] = el
          }}
          material={electronMat}
        >
          <sphereGeometry args={[0.05, 12, 12]} />
        </mesh>
      ))}

      {/* Violet protons being pumped across (positions and scale set each frame). */}
      {protons.map((_, i) => (
        <mesh
          key={`p-${i}`}
          ref={(el) => {
            protonRefs.current[i] = el
          }}
          material={protonMat}
        >
          <sphereGeometry args={[0.045, 10, 10]} />
        </mesh>
      ))}

      {/* Complex II (the odd one out): a distinct faceted shape in a muted teal,
          sitting in the gap. It pumps nothing — note there are no protons for it. */}
      <mesh position={complex2.point} material={complex2Mat}>
        <octahedronGeometry args={[0.16, 0]} />
      </mesh>

      {/* Complex II's electron(s), rising from the matrix side (positions set
          each frame). Gold, like all electrons — the difference is the PATH. */}
      {Array.from({ length: COMPLEX2_ELECTRONS }).map((_, i) => (
        <mesh
          key={`c2-${i}`}
          ref={(el) => {
            c2ElectronRefs.current[i] = el
          }}
          material={electronMat}
        >
          <sphereGeometry args={[0.05, 12, 12]} />
        </mesh>
      ))}

      {/* The accumulating charge on the intermembrane-space side: a violet glow
          that grows as protons pile up. */}
      <pointLight ref={imsLight} color={PROTON} intensity={0} position={[0, 0, 1.15]} distance={3} decay={2} />
    </group>
  )
}
