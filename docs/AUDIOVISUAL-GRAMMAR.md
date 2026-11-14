# Audiovisual grammar

## Current campaign update: 0.25.1-dev.1

The campaign now uses produced recordings through `src/campaign-recorded-audio.js`.
The rejected procedural score remains only for explicit offline tests.
Both stems share an audio timeline. Recovery retains atmosphere and fades the core.
Actual hostile projectile IDs retain motif pitches through verified crossings.
Klein, projective, periodic, and Bolza crossings can change timbre.
Forecast images do not enter the actual-event motif map.
The map is bounded to 128 IDs. SFX retain their 24-voice limit.

`src/structural-feedback.js` consumes copied actual events.
Manual fire excites a bounded second-order drawing response.
Damage excites a normalized coupled response that grows briefly and then decays.
The collision core does not move with either effect.
Reduced motion removes recoil and retains a static damage outline.
Neither the score nor the drawing response changes a simulation result.

See `reports/campaign-music-v1/IMPLEMENTATION.md` and the current completion QA report.
The following sections retain the earlier candidate's detailed vocabulary.

Version: `0.25.0-dev.1`. Date: November 13, 2026.

This candidate extends the event layer from the STC-AV proposal.
It adds original adaptive arrangements, independent mix gains, and priority-based sound allocation.
It retains most existing combat animation.
It adds final-boss phase information and the playable repair and ending view.
It does not implement the complete STC-AV specification.

The separate [Act music grammar](STC-ACT-GRAMMAR-r1.md) adds sixteen original listening studies.
It names musical operations and their preserved properties.
It does not add new simulation events or treat the music timeline as a warning source.

## Event flow

The simulation records an action or a crossing.
`AVEventReader` reads each event object once.
`adaptAVEvent` copies selected data into an immutable presentation record.
`FlightAudio` selects a sound from that record.
The grammar priority controls voice admission and replacement.
`src/music.js` selects an arrangement and layers from actual game state.
The existing renderers continue to read simulation state and visual events directly.
They do not yet consume this registry as a shared animation engine.

The reader accepts main-campaign `time` fields and Act IV `t` fields.
It retains event order when a bounded log removes old entries.
It rejects future events and events more than 1.5 simulation seconds old.
It consumes events without sound while play is paused.
It permits confirmed events during the repair ending and completion states.
It does not modify health, movement, collision paths, shots, or rewards.

## Visual and sound relationships

| Event | Existing visual form | Sound in this candidate | Required meaning |
|---|---|---|---|
| Manual fire | Muzzle pulse and filled projectile | Short weapon tone | A manual shot was fired |
| Player damage | Hit ring and hull display | Damage noise and descending tones | Hull damage occurred |
| Klein crossing | Paired notch and mapped continuation | Short rising interval | The same object crossed the join |
| Projective crossing | Opposed ticks and mapped continuation | Two descending tones | The projective rule applied |
| Periodic crossing | Parallel edge marks | Short steady tone | Direction was retained |
| Bolza crossing | Paired letters and arrival ring | Two connected rising tones | The actual paired edge was crossed |
| Successful capture | Echo count and capture feedback | Converging tones | Capture succeeded |
| Successful release | Released echo trajectories | Expanding tones | Release succeeded |
| Future image | Hollow outline and dashed lead-in | Silent | A conditional forecast is shown |
| Double Torus phase | Phase number, hull, warning, recovery ring | Actual attack warning phrase | The next pattern follows the displayed state |
| Drive activation | Compressed route rings and ship departure | Activation phrase and ending arrangement | The repair circuits succeeded |

Object and source IDs are retained when the event supplies them.
Route shots and boss-map shots now retain presentation IDs through actual crossings.
The simulation emits those crossing records from its real movement result.
The adapter does not infer an identity from the screen position.
A sound does not create a projectile, an image, or a collision body.
No cue grants immunity after a crossing.
Collection does not mean that a component was extracted or banked.

## Music and mix

Act I uses a syncopated electro and mechanical arrangement.
Act II uses repeated pulse and resonant bass filtering.
Act III uses an EBM and industrial arrangement.
Act IV uses a sparse ambient, hypnotic, and acid arrangement.
Recovery and ending have separate sparse arrangements.
Actual shot density, active enemies, boss state, and folds select presentation layers.
No collision or attack waits for a musical beat.

Music, effects, and ambience have independent gains below the master gain.
Critical warnings can replace lower-priority sounds at capacity.
These controls do not replace silent-play visual information.
See [the audio design record](AUDIO-DESIGN-BIBLE.md) for the synthesis and lifecycle contract.

## Limits and references

The reader does not infer a crossing from a screen jump.
The registry describes 20 semantic families.
It is not a complete shared animation engine.
The optional motion presets, full production-stem workflow, and operator laboratory remain outside this slice.
The optional Divergent Pulse encounter and sound-operation laboratory are not implemented.
Human recognition and transfer remain unmeasured.
Offline PCM checks and browser scheduling checks do not establish audible quality.
The [audio task result](AUDIO-RESULT-v0.25.0-dev.1.md) records that evidence boundary.
See [the QA report](AV-QA-REPORT.md) for executed checks and release limits.

The imported [design PDF](../imports/downloads-2026-11-12/files/Arrow_Space_Shift_Structural_Techno_Cosmism_Design_Bible_v1.pdf)
and [proposal registry](../imports/downloads-2026-11-12/files/ASS_STC_AV_Grammar_Registry_v1.json)
remain source references.
See [the implemented event registry](AV-EVENT-REGISTRY.md) for the current mappings.
