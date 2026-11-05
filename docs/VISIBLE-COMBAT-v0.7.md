# Visible combat

Candidate: Arrow Space Shift 0.7.0.
Date: November 4, 2026.

## Finding

The player reported defeating enemies they did not see.
Source inspection found two supporting mechanisms.
Automatic aim selected the nearest eligible enemy without a visibility check.
Player shots could remain alive 4,200 route units ahead of the ship.
Drawing had a separate, shorter visible range.
Folded space could also change that range between simulation and drawing.

The report identifies a failure in combat feedback.
It does not establish that every part of the upgrade system has failed.
The current repair preserves the seven operations and changes target access, shot range, and feedback.

## Contract

Space fires straight ahead.
The player aligns the ship with the arrow keys.
Automatic target selection is removed.

The three upgrade combat modes use a shared projection for drawing and combat.
It uses the actual canvas width and height.
The enemy's whole central area must clear the HUD band and the side margins.
An enemy outside that area cannot attack, defend, or receive a shot hit.

Being geometrically inside the view is insufficient.
The renderer must acknowledge that the enemy sprite has been drawn during running play.
After that acknowledgment, the enemy must remain in view for 0.65 seconds.
Its faded sprite, entry label, and progress bar show this entry period.
Its health bar shows when it is active.

A new fold can bring a distant enemy into view.
It cannot also cause an immediate unseen kill.
If unfolding or resizing moves the enemy outside the view, combat eligibility ends immediately.
The enemy must enter again before combat resumes.

Player shots expire outside the visible firing area.
That area includes the ship's firing position but excludes the upper HUD band.
An existing hostile shot keeps its path when its source leaves the view.
The previous hostile-shot cleanup rules remain.
Thus unfolding does not erase a previously fired threat.

Stored enemy damage waits while its target is outside active view.
It resumes when the target is active in view again.
An escaped enemy does not produce a later offscreen kill.
Player damage debt keeps its existing retained consequence.

Each hit creates an effect at the target position.
Each defeat creates a 0.7-second effect and a points label.
Reduced-motion mode uses a fixed effect radius.
Enemy equipment and dropped seeds remain visible under their existing rules.

These changes apply to progression, 3-Paley, and 7-Paley combat.
The older reference route and timing course retain their earlier combat contracts.

## Evidence

Rule checks cover hidden targets, undrawn targets, entry time, three-fold entry, unfolding, re-entry, compact dimensions, and the HUD band.
They also cover straight fire, shot expiry, retained hostile paths, and deferred enemy damage.
Browser checks exercise these cases through the current renderer.
A real Space-key sequence destroys a presented target and produces a visible defeat effect.
The recorded kill identifies both current visibility and prior presentation.

Results: 73 current Node checks and 82 browser checks passed.
See [verification](../reports/VERIFICATION.md) for the executed scope.

## Next observation

Ask the player to identify a target before firing.
Observe whether they can follow the shot, hit, defeat, and seed drop.
Then repeat with a fold and an unfold during the approach.
Check whether the entry period reads as arrival rather than unexplained immunity.
Adjust that presentation or duration if the distinction is unclear.

The checks establish the new visibility rule under the tested conditions.
They do not establish that combat is now satisfying or balanced.
