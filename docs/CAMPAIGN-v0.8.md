# Campaign and Klein bottle battle

Historical record. Version 0.10 has eight scrolling levels and normal hull damage.
Even-numbered levels have mostly asteroids and occasional enemies.
See [the current campaign contract](ASTEROID-ROUTES-v0.10.md).

Candidate: Arrow Space Shift 0.8.0.
Date: November 4, 2026.

## Intended result

The player learns the spatial rules through four bounded levels.
Three interludes allow practice before the next level.
The final battle uses both pairs of identified edges.
The fleet remains alive until its members are destroyed.

The default campaign is separate from the older automatic-flight prototypes.
It uses a fixed camera and four-direction movement.
Up and Down also set facing.
This permits deliberate fire toward enemies in front or behind the ship.
The arrow keys keep their screen directions after a wrap.

## Teaching sequence

| Section | Required combat | Practice opportunity |
|---|---|---|
| Two Sides | Two waves of two Position Warp carriers. | Compare right and left seeds. |
| Side Practice | Repeating targets. Hull cannot be lost. | Fold and unfold without a deadline. |
| Counter Cycle | Two waves of three carriers. | Observe P → V → I → P. |
| Counter Practice | Repeating counter-cycle targets. | Change equipment and inspect counter feedback. |
| Seven Operations | Waves of three, two, and two carriers. | Use two slots against different operation pairs. |
| Order Practice | Repeating targets with the full kit. | Compare Position Warp before and after Vector Lens. |
| Front and Back | Two waves of moving carriers. | Move vertically and change facing before firing. |
| The Klein Fleet | A 24-hull core and two 8-hull escorts. | Apply the rules to returning enemies and projectiles. |

Practice ends only when the player selects Continue.
Practice targets return after destruction.
Practice gives no score and causes no hull loss.
Each teaching stage issues its unlocked seed types and handed variants.
The kit prevents a missed drop from blocking the next lesson.
Enemies retain their real equipment and drops.

## Continuation

The player must defeat all waves before a level clears.
The clear screen gives a deliberate pause before the next section.
Player damage debt must settle before a level clear.
Each new section restores hull and clears active shots and fields.
Score and equipment carry forward.
The section checkpoint records equipment, score, kill count, and time.
Retry restores that checkpoint.
New run clears the campaign and reopens setup.
There is no persistent save or resume after reload.

## Edge map

The map is a rectangle with one reversed pair of edge identifications.
This is the construction described by [Cornell's Klein bottle lesson](https://pi.math.cornell.edu/~mec/Winter2009/Victor/part2.htm).
The chosen chart reverses left/right identification and preserves top/bottom identification.
It is an abstract game map, not an embedded 3D bottle.

```text
left/right: (right, y) <-> (left, bottom + top - y)
top/bottom: (x, top)   <-> (x, bottom)
```

Horizontal edge crossings reverse vertical position and vertical motion.
They preserve horizontal motion.
They also reverse the actor's vertical facing.
Vertical crossings preserve horizontal position and motion.
The same rules apply to the ship, fleet, and projectiles.
Drops use the same neighboring images for collection.

The vertical chart coordinate is distance through the current fold metric.
It is not raw route position.
Projection and map conversion use the same distance function.
Changing a fold can therefore change chart placement.
A resulting remap requires another visible entry before the enemy can fight.

The movement tracer splits a step at every crossed edge.
It records the fraction of the step at each crossing.
Collision checks compare continuous segments over matching time intervals.
They do not sweep through an edge jump or a Position Warp jump.
Neighboring chart images provide contact across identified edges.
Corner crossings use the horizontal identification first.

## Fleet persistence and feedback

An edge crossing does not restore health or equipment.
The same actor ID continues on the opposite edge.
No member escapes through a boundary.
Only destruction removes a fleet member.
All three must be destroyed before victory.

The existing visibility acknowledgment and 0.65-second entry period remain.
An enemy cannot take damage while unseen.
Edge colors identify the two different return rules.
Near-edge markers show a departing enemy's expected return point.
Health bars, names, operation codes, and defeat effects remain visible.
Player shots last five seconds; hostile shots last seven seconds.
These lifetimes bound the number of returning projectiles.

## Analysis framework

| Axis | Result |
|---|---|
| Constituents | Keep section, wave, kit, actor identity, health, facing, fold metric, chart coordinate, and return edge distinct. |
| Operations | Move, face, fire, fold, unfold, equip, practice, retry, continue, wrap, and destroy. |
| Standards | The sequence must be playable without skipped sections. Wraps must preserve the declared state. Invisible kills remain prohibited. |
| Invariance / Equivariance | Health and equipment remain stable. Horizontal crossings reverse vertical state. Vertical crossings preserve horizontal state. |
| Context / Continuation | Practice has no deadline. Checkpoints retain earlier progress. Boss enemies persist across departures. The ending requires destruction. |

## Evidence and limits

Current Node checks cover campaign order, wave gates, practice, checkpoints, facing, all edge rules, corner movement, and collision paths.
They verify actor and projectile state across wraps.
They also verify that ordinary player shots can defeat a full-health core in a stationary firing fixture.

The campaign browser check reaches all levels, interludes, the boss, and the ending.
Its wave and ending fixtures prepare one-hit targets.
They establish branch and transition behavior, not normal-health difficulty.
A separate boss-motion check preserves all original health values across actual crossings.
The normal-page loop is checked without fixture controls.

No human completed the new campaign during this change.
The next playtest should examine whether each interlude prepares the player for the next level.
Check whether facing is clear during backward fire.
At the boss, ask the player to predict one return before the crossing.
Retain uncertainty about pacing, challenge, and enjoyment until that test.

See [verification](../reports/VERIFICATION.md) for commands and results.
