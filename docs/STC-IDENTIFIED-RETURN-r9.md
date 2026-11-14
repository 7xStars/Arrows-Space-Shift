# Identified Return r9

Date: November 13, 2026.
Candidate: `identified-return-r9`.
Status: Technical delivery complete. Human listening review remains open.

## Requested change

After the r8 listening question, the user requested: "Make the percussion more distinct".
The new r9 version raises only the added mechanical percussion by 10 dB.
The notes, event times, voices, harmony, stereo movement, gate controls, and room settings remain fixed.
The original kick, bass, and drum recording remain in the retained foundation.
No extra hit was added.

The [r8 report](STC-IDENTIFIED-RETURN-r8.md) explains the three operator relationships.
Those relationships remain in r9.
The new gain makes the bounded percussion response stronger.
It does not change the response's order, rhythmic position, or amplitude ratios.

## Production and invariants

The r9 score and native voice definitions match their r8 sources exactly.
Installed FoxDot Patterns supplied that retained score.
The r9 renderer multiplies only mechanism-event amplitudes by `10**(10/20)` before native synthesis.
SuperCollider renders the same private-bus paths with the increased percussion amplitude.
The native renderer uses 64 MiB of real-time memory and rejects allocation failures.

| Item | Verified result |
|---|---|
| Percussion increase | 10.00001 dB from actual PCM measurements. |
| Percussion sample peak | -18.13 dBFS, compared with -28.13 dBFS in r8. |
| Full mix | -14.5 LUFS and approximately -2.7 dBTP, the same rounded measurements as r8. |
| Format | Stereo PCM16 at 48 kHz. |
| Duration | 3,678,806 frames, or 76.6418 seconds. |
| Harmony and room paths | Sample-identical to r8. |
| Foundation | Byte-identical to the retained r7 foundation. |
| Selective-change proof | The full-track difference matches the percussion difference within one PCM sample unit. |
| Earlier files | The two supplied masters, seven r8 WAVs, and r8 release archives retain their hashes. |

The final gain remains 1. The new-layer gain remains 1.25.
No full-mix normalization, compressor, or room processor was added.
The full WAV includes its ending. It is not a seamless loop.
REAPER was not used for the native render.
The RPP file is an editing handoff with the full reference muted.

## Listening comparison

- [Full r9 WAV](../audio/stc-study/foxdot-percussion-r9/ass-identified-return-r9-music.wav)
- [Short percussion response, r9](../audio/stc-study/foxdot-percussion-r9/percussion-r9.wav)
- [Same interval, r8](../audio/stc-study/foxdot-percussion-r9/percussion-r8.wav)
- [Break and return, r9](../audio/stc-study/foxdot-percussion-r9/break-return-r9.wav)
- [Unchanged r8 control](../audio/stc-study/foxdot-percussion-r9/r8-control.wav)
- [Listening page](../track-review-r9.html)

Use the same listening volume for both versions.
Use Response to hear the three-hit pattern before the harmony entry.
Use Return to compare the stronger percussion with the full pulse.
The short comparisons have equal source-frame intervals and 20 ms edge fades.
They have no independent gain adjustment.
The isolated percussion examples retain each version's mix level.

## Verification and limits

The complete Python suite passed 58 tests, including eight new r9 tests.
The thirteen r8 tests remain part of that total.
The complete Node suite passed 261 tests.
The source listening page passed 41 browser checks.
It loaded and played all eight track choices through native media controls.
The section controls, keyboard input, native file startup, and responsive layout passed.
The native hidden-page transition remains unverified in headless Edge.
The [release verification](../releases/stc-study-r9/VERIFICATION.json) identifies the final archive checks.

Both extracted archives passed 41 browser checks each.
The extracted SOURCE passed one HTTP test and 21 Python tests.
The actual root entries passed 21 additional checks.
Desktop, 320-pixel, and native-file screenshots were inspected.
Both archives passed integrity, unique-entry, and complete file-hash verification.
No reference PDF is included.

| Artifact | File | Bytes |
|---|---|---:|
| Music review | [REVIEW ZIP](../releases/stc-study-r9/Arrow-Space-Shift-Identified-Return-r9-REVIEW.zip) | 36,340,959 |
| Authoring source and stems | [SOURCE ZIP](../releases/stc-study-r9/Arrow-Space-Shift-Identified-Return-r9-SOURCE.zip) | 173,757,623 |
| Full track | [r9 WAV](../audio/stc-study/foxdot-percussion-r9/ass-identified-return-r9-music.wav) | 14,715,268 |

Open the extracted `index.html` for local playback.
The optional Node server also supports the section controls.
The current local review is `http://127.0.0.1:4193/track-review-r9.html`.
The archived source report precedes these final extracted-build results.
The adjacent verification file records the final archive identities.

The stronger percussion is still sparse.
Its section-average level remains below the full mix because the events are short and infrequent.
Human listening must determine whether it is distinct enough.
The user's r8 reply does not establish recognition, comfort, or approval of the complete track.
No new human listening result for r9 is claimed.
No physical-device, screen-reader, REAPER runtime, or complete campaign acceptance is claimed.
No campaign soundtrack replacement or publication is part of this revision.

The coordinator and production agents used the project role instructions in `D:/Projects/games/agents`.
The writing uses short sentences and consistent terms. Full ASD-STE100 conformity is not claimed.
