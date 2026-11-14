# Music revision r2

Candidate: `0.25.0-dev.1`.
Revision: `music-r2`.
Date: November 13, 2026.

Status: rejected by the user after listening.
The eight-bar chord and melody direction did not meet the requested musical character.
See [STC-STUDY-003](tasks/STC-STUDY-003.md) for the replacement study.
This file retains the earlier implementation and test record.

## Feedback and response

The user listened to the initial audio files and reported:

> this sounds like game SFX, not music

The user also said that Act IV was clearer.
The initial files were eight-second stress mixes.
They played several weapon, warning, capture, and crossing cues together every 0.6 seconds.
They did not isolate the musical composition.
The score itself also used short notes with immediate exponential decay.

The revision changes the actual game score.
It uses an eight-bar melodic phrase with a returning first idea and a changed answer.
The harmony follows Dm, Bb, F, C, Dm, Bb, Gm, and Am.
Held bass roots make that cadence explicit.
Chords and melody now have a held sustain section before release.
The melodic phrase continues when combat intensity changes.
Percussion density can still respond to combat.

Act IV retains a thinner sine-led texture and longer gaps.
The action sounds keep their previous short envelopes and event meanings.
The change does not increase master or bus defaults.
It does not change gameplay clocks, motion, damage, or collision.

## Separate review files

All review files are 32 seconds, stereo, 48 kHz, 16-bit PCM.
The offline master gain is 1.0 with the default bus gains.
The files have a short ending fade and no loudness normalization.

| File | Contents | Sample peak |
|---|---|---|
| [Act I music](../reports/audio-0.25.0-dev.1/ass-traditional-music-review-r2.wav) | Score only | -27.31 dBFS |
| [Act IV music](../reports/audio-0.25.0-dev.1/ass-bolza-music-review-r2.wav) | Score only | -32.30 dBFS |
| [Act I illustrative mix](../reports/audio-0.25.0-dev.1/ass-traditional-mix-review-r2.wav) | Score with occasional manual fire, enemy fire, warning, hit, and damage cues | -13.30 dBFS |
| [Act IV illustrative mix](../reports/audio-0.25.0-dev.1/ass-bolza-mix-review-r2.wav) | Score with occasional Act IV action cues | -13.21 dBFS |

The illustrative mixes are synthetic fixtures.
They are not recordings of ordinary gameplay.
Act I contains no capture or Bolza-crossing cues.
The separate `ass-*-mix-stress-r2.wav` files retain dense overlap checks.
Do not use those stress files alone to judge the musical phrase.

Measurements are in [the revision report](../reports/audio-0.25.0-dev.1/results-music-review-r2.json).
All ten revised renders have finite samples and no samples at or above full scale.
The music-only voice peaks were seven for Act I and six for Act IV.
No music-only voice was rejected.
The stress fixtures remained within the 24-active-voice limit.
These results apply to the recorded fixtures.

## Preserved baseline

The original six `ass-*-mix-fixture.wav` files remain unchanged.
The original `results.json` remains unchanged.
Each file matches the previously packaged source ZIP by SHA-256.
See [the preservation record](../reports/audio-0.25.0-dev.1/baseline-preservation-r2.json).

## Checks and next decision

Focused audio, AV, and score tests passed 24 tests.
The full check passed 212 tests and syntax for 47 source and tool files.
New tests check a held gain level, the eight-bar cadence, the continuing melody, and pause cleanup.
No revised listening acceptance is claimed.

First, review the music-only examples.
Then review the illustrative mixes at the same player volume.
Record whether the melody and bass progression remain recognizable under the action cues.
Keep that listening result separate from the PCM peak and voice-allocation checks.
