# Game Off review: November 13, 2026

This is the retained `0.24.2-dev.1` assessment.
The later `0.25.0-dev.1` work adds the final sequence and revises the music.
See [the completion report](COMPLETION-QA-v0.25.0-dev.1.md) for current evidence.
The scores below have not been reassigned from implementation counts.

Arrow Space Shift has implemented spatial mechanics and some completed interface polish.
It remains a development candidate. The required campaign ending is absent.
More optional content is not the next release need.

## Review contract

| Item | Scope |
|---|---|
| Build | `0.24.2-dev.1`; imported v0.24.1 with local changes |
| Source identity | [Candidate file hashes](../reports/review-2026-11-13/candidate.json); Git HEAD `4a1d77e` alone is insufficient |
| Review date and owners | November 13, 2026; Coordinator, Design / Research Support, QA Verification, and audio reviewers |
| Audience | New shoot-'em-up players who can use keyboard controls; this is an intended audience, not a tested participant sample |
| Target | Existing browser game on Windows; desktop keyboard first; compact touch layout also inspected |
| Evidence | Current source, automated tests, browser input, screenshots, retained release records, and official jam pages |
| Sampled states | Level 0 to Level 1; reload; menus; QA-unlocked Act IV stage 1; direct geometry and action fixtures |
| Continuation horizon | Promised four-Act campaign through repair and persistent ending; this complete path has not passed |
| Exclusions | No human session, audible mix review, full campaign playthrough, physical mobile test, or comparison with all other entries |

No gameplay or audio code changed during this review.
Project instructions now link future work to `D:\Projects\games\agents`.
The [task record](tasks/JAM-REVIEW-001.md) identifies the active agents and role instructions.

## Official categories and internal scores

The official categories are Overall, Gameplay, Graphics, Audio, Innovation, and Theme Interpretation.
The inspected jam page does not supply detailed category anchors.
The scores below are internal review judgments, not official votes or predicted results.
See [the official jam page](https://itch.io/jam/game-off-2026).

Use these local anchors for later comparisons:

| Score | Local meaning |
|---|---|
| 1 | Essential implementation is absent or the reviewed function is unusable |
| 2 | Playable systems exist, with material gaps |
| 3 | The sampled intended cases work; material release evidence remains incomplete |
| 4 | Strong expression across several tested conditions; specific limits remain |
| 5 | Complete and refined evidence supports the declared scope and intended audience |
| U | Evidence is insufficient for a quality score |

These anchors are separate from the supporting GD-001 rubric's 0-to-4 scale.
Do not calculate a combined grade from this incomplete category profile.
Unknown audio quality is not zero.

| Official category | Internal score | Evidence strength | Reason and limit |
|---|---:|---|---|
| Overall | 2/5 | Moderate for implementation | Substantial playable content and functional packages exist. The promised final reward, repair, and ending are absent. |
| Gameplay | 2/5 | Moderate for rules; Limited for experience | Manual fire, spatial folds, equipment, capture, and release change available actions. Full continuity, reachable responses, and ordinary campaign completion remain unverified. |
| Graphics | 3/5 | Limited | The inspected title, black space, geometry marks, filled shots, hollow forecasts, and compact HUD form a consistent presentation. Dense fights, all bosses, and player recognition remain unreviewed. |
| Audio | U | Limited technical evidence; no listening evidence | Music patterns and sound cues exist. No retained listening or mix check supports a quality score. |
| Innovation | 3/5 | Moderate for implementation | Space changes distance, paths, orientation, and attack control. Comparative novelty and player value remain unverified. |
| Theme Interpretation | 4/5 | Moderate for mechanical expression | SHIFT changes actual travel, projectile movement, returns, and combat operations. Human recognition and transfer remain unverified. |

The strongest current areas are mechanical theme expression and differentiated spatial operations.
The greatest release gap is completion of the existing campaign.
These ratings do not estimate enjoyment, votes, commercial success, or rank.

## Music: implemented and unfinished work

Music is implemented as synthesized lead and bass patterns in [`src/audio.js`](../src/audio.js).
There are four existing patterns: Act I at 108 BPM, Act II at 123 BPM, Act III at 116 BPM, and recovery at 92 BPM.
Act IV reuses recovery. It does not have a new dedicated composition.
Sound effects cover weapons, warnings, damage, impacts, pickups, folds, capture, release, and emitted crossing events.

The recent update added copied presentation events, separate crossing and capture/release phrases, shared Act IV preferences, and music cancellation on pause.
Saved options include sound, master volume, music, reduced motion, and decorative effects.
The engine uses oscillator tones and filtered procedural noise.
The active asset folder contains no delivered recorded soundtrack or stems.

This is a working audio implementation, not a completed soundtrack production or mix pass.
The full proposed Structural Techno-Cosmism arrangement is absent.
It has no requested percussion/stem hierarchy, intensity arrangement, separate music/effects gain controls, voice stealing, or new Act IV composition.
The Divergent Pulse and audio-only research mode remain proposals.
These optional systems are not required before the jam if the existing audio can be made clear and reliable.

The browser acceptance script disables music before its Act IV sample.
Its AudioContext check establishes startup, not audible music, masking, clipping, or aesthetic quality.
The ten AV tests establish routing and mocked scheduling.
They do not establish a successful dense mix.

A separate controlled browser probe found an audio recovery gap.
After `AudioContext.suspend()` simulates an interruption, Space fire leaves the context suspended.
Pause and resume recovers the same context.
This is a narrow lifecycle defect, not evidence of how often devices cause it.
See [the probe record](../reports/review-2026-11-13/audio-lifecycle.json).

## Polish: what has been done

| Area | Existing implementation or completed polish | Remaining acceptance |
|---|---|---|
| Ship feedback | Existing banking, recoil, exhaust, hit cues, and health trails | Ordinary fights and actual visual recognition |
| Projectile language | Existing filled live shots, hollow future images, and paired marks | Unfamiliar-player collision expectations |
| Act IV layout | Combat, HUD, status, and touch buttons fit one viewport | Physical touch input, long text, and native 200% zoom |
| Menus | Options pauses; Escape closes; focus returns; play stays paused | Complete multi-Act consistency and assistive technology review |
| Checkpoints | Stage-entry score, echoes, and seed survive supported Act IV retry/reload | Complete Act III to Act IV ship and loadout continuity |
| Audio behavior | Separate capture/crossing cues; shared settings; pause cancellation | Listening, masking, volume balance, interruption recovery |
| Distribution | PLAY and SOURCE archives exist; prior extracted PLAY checks passed | Final itch.io upload and hosted startup |

The work includes both implementation and polish.
Functional menu, layout, input, and checkpoint refinements are complete in the checked cases.
Combat balance, the complete artistic finish, and player comprehension have not received equivalent acceptance.

## Interface decision review

The inspected screens provide a quiet title, a clear launch action, persistent hull and score, and a compact combat view.
This is visual evidence, not a measured gaze sequence.

| Analysis axis | Required relationship |
|---|---|
| Constituents | Keep live shots, forecasts, hull, stored attacks, operations, and permanent parts distinct |
| Operations | Keep manual input, authoritative result, visible feedback, and saved reward as separate steps |
| Standards | Preserve accurate warnings, reachable controls, and useful muted play |
| Invariance / Equivariance | Keep projectile identity and critical information through crossings, reduced motion, and resizing |
| Context / Continuation | Keep enough state and explanation for retry, reload, later Acts, and completion |

| Decision | Available information and access | Deadline and retained trace |
|---|---|---|
| Fire or fold | Keyboard labels, field display, manual shot and fold feedback | Before contact; exact rules remain in Guide |
| Read an approaching return | Paired-edge marks, solid live shot, hollow forecast | Before the real return; forecast is not immunity |
| Capture or release | Echo count, action controls, feedback from successful actions | During combat; current resource count remains visible |
| Open settings | Options / Guide opens a paused modal | Before changing options; Escape returns focus and keeps pause |
| Continue after a boss | Physical reward and extraction states in earlier Acts | Before banking; the final Act IV reward remains absent |

No consequential information was removed in this review.
Keep these access paths during later simplification.
Consistent appearance alone does not prove that players understand them.

## Current checks and critical limits

On November 13, `npm run check` passed 165 tests with no failures or skips.
`node tools/browser-acceptance.mjs D:\Projects\games\game-off-2026 reports/review-2026-11-13/browser` passed 32 browser checks.
It recorded no page exceptions or failed resource requests.
See [the current evidence directory](../reports/review-2026-11-13/).

Design reran 43 focused rule tests. Audio reran ten AV tests.
These overlap the full suite. Do not add them to 165 as independent coverage.
The browser sample covers ordinary tutorial input and QA-unlocked Act IV.
It is not an ordinary full-campaign completion test.
The prior release archive check remains November 12 evidence, not a new hosted test.

Supporting GD-001 critical checks remain separate from the official categories:

| Condition | Full campaign status | Reason |
|---|---|---|
| G1: Essential actions | Fail | Required final collection, extraction, assembly, and activation actions do not exist |
| G2: Consequential information | U | Whole-campaign information and costs have not been reviewed with players |
| G3: Truthful action status | U | Sampled events pass; all reward and completion states have not passed |
| G4: Response opportunity | U | Safe responses at actual ship speeds remain unverified in high-risk encounters |
| G5: Persistent consequences | U | Sampled checkpoints pass; full campaign and final completion are incomplete |

No completed GD-001 grade is issued.
The known completion failure remains the readiness headline.

## Confirmed defects and transfer limits

See [the QA verification report](../reports/review-2026-11-13/verification.md) for reproduction and evidence.

| ID | Priority and status | Finding | Required check after repair |
|---|---|---|---|
| QA-AV-01 | P1; confirmed in a controlled interruption | Act IV does not resume a suspended AudioContext when the player fires. P/P restores audio. | Suspend the context during play. A permitted user gesture must recover one context without restarting the flight. |
| QA-TEXT-01 | P2; confirmed in a pickup fixture | The Curvature Seed pickup uses the Klein Relay pickup message in `src/boss.js`. | Check the displayed pickup name for all three existing boss parts. Preserve physical collection and extraction. |
| Progress transfer | P1 coverage gap | Export progress includes the fleet profile. It omits the main checkpoint and Act IV stage data. | Clearly label fleet-only export, or define and test a complete transfer format. Do not promise full progress transfer from the present export. |

The pickup fixture does not prove that the boss encounter was completed through ordinary combat.
The audio probe does not establish a measured device failure rate.
Neither finding requires a new engine or an expanded soundtrack.

## Required next work and scope boundary

| Priority and task | Owner roles | Smallest sufficient result and check |
|---|---|---|
| P0: Campaign continuity | Design, Engineering, Integration, QA | Bridge Act III and IV state. Preserve justified ship/loadout effects and score. Check defeat, retry, reload, and replay. |
| P0: Complete the existing campaign | Design, Engineering, QA | Add final physical part, extraction, dock assembly, short playable activation, ending, and saved completion. Check each state and interrupted reward case. |
| P0: Fairness and geometry defects | QA, Design, Engineering | Reproduce hybrid and Bolza risks. Verify legal reachable responses with actual movement, warnings, and resources. Fix demonstrated failures. |
| P1: New-player review | Playtest Research, Design | Observe the first minute, live/forecast distinction, one crossing prediction, and one unfamiliar transfer case. Record assistance and actual results. |
| P1: Existing audio finish | Sound Design, Audio Production, Engineering, QA | Repair interruption recovery. Capture and review one representative dense scene with current music. Check missing cues, masking, peaks, pause, mute, and resume. |
| P1: Final presentation and release | Art / Technical Art as needed, Integration, QA, Coordinator | Repair observed readability and pickup-text defects. Clarify progress export. Prepare screenshots, controls, credits, AI disclosure, source readiness, and the final playable package. |

The audio task uses the existing music first.
A major soundtrack expansion is not necessary to complete these checks.
Use a separate cue contract if later evidence justifies new audio production.

Keep the engine, four Acts, manual firing, ship differences, actual geometry, and physical extraction rules.
Keep 3D conversion, more ships, more branches, expedition expansion, a new engine, and optional research rooms outside the jam work.
Do not rewrite the collision system solely to obtain a theoretical global solver.
Fix reproduced combat failures and document numerical limits accurately.
Do not remove an existing Act to shorten the work without a user decision.

## Submission requirements and provenance

The deadline is December 1, 2026, at 13:37 PST.
The public GitHub source and itch.io submission are separate required actions.
AI-assisted development is allowed; the submission asks about its use.
The organizer permits starter projects but expects most work during the jam.
Open-source licensing is encouraged, not required.
See [the official GitHub announcement](https://github.blog/open-source/gaming/game-off-2026-the-theme-is-shift/).

The inspected local history begins on November 4 and contains five commits.
Commit dates do not establish when all source or assets were first developed.
The user's earlier note about pre-November work remains a provenance question.
Record the reused work and the work done during the jam before claiming eligibility.
Do not infer either automatic eligibility or disqualification from these dates alone.

The current source notice identifies AI assistance.
It does not select a source license.
Retain the user's authority over the source license and publication.
An update to GitHub does not submit the game to itch.io.
No publication was made during this review.

## Continuation record

Retain `0.24.2-dev.1` as the assessed baseline.
Use the [parent role instructions](../../agents/README.md) for implementation handoffs.
For each repair, record the affected category, preserved rule, reproduction, and acceptance check.
Repeat affected tests after a code change.
Compare later scores only with the same anchors and declared scope.

This report uses short English sentences.
A full ASD-STE100 dictionary and editorial conformity review has not been completed.
