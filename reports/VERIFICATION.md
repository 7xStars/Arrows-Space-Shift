# Game verification

These checks were recorded before source publication.
Current repository: [7xStars/Arrows-Space-Shift](https://github.com/7xStars/Arrows-Space-Shift).

Date: November 4, 2026.
Candidate: Arrow Space Shift 0.14.0.
Project: `D:\Projects\games\game-off-2026`.
Target: local browser source at <http://127.0.0.1:4177>.
Contracts: [game rules](../DESIGN.md), [asset contract](../art/ASSET-CONTRACT.md), [current release](RELEASE-0.14.md), [production pipeline status](PIPELINE-STATUS.md).

## Executed checks

| Layer | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Current Node rule checks | 138 | 0 | 0 |
| Existing headless Edge browser checks | 82 | 0 | 0 |
| Campaign headless Edge browser checks | 55 | 0 | 0 |
| Interface headless Edge browser checks | 37 | 0 | 0 |
| Extracted ZIP in a local iframe | 19 | 0 | 0 |
| Enemy-return browser checks | 21 | 0 | 0 |
| Pixel-art browser checks | 11 | 0 | 0 |

Commands:

```powershell
npm test
node tools/browser-check.mjs
node tools/campaign-browser-check.mjs
node tools/interface-browser-check.mjs
npm run package:itch
node tools/itch-browser-check.mjs
node tools/enemy-return-browser-check.mjs
npm run art:export
node tools/art-browser-check.mjs
```

The browser checks used installed Microsoft Edge and Playwright from the shared Codex runtime.
The game does not require Playwright.
Reports: [existing checks](browser-results.json), [campaign checks](campaign-browser-results.json).
No Git repository exists in this project folder.
Source identity is the local v0.14.0 candidate, not a commit hash.
The ZIP hash is recorded in [the release record](RELEASE-0.14.md).

## Pixel-art results

- 42 sprite PNGs use only the supplied palette and alpha values 0 or 255.
- Dimensions, source and atlas hashes, and non-overlapping atlas bounds pass.
- The four enemy masks and three rock masks differ.
- Repeat boundaries on edge rails join without gaps.
- The rock break clip follows its declared frame times and stops after 300 ms.
- Rendered fixtures draw the player, Scout, Heavy/Gunner, Klein Runner, rocks, edge twist, and a rock break frame.
- The atlas loads in the extracted upload package.
- A missing sprite manifest leaves the earlier procedural renderer playable.
- No gameplay or collider code was changed for the art import.

Pixel-mask differences do not prove human recognition.
Visual contact alignment and artistic acceptance remain unverified by people.
The generated concept draft was not used as the runtime atlas.

## Tutorial and interface results

- The campaign begins with Level 0 before the eight routes.
- Actual movement to the left and right unlocks a training target.
- A successful shot completes the lesson.
- The target cannot fire or cause contact damage.
- The viewport retains the section, accepted side, fold count, local factor, hull, and stored damage.
- The complete mission text remains available in Guide.
- Equipment, Guide, and Options open native modal dialogs.
- Opening a panel pauses time. Closing it leaves play paused.
- Tab stays within the panel and closing restores focus to its trigger in the checked path.
- New run requires confirmation after launch. Cancel retains the campaign.
- Two-slot campaign status fits at 320 px.
- Named layouts have no horizontal overflow.
- Main controls fit vertically at 1440 × 1000, 1280 × 720, 390 × 844, and 320 × 740.
- Six measured live text pairs exceed 4.5:1. See [contrast records](interface-contrast.json).

The 720 × 500 check uses reduced window space, not actual browser zoom.
Only the viewport occupies the page at the named window sizes.
The game page has no scrollbars. Modal panels scroll internally.
No screen-reader session or human tutorial observation was run.

## Route results

- All eight levels scroll automatically and end at a route exit.
- Left and Right steer during scrolling.
- Up and Down do not affect campaign position, thrust, or facing.
- The boss retains the map's automatic side-edge position and facing reversal.
- Normal Space-key input defeats a full-health visible carrier while the route moves.
- Even-numbered levels have mostly asteroids and occasional enemies.
- They have no countdown or target quota.
- Normal hull damage applies in all eight levels.
- New run seeds change enemy and asteroid positions.
- A section retry restores the same layout and its checkpoint.
- Generated belts stayed inside their route limits over 20 seeds per belt.
- Checked asteroid rows leave gaps between them.
- Folding increases route progress at equal elapsed time in the checked case.
- Living carriers that pass the bottom return at the top with retained hull, identity, and equipment.
- Stage 7 carriers use reversed side edges and ordinary top/bottom identifications.
- Stage 7 future carriers wait for their entry region before map motion starts.
- Returning carriers need a new rendered entry period before combat.
- Stage 7 carriers have increased movement speed, firing frequency, and shot speed.
- Returned carriers do not block route completion.

## Asteroid results

- Player fire and enemy fire can break a rendered asteroid.
- Player destruction gives 10 points once.
- Enemy destruction gives no player points.
- Ship contact breaks the asteroid and reduces hull under ordinary damage rules.
- A nearer rock blocks a shot before it reaches a ship.
- A rock behind a ship does not absorb an earlier ship hit.
- Collision order respects upgrade entry and the transformed shot path.
- Position Warp does not sweep a collision path through its jump.
- Unseen asteroids cannot be destroyed.

## Retained results

The suites retain the side-filter, upgrade, counter, equipment-order, visibility, and fold checks.
They retain the Klein bottle movement and collision checks.
The core and escorts preserve health and equipment across edges.
The browser exercises both pairs of edge identifications.
The ending requires all fleet members to be destroyed.
The normal page does not expose fixture controls.
The prior browser reference pages still load and advance in the development project.
The 82-check suite includes the historical prototype thrust controls through local development access.
Those controls have no campaign authority and are absent from the release menu.
No browser runtime error was recorded.
Archived Node suites were not rerun for this change.

## Evidence scope

Route transition fixtures start near the exit.
The boss-ending fixture uses prepared one-hit targets.
These fixtures establish progression and feedback, not full-route difficulty.
A separate check uses normal shots and normal target health during scrolling flight.
Separate rendered fixtures check player fire, enemy fire, and ship contact with asteroids.

No human completed the revised campaign during this change.
No physical-device or listening test was performed.
The checks do not establish enjoyment, teaching success, or overall balance.
Fewer enemies and slower firing support the intended reduction in pressure.
Player observation must establish whether the even-numbered levels feel less stressful.

## Visual review

Reviewed the current extracted-ZIP viewport capture and the interface suite captures.
It shows separated asteroids, a visible entering carrier, route progress, and normal hull state.
The browser checks retain compact layouts at 390 px and 320 px widths.

Captures: [extracted ZIP viewport](itch-viewport.png), [Level 0](ui-tutorial.png), [two-slot compact screen](ui-two-slots-compact.png).

## Remaining work and limits

Next, play all eight routes through their full distance with normal health.
Check whether the asteroid spacing and occasional enemies provide enough recovery time.
Campaign progress remains in page memory only.
There is no persistent save or resume after reload.
The upload ZIP and page-description text were prepared.
The actual extracted ZIP completed Level 0 and entered Level 1 in a local cross-origin iframe.
The iframe checks exercised Shift input, vertical-key rejection, equipment pause, and three iframe sizes.
All requested runtime files loaded without errors.
No public repository, hosted deployment, or jam submission was made.
The user has not selected a source license.

Full ASD-STE100 conformity is not claimed.
The official Issue 9 PDF returned HTTP 403 during this turn.
A complete dictionary and editorial review remains unperformed.

Music composition, combat SFX production, listening, and human playtests remain incomplete.
The first native pixel-art source/export/import pipeline is complete at the technical-check level.
Human art acceptance remains open.
Automated gameplay checks do not complete those pipelines.
