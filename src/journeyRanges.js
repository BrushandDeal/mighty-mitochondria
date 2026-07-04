/*
 * journeyRanges.js — shared scroll-position constants.
 *
 * Several files need to agree on where key moments happen in the scroll, so the
 * membrane fade, the camera, the quiz gate, the matrix reveal, and Scene 5 all
 * line up. Defining them here once keeps them in sync.
 *
 * `scroll.offset` runs 0 (top of page) to 1 (bottom). With ScrollControls
 * pages=18, that maps across the whole journey so far (overview -> membrane ->
 * inside -> Gate 1 -> matrix -> electron transport chain incl. the Complex II
 * beat). Every constant below was scaled by 15/18 when the Complex II beat was
 * added, so the 3 new screens go entirely to that beat and every earlier scene
 * keeps its exact pacing.
 */

// The gentle spin speed of the outer bean and its pores, shared so they rotate
// in lockstep. (The inner membrane no longer spins — Scene 5 needs a fixed,
// known orientation to place its stations against.)
export const ROTATION_SPEED = 0.15

// The scroll window over which the camera passes through the outer membrane
// (Scene 3 entry). Outside before PASS_START; fully inside by PASS_END.
const PASS_START = 0.258
const PASS_END = 0.325

// Gate 1 sits at the end of the Scene 3 fold sweep. Scroll is locked here until
// the visitor answers correctly; then the spiral dive into the matrix plays.
export const GATE1_OFFSET = 0.417

// The spiral dive runs from the gate to SPIRAL_END; after that the camera picks
// the waypoint rail back up for Scene 5 (the electron transport chain).
export const SPIRAL_END = 0.667

// The scroll window over which the matrix (Scene 4) fades in — only after the
// gate, so it stays hidden until the visitor has earned the dive.
const MATRIX_START = 0.433
const MATRIX_END = 0.6

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/*
 * interiorFactor — 0 while we are outside the organelle, ramping smoothly to 1
 * as the camera slips inside. Fades the outer membrane out (and slows its spin).
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
