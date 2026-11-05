# Prototype verification

Date: November 4, 2026.
Candidate: Foldspace 0.2.0.
Project: `D:\Projects\games\game-off-2026`.
Contract: [DESIGN.md](../DESIGN.md).
Target: local browser source served through `tools/serve.mjs`.
No compiled build is required.

## Results

| Layer | Executed | Passed | Failed | Skipped |
|---|---:|---:|---:|---:|
| Node rule checks | 17 | 17 | 0 | 0 |
| Headless Edge browser checks | 27 | 27 | 0 | 0 |

Commands, from the project folder:

```powershell
npm test
node tools/browser-check.mjs
```

The browser check uses the installed Microsoft Edge browser.
It loads Playwright from the shared Codex runtime.
Set `PLAYWRIGHT_MODULE` if Playwright is installed elsewhere.
Start the local server before the browser check.
The game itself does not need Playwright.

## Checked behavior

- Overlapping fields multiply their distance factors.
- Movement crosses field boundaries in both directions.
- Splitting a movement into smaller steps preserves the result.
- Unfold restores geometry without reversing time, travel, or damage.
- Equal thrust gives more route progress inside a compressed region.
- Folding does not change the firing clock.
- Shots can hit between simulation endpoints.
- Gates check the opening at the crossing position.
- Hull loss and route completion end the flight.
- Left Shift and Right Shift perform different actions.
- A held Shift key does not repeat a fold.
- Real arrow-key events steer the ship.
- Real Space-key events fire shots.
- Only Left Shift and Right Shift change space.
- WASD and F/V have no gameplay action.
- Pointer dragging does not steer the ship.
- Up and Down change thrust.
- Both sides' shots visibly accelerate after display projection.
- Unfolding restores both sides' shot speeds.
- The same outgoing shot reaches its target earlier when folded.
- The same incoming shot reaches the ship earlier when folded.
- Unfolding delays the incoming hit.
- Folded kills earn the declared bonus.
- Unfolding removes the pending bonus.
- Restart clears the visible fold stack.
- Pause stops simulation advancement.
- Focus loss pauses flight.
- Restart clears flight state.
- A full space-only route reaches the result screen.
- The normal animation loop advances the flight.
- Fixture controls are absent from the normal URL.
- No browser runtime errors were recorded.

Browser records: [browser-results.json](browser-results.json).

## Visual review

Reviewed the combat and space-only views at 1,440 pixels wide.
Reviewed the complete compact page at 390 pixels wide.
Checked horizontal overflow at 320 pixels wide.
The flight area and action buttons remain accessible in those views.
Corrected a missing space in the compact introduction.

Captures: [combat](combat.png), [space test](desktop-fold.png), [compact page](compact.png).

## Corrected behavior

The previous projectile movement and display transforms canceled their visible speed change.
Version 0.2 applies an explicit local speed gain to both sides' shots.
The gain is checked after display projection.
It does not change the game clock or firing intervals.
Version 0.2 also removes the extra ship and fold controls.
The score bonus and symmetric projectile acceleration supply the first combat tradeoff.

## Limits and next action

The browser fixture advances the simulation deterministically.
A separate normal-page check verifies the animation loop.
These checks do not establish human understanding, combat balance, or enjoyment.
No physical phone, controller, or audible output was tested.
The complete combat route was not completed by a human tester.
Player observation is the next design check.

The prototype does not implement transverse folds, persistent progression, or a save system.
The user has not selected a public source license.
No public repository, hosted deployment, or jam submission was made.

Writing uses short sentences and consistent technical terms.
Full ASD-STE100 conformity is not claimed.
The official dictionary PDF returned HTTP 403 during this session.

