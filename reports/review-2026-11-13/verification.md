# QA verification report

Report: ASS-QA-2026-11-13. Active role: QA Verification and Triage.
Scope: assessment only. No game source changed.

## Candidate and scope

| Field | Record |
|---|---|
| Contract | `DESIGN.md`; user completion directive; `D:/Projects/games/agents/runtime-contracts.md` |
| Source | `D:/Projects/games/game-off-2026`; local working candidate `0.24.2-dev.1` |
| Git HEAD | `4a1d77e255db437602de68871d9a57c6f47ecc4d` plus uncommitted imported source |
| Content | Acts I–III share the main runtime. Act IV uses a separate Bolza runtime. Main checkpoint v1; fleet profile v5; Act IV data v2 in the existing `act4:v1` key. |
| Environment | Node 24.15.0; npm 11.12.1; Windows build 10.0.26300; headless Microsoft Edge 157.0.4341.46 |
| Input and fixtures | Real automated keyboard and browser clicks for the tutorial and local-QA Act IV. Separate targeted audio interruption and reward-text fixtures. |
| Exclusions | No human session, physical mobile device, audible listening, full campaign clear, new package build, deployment, or source repair. |

`source-hashes.json` identifies the source, tests, and tools used. Their hashes were unchanged at the end of this assessment. Git HEAD alone does not reproduce this working candidate.

## Check results

All commands ran from the project root.

| Check | Command or procedure | Result | Evidence |
|---|---|---|---|
| Syntax and regression | `npm run check` | Passed: 36 source/tool syntax checks; 165 tests; 0 failures, cancellations, skips, or todo tests | `npm-check.txt` |
| Browser acceptance | `node tools/browser-acceptance.mjs . reports/review-2026-11-13/browser` | Passed: 32 checks; no page exceptions or failed resource requests | `browser/results.json`; PNG files |
| Audio interruption | `node reports/review-2026-11-13/audio-lifecycle-probe.mjs` | Failed automatic recovery. Explicit P pause/resume recovered one context. | `audio-lifecycle.json` |
| Reward identity text | `node reports/review-2026-11-13/curvature-pickup-probe.mjs` | Failed: Curvature Seed pickup reports a Klein relay | `curvature-pickup.json` |
| Local provenance | `git log --reverse --format='%H %aI %cI %s'` | Observed five commits, all dated November 4, 2026 | `git-provenance.txt` |

Browser acceptance covers ordinary tutorial movement, manual fire, both Shift keys, automatic entry into Level 1, checkpoint reload, settings, the Act IV lock, a real Bolza crossing, fold input, modal behavior, and compact layouts. Act IV uses `?qa=1`; this does not verify the normal Act III handoff. The 640x450 check is a CSS viewport check. It is not native 200% browser zoom. No screenshot comparison or new visual acceptance was performed by this reviewer.

## Defects and gaps

| ID | Severity / priority / confidence | Finding and reproduction | Owner and next action |
|---|---|---|---|
| QA-AV-01 | Medium / P1 / high | Launch Act IV with sound enabled. Suspend its running AudioContext through the probe. Continue with Space. The context remains `suspended` while play remains active. P then P resumes the same context. | Engineering and Audio: define interruption recovery. Add an appropriate gesture-based resume path or a visible recovery action. Retest real browser interruption separately. |
| QA-TEXT-01 | Medium / P2 / high | In the existing Curvature Gate reward fixture, collect `curvature-seed`. `src/boss.js:269` displays `Klein relay aboard. Cross the exit to bank the part and unlock the starter fleet.` | Engineering and Design: use the actual part identity. Check all three pickup messages. |
| ASS-021 | High / P0 / high | Act IV loads only the Curvature Seed unlock and separate stage data. Selected ship, equipment, score, and campaign context do not transfer from Act III. `src/app.js:74` clears the main checkpoint after the banked seed. | Engineering and Design: specify and implement an additive handoff. Keep unsupported equipment effects explicit. Verify reload and retry across both pages. |
| Completion gap | Critical / P0 / high | Final physical component, extraction, drive assembly, playable activation, and persistent campaign ending are absent. Act IV `completed` means nine encounters cleared. | Design and Engineering: define distinct reward and completion states before implementation. |
| ASS-014 / ASS-015 | High release risk / P1 / unresolved | Hybrid warning predictability and reachable responses to layered attacks lack full normal-play evidence. No unavoidable hit was established by this assessment. | Engineering and Playtest Research: verify actual movement paths, warnings, hull limits, and later encounters. |
| ASS-020 | High release risk / P1 / high for coverage gap | Act IV tests prove selected pairings and lesson-one simulation. Collision uses finite steps and a home-plus-eight-neighbor distance search. All nine encounters, corner cases, and dense performance are not verified through ordinary play. | Geometry and QA: test paired edges, vertices, simultaneous motion, normal-health completion, and frame budgets. |
| Save transfer coverage | Medium risk / P1 / high | `src/app.js:298` exports the fleet profile. It omits the main checkpoint and Act IV stage data. Moving to another browser origin cannot restore all progress from this export. | Engineering and Design: define full transfer coverage or clearly label the export as fleet-only. Verify blocked writes and invalid imports. |

The audio probe deliberately calls `AudioContext.suspend()`. It proves the narrow recovery failure. It does not establish how often a device interrupts audio. No audible playback, mix, clipping, or physical latency review occurred.

## Documentation and provenance

The current QA document correctly limits its 32 browser checks and its AudioContext assertion. Its automated count matches this rerun. The audio record correctly states one common gain, voice rejection rather than stealing, and reuse of existing recovery music in Act IV.

The known-issues register does not yet record QA-AV-01 or the wrong Curvature Seed pickup text. The release evidence needs a full interruption-recovery row. The completion ledger correctly keeps final repair and the unified campaign open.

The user's directive reports development before November 1. The local Git record starts on November 4. This limited import history cannot confirm or reject earlier development. No jam eligibility conclusion is supported. Retain the reported earlier history and obtain source provenance before submission. No remote data was changed.

## Minimum release acceptance

1. Complete the Act III to Act IV handoff and all final reward/repair states.
2. Demonstrate a fresh-profile campaign ending with ordinary controls and normal damage.
3. Reload after each Act transition and each final reward state. Verify that early exit and defeat do not bank unearned rewards.
4. Repeat with supported existing profiles. Test failed writes, migration, retry, and full progress transfer.
5. Resolve or explicitly mitigate geometry, warning, and reachable-escape risks. Verify each Act IV encounter.
6. Run the candidate's extracted PLAY ZIP in the target browser. Check audio interruption, silent play, reduced motion, and representative density.
7. Obtain human comprehension and physical-device evidence. Keep its conclusions separate from automated results.
8. Complete asset/AI records, jam provenance, and publication materials. Keep GitHub and itch.io publication as separate steps.

Readiness recommendation: retain this as a local development checkpoint. Block a claim of game-jam completion. The next implementation should address the shared Act IV handoff. The Coordinator owns the final scope and task state.

Writing limit: full ASD-STE100 dictionary and editorial conformity were not reviewed for this report.
