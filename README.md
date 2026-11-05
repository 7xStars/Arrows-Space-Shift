# Arrow Space Shift

A space-folding action game for Game Off 2026.
The game is named Arrow Space Shift.

Source repository: [7xStars/arrow-space-shift](https://github.com/7xStars/arrow-space-shift).

Fold space to shorten the route ahead of a spaceship.
Unfold space to restore distance before a threat reaches the ship.
Version 0.14 starts with Level 0 for sideways movement and firing.
Eight scrolling levels and the Klein bottle boss battle follow it.
Even-numbered levels have mostly asteroids and fewer enemies.
The earlier prototype modes remain available.
Version 0.3's three-encounter timing course remains available.
The earlier combat route and space-only test remain available.

## Run

Install Node.js if it is not available.
From this folder, run:

```powershell
npm start
```

Open <http://127.0.0.1:4177>.
The server accepts local connections only.
No package installation or build step is required.
You need a local server because the browser loads JavaScript modules.

## Controls

| Action | Control |
|---|---|
| Move horizontally | Left/Right arrow keys |
| Up/Down arrow keys | No campaign action |
| Fire | Hold Space |
| Add a fold field | Left Shift only |
| Remove the latest fold field | Right Shift only |
| Pause or resume | P or Escape |
| Retry the current campaign section | Retry section button |
| Return to campaign setup | New run button |

Each Shift press makes one change.
Holding Shift does not add more folds.
WASD and F/V have no gameplay action.
The Fold and Unfold displays are key reminders.
The game does not change operating-system settings.

This control scheme requires a keyboard.
The Fire button can switch continuous firing on or off.

## Campaign

Select **Start campaign**.
Level 0 checks movement with Left and Right.
Then align with the training target.
Hold Space to hit it.
Forward travel is automatic.
Up and Down do not move the ship or change facing.
After the hit, select **Start Level 1**.
Use the arrow keys to align with a visible target.
Space fires in the ship's current direction.
Only the final map's side-edge rule can reverse the player's facing.
The camera scrolls automatically during all eight levels.
Fight along the route until you reach its exit.
Clearing the first group does not finish a route.
Enemies that leave the bottom return at the top with their remaining hull and equipment.
Each return has a new visible-entry period.
Stage 7 carriers use Klein bottle paths and move and fire faster.

| Level | Section | Goal |
|---|---|---|
| 1 | Two Sides | Reach the scrolling route exit. |
| 2 | Quiet Belt | Reach the exit among asteroids and occasional enemies. |
| 3 | Counter Cycle | Reach the scrolling route exit. |
| 4 | Loose Stones | Reach the exit among asteroids and occasional enemies. |
| 5 | Seven Operations | Reach the scrolling route exit. |
| 6 | Drift Field | Reach the exit among asteroids and occasional enemies. |
| 7 | Front and Back | Reach the scrolling route exit. |
| 8 | Last Approach | Reach the exit before the final battle. |

Hits reduce hull normally in every level.
There are no campaign countdowns or target quotas.
Player shots and enemy shots can break asteroids.
Asteroids can block shots before they reach a ship.
Contact with an asteroid damages the ship.
Even-numbered levels have fewer enemies with slower firing intervals.
New runs change asteroid and enemy positions.
A section retry keeps that run's layout.
After the Level 8 exit, select **Enter the final battle**.
The section guide explains the current mechanic.
Section kits supply unlocked seed types.
Defeated enemies also drop their actual equipped seeds.

Equipment and score carry forward.
Each section starts with full hull.
Select **Retry section** to restart only the current section.
Select **New run** to clear campaign progress and return to setup.
Progress lasts until the page is closed or reloaded.

Only the viewport appears on the public game page.
Status and menu controls remain inside it.
Select **Equipment** to change seeds and inspect operation rules.
Select **Guide** for controls, fold readings, and counter graphs.
Select **Options** for sound and restart controls.
Opening a panel pauses play.
Closing it leaves play paused.
Select **Resume flight** to continue.
Retry and New run ask for confirmation after a run starts.

Read [the interface audit](docs/INTERFACE-AUDIT-v0.11.md) for findings and checks.
That audit records the earlier interface. Version 0.12 moves all live content inside the viewport.

## itch.io package

Run `npm run package:itch`.
Use `dist/itch/0.14.0/arrow-space-shift-0.14.0-itch.zip` for the browser upload.
Read [the upload notes](docs/ITCH-UPLOAD.md).
Copy [the page description](docs/ITCH-DESCRIPTION.md) to the itch.io page.
The source is published on GitHub. No itch.io upload or jam submission has been made.
The first pixel-art pipeline has source files, PNGs, an atlas, and runtime checks.
Music, combat SFX production, and human art acceptance remain incomplete.
Read [the pipeline status](reports/PIPELINE-STATUS.md) before treating the package as a finished production build.

The final battle contains a core and two escorts.
They retain their health when they leave the frame.
Destroy all three to finish.

| Edge | Return rule |
|---|---|
| Left or right | Return at the opposite edge with vertical position, vertical velocity, and facing reversed. |
| Top or bottom | Return at the opposite edge with horizontal position unchanged. |

Your ship and shots use the same map.
The edge colors and return markers help show the relationship.
The boss fleet cannot be defeated while unseen.
Read [the current campaign contract](docs/ASTEROID-ROUTES-v0.10.md) for details and test limits.

## Risk and reward

Folding accelerates both sides' projectiles inside the field.
One fold gives twice the visible shot speed.
Overlapping folds multiply this effect.
Your shots reach targets sooner. Incoming shots leave less reaction time.

A kill gives 100 points.
Each fold at the target adds 50 points.
Unfolding slows both sides' shots and removes that field's pending bonus.
Already earned points remain.

## Earlier upgrade experiment

Open <http://127.0.0.1:4177/?lab=1> for local prototype selection and research records.
These controls are absent from the public package menu.

Select **Prototype · 1 → 3 → 7** to play the earlier automatic-flight route.

Select **Start upgrade flight**.
Collect the first right Position Warp seed.
With one fold, it moves a right-side shot to the left.
It ignores a left-side shot.
Unfold to reverse those accepted sides.
A left seed has the opposite rule.
Center shots continue normally.
The operation retains the shot's velocity and damage.
It does not move the ship or send the shot behind it.

Each Shift press reverses the accepted side.
You can keep three folds active.
You can repeat fold and unfold cycles throughout the run.
The timing course retains its original one-field limit.

That prototype route introduces three stages:

| Route position | Stage | Operations |
|---|---|---|
| 0 | Introduction | Position Warp |
| 1,300 | 3-Paley | Position Warp, Vector Lens, Impact Buffer |
| 3,800 | 7-Paley | The first three plus Path Bend, Arrival Delay, Distance Anchor, and Utility Exchange |

Enemies use their upgrades and drop them when defeated.
Seven-stage enemies carry two operations and drop both seeds.
Collected seeds remain in the inventory.
Open **Equipment and collected seeds** to change equipment.
Select a slot before selecting a seed.
Slot 1 acts before Slot 2.
The second slot opens in the seven-operation stage.
You can equip each operation once.

Space fires straight ahead.
Use the arrow keys to align with a visible enemy.
Enemies enter visibly before they can attack or receive damage.
An entering enemy becomes active after 0.65 seconds in view.
Player shots expire when they leave the visible firing area.
Existing enemy shots keep their paths.
Hits and defeats have effects at the enemy position.
Read [the visible combat change](docs/VISIBLE-COMBAT-v0.7.md) for the rule and checked limits.
Counter shots pass the opposing operation without a damage increase.
The three-operation cycle is Position Warp → Vector Lens → Impact Buffer → Position Warp.
The seven-operation graph gives every pair an outside counter.
The runtime checks cover that bypass rule, not overall combat balance.

Select **Position warp lab** for repeated shots and both handed seed variants.
Select **Start at 3-Paley** or **Start at 7-Paley** to test a later stage directly.
Read [the current operation contract](docs/UPGRADE-OPERATIONS-v0.6.md) for all seven effects and the next playtest.

## Timing course

Select **Timing course** in Flight mode.
Choose whether the fold score bonus is on or off.
Start the first encounter.
Each attempt has a two-second launch countdown.
The game clock stays at zero during that countdown.
You can prepare a fold during it.

1. Hit a target during its visible opening.
2. Avoid a wide salvo after starting inside a folded field.
3. Hit a target, then avoid the guard salvo that the hit triggers.

Only one field can be active in this course.
The target ring and timer show its opening.
The salvo band shows the area to avoid.
The third encounter leaves the choice of operation to you.
Select **Retry encounter** after a failure.
Select the next encounter after a success.
Select **Restart** to return to the first encounter and change the setup.

The score option stays fixed throughout a course.
It changes points only.
For a comparison, repeat the course with the other setting.
Repeated exposure can change performance. Record it in the playtest notes.

Open **Playtest notes and results** to record a prediction and an explanation.
Select **Save test results** to download local JSON evidence.
It includes the mode, score setting, actions, outcomes, and separate notes.
The app does not upload these records.
The results remain in memory until the page is closed or reloaded.

Read [the playtest protocol](docs/PLAYTEST-PROTOCOL.md) before using the records as research evidence.

## Other modes

Select **Reference route** for the original three-fold combat route.
Select **Space-only test** for travel without enemies.

The unchanged v0.2, v0.3, v0.5, and v0.7 sources are in `reference/`.
Open <http://127.0.0.1:4177/reference/v0.3/> to play the timing reference.
The v0.2 reference retains the old title.

## Space-only experiment

Select **Test space only**.
Watch the grid and route speed without a fold.
Add a fold.
Observe the compressed grid ahead.
When the ship enters the field, compare route speed with thrust.
Remove the field while the ship is inside it.
Observe the restored distance and route speed.
Hold Space to compare shot travel through folded and open regions.

Then select **Restart**.
Select **Start reference route** to test the rule with threats.

## Rules and checks

Read [DESIGN.md](DESIGN.md) for the distance rule and scope.
Run `npm test` for the rule checks.
Read [reports/VERIFICATION.md](reports/VERIFICATION.md) for execution evidence.
Read [the creativity review](docs/CREATIVITY-REVIEW-v0.2.md) for the proposed direction and next experiment.

`src/space.js` owns the distance calculation.
`src/simulation.js` owns flight rules.
`src/upgrades.js` owns upgrade rules and the proposed counter graphs.
`src/app.js` owns input, drawing, and interface behavior.
`src/campaign.js` owns campaign sections, waves, kits, and checkpoints.
`src/boss.js` owns the final battle loop.
`src/klein.js` owns edge movement and collision paths.
`window.arrowSpaceShift.read()` returns a copy of selected runtime state.
`window.arrowSpaceShift.results()` returns the recorded attempts.
The `?test=1` URL enables a deterministic browser fixture.
Only that fixture exposes manual simulation advancement.

## Game Off submission

Theme: SHIFT.
Deadline: December 1, 2026, at 13:37 Pacific / 16:37 Eastern.
AI-assisted code and assets are permitted with disclosure.
The host requires source code in a public GitHub repository.
The playable game must also be submitted on itch.io.
Public source: [7xStars/arrow-space-shift](https://github.com/7xStars/arrow-space-shift).
The itch.io upload and jam submission remain open.

Sources: [event page](https://itch.io/jam/game-off-2026), [host FAQ](https://itch.io/jam/game-off-2026/topic/7290154/frequently-asked-questions-faq).

## Sources and rights

The game uses the AI-assisted Crossing pixel set.
The procedural vector renderer remains as a loading-failure fallback.
Run `npm run art:export` to regenerate the PNGs and atlas.
Read [the asset contract](art/ASSET-CONTRACT.md) and [the generation record](art/GENERATION-RECORD.md).
Its optional tones use browser oscillators.
The runtime includes project-authored PNGs.
Reference sheets, fonts, music recordings, samples, and external runtime libraries are not included.
The system supplies the fonts.
AI assisted the design, code, documentation, and checks.
No Lamirys source files or assets were copied.
The relation to Lamirys is the distinction between an inverse operation and full state recovery.

The source license remains undecided.
Choose it before public source publication.
Recheck asset rights if production assets are added.

