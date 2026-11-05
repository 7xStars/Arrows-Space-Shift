# Arrow Space Shift

A separate space-folding prototype for Game Off 2026.
The game is named Arrow Space Shift.

Fold space to shorten the route ahead of a spaceship.
Unfold space to restore distance before a threat reaches the ship.
Version 0.5 removes lane swapping and adds a Position Warp upgrade test.
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
| Steer | Left/Right arrow keys |
| Increase or reduce thrust | Up/Down arrow keys |
| Fire | Hold Space |
| Add a fold field | Left Shift only |
| Remove the latest fold field | Right Shift only |
| Pause or resume | P or Escape |
| Restart | Restart button |

Each Shift press makes one change.
Holding Shift does not add more folds.
WASD and F/V have no gameplay action.
The Fold and Unfold displays are key reminders.
The game does not change operating-system settings.

This control scheme requires a keyboard.
The Fire button can switch continuous firing on or off.

## Risk and reward

Folding accelerates both sides' projectiles inside the field.
One fold gives twice the visible shot speed.
Overlapping folds multiply this effect.
Your shots reach targets sooner. Incoming shots leave less reaction time.

A kill gives 100 points.
Each fold at the target adds 50 points.
Unfolding slows both sides' shots and removes that field's pending bonus.
Already earned points remain.

## Upgrade experiment

Select **Start upgrade flight**.
Destroy the first enemy.
Collect its Position Warp seed.
The seed stores the fold state at collection.
The upgrade moves incoming shots around the ship.
The shots retain their velocity and remain hostile.
Shift changes the active warp side.
The ship does not swap lanes.

For a simpler comparison, select **Position warp lab** before launch.
Collect the seed without folding.
Then press Left Shift.
The warp side is left.
Restart the lab.
This time, press Left Shift before collection.
The warp side is right.
Both sequences finish with one fold.

The stored state links the chosen warp side to the fold's speed tradeoff.
It remains until another seed replaces it.
The experiment tests whether that link improves route choices.
It has not been evaluated by players.

Open **Upgrade counter graphs · design targets** to inspect the proposed upgrade set.
The first graph has three operations.
The second graph extends it to seven operations.
Only Position Warp is playable.
The graph checks do not establish combat balance.
Read [the experiment record](docs/UPGRADE-EXPERIMENT-v0.5.md) for the rules and next tests.

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

The unchanged v0.2 and v0.3 sources are in `reference/`.
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
No public repository or jam submission has been created by this task.

Sources: [event page](https://itch.io/jam/game-off-2026), [host FAQ](https://itch.io/jam/game-off-2026/topic/7290154/frequently-asked-questions-faq).

## Sources and rights

The prototype uses original procedural vector graphics.
Its optional tones use browser oscillators.
No external images, fonts, music, samples, or runtime libraries are included.
The system supplies the fonts.
AI assisted the design, code, documentation, and checks.
No Lamirys source files or assets were copied.
The relation to Lamirys is the distinction between an inverse operation and full state recovery.

The source license remains undecided.
Choose it before public source publication.
Recheck asset rights if production assets are added.

