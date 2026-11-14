# Fresh campaign browser acceptance

Date: November 13, 2026.
Status: linked campaign path completed. This was not one uninterrupted run.

`linked-acceptance.json` verifies the two retained browser reports.
It passed 19 record checks for 37 completed encounters.
The total execution used 1,312.06 wall seconds and 1,815.405 browser-clock seconds.
The browser-clock total includes the unsuccessful controller attempt.

## Result

| Run | Executed result |
|---|---|
| `candidate-full-r2` | A fresh profile completed training, all 24 scrolling levels, and the three main bosses. All three physical parts were extracted. Act IV opened through the earned bridge. |
| Recorded interruption | The Act IV lesson 1 controller orbited a nearby enemy while it applied forward thrust. It timed out at 240.032 simulation seconds with hull 4. One 1-HP enemy remained. No page exception or failed request occurred. This is a controller failure, not proof that the encounter is impossible. |
| `candidate-continuation-r3` | The normal import control restored the exact earned records. The corrected controller completed all nine Act IV encounters. It then completed physical core extraction, assembly, all three repair deliveries, the visible ending, and reload persistence. |

The corrected controller travels straight until the required real crossing.
It then stops that forced thrust and aims at the enemy.
Act IV lesson 1 cleared in 9.984 simulation seconds after this correction.
The continuation needed no in-game death or retry.
The earlier controller timeout remains in the original report.

All four receipts use run seed `4181845467` and ship ID `0`.
Every receipt has `legacy:false` and true exposed, collected, and extracted fields.
The three original receipts remain equal after import.
The final core receipt names `double-torus` and stage `8`.
The final journey has true assembled, activated, completed, and endingSeen fields.

The recovery file is `candidate-continuation-r3/earned-progress-recovery.json`.
Its SHA-256 is `9dd4f0d2148eca7ebcd6e3781015a88bde0300c60d5fdb42345057fd945689f7`.
The frozen game's official `exportProgress` function built this envelope from read-only captured storage.
No part, score, unlock, checkpoint, or health value was invented.
The normal stage-entry restore supplied full hull for the new Act IV attempt.
This is the authored retry and resume rule. It did not bank the unearned final core.

## Candidate identity

The run uses a frozen copy at
`G:/Music Projects/Arrow Space Shift/scratch/campaign-candidate-20261113`.
Its build text says `0.25.0-dev.1`.
It contains the integrated gameplay and recorded-audio work for the planned `0.25.1-dev.1` candidate.
`candidate-input-files.json` identifies its source and audio files.
`working-source-differences.json` identifies later working-copy changes.

The later changes concern title audio, control text, public research links, the build label, and the presentation-reader cursor.
The full frozen run does not silently include these later changes.
The integration reports retain their separate tests.

## Executed method

The initial controller started in an isolated headless Edge context with empty storage.
It uses the visible Start control and real keyboard input.
It follows the normal campaign and collected rewards.
Neither run enabled a QA route or wrote directly to browser storage.
The continuation used the disclosed normal import file control.
It uses the actual renderer's visible-enemy result.
It uses Left and Right in the main campaign.
It uses the authored Act IV turn and drive controls in that runtime.
Space remains manual input.

The browser clock advances scheduled update and render frames.
The controller makes decisions every 100 ms in the main campaign.
It uses 50 ms in Act IV and 25 ms in repair.
The audio clock remains separate.

The main controller receives the last 200 copied event records after the recorded instrumentation point.
All actors and projectiles remain in that copied state.
The game's event history remains unchanged.
`readback-instrumentation-r2.json` records this automation-only change.
Observed hull losses remain in `damageObservations`.
Section-end event lists can omit older hits, so use that separate list for damage coverage.

## Acceptance sequence

The completed path starts with training, eight scrolling levels, and the Klein Fleet.
It then continues through Act II and the Projective Intrusion.
Act III ends at the Curvature Gate.
The earned bridge opened the nine Act IV stages.
The final core was exposed, physically collected, and extracted.
The dock assembled four earned parts.
Ordinary inputs delivered the three repair charges.
The ending completed and remained saved after reload.

The script records each clear, extraction, loss, and retry.
It uses the real automatic continuation after scrolling clears.
It also reloads an earned Act II checkpoint through the normal page lifecycle.
This checkpoint check occurs at full hull and does not avoid recorded damage.

## Executed commands

```powershell
$env:ASS_PILOT_SECONDS='4800'
$env:ASS_PILOT_RETRIES='8'
$env:ASS_PILOT_STEP_MS='100'
node tools/campaign-full-browser.mjs 'G:\Music Projects\Arrow Space Shift\scratch\campaign-candidate-20261113' reports/campaign-concept-review/candidate-full-r2

$env:ASS_PILOT_SECONDS='1800'
$env:ASS_PILOT_STEP_MS='50'
node tools/campaign-full-browser.mjs 'G:\Music Projects\Arrow Space Shift\scratch\campaign-candidate-20261113' reports/campaign-concept-review/candidate-continuation-r3 --resume-snapshot=reports/campaign-concept-review/candidate-full-r2/results.json

node tools/campaign-link-report.mjs
```

The first command returned failure for the disclosed controller timeout.
The continuation returned success.
The record verification returned success for all 19 checks.
Both browser reports contain zero page exceptions and zero failed HTTP responses.

Some immediate main-boss boundary captures show the canvas before the DOM overlay settles.
Treat those files as trace frames.
Use the settled integration captures for promotional images.

## Evidence limits

This is automated state-informed browser input.
It is not human play or a comprehension study.
It does not establish fair reactions, listening quality, mobile hardware behavior, or device frame rate.
A controller loss or timeout does not by itself establish unavoidable damage.
An executed full path can establish reachability for the recorded conditions.
It cannot establish all seeds or all ship and loadout combinations.

No repository push, hosted update, or itch.io submission is part of this run.
Full ASD-STE100 dictionary and editorial review is incomplete.
