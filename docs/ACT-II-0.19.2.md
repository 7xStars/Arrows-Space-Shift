# 0.19.2 candidate — Act II: Klein Bullet Hell

## Canonical campaign rule

Act I is unchanged. The Klein Fleet remains the graduation boss for the original scrolling-shmup vocabulary and awards the Klein Relay.

Act II uses the same attack grammar and teaches what that grammar does on the Klein surface. Eight stages alternate new lessons with authored recovery gaps. The ninth encounter is a hybrid geometry boss that combines the learned Klein side pairing with projective antipodal longitudinal identification. The reward is the Projective Module.

## Act II stages

1. **Return Flight — Surface travel.** Player, enemies, shots and pickups inhabit the Klein surface. Up advances toward halfway; Down reverse-thrusts toward the bottom; scrolling never reverses.
2. **Intentional Crossing — Seam as a movement tool.** Wall and formation pressure make a side join a useful route rather than an accident.
3. **Returning Fire — Same grammar, new return.** Familiar Fan/Sweep/Gap attacks begin deliberately exploiting the Klein joins.
4. **Seam Gap — Global safe space.** Gap patterns require reading where older volleys return, not only what is locally empty.
5. **Cross Current — Pattern layering.** Previously learned patterns overlap while the surface rule remains fixed.
6. **Fold Timing — Where versus when.** Density falls while folds change arrival timing for understood returns.
7. **Pressure Field — Bullet-hell density.** No new topology rule; density, overlap and enemy population rise.
8. **Klein Mastery — Examination.** Seam traversal, returns, folds, layered patterns and high density combine. A quiet tail follows the final miniboss.
9. **The Projective Intrusion — Hybrid boss.** Klein baseline → isolated projective intrusion → stabilized hybrid geometry → hybrid mastery.

## Canonical pattern grammar

The reusable vocabulary is Fan, Sweep, Gap, Aimed, Burst, Wall, Spiral, Crossfire, Return and Convergence. Act II initially authors Fan, Sweep, Gap, Aimed, Wall and Return while retaining the rest as canonical definitions for later use.

Patterns are parameterized by count, beats, beat interval, speed, spread, rotation, targeting, gap motion, seam policy, warning and recovery rather than being independent bespoke attacks.

## Pressure budget

Each scrolling stage records an authoring pressure estimate using density, projectile speed, overlap, targeting pressure and geometric complexity. It is a guardrail rather than a promise of numerical difficulty. New geometry is introduced at lower density; high density arrives after the relevant surface rule is familiar.

## Enemy ecology

Act II distinguishes popcorn enemies, pattern carriers, anchors and minibosses. Recovery windows are represented as actual gaps in the authored carrier schedule rather than merely weaker bullets.

## Hybrid boss geometry

The boss does not replace the Klein bottle with pure RP2. It deliberately overlaps two rules:

- Side joins retain the Klein reflection.
- Projective intrusion introduces an antipodal x identification on top/bottom traversal.

Phase 1 is Klein baseline. Phase 2 gives the Antipodal Anchor projective traversal while the rest remains Klein. Phase 3 enables the mixed rule broadly. Phase 4 is full hybrid mastery. This rectangular gameplay quotient is explicitly treated as a module-overlap geometry, not as a claim that it is pure real projective space.

## Reward

Defeating the hybrid boss drops a physical **Projective Module**. It is banked additively alongside the Klein Relay; acquiring it cannot erase the Relay or starter fleet.

## Invariants preserved

- Act I chapter definitions and order are unchanged.
- Stage 7 remains at the accepted one-hit carrier health.
- Klein Fleet health remains 44 / 18 / 18.
- Hostile boss bullets clear when the entire fleet is destroyed.
- Manual forward fire remains the common weapon baseline.
- Act II movement is bounded from the bottom to halfway while the route scrolls forward continuously.
- The Klein Relay makes normal post-fleet traversal use the Klein surface.
- Existing Paley-7 equipment and folds remain part of the same combat grammar.

## First three Act II stages: authored implementation pass

### Act II-1 — Return Flight

This stage is deliberately low pressure. Seven pattern carriers are spaced around three authored recovery gaps. It begins with an ordinary FAN so the player has a baseline, then repeats familiar FAN/GAP/SWEEP grammar while the player, enemies, shots, and pickups inhabit the Klein surface. The side joins are available immediately, but the stage does not require a new attack grammar.

On-screen lesson prompts progress with route position. They ask the player to cross a seam during a quiet interval, then compare the next familiar pattern with its changed surface position. Enemy lanes are deliberately authored rather than purely cycled so the comparison remains readable.

### Act II-2 — Intentional Crossing

Nine carriers emphasize WALL and GAP patterns. Several WALL carriers are placed near the outer lanes. The intended lesson is that the local route through a wall can be tighter than the route obtained by deliberately using a side join. Three recovery gaps give the player time to cross once without pressure, inspect the new representation, and reset before the next obstruction.

This is not a mandatory seam-button puzzle: ordinary dodging remains legal. The seam is designed to become the clearer or shorter option often enough that the player begins treating topology as movement vocabulary.

### Act II-3 — Returning Fire

Eleven carriers alternate ordinary grammar with RETURN. RETURN keeps the existing warning-and-commit behavior but uses a wider lateral spread so its outer projectiles are engineered to cross a side join during their lifetime. At the current 150-unit projectile speed, a representative outer RETURN ray travels roughly 690 horizontal units over seven seconds, enough to cross from common firing lanes and re-enter through the Klein identification.

The stage uses three recovery gaps. Prompts explicitly distinguish an empty-looking local region from the global surface: after a returning volley leaves the visible patch, the player is given space to watch where it comes back before the next carrier adds pressure.

### Acceptance checks for these stages

- Act I chapter definitions are untouched by this authored pass.
- Return Flight uses only already-learned FAN/GAP/SWEEP grammar.
- Intentional Crossing adds WALL as a spatial obstruction but retains the same warning/commit model.
- Returning Fire introduces RETURN as a modifier of the existing grammar.
- Player vertical motion remains bounded between the bottom and halfway point while the route continues scrolling.
- RETURN outer rays have sufficient lateral travel to cross a Klein side join under ordinary projectile lifetime.
- Each stage contains three physical recovery gaps in the carrier depth distribution.
