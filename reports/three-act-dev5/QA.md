# Three-Act edition browser verification

Candidate: `0.25.1-dev.5`.
Role: QA Verification and Triage.
Browser: isolated headless Microsoft Edge `157.0.4341.46` on Windows.
Result: 35 checks passed. No page exception or failed active asset response occurred.

## Executed checks

```powershell
node --check src/later-content-entry.js
node --check tools/three-act-browser-check.mjs
node tools/three-act-browser-check.mjs . reports/three-act-dev5/browser-final-4
```

The final source hashes, observations, and check names are in `browser-final-4/results.json`.
The log is `../three-act-dev5-browser-final-4.log`.
The test starts a separate local server and browser profile.
It does not control the user's game tab or change the user's storage.

## Direct later-page entry

Both later HTML pages now load `src/later-content-entry.js`.
That module reads the shared build gate before it imports a runtime.
The retained runtime imports use a fixed whitelist.
The hidden edition displays an Acts I–III notice and a campaign return link.

The browser visited both pages with `?qa=1` and a supplied older profile.
The profile included a fabricated ship, an Act IV checkpoint, all drive receipts, and completed repair state.
For each later page, the following checks passed:

- The notice was visible.
- Every supplied old record retained the same bytes.
- No storage write occurred.
- No audio context or later runtime started.
- No original Act IV or repair entry module was requested.
- The notice fitted a 320 by 568 viewport.

The local QA parameter did not bypass the edition gate.
The coordinator's package selection can omit both pages from PLAY.
When a page is omitted, this tool expects HTTP 404 instead of a source notice.
An expected omitted-page response is separate from an active asset failure.

## Existing profiles and menus

An older profile with the Curvature Seed did not expose an Act IV start.
The title recognized Act III completion and offered Replay Act III.
The repaired-drive banner remained hidden.
Guide, Equipment, and Options had no visible later-Act or repair-dock prompt.
The retained hidden continuation control could not launch a later Act.

Reload retained the older Act IV and repair records.
An explicit replay started chapter 18.
A supplied chapter 24 checkpoint took priority over the completion entry.
It restored chapter 24 and its layout seed instead of starting Level 0.

The explicit New campaign action opened a ready entry.
It did not start Level 0 automatically.
The player still had to select Begin at Level 0.
These menu actions retained the stored later-Act records.

## Act III extraction and ending

This check used the local post-defeat Curvature Seed fixture.
The fixture defeats the boss before observation and exposes its real pickup.
It does not collect the pickup or complete extraction.
It is not evidence of ordinary boss defeat, encounter fairness, or a fresh campaign.

After the fixture, ordinary keyboard steering collected the component.
The pickup remained separate from permanent unlocking.
At about 1.71 simulation seconds, the component was collected and the unlock was still false.
Normal route motion completed extraction at about 11.69 simulation seconds.
The real `boss-extracted` event then recorded the Curvature Seed.
The profile's permanent unlock became true.

The visible result was Act III complete with a Replay Act III action.
The entire visible viewport had no later-Act continuation prompt.
The footer and side goal also identified the completed Act.
Replay started Act III rather than Level 0.
The local fixture did not award a completed Warp Drive.

The coordinator's existing pure tests cover reward and release-gate rules separately.
This browser check does not replace those tests.

## Visual review

The final completion card and narrow later-page notice were inspected.
The completion card has a clear heading, result, replay action, and retained-progress note.
The side goal and footer agree with that result.
The source notice has one campaign return link with a 44-pixel target.
The link uses the notice text color.

Captures:

- `browser-final-4/act-three-complete.png`
- `browser-final-4/hyperbolic-act-guard-320.png`
- `browser-final-4/repair-dock-guard-320.png`

## Retained investigation records

The earlier records remain in their named folders.

| Record | Observation |
|---|---|
| `browser-initial` and `browser-menu-probe` | Options still exposed a repair-dock link. The interface owner gated its append operation. |
| `browser-final` | The completed-entry contract changed to an explicit Act III complete heading while the old test expected the earlier wording. The expectation was updated to the agreed heading and replay action. |
| `browser-final-2` | The initial 32 checks passed, but visual inspection found an Act IV prompt in the event footer behind the completion card. The application owner corrected the presentation text. |
| `browser-final-3` | The tool read the won state before the throttled HUD refresh. It now waits for the visible completion card before evaluating the ending. No page exception occurred. |

The final run checks the complete visible viewport instead of only the overlay.
The fixture also now installs the prerequisite Klein unlock before the Projective Module.
That change makes its prior-Act profile consistent with normal progression.

## Limits

This is native browser and supplied-profile verification.
It is not human play, a new full campaign playthrough, or a physical-device test.
The reward check starts after boss defeat.
Boss combat, broad fairness, user comprehension, and physical audio quality are outside this run.
Act IV and repair code remain in source for later work.
Their current browser gameplay is intentionally unavailable in this edition.

The text uses short sentences and consistent terms.
A full ASD-STE100 dictionary and editorial conformity review was not completed.
