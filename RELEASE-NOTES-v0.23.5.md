# Arrow Space Shift v0.23.5 — Stage 0 Flight Training

**Downloadable development candidate; not deployed to the existing ChatGPT Site.**

## Stage 0 now teaches controls in the requested sequence

1. **Use Arrows (← →) to move.** Both directions must be exercised; the tutorial does not add axial movement to Act I.
2. **Use Space to shoot.** At least one actual player projectile must be fired. Firing before completing movement does not advance the lesson.
3. **Use L.Shift to fold / R.Shift to unfold space.** The fold must really be created and removed; an empty-space R.Shift press does not count. With multiple test folds, the tutorial waits until the field stack is empty.
4. **Destroy the training enemy.** Only after the fold and unfold lesson does a harmless, one-hit target appear. Earlier practice projectiles are cleared so they cannot kill it before this step.
5. **Level 1 begins automatically** after a brief (approximately one-second) completion beat. A short **LEVEL 1 · TWO SIDES** announcement appears without asking for another button press. The game saves the new Level 1 section checkpoint.

## Safety and compatibility

- No enemy firing, damaging-drive faults, asteroids, or fold-wake spawns in Stage 0.
- No new controls, attack patterns, or balance changes in Level 1 through Act III.
- Existing campaign checkpoints, recovered geometry modules, and selected ships continue to work.
- The first training shot is not required to hit a target; the final enemy establishes aiming and destruction separately.
- This is a downloadable build, not a claim that the existing Sites project has been updated.

## QA

- Five new automated tests verify ordered input, real fold/unfold, harmless enemy, automatic Level 1 handoff, checkpoint format, and preservation of later chapters.
- Execute `npm run check` to run syntax checks and the complete regression suite.
- Human/browser visual testing of the transition animation remains desirable; Chromium headless did not initialize successfully in the current container.
