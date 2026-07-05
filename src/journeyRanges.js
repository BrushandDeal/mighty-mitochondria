/*
 * journeyRanges.js, shared scroll-position constants.
 *
 * Several files need to agree on where key moments happen in the scroll, so the
 * membrane fade, the camera, the quiz gate, the matrix reveal, and Scenes 5 and 6
 * all line up. Defining them here once keeps them in sync.
 *
 * `scroll.offset` runs 0 (top of page) to 1 (bottom). Rather than writing each
 * firing point as a raw fraction of the whole ride (which forces us to renumber
 * every earlier fraction by hand whenever a scene is appended), we anchor each
 * one to an absolute PAGE NUMBER and derive the offset with `page()`. A page is
 * one screen-height of scroll; there are TOTAL_PAGES of them (this feeds
 * ScrollControls' `pages` prop in App.jsx). Because a scene lives at a fixed page,
 * adding a later scene just means bumping TOTAL_PAGES and appending new page
 * numbers: every earlier page number stays put, so every earlier scene keeps
 * firing at the same spot on screen.
 *
 * Each converted value carries a trailing "// was <fraction>" comment recording
 * its old whole-ride fraction, so nothing is lost. (page(N) === N / TOTAL_PAGES,
 * and each N is just its old fraction times TOTAL_PAGES, so the offsets are
 * unchanged.)
 */

// How many screen-heights tall the whole journey is. This is the single knob:
// ScrollControls uses it for the scroll height, and page() uses it to turn a page
// number into a 0..1 offset. Appending a scene means raising this number.
export const TOTAL_PAGES = 18

// page(n): convert an absolute page number (0 .. TOTAL_PAGES) into a scroll
// offset (0 .. 1). Everything that pins to a scroll position routes through here.
export const page = (n) => n / TOTAL_PAGES

// The gentle spin speed of the outer bean and its pores, shared so they rotate
// in lockstep. (The inner membrane no longer spins, since Scene 5 needs a fixed,
// known orientation to place its stations against.)
export const ROTATION_SPEED = 0.15

// The scroll window over which the camera passes through the outer membrane
// (Scene 3 entry). Outside before PASS_START; fully inside by PASS_END.
const PASS_START = page(3.348) // was 0.186
const PASS_END = page(4.212) // was 0.234

// Gate 1 sits at the end of the Scene 3 fold sweep. Scroll is locked here until
// the visitor answers correctly; then the spiral dive into the matrix plays.
export const GATE1_OFFSET = page(5.4) // was 0.3

// The spiral dive runs from the gate to SPIRAL_END; after that the camera picks
// the waypoint rail back up for Scene 5 (the electron transport chain).
export const SPIRAL_END = page(8.64) // was 0.48

// The scroll window over which the matrix (Scene 4) fades in, only after the
// gate, so it stays hidden until the visitor has earned the dive.
const MATRIX_START = page(5.616) // was 0.312
const MATRIX_END = page(7.776) // was 0.432

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/*
 * interiorFactor, 0 while we are outside the organelle, ramping smoothly to 1
 * as the camera slips inside. Fades the outer membrane out (and slows its spin).
 */
export function interiorFactor(offset) {
  return clamp01((offset - PASS_START) / (PASS_END - PASS_START))
}

/*
 * matrixFactor, 0 until the gate is passed, ramping to 1 as the spiral dive
 * carries us into the matrix. Fades the matrix contents in (and dims the folds).
 */
export function matrixFactor(offset) {
  return clamp01((offset - MATRIX_START) / (MATRIX_END - MATRIX_START))
}
