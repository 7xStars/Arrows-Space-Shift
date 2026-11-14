# Completion and audio verification

Candidate: `0.25.0-dev.1`.
Date: November 13, 2026.
Baseline: `0.24.2-dev.1`, 165 passing tests.
Status: source, extracted source, and packaged browser checks passed after the music and forecast revisions.

## Changes and owners

The team used the role instructions in `D:\Projects\games\agents`.
The coordinator integrated the source and settings.
The Act IV owner implemented combat, rewards, and checkpoint continuity.
The repair owner implemented the journal, dock, activation, and ending.
The audio owner implemented the arrangements, mix buses, bounded voices, and recovery.
An independent save review found additional failure cases. The integration owner repaired them.
See [the task record](tasks/JAM-COMPLETION-002.md).

## Executed checks

| Check | Actual result | Evidence and limit |
|---|---|---|
| `npm run check` | 212 passed; 0 failed; 0 skipped; 47 source/tool syntax checks | [Test log](../reports/completion-0.25.0-dev.1/automated-check.txt); source result after the final runtime changes |
| `node tools/browser-acceptance.mjs` | 32 passed | Ordinary tutorial input, reload, QA-unlocked Act IV, controls, modal behavior, and compact layouts |
| `node tools/act4-completion-browser.mjs` | 8 passed | Existing reached-boss profile; actual keyboard combat, pickup, extraction, and reload |
| `node tools/repair-browser-check.mjs` | 14 passed | Existing four-part profile; actual keyboard deliveries, interrupted ending, completion, reload, and main title recognition |
| `node tools/audio-browser-check.mjs` | 8 passed | Real scheduling, interruption recovery, independent gains, silent play, and protected import recovery on all three pages; no listening result |
| `node tools/pilot-act-four.mjs` | All nine stages cleared with each of four ships | 36 normal-action simulation clears; no arbitrary damage, extra hull, or state repositioning |
| `node tools/pilot-main-campaign.mjs reports/completion-0.25.0-dev.1/full-campaign-pilot.json 2026 3 --full` | Complete fresh-profile chain passed | Level 0, all 27 main sections, all nine Act IV encounters, actual extraction receipts, repair, ending, and saved completion; renderer proxy and normal action APIs; not browser or human play |
| `node tests/render-audio.mjs` | Ten revision-two renders passed | Two 32-second music clips, two separate illustrative mixes, and six eight-second stress fixtures; stereo 48 kHz; no non-finite or full-scale samples |
| Progress transfer tests | 10 passed within the full suite | Complete transfer, legacy import, malformed records, failed reads/writes, rollback, and pending live state |

The focused tests overlap the full suite. Do not add their counts as new independent coverage.
The browser check groups cover different scopes. Their counts do not measure total campaign coverage.
The fresh-profile simulation chain finished the main campaign without retries for seed 2026.
It then used the actual bridge, all nine Act IV stages, extraction receipts, assembly, repair, ending, and save/load.
Its four receipts identify actual campaign extractions; no legacy receipt was needed.
This establishes one legal complete path. It does not establish a fresh-profile browser or human playthrough.
The repair recording is `reports/completion-0.25.0-dev.1/repair-browser/repair-and-ending.webm`.
Screenshots and JSON records are stored beside each browser result.
Audio review WAVs and metrics are in `reports/audio-0.25.0-dev.1/`.

The extracted revised PLAY archive passed the same browser groups.
The packaged results were: startup 32, boss extraction 8, repair 14, and audio 8.
The source and packaged results cover the same cases. Do not add them as new coverage.
The final browser records use these folders:

- [Startup and controls](../reports/completion-0.25.0-dev.1/packaged-startup-r2/results.json).
- [Boss and extraction](../reports/completion-0.25.0-dev.1/packaged-boss-r2/results.json).
- [Repair and ending](../reports/completion-0.25.0-dev.1/packaged-repair-r2/results.json).
- [Audio and save recovery](../reports/completion-0.25.0-dev.1/packaged-audio-r2/results.json).

The extracted SOURCE archive also passed `npm run check`: 212 tests, no failures or skips.
Its preservation check verified all 2,093 earlier files against their saved hashes.
The archive writer checks CRC integrity, unique names, and `index.html` at the root.
The release directory contains the archive sizes and SHA-256 values.
The final archive check compares runtime bytes with the tested extracted PLAY build.

## Listening feedback

The user reviewed the first Act I and Act IV WAV files.
The user reported: "this sounds like game SFX, not music the Act IV audio is clearer."
This is qualitative feedback from one listener. It is not a category score.
The first files were eight-second stress mixes with repeated action and damage cues.
Those cues can obscure the musical structure.
The music also used short notes with immediate decay.
Revision two separates music-only review files from action stress files.
It adds an eight-bar melodic phrase, sustained bass, and held harmony.
It uses Dm–Bb–F–C followed by Dm–Bb–Gm–Am.
Act IV retains a thinner arrangement and more silence.
The revised music is integrated into the game.
The first reviewed files remain unchanged for comparison.
The revised files end in `music-review-r2.wav`, `mix-review-r2.wav`, or `mix-stress-r2.wav`.
The [revision measurements](../reports/audio-0.25.0-dev.1/results-music-review-r2.json) describe each fixture.
Listening acceptance remains open.

## Reward and continuation evidence

The boss browser test used an existing profile with Act IV stages 1 to 8 reached.
It did not use a QA query or a write API.
Normal keyboard play defeated the boss.
Reload after exposure restored the boss checkpoint and awarded no core.
Reload after physical collection also awarded no core.
A later normal-health attempt collected and extracted the core.
The resulting receipt persisted, without setting assembly or campaign completion.

The repair test used a separate valid four-part profile fixture.
Assembly alone did not activate or complete the drive.
The player delivered actual charges through all three circuits.
Reload during the ending retained activation but required the visible ending to finish.
Completion survived another reload and appeared on the main title.
These are browser input results, not human comprehension results.

## Save review and repairs

The independent review found that read failures could be treated as missing data.
It also found that primitive profiles could reset a valid fleet.
Strict reads and object validation now reject those cases.
Malformed or unreadable transfer recovery records remain present.
Main, Act IV, and dock pages block dependent persistent writes when recovery is unresolved.
The main export can include pending live receipts and bridge data.
Repair feedback distinguishes a saved ending from a pending save.
When storage fails, activation or completion can remain in memory only.
Keep the page open and use the save-retry control before leaving.

The final cue review also found a false forward ship prediction during standstill or reverse thrust.
The Act IV forecast now uses stable signed drive velocity and actual ship speed.
It suppresses the marker during braking, turning, pause, or standstill.
The reverse forecast matches the actual Bolza mapping in a regression test.
The projectile forecast now also respects remaining lifetime and the active fold interval.
The Guide states the six-echo capacity.
The focused Act IV suite passed 27 tests.
The source browser group passed 32 checks after this cue repair.
Physics and collision rules did not change.

## Evidence still required

Use [the current player review](PLAYTEST-CHECKLIST-v0.25.0-dev.1.md) to collect this evidence.

- Full fresh-profile browser or human play through all Acts with ordinary input.
- Unfamiliar-player understanding, response timing, and enjoyment.
- Further listening, masking, perceived loudness, and speaker/headphone review.
- Physical mobile input and representative device frame budgets.
- Broader hybrid and near-vertex collision and fairness checks.
- Final public repository and itch.io hosted acceptance.

The original hybrid geometry remains an experimental game mechanic.
Act IV's local collision sweep is not a complete global collision solver.
The seven equipment operation effects remain inactive in the Bolza chart.
No 4.5/5 category result is assigned by this technical report.

## Review target

The target is 4.5/5 in each Game Off category.
The following review uses the anchors in the retained Game Off assessment.
Test counts do not determine these scores.

| Category | Implemented change in this candidate | Required next evidence |
|---|---|---|
| Overall | Complete reward, repair, ending, and progress transfer | Unassisted campaign play; final hosted build check |
| Gameplay | Act IV ship differences, boss phases, recovery, and physical deliveries | Reachable responses across more seeds; player decisions and enjoyment |
| Graphics | Actual-state boss warnings, distinct pickup/extraction shapes, compact dock and ending | Dense-scene readability and unfamiliar-player collision expectations |
| Audio | Separate gains, original Act arrangements, bounded mix, and revised sustained music | Listener review of music, action mix, transitions, and fatigue |
| Innovation | Existing spatial operations combine in a playable repair | Unfamiliar transfer tasks; useful choices recognized by players |
| Theme Interpretation | SHIFT changes actual distance, return paths, and attack ownership through the ending | Players explain and use these changes without assistance |

Keep optional research rooms, new ships, 3D conversion, and new campaign branches outside this release task.
