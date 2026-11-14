# Arrow Space Shift — Game Off experience pass 0.23.1

**Status: packaged development candidate, NOT deployed to the existing Sites project.** Built from the version 0.23.0 source archive. No claims of human playtest scores or full topological correctness.

## Goal

Preserve the five-minute Act I and the existing campaign, while making its mechanics easier to perceive, explain, and use. The Game Off 2026 theme is SHIFT; in the shipped candidate, shifting remains an actual spatial rule rather than an overlay. The central interventions target first-minute clarity, geometry feedback, five-minute audiovisual arc, meaningful pickups, and evidence collection.

## Changes

1. **Approaching joins, including hybrid projective transport.** New `src/geometry-cues.js` forecasts crossings using the same `traceKlein` and `traceKleinProjective` boundary transformations as combat. In the game arena, a small cue identifies current-course exit points, orientation changes, and imminent hostile return edges. A non-color-only, accessible text message reinforces the cue. A short two-note warning sounds on approach. Forecast times are **approximate** and conditional on maintaining the current course; folds and steering can change them.
2. **Hybrid tangent-direction correction.** A projective top/bottom crossing reverses the projectile or enemy object's lateral direction in the current experimental hybrid implementation. The previous code updated this for the pure projective boss path but could omit it in the hybrid case. This does **not** prove the geometry is the connected sum K#RP².
3. **Original adaptive score.** The procedural audio system now schedules an original, sparse musical motif, with familiar material inverted or developed across traditional, Klein, and projective phases. The first Klein Relay collection has a distinct four-note reward cue. A quieter recovery variation plays while retrieving and extracting the boss module. Sound starts only after user interaction unlocks Web Audio; music defaults on for new players and remains opt-out in Options. Existing saved preferences are respected.
4. **Klein Relay presentation.** The existing physical pickup and extraction rules are unchanged. Brief on-field headlines now distinguish EXPOSED, ABOARD, and BANKED; the victory screen names the newly unlocked Klein traversal. The relay only becomes durable after extraction.
5. **Duplicate pickup value, outside Act I.** A collected operation seed already owned by the player yields 35 score in Act II/III. In Act III only, up to **two duplicates per stage** can additionally become one stored Echo each, if there is capacity. This gives a controlled tactical resource without changing the seven operation identities, slots, or counters, and without altering Act I loot.
6. **Blind playtest instrument.** `playtest.html` is a standalone five-minute test form. It records unaided comprehension, perceived causes, learning transfer, enjoyment, category ratings, and player comments; exports JSON locally; sends nothing over the network. The Guide contains a link. No respondents have been tested yet.

## Test basis

- Existing 59 source tests retained; 18 targeted tests added across geometry forecast, duplicates, audio, playtest protocol, and renderer smoke.
- Syntax checks and clean archive testing are part of the release gate.
- Renderer smoke tests use a fake canvas; **not** an ordinary visual playthrough.
- The local Chromium screenshot attempt did not produce a screenshot in the current container; do not claim visual UX acceptance.

## Remaining release blockers

- ASS-014: The hybrid boss still uses a projective-inspired rectangular quotient, not a mathematically established faithful K#RP² connected sum. Crossing cues are now available, but actual destination correctness and player comprehension must be tested under ordinary play.
- Human playtest evidence is absent. Ratings and player comprehension targets are hypotheses until collected.
- Audio composition, mix, speaker/headphone levels and tempo need ordinary listening tests.
- Automated tests do not prove all encounters have feasible safe paths for all ships or that damage feels fair.
- Existing ChatGPT Site deployment is separate; this ZIP is not a publish action.

## Manual acceptance path

1. On a fresh browser profile, start the ordinary campaign without reading the Guide. Record whether firing and folding can be discovered unaided in the first minute.
2. Clear the approximately five-minute Act I with Arrow. Verify the core and escorts, the appearance of the Klein Relay, physical collection, distinct reward cue, extraction, and transition to the ship choice.
3. Cross Klein joins intentionally in Act II with Arrow and Needle; verify the destination marker, orientation, bottom/halfway movement limits, and incoming projectile cues.
4. Use QA (localhost `?qa=1`) to enter the hybrid boss and change through its phases. Verify active projective warnings, actual crossing transforms, no unexpected visual jumps that lack either a real crossing or an error log.
5. During Act III collect duplicate operation seeds, verify two capped Echo conversions per stage and manual release/spend.
6. Listen with music enabled, muted, and reduced-motion enabled. Verify that music never starts before user interaction, that sound can be turned off, and no dangerous projectile cue is lost under effects.
7. Ask blind players to complete `playtest.html` independently, then examine failure clusters rather than only average ratings.

The game requires actual player feedback before any numerical improvement claim about Overall or category ratings.
