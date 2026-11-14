# Fold audio browser verification

Candidate: `0.25.1-dev.3`.
Browser: Headless Microsoft Edge `157.0.4341.46` on Windows.
Viewport: 1280 by 900.
Role: QA Verification and Triage.

## Result

The candidate passed 44 browser checks.
No page exception or failed asset request occurred.

The control reproduced one music interruption in Projective Mastery.
Three folds advanced the route to the Echo Forge recovery.
The Forge stopped combat and requested an evolution choice.
The old presentation code also stopped both music sources.
After a real evolution selection, music started again.

In the candidate, the Forge keeps both music sources active.
The game clock stays fixed during the choice.
The music clock continues.
The recovery mix keeps a lower rhythm level.
After a real choice, the same music sources continue.

This establishes a fault in the tested route continuation.
It does not prove that every reported interruption had this cause.
Short fold and unfold actions did not directly stop music in any tested Act.

## Control and candidate evidence

The control used these exact modules from the verified `0.25.1-dev.2` PLAY archive:

- `src/audio.js`
- `src/campaign-recorded-audio.js`
- `src/app.js`

The test served these modules with response overrides in an isolated browser context.
Other project files came from the current source tree.
The control is a comparison of the affected presentation modules.
It is not a full regression test of the old release.
The report records all module hashes.

| Observation at the Forge choice | Control | Candidate |
|---|---|---|
| Recorded state | `paused` | `playing` |
| Active recorded sources | 0 | 2 |
| Explicit native source stops | 2 | 0 |
| Core gain target | Previous combat value; sources stopped | 0.42 |
| Actual core gain after settling interval | Not captured in this control | 0.48719 |
| Simulation clock during the choice | Fixed | Fixed at 5.34167 seconds |
| Sources after real Digit 1 selection | New sources start | Existing sources continue |

The candidate's actual gain was still moving toward 0.42.
The value above is a native `AudioParam` observation.
It is not an audible loudness measurement.

## Executed scenarios

The test used existing QA entry fixtures for Acts I to III.
It enabled live simulation with the existing scenario button.
It then used real keyboard input for folds and unfolds.
Projective Mastery held three folds through combat and a recovery choice.
Digit 1 selected the first offered evolution.

Act IV used its existing QA entry page.
Real steering, drive, and manual fire kept the ship active for the recording transition.
The first 24-second segment transition completed with zero underruns.
The test then checked manual pause, resume position, and music mute.

The test observed native `AudioBufferSourceNode.start()` and `stop()` calls.
It observed the real context state, gain values, and read-only game diagnostics.
It did not change physics, health, collision, damage, or music scheduling.
The user browser and its saved profile were not changed.

## Commands and records

Control command:

```text
node tools/fold-audio-browser-check.mjs . reports/fold-audio-dev3/browser-dev2-control "G:\Music Projects\Arrow Space Shift\scratch\fold-audio-baseline-dev2"
```

Control result: 39 checks passed.
The retained control record is `../browser-dev2-control/results.json`.
The control recorded the interruption as an observation.
It did not assert that the old Forge should keep music active.

Candidate command:

```text
node tools/fold-audio-browser-check.mjs . reports/fold-audio-dev3/browser
```

Candidate result: 44 checks passed.
The candidate record is `results.json`.
The candidate adds checks for live route advancement and Forge music continuity.

## Retained investigation failures

These earlier records remain available:

| Record | Completed checks | Reason the investigation stopped |
|---|---:|---|
| `../browser-baseline/results.json` | 26 | The idle Act IV ship died before the segment boundary. This was a fixture limit. |
| `../browser-sustained-baseline/results.json` | 37 | The tool used the wrong Act IV Options button label. |
| `../browser-live/results.json` | 25 | The tool tried to unfold during an unresolved Forge choice. This exposed the music-stop path. |

The first main-runtime samples used a QA state with simulation stopped.
Those samples establish input and playback behavior only.
The control and final runs enabled real simulation before the sustained test.

## Limits

These are browser and native audio-graph checks.
No human listening session occurred in this task.
No physical audio latency or physical-device performance was measured.
The tests do not establish player understanding or musical quality.
An additional listening review must confirm the reported symptom on the user's device.

The report uses short sentences and consistent technical terms.
A full ASD-STE100 dictionary and editorial conformity review was not completed.
