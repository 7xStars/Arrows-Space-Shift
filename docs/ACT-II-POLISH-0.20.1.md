# Arrow Space Shift 0.20.1 — Act II Practice and Records

## Purpose

Version 0.20.1 preserves the completed Act II campaign and adds the tools needed to learn, replay, and evaluate its bullet-hell curriculum. Act I remains unchanged.

## Practice

Recovering the Klein Relay unlocks a dedicated Practice panel. Reached Act II lessons can be replayed with the selected starter hull. Practice uses the real scrolling, Klein traversal, folding, equipment, collision, pattern and grading rules, but it does not:

- Save a campaign checkpoint.
- Award a drive component.
- Change campaign completion.
- Add a campaign attempt to the permanent record.

Completing a campaign stage marks the following stage as reached. An existing relay-only profile begins with Return Flight available. A profile containing the Projective Module can practice all eight Klein lessons.

## Persistent stage records

The fleet profile is migrated to version 3. Existing relay and starter-ship progress is preserved. The profile can now store:

- Reached and completed chapters.
- Best stage grade and grade score.
- Best score and graze count.
- Completion and attempt totals.
- Recent results, selected ship and factual final-hit explanation.

A stage failure creates history without marking the stage complete or advancing the reached lesson list.

## Pattern glossary

The Flight Guide now renders the canonical pattern vocabulary from the same definitions used by combat:

Fan, Sweep, Gap, Aimed, Burst, Wall, Spiral, Crossfire, Return and Convergence.

This reinforces the campaign rule that the grammar remains stable while the geometry changes.

## Death explanations

The retry screen now reports the recorded final cause. Projectile recaps can include:

- Source and pattern.
- Klein, projective or hybrid trajectory.
- Number and last type of surface crossing.
- Damage amplification.
- Whether the fatal damage was an earlier Impact Buffer debt.

## Progress portability

The Options panel can export the validated fleet profile as JSON. Import replaces the current browser profile after checking the game and export format. The operation remains local to the browser; no file is transmitted.

## Controls and accessibility

The guide now displays Up/Down only in Act II scrolling stages, where Up advances toward halfway and Down reverse-thrusts toward the bottom. The scrolling world never reverses. Existing collision-core and pattern-label controls remain available.

## Verification

The automated suite contains 23 passing assertions covering the campaign, wave scripts, folds, grades, grazing, hybrid boss, Projective Module recovery, profile migration, persistent records, practice unlocking, failed-attempt behavior and additive module state.

A Chromium visual smoke test could not be completed in this environment because local and file URLs are blocked by browser administrator policy. JavaScript syntax, module-level behavior, release packaging and the complete Node test suite were verified.
