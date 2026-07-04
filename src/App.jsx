import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import { CameraRig } from './CameraRig.jsx'
import { MitochondrionScene } from './scenes/MitochondrionScene.jsx'

/*
 * App — the whole site's stage.
 *
 * <Canvas> is the 3D drawing surface that fills the browser window. Everything
 * inside it is 3D. The <div> title overlay sits on top in plain HTML.
 *
 * <ScrollControls pages={3}> makes the page three screens tall so there is room
 * to scroll; CameraRig reads that scroll and moves the camera (see CameraRig.jsx).
 *
 * Phase 1 renders a single scene. To add the next JOURNEY.md scene later, you
 * create a new component in /scenes and drop it in beside MitochondrionScene.
 */

const SPACE = '#05060a' // the dark "cytoplasm" background

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas camera={{ position: [0, 0.4, 7], fov: 50 }}>
        {/* Paint the background of the 3D world dark, and fade distant things
            into that same dark with fog for a sense of depth. */}
        <color attach="background" args={[SPACE]} />
        <fog attach="fog" args={[SPACE, 9, 24]} />

        {/* Lighting: a dim ambient fill so nothing is pure black, plus a cool
            cyan key light for a hint of the palette's structure colour. The
            organelle's own warm glow comes from inside the scene component. */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} color="#8fbfff" />

        <ScrollControls pages={3} damping={0.3}>
          <CameraRig />
          <MitochondrionScene />
        </ScrollControls>
      </Canvas>

      {/* Title overlay. pointerEvents: 'none' lets scroll/mouse pass through to
          the canvas underneath. Copy is JOURNEY.md Scene 0. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '0 24px 8vh',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
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
    </div>
  )
}
