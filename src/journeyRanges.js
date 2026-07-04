/*
 * journeyRanges.js — shared scroll-position constants.
 *
 * Several files need to agree on where key moments happen in the scroll, so the
 * membrane fade, the camera, the quiz gate, and the matrix reveal all line up.
 * Defining them here once keeps them in sync.
 *
 * `scroll.offset` runs 0 (top of page) to 1 (bottom). With ScrollControls
 * pages=12, that maps across the whole journey (overview -> membrane -> inside
 * -> Gate 1 -> matrix).
 */

// The gentle spin speed of the whole organelle, shared so every scene rotates in
// lockstep and the pores/folds stay aligned to the surface.
export const ROTATION_SPEED = 0.15

// The scroll window over which the camera passes through the outer membrane
// (Scene 3 entry). Outside before PASS_START; fully inside by PASS_END.
const PASS_START = 0.4
const PASS_END = 0.5

// Gate 1 sits at the end of the Scene 3 fold sweep. Scroll is locked here until
// the visitor answers correctly; then the spiral dive into the matrix plays.
export const GATE1_OFFSET = 0.62

// The scroll window over which the matrix (Scene 4) fades in — only after the
// gate, so it stays hidden until the visitor has earned the dive.
const MATRIX_START = 0.63
const MATRIX_END = 0.82

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/*
 * interiorFactor — 0 while we are outside the organelle, ramping smoothly to 1
 * as the camera slips inside. Fades the outer membrane out (and slows the spin).
 */
export function interiorFactor(offset) {
  return clamp01((offset - PASS_START) / (PASS_END - PASS_START))
}

/*
 * matrixFactor — 0 until the gate is passed, ramping to 1 as the spiral dive
 * carries us into the matrix. Fades the matrix contents in (and dims the folds).
 */
export function matrixFactor(offset) {
  return clamp01((offset - MATRIX_START) / (MATRIX_END - MATRIX_START))
}
