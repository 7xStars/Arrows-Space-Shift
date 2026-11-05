# Scrolling campaign and timed drills

Historical record. Version 0.10 removes the drills and scrolls all eight levels.
See [the current campaign contract](ASTEROID-ROUTES-v0.10.md).

Candidate: Arrow Space Shift 0.9.0.
Date: November 4, 2026.

## User corrections

The fixed arenas removed the scrolling flight the player wanted.
Restore it for the main combat sections.
Number the teaching and practice sections as eight levels.
Apply normal hull damage and time limits in Levels 2, 4, and 6.
Preserve the upgrades, visibility rule, equipment order, checkpoints, and final boss map.

Level 8 remains open practice because the latest damage and deadline correction named only Levels 2, 4, and 6.

## Current sequence

| Level | Type | Goal |
|---|---|---|
| 1: Two Sides | Scrolling route | Reach 3,600 route units through 12 carriers. |
| 2: Side Drill | Timed combat | Defeat 4 targets within 30 seconds. |
| 3: Counter Cycle | Scrolling route | Reach 4,200 route units through 15 carriers. |
| 4: Counter Drill | Timed combat | Defeat 6 targets within 35 seconds. |
| 5: Seven Operations | Scrolling route | Reach 4,800 route units through 18 carriers. |
| 6: Order Drill | Timed combat | Defeat 9 targets within 45 seconds. |
| 7: Front and Back | Scrolling route | Reach 5,400 route units through 21 moving carriers. |
| 8: Front and Back Practice | Open practice | Prepare for the final battle without a deadline or hull loss. |
| Final battle | Klein bottle map | Destroy the persistent core and both escorts. |

## Scrolling flight

The camera advances automatically by 90 distance units per second through the fold metric.
Its route coordinate therefore advances faster inside compressed space.
The ship moves with the camera while retaining its local screen position.
Arrow input changes that local position.
Up and Down retain their facing rule.
The player can still fire toward the back while the route moves forward.

Enemy positions belong to the route.
Their positions are not clamped back into a stationary arena.
Carriers extend from the opening approach to 80 units before the exit.
Passed carriers become escaped actors without producing kills or drops.
They cannot stall completion.
The player finishes by reaching the route exit.
An early kill or cleared opening group cannot finish the route.

The renderer and combat still use the same camera and fold-distance projection.
An enemy must be drawn and complete its entry period before combat.
Player shots remain limited to the visible firing area.
Existing enemy shots are not erased only because their source passes behind the camera.
Ordinary cleanup removes shots and drops after they have passed the local flight area.

## Timed drills

Levels 2, 4, and 6 use their existing bounded target arenas.
Enemy shots and ship contact reduce hull normally.
The player has five hull points at section entry.
There is no practice immunity in these three levels.
The timer begins when the section starts.
Pause and focus loss stop simulation time and the countdown.

Defeated targets count toward the stated quota.
Another group appears if more targets are required.
The quota must be reached before the timer expires.
If it is reached in time, pending player damage must still settle before the clear.
If the player loses all hull or misses the quota deadline, the section fails.
The failure screen states the reason.

Retry restores the drill checkpoint, full hull, zero target count, and the full timer.
Earlier completed levels remain available in the current campaign state.
There is no Continue button that bypasses an active drill.

## Retained continuation

Equipment and score carry between sections.
Each section still starts with full hull and no active fields or shots.
Training kits and actual enemy equipment drops remain.
The final battle follows Level 8.
Its edge map, persistent enemy health, projectile wrapping, and victory condition are unchanged.
Progress remains in page memory only.

## Evidence and limits

Node checks cover automatic camera movement, fold-dependent route progress, end-of-route completion, and passed carriers.
They cover damage, deadline failure, quota success, pause, and retry in each timed drill.
The open-practice exception is checked separately for Level 8.
Existing Klein bottle and upgrade checks remain.

The browser suite verifies a normal-health kill during actual scrolling fire.
It checks all eight numbered levels, drill damage, deadline failure, and the final battle.
Route-transition fixtures begin near the exit.
Quota and ending fixtures prepare one-hit targets.
Those cases verify transitions and feedback, not normal-health difficulty.

No human completed the revised campaign during this change.
The quotas and deadlines remain proposed tuning values.
The next playtest should judge route pacing and whether the drills provide useful pressure.
See [verification](../reports/VERIFICATION.md) for executed results.
