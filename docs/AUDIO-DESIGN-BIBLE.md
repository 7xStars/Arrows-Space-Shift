# Audio design record

## Current campaign update: 0.25.1-dev.1

The user rejected the former live procedural score.
The live game now plays four existing FoxDot and SuperCollider productions.
The four-minute selection from each Act is active in that Act.
Identified Return r9 supplies title music. The title requests automatic playback.
Browser policy can require the first user action. Saved mute settings apply.
Repair and ending use the produced Act IV atmosphere.
SFX still use the existing browser synthesis engine and priority allocation.
Both stems start on one timeline through the existing Music and Ambience buses.
The player caches current and next 24-second pairs. A short fading source can retain an earlier pair.
This is not a fixed total-browser-memory claim.
Failed loading leaves music silent and SFX active. Options provides Retry music.
No rejected procedural score starts as an automatic live alternative.

The full current contract is `reports/campaign-music-v1/IMPLEMENTATION.md`.
The following sections describe the earlier candidate and its synthesis vocabulary.

Version: `0.25.0-dev.1`.
Music revision: `music-r2`.
Status: the user rejected this musical direction after listening.
The [r3 study contract](STC-STUDY-CONTRACT-r3.md) defines the replacement pilot.
The sections below retain the r2 implementation record.
The current separate pilot uses the original sources with an upper-bass stereo fade and less room.
See [the r7 production record](STC-BASS-FADE-r7.md) for its FoxDot and SuperCollider route.
The new [Act collection](STC-ACT-GRAMMAR-r1.md) contains sixteen original FoxDot compositions.
Its custom SC instruments and exact finite scores are in `audio/stc-act-library-r1/`.
The listening page can remove the atmosphere while the same core continues.
New campaign track selection remains a later listening decision.
Sources: `src/audio.js` and `src/music.js`.
The score and sound effects use original browser synthesis.
No external recording or sample pack is required.

## Purpose and route

The score repeats a D-based motif across changing arrangements.
The same opening note remains in each Act.
Rhythm, register, filtering, and density change with the spatial context.
These are artistic relationships. They are not mathematical equivalences.

This task selects runtime Web Audio synthesis.
The user authorized that implementation within the existing browser architecture.
REAPER, FoxDot, and SuperCollider remain optional production tools.
The browser does not require them.
No A/B/C workstation capture comparison was performed for this task.
No tool was installed.

## Original arrangements

Each bar has a 16-step rhythm grid.
One step is a sixteenth note.
The melody spans eight bars.
Its first phrase returns in the second half with a changed ending.
The harmony follows Dm, Bb, F, C, Dm, Bb, Gm, and Am.
The final Am leads back to Dm when the phrase repeats.
Held bass roots and chords support that progression.
The melody remains present when combat density changes.

| State | Tempo | Current arrangement |
|---|---|---|
| Act I: `traditional` | 108 BPM | Syncopated pulse, held triangle bass, three-note harmony, sustained sine melody |
| Act II: `klein` | 120 BPM | Repeated pulse, filtered sawtooth bass, sustained harmony and returning melody |
| Act III: `projective` | 116 BPM | Square bass, restrained mechanical percussion, sustained triangle melody |
| Act IV: `bolza` | 104 BPM | Sparse pulse, thinner two-note harmony, longer sine melody, quiet drone |
| `recovery` | 84 BPM | Long gaps, held bass, sparse melody and drone |
| `ending` | 84 BPM | Higher resolution melody, sustained harmony, sparse drone |

Actual shot and active-enemy counts select percussion density.
Actual boss presence enables an extra mechanical accent.
The hybrid, Curvature Gate, and Double Torus phase values change that accent's pitch.
An actual fold state changes the bass filter.
Authored wave breaks and boss recovery select the sparse arrangement.
The Double Torus uses its actual `bossRecoveryUntil` interval.
The repair view uses `musicState: 'repair'` for sparse music.
Its actual ending uses `musicState: 'ending'`.

Arrangement changes occur at the next beat.
Existing note tails can continue across that boundary.
The scheduler has one short look-ahead window.
A late frame skips obsolete score time.
It does not play a long burst of overdue notes.
Game clocks, projectile motion, firing, collision, and damage do not use the music clock.

## Signal path and settings

All music voices pass through the music gain.
All action effects pass through the effects gain.
Drone voices pass through the ambience gain.
The three gains connect to the master gain and browser output.

| Control | Default | Meaning |
|---|---|---|
| Master volume | 0.50 | Gain for all output |
| Music volume | 0.55 | Gain for musical pulse, bass, and motif |
| Effects volume | 0.80 | Gain for action, result, and warning cues |
| Ambience volume | 0.25 | Gain for quiet drone notes |
| Sound | On | Master output enable |
| Music | On | Enable score scheduling, including its drone layer |

The three gain buses are independent.
The ambience control changes the drone layer separately from the music gain.
The music enable control stops both score and drone scheduling.
Saved preferences are shared by the main campaign and Act IV.
The root interface owns preference storage and controls.

## Sound families

| Family | Current synthesis and meaning |
|---|---|
| Player fire | Fast triangle tone, 680 to 260 Hz; a manual shot occurred |
| Enemy fire | Short sawtooth tone, 170 to 100 Hz; an enemy fired |
| Pattern warning | Short pattern-specific phrase; a scheduled attack has a warning |
| Impact and destruction | Filtered noise with descending body tones |
| Player damage | Critical filtered noise, low sine, and square transient |
| Klein crossing | Rising 210 to 420 Hz phrase |
| Projective crossing | Two descending sine tones |
| Periodic crossing | Steady 260 Hz sine tone |
| Bolza crossing | Connected rising triangle and sine tones |
| Capture | Inward descending phrase after successful capture |
| Release | Outward rising phrase after successful release |
| Drive activation | Four rising sine notes after confirmed activation |
| Defeat | Filtered noise and a descending sine tone |

The presentation reader supplies actual event types and order.
The engine uses the event grammar priority when it admits sound voices.
Future-image forecasts remain silent.
Existing visual warnings remain necessary when sound is off.
The sound engine does not invent missing source IDs or crossing events.

## Allocation and synthesis limits

Regular music and effects can occupy 18 voices.
Important events can use the reserve up to 24 active voices.
At capacity, a higher-priority request can replace a lower-priority voice.
Critical warnings and damage have priority 3.
Capture, release, and actual crossings receive their grammar priority.
Music uses priority 0.

Replaced voices receive a short fade.
At most four retiring voices remain connected during these fades.
If no lower-priority voice is available, the engine rejects the request.
Voice allocation never introduces a gameplay cooldown.

The noise cache is bounded to four buffers.
The current short sound families share one deterministic noise buffer per sample rate.
Music voices use attack, decay, a held sustain level, and release.
The longer held section separates the score from short action cues.
Existing action cues retain their short decay envelopes.
Optional low-pass or high-pass filters shape the tone.
Restrained stereo panning applies to nonessential musical layers.
Critical effects remain centered by default.
The projective bass and boss accents use restrained soft distortion.
Its four-entry cache holds bounded WaveShaper curves.
The curves reduce amplitude rather than adding gain.
No reverb, delay, or convolution processor is added in this task.

## Lifecycle

`resumeFromGesture()` creates or resumes one context for the page's audio instance.
`unlock()` remains a compatible alias.
The game calls these methods after a user action.
An interrupted context resumes through that same path.
The engine does not assume autoplay permission.

Pause stops future score scheduling.
It cancels scheduled music and drone envelopes.
It fades and stops those sources.
Short action-effect tails remain separate.
Resume starts one score scheduler.
Hidden-page and focus-loss behavior belongs to the page's pause controls.
The ending remains eligible for music until its view completes.

## Verification and limits

`node --test tests/audio-engine.test.mjs tests/av-events.test.mjs tests/jam-score.test.mjs`
passed 24 tests after the music revision.
The tests include independent gains, priority admission, bounded retirement, cached noise and distortion, gesture recovery, sparse arrangements, actual boss phase and recovery, unchanged simulation state, and repair ending music.

The original six eight-second fixtures remain unchanged.
They were sound-effect stress mixes with several simultaneous cues every 0.6 seconds.
They were not music-only examples or recordings of ordinary play.

The user listened to those files and reported:

> this sounds like game SFX, not music

The user also reported that the Act IV audio was clearer.
This is one listener's direct feedback.
It is not a formal recognition study or a measured quality score.
The `music-r2` revision responds with a longer phrase, held harmony, a bass cadence, and sustained envelopes.
It keeps Act IV's thinner sine-led texture as the clarity reference.

`node tests/render-audio.mjs` now creates 32-second music-only examples for Acts I and IV.
It creates separate illustrative mixes with occasional Act-appropriate action cues.
Act I's illustrative mix contains no capture or Bolza-crossing sounds.
Six separate eight-second stress mixes test dense overlap.
All new renders use `OfflineAudioContext` at 48 kHz stereo.
Master volume is 1.0. Bus gains use their defaults.
No file is loudness-normalized.
Only the ending receives a short fade.

The new files and measurements have revision-specific names.
The music-only sample peaks are -27.31 dBFS for Act I and -32.30 dBFS for Act IV.
All ten new renders contain zero non-finite samples and zero samples at or above full scale.
No fixture exceeded 24 active voices.
The music-only fixtures admitted every scheduled voice.
These checks do not prove that every possible mix is free of clipping.

Review WAVs and the measurement report are in `reports/audio-0.25.0-dev.1/`.
They are technical captures, not accepted soundtrack masters.
The revised music has not yet received user acceptance.
No physical output test, formal musical-quality rating, or human comprehension test was performed.
Audio quality remains open for review.
See [the task result](AUDIO-RESULT-v0.25.0-dev.1.md).
See [the music revision record](AUDIO-MUSIC-REVISION-r2.md) for separate review links and baseline preservation.

## Later file production

If later work uses exported stems, retain the editable source and an unprocessed capture.
Use the same rate, start time, frame count, and loop interval for compatible stems.
Use descriptive names such as `ass_act2_klein_bass_120bpm_8bars_v001.wav`.
For one-shots, use names such as `ass_sfx_capture_v001.wav`.

Use 48 kHz PCM WAV production masters when the selected route supports that rate.
Record channels, frame count, loop bounds, peak, loudness, source revision, author, rights, and tool versions.
For effects that cross a loop boundary, render several cycles.
Extract the exact-duration middle cycle after the effect reaches a repeating state.
Measure the boundary and listen to repeated playback.
Do not treat a technical export check as musical acceptance.
