# Act IV completion contract and evidence

Version: `0.25.0-dev.1`. Date: November 13, 2026.
Owner: Engineering, with Design and QA verification.

## Intended continuation

The Curvature Seed opens Act IV after extraction in Act III.
The journey record supplies ship ID, run seed, score, echoes, inventory, and equipped order.
An existing Act IV checkpoint takes precedence over a later handoff.
Each stage starts with full hull, as in the earlier stage checkpoint policy.

Act IV save data uses version 3 in the existing `arrow-space-shift:act4:v1` key.
Versions 1 and 2 remain readable.
New stage entries retain the ship and equipment metadata.
Retry and reload restore the current stage's entry score and echoes.
A replay cannot replace the resources at the next uncompleted stage.
Old saves cannot supply metadata that they never recorded.

## Ship and equipment rules

Movement uses the selected ship's speed relative to Arrow.
Turning uses the inverse speed ratio.
The smaller Needle core changes actual collision eligibility.
Skater has a short thrust acceleration interval.
Aftwing applies its stronger reverse thrust.
All ships retain manual fire and the same fold/capture/release operations.

Inventory and equipped order remain stored across this chart.
The seven equipment operation effects are inactive in Act IV.
The launch panel and Options state this limit.
This is a declared boundary of the separate runtime.
It is not full equipment parity with Acts I–III.

## Double Torus encounter

The boss has 48 hull points and three health phases.
The first phase alternates Aim and Fan.
The second phase alternates Edge and Sweep.
The third phase combines Sweep, Fan, Edge, and Aim.
A phase change clears hostile projectiles.
It supplies a 2.3-second recovery interval.
The next attack starts after a 3.2-second firing interval.
A warning event identifies that scheduled attack before firing.
No action count or drill quota gates boss defeat.

The larger hull allows the attack phases to occur before concentrated manual fire defeats the boss.
These are implemented tuning values.
They do not establish human difficulty or balance acceptance.

## Final component state contract

| State | Trigger | Permanent reward |
|---|---|---|
| Boss defeated / core exposed | A real player projectile removes the boss's remaining hull | None |
| Core collected | The ship reaches the physical diamond after its entry period | None |
| Core extracted | The ship subsequently reaches the separate square extraction beacon | Eligible receipt |
| Core banked | The valid extraction receipt is saved in the journey record | Hyperbolic Core |
| Drive assembled | Repair dock verifies all four saved parts | Separate dock state |
| Repair activated / campaign complete | The repair challenge and ending meet their own contract | Separate dock state |

The drop uses the boss's actual position.
Its marker and the extraction marker use different shapes.
Both positions lie inside the Bolza chart.
After boss defeat, hostile fire stops while the player recovers the part.
The extraction beacon is a different destination from the physical pickup.

A reload before extraction restores the boss entry.
It does not preserve an exposed or carried final component.
`finalComponentReceipt()` requires the ordered exposure, collection, and extraction states.
`bankFinalComponent()` then validates the receipt through the shared journey API.
Local QA mode cannot save a final reward.
If the journey write fails, the result panel supplies a save retry action.
The repair dock link is shown only after a banked receipt is available.

## Geometry and collision boundary

The existing Bolza kernel still owns movement and heading transport.
Simulation frames use bounded intrinsic substeps.
Collision retains endpoint checks in the home chart and eight adjacent lifts.
A local closest-approach check also tests movement inside one chart.
It uses geodesic interpolation at the closest relative chord parameter.
It skips a sweep when either motion contains a paired-edge jump.
No sweep crosses that discontinuity.

This is a bounded numerical improvement.
It is not a complete global shortest-path or continuous-collision solver.
Vertex ambiguity and untested multi-lift cases remain release risks.

## Verification

`node --test tests/act4*.test.mjs` passed 25 tests.
The added tests cover bridge metadata, ship differences, scheduled boss warnings, recovery, local collision paths, release capacity, and the final extraction state.
A normal-health simulation pilot cleared all eight lessons through movement, manual fire, capture, release, and folding.
Another pilot defeated the boss, collected the core, and reached extraction without health edits or enemy removal.
These are automated simulation results, not human playtests.

`node tools/browser-acceptance.mjs . reports/implementation-2026-11-13/act4` passed 32 browser checks.
It found no page exception or failed resource request.
The checks include ordinary tutorial controls, Act IV controls, shared settings, pause, modal focus, and compact layout.

`tools/act4-completion-browser.mjs` is a reusable ordinary-input boss check.
It starts from a declared existing profile with the first eight Act IV stages cleared.
It uses a read-only snapshot and actual keyboard input.
It checks reload after exposure, reload after pickup, extraction banking, and the repair dock link.
Its evidence is under `reports/completion-0.25.0-dev.1/act4-browser/`.
The saved journey and browser storage exports can supply the repair dock acceptance fixture.

The current full `npm run check` passed 200 tests and 43 source/tool syntax checks during integration.
The final release check must run again after all team changes are complete.

## Remaining acceptance

Full equipment effects remain inactive in this chart.
A fresh-profile campaign playthrough, human comprehension, audible mix, physical-device performance, and comprehensive geometric collision acceptance remain separate gates.
A passed headless browser check does not establish these results.
