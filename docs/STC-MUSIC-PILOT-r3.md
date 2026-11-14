# Structural Techno-Cosmism music pilot

Revision: `stc-study-r3`.
Status: implemented and technically checked. User listening acceptance is open.

Historical r3 record. The user found this version closer, then requested harder drums and a different synth character.
See [revision r4](STC-MUSIC-REVISION-r4.md) for the current study.

The user rejected music revision r2.
The new pilot follows the supplied rhythmic and timbral direction.
The earlier reviewed files and campaign release remain preserved.
This pilot does not replace the four-Act soundtrack or change campaign physics.

## Five-axis contract

| Axis | Selected structure |
|---|---|
| Constituents | Pulse, sub, syncopated rim, hats, clap, acid sequence, filtered delay, quiet texture, and gaps |
| Operations | Repeat, accent, tie, slide, filter, saturate, displace a percussion cycle, remove a layer, and return |
| Standards | A clear rhythmic organization; audible slow change; useful action headroom; separate listening and technical results |
| Invariance / Equivariance | The pitch and gate figure persists while cutoff and accent change; real crossing cues retain object motif and use actual destination pan |
| Context / Continuation | A 40-bar form, a quiet interval, return with a new surface, gesture startup, mute, pause, and restart |

The musical phrase is a repeating rhythmic and timbral figure.
It is not the chord sequence from revision r2.
The actual complication stage changes filter brightness by a small amount.
The score never changes enemy timing or collision.

## Runtime contract

Import `StructuralAudio` from `src/stc-audio.js`.
The constructor accepts the existing sound and independent volume options.
Call `unlock()` after a user gesture.
Call `start()` to begin the study from step zero.
Call `update({intensity,phase})` during play.
Call `pause()` and `resume()` for interruption.
Call `stop()` before leaving or restarting the study.

`setMode()` accepts `combined`, `visual`, `audio`, or `mismatched`.
The page must restrict audio-only and mismatched conditions to safe recognition probes.
Visual mode silences the output.
The mismatched mode changes crossing-cue pan only.
It does not change a geometry object or collision result.

`crossing(event)` requires `type: 'crossing'`, `topology: 'bolza'`, stable event and object IDs,
and integer source and destination side indexes from 0 through 7.
It rejects prediction and render-only records.
It rejects a recent duplicate event ID.
It preserves the object's motif through later crossing events.
The actual caller supplies destination pan from verified geometry.
The audio system does not calculate an alternative destination.

The subsequent narrow identity repair adds `announce(event)` and its `attack(event)` alias.
An actual `attack-entered` event announces the stable object/family motif at its source.
An actual crossing then retains that motif at its destination.
Entry records do not increase crossing counts or appear in `crossingHistory`.
The page emits the transfer entry only after the first prediction, or during an unscored audio-only listen.

The trace retains at most 64 cue records.
The recent event and object caches retain at most 128 identities each.
The allocator permits at most 32 transient voices and 96 sources.
Four persistent sources provide the acid oscillator pair and quiet atmosphere pair.
The tested full arrangement reached 18 total active sources.

`diagnosticState()` returns a new data snapshot.
It contains context state, running state, voice counts, recent cue IDs, motif IDs, modes, and pan.
It does not expose mutation of simulation state.

## Files and checks

- [Full original study](../reports/stc-study-r3/ass-identified-return-r3-music.wav).
- [Separate crossing mix](../reports/stc-study-r3/ass-identified-return-r3-crossing-mix.wav).
- [Render measurements](../reports/stc-study-r3/render-results.json).
- [Editable source and production record](../audio/stc-study/README.md).
- [Finite score](../audio/stc-study/score-r3.json).

`node --test tests/stc-audio.test.mjs` passed six tests.
`node tools/render-stc-study.mjs` rendered the 73.64-second study and 26-second crossing fixture in headless Edge.
The measured peaks were about −3.92 and −3.86 dBFS.
No sample was non-finite or at full scale.
No loudness normalization or copied recording was used.
The root integration report records the independent loudness measurement and final hashes.

The browser render does not establish listening acceptance.
The first listening question is whether the pulse, groove, repetition, and timbre change now match the user's direction.
The next question is whether real crossing cues remain clear in that music.
Player prediction and transfer remain separate tests in the playable study.
