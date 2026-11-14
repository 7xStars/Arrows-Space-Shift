# Arrow Space Shift v0.23.6 — Seamless Level-Complete Handoff

**Downloadable development candidate. Not deployed to the existing ChatGPT Site.**

## Why the game seemed to freeze

In the 0.23.5 build, completing an ordinary stage set the simulation phase to `cleared` and stopped movement and shooting, while the save file already pointed to the **next** level. The in-page continuation required clicking `Start Level N`; depending on viewport size, the results panel or action was easy to miss. Reloading used the next-level checkpoint and therefore appeared to unfreeze the game.

## Fix

- Ordinary campaign level clears now show the results and stage grade for **approximately 2.8 seconds** and automatically launch the next stage. The button can still be used to continue sooner.
- The countdown is paused when the browser tab is hidden or a dialog is open. The stage result and its checkpoint are retained during this interval.
- The continuation uses the existing `continueCampaign()` code path, preserving the same run seed, score, equipment, ship, and section transition rules. The ship starts the new level at full hull as before.
- The completion panel is scrollable and its continuation control remains reachable on short viewports.
- Stage 0's automatic handoff to Level 1 remains as implemented in v0.23.5. Boss rewards and ship selection remain explicit; cleared practice encounters remain manual. Act III's final boss remains a deliberate stopping point.
- Saved checkpoint format and permanent progression are unchanged. Reloading still works as a fallback, but is no longer necessary to proceed between ordinary levels.

## QA

- Five additional focused tests for auto handoff, blocking dialogs, Act II continuation, exclusions, and integration.
- Full test suite: 112/112 passing. Syntax and ZIP integrity checks also passed.
- Local Chromium was blocked with `ERR_BLOCKED_BY_ADMINISTRATOR`, so a user-visible browser playthrough has not been verified in this environment.

### How to test

Start a new run and complete Level 1 (or use an existing level checkpoint). On completion, the grade and score appear; about three seconds later Level 2 begins without pressing a button. Repeat in Act II to confirm identical behavior. Defeat a boss and confirm the module pickup/extraction and explicit ship choice still work. Reloading after a level clear should offer the next level, as previously.
