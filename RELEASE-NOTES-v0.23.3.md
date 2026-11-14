# Arrow Space Shift v0.23.3 — Fold Wake / Route-Pace Discovery

**Downloadable development candidate. NOT deployed to the existing ChatGPT Site.**

## What changed

- A fold now reliably appears ahead of the current scrolling camera in ordinary routes. Previously, late folds could be positioned at the player's screen-anchored `z`, behind the action; this prevented them from helping speedruns.
- The starfield uses real scrolling progress. The route progress bar now follows the current stage length and displays a small `pace +Xs` comparison against an uncompressed route at the same clock time. Stage-clear results show completion time and pace lead. Best clear time persists in existing profile records; old records without a time migrate safely.
- **Manual Fold Wake:** in stages, each deliberate Left Shift fold can reveal additional traffic ahead, depending on the active fold depth and stage environment. Combat routes add one light scout first, then a scout and asteroid at depth two, then two scouts and an asteroid at depth three. Quiet asteroid belts reveal rocks first, then a mixed wave as depth grows.
- Fold-wake ships and asteroids are physically ahead in the current camera frame, visible before contact. They have an amber outline and `FOLD WAKE` label during an entrance interval. Extra ships cannot attack until their entrance warning passes; rocks cannot inflict contact damage before the marker clears.
- The variation is reproducible from run seed, stage, route quarter and depth; it is not a random mid-screen teleport. A stage admits at most three fold-wake waves. Repeatedly unfolding and refolding in the same route quarter at the same depth cannot farm rewards or hazards.
- Scripted recovery breaks, tutorial Level 0, and boss fights do not generate new fold-wake traffic. Automatic Damaged Warp Drive surges do not summon additional enemies; only deliberately selected folds create this risk/reward choice.
- Act I's stage order, existing encounters, enemy health, and Klein Fleet are otherwise unchanged. Act II/III route bounds, Projective/Echo mechanics, geometry, module acquisition, and save flows are retained.

## Intended implicit lesson

The route moves faster through folded distance. In-game, the player sees (1) the background and progress gauge advance more quickly relative to the same clock, (2) a better `pace` split, and (3) extra warnings/encounters that make speed a tradeoff. The game does not force a tutorial explaining how to speedrun. Whether players discover this themselves still requires blind playtesting.

## Test coverage

93 automated assertions passing after the patch; the added tests cover speed gain versus open space, late-fold position, wake progression and deterministic placements, caps against refold farming, protected breaks, boss/tutorial exclusions, safe enemy presentation, personal best migration, and reduced-motion rendering.

Browser visual testing remains unverified. The local browser cannot reach the local HTTP server in this session. No ChatGPT Sites deployment occurred.

## How to try it

Extract PLAY ZIP; Windows: run `START-GAME-WINDOWS.bat` and open `http://127.0.0.1:4177/`. Mac/Linux: run `python3 -m http.server 4177 --bind 127.0.0.1` in the extracted directory. Start a normal campaign at Level 0, play Level 1 twice with the same seed if using QA, and compare progress and time using folds versus no folds. In Level 2 (Quiet Belt), try folding to observe asteroid wake responses. For Act II stages, no wake event occurs during the authored breaks.
