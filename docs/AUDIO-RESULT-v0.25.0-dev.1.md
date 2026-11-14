# Audio task result

Task: `ASS-AUDIO-025`.
Candidate: `0.25.0-dev.1`.
Date: November 13, 2026.

## Delivered

- `src/music.js`: original arrangements for four Acts, sparse recovery, and ending.
- `src/audio.js`: independent gain buses, actual event priorities, bounded voice replacement, bounded noise and soft-distortion caches, filters, restrained panning, gesture recovery, and diagnostic state.
- `tests/audio-engine.test.mjs`: focused mix, allocation, lifecycle, and score tests.
- `tests/render-audio.mjs`: repeatable browser offline-render fixture.
- Updated AV and score regression tests.
- Updated audio design record and task contract.

The existing `FlightAudio` APIs remain available.
The new `resumeFromGesture()` API uses the existing context when one exists.
The new options are `musicVolume`, `effectsVolume`, and `ambienceVolume`.
The page integration owner supplies and saves these settings.

## Initial implementation checks

| Command | Result |
|---|---|
| `node --test tests/audio-engine.test.mjs tests/av-events.test.mjs tests/jam-score.test.mjs` | 22 passed; 0 failed; 0 skipped |
| `npm run check` after integration | Syntax passed for 46 source and tool files; 204 tests passed; 0 failed; 0 skipped |
| `node tests/render-audio.mjs` | Six offline mix renders passed finite-sample and full-scale checks |
| `git diff --check` on the audio source and tests | Passed |

The initial score regression expected the earlier four-note bass array.
The new score uses 16-step bass patterns.
The regression now checks that structure, retained opening motif, valid notes, immutable themes, and matching package/build versions.

## Offline captures

Location: `reports/audio-0.25.0-dev.1/`.
Each WAV is eight seconds, stereo, 48 kHz, 16-bit PCM.
The measurements use the floating-point render before PCM conversion.
The master gain was 1.0.
The music, effects, and ambience gains were 0.55, 0.80, and 0.25.

| Fixture | Measured sample peak |
|---|---|
| Traditional | -13.86 dBFS |
| Klein | -13.86 dBFS |
| Projective | -13.84 dBFS |
| Bolza | -13.84 dBFS |
| Recovery | -13.72 dBFS |
| Ending | -13.71 dBFS |

All six fixtures had zero non-finite samples.
All six fixtures had zero samples at or above full scale.
The fixture uses repeated action sounds and a high presentation-intensity value.
It does not enumerate every possible gameplay mix.
The WAVs are retained for review. They are not accepted production masters.
The fixtures were rendered again after the soft-distortion change.

## Music revision after user feedback

The user listened to the original stress mixes.
The user described the result as game sound effects rather than music.
The user described Act IV as clearer.
This is direct feedback from one listener.

Revision `music-r2` adds an eight-bar melody, held harmony, a bass progression, and sustained envelopes.
The existing action cues retain their decay envelopes.
Act IV retains a thinner sine-led texture and more melodic space.
The revision changes structure rather than increasing overall playback gain.

| Revised check | Result |
|---|---|
| Focused audio, AV, and score tests | 24 passed; 0 failed; 0 skipped |
| `npm run check` | Syntax passed for 47 source and tool files; 212 tests passed; 0 failed; 0 skipped |
| Revised browser offline renders | Four 32-second review files and six eight-second stress files passed finite-sample and full-scale checks |
| Original reviewed-file preservation | Six WAVs and the original JSON match the previously packaged source ZIP by SHA-256 |

The revised review files use `-music-review-r2` and `-mix-review-r2` names.
The revised stress files use `-mix-stress-r2` names.
The original reviewed files and initial measurements remain unchanged.
See [the revision record](AUDIO-MUSIC-REVISION-r2.md).

## Evidence limits and next check

The tests verify event and graph behavior.
The offline render verifies PCM output under its recorded conditions.
The original mixes received the user's feedback above.
The revised music has not yet received acceptance.
No physical device, output latency, or browser suspension policy was measured.
No human cue-recognition target was tested.
Musical quality and mix clarity remain unverified.

The next audio task is a bounded listening session in the packaged browser build.
Use manual fire, capture/release, a real crossing, warning overlap, pause/resume, and mute changes.
Record the browser, output device, settings, actions, and listening notes.
Keep that result separate from the offline PCM measurements.

Role files read under `D:\Projects\games\agents\`:
`README.md`, `shared-workflow.md`, `music-composition.md`, `sound-design.md`, `audio-production.md`, `audio-routes.md`, `audio-experiment.md`, `runtime-contracts.md`, `qa-research-workflow.md`, `templates/cue-contract.md`, and `engines/javascript.md`.
