# Upgrade experiment

Historical record. Version 0.6 replaces the collection-state rule with handed seeds.
See [the current operation contract](UPGRADE-OPERATIONS-v0.6.md).

Candidate: Arrow Space Shift 0.5.0. Date: November 4, 2026.
Status: an executable experiment, with a proposed counter graph.
The user rejected the lane-swap rule. Version 0.5 removes it.

## Decision and scope

The player should use space changes to plan movement during combat.
The game should not require one fixed puzzle solution.
An upgrade is an operation with consequences across seven axes.
Those axes are position, distance, path, velocity, arrival time, damage, and utility.
An unchanged property is also part of its contract.
Each operation does not need to change every property.

The first experiment implements Position Warp only.
The two tournament graphs specify later counter tests.
They are not additional playable modes or completed upgrade sets.

## Five-axis analysis

| Axis | Result |
|---|---|
| Constituents | Distinguish a dropped seed, its stored collection state, the active fold state, the ship, and each hostile shot. |
| Operations | Destroy, drop, collect, fold, unfold, move a shot, and continue its path. Collection and folding can occur in either order. |
| Standards | Order must change an observable result. The result must affect a useful future action. Opposite output alone does not establish a useful choice. |
| Invariance / Equivariance | Preserve the ship's lateral position under a fold. Preserve shot ownership, base velocity, and damage under a position warp. Rotate relative position in the current distance metric. |
| Context / Continuation | Retain the collection state through later folds. Keep warped shots dangerous. Reset clears the upgrade. A later seed replaces the stored state. |

## Stored collection state

Let `f = +1` mean no active fold.
Let `f = -1` mean one active fold.
Let `b` be the value of `f` when a seed is collected.
The active warp side is `b * f`.
Positive means right. Negative means left.

| Sequence | Stored state | Final fold state | Warp side |
|---|---|---|---|
| Collect open, then fold | Open | Folded | Left |
| Fold, then collect | Folded | Folded | Right |
| Collect open, fold, then unfold | Open | Open | Right |
| Fold, collect, then unfold | Folded | Open | Left |

The stored state adds history to the upgrade.
Removing a field restores distance but does not erase that history.
The seed changes its proposed collection state when the fold state changes.
The interface shows that state before collection.
The state is committed at collection, not at the enemy's death.
The active fold state is global to this rule.
The local metric still depends on the field's position.

This is non-commutativity: collection before folding differs from folding before collection.
For the checked equal input, the two warp offsets have opposite signs.
The complete game does not satisfy an asserted identity `AB = -BA`.
The tournament graph does not create this order dependence.

## Position Warp contract

The trigger is an enemy shot's first entry into a 160-unit radius ahead of the ship.
For relative position `(x, z)` in the current distance metric:

```text
right: (x, z) -> ( z, -x)
left:  (x, z) -> (-z,  x)
```

| Axis | Behavior |
|---|---|
| Position | Rotate the relative position by one quarter turn. |
| Distance | Preserve radial distance at the warp instant. |
| Path | Continue from a new origin. Do not rotate the existing base velocity. |
| Velocity | Preserve the base velocity. The new local metric can change visible speed. |
| Arrival time | Change the remaining approach through the new position and path. |
| Damage | Preserve hostility and contact damage. Each shot warps once. |
| Utility | Change which future route contains danger. No resource reward is added by the warp. |

The warp jump has no swept collision path.
The continuous approach and departure retain collision checks.
A warped shot can still hit the ship.
The entry ring and violet shots show the operation.
The small circles are direction guides under the current state.
They are not exact interception predictions or safe destinations.

## Why the choice can matter

With an open collection state, folding combines faster shots with a left warp.
Unfolding combines slower shots with a right warp.
A folded collection state reverses that pairing.
The player cannot choose speed and warp side independently from those two Shift actions.
The later route should make that coupling useful.

An open arena can make the two sides equivalent.
The lab demonstrates the rule but does not resolve that design risk.
Test a left gate approach and a right gate approach with matched incoming shots.
Observe whether the player changes collection order, fold timing, or route.
Compare against the same route without the stored state.
Reject the stored-state rule if it adds recall without a useful choice.

The current combat route has gates and enemy formations.
It does not yet contain a validated sequence that teaches this coupling.
No cooldown, damage bonus, or extra control was added to force a preference.

## Three operations, then seven

For this experiment, a directed edge means that the row operation is intended to counter the column operation.
A 1-paradoxical tournament requires an outside counter for each single vertex.
A 2-paradoxical tournament requires an outside counter for each pair.
The [paper by Pálvölgyi and Gyárfás](https://users.renyi.hu/~gyarfas/Cikkek/164_transitive.pdf) gives this terminology and the Paley tournament context.

The initial cycle is:

```text
Position Warp -> Vector Lens -> Impact Buffer -> Position Warp
```

These edges are hypotheses. Their names do not prove the counter relationships.
The first graph has three vertices and three edges.
The second graph retains that cycle within seven vertices.
Its rule is `a counters b` when `(b - a) mod 7` is in `{1, 2, 4}`.
The checks enumerate all 21 unordered pairs.
Each pair has exactly one outside counter in this graph.

| ID | Operation | Stage | Proposed role | Status |
|---|---|---|---|---|
| 0 | Position Warp | 1 | Relocate a hostile shot while retaining its momentum and damage. | Playable |
| 1 | Vector Lens | 1 | Exchange forward and lateral velocity. | Proposal |
| 3 | Impact Buffer | 1 | Delay a damage consequence while retaining the liability. | Proposal |
| 2 | Path Bend | 2 | Curve a future route under a declared heading rule. | Proposal |
| 4 | Arrival Delay | 2 | Pause a threat, then restore its motion. | Proposal |
| 5 | Distance Anchor | 2 | Change local travel cost while keeping endpoints. | Proposal |
| 6 | Utility Exchange | 2 | Exchange damage capacity for a different future option. | Proposal |

The interface lists all seven effect axes for each proposal.
The records are in `src/upgrades.js`.
Those records do not implement the proposed runtime rules.

## Counter test requirements

A graph is not a combat model.
A pair's common graph counter does not prove a counter to their combined effects.
Composed operations can act in different orders.
Those orders can produce different paths and contact times.

Before implementing another operation, define its trigger, target, cost, duration, and interruption behavior.
Define a fixture where the proposed counter changes an outcome.
Keep the available resources and starting information explicit.
Then test reversed operation order and an adverse route.
Do not add arbitrary damage multipliers only to make the graph pass.
Revise an edge or an operation when the intended relationship fails.

## Results and next decision

Rule checks demonstrate opposite warp sides in equal final folded space.
Two mirrored movement fixtures also demonstrate a damage difference between warp sides.
Each uses the same shot and the same movement within its comparison.
The shot starts 70 lateral units from the ship and 100 distance units ahead.
The ship moves toward the proposed warp side for 0.5 seconds.
The checked outcomes are four hull points versus five.
This is a constructed continuation, not a player observation.
Browser checks exercise both collection orders through normal controls.
The graph checks cover three single vertices and 21 pairs.
These results do not establish player comprehension, enjoyment, or combat balance.
See [verification](../reports/VERIFICATION.md) for executed checks.

The next design decision is whether the retained collection state deserves a full encounter.
The next implementation candidate is Vector Lens.
Its interaction with Position Warp must change the future path for a clear reason.
Test `warp -> velocity change` separately from `velocity change -> warp`.
Do not infer that relationship from the graph alone.
