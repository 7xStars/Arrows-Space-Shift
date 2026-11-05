# Arrow Space Shift: prototype contract

Version: 0.7.0. Date: November 4, 2026.

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

Constituents: ship, route, fold fields, enemy ships, shots, upgrade seeds, gates, and an exit.
Operations: steer, change thrust, fire, fold, unfold, pause, and restart.
Standards: a fold must change distance and travel time at constant thrust.
Preservation: unfolding restores the distance rule. It does not reverse time or restore destroyed enemies.
Continuation: the ship retains its position, damage, and shots when a field is removed.

The distance field varies along the route axis.
There is no automatic ship lane swap.
It does not simulate paper, origami layers, or general relativity.
General rotated folds remain outside scope.
Free inverse operations do not, by themselves, make operations commute.

## Distance rule

Route coordinate `z` identifies a point in the unfolded route.
Each field starts 120 route units ahead of the ship.
Each field covers 1,200 route units.
Within that interval, the field multiplies distance by 0.5.
Overlapping fields multiply their effects.
All modes except the timing course permit three active fields.
The timing course retains its one-field limit.
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

## Upgrade flight and Position Warp

Upgrade flight is the default mode in version 0.6.
It progresses from one operation to three, then seven.
The stages begin at route positions 0, 1,300, and 3,800.
Only the current stage's enemies can attack or receive damage.
Modes also permit a direct start at the three-operation or seven-operation stage.

The introduction uses Position Warp.
The three-operation stage adds Vector Lens and Impact Buffer.
The seven-operation stage adds Path Bend, Arrival Delay, Distance Anchor, and Utility Exchange.
All seven operations have runtime behavior.
The seven-operation stage opens a second equipment slot.
Slot 1 acts before Slot 2.
An earlier operation can change the side accepted by the next one.

Every carrier uses its equipped operations on incoming player shots.
Its outgoing shots carry the identities of those operations.
Defeating a carrier drops its actual equipped seeds.
Seven-stage carriers have two different operations and drop both seeds.
The ship collects seeds within 28 distance units.
Collection needs no separate button.
Collected seeds remain in inventory until Restart.
Equipment buttons select a slot and a collected seed.
Only one copy of an operation can be equipped, regardless of handedness.
Empty slots fill first. A new handed variant replaces the equipped variant of that operation.
Other pickups replace the selected slot when all slots are occupied.

Each seed has fixed left or right handedness.
Collection does not store the current fold state.
With zero or two active folds, a seed accepts shots from the opposite side to its name.
With one or three active folds, it accepts shots from its named side.
Each successful fold or unfold therefore reverses the accepted side.
The count includes fields behind the ship until they are removed.
The local speed factor still depends on the field's position.
Fold and unfold cycles have no lifetime limit.
Only three fields can be active at once.

Position Warp acts at an entry plane 140 displayed distance units ahead of the actor.
The actor must accept the shot's lateral side at that entry.
Shots within eight lateral units of the center pass without an operation.
Shots from the other side also pass normally.
A matching Position Warp changes relative lateral position from `x` to `-x`.
It preserves forward position, radial distance, base velocity, ownership, and contact damage.
It does not rotate the shot behind the ship.
Collision checks cover the approach and the departure separately.
There is no collision path across the instantaneous jump.
Each shot crosses an actor's operation entry once.
Changing space after that entry does not recapture the shot.

The lab supplies alternating incoming shots and a new seed every six seconds.
It includes both handed variants.
It has no enemies or gates.
The combat route retains gates and equipped enemies.
Space fires straight ahead in every mode.
The player uses the arrow keys to align with an enemy.
In progression, 3-Paley, and 7-Paley modes, an enemy must be visible before combat.
The renderer first records that its sprite has been drawn.
It then needs 0.65 seconds in view before it can attack, defend, or receive damage.
An entering enemy has a faded sprite and an entry indicator.
An active enemy has a health bar.
An enemy outside the view cannot receive damage, including stored damage.
Stored enemy damage waits until its target is active in view again.
An escaped enemy cannot produce a delayed offscreen kill.
Player damage debt retains its existing timing and route-completion rule.

Drawing and combat use the same projection and current canvas dimensions.
Enemy visibility excludes the HUD band and clipped side edges.
Player shots expire outside the visible firing area.
Existing enemy shots retain their path until the usual cleanup conditions apply.
A fold cannot reveal and destroy an undrawn enemy in one simulation step.
Unfolding an enemy out of view removes its combat eligibility immediately.
Re-entry requires another visible entry period.
Visible hits have a short effect.
Defeats have a longer effect and a points label at the enemy position.
These rules do not apply to the unchanged timing course and reference route.
See [the visibility repair](docs/VISIBLE-COMBAT-v0.7.md) for evidence and limits.

The three-operation counter cycle is Position Warp → Vector Lens → Impact Buffer → Position Warp.
The seven-operation graph uses `a counters b` when `(b - a) mod 7` is in `{1, 2, 4}`.
An incoming shot that carries a counter identity passes the corresponding opposing operation.
This does not increase its damage or remove the shot.
Both player and enemy operations use this rule.
A pair's common counter can pass both operations.
Other shots still follow side eligibility and equipment order.
The interface shows each counter result during combat.
These are authored rules, not claims of general combat balance.

Impact Buffer delays a contact consequence by 0.8 seconds.
It retains the complete damage as a visible debt.
Temporary hit protection does not erase stored damage.
Pending debt is settled before route completion.
Arrival Delay instead holds the shot for 0.65 seconds.
A held shot can still cause contact damage.
Utility Exchange halves shot velocity and doubles its damage.
It advances the receiving actor's next firing opportunity by 0.12 seconds.
It creates time at the cost of a heavier retained threat.

Read [the current upgrade contract](docs/UPGRADE-OPERATIONS-v0.6.md) for all effects, tests, and limits.

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
The unchanged v0.3 source is preserved in `reference/v0.3/`.
The earlier upgrade experiment is preserved in `reference/v0.5/`.
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

The next player question is: does the planned route change the preferred seed, fold timing, or equipment order?
Compare routes that need left and right movement.
Do not retain a side choice if both sides have the same useful continuation.
Test each proposed counter in a defined encounter before implementing the full graph.

