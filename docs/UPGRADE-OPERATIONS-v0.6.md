# Directional upgrade operations

Version 0.7 replaces the targeting and visibility rules in this record.
See [visible combat](VISIBLE-COMBAT-v0.7.md).
The operation effects, handedness, equipment order, and counter rules remain applicable.

Candidate: Arrow Space Shift 0.6.0.
Date: November 4, 2026.

## User correction

Position Warp must act on a selected incoming side.
It must not act as a complete shield.
Right and left seeds must have distinct behavior.
Enemies must use and drop upgrades.
The game must introduce one operation, then three, then seven.

The previous collection-state imprint is removed.
A seed's handedness remains fixed before and after collection.
Its active side changes with fold count.

## Five-axis result

| Axis | Result |
|---|---|
| Constituents | Distinguish seed type, handedness, active fold count, local metric, incoming side, shot payload, actor, equipment slot, and retained damage. |
| Operations | Collect, equip, fold, unfold, cross an operation entry, resolve a counter, apply operations in slot order, receive damage, and drop equipment. |
| Standards | Match the user's right/left examples. Preserve shots from inactive sides. Apply the same rules to enemies. Exercise actual counter behavior. |
| Invariance / Equivariance | Position Warp preserves forward position, radial distance, velocity, ownership, and damage. Exchanging handedness exchanges the accepted side. Each fold or unfold reverses that side. |
| Context / Continuation | A shot retains the result after crossing. A later fold cannot recapture it. Inventory retains collected variants. Restart clears inventory and debt. |

## Side table

| Seed | Zero or two folds | One or three folds |
|---|---|---|
| Right Position Warp | Left shot → right | Right shot → left |
| Left Position Warp | Right shot → left | Left shot → right |

Each entry applies only at the actor's operation entry.
Other shots continue normally.
The central band is eight units wide on each side of the center line.
Shots in that band do not trigger an operation.
The entry plane is 140 displayed distance units ahead of the actor.
Enemies use the plane toward approaching player shots.
Player and enemy handedness use the same screen-side terms.

Position Warp mirrors relative lateral position.
It does not change the forward position or velocity.
The shot stays hostile after the jump.
The approach and departure have separate collision paths.
No collision check crosses the jump itself.
An actor can process each shot at its entry once.

Three folds can be active at once.
Removing a fold allows another one to be added.
There is no lifetime limit on these cycles.
Field count selects the operation side, including fields behind the ship.
The local field metric selects movement and projectile speed.
These two states must remain distinguishable.

## One, three, and seven operations

The introduction occupies route positions below 1,300.
It supplies right and left Position Warp carriers.
The three-operation stage occupies positions 1,300 through 3,799.
Its cycle is `P -> V -> I -> P`.
The seven-operation stage starts at 3,800.
Its counter relation is `(b - a) mod 7` in `{1, 2, 4}`.
The seven-operation roster retains the initial cycle.

| ID | Code | Operation | Runtime consequence |
|---|---|---|---|
| 0 | P | Position Warp | Mirror lateral position for a matching shot. |
| 1 | V | Vector Lens | Set outward lateral velocity to 140 units per second. Multiply forward velocity by 0.75. |
| 2 | B | Path Bend | Add outward lateral acceleration for 0.8 seconds. |
| 3 | I | Impact Buffer | Retain a confirmed hit as damage due after 0.8 seconds. |
| 4 | D | Arrival Delay | Hold the shot for 0.65 seconds, then resume. |
| 5 | A | Distance Anchor | Halve both velocity components. |
| 6 | U | Utility Exchange | Halve velocity, double retained damage, and advance the receiving actor's next shot by 0.12 seconds. |

All operations have handed seeds and the same side-entry requirement.
Only Position Warp changes the shot position instantly.
Impact Buffer does not remove damage.
Stored damage ignores temporary hit protection when it becomes due.
Pending damage is settled before route completion.
A held shot still has collision and contact damage.
Utility Exchange retains a heavier hostile threat in return for time and firing utility.
The seven effect-axis records remain in `src/upgrades.js` and in the interface.

## Counter rule

Every fired shot records its owner's equipped operation identities.
This record stays fixed after firing.
If an identity counters a defending operation, the shot passes that operation.
It keeps its normal damage and ownership.
The rule applies equally to player shots and enemy shots.

The three cycle edges and their reverse matchups have runtime tests.
All 21 unordered pairs in the seven-node graph have runtime tests.
Each pair's outside counter passes both equipped operations under the checked conditions.
This is an explicit authored bypass rule.
It is not a claim that the physical transformations alone produce those counter relationships.
It does not guarantee victory against an equipped enemy.
Movement, side eligibility, incoming fire, and other contacts still matter.

The graph structure does not establish overall combat balance.
An attack that has several payload identities may pass different operations for different reasons.
Keep those composition effects separate from the single-counter graph property.

## Equipment and order

The player has one slot during the first two stages.
The seven-operation stage opens a second slot.
Enemies in that stage also carry two different operations.
Slots run in order.
The next operation evaluates the shot's side after the previous operation.

For example, equip right Position Warp before right Vector Lens in folded space.
A right-side shot first moves left.
It no longer matches the right Vector Lens.
Reverse the equipment order.
Vector Lens now changes its velocity before Position Warp moves it left.
The remaining paths differ.
The runtime tests exercise this difference.

Fold timing also changes the result.
Fold before the right shot reaches a right seed's entry, and it moves left.
Fold after it passes the entry, and the earlier path remains.
Both runs can finish with the same fold count.
This is operation-order dependence.
No identity `AB = -BA` is claimed for the complete game.

Defeated carriers drop their actual equipped type and handedness.
Two-operation carriers drop both seeds.
Empty player slots fill first.
A new handed variant replaces the equipped variant of its operation.
Other pickups replace the selected slot when the available slots are full.
Collected variants remain in inventory for later equipment changes.
An operation cannot occupy both slots.

## Observation and next decision

The lab supplies a seed at launch and another every six seconds.
It alternates seed handedness and incoming shot side.
The combat modes aim player shots toward the nearest eligible enemy ahead.
This lets off-center shots encounter enemy operations during ordinary firing.
The original timing and reference modes retain their firing rule.

The browser shows equipment, accepted side, seeds ahead, stored damage, and recent counter results.
Enemy labels identify equipped operation codes and handedness.
The entry uses small side markers, not a surrounding shield ring.

The next playtest should ask the player to predict one right-seed and one left-seed result.
Then observe whether the player changes fold timing against a carrier with a counter.
At the seven-operation stage, compare two equipment orders.
Record whether the changed path affects a useful future action.
Do not infer comprehension or balance from automated checks.

The earlier experiment remains available in `reference/v0.5/`.
The current check results are in [verification](../reports/VERIFICATION.md).
