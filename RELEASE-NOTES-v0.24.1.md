# Arrow Space Shift v0.24.1 — The Double Torus Field Campaign

**Local/itch playable development candidate. NOT deployed to the existing ChatGPT Site.**

## Delivered in this update

- All previously implemented v0.23.7 stability fixes and v0.24.0 Klein/K+P/Bolza visual-language cues are retained.
- New, linked **Act IV** at `hyperbolic-act.html`, unlocked by physically collecting and extracting the **Curvature Seed** at the end of Act III. Local `?qa=1` previews all nine stages without saving progression.
- Eight named hyperbolic training stages, with real enemy fire, manual shots, paired-edge traversal, escalation and authored safe recovery intervals; a ninth encounter, **The Double Torus**, contains a boss with its own HP, firing grammar and victory state.
- Bolza side identifications A–D/A′–D′, Poincaré-disk metric, transported position/heading, and the *same live projectile* continuing across joins. Corrected geodesic heading transport so small-step simulation reaches targets across the paired edges instead of drifting away. Hollow image projections do not create a second collider or immunity state.
- Reused learned decisions in a new geometry: C captures a nearby real hostile projectile; E deliberately releases that echo; Shift starts a brief fold phase that speeds both incoming and outgoing bullets; manual Space fire remains available. Pattern labels and windups are visible without audio.
- Preserves existing Acts I–III. Act IV has a separate additive `arrow-space-shift:act4:v1` local checkpoint with replay and unlocked-stage selection; it does not rewrite existing fleet or section save schemas. A fresh hull begins each stage.
- Sparse black starfield, marked paired geodesic edges, low-motion lattice/ring/arrival language; mobile buttons provided. No new music is composed or shipped (deferred at user request).

## Why this is a candidate, not a finished game

- Act IV is a **separately rendered field-campaign vertical slice**, accessible from the main game. This has not been merged into the legacy scrolling/combat/camera runtime; ships, drops, boss-part collection and full Warp Drive repair remain separate work.
- Motion uses the research kernel's finite intrinsic step integration. Combat proximity uses a depth-one neighborhood of Bolza deck transformations, **not** a proved global shortest-path or analytic swept-collision solver. Near-vertex numerical conditions retire shots or hold actors rather than inventing a teleport.
- The ninth encounter stabilizes the hyperbolic chart; it **does not** award the final component or produce the persistent repair ending reserved for v0.25.x.
- ASS-014 Dyck-inspired K+P topology/warning issue remains open; no claim of a mathematically correct connected sum.
- End-to-end ordinary browser play, balance and human comprehension, mobile performance, collision fairness and photosensitivity/accessibility acceptance are not verified. Automated tests do not satisfy these release gates.
- Browser save keys are origin-specific: the main Acts and Act IV must be played on the same browser origin to transfer the Curvature Seed unlock. The local QA bypass is diagnostic only.

## How to test

1. Extract `Arrow-Space-Shift-v0.24.1-PLAY.zip` fully. Double-click `START-GAME-WINDOWS.bat` (Windows) or run `python3 tools/launch-local.py`. Follow the URL printed by the launcher.
2. To see the geometry immediately: visit `<local URL>/hyperbolic-act.html?qa=1` (local QA only). Press Launch. Rotate left/right, move up/down, hold Space to fire. In stage 1, cross an A–D pair; during stages 4–5, try C/E/Shift.
3. Normal progression: complete Act III Curvature Gate, physically collect the Curvature Seed, extract, then click **Launch Act IV** on the victory screen or **Continue Act IV** on the title screen. Reload between stages to confirm independent saved progress.
4. Check no hollow preview hurts you independently, but the associated solid LIVE projectile does; check sound-muted and reduced-motion modes, plus the original Act I→II→III flows.

## Verification

- Node.js syntax and **148/148 automated tests** pass, including a deterministic stage-one combat-clear simulation, exact-geodesic regression checks and DOM-initialization smoke checks. See `tests/act4-bolza-campaign.test.mjs` and `tests/act4-dom-smoke.test.mjs`.
- Local Python HTTP server delivered the Act IV page (HTTP 200). The headless Chromium screenshot attempt timed out in this container; no actual browser gameplay acceptance is claimed.
- No modification or publication of the user's existing ChatGPT Site or GitHub repository. The linked GitHub connection is read-only here.
