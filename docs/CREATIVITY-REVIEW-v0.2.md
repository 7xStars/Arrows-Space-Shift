# Foldspace creativity review

Historical review of the game now named Arrow Space Shift.
The forecasts below are preserved. See [the implementation record](IMPLEMENTATION-v0.3.md) for later work.

Date: November 4, 2026.
Concept: Foldspace 0.2.0.
Reviewer: Codex, using Problem Solving and Skill Check.
Method: the user's provisional Creativity Assessment Framework v1.0.

## Recommendation

**Prototype uncertainty.** Develop the timing choices before adding more systems.

The strongest direction is: **control when shots and hazards reach their targets by changing the space between them.**
The current prototype implements a shared benefit and danger.
It does not yet demonstrate that people can predict those consequences and choose between them.
The next experiment should test that claim with three short encounters.
Compare the encounters with and without the fold score bonus.
Keep the current game as the reference candidate.

No gameplay code was changed for this review.

## Evaluation brief

Audience: players interested in short keyboard-controlled shooters and readable tactical choices.
This audience is proposed. No participant group was recruited.
Context: a small Game Off entry, alongside the user's current thatgamejam project.
Intended value: a player can predict an arrival, change it through a fold, and observe the consequence.
Retained commitments: arrow keys, separate Left Shift and Right Shift controls, visible projectile effects, and consequences for both sides.
The global clock and firing clocks retain their normal rates.

Reference set: the current Foldspace rules, the user's stated Lamirys relationship, and preliminary official descriptions of SUPERHOT and Velocity Ultra.
The closest field-wide precedents have not been established.
This is not an adequate historical originality search.

Horizon: the next encounter prototype, not a long campaign.
The review generated six paper proposals without a fixed generation-time budget.
They are proposals, not demonstrated worthwhile breadth.
All six dimensions are in scope. None is declared NA.

A successor concept would replace local, shared space changes with a private damage boost or a global slow-motion power.
Adding a second fold axis could remain development of this concept, but would require a new movement and display contract.

Overall editorial judgment: the shared effect on both sides is worth investigating.
The score bonus supplies an incentive, but it does not establish a worthwhile spatial decision.
This judgment is from one agent. It is not independent human review.

## Evidence record

| ID | Type | Evidence | Supported claim | Limit |
|---|---|---|---|---|
| E1 | Structural inspection | [DESIGN.md](../DESIGN.md), [space.js](../src/space.js), and [simulation.js](../src/simulation.js). | Fixed local fields affect movement, display, both sides' shots, and kill points. | An implemented relationship does not establish a good player decision. |
| E2 | Prototype observation: automated | `npm test` rerun for this review. All 17 tests passed. | Folds advance outgoing hits and incoming hits. Unfolding delays incoming impact. The bonus follows the stated rule. | Synthetic fixtures do not demonstrate player recognition or combat balance. |
| E3 | Recorded prototype observation | [browser-results.json](../reports/browser-results.json): 27 prior checks passed for 0.2. | Input, projected shot motion, reset, and the recorded layouts worked under those checks. | The browser suite was not rerun for this documentation-only review. |
| E4 | User statement | The user reports liking the concept and requests improvement. | The concept interests this user at this stage. | It does not show which decisions worked during play or how other players respond. |
| E5 | Precedent | [SUPERHOT, developer page](https://superhot.itch.io/superhot): movement controls time and bullet motion. | Shooter decisions can be organized around an unusual relationship between action and motion. | Description review only. This review did not play or analyze the full game. |
| E6 | Precedent | [Velocity, FuturLab](https://www.futurlab.co.uk/games/velocity): Velocity Ultra is a teleportation shooter. | Spatial movement powers in shooters are a relevant precedent family. | The page does not establish whether a local shared distance field exists. |
| E7 | Claim | Three short timing encounters could teach offense, defense, and a combined choice. | A reason to prototype the proposed direction. | No such encounter sequence was built or played for this review. |

Source identity for E1/E2:

- `src/space.js` SHA-256: `FE2C4D5C9B436A43E644919EBFD8F4F7D511992350EC40917736ED15A5995F51`.
- `src/simulation.js` SHA-256: `B46A23ED3B6D199D99123C4F12AA05B509E54CAD366F331431F895452B4222B2`.

## Five-axis investigation

| Axis | Finding | Consequence |
|---|---|---|
| Constituents | Route distance, visible distance, projectile speed, firing time, target state, score, and player reaction time are distinct. | A higher score cannot substitute for a useful choice about space. |
| Operations | A fold changes a local interval. It does not reverse events. Unfold changes the remaining flight of a shot. | Test a decision made after firing, not only a fold made before combat. |
| Standards | Success requires a recognizable, available, timely action with a consequential result. | Check prediction before action and explanation after the result. |
| Invariance/Equivariance | Both sides' shots must receive the same local speed effect. The global clock remains fixed. | Any teaching aid must preserve those rules. A control comparison may deliberately remove the bonus. |
| Context/Continuation | Earlier shot positions and damage survive unfolding. The latest field is removed first. | The player needs enough information to recover before a consequence becomes unavoidable. |

## Creativity profile

Ratings are ordinal judgments. They are not probabilities.
`U` means insufficient grounds. No total or forecast gap is calculated.

| Dimension | Potential | Confidence | Demonstrated | Confidence |
|---|---|---|---|---|
| Originality | U | U | U | U |
| Contextual value | 3 | Low | U | U |
| Coherence and integration | 3 | Low | 2 | Medium |
| Generative breadth | 3 | Low | U | U |
| Generative depth | 3 | Low | U | U |
| Adaptability | 2 | Low | U | U |

### Originality

E5 and E6 identify relevant families, not the closest complete reference set.
The proposed departure is local shared distance control while time continues normally.
Its historical originality remains U.
Counterevidence would include a close shooter with the same relationship and decision structure.
Next test: examine documented spatial-field and projectile-control shooters before assigning an originality rating.

### Contextual value

Potential 3 forecasts a useful mix of prediction, action, and recovery from E1 and E7.
E4 supports interest, but does not establish the intended player experience.
Demonstrated value remains U for that claim.
Counterevidence: players cannot predict the effect, or one fold policy is consistently sufficient.
Next test: ask players to predict an arrival, choose an action, and explain the result.

### Coherence and integration

Potential 3 forecasts encounters in which the same space rule supports offense and defense.
Demonstrated 2 is limited to structural integration in E1/E2.
Both sides' shots, route movement, and retained consequences are connected.
However, the score bonus is a separate reward rule.
The projectile speed gain is also an authored addition beyond distance compression.
Neither addition can be inferred from a picture of shorter distance alone.
Counterevidence: players follow points without understanding the field, or the shot rule seems arbitrary.
Next test: remove the bonus in a comparison and test a clear projectile demonstration.

### Generative breadth

Potential 3 rests on the six proposal families below.
Their value and distinctness have not been assessed through a completed exploration protocol.
Demonstrated breadth remains U.
Counterevidence: the proposals all reduce to the same action pattern or need unrelated systems to work.
Next test: develop three encounter briefs to runnable fixtures under the same time budget.

### Generative depth

Potential 3 forecasts a sequence from earlier arrival to control of an already fired shot, then a choice affecting both sides.
E2 supports the underlying effects, not sustained discovery.
Demonstrated depth remains U.
Counterevidence: after the first lesson, every encounter is solved by the same sequence of button presses.
Next test: ask whether the combined encounter requires a new prediction built on the first two lessons.

### Adaptability

Potential 2 forecasts retention of the shared timing choice with one fold and different encounter pressures.
This forecast requires significant encounter work and has low confidence.
Demonstrated adaptability remains U.
The recorded responsive layouts in E3 do not establish preserved creative value.
Next test: compare one field with three fields while holding target behavior, information, and controls constant.

## Structural findings

### The field changes distance, not topology

All current distance factors are positive.
The displayed route remains ordered and continuous.
Distant positions do not become the same position.
This is a distance-compression game, not yet an origami adjacency game.
That can be a valid identity. Its encounters should exploit distance and arrival time.

### Stacking is not yet demonstrated depth

For a fixed field set, multiplication gives the same geometry regardless of array order.
However, the array order determines which field Right Shift removes.
These full states must remain distinct when their permitted continuations differ.
This does not establish that every hypothetical stack order is reachable in normal play.
The existing 2x/4x/8x values may add pressure without adding a new decision.
That is a hypothesis, not a balance finding.

### Points and value need separate checks

Removing `50 * foldDepthAt(target)` would leave movement and shot speed intact.
This makes the bonus a useful removal test.
It does not prove that score is unnecessary for an arcade game.
Compare whether players still use both operations for understandable reasons when that reward is absent.

## Development alternatives

These are paper proposals. No candidate below was implemented in this review.

| Candidate | Meaningful difference | Expected value | Failure case | Next check |
|---|---|---|---|---|
| Arrival window | A target is exposed for a visible, fixed time. | Fold to land a shot before the target closes. | Continuous firing solves it without timing. | Compare with an open-space control and the same firing rule. |
| Defensive release | Incoming fire leaves too little dodge time in the folded field. | Unfold after an offensive hit to create an escape interval. | Early unfolding is always sufficient. | Preserve the later target opportunity and compare both choices. |
| Shared interval | An outgoing shot and incoming fire occupy the same field. | One change helps one consequence while worsening another. | There is no time in which both actions are useful alternatives. | Inspect the deadlines before player testing. |
| Timed passage | A clearly signaled gate changes on the unchanged clock. | Route compression changes whether the ship reaches its opening. | The timing display is unclear, or waiting dominates. | Compare gate cycles at equal thrust. |
| Rescue crossing | A rescue target crosses a danger zone. | Use the field to change an interception or rendezvous time. | Value depends on a separate rescue system rather than space control. | Start with a simple crossing marker and no new progression system. |
| Field-position contrast | The ship places otherwise equal fields at different route positions. | Location matters beyond stack count. | Repeated folds in one place dominate. | Compare two authored placements with equal fold depth. |

## Next experiment

Recommendation owner: Design, under the user's direction.
Implementation and player observation remain proposed.
The user selects whether to proceed.

Create one short sequence with one active field:

1. Hit a target during its visible exposure window.
2. Unfold an existing field to create time to avoid incoming fire.
3. Resolve an outgoing hit and incoming threat in the same interval.

The combined encounter must depend on a relationship learned earlier.
Do not count a harder version of the same action as a new discovery.
Retain an encounter if it supports a distinct, readable choice.

Use matched versions with the fold bonus present and absent.
Keep controls, shot effects, thrust, target behavior, and visual information equal.
Do not change the current production candidate during this comparison.
Vary order across participants when practical.
Record prior exposure and assistance.
A small exploratory round can locate a problem, but does not establish population reliability.

Before each decisive action, ask what the player expects to arrive first.
Observe which action they attempt and whether it is legal and timely.
Afterward, ask which event caused the result.
Record alternatives they considered and whether a recovery remained available.
Keep actions, statements, and reviewer interpretations separate.

Seek counterevidence deliberately:

- Does always-open or always-folded play remove the need to switch?
- Can uninterrupted firing bypass the intended timing problem?
- Is there enough warning before unfolding ceases to help?
- Does the player respond to the field or only to the score display?
- Does the combined encounter reveal a new relationship?

Stop this prototype round when each encounter has a runnable fixture and a recorded player explanation, or when a blocking comprehension or dominance problem is identified.
Then choose a focused repair before adding content.
Do not treat the absence of a defect in one round as proof of general balance.

## Readiness, adoption, and revision

Readiness: the local rule model is executable. E2 passed again.
Encounter authoring, timed target signals, and matched comparison modes are not yet prepared.
These are narrower changes than adding a new fold axis, ship upgrades, or a campaign.
That is an implementation judgment, not a measured cost estimate.

Adoption: keep the user's chosen arrow and Shift controls.
Physical keyboard comfort and the visibility of both Shift actions need observation.
Do not silently introduce alternative keys during the assessment.
No physical device or new player session was tested in this review.

Revisit the recommendation if a closest precedent changes the originality claim, a simple strategy dominates all encounters, or players cannot predict the shared effect after a clear demonstration.
Preserve this profile when later observations become available.
Do not replace the potential forecasts with later knowledge.

Full ASD-STE100 conformity is not claimed.
The official dictionary PDF was unavailable in this session's earlier access attempt.
