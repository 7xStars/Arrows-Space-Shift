# Arrow Space Shift v0.23.4 — Continuous Act Progression

**Downloadable development build. Not deployed to the existing ChatGPT Site.**

## Fixed: boss victory restarting the campaign

Previously, the global victory button had a generic `Fly again` fallback to
`start('campaign')`, which starts the Level 0 tutorial. This could trigger after
replaying the Klein Fleet with both modules already unlocked or during other
boss-end states. Boss success also cleared the active checkpoint, so closing
or reloading the game after extraction could abandon an Act transition.

- **Act I → II:** Recover and extract the Klein Relay, choose a ship at the
  fleet dock, then launch **Return Flight (Level 9)** with the same campaign
  seed, inventory, equipment, score and progress.
- **Act II → III:** Recover and extract the Projective Module, then launch
  **Projective Chart (Level 17)** without recreating the campaign or returning
  to Level 0.
- **Act III:** Curvature Seed recovery ends the currently implemented campaign.
  The result screen explicitly reports that the final hyperbolic Act is not
  playable yet. There is no fake onward transition and no automatic restart.

All boss victories are handled by explicit transitions. A campaign boss result
never falls back to the generic noncampaign `Fly again` action.

## Save/reload behavior

Once a boss part is **banked by extraction**, a next-Act section-entry checkpoint
is saved (when browser storage is available). Reload at this point opens a
specific Act II or Act III continuation screen rather than Level 0. Old
checkpoints remain compatible with the existing version-1 checkpoint format.
Act II's dock still asks the player to select a ship explicitly; reloads at
that dock offer the same choice. Ordinary section reloads do not change ships.

Permanent modules and hulls remain additive and are not consumed during the
transition. The manually selected `New run` action remains available and
explicitly begins Level 0 while preserving permanent unlocks. The title screen
continues to offer the separately named Act II/III skip buttons.

## Tests

The source checks exercise both actual boss handoffs, replay with all modules
already owned, retry and reload through next-Act checkpoints, invalid or missing
boss unlocks, migration of older checkpoint records, and the explicit Act III
terminal state. Existing tests verify the fold, Klein traversal, boss, ecology,
foundry, audio, and visual renderer logic.

## Not changed

Act I tuning and original enemy waves, 0.23.3 Fold Wake, Klein surface reverse
orientation and vertical bounds, Act II/III gameplay content, weapon grammar,
and physical pickup/extraction behavior are unchanged. The experimental hybrid
geometry and deferred ASS-014 teleport warning remain separate QA items.
