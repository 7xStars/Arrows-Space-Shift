# Structural Techno-Cosmism study verification

Report: `ASS-STC-003-QA`.
Date: November 13, 2026.
Contract: [ASS-STC-003](STC-STUDY-CONTRACT-r3.md).
Source: `D:\Projects\games\game-off-2026`.
Baseline: `0.25.0-dev.1`, 212 tests.
Status: source and packaged browser checks passed. Final musical acceptance remains open.

The geometry contract is r3.
The tested music revision is `identified-return-r4`.
The page reports `stc-study-r4`.
The source browser result records SHA-256 values for eight runtime files.
The test used headless Microsoft Edge on Windows and Node.js v24.15.0.
The installed Edge executable reported version 157.0.4341.46.
This is a local browser check, not an itch.io hosted check.

## Executed checks

| Layer | Command and condition | Actual result | Limit |
|---|---|---|---|
| Existing suite | `npm run check` before the new study files | 212 passed; 0 failed; 0 skipped | Retained baseline. It does not test the new study. |
| First browser sample | `node tools/stc-study-browser.mjs . reports/stc-study-r3/browser-first` | 31 checks passed; no page exception or missing resource | This sample preceded source-announcement and gain-control revisions. It did not establish the full source-to-return musical phrase. |
| Revised source browser | `node tools/stc-study-browser.mjs . reports/stc-study-r4/browser-source` | 43 checks passed; no page exception or missing resource | Ordinary keyboard and native controls. It does not establish musical quality or player learning. |
| Final source and extracted SOURCE | `npm run check` | 226 passed; 0 failed; 0 skipped | Includes the retained suite and 14 study tests. It does not establish musical quality. |
| Packaged study | `node tools/stc-study-browser.mjs .local/verified-stc-r4/play reports/stc-study-r4/browser-packaged` | 43 checks passed; no page exception or missing resource | Same cases on extracted PLAY files. Do not add the count as new coverage. |
| Packaged campaign comparison | `node tools/browser-acceptance.mjs .local/verified-stc-r4/play/game reports/stc-study-r4/campaign-packaged` | 32 checks passed | Retained tutorial, Act IV, settings, and layout cases; not full campaign play. |
| Archive entry | Root study and Game-link browser check | 2 checks passed | The root opens r4. The link opens the packaged campaign. |
| Preserved source | `python tools/verify-workspace.py` | 2,093 files passed hash checks | Current workspace and extracted SOURCE. |

The baseline log is `.local/stc-review-baseline.txt`.
The final suite and syntax checks passed after integration.
The final archive record compares the tested runtime bytes with the distributed files.

The first browser sample used real keyboard and native controls.
It covered actual crossing, first-choice feedback, restart, safe conditions,
pause, compact layouts, and unchanged campaign storage.
Its screenshots received a visual inspection.
The compact view fit the controls. Its small canvas labels still need player review.

A later design review found that the first motif sounded only at a crossing.
No source motif preceded that return.
The owners added a typed attack-entry event and matching source motif.
The revised browser check verified the same motif at source and actual return.
It also verified that the transfer announces its source only after commitment.

The coordinator's visual review found a second issue.
The canvas selected the first recorded crossing while the HUD selected the latest crossing.
Both now use the same selected actual primary crossing.
The revised browser check compared the HUD with the actual canvas text command.
The final disclosure screenshot received a visual inspection.
Its source, destination, and object label agree with the HUD.

The user described the first techno music as closer to the target.
The user requested harder drums and a synth revision.
Music revision r4 addresses that request.
This is qualitative feedback. It is not final musical acceptance.

## Browser results

| Case | Expected result | Current status |
|---|---|---|
| Startup and loading | No page exception or missing runtime file | Passed |
| Manual controls | Ordinary arrow input moves the ship. Space creates a real player shot. No automatic player fire occurs. | Passed |
| Actual crossing | One physical projectile continues through the real Bolza mapping. Its source and return retain one object motif. | Passed in browser and focused object-reference test |
| First prediction | Destination and source cues remain hidden until a choice is committed. | Passed |
| Transfer | A changed start and heading introduce a new example. A rotated retry is distinct from the first response. | Passed |
| Result record | Feedback retains the first choice. The native export retains earlier records and music revision. | Passed |
| Pause and resume | Simulation stops. One audio context resumes. Guide closure stays paused. P works with button focus. | Passed |
| Modes | Audio-only ignores combat input and contact counts. Its listening case has no scored edge answer. Mismatched cues have an explicit probe label. | Passed |
| Silent and reduced-motion modes | Controls and static rule traces remain available. No sound is required for input. | Passed in inspected cases; recognition remains unverified |
| Mix controls | Native music, effects, and ambience controls change independent session gains. | Passed |
| Restart and saves | Restart clears the active study. Five stored campaign/settings fixtures remain byte-identical. No storage write occurs. | Passed |
| Compact view | Required controls and transfer choices remain in the viewport at 390 by 844 and 320 by 568. | Passed for bounds; small canvas labels need human review |

The [source browser result](../reports/stc-study-r4/browser-source/results.json) records all 43 checks.
The [disclosure image](../reports/stc-study-r4/browser-source/disclosure.png) shows the selected actual mapping.
The [transfer image](../reports/stc-study-r4/browser-source/transfer-before-choice.png) shows the unanswered case.
The [exported test notes](../reports/stc-study-r4/browser-source/study-notes.json) contain automation responses.
Those responses are not human participant data.

The seven focused geometry-study tests include direct object-reference retention through a seam.
Snapshot ID equality alone is not used as proof of physical object retention.
The musical and geometry clocks remain independent.
Authored score sections do not establish full synchronization with player-selected study phases.

## Evidence boundaries

No musical listening result is assigned by this report.
No human recognition, prediction, enjoyment, or transfer result is assigned.
No device latency, physical touch, or mobile frame target is assigned.
The supplied reference descriptions guide the composition.
An inaccessible video must not be reported as heard.

Post-crossing sound can support attack-identity learning.
It does not alone establish a pre-crossing destination prediction.
A correct geometric prediction does not show that music caused learning.
Later human tests must compare conditions, prior exposure, assistance, and unfamiliar cases.

The study has not been published or submitted.
