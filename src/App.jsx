import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ScrollControls, useScroll } from '@react-three/drei'
import { CameraRig } from './CameraRig.jsx'
import { MitochondrionScene } from './scenes/MitochondrionScene.jsx'
import { OuterMembraneScene } from './scenes/OuterMembraneScene.jsx'
import { InnerMembraneScene } from './scenes/InnerMembraneScene.jsx'

/*
 * App — the whole site's stage.
 *
 * <Canvas> is the 3D drawing surface that fills the browser window. Everything
 * inside it is 3D. The <div> text overlays sit on top in plain HTML.
 *
 * <ScrollControls pages={8}> makes the page eight screens tall so there is room
 * to scroll through the overview, down onto the membrane, and inside to the
 * cristae; CameraRig reads that scroll and moves the camera along its waypoints
 * (see CameraRig.jsx).
 *
 * To add the next JOURNEY.md scene, create a component in /scenes, drop it in
 * beside the others, add a camera waypoint, and lengthen `pages` if needed.
 */

const SPACE = '#05060a' // the dark "cytoplasm" background

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/*
 * OverlayController — fades the HTML text blocks based on scroll position.
 *
 * It runs inside the Canvas (so it can read scroll) but reaches back out to the
 * overlay <div>s through refs and sets their opacity directly each frame. Doing
 * it this way avoids re-rendering React on every frame, which keeps it smooth.
 */
function OverlayController({ titleRef, scene2Ref, scene3Ref }) {
  const scroll = useScroll()
  useFrame(() => {
    const offset = scroll.offset
    // Scene 0 title: fully visible at the top, gone by 15% down.
    if (titleRef.current) {
      titleRef.current.style.opacity = String(1 - clamp01(offset / 0.15))
    }
    // Scene 2 copy: fades in at the membrane (40-50%), then back out as we slip
    // inside (60-70%) so it does not linger in the interior.
    if (scene2Ref.current) {
      const inAmount = clamp01((offset - 0.4) / 0.1)
      const outAmount = 1 - clamp01((offset - 0.6) / 0.1)
      scene2Ref.current.style.opacity = String(inAmount * outAmount)
    }
    // Scene 3 copy: fades in during the fold reveal (82-92%).
    if (scene3Ref.current) {
      scene3Ref.current.style.opacity = String(clamp01((offset - 0.82) / 0.1))
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

export default function App() {
  const titleRef = useRef(null)
  const scene2Ref = useRef(null)
  const scene3Ref = useRef(null)

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

        <ScrollControls pages={8} damping={0.3}>
          <CameraRig />
          <MitochondrionScene />
          <OuterMembraneScene />
          <InnerMembraneScene />
          <OverlayController
            titleRef={titleRef}
            scene2Ref={scene2Ref}
            scene3Ref={scene3Ref}
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

      {/* Scene 2 copy overlay (JOURNEY.md Scene 2, verbatim). Fades in at the
          membrane. This is the only claim shown here, and it traces to
          RESEARCH.md (outer membrane is permeable to small molecules via porins). */}
      <div ref={scene2Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={{ margin: 0, maxWidth: 560, fontSize: 'clamp(16px, 2.4vw, 22px)', lineHeight: 1.5 }}>
          First, the outer wall. It&rsquo;s a border, but a relaxed one, studded
          with pores that let small molecules drift in and out freely. Think
          checkpoint, not fortress.
        </p>
      </div>

      {/* Scene 3 copy overlay (JOURNEY.md Scene 3, verbatim). Fades in during the
          fold reveal. The only claims here are: the inner membrane is folded into
          cristae, which increase surface area; and it is sealed — both in
          RESEARCH.md Part A. */}
      <div ref={scene3Ref} style={{ ...overlayBase, opacity: 0 }}>
        <p style={{ margin: 0, maxWidth: 560, fontSize: 'clamp(16px, 2.4vw, 22px)', lineHeight: 1.5 }}>
          Slip inside and everything changes. The inner membrane is packed into
          deep folds called cristae. The trick is surface area: more folds mean
          more room for the machinery that makes energy. And unlike the outer
          wall, this one is sealed tight. Remember that seal. It&rsquo;s the whole
          reason the next part works.
        </p>
      </div>
    </div>
  )
}
