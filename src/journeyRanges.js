/*
 * journeyRanges.js — shared scroll-position constants.
 *
 * Several files need to agree on ONE thing: at what point in the scroll does the
 * camera slip from outside the mitochondrion to inside it? Defining it here once
 * keeps the outer-membrane fade (MitochondrionScene, OuterMembraneScene) in sync
 * with the camera's pass-through (CameraRig).
 *
 * `scroll.offset` runs 0 (top of page) to 1 (bottom).
 */

// The gentle spin speed of the whole organelle, shared so every scene rotates in
// lockstep and the pores/folds stay aligned to the surface.
export const ROTATION_SPEED = 0.15

// The scroll window over which the camera passes through the outer membrane.
// Outside before PASS_START; fully inside by PASS_END.
const PASS_START = 0.62
const PASS_END = 0.74

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/*
 * interiorFactor — 0 while we are outside the organelle, ramping smoothly to 1
 * as the camera slips inside. Used to fade the outer membrane out (and to slow
 * the spin to a stop) so the interior can be revealed cleanly.
 */
export function interiorFactor(offset) {
  return clamp01((offset - PASS_START) / (PASS_END - PASS_START))
}
