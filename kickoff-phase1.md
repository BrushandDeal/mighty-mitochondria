# Mighty Mitochondria: Claude Code Kickoff, Phase 1 (Walking Skeleton)

*Paste this whole file into Claude Code as your first instruction, once Node.js, VS Code, Claude Code, and git are installed and the three markdown files (JOURNEY.md, RESEARCH.md, project-brief.md) are in the project folder.*

---

## Who you are working with

The owner is not a professional developer and is using this project to learn. Throughout this build:

- Explain your choices in plain language, and define any technical term the first time you use it.
- Prefer boring, standard, well-trodden approaches over clever ones. If you ever deviate from the conventional path, say so explicitly and explain why.
- Stop at the verification checkpoints below and wait for the owner to confirm the result in their browser before moving on. Do not race ahead through multiple phases.
- When something could be hard to undo, flag it before doing it.

## What we are building

A scroll-driven 3D educational website about the mitochondrion. The complete scene-by-scene experience is defined in **JOURNEY.md**, which is the single source of truth for the experience. **RESEARCH.md** is the list of vetted facts the site is allowed to state, each with a source. **project-brief.md** orients the whole project. Read all three before writing any code.

Hard content rule: the website may only state facts that appear in RESEARCH.md. Never introduce a biological claim that is not traceable to that file. If a scene seems to need a fact that is not in RESEARCH.md, stop and flag it rather than inventing one.

## Scope of THIS phase (important: do not exceed it)

This first session builds a **walking skeleton** only: the thinnest version that runs end to end. Specifically:

1. Scaffold the project with the standard toolchain.
2. Get it running locally so the owner can see it in a browser.
3. Build **one** placeholder scene: a semi-translucent, bean-shaped mitochondrion (a simple rounded 3D shape is fine as placeholder) that slowly rotates, with a warm golden glow, floating in a dark space. Wire it so that scrolling the page moves or rotates the camera around it. This proves the scroll-to-3D pipeline works.
4. Set up a reusable scene structure so the remaining scenes from JOURNEY.md can be added later as separate, self-contained pieces without rearchitecting.
5. Deploy it to a live URL on Vercel.

Do NOT build the other scenes, the quiz gates, the frontier section, the progress bar, audio, or mobile optimizations in this phase. Those come in later, verified phases. If you finish early, stop and let the owner confirm before proposing more.

## The stack to use (all conventional, explain each to the owner)

- **Vite** to scaffold and run the React project. It is the current standard build tool and dev server for React (the older Create React App is deprecated). Use the React template, in **plain JavaScript, not TypeScript** (a deliberate choice to keep the error surface small for a learning owner).
- **React** for structure and UI.
- **three** (Three.js) for the 3D.
- **@react-three/fiber** (react-three-fiber): the standard way to use Three.js inside React, so 3D objects are written as React components instead of imperative Three.js calls.
- **@react-three/drei**: the standard helper library for react-three-fiber. Use its `ScrollControls` and `useScroll` for the scroll-linked camera, which is the conventional in-ecosystem approach for scroll-scrubbed 3D.
- **Vercel** for hosting, connected to a **GitHub** repository so that pushes auto-deploy. Initialize git in this project and make a clean first commit.

If any of these has a materially better-standard alternative at build time, tell the owner before switching, and explain the tradeoff in one or two plain sentences.

## Set up project memory

Create a **CLAUDE.md** file at the project root so future sessions have persistent context. It should state, briefly:
- What the project is, in two sentences.
- That JOURNEY.md is the source of truth for the experience and RESEARCH.md is the source of truth for facts.
- The hard rule: no on-site claim may exist that is not in RESEARCH.md.
- The build philosophy: incremental, one scene at a time, verified in the browser at each step, standard patterns preferred, choices explained in plain language.
- The accessibility intent: a reduce-motion toggle is planned, so keep animations easy to disable.

## Build it in these steps, and STOP at each checkpoint

**Step 1: Scaffold.** Create the Vite + React project, install the dependencies above, and get the local development server running.
- **Checkpoint for the owner:** run the dev server, open the local address it prints (usually http://localhost:5173) in a browser, and confirm the default page loads. This proves the toolchain works before any 3D exists. Explain to the owner what "running the dev server" means and how to stop and restart it.

**Step 2: One scene.** Build the single placeholder mitochondrion scene described in the scope: a glowing rotating shape in dark space, with the camera responding to scroll. Keep the scene as one self-contained component so more scenes can be added the same way later.
- **Checkpoint for the owner:** in the browser, confirm the shape appears, glows, rotates gently, and that scrolling the page changes the view. If it does, the core pipeline of the whole site is proven. If it does not, diagnose it before adding anything else.

**Step 3: Deploy.** Initialize git, make the first commit, connect the project to GitHub, and deploy to Vercel. Walk the owner through the parts that require clicking in the GitHub or Vercel website, since those cannot be done from the terminal alone.
- **Checkpoint for the owner:** open the live Vercel URL on a phone or another device and confirm the same scene loads. This proves the full path from code to public website.

## How to treat errors

When something breaks, read the error from the bottom line up, state your one-sentence hypothesis about the cause to the owner before changing anything, then make the smallest fix that tests that hypothesis. Narrate this so the owner learns to read errors as information rather than as failure.

## When this phase is done

Summarize for the owner, in plain language: what now exists, what the live URL is, and what the recommended next single scene to build would be. Do not start the next scene until the owner reviews and says go.
