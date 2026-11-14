# Arrow Space Shift — v0.22.0 Projective Ecology

**Development candidate. Not deployed to the existing ChatGPT Site.**

## The campaign

- **Act I:** original eight scrolling-shmup stages plus Klein Fleet. This stage order, controls and starfield progression remain intact.
- **Act II:** eight Klein-surface bullet-hell teaching stages plus the hybrid Projective Intrusion boss. The Projective Module must be physically collected and extracted to unlock Act III.
- **Act III:** eight projective-inspired stages, culminating in The Curvature Gate. Curvature Seed is a physical reward, banked after extraction. This is a stepping stone toward (not the implementation of) the hyperbolic module.

## New Act III stage list

| # | Stage | Lesson |
|---|---|---|
| 1 | Projective Chart | Compare familiar Fan and Gap patterns under the new identification chart |
| 2 | Echo Capture | Convert nearby incoming bullets with **C** |
| 3 | Echo Release | Spend echoes on deliberate forward shots with **E** |
| 4 | Ordered Synthesis | Combine echoes with the seven existing ordered operations |
| 5 | Stellar Harvest | Gather power from escalating enemy populations |
| 6 | Antipodal Storm | Read returning patterns while managing a build |
| 7 | Power Without Passivity | Resource-consuming orbitals and protective ward |
| 8 | Projective Mastery | Combine geometry, manual shooting, capture, release and resource planning |
| 9 | Curvature Gate | Three-phase boss and Curvature Seed extraction |

**Each ordinary stage** offers three authored breaks; the first two can pause the game for Echo Forge evolution choices. Evolutions vary capture range, capacity, cooldown, projectile splitting, mirrored shots, orbitals, protection and echo damage.

## How to play

Space remains manual forward fire. Up stops at the halfway line, Down at the bottom. The world continues scrolling. Shift fold/unfold and Klein side reversal remain. In Act III, **C** captures nearby hostile bullets into finite storage. **E** spends stored echoes. Enemy shots are still dangerous if not captured or dodged; echo power is not a passive upgrade multiplier.

Windows: extract PLAY ZIP, double-click START-GAME-WINDOWS.bat and visit `http://127.0.0.1:4177/`. Mac/Linux: `python3 -m http.server 4177 --bind 127.0.0.1` then open that address. Or upload PLAY ZIP directly to itch.io as an HTML game (root `index.html`).

**Development QA**: Visit `http://127.0.0.1:4177/?qa=1` and use the extra QA buttons under Options to preview Projective Ecology, Echo Capture or the Curvature Gate without modifying permanent saves. Normal campaign progression does not use these shortcuts.

## Verified and not verified

- 47/47 automated checks passed, including the baseline 35 tests.
- JavaScript syntax passes. Act III structural and boss-phase tests pass.
- A simulation with enemy presentation confirmed enemy firing and damage; progression tests cover stages, wave breaks, held resource costs and checkpoint recovery.
- Local HTTP served the index and source assets, but **headless Chromium was blocked from localhost by administrator policy**, so a genuine browser visual and human playthrough was not completed.
- The experimental projective **chart is not a mathematically validated RP² intrinsic metric or K#RP² quotient**. The Curvature Gate is **not** the hyperbolic double torus. Those are subsequent geometry research/engineering tasks.
- This package is **not deployed to the user's existing ChatGPT Site**. Do not claim otherwise. Merge against the exact live 0.19.1 source before publication.

## Next 0.22.x quality milestones

1. Full human playtest across Act II → III, collecting telemetry on safe trajectories, capture affordances, clarity and recovery intervals.
2. Correct representative geometry and intrinsic collision model for RP² and K#RP².
3. Measure build diversity, agency and resource pacing; avoid passive snowballing.
4. Integrate to the live Site after source comparison and full regression suite.
