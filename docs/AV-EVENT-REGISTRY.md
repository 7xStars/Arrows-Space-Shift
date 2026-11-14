# Implemented audiovisual event registry

## Current update: 0.25.1-dev.1

The 20 event definitions remain stable.
Manual fire now drives bounded mechanical recoil in the main and Bolza renderers.
Actual damage drives bounded coupled feedback. Reduced motion keeps a static outline.
The audio engine uses a bounded map from hostile projectile IDs to motif pitches.
Actual crossings retain that motif and can change its timbre.
Forecasts do not request actual crossing sounds or mechanical impulses.
The adapter still copies presentation data and cannot create collision objects.

Tests: `structural-feedback.test.mjs`, `campaign-recorded-audio.test.mjs`, and the retained AV tests.
The following sections retain the earlier registry description.

Source: [`src/av-events.js`](../src/av-events.js).
Version: `0.25.0-dev.1`.
The registry contains 20 immutable definitions.
It describes the implemented sound routing and existing visual cues.
The renderers do not yet use it as a shared animation engine.

Each definition contains `id`, `type`, `meaning`, `animation`, `sound`, `priority`, `timing`, `invariants`, `fallback`, and `acceptance`.
All definitions require unchanged simulation state and retained identity when supplied.
Their acceptance rule prohibits extra projectiles or collision bodies.
The visual fallback remains in use when sound is off.

| ID | Type | Actual source | Sound cue |
|---|---|---|---|
| ASS-AV-001 | `player.weapon.fire` | `player-fire`; Act IV `fire` | `player-fire` |
| ASS-AV-002 | `enemy.weapon.fire` | `enemy-fire`; Act IV `enemy-volley` | `enemy-fire` |
| ASS-AV-003 | `player.damage` | `damage`; Act IV `hit` | `damage` |
| ASS-AV-004 | `boss.telegraph` | Main campaign and Act IV `pattern-warning` | `pattern-*` |
| ASS-AV-005 | `topology.klein.cross` | `klein-crossing` with actual Klein rule | `klein-crossing` |
| ASS-AV-006 | `topology.projective.cross` | `klein-crossing` with actual projective rule | `projective-crossing` |
| ASS-AV-007 | `topology.hybrid.warning` | `hybrid-phase` | `hybrid-phase` |
| ASS-AV-008 | `topology.bolza.join` | Act IV `player-crossing`, `shot-crossing` | `bolza-crossing` |
| ASS-AV-009 | `preview.future_image` | Explicit forecast event, if supplied | Silent |
| ASS-AV-010 | `module.capture` | `echo-captured`; Act IV `capture` | `echo-captured` |
| ASS-AV-011 | `module.release` | `echo-released`; Act IV `release` | `echo-released` |
| ASS-AV-012 | `fold.phase` | `fold`, `unfold` | `fold`, `unfold` |
| ASS-AV-013 | `stage.recovery` | `wave-break`; Act IV `recovery` | `wave-break` |
| ASS-AV-014 | `boss.defeat` | Act IV `kill` with `boss: true` | `target-hit` |
| ASS-AV-PERIODIC | `topology.periodic.cross` | `klein-crossing` with actual periodic rule | `periodic-crossing` |
| ASS-AV-IMPACT | `projectile.impact` | `enemy-hit` | `enemy-hit` |
| ASS-AV-DESTROYED | `enemy.destroyed` | `target-hit`; ordinary Act IV `kill` | `target-hit` |
| ASS-AV-COLLECTED | `module.collected` | `drive-part-collected` | Pickup cue; Relay resolution for Klein Relay |
| ASS-AV-COMPLETE | `stage.complete` | `chapter-cleared`, `won`; Act IV `stage-clear` | `won` |
| ASS-AV-START | `stage.start` | Act IV `stage-start` | `launch` |

The `boss.telegraph` name also covers existing ordinary enemy pattern warnings.
The hybrid entry follows a recorded phase change.
It does not create an earlier warning or change the phase time.
Preview support is a silent input contract.
The adapter does not generate forecast events.
Some existing effects still use their earlier cue names outside the semantic registry.
The repair's confirmed `drive-activated` event selects its activation phrase through that compatible cue path.
It does not add a twenty-first semantic registry definition.
The final `won` event uses `stage.complete` after the ending finishes.
The Double Torus phase and recovery labels read actual simulation state directly.
The score reads the same phase and recovery interval for its presentation context.

## Presentation record

| Field | Meaning |
|---|---|
| `instanceId` | Reader-generated token for this event object |
| `type`, `grammarId`, `sourceType` | Semantic type, grammar ID, and original event type |
| `simTime` | Original `time` or `t`; current simulation time if absent |
| `cue` | Sound selector; null for a forecast |
| `sourceId` | Supplied source identity, when available |
| `objectId`, `objectIds` | Supplied shot or object identities |
| `worldPos` | Detached position data, when available |
| `topology`, `transform` | Actual rule and mapping data, when available |
| `forecast`, `isPhysical` | Presentation classification; these fields do not create collision authority |

The reader uses source event-object identity for duplicate suppression.
It reads both campaign timestamp formats.
It does not require an array index to remain fixed.
Unknown crossing rules receive no guessed crossing sound.
It does not recover IDs absent from the source event.
`src/projectile-id.js` assigns stable presentation identities to route and boss-map shots.
Their actual movement results emit crossing events in `src/simulation.js` and `src/boss.js`.
These identities do not create extra collision bodies.

The reader permits active ending and completion states as well as combat and result states.
Paused events are consumed without later playback.
`FlightAudio` uses `AV_GRAMMAR[event.type].priority` for actual voice allocation.
Music uses priority 0. Critical warnings and damage use priority 3.
Higher-priority cues can replace lower-priority voices at capacity.
The [audio design record](AUDIO-DESIGN-BIBLE.md) defines the reserve, limits, and fade policy.

## Verification

[`tests/av-events.test.mjs`](../tests/av-events.test.mjs) contains ten focused tests.
They cover immutable definitions, detached records, topology routing, silent forecasts, event order, bounded logs, paused records, successful actions, distinct sound phrases, arrangement selection, and scheduled music cancellation.
[`tests/projectile-av-identity.test.mjs`](../tests/projectile-av-identity.test.mjs) checks real route crossing identity and distinct shot identities.
[`tests/audio-engine.test.mjs`](../tests/audio-engine.test.mjs) checks gain buses, priority allocation, bounded resources, gesture recovery, and ending music.
The [audio browser report](../reports/completion-0.25.0-dev.1/audio-browser/results.json) records five runtime checks.
Those checks include actual oscillator scheduling and recovery from a suspended context.
They do not establish audible output quality or physical latency.
See [the QA report](AV-QA-REPORT.md) for the full suite and browser evidence.

The [imported proposal registry](../imports/downloads-2026-11-12/files/ASS_STC_AV_Grammar_Registry_v1.json)
is preserved separately.
Do not treat every proposed feature as implemented.
