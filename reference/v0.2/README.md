# Foldspace

A separate space-folding prototype for Game Off 2026.
The working title is Foldspace.

Fold space to shorten the route ahead of a spaceship.
Unfold space to restore distance before a threat reaches the ship.
The prototype has a short combat route and a space-only test.
Version 0.2 makes projectiles visibly accelerate inside folds.

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

## First experiment

Select **Test space only**.
Watch the grid and route speed without a fold.
Add a fold.
Observe the compressed grid ahead.
When the ship enters the field, compare route speed with thrust.
Remove the field while the ship is inside it.
Observe the restored distance and route speed.
Hold Space to compare shot travel through folded and open regions.

Then select **Restart**.
Select **Start combat flight** to test the rule with threats.

## Rules and checks

Read [DESIGN.md](DESIGN.md) for the distance rule and scope.
Run `npm test` for the rule checks.
Read [reports/VERIFICATION.md](reports/VERIFICATION.md) for execution evidence.
Read [the creativity review](docs/CREATIVITY-REVIEW-v0.2.md) for the proposed direction and next experiment.

`src/space.js` owns the distance calculation.
`src/simulation.js` owns flight rules.
`src/app.js` owns input, drawing, and interface behavior.
`window.foldspace.read()` returns a copy of selected runtime state.
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

