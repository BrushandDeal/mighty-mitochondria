# Mighty Mitochondria: Project Brief

*This file orients any new conversation. Read it first.*

## What we're building
**mightymitochondria.com**: a scroll-driven, 3D educational website that takes a visitor on a guided "roller coaster" journey through a mitochondrion. Visitors scroll and zoom through the organelle, get concise explanations at each key structure, answer comprehension questions that gate further progress, and finish by zooming out into the body to see why it all matters. It is purely educational and free to access.

The full, scene-by-scene experience is defined in **JOURNEY.md**, which is the source of truth for the experience.

## Who's building it
I'm the builder and I'm **not technical**. I'm using this project as a learning experience, so:
- Explain the reasoning behind technical choices in plain language.
- Define jargon the first time it comes up.
- When you recommend a tool or approach, briefly say *why* over the alternatives.
- Flag when I'm about to do something that's hard to undo later.

## The planned tech stack
- **Framework:** React (structure and UI logic)
- **3D / animation:** Three.js (the library that draws and animates 3D in the browser)
- **Transitions:** a motion library for smooth scene changes
- **Build tool / environment:** Claude Code (and/or Cursor) working inside the repo
- **Hosting:** Vercel (already have a paid membership)
- **Domain:** to be purchased cheaply (e.g. Namecheap)
- **No Shopify, no e-commerce.** This is a custom-built informational site.

## File conventions (so nothing drifts out of sync)
- **JOURNEY.md** = the source of truth for the experience (scenes, copy, quiz gates, camera moves). If anything disagrees with this file, this file wins.
- **RESEARCH.md** = the vetted facts we're allowed to state on the site, each with a source. Website copy should trace back to here.
- **This brief** = the orientation doc, updated as big decisions get made.

Everything the AI reads or edits stays in **markdown (.md)** because it's plain text: version-controlled, diff-able, and editable in place with no conversion step.

## How the pieces relate
- This **Claude Project** is the research + content studio (thinking, iterating, checking science).
- The **repo** (in Claude Code/Cursor) is where the site actually gets built. When the journey is finalized here, JOURNEY.md is copied into the repo and becomes canonical there.

## Guardrails
- **Accuracy first.** This teaches real biology to real people. If a claim is uncertain or oversimplified to the point of being wrong, flag it.
- **Keep the core textbook-simple.** The structure and function of a mitochondrion is settled science; it needs to be clear and correct, not sourced from cutting-edge papers.
- **Save the frontier research for the "bigger story" beats** (aging, longevity, exercise, disease), where recent findings add credibility.

## Decisions log
*Big decisions with dates and the reasoning behind them, so future-me has the "why" and not just the "what." Newest at the bottom.*

**2026-07-03: Locked the science and content of the journey (Revision 2 of JOURNEY.md).**
- **Structure.** The ride runs settled science first, then crosses a clearly marked on-screen threshold into a frontier section (aging, exercise, disease). Reason: telling the visitor exactly when we leave settled textbook material and enter active research builds trust and teaches the difference between "known" and "still being worked out."
- **Sourcing split.** Settled facts (RESEARCH.md Part A) all cite one free, legally hosted reference: *Molecular Biology of the Cell* (Alberts et al., 4th ed.) on the NCBI Bookshelf. Frontier facts (Part B) each cite a named peer-reviewed review. Reason: settled anatomy needs one authoritative free source, not thirteen; specific citations are reserved for the beats where the science is genuinely moving.
- **Accuracy corrections accepted.** Heart mitochondria changed from "about a third" to "about a quarter" (rigorous human morphometry is ~23%; the higher figure is small-mammal data). "Seconds to live" became "minutes," anchored to how cyanide actually kills. Mitochondria counts are floor-framed ("at least this many"), never stated as one hard total, because no rigorous total exists. Scene 4 corrected so it no longer implies the mitochondrion runs the first stage of energy extraction; glycolysis happens first, out in the cytoplasm. Maternal inheritance keeps the scientific consensus but drops the false absolute "every single one," because rare paternal transmission is reported and debated.
- **Metaphor reframe (Scenes 5 and 6).** Replaced the dam/turbine imagery with "charge a battery, then discharge it through a coin-stamping revolving gate." Two load-bearing truths are preserved and must not be lost in any redesign: a proton gradient is stored electrochemical energy (a real voltage, not just a pile-up of particles), and ATP synthase is a real rotary motor. Guardrail for the animation: ATP is assembled from ADP plus phosphate that are already present; it is never conjured from nothing, or we would teach the exact misconception the site exists to correct.
- **Parked deliberately.** The exact voltage numbers behind the battery framing are marked TO SOURCE in RESEARCH.md and stay off the site until a primary citation is added. The general-audience copy states the idea qualitatively and does not need the millivolts.

**2026-07-04: Reconciled the experience-file name to JOURNEY.md.**
- The experience spec is now named **JOURNEY.md**, matching what this brief always called it. Reason: the brief treats JOURNEY.md as the canonical source of truth, but the actual file had been named mighty-mitochondria-journey-spec.md, so the brief pointed at a filename that did not exist on disk. Picking one canonical name removes any ambiguity about which file wins. The old note inside JOURNEY.md that flagged this mismatch is now stale and can be deleted.
