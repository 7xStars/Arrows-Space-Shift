# FOLD-LESSON-016

Owner: /root. Modes: Coordinator, Design, Engineering, and QA in sequence.
Status: Done for local implementation and declared checks.
Baseline: 0.25.1-dev.5 over modified Git HEAD 4a1d77e. Candidate: 0.25.1-dev.6.
Target: existing JavaScript Canvas game on Windows and Microsoft Edge.

## User decision

Teach fast through actions and consequences. Keep tension and normal simulation speed.
Treat Shift primarily as a route-speed decision. Keep automatic drive faults.
Keep Space active during fold and unfold. Do not add explanatory panels or campaign content.
Difficulty is intentional. This task does not lower campaign difficulty.

## Design contract

The existing training enemy appears when movement ends, before the first shot.
Its shots use the existing aiming warning and ordinary damage rules.
Space remains available through the fold and unfold steps.
The same target remains present throughout those actions. No target replacement, shot clearing, or health reset occurs on unfold.
The target can die before both Shift actions. In that case, combat completion takes precedence over the input checklist.
Do not protect the enemy to force input compliance.
The target has ten hull points so sustained fire and compressed shot travel remain visible in the same encounter.
The lesson retains existing short control cues. It adds no prose panel or mandatory delay.
Field presentation must show the actual compression. Projectile speed gain remains identical for both owners.

Scrolling levels gain a separate speed grade and a clear bonus.
The reference time is route length divided by SCROLL_SPEED. This is a fixed open-space reference, not a population ranking.
The speed score is 100 times the saved fraction of reference time divided by 0.7, clamped to 0–100.
Speed letters use the existing 92/82/70/55/40 thresholds. Open-space time earns zero speed points.
The clear bonus is ten times the speed score, capped at 1,000 points.
Award the bonus once, after route completion and pending player damage resolution.
Keep the combat grade separate. Do not grade the tutorial or boss extraction against scrolling travel time.
Use the existing route progress and clear result text for speed feedback.
Use cameraZ for displayed route progress and route completion in all scrolling levels.
The ship's position within the view must not create an early clear bonus.
Preserve saves, automatic folds, three-Act scope, and current collision rules.

## Checks and limits

Check early enemy presence, sustained fire across both Shift actions, damage, early kill, retry, and automatic Level 1 handoff.
Compare actual folded and open projectile travel. Check both projectile owners.
Check speed curve bounds, monotonic rewards, pause-independent simulation time, and one-time award.
Run the game test suite and an isolated real-input browser check.
Keep technical results separate from quick-learner understanding and enjoyment.
No publication is part of this task.

## Result

Engineering implemented the contract. QA passed 322 automated game tests and 44 browser checks.
The [result report](../FOLD-LESSON-RESULT-0.25.1-dev.6.md) identifies evidence and limits.
Quick-learner comprehension and enjoyment remain unverified.
No archive, commit, or publication was produced.
