# Arrow Space Shift 0.25.0-dev.1

Local development candidate. November 13, 2026.
This candidate targets campaign completion and the requested audio improvements.
The 4.5/5 review target remains a target, not a verified result.

## Gameplay and completion

- Act III extraction now stores a copied Act IV run bridge.
- Act IV retains ship identity, meaningful movement and core differences, score, echoes, and equipment records.
- Existing Act IV progress takes precedence over a new bridge.
- The Double Torus uses three scheduled attack phases and recovery periods.
- Boss defeat exposes a physical Hyperbolic Core.
- The player must collect it and reach the extraction beacon before banking it.
- The repair dock validates provenance for all four parts.
- Assembly starts a safe playable repair with fold, Klein return, and capture/release deliveries.
- Activation starts an original eight-second ending.
- Campaign completion persists after the ending and appears on the main title.
- Replay retains earned completion and parts.

Act IV equipment is retained as metadata. Its seven operation effects remain inactive in that chart.
The interface states this boundary.
The original scrolling controls and manual fire remain.
Local collision sweeps exclude paired-edge jumps. The depth-one quotient approximation remains documented.

## Audio and presentation

- Added original arrangements for all four Acts, recovery, and ending.
- Added sparse percussion, bass, melodic and ambience layers.
- Revised the score after user feedback. It now has an eight-bar melody, held bass, and sustained harmony.
- Actual combat density, folds, and boss phases affect presentation layers.
- Added independent persistent master, music, effects, and ambience gains.
- Added bounded voice replacement with real event priorities and cached noise and soft distortion curves.
- Gesture recovery resumes one interrupted AudioContext.
- Actual route crossings now emit cues with stable projectile identity.
- Future images remain silent, render-only forecasts.
- Boss phase, warning, recovery, pickup, and extraction displays follow actual state.
- The ship crossing forecast uses stable signed thrust. It no longer shows a forward destination while stopped or reversing.
- Projectile forecasts respect remaining lifetime and the active fold interval.
- Silent and reduced-motion controls remain available.

## Save integrity

The new journey journal is additive.
Earlier banked parts retain explicit legacy provenance.
New extractions record their actual stage, seed, ship, and score.
The final reward cannot bank from defeat or collection alone.
Progress export now includes fleet, main checkpoint, Act IV checkpoint, repair state, and settings.
Import supports earlier fleet-only files.
Multi-key import retains a recovery record. Failed or malformed recovery blocks dependent writes.
Exports can include newly earned in-memory records after a failed save.
If a save fails, keep the page open and use the save-retry control.

## Verification and limits

See [the completion report](docs/COMPLETION-QA-v0.25.0-dev.1.md) for final command results.
The browser tests distinguish existing-profile fixtures from fresh-profile play.
Offline audio renders establish finite samples and bounded measured peaks for six fixtures.
They do not establish an audible mix or listener preference.
No human quality score, complete physical-device acceptance, or global collision proof is claimed.

No game publication or source license selection was made.
