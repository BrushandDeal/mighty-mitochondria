# CLAUDE.md — Project memory for Mighty Mitochondria

This file gives every future session the persistent context it needs. Read it,
plus JOURNEY.md and RESEARCH.md, before writing any code.

## What this is

**mightymitochondria.com**: a scroll-driven, 3D educational website that takes a
visitor on a guided "roller coaster" journey through a mitochondrion. It is
purely educational and free to access.

## Sources of truth (do not let these drift)

- **JOURNEY.md** is the source of truth for the *experience*: every scene, the
  camera moves, the on-screen copy, and the quiz gates. If anything disagrees
  with JOURNEY.md, JOURNEY.md wins.
- **RESEARCH.md** is the source of truth for the *facts*: the vetted claims the
  site is allowed to state, each with a source.
- **project-brief.md** orients the whole project and logs big decisions.

## The hard content rule

**No on-site claim may exist that is not traceable to RESEARCH.md.** Never
introduce a biological claim that is not in that file. If a scene seems to need
a fact that is not there, STOP and flag it — do not invent one. (Titles,
prompts, and UI labels that make no biological claim are fine.)

## Build philosophy

- **Incremental, one scene at a time.** Build the thinnest thing that works,
  verify it in the browser, then add the next piece.
- **Verify in the browser at each step.** Stop at checkpoints and let the owner
  confirm what they see before moving on. Do not race ahead through phases.
- **Prefer boring, standard, well-trodden patterns** over clever ones. If you
  deviate from the conventional path, say so and explain why.
- **The owner is learning and is not a professional developer.** Explain choices
  in plain language and define each technical term the first time it appears.
- **Flag anything hard to undo** before doing it.

## Accessibility intent

A "reduce motion" toggle is planned. Keep animations easy to disable. The
current code already honours the OS `prefers-reduced-motion` setting via
`src/hooks/usePrefersReducedMotion.js` — build on that rather than around it.

## Tech stack

- **Vite** + **React** (plain JavaScript, not TypeScript — a deliberate choice
  to keep the error surface small for a learning owner).
- **three** (Three.js) for 3D, via **@react-three/fiber** (write 3D as React
  components) and **@react-three/drei** (helpers; `ScrollControls`/`useScroll`
  drive the scroll-linked camera).
- **Vercel** for hosting, connected to a **GitHub** repo so pushes auto-deploy.

## Where things live

- `src/App.jsx` — the stage: Canvas, lighting, dark background, `ScrollControls`.
- `src/CameraRig.jsx` — turns scroll position into camera movement (reusable).
- `src/scenes/` — one self-contained component per scene. Add new JOURNEY.md
  scenes here as sibling files; do not rearchitect.
- `src/hooks/` — small reusable React hooks (e.g. reduced-motion).

## Links

- **Repo:** https://github.com/BrushandDeal/mighty-mitochondria (public)
- **Live site:** https://mighty-mitochondria.vercel.app
- **Deploy:** Vercel, connected to the GitHub repo. Every push to `main`
  auto-deploys. Custom domain (mightymitochondria.com) is not set up yet.

## Status

- **Phase 1 (walking skeleton) — done.** Scaffold runs; the glowing, rotating,
  bean-shaped mitochondrion responds to scroll; deployed live to Vercel. Palette,
  scroll pipeline, reusable scene structure, and GitHub→Vercel auto-deploy proven.
- **Scene 2 (outer membrane / the gateway) — done.** `scenes/OuterMembraneScene.jsx`
  studs the surface with cyan porins and small cyan/white molecules drifting in
  and out through them (never gold; only the outer membrane; small molecules
  only). The camera uses a **waypoint pattern** in `CameraRig.jsx` (camera poses
  pinned to scroll positions, blended smoothly) — add a waypoint per new scene.
- **Scene 3 (inner membrane & cristae / the folds) — done.** `scenes/InnerMembraneScene.jsx`
  = sealed translucent cyan inner membrane + stacked cristae folds + cool shimmer.
  Replaced the old gold placeholder core (removed from `MitochondrionScene.jsx`).
  Outer membrane + pores **fade out** as the camera passes inside (and back on
  scroll-up); `journeyRanges.js` holds the shared windows (`interiorFactor`,
  `matrixFactor`, `GATE1_OFFSET`, `ROTATION_SPEED`).
- **Quiz Gate 1 — done.** `App.jsx` `GateLock` clamps forward scroll at
  `GATE1_OFFSET` until the visitor clicks the correct answer (B). Wrong answers
  show the JOURNEY hint; correct answer unlocks and plays the spiral dive. The
  quiz card is an HTML overlay; its pointer-events follow visibility.
- **Scene 4 (the matrix / engine room) — done.** `scenes/MatrixScene.jsx` = a
  cool glowing circular mtDNA loop + drifting enzyme/ribosome specks + a MUTED
  warm haze (deliberately not vivid gold, to protect the ATP-synthase payoff).
  Reached via the spiral dive in `CameraRig.jsx`.
- **Scene 5 (electron transport chain) — DONE (both parts).**
  `scenes/ElectronTransportChainScene.jsx`. Part one: three cyan pumping stations
  (I, III, IV); GOLD electrons hopping; VIOLET protons pumped matrix ->
  intermembrane space only; a numberless "Charge" meter (in App.jsx). Part two:
  Complex II in the gap at x = -0.3 — a distinct faceted muted-teal shape whose
  GOLD electron rises from the MATRIX side (not down the row) and which pumps NO
  proton; the camera swings onto it and holds. First use of gold (energy), violet
  (protons), and teal (the odd-one-out).
- **The inner membrane no longer spins** (needed a fixed orientation for Scene 5's
  stations). The bean + pores still spin in their own scenes, so the cold open
  stays alive. `ScrollControls pages` is 18. NOTE: adding a scene at the end
  re-spaces every scroll constant by a uniform factor (all offsets in CameraRig,
  journeyRanges, App overlays, and the ETC scene's presence/charge) — keep them
  in sync or scenes drift out of alignment.
- **Known-rough / deferred polish:** the interior 3D (cristae, inner membrane,
  matrix, ETC stations) is placeholder-quality; spiral/matrix framing tuned per
  owner feedback but still want real polish. Deferred: true bloom, higher-fidelity
  geometry. Project text rule: no em dashes in on-screen UI strings.
- **Not built yet (later, verified phases):** Scene 5 part two (Complex II),
  Scene 6 (ATP synthase) + Gate 2, Scenes 7-10, Gate 3, the settled/frontier
  threshold, progress bar, audio, mobile optimizations.

## Colour grammar (JOURNEY.md section 4)

Deep blue/teal base for the dark interior, electric cyan for structure/membranes,
and warm amber/gold reserved *specifically* for energy (ATP, electron flow).
Gold means energy — keep it consistent.
