# Eight scrolling routes

Candidate: Arrow Space Shift 0.10.0.
Date: November 4, 2026.

## Required behavior

All eight levels scroll to a route exit.
Even-numbered levels use the same controls, fold rules, equipment, and damage rules.
They have mostly asteroids and occasional enemies.
They have no target quota or countdown.
Their enemies have less hull and fire less often.
The intended result is less pressure between the main combat routes.
That result still needs player observation.

| Level | Route | Carriers | Asteroids | Length |
|---|---|---:|---:|---:|
| 1 | Two Sides | 12 | 0 | 3,600 |
| 2 | Quiet Belt | 3 | 14 | 2,400 |
| 3 | Counter Cycle | 15 | 0 | 4,200 |
| 4 | Loose Stones | 3 | 16 | 2,800 |
| 5 | Seven Operations | 18 | 0 | 4,800 |
| 6 | Drift Field | 4 | 18 | 3,200 |
| 7 | Front and Back | 21 | 0 | 5,400 |
| 8 | Last Approach | 4 | 20 | 3,600 |

Lengths use route units.
The Klein Fleet battle follows Level 8.
Its edge identifications and retained health remain unchanged.

## Asteroid rules

Player shots and enemy shots damage asteroids.
A normal asteroid has two hull points.
A player receives 10 points for breaking an asteroid.
Enemy fire and ship contact give no points.
Ship contact breaks the asteroid and applies one point of normal hull damage.
Existing temporary hit protection still applies.

A nearer asteroid can block a shot before it reaches a ship.
The collision check compares the path before and after an upgrade operation.
It does not create a collision path across a Position Warp jump.
An asteroid must be drawn in view before it can take damage.

## Run layout and continuation

A new run gets a new layout seed.
The seed controls asteroid positions and enemy positions.
The first carrier on an odd-numbered route stays centered for teaching.
A section retry keeps the seed and restores the same layout.
It also restores the equipment and score checkpoint.
All sections start with full hull.
Progress remains in page memory only.

## Evidence

Node checks cover layout generation, collision order, damage, score, and upgrade paths.
Browser checks cover rendered asteroid destruction by each side and ship contact.
They cover all eight route exits with fixtures near the exit.
They do not establish full-route difficulty or player understanding.
See [the verification report](../reports/VERIFICATION.md) for executed results.
