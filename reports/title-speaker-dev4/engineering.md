# Title audio startup: engineering result

Role: Engineering. Candidate baseline: `0.25.1-dev.3`.
Project: `D:/Projects/games/game-off-2026`.
Owner: `/root/title_audio_engine`.

## Requested behavior

Request title music when the entry screen loads.
Start playback automatically when the browser permits it.
Keep one context and one title source.
Use the first permitted user action when automatic sound is blocked.
Preserve mute, launch, hidden-page, pause, and Forge behavior.
Do not change browser policy, game rules, or musical masters.

## Findings

The existing automatic request awaited `AudioContext.resume()` before selecting or loading the title recording.
When browser policy blocks sound, that promise can remain pending.
The title asset then has no prepared buffer before the first user action.

The former text button inferred playback from `titleRequested` and a running context.
Those states can become true before a recorded source starts.
Thus, that condition does not reliably distinguish a prepared request from actual playback.
The coordinator replaces the old toggle with a sound-preference control.

The engine finding does not prove that every reported silent entry has the same cause.
Native browser verification remains with the QA owner.

## Implemented change

`FlightAudio.startTitle()` now requests context resume and prepares the r9 recording concurrently.
Preparation selects and decodes one buffer while the context can remain suspended.
Preparation does not start a source or alter browser policy.
When permission is available, the existing recorded player starts the prepared asset.
The existing generation checks still reject obsolete resume results.

`resumeFromGesture()` can resume an assigned context without constructing another one.
It only requires the browser constructor when it needs to create the first context.

The read-only diagnostics now include `titleStartup`.
Its `requested` field records the title request.
Its `state` field distinguishes waiting, loading, playing, muted, hidden, off, and error states.
These records do not change campaign state.

## Files

- `src/audio.js`
- `tests/campaign-recorded-audio.test.mjs`

The coordinator owns the speaker icon and application event handlers.
This engineering task did not change those files.

## Verification

Command:

```powershell
node --test tests/campaign-recorded-audio.test.mjs tests/audio-engine.test.mjs
```

Result: 39 passed. No test failed.
Log: `reports/title-speaker-audio-unit.log`.

Three new tests cover these conditions:

1. The r9 buffer loads while resume waits for a gesture. No source starts during that wait.
2. Mute during preparation prevents a late resume from starting a source.
3. Repeated requests share one buffer and start one source after permission.

The first two tests failed before the repair.
The old code had no selected title or loaded buffer during the blocked interval.
Both tests passed after the repair.

The existing Stop, mute, and launch race test retains its playback assertions.
Stop and mute must leave zero sources and a paused player.
Launch must select the expected Act I recording.
A preloaded title can remain selected as metadata while it is paused.
That selected metadata does not establish playback.

The test suite also retains the fixed Forge, recovery, warning, and fold behavior.
These unit checks use a simulated Web Audio context.
They do not establish actual browser permission or perceived sound.

## Limits

The engine cannot force a browser to permit sound before a user action.
The native browser test must verify automatic playback and the blocked fallback separately.
Human listening, assistive technology, and physical devices are not tested here.
The text uses short sentences and consistent technical terms.
A complete ASD-STE100 dictionary and editorial review was not completed.
