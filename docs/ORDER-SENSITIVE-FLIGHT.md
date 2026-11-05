# Order-sensitive flight

Status: rejected. Version 0.5 removes the lane-swap rule.
This document retains the earlier proposal for reference.
Use [the upgrade experiment](UPGRADE-EXPERIMENT-v0.5.md) for the current direction.

Candidate: Arrow Space Shift 0.4.
Decision: connect steering, firing, and fold traversal in a continuous flight mode.

## Problem

The earlier field mainly changed distance and shot speed.
Its inverse removed that field.
The user wants movement to require spatial thought without a sequence of fixed puzzle solutions.
Adding more buttons would not, by itself, provide that relationship.

## Chosen rule

A fold places two seams across the route.
Crossing a seam reflects a moving object's lane.
The interval still compresses distance and accelerates shots.
The player can steer before a crossing, steer between crossings, or remove the return seam.
The existing arrow, Space, and Shift controls are retained.

| Sequence | Result |
|---|---|
| Steer right, then cross a seam | The crossing sends that displacement left. |
| Cross the seam, then steer right | The displacement remains right. |
| Cross both seams without steering between them | The original lane is restored. |
| Cross the entry, then unfold | The return seam is removed. The current lane remains. |
| Fire through one seam | The shot reaches the opposite lane. |

This is non-commutativity: operation order changes the result.
It does not require a claim that full game-state operations satisfy `AB = -BA`.

For a fixed seam, let `C(x) = -x` and `T_d(x) = x + d`.
Then `C(T_d(x)) = -x - d`, while `T_d(C(x)) = -x + d`.
Equivalently, `C T_d = T_-d C`.
The crossing is automatic during forward flight. It is not another button.

## Why the interaction could be worthwhile

An outgoing shot and an incoming shot can use the same connection.
A route that improves an attack can change the lane from which danger arrives.
A player can cross while avoiding fire, then remove the return seam before the next gate.
Steering changes both the immediate position and the position after the next crossing.
These are sources of possible value, not observed player findings.

The new mode remains continuous.
Enemies and gates supply the pressure and route context.
No extra target timer, answer confirmation, or stage reset is used.
Ordinary steering remains possible. There is no prescribed solution sequence.

## Preserved distinctions

The field changes route distance. Its seams change lane connections.
Those are separate operations with one visible structure.
Removing geometry does not reverse completed travel.
A stationary target does not cross a seam just because the camera moves.
Shots from both sides use the same transport rule.
Arrow commands retain screen directions.

Collision checks use the continuous pieces on each side of the jump.
They do not invent a path through the intervening lanes.
The exit remains vulnerable. The jump does not grant protection.

The v0.3 course remains preserved separately.
Its forecast and player-evidence limits are not replaced by this implementation.
Version 0.4 revises the main question from arrival timing to route composition.

## Evidence and next observation

The rule checks compare equal travel time and equal steering duration in different orders.
They reach opposite lanes while retaining equal forward progress.
Browser checks repeat the comparison with real arrow-key events.
Other checks cover shared projectile routing, return-seam removal, preview agreement, and collision discontinuities.

Ask the player to predict the next lane before crossing.
Then observe whether that prediction changes steering or firing.
Look for several useful choices, rather than one repeated command sequence.
Record whether the ghost supplies a useful forecast or merely adds visual noise.
Keep the score bonus disabled for one comparison.

Counterevidence includes:

- The player ignores seams and uses ordinary steering for every situation.
- A fixed fold-and-unfold rhythm is sufficient throughout the route.
- The player cannot relate the exit to earlier steering.
- The lane jump feels arbitrary despite the preview.
- The shared shot route is too hard to read before its consequence.

If these appear, revise seam placement, route pressure, or visual explanation before adding more operators.
No human play session was performed for this change.
