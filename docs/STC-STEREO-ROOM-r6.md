# Stereo room for the title-theme candidate

Study: `stc-study-r6`.
Score: `identified-return-r6-room`.
Date: November 13, 2026.
Baseline: The selected r5 stereo recording.

## Result

This revision adds a separate room return to the selected stereo take.
It keeps the original direct signal, notes, rhythm, speed, and stereo positions.
The browser study now plays exported dry and room stems.
Its session Room control changes the room return only.
The default room amount is 0.30. Room zero gives the direct stem.

The current piece remains a title-screen candidate.
It is available in `divergent-pulse.html`.
This task does not install it on the campaign title screen.
It does not compose music for the other campaign sections.

## Production route and sources

The source is `reports/stc-study-r5/ass-identified-return-r5-stereo-music.wav`.
The user selected this stereo take after the binaural comparison.
The source has 3,534,806 stereo frames at 48 kHz.
Its duration is 73.641791667 seconds.

The actual installed FoxDot 0.9.0 Pattern classes make one sample-entry event.
The event starts at beat zero with gain 1 and playback rate 1.
The offline adapter evaluates this event and writes an OSC score.
It loads the installed Pattern and TimeVar definitions in isolated package namespaces.
It does not run FoxDot package startup, the live Clock, or the server manager.
The regression test calls the authoring function twice in one process.

SuperCollider 3.14.1 compiles the SynthDef and renders the score with `scsynth -N`.
The render uses no audio device.
This is an offline Route A extension.
It is not a full live FoxDot session, workstation capture, or A/B/C route comparison.
FoxDot sequences the existing recording in this revision.
The original composition was not authored in FoxDot.

| File | Purpose |
|---|---|
| `audio/stc-study/foxdot-room-r6/foxdot_take.py` | Actual installed FoxDot Pattern use and finite event sequence |
| `audio/stc-study/foxdot-room-r6/foxdot-events.json` | Evaluated event and tool provenance |
| `audio/stc-study/foxdot-room-r6/stereo_room.scd` | Stereo sample player and original room processor |
| `audio/stc-study/foxdot-room-r6/room-score.osc` | Native NRT score |
| `audio/stc-study/foxdot-room-r6/render-manifest.json` | Source hash, commands, versions, alignment, levels, and output hashes |
| `audio/stc-study/foxdot-room-r6/sclang.log` | Native SynthDef compile log |
| `audio/stc-study/foxdot-room-r6/scsynth-nrt.log` | Native NRT log |
| `tools/render-foxdot-room.py` | Reproducible render and file checks |
| `audio/stc-study/foxdot-room-r6/Stereo Room r6.rpp` | Two aligned REAPER tracks for editing |

The REAPER project file was generated.
REAPER was not opened or used for a render.
No external impulse response or third-party recording was added.

## Room and mix

The direct sample player has gain 1 and rate 1.
Its path has no new room filter or reverb.
The selected dry kick attack and low-frequency body remain in this path.

| Room property | Value |
|---|---|
| Input and return high-pass filters | 220 Hz |
| Input and return low-pass filters | 4800 Hz |
| Predelay | 30 ms |
| Early reflection delays after the predelay | Left/right pairs: 21/29, 52/61, 87/103, and 137/157 ms |
| Diffuse tail | Six parallel comb filters and four allpass stages |
| Comb decay parameter | 2.2 seconds |
| Default return gain | 0.30 |
| Extra export tail | 3 seconds |
| Final return fade | 0.25 seconds |

The early reflections exchange stereo channels on selected taps.
The filters reduce low-frequency buildup and high-frequency brightness in the return.
Their slopes are gradual. They do not remove every frequency outside the stated range.
The processor is an original signal effect.
It is not a measured room or a physical room model.
It does not establish a sound source inside the game world.

The exported WAV stems share one start and one length.
Each file has 3,678,806 stereo frames at 48 kHz, or 76.641791667 seconds.
The dry file retains the exact original PCM, then adds three seconds of zeros.
The wet-only file has the extra tail and a final fade to zero.
`room_mix.wav` equals dry plus 0.30 times the return.
No loudness normalization changes the direct take.
These full takes are not seamless beat loops.

| WAV file | Sample peak | Purpose |
|---|---|---|
| `dry_take.wav` | -3.093 dBFS | Direct comparison and editable dry stem |
| `room_return.wav` | -12.479 dBFS | Wet-only editable return |
| `room_mix.wav` | -3.034 dBFS | Default room review mix |

FFmpeg measured the default WAV mix at -14.6 LUFS integrated loudness.
It measured a 2.3 LU loudness range and about -3.0 dBFS true peak.
See `reports/foxdot-room-r6/room-loudness.txt`.
These measurements do not establish musical acceptance.

## Browser playback

`src/stc-track-player.js` loads two stereo Vorbis files.
The files are `assets/audio/stc-title-r6-dry.ogg` and `assets/audio/stc-title-r6-room.ogg`.
It validates equal sample rates and frame counts.
It starts both sources with the same audio time and offset.
Pause stops and disconnects both sources.
Resume reuses the decoded buffers at the retained position.
One page retains one AudioContext.

The active study has stereo playback only.
It adds no HRTF or browser convolution to the recorded music.
The Room control changes only the return gain.
The Master, Music, and Effects controls retain separate functions.
The study removes the inactive Ambience control for this recorded mix.
The session controls do not write campaign settings or progress.

The existing entry and crossing cues remain separate from the music stems.
They retain their actual object IDs, transformed positions, and destination pan.
The room change adds no colliders or altered attack times.
The study still requires manual Space input for player fire.
Silent play and reduced-motion checks remain part of the browser suite.

Native Edge decoding returned 3,678,806 stereo frames at 48 kHz for both Vorbis files.
The checked decoded mix peaks were 0.709262 at Room 0, 0.713498 at Room 0.30, and 0.772230 at Room 1.
These checks used mix arithmetic before playback gain or limiting.
No checked decoded sample was non-finite or at full scale.
Vorbis is lossy. Exact PCM preservation applies to the dry WAV, not the decoded Vorbis file.

## Executed checks

| Command or procedure | Result |
|---|---|
| Native FoxDot-to-SC render, repeated | Two accepted runs returned 0. Dry, room, and mix hashes matched between runs. |
| Native dry-path comparison | Zero frame offset and zero PCM difference over the complete original take |
| `G:\Music Tools\FoxDot\venv\Scripts\python.exe -m unittest discover -s tests -p test_foxdot_room.py` | 5 tests passed |
| `npm run check` | 233 tests passed; 0 failed; 0 skipped; 56 source/tool syntax checks |
| `node tools/stc-study-browser.mjs` on the source | 73 checks passed in headless Microsoft Edge |
| Native decode and mix checks | Both shipped stems align. Room 0, 0.30, and 1 contain no full-scale or non-finite samples. |
| Extracted PLAY study | 73 browser checks passed. The root entry and campaign link passed 2 additional checks. |
| Extracted PLAY campaign comparison | 32 browser checks passed. This includes a QA Act IV unlock, not a full campaign run. |
| Extracted SOURCE archive | 233 game tests and 5 FoxDot production tests passed. All 2,093 preserved files matched their source hashes. |
| Archive integrity and prior releases | Both ZIPs passed CRC and unique-name checks. All six earlier release ZIPs matched their retained hashes. |

The first NRT attempt produced a Windows access-violation exit during shutdown.
The score now frees the synth, then frees the buffer, before its final `/c_set` marker.
It sends no `/quit` command.
The two accepted renders then returned 0.
The unaccepted attempt is not counted as a passed render.

The Python suite checks actual installed Pattern use, repeated author calls, and OSC packet structure.
It checks exact dry PCM, shared stem frames, recorded native exits, output hashes, and mix arithmetic.
It also checks the wet tail and the final zero samples.

The browser suite uses ordinary keyboard and native control input.
It checks source startup, manual fire, Room control, pause, resume, mute, reduced motion, and compact dialogs.
It checks the real paired crossing and the retained attack identity.
It also checks a controlled audio-load failure while play continues silently.
The report records no page exceptions, missing resources, or campaign-storage writes in the normal run.
See `reports/stc-study-r6/browser-source/results.json`.
The extracted study record is `reports/stc-study-r6/browser-packaged/results.json`.
The extracted campaign record is `reports/stc-study-r6/campaign-packaged/results.json`.
The Options screen was inspected at desktop size and at 320 by 568 pixels.
The compact dialog keeps vertical scrolling and keyboard focus.

These are technical browser checks.
They are not human playtests or listening tests.

## Review files and remaining work

- [Full room mix](../audio/stc-study/foxdot-room-r6/room_mix.wav)
- [Direct comparison](../audio/stc-study/foxdot-room-r6/dry_take.wav)
- [Wet-only return](../audio/stc-study/foxdot-room-r6/room_return.wav)
- [Quiet-break review](../reports/foxdot-room-r6/room-break-review.wav)

The user must review the sound of the room mix.
Perceived room size, drum weight, fatigue, and device playback remain open.
No human recognition rate or listening approval is claimed.
The other campaign textures remain outside this revision.
This change was not published to GitHub, itch.io, or ChatGPT Sites.
The review ZIPs are in `releases/stc-study-r6/`.
The PLAY archive opens the study at `index.html` and includes the campaign comparison.
The SOURCE archive includes the current source, production files, tests, and prior source records.

The text uses short sentences and consistent technical terms.
No full ASD-STE100 conformity or complete dictionary review is claimed.
