# Audiovisual learning notes

## Current update: 0.25.1-dev.1

| Event | Constituents and operation | Syntax and intended meaning | Use in play |
|---|---|---|---|
| Manual fire | Actual fire event, impulse, damped response | Immediate shot, bounded recoil, settling | Confirm the shot without delaying it |
| Damage | Actual hull event, coupled finite response | Brief growth, decay, static core | Distinguish received damage from weapon discharge |
| Real crossing | Physical ID, retained motif, changed timbre | Recognizable motif before and after the join | Support recognition of one continuing projectile |
| Recovery | Real recovery state, core fade, retained atmosphere | Reduced rhythmic pressure with arrangement continuity | Leave space for orientation |
| Title and Act change | Produced track, two aligned stems | A stable musical identity changes with campaign context | Establish the four-Act musical sequence |

These meanings are design hypotheses. Tests verify their implementation.
No new participant recognition, reaction-time, or transfer result is claimed.
The controlled probe should still compare visual-only and combined conditions.
The following sections retain the earlier learning notes.

Version: `0.25.0-dev.1`. Date: November 13, 2026.

These notes state design intentions and proposed checks.
They do not report measured player understanding.
The current update extends event routing, original score arrangements, and the repair ending.
It retains most existing combat visual cues.

## Constituents, operations, syntax, meaning, and use

| Event family | Constituents | Operations and syntax | Intended meaning | Player use |
|---|---|---|---|---|
| Manual fire | Input, shot, muzzle, short tone | Press or hold Space; shot and cue occur | The player fired | Check aim and shot timing |
| Enemy fire and warning | Source, pattern, warning, filled shot | Warning precedes the scheduled attack; fire follows | A known threat becomes active | Select a response before firing |
| Damage and impact | Hit, hull, ring, sound | Collision result precedes presentation | Damage taken differs from damage dealt | Change position or tactics |
| Klein, projective, periodic joins | Live object, edge rule, mapped position, distinct tone | Approach forecast; actual crossing; continuation | Identity persists under the stated mapping | Predict the return |
| Bolza join | Object, paired letters, transported frame, tone | Actual kernel crossing; mapped continuation | The paired edge changes the local frame | Steer and aim in the new frame |
| Future image | Hollow form, dashed line, conditional forecast | Current motion produces a forecast | The image is not another projectile | Distinguish present danger from prediction |
| Capture | Nearby live threat, input, echo count, inward sound | Successful capture produces the cue | A threat became a stored echo | Acquire a resource deliberately |
| Release | Stored echo, input, outgoing shots, outward sound | Successful release spends the resource | Stored force became an attack | Select a release direction and time |
| Fold and recovery | Actual state, indicator, sound | A recorded state change produces feedback | Speed risk or a recovery interval changed | Choose attack and movement timing |
| Defeat, collection, completion | Boss state, physical pickup, stage state | Defeat precedes collection; extraction banks the reward | These are separate progression states | Reach and extract the reward |
| Final boss phase | Phase number, hull, attack warning, recovery ring | Actual phase change; recovery; warned pattern | Known operations return in a new combination | Prepare for the next attack |
| Repair activation | Three charged circuits, actual operations, route rings, score resolution | Charge the circuits; activate; finish the ending | Learned operations restore a continuous route | Apply earlier rules in a safe setting |
| Adaptive arrangement | Repeated motif, bass, pulse, sparse drone, actual state | Change layers at a beat while effects remain immediate | Spatial context and pressure change | Retain the motif through a different arrangement |

The music and geometry are related artistic structures.
Their operations are not mathematically identical.
The event layer does not change attack time to match a beat.
The finite Bolza collision search remains separate from perceptual tests.

## Structural Disclosure Method

1. Decomposition: identify the live core, forecast outline, edge mark, tone, and action.
2. Representation change: compare the same relationship through motion, sound, and text.
3. Discriminating probes: remove optional sound or effects while retaining essential warnings.
4. Candidate generation: compare short cues that could express the same event.
5. Relationship establishment: check each cue against the actual event and mapping.
6. Disclosure: ask an unfamiliar player to explain the perceived rule.
7. Transfer testing: change the formation and ask the player to predict the same relationship.

Stages 1 and 5 have automated support for this event layer.
The other stages require design comparison or player observation.
No automated test establishes human disclosure or transfer.

Stable route-shot identity now has a simulation regression check.
The repair has automated checks for its actual fold, traversal, capture, and release requirements.
These checks show that the task requires the operations.
They do not show that a player can explain or transfer those rules.
The repair is a separate safe activation sequence.
It is not a substitute for the proposed unfamiliar-player study.

## Proposed player procedure

Use visual-only, combined audiovisual, and decorative-effects-off conditions.
Use auditory-only clips only for a separate recognition probe.
Do not use auditory-only combat as the standard play mode.
The current game exposes no new internal comparison controls.
The Divergent Pulse and operator laboratories remain unimplemented.

Ask the player which projectile can cause damage now.
Ask which image forecasts a future position.
Ask where the live projectile will return.
Ask whether it remains the same object.
Ask the player to identify capture, release, warning, and crossing without text.

Record correct interpretations, missed warnings, false collision expectations, and each presentation condition.
Record reaction time only when a suitable measurement is available.
Repeat the task with a different formation and the same mapping.
Record the participant's prior experience and assistance.

An initial proposed target is 85% correct recognition of critical distinctions.
This target has not been measured or achieved in this candidate.
The audio browser checks confirm source scheduling, context recovery, saved gains, and a muted running view.
The offline renders check finite PCM samples and sample peaks.
Neither check supplies listening judgments or player answers.
See [the QA report](AV-QA-REPORT.md) for executed checks.
See [the imported design PDF](../imports/downloads-2026-11-12/files/Arrow_Space_Shift_Structural_Techno_Cosmism_Design_Bible_v1.pdf)
for the full proposed studies.
