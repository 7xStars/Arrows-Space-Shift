# Arrow Space Shift: prototype contract

Version: 0.3.0. Date: November 4, 2026.

## Intent

The player changes space to control travel time.
The ship keeps its thrust when the route contracts.
Nearby threats become closer too.
The player can unfold space to get more room before a threat arrives.

This is a separate Game Off 2026 prototype.
The game is named Arrow Space Shift.
The jam theme is SHIFT.
The current thatgamejam entry remains in `D:\Projects\game_jam`.
Lamirys remains in its existing project folder.

## First experiment

Constituents: ship, route, fold fields, enemy ships, shots, gates, and an exit.
Operations: steer, change thrust, fire, fold, unfold, pause, and restart.
Standards: a fold must change distance and travel time at constant thrust.
Preservation: unfolding restores the distance rule. It does not reverse time or restore destroyed enemies.
Continuation: the ship retains its position, damage, and shots when a field is removed.

The prototype uses one spatial axis for folds.
It does not simulate paper, origami layers, or general relativity.
It does not yet test order-dependent folds on different axes.
Free inverse operations do not, by themselves, make operations commute.

## Distance rule

Route coordinate `z` identifies a point in the unfolded route.
Each fold field starts 120 route units ahead of the ship.
The field covers 1,200 route units.
Within that interval, the field multiplies distance by 0.5.
Overlapping fields multiply their effects.
The reference route and space-only mode permit three fields.
The timing course permits one active field.
Fields remain fixed in route coordinates.
Left Shift adds a field. Right Shift removes the latest field.
Each press makes one change. Holding a Shift key does not repeat it.

The local distance factor is `m(z)`.
Display distance between two points is the integral of `m(z)` between those points.
The ship advances by its thrust distance through this distance function.
The ship's base thrust is 90 distance units per second.
Shots also gain speed inside a fold.
Their movement uses the squared distance factor, `m(z)^2`.
Their display still uses `m(z)`.
Thus one fold doubles their visible speed inside the field.
Two overlapping folds give four times the speed. Three give eight times the speed.
This rule applies equally to player shots and enemy shots.
It is an authored game rule, not a physical model.
Unfolding immediately restores the corresponding shot speed.
Shot trails show the local speed increase.
Fold boundaries are crossed exactly within each simulation step.
The game clock, firing intervals, and enemy firing clocks do not speed up.

Folding can bring a gate or a shot closer immediately.
The ship speeds up in route coordinates when it reaches a compressed field.
Unfolding a field behind the ship has no effect on its local speed.
The speed display reports the factor at the ship, not the number of fields.

## Flight rules

The ship advances along an 8,400-unit route.
Left/Right steer across the route.
Up/Down increase or reduce thrust while held.
Space fires. The Fire button can hold fire on.
A gate damages the ship if it crosses outside the opening.
Enemy shots and ship contact can damage the ship.
The ship starts with five hull points.
After a hit, it has 1.4 seconds of protection.
Zero hull points ends the flight.
Reaching the exit completes the flight.
The space-only mode has no enemies or gates.

Only the arrow keys control ship movement and thrust.
Only Left Shift folds space. Only Right Shift unfolds space.
WASD and F/V have no gameplay action.
Pointer dragging does not steer the ship.
The Fold and Unfold displays are key reminders, not buttons.
Each Shift press makes one change. Holding it does not repeat the change.
The app does not change Windows Sticky Keys settings.
Focus loss and a hidden tab pause the flight.
Resume requires a deliberate action.
Restart clears fields, shots, damage, score, and elapsed time.

## Combat tradeoff

Folding makes outgoing shots faster and brings targets closer.
It also makes incoming fire faster and brings hazards closer.
Unfolding gives more reaction time but slows outgoing shots.
No shot damage or past movement is reversed.

A normal kill gives 100 points.
The fold score bonus can be disabled before a run.
This option changes points only.
It remains fixed until Restart returns the game to setup.
Each active fold at the target adds 50 points to that kill.
The bonus is 50, 100, or 150 points for one, two, or three overlapping folds.
The target must still be inside the fold when it is destroyed.
Unfolding before the hit removes that field's pending bonus.
Already earned points remain.
The interface shows the cumulative fold bonus.

This creates a timing choice: keep the field for shot speed and points, or remove it to get more reaction time.
The quality of that choice still needs player observation.

## Timing course

The course has three short encounters.
Each starts from its own defined state.
Progression requires a successful result.
A failed encounter can be retried without repeating earlier encounters.
Restart returns to encounter 1 and unlocks the setup controls.

Each encounter starts with a two-second launch countdown.
Simulation time and movement remain at zero during it.
Fold input is available during the countdown.
Pause and focus loss stop the countdown too.
The countdown is excluded from the reported encounter time.

### Hit the opening

The ship starts at route position 0.
A target at position 1,000 has a shield.
The target opens at simulation time 0.55 seconds.
It closes at 1.20 seconds.
Shots that hit a closed shield are removed.
A successful hit clears the encounter.
The target's ring, label, and timer communicate its state.
At normal shot speed, an immediate shot arrives too late.
A folded shot can reach the opening.
Holding fire without folding does not clear this fixture.

### Make room to escape

The ship starts inside a fold from position 0 to 1,200.
A wide salvo starts at position 500.
It covers 220 lateral units on either side of its center.
The ship must clear the band before contact.
Losing one hull point fails the encounter.
Passing the salvo without damage clears it.
The starting fold and the salvo are visible during the countdown.

### Hit, then escape

The target and opening use the first encounter's values.
A target hit triggers one guard salvo 360 route units ahead of the ship.
The salvo is centered on the ship's lane at that instant.
It does not follow the ship afterward.
A dashed preview shows the guard's aim before the hit.
The player must hit the target and avoid the salvo.
The brief states these goals without giving the operation sequence.
Keeping the field open misses the target in the checked cases.
Keeping it folded causes a hit in the checked escape cases.
Folding for the outgoing hit, then unfolding and steering, clears the fixture.

These are results for the checked fixtures and input policies.
They do not establish an optimal policy for all possible player behavior.

### Comparison and records

Run the same course with the score bonus on and off.
Movement, fields, clocks, targets, and hazards remain equal.
Record familiarity and assistance when interpreting a comparison.
The app keeps attempt records in page memory.
The local JSON export includes actions, times, score settings, outcomes, and separate notes.
The prediction is captured when the attempt starts.
The explanation is entered after the attempt.
No player observation is inferred from an automated record.

The unchanged v0.2 source is preserved in `reference/v0.2/`.
The current reference route also remains available as a mode.

## Screen plan

The flight field is the main view.
A narrow left panel gives the mission and controls.
A narrow right panel reports the distance rule and fold stack.
On a small screen, these panels follow the flight field.

Palette: space `#101c35`, panel `#172944`, text `#eaf2ff`, fold `#b8a6ed`, ship `#7ae8e0`, threat `#ffb8a0`.
Type: Bahnschrift for headings, Segoe UI for controls and body text.
Use system fonts. Do not download fonts.
The grid is part of the mechanic. Its spacing shows route compression.
Keep the other interface elements quiet.

Review: a generic speed slider would hide the spatial rule.
The prototype instead draws every gate, shot, star, and grid line through the same distance map.

## Evidence and next decision

Check distance integration, boundary crossing, inverse fields, hit detection, reset, and pause.
Use real left/right Shift key events in a browser check.
Check desktop and compact screens.
These checks do not establish player understanding or physical-device behavior.

The next player question is: can the player use the first two lessons to resolve the combined encounter?
After that check, compare a fixed field with a field carried by the ship.
Add transverse folds only if the first distance rule is useful during play.

