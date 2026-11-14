# Campaign concept and browser review

Date: November 13, 2026.

## Review records

`baseline.json` records the frozen source identities.
`../../docs/CONCEPT-APPLICATION-REVIEW.md` contains the baseline concept ratings.
Those ratings measure implementation coverage. They do not predict jam votes.

The current user heard the baseline procedural score and rejected its musical fit.
This is one listener's feedback. It is separate from unfamiliar-player comprehension.

## Browser method

`../../tools/campaign-full-browser.mjs` opens a separate headless Edge context.
It starts with empty browser storage.
The controller uses real keyboard and pointer input.
It reads the public state snapshots and saved records.
It does not set game state or create saved rewards.
It uses the actual renderer and its combat visibility checks.
It targets only enemies that the renderer reports as visible.
The returned main-campaign copy keeps only its last 200 event records.
This reduces browser-to-controller data transfer.
The game retains its full event history and all physical objects.
The controller saves observed hull losses separately.

The default run advances the Playwright browser clock between input decisions.
The browser executes its scheduled update and render frames.
The script does not call the simulation tick.
Pointer actions bypass the frame-stability wait while that clock is stopped.
The script first checks that each target control is visible and enabled.

The audio clock remains separate.
This run cannot establish listening quality, music synchronization, physical latency, or device frame rate.
The controller has more exact state information than a person.
It cannot establish human comprehension or attack fairness.
A loss can result from the controller rather than an impossible encounter.

Run a wall-clock version with `--real-time`.
Run a virtual-clock version without that option.
Use a new output directory for each run.

```powershell
$env:ASS_PILOT_SECONDS='4800'
$env:ASS_PILOT_RETRIES='8'
$env:ASS_PILOT_STEP_MS='50'
node tools/campaign-full-browser.mjs . reports/campaign-concept-review/candidate-full
```

The script saves each section result before continuing.
Its final result must state full completion before a complete browser path is claimed.
The earlier clock and policy checks are incomplete probes.
Their failure records remain available.

`pilot-baseline-act-one-r3` was stopped after six scrolling clears.
This preserved capacity for the integrated candidate run.
It is an incomplete baseline probe.
`candidate-full-r1` was stopped before the full run.
The controller then received shorter input steps for Act IV and the repair dock.
Neither interrupted probe establishes campaign completion.

`candidate-full-r2` uses the frozen integrated source at
`G:/Music Projects/Arrow Space Shift/scratch/campaign-candidate-20261113`.
Its build text still says `0.25.0-dev.1`.
The source hashes identify the integrated runtime before the planned `0.25.1-dev.1` label change.
`candidate-full-r2/results.json` retains a controller timeout in Act IV lesson 1.
`candidate-continuation-r3/results.json` retains the successful earned-profile continuation.
The official export function built a recovery file from the exact captured storage.
The normal file control imported it without an invented part or progress value.
`FRESH-CAMPAIGN-BROWSER.md` gives the full linked result and its limits.
`linked-acceptance.json` passed 19 record checks for the 37 completed encounters and saved ending.
Do not describe this linked result as a single uninterrupted run.
The running Node controller received this copied-event limit at ordinary Act II progress.
`readback-instrumentation-r2.json` records the change.
The instrumentation changed no game state and created no earned reward.
The initial inspector URL attempt made no change.

## Submission gates

The [official jam page](https://itch.io/jam/game-off-2026) lists six voting categories.
It requires source on GitHub and a separate itch.io submission.
The deadline is December 1, 2026, at 13:37 PST.

The [official announcement](https://github.blog/open-source/gaming/game-off-2026-the-theme-is-shift/) permits starter projects and AI assistance.
It requires most development to occur during the submission period.
It asks participants to disclose AI use.
Open source licensing is encouraged, but no particular license is required.

The inspected local history has five commits that start on November 4, 2026.
This does not establish when all code and assets were first made.
The user's report of earlier work remains an unresolved provenance item.
Do not claim eligibility or disqualification from commit dates alone.

No source license was selected during this review.
No repository push, upload, or jam submission was made.

## Human check still required

Use an unfamiliar player for the first exposure.
Let the player start and fire without coaching.
After a real return, ask where the same projectile will go next.
Then show another pattern with the same boundary rule.
Compare predictions with music on and off.
Keep assistance, incorrect collision expectations, and missed warnings in the record.
Do not count repeated attempts by one person as independent participants.

No new human session was performed for this report.
Full ASD-STE100 dictionary and editorial review is incomplete.
