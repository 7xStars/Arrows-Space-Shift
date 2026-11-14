# Arrow Space Shift — Manifold Visual Language roadmap

Source baseline: v0.23.7; scoped visual update through v0.24.0.

## Implemented / package-ready

| Version | Content | Evidence / status |
| --- | --- | --- |
| **v0.23.8** | Klein live bullets, future-image ghosts, edge timing, side/frame marker, optional cues and Flight Guide legend | Added pure geometry/collision-truth tests; package ready |
| **v0.23.9** | K/P mixed encounter marks, source-specific phase 2, hybrid phase 3, incoming P/K previews, post-crossing arrival ring | Tests on mixed source and delayed activation; package included in final |
| **v0.24.0** | Bolza hyperbolic research-room edge-pair cues, hollow projected destination, A–D paired marks, optional toggle | Research room only; no false claims of Act IV combat |

## Mandatory interpretation

- A real projectile is **not harmless** just because its representation crosses a Klein or Dyck chart boundary.
- The Klein bottle and K#RP² are nonorientable and have no canonical global pair of front/back collision sheets.
- Solid core = real projectile with existing collision; hollow = future image with **no separate hitbox**, not blanket immunity.
- The Dyck-inspired hybrid boss is **not yet a faithful connected-sum model**. The visual pass does not fix that topology.
- Bolza edge previews are correct per the current `moveBolza` kernel; smooth collision sweeps, heavy bullets, full metric integration and fold behavior await an actual Act IV implementation.

## Remaining after v0.24.0

1. **ASS-014**: validate the true K#RP² model; distinguish valid crossings from bugs; ensure every forced topology change is forewarned.
2. Human Playtests: blind tests with Klein Fleet, Return Flight, Act II hybrid; ask whether players predict interaction and landing. Show a live shot and its projected image as the same entity.
3. Performance and accessibility: measure readability under dense waves at mobile portrait resolution; tune max 3 projections and limited candidate scan as needed.
4. Hyperbolic combat: integrate Bolza physical paths, broad-phase/continuous collision, camera/fold/weapon interactions, then reuse this language in the actual stage.
5. Act IV campaign, ending, ship roster and expeditions remain on the larger completion roadmap.

## Proposed acceptance criteria for next visual QA release

- At least 80% of previously uncoached players can distinguish **live shots** from **render-only future markers** and identify the return edge.
- No documented collision where UI falsely declares a real shot invulnerable or safe.
- Warning cues remain understandable with sound off and reduced-motion mode.
- No gameplay, progression, or save regression from the v0.23.7 baseline.

Targets are design hypotheses, not measured outcomes.

## v0.24.1 Act IV field campaign

Act IV now exists as a separate browser page with eight authored Bolza-quotient combat lessons plus the Double Torus Sentinel. A saved Curvature Seed unlocks it from the main game. Real bullets and players are transported across edges; projected hollow markers remain render-only. Enemy windups, stage breaks, capture/release, temporary symmetric bullet-speed fold, low-motion option and mobile controls are included. The preexisting v0.24.0 research room remains separate.

**Still open:** conversion to the old continuous scrolling engine, depth-one-vs-true-minimum collision coverage, analytic projectile sweeps, vertex singularities, fairness and mobile stress tests, ASS-014 K+P true topology and the v0.25.x repair/ending. No new music changes.
