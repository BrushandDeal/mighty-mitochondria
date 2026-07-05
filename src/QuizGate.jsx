/*
 * QuizGate — one reusable quiz-gate card (the HTML overlay for a gate).
 *
 * Gate 1 used to be hardcoded inline in App.jsx. This component holds the exact
 * same look and behaviour, parameterized, so every gate (1, 2, and the coming 3)
 * is one instance instead of a copy. It renders ONLY the question card and its
 * centred wrapper; the two things that differ per gate and live elsewhere are:
 *   - the scroll LOCK (App.jsx's GateLock, keyed to the gate's offset), and
 *   - the REWARD transition (CameraRig's spiral, keyed to the gate's offset).
 *
 * Visibility (opacity + pointer-events) is driven from OverlayController through
 * `cardRef`, exactly as before, so the card fades with the scroll and never
 * blocks scrolling once answered.
 *
 * Props:
 *   cardRef     ref to the inner card (OverlayController sets its opacity)
 *   label       small eyebrow label, e.g. "Quiz Gate 2"
 *   question    the question text
 *   options     array of { key, label, correct }
 *   passed      true once answered correctly (shows the passed note)
 *   wrong       true after a wrong click (shows the hint)
 *   passedNote  the short note shown once passed
 *   wrongHint   the gentle hint shown on a wrong answer (never reveals the answer)
 *   onAnswer    called with the option's `correct` boolean on each click
 */

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

export function QuizGate({ cardRef, label, question, options, passed, wrong, passedNote, wrongHint, onAnswer }) {
  return (
    // Full-screen wrapper ignores the mouse so scrolling passes through to the
    // 3D canvas; the inner card's pointer-events are toggled with its visibility
    // by OverlayController.
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
        ref={cardRef}
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
          {label}
        </p>
        {passed ? (
          <p style={{ margin: '14px 0 0', fontSize: 'clamp(15px, 2.2vw, 18px)', color: '#cfe9ef' }}>
            {passedNote}
          </p>
        ) : (
          <>
            <p style={{ margin: '12px 0 0', fontSize: 'clamp(16px, 2.4vw, 20px)', lineHeight: 1.45 }}>
              {question}
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
              {options.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => onAnswer(o.correct)}
                  style={answerButtonStyle}
                >
                  {o.key}) {o.label}
                </button>
              ))}
            </div>
            {wrong && (
              <p style={{ margin: '16px 0 0', fontSize: 14, color: '#cfe9ef', fontStyle: 'italic' }}>
                {wrongHint}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
