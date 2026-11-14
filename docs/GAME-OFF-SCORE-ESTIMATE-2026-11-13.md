# Game Off score estimate

Date: November 13, 2026.
Owner: `/root`, Research Support.
Task: Estimate the current jam edition's scores on a 1-to-5 scale.

## Scope and method

The candidate is `0.25.1-dev.5`, the three-Act jam edition.
`package.json`, `src/build.js`, and `DESIGN.md` identify this scope.
Git HEAD is `4a1d77e255db437602de68871d9a57c6f47ecc4d`.
The working directory contains modified and untracked files. HEAD alone does not identify this candidate.

The reviewer read the current design, issue register, and completion report.
The reviewer inspected three retained 1280-by-800 game captures from Acts I, II, and III.
No new runtime check, listening session, or human playtest was performed for this estimate.
No game rule or asset changed.

The [official jam page](https://itch.io/jam/game-off-2026) lists six voting categories.
It gives no detailed category scoring rules or weights.
The scores below are estimates of possible participant ratings.
They are not official scores, measured player responses, or statistical predictions.
Overall is a separate judgment. It is not the mean of the other categories.
The earlier `0.24.2-dev.1` review does not describe the current release scope.
No GD-001 index was used.

## Estimate

| Category | Estimate / 5 | Basis and limit |
|---|---:|---|
| Overall | 3.5 | Distinct spatial combat and an explicit Act III finish support a complete jam scope. Learning demands and combat balance can reduce the result. A reasonable judgment range is 3.0–4.0. This is not a confidence interval. |
| Gameplay | 3.0 | Folds change friendly and hostile shot travel. Capture and release add decisions. Unfamiliar-player understanding, encounter fairness, and repetition remain uncertain. |
| Graphics | 3.0 | The captures show consistent gold, violet, and cyan marks on black. Ships are small. Technical labels and large warnings compete with combat information. Motion was not reviewed. |
| Audio | 3.5, tentative | Recorded Act music, title music, synthesized effects, and separate gains are implemented. The retained report records the user's confirmation of audible music and firing. This estimate has the weakest basis: no new listening review assessed composition, repetition, masking, or mix quality. |
| Innovation | 4.0 | Distance folds, identified-edge returns, order-dependent equipment, and projectile capture form a distinct combat system. No survey of competing entries was performed. |
| Theme Interpretation | 4.5 | SHIFT affects actual distance, projectile travel, accepted sides, and boundary returns. It also uses the Shift keys. Recognition by unfamiliar players remains untested. |

## Evidence register

| Source | Use | Limit |
|---|---|---|
| Official jam page, accessed November 13, 2026 | Category names, participant voting, SHIFT theme | No detailed score anchors |
| `DESIGN.md`, `src/build.js`, `src/campaign.js`, `src/upgrades.js` | Edition boundary and implemented rule structure | Source inspection does not establish enjoyment |
| `docs/COMPLETION-QA-v0.25.1-dev.5.md` | Retained completion, reward, replay, and edition checks | Technical evidence; not a full human playthrough |
| `docs/AUDIO-OUTPUT-REVIEW-v0.25.1-dev.4.md` | Retained user confirmation and signal checks | Audibility does not establish musical quality |
| `docs/KNOWN-ISSUES.md` | Remaining fairness, comprehension, and balance questions | Open questions are not confirmed failures |
| `art/marketing/game-off-2026/01-act-i-folded-route.png` | Act I visual inspection | One retained frame |
| `art/marketing/game-off-2026/03-act-ii-returning-fire.png` | Act II visual inspection | One retained frame |
| `art/marketing/game-off-2026/04-act-iii-echo-ecology.png` | Act III visual inspection | One retained frame |

## Recommendation and next check

Prioritize player understanding and readable combat before additional content.
A player who understands the spatial rules could rate the game more highly.
A player who cannot distinguish live shots from forecasts could rate it lower.
The same implementation can support either result.

Observe three to five unfamiliar keyboard players through the opening and selected later encounters.
After play, ask each player to explain what a fold changes.
Use an unfamiliar return case to check the distinction between a live shot and a forecast.
Record assistance, deaths, retries, and the players' own category ratings separately.
Check music and effects together during a dense encounter.
Revisit this estimate after these observations or a material game change.

These are proposed checks. They were not performed in this assessment.
The user owns design and scope decisions.
This estimate does not establish release readiness or authorize publication.

The official ASD-STE100 Issue 9 PDF request returned HTTP 403.
A complete dictionary and editorial conformity review was not performed.
