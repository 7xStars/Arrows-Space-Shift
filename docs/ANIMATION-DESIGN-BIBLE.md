# Animation design record

## Current campaign update: 0.25.1-dev.1

The main and Bolza renderers now use `StructuralFeedback`.
An actual manual shot adds an impulse to an exact damped second-order response.
Ship profiles use the existing settled, elastic, or heavy model.
The rendered recoil is bounded to 2.8 pixels. The true collision core stays fixed.
Enemy impact recoil uses the same bounded response family.
Damage uses the normalized trajectory of the coupled matrix `[[0.6,2],[0,0.6]]`.
It gives brief growth followed by decay. It is a drawing model, not ship physics.
Simulation time advances each response. Pause freezes it. Retry clears old impulses.
Reduced motion suppresses recoil and retains static damage information.

The following sections describe the earlier candidate.

Version: `0.25.0-dev.1`.
This update retains most existing combat animation.
It adds no new animation primitives or second-order motion solver.
The presets in the imported STC-AV proposal remain experimental.

## Current visual behavior

| Element | Existing behavior | Required distinction |
|---|---|---|
| Player ship | Restrained bank and firing recoil | Decorative displacement does not move the hitbox |
| Collision core | Fixed ring at the simulation position | The ring remains the hit-area reference |
| Damage | Hit ring, hull change, and narrow perimeter cue | Damage differs from a successful attack |
| Enemy | Entry marks, attack preparation, damage, destruction | Warnings follow actual attack state |
| Live projectile | Filled core and continuous trail | It remains a real collision object |
| Future image | Hollow form and dashed lead-in | It is a forecast without a second collider |
| Klein join | Paired notch and local direction cue | The actual mapping determines continuation |
| Projective join | Opposed ticks and mapped return | It differs from a Klein join |
| Bolza join | Paired letters and arrival ring | Position and heading follow the kernel |
| Double Torus | Phase number, actual hull, warning countdown, recovery ring | The visible state follows the actual three-phase encounter |
| Hyperbolic Core | Labeled physical pickup, then extraction beacon | Defeat, collection, and extraction remain separate |
| Repair circuits | Receivers, charge indicators, fold grid, marked Klein entry, echo count | Each successful operation charges its actual circuit |
| Ending | Compressed route rings, ship departure, timed text | Activation precedes the saved completion state |

The main renderer uses simulation time for short effects.
Firing feedback does not delay a shot.
Damage feedback does not delay damage.
Screen-space interpolation does not replace an identified edge mapping.
Collision paths remain under simulation control.

The Double Torus uses the existing diamond silhouette.
Its new phase and recovery display makes the encounter state explicit.
Warning outlines and countdowns follow the actual firing clock.
The phase recovery ring follows `bossRecoveryUntil`.
It does not imply immunity outside that recorded interval.

The repair view uses the existing ship sprite.
Its grid and ending rings use the same `spaceDistance` rule as its movement.
The ending's changing fold factor drives the route projection.
This is a separate view in `src/repair-app.js`.
It is not a replacement combat renderer or a 3D engine.

## Reduced motion and silent play

The existing reduced-motion option suppresses decorative movement.
The existing visual-effects option also controls nonessential effects.
The hit core, filled shots, hollow forecasts, edge marks, and text retain their information.
Shape and line style supplement color.
Act IV uses the shared saved reduced-motion preference in this candidate.
The repair view also loads that shared preference.
During its ending, reduced motion holds the ring layout steady and removes ship drift.
Text, charged circuits, and completion state remain available.

These behaviors do not establish WCAG photosensitivity conformity.
No measured flash analysis or physical-device review is included here.
See [the QA report](AV-QA-REPORT.md) for executed visual checks.

## Further work

Review boss warning, active, and recovery phases in ordinary play.
Check each sprite at its actual display scale.
Check dense combat with sound off and reduced motion on.
If a new decorative response crosses a chart boundary, reset or transport it with the chart.
Do not interpolate it across the apparent screen jump.
Retain the existing hitbox and attack timing.

The [imported design PDF](../imports/downloads-2026-11-12/files/Arrow_Space_Shift_Structural_Techno_Cosmism_Design_Bible_v1.pdf)
remains the reference for proposed motion studies.
Its parameters are not verified tuning values.
