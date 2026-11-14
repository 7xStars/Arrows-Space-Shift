# Completion QA: 0.25.1-dev.1

Date: November 13, 2026.
Status: Integrated local candidate. The linked browser campaign path completed.
Use the release manifest and package verification report for archive identities and checks.
No publication or jam submission occurred.

## Source and baseline

The active project is `D:/Projects/games/game-off-2026`.
It retains the authoritative v0.24.1 import and the later 0.25.0-dev.1 work.
Acts I–III share the scrolling runtime. Act IV retains the Bolza runtime.
The repair dock uses its separate small runtime and the shared journey records.
The original baseline check for this task passed 261 Node tests.
The user heard and rejected the former procedural score during actual play.

## Implemented result

Produced FoxDot and SuperCollider recordings now play in every Act.
The title uses r9 and requests automatic playback, subject to browser gesture policy.
Recovery, repair, and ending use produced atmosphere.
Failed music loading leaves SFX active and provides Retry music.
The rejected score cannot start as a live fallback.

Actual hostile IDs retain motif pitches through real crossings.
Forecasts stay silent as physical events.
Bounded mechanical recoil and coupled damage feedback use actual events.
They do not move collision cores or change simulation results.
Reduced motion retains essential static feedback.

The main campaign ignores Up and Down.
The hybrid boss retains its first arming deadline through later recovery.
The local Bolza sweep retains real segments before and after a pairing jump.
It never checks a raw jump chord as a continuous path.

## Executed checks

| Command or check | Current result | Evidence |
|---|---|---|
| `npm run check` | 299 passed after the visibility guard | `reports/title-visibility/npm-check.log` |
| FoxDot Python `-m unittest discover -s tests -p 'test_*.py'` | 64 passed | `reports/integration-0.25.1/foxdot-production-tests.log` |
| `node tools/browser-acceptance.mjs . reports/integration-0.25.1/browser` | 32 passed | Startup, controls, checkpoints, settings, responsive layout |
| `node tools/audio-browser-check.mjs` | 18 passed | Native recorded sources, automatic request, gesture, failure, Retry, SFX, mute, save protection |
| `node tools/act4-completion-browser.mjs . reports/integration-0.25.1/act4-browser` | 8 passed | Existing-profile fixture; actual defeat, pickup, extraction, and reload actions |
| `node tools/repair-browser-check.mjs . reports/integration-0.25.1/repair-browser` | 14 passed | Actual charge delivery, capture/release, activation, ending, and persistent completion |
| Native decode and segment scheduling | 81 exact stereo frame counts; 9 checks passed | `reports/campaign-music-v1/native-decode.json`, `native-browser.json` |
| `node tools/structural-feedback-browser.mjs` | 5 passed | Actual fire, damage, fixed collision reference, and reduced motion in an isolated QA combat fixture |
| `node tools/export-pixel-assets.mjs --check` | 109 exported PNGs matched | Exact pixel, dimension, source, and manifest checks |
| `python tools/verify-workspace.py` | 2,093 preserved files matched | `reports/integration-0.25.1/preserved-workspace.log` |
| Normal-action simulation chain | Full campaign, four receipts, repair, and completion | `reports/campaign-rules-0.25.1/main-pilot-final.json` |
| Four ships across Act IV | 36 stage clears | `reports/campaign-rules-0.25.1/act4-pilot-final.json` |
| Fresh-profile linked browser campaign | Training, all 24 scrolling levels, all bosses, four earned receipts, playable repair, ending, and reload completed | `reports/campaign-concept-review/FRESH-CAMPAIGN-BROWSER.md` |

The generic system Python lacks the installed FoxDot environment.
Its production-test command failed on that missing environment.
The same suite passed with `G:/Music Tools/FoxDot/venv/Scripts/python.exe`.
That environment failure is retained in `reports/integration-0.25.1/production-tests.log`.

The art master was absent from the authoritative imported source ZIP.
The new master was reconstructed from all retained sprite exports.
All 109 original PNG file hashes and RGBA hashes remain unchanged.
The source declares its reconstructed origin. It does not recover the old authoring history.
The event reader now skips an already consumed append-only prefix.
It retains history and falls back to an identity scan after trim, replacement, clear, or time rewind.
The benchmark in `reports/av-reader-incremental/` measures only reader CPU cost.
It is not a device frame-rate measurement.
The title stops its sources when the page is hidden and retains its playback position.
The engine has regression coverage for this condition.
The temporary headed and headless Edge checks reported both tabs as visible.
Thus, native hidden-tab behavior remains unverified in this automation environment.
The new title actions initially overlapped flight controls on narrow or short screens.
The repair hides inactive flight controls and keeps Begin before Stop.
Four normal CSS viewports and RTL320 passed the repeated title and dialog checks.
All 22 Options and Guide controls remained reachable by dialog scrolling.
The extra CSS `zoom:2` probe at 640×450 still clips controls.
That probe is not native browser zoom. Native zoom and physical mobile controls remain unverified.

The Act IV fixture tool formerly wrote a fixed older build label.
Its actual tested root was the integrated source. The final package manifest identifies delivered files.
Browser fixtures with earned-profile setup do not establish a fresh campaign path.
The separate fresh-profile browser controller uses ordinary input and records its own source hashes.
It uses accelerated browser time. It does not establish human skill, physical timing, or device FPS.

The full browser path has two linked runs.
Run r2 started with empty browser storage and completed Acts I–III.
It physically extracted all three main-campaign parts and entered Act IV normally.
Its controller then circled a nearby enemy and timed out in the first lesson.
The game reported no exception. This failed controller attempt remains recorded.
Run r3 imported only the progress earned in r2 through the normal file control.
It used the normal stage-entry checkpoint. That checkpoint restores entry hull under the existing game rule.
The corrected controller crossed an edge before it aimed at the nearby enemy.
It completed all nine Act IV encounters and physically collected and extracted the core.
It assembled four earned parts, delivered all three repair charges, and reached the ending.
Completion remained saved after reload and appeared on the main title.
All four receipts have seed 4181845467, ship ID 0, and `legacy:false`.
No health, damage, position, unlock, or component was injected by the controller.
This is a complete linked earned-progress path. It is not one uninterrupted browser run or human play.

## Remaining release limits

The seven equipment operation effects remain inactive in Act IV.
The interface states this limit before entry and in the loadout panel.
Ship differences, manual fire, fold phase, capture, and release stay active.
Bolza collision remains local and depth-one. Crossing subintervals and vertex cases remain limits.
The hybrid chart remains an experimental game geometry.
No global geometric correctness, all-seed fairness, or human comprehension result is claimed.
No physical mobile-device, speaker, headphone, latency, or dense-combat FPS result is claimed.
The user has not yet approved the new campaign mix.

The reported pre-November history requires eligibility review.
The public repository and itch.io submission remain separate required publication steps.
No source license was selected. The current candidate must not be described as a submitted game.

The writing uses short sentences and consistent terms.
The official Issue 9 reference request was blocked earlier in this work.
A full dictionary and editorial conformity review is not claimed.
