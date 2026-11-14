# Audiovisual QA report

Current candidate: `0.25.1-dev.1`.
See [the current completion report](COMPLETION-QA-v0.25.1-dev.1.md) for final integration evidence.
The recorded player passed native decoding and scheduling checks.
All 81 runtime OGG files decoded to their expected stereo frame counts.
Music failure leaves SFX available. No live procedural fallback is permitted.
Human listening approval and physical-device performance remain separate.

## Earlier records

Historical record for 0.24.2-dev.1.
For the current candidate, see [the 0.25.0 completion report](COMPLETION-QA-v0.25.0-dev.1.md).
For the separate current music study, see [the r7 bass report](STC-BASS-FADE-r7.md).
The new [Act grammar](STC-ACT-GRAMMAR-r1.md) and collection records in `reports/stc-act-library-r1/` cover the sixteen-track experiment.
The [collection result](STC-ACT-LIBRARY-RESULT-r1.md) records the final source and package checks.
The [operator laboratory result](OPERATOR-LAB-RESULT-r1.md) records the later controlled model and sound comparisons.
The [WAV download list](WAV-DOWNLOADS.md) supplies the sixteen unchanged Act masters and title theme.

Local development version: `0.24.2-dev.1`.
Date: November 12, 2026.
Status: local checks passed. Full campaign acceptance remains open.

## Audit

The active source baseline is v0.24.1.
Acts I–III share the main campaign runtime.
Act IV uses a separate Bolza runtime and renderer.
The imported `src/audio.js` already contains procedural music and sound effects.
The imported renderers already distinguish filled live projectiles from hollow future images.
The November 12 PDF and JSON registry are design proposals.
They are not proof that all proposed features exist.

## Executed baseline checks

| Check | Result |
|---|---|
| Previous v0.15.0 `npm run check` | Missing script; command did not run |
| Previous v0.15.0 `npm test` | 140 passed; 0 failed |
| Staged v0.24.1 `node --test tests/*.test.mjs` | 148 passed; 0 failed; 0 skipped |
| Previous workspace preservation | 636 files checked by SHA-256 |
| Downloads copies | 1,457 files checked against their source hashes |

## Executed local checks

| Check | Status |
|---|---|
| `npm run check` after all changes | Passed: 165 tests; 0 failures; 0 skips. Source and tool syntax passed. |
| Presentation event routing and order | Passed: AV regression tests |
| Bounded event-log consumption | Passed: AV regression tests |
| No simulation mutation by presentation | Passed: detached and frozen event tests |
| Act IV pause key and resume | Passed: DOM test and real browser input |
| Act IV retry and reload score and echoes | Passed: stage-entry regression tests |
| Existing Act IV save migration | Passed: v1 to v2 regression tests |
| Shared saved audio and reduced-motion settings | Passed: real browser reload and page transition |
| Browser startup, manual fire, and controls | Passed: ordinary Act I tutorial input reaches Level 1 |
| Muted play and pause/resume | Passed in the checked tutorial and Act IV sample |
| Packaged PLAY startup and required files | Passed: the extracted PLAY ZIP passed the same 32 browser checks |
| SOURCE archive contents and checksums | ZIP integrity and unique entry names passed; SHA-256 manifest written |

Commands: `npm run check`, `node tools/browser-acceptance.mjs`, and `python tools/verify-workspace.py`.
The preservation check passed for all 2,093 recorded files.
The browser command passed 32 checks in headless Microsoft Edge.
It recorded no page exceptions or failed resource requests.
See `reports/browser-local/results.json` and the accompanying PNG files.
The packaged test command was `node tools/browser-acceptance.mjs .local/packaged-play-0.24.2-dev.1 reports/browser-packaged`.
Its report is `reports/browser-packaged/results.json`.
The PLAY archive has `index.html` at the root.
The SOURCE archive includes the active source and the preserved imports and old workspace.
`npm run package:release` writes both archives and their SHA-256 records under `releases/0.24.2-dev.1/`.

The browser test uses ordinary keys for movement, manual fire, folding, and unfolding in Level 0.
It verifies automatic entry into Level 1 and checkpoint reload.
Act IV uses the local QA unlock to isolate its controls.
It verifies a real paired-edge crossing, a fold action, and one running AudioContext after a user action.
It does not complete all four Acts through ordinary play.

The original Act IV mobile page put controls below the game field.
The new layout passed field and control bounds checks at 1280x900, 390x844, 320x568, and 640x450.
Options fits each compact size. Escape closes the dialog and restores focus.
Closing the dialog keeps play paused. P resumes from the focused Options button.
The RTL layout check passed at 640x450.
The 640x450 check is a small CSS viewport test. Native browser zoom at 200% was not verified.
Screenshots were visually inspected at desktop and 320px width.
Long translated text and physical-device input remain unverified.

Two early browser harness attempts failed before the final pass.
One used a Space press shorter than a simulation frame.
One read the fold HUD before its next render frame.
The harness now holds fire and waits for the rendered fold count.
These failures did not identify a simulation defect.

The music scheduler has a mocked Web Audio cancellation test.
The browser check verifies context unlock, not an audible mix or loudness measurement.
No new soundtrack was composed.

## Preserved truth and limits

The audiovisual layer must consume actual game events.
It must not change damage, movement, collision identity, or attack timing.
Forecasts must remain distinct from completed crossings.
Successful capture and release cues must follow successful simulation actions.

Act IV retains finite geometry steps and a depth-one collision neighborhood.
The hybrid Klein/projective geometry remains experimental.
The audiovisual work does not prove global collision correctness.
It does not resolve ASS-014 or establish encounter fairness.

No complete campaign playtest is recorded here.
No human recognition rate is recorded here.
No physical mobile-device performance result is recorded here.
No measured photosensitivity acceptance is recorded here.
No final ending exists in this candidate.

## Publication and writing

This update does not publish the game to GitHub, ChatGPT Sites, or itch.io.
The existing music remains in use.
No new soundtrack is claimed.

The official ASD-STE100 Issue 9 PDF request returned HTTP 403.
Full dictionary access and a complete editorial review were unavailable.
Full ASD-STE100 conformity is not claimed.
