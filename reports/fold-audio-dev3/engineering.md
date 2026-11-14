# Fold music investigation

Role: Engineering.
Project: `D:\Projects\games\game-off-2026`.
Baseline: `0.25.1-dev.2`.
Scope: Music continuity. No simulation, topology, collision, damage, or save rule change.

## Contract

Folding must keep the current composition and playback position.
Unfolding must not be necessary to resume music.
Pause, mute, title Stop, and page hiding must keep their existing effects.
A recording error must not start the rejected procedural score.

## Observed defect and repair

The main runtime called `setPlaying(true)` without a game state after some gestures.
The audio engine then selected Act I from an empty state.
In Act III, this stopped the existing source pair and reset its position.
The next frame restored the Act III selection.
This could cancel loading and restart the composition.

A regression test reproduced this behavior before the repair.
The actual track ID was `act1-03` when the required ID was `act3-03`.
The repaired `FlightAudio.setPlaying` uses the last observed game state when its caller omits that argument.
The coordinator also corrected the main runtime caller to supply its current state.

This defect is confirmed.
It does not, by itself, explain a persistent loss that ends only after unfolding.
The fold key handler unlocks the context without calling the faulty helper.

## Boundary checks

| Boundary | Result | Limit |
|---|---|---|
| Actual fold event to AV priority | Priority 2. The event does not request music attenuation. | Source inspection. |
| Fold fields to recorded selection | The track selector does not read fold fields. | Source inspection and unit checks. |
| Actual fold and inverse operations in Acts I to III | The track, source pair, position, and gain remain active. | Simulated Web Audio context. |
| Critical warning to recorded mix | Repeated warnings could keep the core at 0.5 and atmosphere at 0.75. | Confirmed former mix policy. It did not stop source playback. |
| Authored recovery to recorded mix | Recovery set the core gain to zero. Atmosphere continued. | Confirmed former mix policy. It removed the rhythm. |
| Segment loading | A missing next segment can cause an underrun. | Browser evidence is required for the reported case. |

The coordinator approved a music-only change to these two mix policies.
During active-flight recovery, the core now keeps a gain of 0.42.
During a warning, the core multiplier is 0.75 and the atmosphere multiplier is 0.9.
Repeated warnings extend the interval but do not compound these multipliers.
The minimum recovery core gain during warnings is 0.315.
Repair and ending scenes keep the atmosphere-only mix.
The explicit `mixMode` field selects these policies.
Fold fields do not select a mix policy.

The browser verification owner also found an interruption after three folds in Act III, chapter 25.
The faster route reached a recovery interval and opened an Echo Forge choice.
The game phase became `choosing` at simulation time 5.358 seconds.
The old audio policy stopped music in this phase.

The approved repair keeps the quiet recovery mix during the choice.
Combat remains stopped until the player selects a card.
The source pair and audio clock continue through the choice.
Manual pause, mute, and page hiding still stop playback.

These are confirmed repairs to source selection, rhythm removal, and Echo Forge interruption.
The browser verification owner is checking the complete repaired input path.
The separate claim that unfolding alone resumes the interrupted music is not yet confirmed.
Do not call these unit checks a listening review or human playtest.

## Changes

- `src/audio.js`: retain the last observed state for a playback request without a state argument. Keep music active during an Echo Forge choice.
- `src/campaign-recorded-audio.js`: separate flight recovery from atmosphere-only scenes. Limit warning attenuation. Add read-only `quiet`, `mixMode`, and `ducked` diagnostic fields.
- `tests/campaign-recorded-audio.test.mjs`: cover the omitted-state defect, real fold/inverse operations, recovery gain, warning gain limits, quiet repair/ending scenes, and actual evolution offers and choices.

## Executed checks

`node --test --test-name-pattern='gesture without a new state' tests/campaign-recorded-audio.test.mjs`

Before repair: 1 failed test.
After repair: 1 passed test.

`node --test tests/campaign-recorded-audio.test.mjs tests/audio-engine.test.mjs`

Result: 36 passed tests. No failed tests.
Log: `reports/fold-audio-unit.log`.

`node --test --test-name-pattern='actual Echo Forge' tests/campaign-recorded-audio.test.mjs`

With the valid Act III profile, the test failed before the repair.
The actual playback state was `paused` instead of `playing`.
After the repair, the test passed.
The test uses the real `queueEvolution` and `chooseEvolution` functions.

Full project and browser results belong in the coordinator's verification report.
The English text received a clarity review.
A full ASD-STE100 dictionary and editorial conformity review was not completed.
