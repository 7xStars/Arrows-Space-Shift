# Arrow Space Shift 0.20.3 — Klein Relay traversal correction

**Scope:** post-Act-I Klein traversal only. Act I's original stage definitions, controls, shooting, difficulty, and Klein Fleet encounter remain unchanged.

## What was wrong in 0.20.2

Following Klein Relay acquisition, crossing the left/right seam reflected the ship's longitudinal physical coordinate without transporting the ship-facing and local camera frame together. The ship could appear in the upper half of the display or seem not to have undergone the same reversal as the Klein Fleet.

## New behavior

- **Player movement on the Klein surface:** crossing either side seam reverses the physical longitudinal coordinate and heading according to the Klein identification. The local camera frame follows the ship's transported direction, so the on-screen gun continues pointing up rather than flipping down.
- **Vertical limits:** the entire player ship stays in the lower half of the playable view; Up stops at the halfway boundary (with sprite margin), Down stops at the bottom. Holding Down never reverses the level scroll.
- **Continuing stage progression:** the physical camera origin and the authored route-progress coordinate are independent. Existing and future waves continue to spawn and advance correctly after repeated side joins.
- **Projectiles and other objects:** the active view and shot direction transform with the surface; player shots continue in screen-forward direction; existing enemy and projectile identities remain intact; collision paths are segmented at seams to avoid false hits through the middle of the screen.
- **Existing systems:** folds, manual firing, pickups, stage scoring, save data, and Act I rules are preserved.

## Verification

- `npm run check` — **35 of 35 automated tests passed**, including seven new Klein movement and progression regression tests.
- Directed simulations checked left/right crossing, repeated crossing, both vertical movement limits, forward firing after reversal, future enemy waves, and Act I input compatibility.
- Local HTTP startup returned 200 OK. This environment did not permit a successful Chromium screenshot; an ordinary browser playtest is still required.

## Release status

0.20.3 is a **downloadable development candidate**, not a deployment to the existing ChatGPT Sites project. It should be merged with the exact live source before publication; the current candidate still contains the experimental hybrid boss geometry rather than a verified connected-sum model.
