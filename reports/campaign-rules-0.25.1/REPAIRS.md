# Campaign rule repairs

Candidate: 0.25.1-dev.1 work in progress. Date: 2026-11-13.

Mode: Engineering and QA Verification. The coordinator owns integration.
This report covers rules and simulation checks. It does not report human play.

## Baseline and scope

The working source was 0.25.0-dev.1. Acts I–III use the main runtime.
Act IV uses a separate Bolza runtime. The repair dock uses a third small runtime.
The assigned baseline check passed 41 tests. See `baseline.txt`.
The unmodified assigned files were copied to the G: scratch folder.
See `baseline-files.json` for their hashes and paths.

The current user instructions require Left and Right steering in Acts I–III.
They prohibit Up and Down control of campaign position, thrust, and facing.
The imported design still permitted axial input after the Klein Relay.
The coordinator resolved this conflict in favor of the current user instructions.
Act IV local drive controls and repair controls remain active.

## Implemented repairs

| Issue | Change | Verification |
|---|---|---|
| ASS-022 | Main campaign ignores axial input. Forward scrolling, side traversal, facing transport, and lower-half bounds remain. | State equality under neutral, Up, and Down inputs across training, route Acts, and bosses. |
| ASS-014 | Hybrid phase recovery cannot disarm an active player join. The first arming deadline remains fixed. | Three transition regressions and the existing hybrid and geometry tests. |
| ASS-020, local case | A jump in one motion segment no longer disables collision checks on every real segment in that tick. | Real pieces before and after a jump remain eligible. The jump chord stays excluded. |

The source keeps manual fire. It does not change hull, damage, or invulnerability.
It does not change Bolza side-pairing maps or projectile geometry.
The old Down request was removed from the simulation pilot tool.

### Hybrid warning timing

The initial phase-three or phase-four entry still has a 2.2-second warning.
If the next phase starts before that deadline, the original deadline remains.
If the join is already active, attack recovery does not change the join.
The phase event records the real deadline and current join state.
The coordinator owns the matching display change.

### Bolza collision scope

Each native motion segment receives its tick time interval.
The kernel uses intrinsic steps of at most 0.015.
The sweep compares real segment pairs only when their time intervals overlap.
It evaluates simultaneous endpoints and a local relative closest candidate.
It uses geodesic interpolation and hyperbolic distance for those checks.
It excludes every raw paired-edge jump chord.

This repair retains a local approximation. It is not a global collision solver.
The small interval that contains an actual edge jump is not swept.
Endpoint checks still use the existing depth-one quotient search.
Vertex ambiguity and deeper shortest paths remain limits.

## Executed checks

| Command or check | Result |
|---|---|
| Baseline five-file test command in `baseline.txt` | 41 passed |
| Control tests and affected relay, ecology, and ship tests | 27 passed |
| Hybrid, critical-fix, geometry-cue, and manifold tests | 29 passed |
| Act IV segment, completion, and campaign tests | 23 passed |
| `npm run check` | 277 passed; syntax check passed |
| `pilotCampaign` for ship IDs 0, 1, 8, and 3 | 36 Act IV stages cleared through normal actions |
| `node tools/pilot-main-campaign.mjs reports/campaign-rules-0.25.1/main-pilot-final.json 2026 3 --full` | Fresh-profile complete simulation chain |

The full-chain run cleared training and 27 main sections.
It used 27 main attempts and no retry. The final main hull was 4.
It then cleared nine Act IV stages and extracted the Hyperbolic Core.
It assembled the drive, completed the repair, and saved the ending state.
The run began before removal of the obsolete Down request from its controller.
The corrected source ignored that request throughout the run.

These controllers use normal action APIs. They do not add hull or damage.
They do not remove threats. They do not write positions.
They use the normal APIs for progress and rewards.
The main controller uses a no-output canvas proxy for renderer visibility.
These results are simulation evidence. They are not browser input tests.
They do not establish that each pattern has a fair escape path.
They do not establish player understanding or device frame-rate targets.

## Equipment limit in Act IV

The separate runtime retains all seven Paley-7 equipment records.
It does not apply their seven operations to Bolza projectiles.
An intrinsic port needs all of these rules:

- A receiver frame and signed source side.
- Ordered entry tests and counter interactions.
- Tangent velocity and curvature transport.
- Position Warp path splitting.
- Held-shot collision and retained damage debt.

An untested damage modifier would change the equipment identity.
No such substitute was added. The coordinator will disclose this limit at entry.
Ship movement differences, fold phase, capture, and release remain active.

## Remaining release checks

The independent browser agent owns the full ordinary-keyboard campaign run.
Human comprehension, broad seed fairness, and device performance remain open.
The coordinator owns menus, final source packaging, and submission records.
Use `final-files.json` to identify the assigned source and regression files.
Do not use these test counts as proof of release readiness.
