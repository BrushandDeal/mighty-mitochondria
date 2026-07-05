import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScrollControls, useScroll } from '@react-three/drei'
import { Color } from 'three'
import { CameraRig } from './CameraRig.jsx'
import { MitochondrionScene } from './scenes/MitochondrionScene.jsx'
import { OuterMembraneScene } from './scenes/OuterMembraneScene.jsx'
import { InnerMembraneScene } from './scenes/InnerMembraneScene.jsx'
import { MatrixScene } from './scenes/MatrixScene.jsx'
import { ElectronTransportChainScene } from './scenes/ElectronTransportChainScene.jsx'
import { AtpSynthaseScene } from './scenes/AtpSynthaseScene.jsx'
import { HeartTissueScene } from './scenes/HeartTissueScene.jsx'
import { BiggerStoryScene } from './scenes/BiggerStoryScene.jsx'
import { ThresholdScene } from './scenes/ThresholdScene.jsx'
import { FrontierScene } from './scenes/FrontierScene.jsx'
import { WholeCellScene } from './scenes/WholeCellScene.jsx'
import { QuizGate } from './QuizGate.jsx'
import { GATE1_OFFSET, GATE2_OFFSET, GATE3_OFFSET, TOTAL_PAGES, page } from './journeyRanges.js'

/*
 * App — the whole site's stage.
 *
 * <Canvas> is the 3D drawing surface that fills the browser window. Everything
 * inside it is 3D. The <div> text overlays sit on top in plain HTML.
 *
 * <ScrollControls pages={TOTAL_PAGES}> makes the page TOTAL_PAGES screens tall so
 * there is room for the whole journey so far: overview, membrane, inside to the
 * cristae, Quiz Gate 1, the spiral dive into the matrix, the electron transport
 * chain, and ATP synthase with its "what is ATP" side journey. CameraRig moves
 * the camera. Every firing point below is pinned to a page number via page()
 * (see journeyRanges.js), so scene timings are stable as pages are added.
 *
 * To add the next JOURNEY.md scene, create a component in /scenes, drop it in
 * beside the others, add a camera waypoint at its page number, and raise
 * TOTAL_PAGES so the new scene has room. Earlier page numbers stay put.
 */

const SPACE = '#05060a' // the dark "cytoplasm" background

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/*
 * GateLock — blocks forward scroll at a quiz gate until it is answered.
 *
 * While locked, if the scroll goes past the gate line (`lockOffset`) it is gently
 * pinned back, so you can still scroll UP to re-examine the previous scene (as the
 * hint suggests) but cannot pass DOWN until you answer correctly. One instance per
 * gate, each pointed at its own offset.
 */
function GateLock({ passed, lockOffset }) {
  const scroll = useScroll()
  useFrame(() => {
    if (passed) return
    const el = scroll.el
    if (!el) return
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll <= 0) return
    const gateScroll = lockOffset * maxScroll
    if (el.scrollTop > gateScroll) el.scrollTop = gateScroll
  })
  return null
}

// The base look (matches the static <color>/<fog> below) and the cooler frontier
// look we lerp toward once past the threshold.
const BASE_BG = new Color(SPACE)
const COOL_BG = new Color('#070c16') // a deeper, cooler blue for the frontier

/*
 * FrontierEnvironment — cools the palette and opens the space as we cross the
 * threshold. It drives the SHARED fog and background colour from scroll, but only
 * in the new page range: before page 33.5 the lerp factor is 0, so it writes the
 * exact base values and every earlier scene looks identical. Past the threshold it
 * shifts toward COOL_BG and pushes fog far out (24 -> 42) so we can see further.
 */
function FrontierEnvironment() {
  const scroll = useScroll()
  const { scene } = useThree()
  useFrame(() => {
    const coolFactor = clamp01((scroll.offset - page(33.5)) / page(1.5))
    if (scene.fog) {
      scene.fog.color.lerpColors(BASE_BG, COOL_BG, coolFactor)
      scene.fog.far = 24 + (42 - 24) * coolFactor
    }
    if (scene.background && scene.background.isColor) {
      scene.background.lerpColors(BASE_BG, COOL_BG, coolFactor)
    }
  })
  return null
}

/*
 * ScrollElCapture — stashes the ScrollControls scroll element into a ref so the
 * closing Restart button (plain HTML, outside the Canvas) can smooth-scroll the
 * ride back to the top.
 */
function ScrollElCapture({ elRef }) {
  const scroll = useScroll()
  useFrame(() => {
    elRef.current = scroll.el
  })
  return null
}

/*
 * OverlayController — fades the HTML text blocks based on scroll position.
 *
 * It runs inside the Canvas (so it can read scroll) but reaches back out to the
 * overlay <div>s through refs and sets their opacity directly each frame. Doing
 * it this way avoids re-rendering React on every frame, which keeps it smooth.
 */
function OverlayController({
  titleRef,
  scene1Ref,
  scene2Ref,
  scene3Ref,
  scene4Ref,
  scene5Ref,
  scene6Ref,
  scene7Ref,
  story1Ref,
  story2Ref,
  story3Ref,
  story4Ref,
  thresholdRef,
  frontier1Ref,
  frontier2Ref,
  frontier3Ref,
  closingRef,
  restartBtnRef,
  detourRef,
  gate1Ref,
  gate1Passed,
  gate2Ref,
  gate2Passed,
  gate3Ref,
  gate3Passed,
  meterRef,
  meterFillRef,
  meterElectricRef,
}) {
  const scroll = useScroll()
  useFrame(() => {
    const o = scroll.offset
    // Every threshold below is pinned to a page number via page() (see
    // journeyRanges.js), so these firing points stay put as pages are added. The
    // trailing "// was <fraction>" on each line records the old whole-ride value.
    // Scene 0 title: fully visible at the top, fades out early.
    if (titleRef.current) {
      titleRef.current.style.opacity = String(1 - clamp01(o / page(0.738))) // was o / 0.041
    }
    // Scene 1 copy: fades in as the camera dollies in (its beat is at page 1.296),
    // out again before Scene 2 begins at page 2.376.
    if (scene1Ref.current) {
      const inAmount = clamp01((o - page(0.9)) / page(0.4))
      const outAmount = 1 - clamp01((o - page(1.9)) / page(0.4))
      scene1Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 2 copy: fades in at the membrane, back out as we slip inside.
    if (scene2Ref.current) {
      const inAmount = clamp01((o - page(2.376)) / page(0.432)) // was (o - 0.132) / 0.024
      const outAmount = 1 - clamp01((o - page(3.24)) / page(0.432)) // was (o - 0.18) / 0.024
      scene2Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 3 copy: fades in during the fold sweep, out as we reach the gate.
    if (scene3Ref.current) {
      const inAmount = clamp01((o - page(4.32)) / page(0.432)) // was (o - 0.24) / 0.024
      const outAmount = 1 - clamp01((o - page(4.95)) / page(0.324)) // was (o - 0.275) / 0.018
      scene3Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Quiz card: the question shows once we reach the gate. After it is passed,
    // the card briefly becomes a "Correct" note, then fades as we spiral away.
    // Pointer-events are only on while the question is up, so the card never
    // blocks scrolling once answered (and hidden buttons can't click).
    if (gate1Ref.current) {
      const nearGate = o > page(4.95) // was 0.275
      const show = gate1Passed ? (nearGate && o < page(6.264) ? 1 : 0) : nearGate ? 1 : 0 // was 0.348
      gate1Ref.current.style.opacity = String(show)
      gate1Ref.current.style.pointerEvents = show && !gate1Passed ? 'auto' : 'none'
    }
    // Quiz Gate 2 card: same mechanic as Gate 1. Shows as we reach the end of the
    // Scene 6 climax (just before the lock at page 19); after it is passed, it
    // briefly reads "Correct", then fades as the outward spiral (to page 22) plays.
    if (gate2Ref.current) {
      const nearGate2 = o > page(18.5)
      const show = gate2Passed ? (nearGate2 && o < page(20) ? 1 : 0) : nearGate2 ? 1 : 0
      gate2Ref.current.style.opacity = String(show)
      gate2Ref.current.style.pointerEvents = show && !gate2Passed ? 'auto' : 'none'
    }
    // Scene 4 copy: fades in during the matrix float, out before Scene 5.
    if (scene4Ref.current) {
      const inAmount = clamp01((o - page(7.866)) / page(0.324)) // was (o - 0.437) / 0.018
      const outAmount = 1 - clamp01((o - page(8.424)) / page(0.324)) // was (o - 0.468) / 0.018
      scene4Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 5 copy: fades in as we track the stations, stays through the Complex
    // II beat, then fades out as ATP synthase takes over.
    if (scene5Ref.current) {
      const inAmount = clamp01((o - page(9.504)) / page(0.432)) // was (o - 0.528) / 0.024
      const outAmount = 1 - clamp01((o - page(13.14)) / page(0.468)) // was (o - 0.73) / 0.026
      scene5Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 6 climax copy: fades in during the orbit (naming ATP), out as the
    // side journey begins.
    if (scene6Ref.current) {
      const inAmount = clamp01((o - page(13.32)) / page(0.36)) // was (o - 0.74) / 0.02
      const outAmount = 1 - clamp01((o - page(15.12)) / page(0.27)) // was (o - 0.84) / 0.015
      scene6Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // ATP side-journey copy: fades in during the swing-right hold, out on return.
    if (detourRef.current) {
      const inAmount = clamp01((o - page(15.39)) / page(0.27)) // was (o - 0.855) / 0.015
      const outAmount = 1 - clamp01((o - page(16.92)) / page(0.216)) // was (o - 0.94) / 0.012
      detourRef.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 7 copy: fades in as the outward spiral settles into the heart tissue,
    // then fades back out as the camera drifts off to the Scene 8 constellation.
    if (scene7Ref.current) {
      const inAmount = clamp01((o - page(22.3)) / page(0.5))
      const outAmount = 1 - clamp01((o - page(24.4)) / page(0.6))
      scene7Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 8 cards: one calm beat per node, each fading in as we reach its node
    // and back out before the next. Windows pinned to page numbers.
    if (story1Ref.current) {
      const inAmount = clamp01((o - page(24.8)) / page(0.4))
      const outAmount = 1 - clamp01((o - page(26.0)) / page(0.4))
      story1Ref.current.style.opacity = String(inAmount * outAmount)
    }
    if (story2Ref.current) {
      const inAmount = clamp01((o - page(26.3)) / page(0.4))
      const outAmount = 1 - clamp01((o - page(27.5)) / page(0.4))
      story2Ref.current.style.opacity = String(inAmount * outAmount)
    }
    if (story3Ref.current) {
      const inAmount = clamp01((o - page(27.8)) / page(0.4))
      const outAmount = 1 - clamp01((o - page(29.0)) / page(0.4))
      story3Ref.current.style.opacity = String(inAmount * outAmount)
    }
    if (story4Ref.current) {
      const inAmount = clamp01((o - page(29.3)) / page(0.4))
      const outAmount = 1 - clamp01((o - page(30.2)) / page(0.4))
      story4Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Quiz Gate 3 card: same mechanic as Gates 1 and 2. Shows at the last node
    // (just before the lock at page 31); after it is passed it briefly reads
    // "Correct", then fades as the camera drifts on toward the frontier.
    if (gate3Ref.current) {
      const nearGate3 = o > page(30.6)
      const show = gate3Passed ? (nearGate3 && o < page(32.2) ? 1 : 0) : nearGate3 ? 1 : 0
      gate3Ref.current.style.opacity = String(show)
      gate3Ref.current.style.pointerEvents = show && !gate3Passed ? 'auto' : 'none'
    }
    // Threshold copy: fades in as we approach the portal, out as we pass through
    // it into the frontier.
    if (thresholdRef.current) {
      const inAmount = clamp01((o - page(33.7)) / page(0.5))
      const outAmount = 1 - clamp01((o - page(35.4)) / page(0.5))
      thresholdRef.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 9 frontier cards: one research beat per node, each fading in as we
    // reach its node and back out before the next.
    if (frontier1Ref.current) {
      const inAmount = clamp01((o - page(36.0)) / page(0.4))
      const outAmount = 1 - clamp01((o - page(37.3)) / page(0.4))
      frontier1Ref.current.style.opacity = String(inAmount * outAmount)
    }
    if (frontier2Ref.current) {
      const inAmount = clamp01((o - page(37.8)) / page(0.4))
      const outAmount = 1 - clamp01((o - page(39.1)) / page(0.4))
      frontier2Ref.current.style.opacity = String(inAmount * outAmount)
    }
    if (frontier3Ref.current) {
      const inAmount = clamp01((o - page(39.6)) / page(0.4))
      const outAmount = 1 - clamp01((o - page(40.9)) / page(0.4))
      frontier3Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Closing copy: fades in as the whole cell frames up, then holds to the end.
    // Only the Restart button takes the mouse (and only once the closing is up),
    // so nothing intercepts scrolling earlier in the ride.
    if (closingRef.current) {
      closingRef.current.style.opacity = String(clamp01((o - page(42.4)) / page(0.6)))
    }
    if (restartBtnRef.current) {
      restartBtnRef.current.style.pointerEvents = o > page(42.6) ? 'auto' : 'none'
    }
    // Charge meter: fades in with Scene 5, its fill climbs as charge builds, then
    // DISCHARGES (drops) during the Scene 6 orbit as protons flow back.
    if (meterRef.current) {
      const meterIn = clamp01((o - page(8.748)) / page(0.432)) // was (o - 0.486) / 0.024
      const meterOut = 1 - clamp01((o - page(17.46)) / page(0.36)) // was (o - 0.97) / 0.02
      meterRef.current.style.opacity = String(meterIn * meterOut)
    }
    if (meterFillRef.current) {
      const build = clamp01((o - page(9.072)) / page(1.512)) // was (o - 0.504) / 0.084
      const discharge = clamp01((o - page(13.86)) / page(1.53)) // was (o - 0.77) / 0.085
      meterFillRef.current.style.height = `${build * (1 - discharge) * 100}%`
    }
    // Electricity: visible only while the bar is actively draining (page 13.86 to
    // 15.39, was 0.77 to 0.855), so the crackle reads as the stored charge spent.
    if (meterElectricRef.current) {
      const active = clamp01((o - page(13.86)) / page(0.36)) * (1 - clamp01((o - page(15.39)) / page(0.36))) // was (o - 0.77) / 0.02 and (o - 0.855) / 0.02
      meterElectricRef.current.style.opacity = String(active)
    }
  })
  return null
}

// Shared layout for a centred, bottom-anchored text overlay that ignores the
// mouse (so scrolling passes through to the 3D canvas underneath).
const overlayBase = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  padding: '0 24px 8vh',
  textAlign: 'center',
  pointerEvents: 'none',
}

const copyStyle = {
  margin: 0,
  maxWidth: 580,
  fontSize: 'clamp(16px, 2.4vw, 22px)',
  lineHeight: 1.5,
}

// Gate 1 options (JOURNEY.md). Only B is correct; text traces to RESEARCH.md
// (cristae fold to pack in surface area for the energy machinery).
const GATE1_OPTIONS = [
  { key: 'A', label: "To store the cell's DNA", correct: false },
  { key: 'B', label: 'To pack in more surface area for making energy', correct: true },
  { key: 'C', label: 'To let large molecules pass through easily', correct: false },
  { key: 'D', label: 'To give the mitochondrion its shape', correct: false },
]

// Gate 2 options (JOURNEY.md). Only B is correct; it traces to the existing
// electron transport chain and ATP synthase entries in RESEARCH.md (protons
// flowing back across the inner membrane spin the motor).
const GATE2_OPTIONS = [
  { key: 'A', label: 'Sunlight', correct: false },
  { key: 'B', label: 'Protons rushing back across the inner membrane', correct: true },
  { key: 'C', label: 'Glucose entering the matrix directly', correct: false },
  { key: 'D', label: "The mitochondrion's DNA", correct: false },
]

// Gate 3 options (JOURNEY.md). The question asks which is NOT a mitochondrial
// job, so the CORRECT choice is the odd one out: C, photosynthesis (a plant's
// job). The three real jobs trace to RESEARCH.md: ATP (Part A), apoptosis via
// cytochrome c (line 60), and heat generation (line 62).
const GATE3_OPTIONS = [
  { key: 'A', label: 'Producing ATP energy', correct: false },
  { key: 'B', label: 'Helping trigger programmed cell death', correct: false },
  { key: 'C', label: 'Photosynthesis, making sugar from sunlight', correct: true },
  { key: 'D', label: 'Generating body heat', correct: false },
]

export default function App() {
  const titleRef = useRef(null)
  const scene1Ref = useRef(null)
  const scene2Ref = useRef(null)
  const scene3Ref = useRef(null)
  const scene4Ref = useRef(null)
  const scene5Ref = useRef(null)
  const scene6Ref = useRef(null)
  const scene7Ref = useRef(null)
  const story1Ref = useRef(null)
  const story2Ref = useRef(null)
  const story3Ref = useRef(null)
  const story4Ref = useRef(null)
  const thresholdRef = useRef(null)
  const frontier1Ref = useRef(null)
  const frontier2Ref = useRef(null)
  const frontier3Ref = useRef(null)
  const closingRef = useRef(null)
  const restartBtnRef = useRef(null)
  const scrollElRef = useRef(null)
  const detourRef = useRef(null)
  const gate1Ref = useRef(null)
  const gate2Ref = useRef(null)
  const gate3Ref = useRef(null)
  const meterRef = useRef(null)
  const meterFillRef = useRef(null)
  const meterElectricRef = useRef(null)

  const [gate1Passed, setGate1Passed] = useState(false)
  const [gate1Wrong, setGate1Wrong] = useState(false)
  const [gate2Passed, setGate2Passed] = useState(false)
  const [gate2Wrong, setGate2Wrong] = useState(false)
  const [gate3Passed, setGate3Passed] = useState(false)
  const [gate3Wrong, setGate3Wrong] = useState(false)

  const handleGate1Answer = (correct) => {
    if (correct) {
      setGate1Passed(true)
      setGate1Wrong(false)
    } else {
      setGate1Wrong(true)
    }
  }

  const handleGate2Answer = (correct) => {
    if (correct) {
      setGate2Passed(true)
      setGate2Wrong(false)
    } else {
      setGate2Wrong(true)
    }
  }

  const handleGate3Answer = (correct) => {
    if (correct) {
      setGate3Passed(true)
      setGate3Wrong(false)
    } else {
      setGate3Wrong(true)
    }
  }

  // Restart: smooth-scroll the ScrollControls element back to the top of the ride.
  const handleRestart = () => {
    const el = scrollElRef.current
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas camera={{ position: [0, 0.5, 7], fov: 50 }}>
        {/* Paint the background of the 3D world dark, and fade distant things
            into that same dark with fog for a sense of depth. */}
        <color attach="background" args={[SPACE]} />
        <fog attach="fog" args={[SPACE, 9, 24]} />

        {/* Lighting: a dim ambient fill so nothing is pure black, plus a cool
            cyan key light for a hint of the palette's structure colour. The
            organelle's own warm glow comes from inside the scene component. */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} color="#8fbfff" />

        <ScrollControls pages={TOTAL_PAGES} damping={0.3}>
          <CameraRig />
          <MitochondrionScene />
          <OuterMembraneScene />
          <InnerMembraneScene />
          <MatrixScene />
          <ElectronTransportChainScene />
          <AtpSynthaseScene />
          <HeartTissueScene />
          <BiggerStoryScene />
          <ThresholdScene />
          <FrontierScene />
          <WholeCellScene />
          <FrontierEnvironment />
          <ScrollElCapture elRef={scrollElRef} />
          <GateLock passed={gate1Passed} lockOffset={GATE1_OFFSET} />
          <GateLock passed={gate2Passed} lockOffset={GATE2_OFFSET} />
          <GateLock passed={gate3Passed} lockOffset={GATE3_OFFSET} />
          <OverlayController
            titleRef={titleRef}
            scene1Ref={scene1Ref}
            scene2Ref={scene2Ref}
            scene3Ref={scene3Ref}
            scene4Ref={scene4Ref}
            scene5Ref={scene5Ref}
            scene6Ref={scene6Ref}
            scene7Ref={scene7Ref}
            story1Ref={story1Ref}
            story2Ref={story2Ref}
            story3Ref={story3Ref}
            story4Ref={story4Ref}
            thresholdRef={thresholdRef}
            frontier1Ref={frontier1Ref}
            frontier2Ref={frontier2Ref}
            frontier3Ref={frontier3Ref}
            closingRef={closingRef}
            restartBtnRef={restartBtnRef}
            detourRef={detourRef}
            gate1Ref={gate1Ref}
            gate1Passed={gate1Passed}
            gate2Ref={gate2Ref}
            gate2Passed={gate2Passed}
            gate3Ref={gate3Ref}
            gate3Passed={gate3Passed}
            meterRef={meterRef}
            meterFillRef={meterFillRef}
            meterElectricRef={meterElectricRef}
          />
        </ScrollControls>
      </Canvas>

      {/* Scene 0 title overlay (JOURNEY.md Scene 0). Fades out as you scroll. */}
      <div ref={titleRef} style={{ ...overlayBase, opacity: 1 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(32px, 6vw, 64px)', letterSpacing: '-0.02em' }}>
          Mighty Mitochondria
        </h1>
        <p style={{ margin: '12px 0 0', maxWidth: 520, opacity: 0.8 }}>
          The tiny engine that powers almost everything you do.
        </p>
        <p
          style={{
            margin: '28px 0 0',
            fontSize: 14,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.6,
          }}
        >
          Scroll to begin the descent
        </p>
      </div>

      {/* Scene 1 copy (JOURNEY.md Scene 1, verbatim). Traces to RESEARCH.md:
          energy is unlocked and repackaged (not made from nothing); the count is
          floor-framed into quadrillions with no exact total; cyanide kills in
          minutes by jamming this machine. */}
      <div ref={scene1Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          This is a mitochondrion, an organelle inside almost every cell in your
          body. It has one famous job: it doesn&rsquo;t make energy from nothing,
          it unlocks the energy already stored in the food you&rsquo;ve eaten and
          repackages it into a form your cells can actually spend. You carry an
          astonishing number of them: at least hundreds in a busy cell, tens of
          trillions of cells in you, which stacks up into quadrillions. Nobody has
          an exact count. Sabotage them and death comes fast: that is
          exactly how cyanide kills, by jamming this machine so the body simply
          runs out of power.
        </p>
      </div>

      {/* Scene 2 copy (JOURNEY.md Scene 2, verbatim). Traces to RESEARCH.md:
          outer membrane is permeable to small molecules via porins. */}
      <div ref={scene2Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          First, the outer wall. It&rsquo;s a border, but a relaxed one, studded
          with pores that let small molecules drift in and out freely. Think
          checkpoint, not fortress.
        </p>
      </div>

      {/* Scene 3 copy (JOURNEY.md Scene 3, verbatim). Traces to RESEARCH.md:
          inner membrane is folded into cristae (surface area) and is sealed. */}
      <div ref={scene3Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          Slip inside and everything changes. The inner membrane is packed into
          deep folds called cristae. The trick is surface area: more folds mean
          more room for the machinery that makes energy. And unlike the outer
          wall, this one is sealed tight. Remember that seal. It&rsquo;s the whole
          reason the next part works.
        </p>
      </div>

      {/* Scene 4 copy (JOURNEY.md Scene 4, verbatim). Traces to RESEARCH.md:
          own circular DNA separate from the cell; matrix runs the citric acid
          cycle; an earlier step (glycolysis) already happened outside. */}
      <div ref={scene4Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          This inner space is the matrix, and it hides a secret: the mitochondrion
          has its own DNA, separate from the rest of the cell. A clue we&rsquo;ll
          come back to. An earlier step of energy extraction already happened out
          in the cell, before anything reached here. What happens inside the
          mitochondrion is the next stage: a loop of chemistry called the citric
          acid cycle breaks the fuel down further and loads up tiny
          &ldquo;electron carriers&rdquo; for the main event.
        </p>
      </div>

      {/* Scene 5 copy (JOURNEY.md Scene 5, verbatim). PART ONE traces to
          RESEARCH.md Part A: the chain pumps protons from the matrix into the
          intermembrane space; the gradient is a real voltage, not just a pile-up;
          the sealed membrane behaves like a charged battery. PART TWO traces to:
          Complex II takes part in the chain but pumps no protons; it is a second
          entry point for electrons from the citric acid cycle, bypassing Complex
          I, so it drives less ATP. */}
      <div ref={scene5Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          Now the main event. Those electron carriers dump their cargo into a
          chain of protein stations. As electrons hop down the chain, most
          stations use the energy to shove protons across the sealed membrane,
          one side filling up while the other empties. But here&rsquo;s the catch
          that trips people: protons aren&rsquo;t water. Each one is a naked
          positive charge. So you&rsquo;re not just piling stuff up, you&rsquo;re
          peeling positive away from negative and building a voltage. The sealed
          membrane is charging like a battery. And watch this one station: an
          electron slips in a side door and passes right through without pumping
          anything. Fuel that enters here drives less energy than fuel that takes
          the main road. Not every step pulls the same weight.
        </p>
      </div>

      {/* Scene 6 copy (JOURNEY.md Scene 6, verbatim, with the owner's revised
          first line). Traces to RESEARCH.md Part A: ATP synthase is a rotary
          motor spun by protons flowing back, assembling ATP from ADP + phosphate
          (never from nothing); the body turns over ~its weight in ATP per day by
          recycling. */}
      <div ref={scene6Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p className="scene6-copy" style={copyStyle}>
          Here&rsquo;s the payoff. All that stored charge has one way out that
          makes ATP: back through a single machine, ATP synthase. The rush
          of protons spins it like a revolving door, and every turn snaps loose
          parts together into ATP, your body&rsquo;s energy currency. It
          isn&rsquo;t conjured from nothing; the machine bolts together pieces
          already floating nearby. You mint roughly your own body weight in ATP
          every single day, not by making that much new stuff, but by recycling a
          small amount through this motor hundreds of times over.
        </p>
      </div>

      {/* ATP side-journey copy (JOURNEY.md "Side journey: What is ATP", verbatim).
          Traces to RESEARCH.md Part A: ATP structure (three phosphates), energy
          released by splitting the outer phosphate into ADP plus phosphate, and
          the reversible recharge run by ATP synthase. */}
      <div ref={detourRef} style={{ ...overlayBase, opacity: 0 }}>
        <p className="scene6-copy" style={copyStyle}>
          Quick detour: what is this coin, actually? ATP is your cell&rsquo;s
          rechargeable energy carrier, a small molecule with three phosphate
          groups clipped in a row. When something in the cell needs power, it pops
          off the outer phosphate to release energy the cell puts to work, leaving
          ADP behind with two. Later, this very machine clips a phosphate back on,
          turning ADP back into ATP. You never hoard much of it; you spend and
          recharge the same molecules hundreds of times a day.
        </p>
      </div>

      {/* Scene 7 copy (JOURNEY.md Scene 7, verbatim). Traces to RESEARCH.md:
          human heart muscle is roughly a quarter mitochondria by volume (about
          23% by direct morphometry). Rendered as "a quarter", never a third. */}
      <div ref={scene7Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          So where does all that energy go? Everywhere that never stops working.
          About a quarter of your heart muscles are comprised of mitochondria: a
          quarter of the machine is dedicated power plant. Your neurons, your
          muscles, they&rsquo;re all hungry for the ATP you just watched get
          minted.
        </p>
      </div>

      {/* Scene 8 cards (JOURNEY.md Scene 8, verbatim). Still settled science, so
          these sit before the threshold. Each traces to RESEARCH.md:
          1) endosymbiosis / own DNA (line 56), 2) maternal inheritance, worded
          "essentially all" not "every single one" (line 58), 3) apoptosis via
          cytochrome c (line 60), 4) heat, calcium, hormones (line 62). */}
      <div ref={story1Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          An ancient partnership: mitochondria were once free-living bacteria,
          swallowed by another cell over a billion years ago. That&rsquo;s why
          they still carry their own DNA.
        </p>
      </div>

      <div ref={story2Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          You inherited essentially all of yours from your mother, and her mother,
          and hers: an unbroken maternal line reaching back further than
          you&rsquo;d believe. They were never fully yours to begin with, because
          they started as that ancient bacterial guest.
        </p>
      </div>

      <div ref={story3Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          They don&rsquo;t just make energy, they also decide when a cell should
          die, releasing a signal (cytochrome c) that triggers self-destruction to
          protect the body.
        </p>
      </div>

      <div ref={story4Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          Beyond ATP: they generate body heat, store calcium, and help build
          hormones.
        </p>
      </div>

      {/* Threshold copy (JOURNEY.md THRESHOLD, verbatim). Not a fact card: the
          on-screen boundary telling the visitor we are leaving settled science.
          Makes no biological claim, so it needs no RESEARCH.md entry. */}
      <div ref={thresholdRef} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          From here on, we leave the settled textbook and step into what
          researchers are still working out. Everything before this line is in
          every biology course. Everything after it is where the science is still
          pointing, still arguing, still learning. Here&rsquo;s where it&rsquo;s
          headed.
        </p>
      </div>

      {/* Scene 9 frontier cards (JOURNEY.md Scene 9, verbatim). Active research,
          so they sit AFTER the threshold. Each traces to RESEARCH.md Part B:
          aging as one hallmark not the cause (Lopez-Otin 2023), exercise builds
          mitochondria (2025 meta-analysis), MELAS + ~1 in 5,000 prevalence. */}
      <div ref={frontier1Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          Aging: worn-down mitochondria are now considered one of the hallmarks of
          aging, one of several interacting drivers researchers track, not the
          single cause.
        </p>
      </div>

      <div ref={frontier2Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          Exercise: train your endurance, and your body responds by building more
          mitochondria. Your cells literally retool for the demand you place on
          them.
        </p>
      </div>

      <div ref={frontier3Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          Disease: when this ancient machine carries a fault, it causes real
          inherited illness. One example, MELAS, is passed down the same maternal
          line you just learned about, and it strikes the hungriest organs first:
          brain, heart, muscle. Roughly 1 in 5,000 people lives with a primary
          mitochondrial disease.
        </p>
      </div>

      {/* Scene 10 closing copy (JOURNEY.md Scene 10, verbatim) + optional restart.
          Recaps the endosymbiosis story (already vetted); makes no new claim. The
          wrapper stays click-through; only the Restart button takes the mouse. */}
      <div ref={closingRef} style={{ ...overlayBase, opacity: 0 }}>
        <p style={copyStyle}>
          That&rsquo;s the mighty mitochondrion: an ancient bacterial guest that
          became the engine of complex life, and of you. Now you know what&rsquo;s
          powering every beat, breath, and thought, and where scientists are still
          chasing the rest of the story.
        </p>
        <button
          ref={restartBtnRef}
          type="button"
          onClick={handleRestart}
          style={{
            marginTop: 24,
            font: 'inherit',
            fontSize: 'clamp(13px, 1.8vw, 15px)',
            letterSpacing: '0.06em',
            color: '#cfe9ef',
            background: 'rgba(64, 207, 224, 0.1)',
            border: '1px solid rgba(64, 207, 224, 0.4)',
            borderRadius: 10,
            padding: '10px 22px',
            cursor: 'pointer',
            pointerEvents: 'none',
          }}
        >
          Restart the journey
        </button>
      </div>

      {/* Charge meter: a qualitative bar that climbs as the gradient builds.
          NO numbers on it (the millivolt figures are marked TO SOURCE and stay
          off the site). Violet to match the pumped protons. */}
      <div
        ref={meterRef}
        style={{
          position: 'absolute',
          right: 'clamp(16px, 4vw, 48px)',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ position: 'relative', width: 14, height: 170 }}>
          {/* The bar track + its climbing/draining fill. */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(203, 184, 255, 0.45)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column-reverse',
            }}
          >
            <div
              ref={meterFillRef}
              style={{ width: '100%', height: '0%', background: 'linear-gradient(to top, #cbb8ff, #e8dcff)' }}
            />
          </div>
          {/* Electric crackle inside and around the bar while it discharges. Its
              opacity is driven by scroll (see OverlayController); the flicker
              animation lives in index.css. */}
          <div
            ref={meterElectricRef}
            className="charge-electric"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 8,
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#d8ccff',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
          }}
        >
          Charge
        </span>
      </div>

      {/* Quiz Gate 1 (JOURNEY.md). Blocks forward scroll until answered, then the
          spiral dives inward to the matrix. One reusable QuizGate instance. */}
      <QuizGate
        cardRef={gate1Ref}
        label="Quiz Gate 1"
        question="Why is the inner membrane folded into cristae?"
        options={GATE1_OPTIONS}
        passed={gate1Passed}
        wrong={gate1Wrong}
        passedNote="Correct. Keep scrolling to dive in."
        wrongHint="Not quite, scroll back up and look at those folds again."
        onAnswer={handleGate1Answer}
      />

      {/* Quiz Gate 2 (JOURNEY.md). Same mechanic as Gate 1; on the correct answer
          the spiral plays OUTWARD, zooming out of the cell to the body (Scene 7). */}
      <QuizGate
        cardRef={gate2Ref}
        label="Quiz Gate 2"
        question="What actually powers ATP synthase to spin?"
        options={GATE2_OPTIONS}
        passed={gate2Passed}
        wrong={gate2Wrong}
        passedNote="Correct. Keep scrolling to zoom out."
        wrongHint="Not quite. Scroll back up and watch what actually rushes through the motor and turns it."
        onAnswer={handleGate2Answer}
      />

      {/* Quiz Gate 3 (JOURNEY.md, final synthesis). Same mechanic as Gates 1 and
          2. There is no spiral reward here: on the correct answer the lock simply
          releases and the camera drifts forward toward the frontier (built later). */}
      <QuizGate
        cardRef={gate3Ref}
        label="Quiz Gate 3"
        question="Which of these is NOT a mitochondrial job?"
        options={GATE3_OPTIONS}
        passed={gate3Passed}
        wrong={gate3Wrong}
        passedNote="Correct. You've got the settled story. Now we head past the textbook."
        wrongHint="Not quite. Think back over what these organelles actually do; one of these was never on the list."
        onAnswer={handleGate3Answer}
      />
    </div>
  )
}
