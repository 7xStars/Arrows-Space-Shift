# Three-Act campaign gate

Role: Engineering. Candidate: 0.25.1-dev.5.
The user limited the jam release to Acts I–III.
The implementation preserves the later code and saved data.

## Changes

`src/build.js` now sets `maxAct:3` and `postJamContent:false`.
`maxChapterIndex` remains 26.
The shared `isActAvailable` predicate rejects Act IV in this edition.
Direct-page guards and the public package use the same release configuration.

`src/app.js` hides the Act IV continuation button and blocks its launch function.
The Act III end card follows the existing physical Curvature Seed extraction.
It says Act III complete and thanks the player.
Its explicit Replay Act III action begins chapter 18.
No automatic move to Act IV or Level 0 occurs at victory.
Practice remains available for reached stages.

The completion card requires the existing banked reward.
Boss defeat and collection alone do not satisfy that condition.
The existing profile retains the completion evidence after reload.
No new full Warp Drive completion award is granted.

When no active checkpoint remains, a completed profile returns to the Act III completion entry.
Its primary action replays Act III from chapter 18.
Its explicit New campaign action returns to a Level 0 start menu.
The player must then select Begin to start that new run.
A restored in-progress checkpoint takes priority over that completion entry.
The chosen new-campaign state is presentation state, not a new save field.

The source retains all later journey fields and checkpoints.
A jam replay does not replace an existing Act IV bridge.
A first completion can retain a future bridge if none exists.
The later repaired-drive banner remains hidden in the jam edition.

The ready menu, hangar, current-ship label, and transfer status avoid later-Act prompts.
Aftwing keeps its existing stats.
Its jam description explains its smaller collision core and slower lateral movement.
The later role description remains in the retained ship data.
The final event display and side heading also identify Act III completion.
The event mask changes presentation only. The retained simulation event text is unchanged.

## Verification

Four new tests in `tests/release-scope.test.mjs` cover:

1. The release gate exposes only Acts I–III.
2. Actual boss defeat, physical collection, and extraction remain separate.
3. An existing Act III checkpoint and explicit chapter 18 replay remain valid.
4. A saved later component receipt survives without awarding repair completion.

`node --test tests/release-scope.test.mjs tests/startup-flow.test.mjs tests/act-continuity.test.mjs`

Result: 17 passed. Log: `reports/three-act-progression-check.log`.
The full suite also retains the existing physical boss-reward tests.

`npm run check`

Result: 316 passed at the latest complete run.
Log: `reports/three-act-progression-full.log`.
An earlier integration run had one version mismatch before package metadata was updated.
That mismatch is resolved.

The existing local QA recovery fixture now accepts validated boss indices 8, 17, or 26.
Its default remains boss 8.
It exposes a physical part after a simulated defeat.
The new Curvature Seed fixture does not collect or bank that part.
It unlocks the Klein Relay before the Projective Module, as normal progression does.
The browser check must still collect it and reach extraction through real input.
That fixture is not evidence of boss combat fairness.

## Limits

The browser QA owner checks the end card, replay, menus, and later-page guards separately.
This report does not claim human comprehension, encounter balance, or a fresh campaign playthrough.
No active user game tab was reloaded or changed by this task.
No music master, simulation, topology, collision, or damage rule was changed.
The writing uses short sentences and consistent terms.
A complete ASD-STE100 dictionary and editorial conformity review was not completed.
