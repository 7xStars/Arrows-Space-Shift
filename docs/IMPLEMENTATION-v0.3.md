# Arrow Space Shift 0.3 implementation record

Date: November 4, 2026.
Purpose: implement the next prototype proposed in the [0.2 review](CREATIVITY-REVIEW-v0.2.md).

| Recommendation | Implemented result | Evidence or remaining work |
|---|---|---|
| Give the game its own name. | Arrow Space Shift in the live interface, package, documentation, server, and runtime inspection API. | Browser title and runtime checks. Historical source keeps its old title. |
| Start with one field. | The timing course has a one-field limit. Other modes retain three fields. | Rule check rejects a second active field in the course. |
| Test outgoing arrival. | A target opens from 0.55 to 1.20 seconds. | Unfolded continuous fire fails. Folded fire succeeds in the checked thrust cases. |
| Test defensive release. | A visible wide salvo starts inside a folded field. | Keeping the fold fails. Unfolding and steering clears the checked cases. |
| Combine the lessons. | A target hit triggers a guard salvo at the player's current lane. | A folded hit followed by unfolding and steering clears it. The brief does not state that sequence. |
| Remove the score incentive for comparison. | A setup checkbox disables fold bonus points. It stays fixed during a course. | Matched automated courses retain the same times, positions, hull, and outcomes. |
| Preserve the reference. | Separate playable source at `reference/v0.2/`. | Original rule files were copied before modification. Archive checks remain available. |
| Record predictions and explanations. | Optional notes and a local JSON export. | Prediction is captured at start. Explanation remains a separate record. |

The timing course is now a runnable experiment.
The human part of the proposed review has not been performed.
No participant was recruited. No playtest observation was invented.
The original potential ratings remain forecasts.

Read [the playtest protocol](PLAYTEST-PROTOCOL.md) for the next step.
Read [the verification report](../reports/VERIFICATION.md) for executed checks.
