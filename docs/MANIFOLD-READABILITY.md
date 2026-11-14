# Arrow Space Shift — manifold visual language

## Non-negotiable simulation truth

A connected nonorientable surface (the Klein bottle, or Dyck's surface K#RP²) does not supply two globally separate collision sheets. Changing a chart representative does **not** make a real projectile harmless. In this game, real hostile projectiles are always rendered with a filled core and an unbroken trail and are resolved by the existing `pathsHit` / `pathsHitProjective` collision code, including identified images. No new collision immunity is created by this visual pass.

Hollow rings are **future-position previews** drawn by the renderer. They are not new projectile objects, are never inserted into `enemyShots`, and never have an independent hitbox. These previews may correspond to physical paths that are themselves dangerous when the active projectile reaches them; therefore hollow does **not** mean that region is permanently safe.

## Two-axis encoding

| Interactivity truth | Shape / trail | Meaning |
| --- | --- | --- |
| Real projectile | Filled core, continuous trail, foreground | Real object; normal collision rules apply |
| Future projected image | Hollow circle, dotted/dashed lead-in, lower opacity | Future location preview of one existing projectile, not extra hitbox |
| Crossing expected soon | Brighter paired-edge marker + approximate seconds | Forecast of when a real shot may pass an identification; other actions can change it |

| Manifold rule | Shape (not color alone) | Feature |
| --- | --- | --- |
| Klein | slanted notch | Side crossing reverses physical forward direction |
| Projective | opposed short ticks | Antipodal-style top/bottom reflection in prototype chart |
| Hybrid K+P | notch AND opposed ticks | Hybrid encounter uses both kinds of rules |
| Periodic | two parallel bars | Join preserves corresponding direction |
| Bolza genus 2 | matched A–D edge glyphs, primes on opposite pair | Hyperbolic opposite-side pairing |

The player display shows local chart/frame state, not a global "which side of the surface" assertion. Treat opponent-side views as a representation choice, not a blanket collision rule.

## Presentation safety

- UI can disable optional manifold images in Options, leaving essential attack telegraphs and collision cores intact.
- Reduced motion disables decorative pulses and particles but preserves solid/hollow shape, edge identity, and crossing position.
- Timings are forecasts based on current position, velocity, and fold metric. They are not a promise that future player/enemy actions will leave the path unchanged.
- Render-only helpers must never mutate simulation state, shot arrays, ownership, damage, or checkpoint records.
- The Act II K+P hybrid remains a gameplay prototype and has **not** been proved to be a faithful K#RP² quotient. It must not be labeled mathematically verified Dyck's surface.

## Acceptance tests

1. Same physical shot remains collidable across a Klein identification; preview object has no collision identity.
2. A predicted crossing maps to the actual paired edge and transformed coordinate under `traceKlein` / `traceKleinProjective`.
3. Hybrid phase 2 applies the projective cue only to the projective source; phase 3 activates after its warning interval.
4. Player physical-forward indicator changes across a Klein twist, with the view remaining upright.
5. A muted or reduced-motion game still distinguishes filled/dashed shapes and paired edges.
6. Hyperbolic research room previews the correct opposite-side pair using actual `moveBolza` mapping; previews do not create targets or collisions.
7. Blind playtests: players identify immediately threatening real shots vs render-only previews, predict return locations, and understand that a preview does not grant physical immunity.
