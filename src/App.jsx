import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ScrollControls, useScroll } from '@react-three/drei'
import { CameraRig } from './CameraRig.jsx'
import { MitochondrionScene } from './scenes/MitochondrionScene.jsx'
import { OuterMembraneScene } from './scenes/OuterMembraneScene.jsx'
import { InnerMembraneScene } from './scenes/InnerMembraneScene.jsx'
import { MatrixScene } from './scenes/MatrixScene.jsx'
import { ElectronTransportChainScene } from './scenes/ElectronTransportChainScene.jsx'
import { GATE1_OFFSET } from './journeyRanges.js'

/*
 * App — the whole site's stage.
 *
 * <Canvas> is the 3D drawing surface that fills the browser window. Everything
 * inside it is 3D. The <div> text overlays sit on top in plain HTML.
 *
 * <ScrollControls pages={18}> makes the page eighteen screens tall so there is
 * room for the whole journey so far: overview -> membrane -> inside to the
 * cristae -> Quiz Gate 1 -> the spiral dive into the matrix -> the electron
 * transport chain (incl. the Complex II beat). CameraRig moves the camera.
 *
 * To add the next JOURNEY.md scene, create a component in /scenes, drop it in
 * beside the others, add a camera waypoint, and lengthen `pages` if needed.
 */

const SPACE = '#05060a' // the dark "cytoplasm" background

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/*
 * GateLock — blocks forward scroll at Quiz Gate 1 until it is answered.
 *
 * While locked, if the scroll goes past the gate line it is gently pinned back,
 * so you can still scroll UP to re-examine the folds (as the hint suggests) but
 * cannot pass DOWN until you answer correctly.
 */
function GateLock({ passed }) {
  const scroll = useScroll()
  useFrame(() => {
    if (passed) return
    const el = scroll.el
    if (!el) return
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll <= 0) return
    const gateScroll = GATE1_OFFSET * maxScroll
    if (el.scrollTop > gateScroll) el.scrollTop = gateScroll
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
  scene2Ref,
  scene3Ref,
  scene4Ref,
  scene5Ref,
  gateRef,
  gatePassed,
  meterRef,
  meterFillRef,
}) {
  const scroll = useScroll()
  useFrame(() => {
    const o = scroll.offset
    // (All thresholds were scaled by 15/18 when the Complex II beat was added.)
    // Scene 0 title: fully visible at the top, fades out early.
    if (titleRef.current) {
      titleRef.current.style.opacity = String(1 - clamp01(o / 0.058))
    }
    // Scene 2 copy: fades in at the membrane, back out as we slip inside.
    if (scene2Ref.current) {
      const inAmount = clamp01((o - 0.183) / 0.033)
      const outAmount = 1 - clamp01((o - 0.25) / 0.033)
      scene2Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 3 copy: fades in during the fold sweep, out as we reach the gate.
    if (scene3Ref.current) {
      const inAmount = clamp01((o - 0.333) / 0.033)
      const outAmount = 1 - clamp01((o - 0.383) / 0.025)
      scene3Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Quiz card: the question shows once we reach the gate. After it is passed,
    // the card briefly becomes a "Correct" note, then fades as we spiral away.
    // Pointer-events are only on while the question is up, so the card never
    // blocks scrolling once answered (and hidden buttons can't click).
    if (gateRef.current) {
      const nearGate = o > 0.383
      const show = gatePassed ? (nearGate && o < 0.483 ? 1 : 0) : nearGate ? 1 : 0
      gateRef.current.style.opacity = String(show)
      gateRef.current.style.pointerEvents = show && !gatePassed ? 'auto' : 'none'
    }
    // Scene 4 copy: fades in during the matrix float, out before Scene 5.
    if (scene4Ref.current) {
      const inAmount = clamp01((o - 0.608) / 0.025)
      const outAmount = 1 - clamp01((o - 0.65) / 0.025)
      scene4Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 5 copy: fades in as we track along the stations, and stays up through
    // the Complex II beat (the copy covers both parts).
    if (scene5Ref.current) {
      scene5Ref.current.style.opacity = String(clamp01((o - 0.733) / 0.033))
    }
    // Charge meter: fades in with Scene 5; its fill climbs as charge builds.
    if (meterRef.current) {
      meterRef.current.style.opacity = String(clamp01((o - 0.675) / 0.033))
    }
    if (meterFillRef.current) {
      meterFillRef.current.style.height = `${clamp01((o - 0.7) / 0.117) * 100}%`
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

// The four quiz options. Only B is correct; text traces to RESEARCH.md.
const GATE1_OPTIONS = [
  { key: 'A', label: "To store the cell's DNA", correct: false },
  { key: 'B', label: 'To pack in more surface area for making energy', correct: true },
  { key: 'C', label: 'To let large molecules pass through easily', correct: false },
  { key: 'D', label: 'To give the mitochondrion its shape', correct: false },
]

const answerButtonStyle = {
  font: 'inherit',
  fontSize: 'clamp(14px, 2vw, 16px)',
  color: '#e8ecf4',
  background: 'rgba(64, 207, 224, 0.08)',
  border: '1px solid rgba(64, 207, 224, 0.4)',
  borderRadius: 10,
  padding: '12px 16px',
  cursor: 'pointer',
  textAlign: 'left',
}

export default function App() {
  const titleRef = useRef(null)
  const scene2Ref = useRef(null)
  const scene3Ref = useRef(null)
  const scene4Ref = useRef(null)
  const scene5Ref = useRef(null)
  const gateRef = useRef(null)
  const meterRef = useRef(null)
  const meterFillRef = useRef(null)

  const [gate1Passed, setGate1Passed] = useState(false)
  const [gate1Wrong, setGate1Wrong] = useState(false)

  const handleAnswer = (correct) => {
    if (correct) {
      setGate1Passed(true)
      setGate1Wrong(false)
    } else {
      setGate1Wrong(true)
    }
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

        <ScrollControls pages={18} damping={0.3}>
          <CameraRig />
          <MitochondrionScene />
          <OuterMembraneScene />
          <InnerMembraneScene />
          <MatrixScene />
          <ElectronTransportChainScene />
          <GateLock passed={gate1Passed} />
          <OverlayController
            titleRef={titleRef}
            scene2Ref={scene2Ref}
            scene3Ref={scene3Ref}
            scene4Ref={scene4Ref}
            scene5Ref={scene5Ref}
            gateRef={gateRef}
            gatePassed={gate1Passed}
            meterRef={meterRef}
            meterFillRef={meterFillRef}
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
        <div
          style={{
            width: 14,
            height: 170,
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
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#cbb8ff',
            opacity: 0.9,
          }}
        >
          Charge
        </span>
      </div>

      {/* Quiz Gate 1 (JOURNEY.md). Blocks forward scroll until answered. The
          outer wrapper ignores the mouse so scrolling passes through; the inner
          card's pointer-events are toggled with its visibility by
          OverlayController. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          pointerEvents: 'none',
        }}
      >
        <div
          ref={gateRef}
          style={{
            opacity: 0,
            pointerEvents: 'none',
            width: '100%',
            maxWidth: 540,
            background: 'rgba(6, 12, 20, 0.8)',
            border: '1px solid rgba(64, 207, 224, 0.35)',
            borderRadius: 16,
            padding: '26px 24px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#40cfe0',
              opacity: 0.9,
            }}
          >
            Quiz Gate 1
          </p>
          {gate1Passed ? (
            <p style={{ margin: '14px 0 0', fontSize: 'clamp(15px, 2.2vw, 18px)', color: '#cfe9ef' }}>
              Correct. Keep scrolling to dive in.
            </p>
          ) : (
            <>
              <p style={{ margin: '12px 0 0', fontSize: 'clamp(16px, 2.4vw, 20px)', lineHeight: 1.45 }}>
                Why is the inner membrane folded into cristae?
              </p>
              <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
                {GATE1_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => handleAnswer(o.correct)}
                    style={answerButtonStyle}
                  >
                    {o.key}) {o.label}
                  </button>
                ))}
              </div>
              {gate1Wrong && (
                <p style={{ margin: '16px 0 0', fontSize: 14, color: '#cfe9ef', fontStyle: 'italic' }}>
                  Not quite, scroll back up and look at those folds again.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
