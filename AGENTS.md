# Project instructions

Apply the user's ASD-STE100 writing requirements.
Keep this game separate from Lamirys and `D:\Projects\game_jam`.
Read `DESIGN.md` before you change a rule.
Keep flight rules in `src/simulation.js`.
Keep upgrade rules and counter graphs in `src/upgrades.js`.
Keep space calculations in `src/space.js`.
Use the same distance calculation for movement and display.
Apply the documented projectile speed gain inside fold fields.
Player shots and enemy shots must use the same gain.
Keep arrow-key ship controls and separate Left Shift/Right Shift fold controls.
Use Left and Right for manual steering in the campaign.
Do not give Up or Down authority over campaign position, thrust, or facing.
Do not replace space compression with a global time multiplier.
Check a fold and its inverse when you change space calculations.
Do not restore lane swaps at ordinary fold seams.
The final boss map uses the user's explicit Klein bottle edge identifications.
Keep edge motion in `src/klein.js` and boss combat in `src/boss.js`.
Keep campaign sections and checkpoints in `src/campaign.js`.
Keep Level 0 before the eight scrolling levels.
Keep panel layout and modal behavior in `src/interface.js`.
Pause play before opening Equipment, Guide, or Options.
Keep accepted side, fold count, and stored damage visible during play.
Keep pixel masters in `art/source/crossing.mjs` and export them with `npm run art:export`.
Keep palette, binary alpha, source dimensions, and manifest identities checked.
Use facing-specific sprite frames instead of flipping the light direction.
Do not change collision or damage rules to fit an art export without a design decision.
Keep the public page inside one viewport, including its status and menu controls.
Keep prototype selection and test controls out of the itch.io package interface.
Keep all eight levels scrolling until the route exit.
Return living route enemies from the bottom to the top with retained health and equipment.
Use Klein bottle edge motion for Stage 7 enemies and for the final boss map.
Do not activate future Stage 7 carriers before the scrolling route reaches them.
Require a new visible entry period after each enemy return.
Use mostly asteroids and occasional enemies in even-numbered levels.
Keep ordinary hull damage active in every level.
Do not add drill timers or target quotas to the campaign.
Allow player shots and enemy shots to break asteroids.
Use a new layout seed for each new run. Preserve it for section retries.
Preserve health, identity, equipment, and relevant velocity across boss wraps.
Check collision paths on both sides of each identified edge.
Keep collision paths split at projectile position warps.
Do not sweep collision checks through a warp jump.
Keep graph properties separate from combat balance claims.
Keep seed handedness fixed during collection.
Apply the side filter to player and enemy operations.
Do not add an operation path across a Position Warp jump.
Keep stored damage as a retained consequence.
Check both equipment orders when operations can change each other's input.
Use `src/combat-view.js` for projection and visible combat eligibility.
Do not aim at or damage an unseen enemy in upgrade combat modes.
Preserve the renderer acknowledgment and visible entry period.
Do not erase an existing enemy shot only because its source leaves the view.
Record AI use and asset sources before publication.
Do not publish or choose a source license without the user's instruction.

