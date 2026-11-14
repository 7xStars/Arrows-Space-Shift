# Recorded campaign music

Contract: `ASS-CAMPAIGN-MUSIC-v1`.
State: implemented and checked in the local source.
Owner: campaign recorded audio agent.

## Source and purpose

The previous live score used procedural browser instruments.
The user rejected that musical character during the current review.
The live campaign now uses existing produced FoxDot recordings.
It does not use the previous procedural score as an automatic alternative.
If a recording fails to load, music stops.
Action sounds remain available.
The interface can show the error and request another load.

| State | Recording | Duration | Tempo |
|---|---|---:|---:|
| Title, automatic request with a permitted gesture if required | Identified Return r9 | 76.6418 s | 134 BPM |
| Act I | act1-03, Off Axis | 240 s | 134 BPM |
| Act II | act2-03, Order of Returns | 240 s | 134 BPM |
| Act III | act3-03, Order of Force | 240 s | 132 BPM |
| Act IV | act4-03, Order Leaves a Trace | 240 s | 128 BPM |
| Repair | Act IV atmosphere | Continuous position in the 240 s recording | 128 BPM |
| Ending | Last 24 s of the Act IV atmosphere | 24 s maximum | 128 BPM |

The four campaign pieces come from the existing 16-piece library.
This change adds no composition and imports no third-party recording.
The other library pieces remain separate production material.
The existing WAV files remain unchanged.
The export manifest records source and output SHA-256 hashes.

## Delivery and playback

The player uses one existing `AudioContext`.
The rhythmic core uses the Music bus.
The atmosphere uses the Ambience bus.
Both stems use the same audio start time and position.
The existing master, music, effects, and ambience controls remain active.

The player decodes one segment pair at a time.
It retains the current and next decoded pairs.
Each pair contains two stereo stems at 48 kHz.
Each segment covers 24 s of the arrangement.
Segments 0 through 8 include a further 80 ms for the transition.
The player applies complementary linear fades during that overlap.
Segment 9 contains the final 24 s without extra padding.
The resulting 80 OGG files occupy 46,106,300 bytes.

The two cached pairs use approximately 36.8 MB of sample storage.
A source from the previous segment can retain its buffer for 80 ms.
Native decoders and the browser can use additional memory.
The title recording uses one stereo buffer, approximately 29.4 MB.
The player releases the previous selection before it loads another Act.
Generation checks prevent a late load from restoring a previous selection.
An Act change cancels the previous fetch.
A fetch stops after 15 s if it does not finish.

The arrangement repeats after its authored ending.
It is a finite composition with a restart.
It is not claimed to be a seamless musical loop.
The OGG segments are derivatives of the retained production OGG stems.
The export process decodes each source once before segmentation.
Vorbis codec changes remain measurable at segment edges.

## State and event contract

| Input | Playback result | Preserved property |
|---|---|---|
| Confirmed Act state | Select its produced recording | Simulation time and campaign state |
| Safe recovery | Fade the core to zero; retain atmosphere | Arrangement position |
| Actual combat density | Apply a small core gain change | Tempo, phrase order, and simulation timing |
| Critical event | Briefly reduce the music layers | Immediate action sound |
| Pause or modal | Stop sources and retain the audio position | Campaign state |
| Resume | Start both stems at the retained position | Shared stem alignment |
| Music disabled | Stop recorded sources | Effects control remains independent |
| Load or decode failure | Stop music and retain an error | No rejected procedural score starts |
| Retry | Load the retained segment again | Current recording selection |
| Act replacement | Cancel old sources and load its recording | No simultaneous soundtracks |

The audio clock schedules music only.
It does not schedule attacks, collision checks, damage, or rewards.
No presentation object enters the simulation.
The file selection function does not change its input state.

The attack motif map accepts confirmed hostile weapon events.
It assigns one of four two-note motifs to a physical projectile identity.
An actual Klein, projective, periodic, or Bolza crossing retains those pitches.
The crossing can change its timbre.
The map holds at most 128 identities.
Its event history holds at most 32 records.
Entry sounds are limited to one per 200 ms.
Crossing sounds are limited to one per 220 ms.
The existing 24-voice effects limit still applies.
Forecast images do not enter this motif map.
The existing visual warnings remain necessary during silent play.

This motif relationship is a player-learning hypothesis.
No human recognition rate has been measured for this change.
The motif map does not prove a geometric theorem.
The geometry kernel remains the source of each actual crossing.

## Integration API

`FlightAudio` uses recorded music by default in the live browser.
`startTitle()` requests the produced title recording.
The title page now requests it automatically when the assets are ready.
If the browser blocks autoplay, a permitted key or pointer action resumes it.
The page respects the saved sound and music settings.
`stopTitle()` stops that request.
Late resume results cannot restore a stopped title or replace campaign music.
`retryMusic()` requests another load after a failure.
`diagnosticState().recorded` reports the actual recording and playback state.
The report includes its position, layers, source count, cache use, and error.

The old procedural instruments remain available for existing offline renders.
Tests can also select them with `recordedMusic:false`.
Three old scheduler tests now state that limited scope explicitly.
Their original assertions remain in place.

## Executed checks

| Command or check | Result |
|---|---|
| Baseline `npm run check` | 261 tests passed; 68 syntax files |
| `python tools/export-campaign-music.py` | Four recordings; 80 segment files |
| `node --test tests/campaign-recorded-audio.test.mjs` | 16 tests passed |
| `npm run check` after integration | 293 tests passed; 72 syntax files |
| Native FFmpeg decode and source comparison | All 80 frame counts exact |
| `node reports/campaign-music-v1/native-browser-check.mjs` | Nine native Edge checks passed |
| `node tools/audio-browser-check.mjs` | 18 actual game page checks passed |

The full check log is `npm-check.log`.
The native sample report is `native-decode.json`.
The browser report is `native-browser.json`.
The native browser decoded all 81 supplied files, including the title.
All files had their exact expected stereo frame counts at 48 kHz.
The largest segment peak was 0.83139.
The largest overlap error was 0.002646 RMS against the decoded source.
This file peak check does not establish the final mixed output peak.

The browser check used an isolated test page in headless Microsoft Edge.
It used the native decoder and real `AudioBufferSourceNode` objects.
It checked scheduling, a segment boundary, pause, resume, recovery, and title playback.
It did not replace the required actual campaign browser checks.

The actual page check used title and campaign controls in headless Edge.
The browser blocked the initial automatic title request.
A permitted pointer action resumed that request.
The check verified title Stop, title resume, and replacement by Act I music.
It forced an actual HTTP 503 response for the campaign recordings.
Music stayed silent while manual fire still produced effects.
Options showed the failure and its Retry control.
Retry loaded the music without closing Options or starting paused play.
After resume, both Act IV stems shared the same start time.
The check found no procedural oscillator on the Music or Ambience buses.
It also checked context recovery, saved gains, independent music mute, and full mute.
All three game entry pages preserved an unresolved import backup.
The detailed result is `game-browser/results.json`.

## Remaining review

The user must review the musical character during actual play.
No human listening approval is claimed for these four campaign selections.
No mobile hardware, headphone, speaker, latency, or long-session result is claimed.
The full campaign playthrough remains a separate acceptance check.
The packaged build still needs its own integration checks.
The user can reject or replace any selected recording without changing physics.

The report uses short English sentences and consistent technical terms.
It has not had a complete ASD-STE100 dictionary and editorial review.
