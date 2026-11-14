# Arrow Space Shift v0.23.7 — Critical stability and readability

**Development release candidate — NOT deployed to the existing ChatGPT Site.**
Music composition and mix are explicitly deferred at the player's request.

## Fixed level-completion freeze
The route-clear overlay referenced `pace` outside its lexical scope. This
raised a JavaScript `ReferenceError` whenever an ordinary level was cleared,
interrupting the animation frame before the 2.8s automatic transition could
finish. The next-stage checkpoint had already been saved, explaining why a
manual reload resumed correctly. `updateCampaignUI()` now obtains its own
pace snapshot. Browser checks of normal clear transitions in Acts I–III pass.

## Hybrid-geometry cue (ASS-014)
Projective player-wide top/bottom identification is delayed until the existing
2.2s arming pause has completed; existing Klein rules apply beforehand. Phase
2 remains an Antipodal Anchor demonstration. The in-game cue identifies the
projective arming countdown or an imminent join, predicted destination lane,
rough time-to-crossing and orientation rule. This reduces unannounced moves
but does not prove the experimental rectangular quotient is K#RP².

## Act II duplicate-seed value (ASS-017)
Duplicate operation seeds are worth 35 score each as before. Two acquired
within the same Act II stage can restore exactly one lost hull point, once
per stage, with a HUD indicator. At full health the potential patch is retained
until a future duplicate arrives and damage has been taken. Act I is unchanged
and Act III's duplicate Echo limit is unchanged.

## Fresh local server per launch
The Windows launcher selects an unused local port and opens that exact URL.
Both the Python and Node server options send `Cache-Control: no-store`, to
reduce stale-browser confusion if an older build is still bound to port 4177.
The actual server log's 200/304 codes were normal HTTP responses; they did not
indicate a file-server outage.

## Validation and limitations

- Full Node suite: 122/122 passing; source syntax checks passed.
- Chromium in-memory DOM tests: Stage 1→2, Act II 9→10 and Act III 18→19
  advance with no JavaScript page errors; the actual Stage 0 tutorial is
  separately covered by state-machine tests.
- Headless technical sampling of Act II includes real enemy presentation and
  projectiles; one zero-instantaneous-lane snapshot was observed at Klein
  Mastery. This cannot prove either fairness or unavoidable damage.
- Music, first-time human comprehension, full ordinary-health safe paths and
  faithful K#RP² topology remain outside the validated scope.
- No ChatGPT Sites deployment was performed.

See `docs/KNOWN-ISSUES.md`, `docs/ACT-II-THREAT-AUDIT-v0.23.7.json` and
`docs/PLAYTEST-CHECKLIST-v0.23.7.md`.
