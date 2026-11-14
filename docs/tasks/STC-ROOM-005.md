# STC-ROOM-005

Date: November 13, 2026.
Baseline: `stc-study-r5`, selected stereo review take.
Candidate: `stc-study-r6`, score `identified-return-r6-room`.
Status: Technical checks passed. Listening review remains open.

## Authorized change

The user selected the stereo take instead of the binaural take.
The user requested room and reverb for a larger-space impression.
The user then required FoxDot for music production.

Keep the selected recording at its original gain, speed, and stereo position.
Use installed FoxDot Pattern classes to make a finite sample sequence.
Use SuperCollider to play the sample and render the room return.
Use exported stems in the browser study.
Keep the existing action cues outside the room return.
Keep game rules, timing, collision, and campaign storage unchanged.

This task adds no new notes, instruments, or campaign arrangements.
The piece remains a title-screen candidate in the separate study.
The room effect does not add an in-world sound source.

## Owners and handoff

| Owner | Active role | Owned work |
|---|---|---|
| `/root` | Coordinator, Integration, Audio Production | Baseline preservation, runtime stem player, encoding, full checks, and package |
| `/root/stereo_room_engine` | Sound Design, Audio Production | FoxDot sequence, SC room processor, native render, Python checks, and handoff |
| `/root/stereo_room_browser` | Engineering, QA | Session Room control and actual browser checks |

Use the role instructions in `D:\Projects\games\agents`.
Use the browser runtime contract for stem playback.
Route A has an offline NRT extension for this task.
The extension uses actual FoxDot Pattern code and actual SC rendering.
It does not run the live FoxDot Clock.
It does not establish a live A/B/C comparison or a REAPER capture.

## Inputs and outputs

The selected input is `reports/stc-study-r5/ass-identified-return-r5-stereo-music.wav`.
Its SHA-256 value is `473d928d8d1228fe25744dc57f7fd1ee1d9ac2be6026e3c0e5ec0c15a6d8a841`.
The earlier source snapshots and review takes remain the recovery baseline.

Authoring files and WAV stems are in `audio/stc-study/foxdot-room-r6/`.
The render tool is `tools/render-foxdot-room.py`.
The checks are in `tests/test_foxdot_room.py`.
The browser player is `src/stc-track-player.js`.
Runtime stems are `assets/audio/stc-title-r6-dry.ogg` and `assets/audio/stc-title-r6-room.ogg`.
See [the production result](../STC-STEREO-ROOM-r6.md) for the file list and limits.

## Acceptance and evidence

| Condition | Evidence | Result |
|---|---|---|
| Use installed FoxDot for the sample event | `foxdot-events.json`, `foxdot_take.py`, and Python checks | FoxDot 0.9.0 Pattern classes ran. Two calls in one process give equal results. No live Clock or server manager loaded. |
| Keep the accepted direct recording | `render-manifest.json` and the PCM comparison | Zero start offset and zero PCM difference over all 3,534,806 source frames |
| Render the room with SC | `stereo_room.scd`, `room-score.osc`, and native logs | SC 3.14.1 NRT passed twice with exit 0. Both runs gave equal output hashes. |
| Keep one common stem interval | Manifest and WAV checks | All WAVs have 3,678,806 frames at 48 kHz stereo. |
| Keep the room mix below full scale | Manifest, loudness report, and decoded-stem report | No non-finite or full-scale samples in the checked files or mixes |
| Keep playback and action cues separate | Source browser report | 73 checks passed. No campaign-storage writes occurred. |
| Preserve the available suite | `reports/stc-study-r6/automated-check.txt` | `npm run check`: 233 passed; 0 failed; 0 skipped; 56 syntax checks |
| Check the offline adapter and files | `reports/stc-study-r6/foxdot-tests.txt` | 5 Python tests passed |
| Check the extracted PLAY archive | Packaged browser reports | Study 73, campaign comparison 32, and root entry 2 checks passed. |
| Check the extracted SOURCE archive | Source check logs | 233 game tests and 5 production tests passed. All 2,093 preserved files matched. |

## Continuation

The source candidate passes its technical checks.
The user must review the room mix and the quiet break.
Musical acceptance, physical-device playback, and perceived room size remain open.
The REAPER project is an editable handoff. It was not opened or rendered.
The original composition was not authored in FoxDot.

These records use short sentences and consistent technical names.
No full ASD-STE100 conformity or complete dictionary review is claimed.
