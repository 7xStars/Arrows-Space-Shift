# Final repair contract

ID: ASS-REPAIR-001. Version: 1.0.
Candidate: `0.25.0-dev.1`. Date: November 13, 2026.
Modes: Design, then Engineering.

## Intent and scope

The final component must be physically collected and extracted.
The dock then checks all four banked parts.
Assembly permits a safe playable activation test.
Successful charge delivery activates the drive.
An eight-second ending precedes saved campaign completion.
Replay preserves completed campaign progress.

The dock is separate from combat.
It does not consume campaign hull, equipment, score, or parts.
It does not change the original scrolling controls or combat rules.
The selected ship's lateral speed applies in the dock.
The dock launcher has a fixed diagonal direction during the return circuit.
Its direction is shown on the ship and explained in Guide.

## Persistent state

`src/journey.js` owns `arrow-space-shift:journey:v1`.
The earlier fleet, section, and Act IV keys remain separate.

| Field | Required meaning |
|---|---|
| `parts` | Validated banked receipts, indexed by stable part ID |
| `actFourBridge` | Copied ship, seed, score, echoes, inventory, and equipped-key metadata |
| `assembled` | All four banked parts passed the assembly check |
| `activated` | Three real charge deliveries completed the repair test |
| `completed` | The activated ending reached its end |
| `endingSeen` | Completion includes the ending |

The required IDs are `klein-relay`, `projective-module`, `curvature-seed`, and `hyperbolic-core`.
New main-campaign receipts use source `campaign-extraction` and chapters 8, 17, and 26 respectively.
Old banked parts use source `legacy-banked`.
Their unknown seed, ship, and score remain null.
Migration does not invent a past encounter record.
A new actual receipt can replace legacy metadata.
Actual receipts retain their first recorded provenance.

The final receipt requires `id: 'hyperbolic-core'`, `source: 'double-torus'`, `stage: 8`, and all three flags `exposed`, `collected`, and `extracted` set to true.
It also requires valid seed, ship ID, and score fields.
Boss defeat alone does not satisfy this contract.
Partial receipt data does not bank a part after reload.
Receipt checks validate structure and declared provenance.
They are not an anti-cheat system.

## Playable repair

| Circuit | Real operation | Success condition | Discriminating case |
|---|---|---|---|
| Distance | `space.js` distance metric and projectile gain | A charge reaches the left receiver within its 1.2-second lifetime | The unfolded charge fades before arrival |
| Return | `traceKlein` position and velocity transport | A manually fired signal crosses the side join and reaches the receiver | Firing from the wrong lateral position misses |
| Echo | Proximity capture and finite stored charge | The player captures a falling physical charge, changes position, and releases into the echo receiver | Fire without a stored echo does not charge it |

The circuit advances after physical signal arrival.
Key presses alone do not advance it.
The collision test uses the separate path segments returned by the Klein trace.
It does not sweep a collision through a join jump.
Displayed distance uses the same fold metric as the signal's route.
Each success leaves its cause below the field.
All signals have filled cores.
No future-image collider is created.

The final scene uses an actual distance calculation for the opening route.
Reduced motion preserves a static route image and completion text.
It removes optional ending motion.
No screen flashing is added.
Music and effects follow saved preferences.
They do not control repair timing.
Guide provides separate master, music, effects, and ambience controls.
An intentional control gesture can resume a suspended audio context.
Confirmed repair events are `launch`, `player-fire`, `fold`, `unfold`, `klein-crossing`, `echo-captured`, `echo-released`, `chapter-cleared`, `drive-activated`, and `won`.
Crossing events follow the actual trace and retain the supplied shot ID.
Circuit-clear events follow receiver contact.
The activation event follows all three deliveries.
The final `won` event follows the ending clock.

## Interruption and recovery

Pause stops all repair clocks and commands.
Guide opens a native modal dialog and pauses play.
Closing Guide leaves play paused.
Focus loss and hidden-page state pause play.
Retry resets the safe repair attempt.
It does not erase banked parts or an earlier completed ending.
Reload after activation can replay the ending from its beginning.
Completion is not saved until the ending reaches its end.
Storage failures produce a visible Save again action.
The prior storage value remains available if Web Storage rejects a replacement.
The dock runs progress-import recovery before reading saved state.

## Evidence and limits

Rule tests distinguish unfolded failure from folded arrival.
They exercise ordinary steering, manual fire, the real Klein crossing, capture, release, and the ending.
Journey tests cover partial extraction, receipts, assembly gates, save compatibility, and failed writes.
The November 13 local headless Edge repair check passed 14 checks.
It used an existing valid four-part save and actual keyboard input.
It delivered all three charges, reloaded after activation, completed the visible ending, and checked completion after another reload.
It checked the main title's completion indication.
It checked the dock at 390 by 844 and 320 by 568 CSS pixels.
It recorded no page exception or failed resource request.
The retained report is [repair-browser/results.json](../reports/completion-0.25.0-dev.1/repair-browser/results.json).
This fixture does not establish ordinary fresh-campaign completion or final-boss combat.
Unit tests, browser checks, and human observations remain separate evidence.

The Structural Disclosure skill informed the discriminating tasks and retained causes.
The full FA-002 research paper was not supplied.
Successful automated repair does not establish human understanding or transfer.
No player recognition rate is claimed.
This contract does not resolve the main campaign's collision, fairness, or complete-route acceptance limits.
