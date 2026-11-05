# Arrow Space Shift: game contract

Version: 0.14.0. Date: November 4, 2026.

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
There is no lane swap at an ordinary fold seam.
The final boss arena has the explicit edge identifications defined below.
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

## Campaign

The campaign is the default mode.
Level 0 teaches movement and firing before the eight routes.
Its camera does not scroll.
The player must move at least 24 distance units to the left and to the right.
It then supplies one training target.
That target does not fire or cause contact damage.
It follows the normal visible-entry rule before it can take a shot.
Hitting the target completes Level 0.
Left Shift gives an explanation during Level 0. Folding starts in Level 1.
This lesson has no deadline.
It contains eight numbered levels followed by a separate final boss battle.
All eight levels are scrolling combat routes.
They end when the ship reaches the route exit.
Defeating an opening group does not finish a route.
Living carriers that pass the bottom return at the top.
They retain their identity, hull, equipment, and firing clock.
Returning does not count as a defeat or create a seed drop.
They cannot block a route exit.
Even-numbered levels have mostly asteroids and occasional enemies.
All levels use ordinary hull damage.
There are no campaign deadlines or target quotas.
The player chooses when to continue after a clear.

| Section | Purpose |
|---|---|
| Level 1: Two Sides | Move, align shots, and use directional Position Warp. |
| Level 2: Quiet Belt | Reach the exit among asteroids and occasional enemies. |
| Level 3: Counter Cycle | Follow a scrolling route with the three-operation counter cycle. |
| Level 4: Loose Stones | Use the three-operation set with less incoming fire. |
| Level 5: Seven Operations | Follow a scrolling route with all seven operations and two slots. |
| Level 6: Drift Field | Try equipment orders among asteroids and occasional enemies. |
| Level 7: Front and Back | Fight faster carriers that use Klein bottle edge paths along the scrolling route. |
| Level 8: Last Approach | Reach the exit through the final asteroid belt. |
| Final battle: The Klein Fleet | Destroy a persistent core and two escorts on a Klein bottle map. |

All eight routes scroll automatically at 90 distance units per second.
The camera moves through the same fold metric as the ship.
Folding can therefore increase route progress at equal elapsed time.
The ship keeps its forward position relative to the camera.
Left and Right steer sideways.
Up and Down do not change position, thrust, or facing.
The route controls forward travel.
Folding and unfolding change distance without a manual speed control.
Space fires straight in the current facing direction.
Left Shift adds a fold ahead of that facing.
Right Shift removes the latest fold.
The existing distance and projectile-speed rules remain.
The final boss retains its bounded arena camera.
The reference modes retain their original automatic forward flight.

Odd-numbered route lengths are 3,600, 4,200, 4,800, and 5,400 route units.
They contain 12, 15, 18, and 21 carriers respectively.
Even-numbered route lengths are 2,400, 2,800, 3,200, and 3,600 route units.
They contain 3, 3, 4, and 4 carriers and 14, 16, 18, and 20 asteroids respectively.
Even-numbered carriers have one hull point and fire less often.
New runs change asteroid and enemy positions.
The first carrier on each odd-numbered route stays centered for the introduction.
Section retries retain the run seed and restore the same layout.
Carriers are placed through to 80 units before the exit.
The route meter shows distance to the current exit.

Stage 7 enemies use the final map's side and vertical edge identifications.
The Stage 7 route still scrolls.
Future carriers wait until the route reaches their entry region before joining this map.
Their lateral drift is 150 units per second in either direction.
Their vertical drift is 140 distance units per second before route scrolling is applied.
Their firing interval is 0.9 to 1.1 seconds.
Their shot speed is 210, compared with 145 on ordinary routes.
These are proposed tuning values, not verified balance results.
Stage 7 changes enemy paths only. The final battle applies its map to ships and shots.
Ordinary routes return carriers below -120 displayed distance units to the top at 950.
The overshoot is retained.
Stage 7 uses the Klein chart from -70 to 950.
All returning enemies lose combat eligibility until drawn and visible for 0.65 seconds.
No collision path crosses a return jump.

Each teaching stage supplies a kit of its unlocked seed types and handed variants.
Enemies still use and drop their actual equipment.
Collected equipment and earned score carry between sections.
Each section starts with full hull and no active fields or shots.
Player shots and enemy shots can break asteroids.
Each asteroid has two hull points.
A player shot that breaks an asteroid gives 10 points.
Asteroids block shots when contact occurs before contact with a ship.
Collision checks remain split at Position Warp jumps.
Ship contact breaks an asteroid and applies one point of normal hull damage.
An asteroid must be drawn in view before it can take damage.
After reaching the Level 8 exit, the player can enter the boss battle.

Retry section restores that section's equipment and score checkpoint.
It does not restart earlier levels.
New run returns to campaign setup and clears campaign progress.
Campaign progress remains in page memory only.
Reloading does not resume a saved campaign.

The visibility acknowledgment and entry period apply to the campaign.
An unseen enemy cannot attack, defend, or receive damage.
Pending player damage must settle before a level clears.
The entry period restarts when an enemy returns from an edge.

## Final boss map

The chart uses lateral coordinates from -400 to 400.
Its vertical distance coordinate runs from -70 to 950.
The coordinate is measured through the current fold metric from the fixed camera origin.
Left and right edges are identified with reversed vertical position.
Top and bottom edges are identified without a horizontal reversal.

For a right-edge crossing, the actor returns at the left edge.
Its vertical coordinate becomes `bottom + top - y`.
Its vertical velocity and facing reverse.
Its horizontal velocity remains unchanged.
The left-edge crossing has the same identification in reverse.
At a top or bottom crossing, horizontal position and velocity remain unchanged.
An exact corner crossing uses the horizontal identification first.

The ship, enemies, and projectiles use this map.
The player can steer sideways but cannot move manually along the vertical axis.
Crossing a side edge still changes vertical position and facing through the map rule.
Movement is split at every edge crossing.
There is no collision segment through the intervening screen area.
Collision checks also consider neighboring identified images.
Drops can be collected through those edge identifications.

The fleet has one 24-hull core and two 8-hull escorts.
They move continuously and never escape or respawn at full health.
They retain health, equipment, and actor identity across crossings.
The fleet must be destroyed before the campaign can end.
A wrap alone cannot clear the battle.
Player shots expire after five seconds.
Enemy shots expire after seven seconds.
Leaving the frame does not by itself remove a boss projectile.
Return markers show the expected arrival edge for nearby departing enemies.

See [the current campaign record](docs/ASTEROID-ROUTES-v0.10.md) for evidence and remaining questions.

## Prototype flight rules

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

The older upgrade flight remains available as a prototype mode.
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
The visible-combat prototype is preserved in `reference/v0.7/`.
The current reference route also remains available as a mode.

## Screen plan

Version 0.14 uses the Crossing pixel asset set.
Its source and delivery rules are in [the asset contract](art/ASSET-CONTRACT.md).
The pixel palette follows the user's supplied hull, space, fold, unfold, and stage colors.
The viewport background is Space Dark `#2E2740`.
The interface retains its existing text and status colors.
The new enemy forms describe existing behavior. They do not add new attacks or change hit areas.
The native source uses exact 16-pixel cells and larger inspection/rock variants.
The art includes separate up/down views with top-left shading.
The renderer disables smoothing and uses integer sprite scales.
Human recognition and visual contact alignment remain review questions.

The public game page contains only the flight viewport.
The status area and menu controls appear inside it.
The top area shows the section, facing, accepted side, fold count, stored damage, hull, time, and score.
The last event remains at the bottom of the viewport.
The viewport has no outside columns or action bars.
The itch.io description gives the controls.
Guide retains an in-game copy.
Combat excludes the area behind the status display.
Equipment, Guide, and Options open native modal dialogs.
Opening a panel pauses play. Closing it leaves play paused.
The player selects Resume to continue.
Detailed fold readings, counter graphs, and explanations remain available in these panels.
Retry and New run require confirmation after a run starts.
Cancel retains the current progress.
The viewport fills the iframe without page scrolling.
Modal panels can scroll internally.
Prototype selection and research records are available only through local development access.

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

