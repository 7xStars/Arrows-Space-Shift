# Arrow Space Shift v0.24.0 — Hyperbolic & Unified Manifold Visual Language

**Development candidate. Existing ChatGPT Site remains unchanged.**

## Includes v0.23.8
- All real collidable bullets stay fully solid and use normal projectile collision rules.
- Predicted crossings show hollow, dashed, non-colliding **future-image** projections with brief imminent warnings.
- A small player-frame label makes Klein reversal visible; the Guide explains actual bullets vs image previews.
- Manifold previews can be turned off; critical existing combat telegraphs still render.

## Includes v0.23.9
- Source-specific projective marks during Act II's projective-intrusion phase.
- K+P compound glyphs distinguish the mixed encounter from Klein-only transport.
- Real shots briefly receive a clear post-crossing ring. Status and join class use shape and text, not color alone.
- K+P is a **Dyck-inspired gameplay prototype**, not a proven K#RP² mathematical simulation.

## v0.24.0 hyperbolic visual prototype
- In the **separate Bolza Research Room**, corresponding A–D and A′–D′ edges brighten when an imminent crossing is forecast.
- Shows the predicted pair name and destination with a **hollow**, render-only ghost image.
- Uses `moveBolza` for the actual opposite-edge pairing and forecast; no fake Euclidean teleport lines.
- Enemy/player shots in the research room can show up to two predicted re-entry images.
- Optional checkbox hides the extra geometric projection cues.
- The hyperbolic room does **not** integrate Bolza geometry into the main campaign or claim collision sweeps, folds, or Act IV are complete.

## Testing and caveats
- Pure deterministic tests cover visual status, projective intrusion phase, return previews, actual Klein hit equivalence, and hyperbolic side pairing.
- Existing game simulation, Act I, input, rewards, saves, ships, music, and level progression are not changed by rendering features.
- Automated tests are not a substitute for a normal human gameplay and accessibility pass.
- The previous ASS-014 hybrid-jump issue remains partially open until the K+P collision/geometry model is validated.

## Testing the build

1. Extract PLAY ZIP and run `START-GAME-WINDOWS.bat` (Windows) or serve the folder with Python.
2. Open `?qa=1`, then Options → QA: Klein live/preview shots, QA: K/P projective intrusion, or QA: K+P hybrid preview. The QA mode is for testing only.
3. Flight Guide → Hyperbolic Research Room; use arrows to move toward the marked side; watch predicted matching edge glyphs and hollow destination image.
4. Repeat with reduced motion and previews switched off. No collision-rule differences are expected.
