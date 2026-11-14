# Arrow Space Shift — v0.23.0 Fleet Foundry and Hyperbolic Research

**Development candidate. NOT deployed to the existing ChatGPT Site.**

## Noted and deferred

The unannounced visible jump at the Act II hybrid Klein / projective identification, described by the player as “random teleportation,” is tracked in `docs/KNOWN-ISSUES.md` as **ASS-014**. No travel warning or boss geometry tuning is implemented in this release; this is a final-release blocker.

## Playable progression added

- First actual craftable hull: **Aftwing** (Paley-19 identity 3). The original Arrow, Skater, and Needle remain unchanged.
- Aftwing trades slow lateral travel for **50% faster reverse thrust** in post-Relay stages; its main gun, operation system, and original Act I mechanics are unchanged.
- Fabrication salvage comes **once per distinct first-clear** of the eight Act II and eight Act III lesson stages, not from farming repeated clears. Existing cleared-stage records are counted automatically.
- The **Projective Module** unlocks the Aftwing blueprint. Cost: five unique-clear salvage units. Owning the module does not automatically construct the ship.
- Fabrication and ship selection persist in the fleet profile; double build cannot charge twice; replaying the Klein Fleet does not erase the built hull.
- Ship choice applies at the next safe section transition, never instantly during active combat. Section retry and save restore retain the previously active hull.
- The Fleet Foundry is in the Equipment dialog after the Klein Relay, with a live salvage count and construction action. On localhost `?qa=1`, Options offers **QA: Fleet Foundry** and **QA: Aftwing flight**, both session-only fixtures.

## Hyperbolic research room (not yet Act IV)

- Open **Hyperbolic research room** from the in-game Guide, or `hyperbolic-lab.html` after starting the local web server.
- Includes a Poincaré disk with a regular hyperbolic octagon, with **interior angles π/4** and opposite sides identified by hyperbolic isometries. This yields a compact genus-two Bolza quotient.
- Control a ship-like marker with arrow keys; shoot beacons with Space; watch side-pair crossings. Point and projectile traversal follow intrinsic geodesic steps. This is a limited exploratory lab, not a complete collision/movement system for dense combat.
- Unit tests verify octagon vertices, opposite-side pairing and inverses, metric invariance, orientation-preserving differential, intrinsic travel and reentry.
- It does **not** replace the experimental Curvature Gate. The Curvature Seed is still a research milestone, not the complete Hyperbolic Drive.

## Compatibility and limitations

- Act I stages and Klein Fleet unchanged; original three ships retain their exact existing stats.
- Act II/III existing pattern grammar, eight-stage curricula, echo capture/release and phase structures are unchanged.
- Existing local profiles migrate to v5; previously earned relay/module, selected hull and stage records remain. New crafted hull saves are additive.
- This is **not** a full repaired-Warp-Drive ending. A final hyperbolic campaign, module recovery, assembly, ending and full 19-ship roster remain on the roadmap.
- All release tests and syntax checks run locally. Browser visual playtesting is not established because the Chromium runtime returns `ERR_BLOCKED_BY_ADMINISTRATOR` for localhost.
- No ChatGPT Sites deployment has been performed.

## Launch

Extract the playable ZIP. Windows: run `START-GAME-WINDOWS.bat`, then open `http://127.0.0.1:4177/`. Mac/Linux: from the extracted directory run `python3 -m http.server 4177 --bind 127.0.0.1` and open that address. The Guide links to the separate hyperbolic research room.
