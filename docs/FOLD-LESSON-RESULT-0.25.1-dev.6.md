# Fold lesson and speed grade result

Candidate: 0.25.1-dev.6. Date: November 13, 2026.
Project: `D:\Projects\games\game-off-2026`.
Owner: /root, in Coordinator, Design, Engineering, Integration, and QA modes in sequence.
Contract: [FOLD-LESSON-016](tasks/FOLD-LESSON-016.md).

## Change and intent

The user requires fast learning and fast execution under pressure.
Shift primarily offers faster route completion. Automatic folds remain intentional pressure.
The earlier suggestion to provide a slow demonstration does not apply to this contract.

The existing training enemy now appears after movement and before the first shot.
It has ten hull points. It uses existing aim warnings, shots, and ordinary shot damage.
Space remains active during the fold and unfold steps.
Unfold preserves enemy identity, health, and shots already in flight.
An early kill completes training without a forced Shift checklist afterward.
The existing automatic Level 1 transition remains.
The lesson uses normal simulation speed. No new enemy type, lesson room, or explanatory panel was added.
The tutorial grid now remains visible in open space so compression has a visible reference.
The duplicate fold caption is suppressed behind the tutorial prompt.

The existing timer label now shows time saved against open-space travel.
Its value shows section time. The existing route readout shows percent complete and time saved.
Shortened Level 1 cues emphasize speed and hostile-shot risk.
The accepted equipment side remains visible. Its rules remain unchanged.

## Speed curve

Before this change, best clear times were recorded. Faster clears did not directly earn points or affect the stage grade.
Folded kills could earn extra points when that existing option was enabled.

Each scrolling level now has a separate speed grade and clear bonus.
Reference time equals route length divided by SCROLL_SPEED.
The speed score equals 100 times the fraction of reference time saved, divided by 0.7, rounded and clamped to 0–100.
The bonus equals ten times that score. It cannot exceed 1,000 points.
S/A/B/C/D thresholds are 92/82/70/55/40. Lower scores receive E.
This is a fixed design curve, not a rank derived from player results.
The curve has not received human balance acceptance.

For a 40-second reference route:

| Clear time | Speed grade | Bonus |
|---|---|---:|
| 40 seconds | E | 0 |
| 24 seconds | C | 570 |
| 20 seconds | B | 710 |
| 16 seconds | A | 860 |
| 14 seconds | S | 930 |
| 12 seconds | S | 1,000 |

The combat grade remains separate. Boss extraction and Level 0 do not receive this travel-time grade.
The bonus is awarded once, after route completion and pending player damage resolution.
Pause does not advance simulation time.
The existing result record retains the score, including the bonus, and the best clear time.
Scrolling route completion now uses cameraZ, as the route display does.
The ship's offset within the view cannot trigger completion before the displayed route exit.

## Verification

Target: locally served source in headless Microsoft Edge on Windows.
Node: v24.15.0. Edge: 157.0.4341.46.
Git HEAD: 4a1d77e255db437602de68871d9a57c6f47ecc4d, with existing modified and untracked files.
HEAD alone does not identify this candidate.
Baseline and final file hashes are in `reports/fold-lesson-016/`.

| Check | Result | Evidence |
|---|---:|---|
| Syntax and complete game test suite | 322 passed; zero failures or skips | `reports/fold-lesson-016/npm-check.log` |
| General real-input browser acceptance | 30 passed | `reports/fold-lesson-016/browser-final/results.json` |
| Focused lesson and speed browser checks | 14 passed | `reports/fold-lesson-016/keyboard/results.json` |

Focused rule checks cover shot continuity, early kill, real hostile damage, automatic handoff, and existing campaign access.
They also cover curve bounds, increasing rewards for faster clears, pause, one-time bonus, record serialization, and route completion distance.
A spatial check confirms compression and equal gain in both projectile directions.
Existing spatial inverse and fold-discovery tests remain in the complete suite.

The focused browser uses real keys on a fresh normal page through Level 0 and the first automatic Level 1 fold.
It records a player projectile entering the actual fold while held Space continues firing.
The separate clear-result check uses the existing asteroid fixture and QA simulation advance control.
It clears at 15 seconds against a 26.67-second reference, earns Speed C and 630 points, and retains those values in memory.
This fixture does not establish an ordinary campaign clear or browser-storage persistence.
Record serialization is checked separately in the rule suite.
General browser acceptance checks the normal Level 1 checkpoint after reload.

The reviewer inspected `folded-combat.png`, `route-speed.png`, and `speed-result.png` in the focused evidence folder.
The general browser covers desktop, narrow viewports, and RTL layout.
No page exception or missing resource occurred in the final runs.

## Retained investigation results

The first clear-result fixture waited for real time in paused QA mode. It timed out at zero elapsed simulation time.
The corrected check uses the existing QA advance control.
The next check incorrectly expected QA to write browser storage. QA deliberately keeps that result in memory.
The corrected check inspects the in-memory record. Serialization is checked separately.
Both failed expectations remain in `keyboard/qa-clock-timeout.json` and `keyboard/qa-storage-expectation.json`.
These corrections did not change game simulation or storage policy.

## Limits and continuation

No full human campaign session, quick-learner study, listening review, or physical-device check occurred.
These results do not establish understanding, satisfaction, balance, or a jam rating.
No campaign difficulty reduction, soundtrack change, source commit, archive, or publication was performed.
Act IV and later source content remain gated.
Review the lesson with the user at normal speed before making further teaching changes.
Use player explanations and unfamiliar combat decisions to assess understanding.

The writing uses short sentences and consistent technical terms.
Full ASD-STE100 dictionary and editorial conformity were not verified.
