# Arrow Space Shift — Act II release sequence

Act I remains frozen throughout this sequence. Act II begins after the Klein Fleet and uses the established scrolling-shmup grammar on the Klein surface. Each release adds one layer, followed by recovery space before the next lesson.

| Version | Playable addition | Principal systems |
| --- | --- | --- |
| 0.19.2 | Return Flight, Intentional Crossing, Returning Fire | First Klein-surface lessons, deliberate seam use, RETURN-modified familiar patterns |
| 0.19.3 | Seam Gap and Cross Current | Authored wave director, recovery windows, coordinated Fan/Sweep/Gap/Return combinations |
| 0.19.4 | Fold Timing | Deterministic fold lessons, projectile fold-entry/exit feedback, altered arrival-order exercises |
| 0.19.5 | Pressure Field | Popcorn, carriers, anchors, miniboss pressure, grazing, collision-core option, stage grading |
| 0.19.6 | Klein Mastery | Three examinations, multi-phase Klein Warden, quiet approach to the geometry change |
| 0.20.0 | The Projective Intrusion | Four-phase Klein/projective hybrid boss, physical Projective Module recovery and extraction |
| 0.20.1 | Act II Complete | Practice for reached lessons, persistent stage records, factual death history, canonical glossary, progress export/import |

## Canonical campaign structure

1. **Act I:** traditional scrolling shmup, folds, Fan/Sweep/Gap, Stage 7 pressure, Klein Fleet.
2. **Reward:** Klein Relay. Player, enemies, projectiles and pickups can inhabit the Klein surface in normal play.
3. **Act II stages 1–8:** teach and combine surface travel, intentional seams, returning fire, global gaps, pattern layering, fold timing, bullet-hell density and Klein mastery.
4. **Act II stage 9:** Klein/projective hybrid geometry. The attack grammar remains stable while the spatial identification changes.
5. **Reward:** Projective Module, stored additively beside the Klein Relay.

## Movement contract

- The world continues scrolling forward.
- Up advances the ship only to the arena midpoint.
- Down reverse-thrusts only to the bottom limit.
- Releasing Up/Down holds the current vertical screen position while scrolling continues.
- Left/Right steer laterally and can intentionally traverse Klein side joins.
- Space fires forward manually. Reverse thrust never turns the gun around.
- Left Shift and Right Shift retain fold and unfold.

## Stable bullet grammar

Fan, Sweep, Gap, Aimed, Burst, Wall, Spiral, Crossfire, Return and Convergence remain the canonical vocabulary. New geometry transforms the paths and timing of these patterns rather than replacing the vocabulary.

## Verification

The 0.20.1 automated suite contains 23 passing assertions covering:

- Frozen Act I ordering.
- Authored Act II wave scripts and recovery intervals.
- Parameterized patterns and pressure metadata.
- Fold-entry and fold-depth tracking.
- Pressure Field roles, grazing and stage grading.
- Klein Warden phases and the quiet approach.
- Hybrid Klein/projective transport and boss phases.
- Physical Projective Module collection, extraction and additive persistence.
- Version-2 profile migration, persistent records and practice progression.

Every JavaScript module passes `node --check`. A Chromium visual smoke test was attempted, but this execution environment blocks both local HTTP and file URLs by administrator policy. The browser limitation does not substitute for a human playtest of stage pacing, seam readability and difficulty.

## Distribution status

These are packaged browser/itch builds and editable source releases. The existing ChatGPT Site was not changed by this release sequence because the Sites deployment connector was unavailable in the implementation session.
