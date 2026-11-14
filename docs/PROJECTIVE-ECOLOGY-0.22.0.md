# Arrow Space Shift 0.22.0 — Projective Ecology candidate

## Design intent

Preserve the **traditional scrolling shmup → bullet hell → constructive bullet heaven** progression while retaining the same Fan, Sweep, Gap, Aimed, Wall, Return, Spiral, Crossfire and Convergence attack vocabulary. Each stage demonstrates one capability, pauses in a true quiet wave, then recombines it with older shooting and dodging skills. Player control matters even at high power: no free permanent automatic damage is granted.

**Act I is frozen** and ends with the physical Klein Relay. **Act II** consists of eight Klein-surface stages and the ninth hybrid boss with the physical Projective Module. **Act III** has eight authored stages and a Curvature Gate boss.

| Stage | Intended lesson | Gameplay |
|---|---|---|
| 1 Projective Chart | Read the new chart | Low-density conventional Fan/Gap and edge transformations |
| 2 Echo Capture | Transform danger | C captures nearby hostile shots, obeying range, cooldown and capacity |
| 3 Echo Release | Turn stored echoes into attacks | E fires stored echoes forward; Space remains manual |
| 4 Ordered Synthesis | Combine existing operations with ecology | Two equipment slots, ordered operations and echo release |
| 5 Stellar Harvest | Controlled horde growth | Larger enemy populations reward capture while challenging positioning |
| 6 Antipodal Storm | Combined pressure | Returning projectiles and projective echo decisions |
| 7 Power Without Passivity | Costly autonomous effects | Optional orbitals and ward consume finite echoes |
| 8 Projective Mastery | Full comprehension | Recognize threats, capture, choose evolutions, conserve and release |
| 9 Curvature Gate | Boss and reward | Three familiar-grammar phases, physical Curvature Seed, extraction |

Every normal Act III stage has **three authored recovery intervals**. The first two can present one **Echo Forge** choice each. There are eight optional evolution definitions (range, storage, split release, recovery cooldowns, mirrored shots, echo-consuming orbital, echo-consuming ward, and damage focus); selected evolutions carry between Act III stages and are saved at section entry.

## Controls and invariant commitments

- **Space** remains deliberate forward shooting, even while reversing thrust.
- **C** converts only *nearby* hostile projectiles, not all incoming fire. The captured projectile disappears, a finite echo enters storage, and a cooldown applies.
- **E** consumes stored echoes to fire. No captured energy means no release.
- The optional orbital spends one echo to fire. The optional ward spends two to prevent a hit; it cannot protect without resources.
- Player stays from the bottom to **halfway** in the portrait arena; camera/route progress never reverses when Down is held.
- Earlier act rewards, ship IDs, save records, and manual fold controls remain additive and intact.
- Curvature Seed is **not** granted on boss defeat or on pickup alone; the player must extract alive.

## Technical implementation

- `src/act3-waves.js` defines the eight authored stage scripts.
- `src/ecology.js` defines the energy economy, choices, capture/release, and finite-cost effects.
- `src/klein.js` adds the projective-inspired surface tracing and collision images.
- `src/boss.js` adds the Curvature Gate phases and Curvature Seed recovery.
- `src/campaign.js`, `src/simulation.js`, and `src/combat-view.js` carry route control, wave timing, projectiles and view rules.
- `src/storage.js` stores the previous section-entry build and restores it on reload.
- `src/app.js`, `index.html` and `style.css` expose C/E controls, echo resource HUD, and the paused Echo Forge choice panel.

## Geometry limitations

The current experimental chart combines the Klein side reversal with a distinct projective-style top/bottom reversal. **Do not claim that this is the intrinsic round metric of RP², a mathematically proven RP² quotient, or a faithful model of the connected sum K#RP².** A genuine projective-plane or connected-sum geometry implementation requires an independently verified identification model, tangent transport, and collision metric. The Act III Curvature Gate is a **preview**, not an implemented hyperbolic double torus.

## Validation

- Baseline 0.20.3 had 35 tests; new tests cover Act III stage count, projective crossings, capture costs, release costs, evolution selection, finite-cost automatic effects, checkpoint restoration, boss phases and physical extraction.
- Full JS syntax validation and Node unit tests must pass before package release.
- A simulated rendered-enemy loop exercises enemy warning and firing, since headless Chromium could not load local URLs due to administrator policy.
- This remains a **downloadable development candidate**, not a live ChatGPT Sites deployment.
