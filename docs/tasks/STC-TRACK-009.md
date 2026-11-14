# STC-TRACK-009

Date: November 13, 2026.
Revision: `identified-return-r8`.
Status: Technical delivery complete as the r8 comparison baseline.
Integration owner: `/root`.

## Requested result

Improve the supplied r5 stereo and r7 room mixes through the operator vocabulary.
Supply a new full WAV and short comparison clips.
Keep both supplied files, earlier source stems, and release archives unchanged.
The result remains a music review candidate. Campaign use requires a later selection.

## Musical contract

Use the r7 `room_mix.wav` as the retained foundation.
Use the r5 master as an earlier reference. Do not combine the two masters as aligned stems.
Keep the forty-bar form at 134 BPM.
Bar numbers start at zero. Bar zero starts at 0.04 seconds.
Keep the existing kick, sub, acid notes, upper-acid stereo movement, and drum timing.
Keep the existing 0.12 room relationship in the foundation.
Do not add another room processor or compressor across the full mix.

Add only three musical relationships:

1. Persistence: use the same Fm7 pitch classes in two chord voicings.
2. Transient growth and recovery: use a small, bounded percussion response between existing drum attacks.
3. Operation order: use gate then room before the return, and room then gate after it.

Apply the new gate and room operations only to the added harmony.
Use soft, filtered chord tones. Keep the original acid as the main voice.
Keep the added percussion sparse. Do not add another four-on-the-floor kick.
Stop the added percussion during bars 28 through 32.
Keep all new layers silent during the final two beats before bar 32.
Let the added layers end within the existing 76.6418-second file interval.
The full take has an ending. It is not a seamless loop.

| Bars | Intended expression |
|---|---|
| 0–4 | Retain the r7 opening alone. |
| 4–12 | Add sparse mechanical answers between existing attacks. |
| 12–20 | Introduce Fm7, MIDI 53, 56, 60, 63. |
| 20–28 | Change voicing to MIDI 56, 60, 63, 65. Retain pitch classes. |
| 28–32 | Expose the quiet harmony and its decaying room tail. Preserve the final gap. |
| 32–40 | Restore the pulse with the alternate room-and-gate order on the new harmony. |

Use the new operator relationships as composition rules.
Do not claim that they predict a game boundary or constitute a physical motion model.
The new track has no authority over movement, damage, collision, warnings, rewards, or saves.

## Production contract

Use installed FoxDot Patterns for the finite added note and rhythm sequence.
Use custom SuperCollider SynthDefs for the new voices and ordered processors.
This continues the established offline route. It does not use the live FoxDot Clock.
Keep raw native output in the G scratch folder.
Use an explicit 64 MiB real-time memory allocation.
Reject native allocation and synthesis failures even when the process exits with code zero.
Keep the shared input, effect order, voicings, timing, and gain policy in the manifest.
Use one final linear gain for the candidate, the aligned r7 control, and the new-layer stem.
Do not normalize these files independently.
Match the intended reference loudness within a small measured margin.
Measure sample peaks, estimated true peaks, mono compatibility, and the final tail.
Supply a REAPER editing handoff if the retained stems permit it. Do not claim a REAPER render.

## Owners

| Owner | Files and responsibility |
|---|---|
| `/root` | Task contract, integration, listening page, archives, and final result |
| `/root/r8_composition` | `audio/stc-study/foxdot-operator-r8/compose.py`, finite score, and musical operation record |
| `/root/r8_production` | Native processors, renderer, WAV outputs, manifest, and audio production record |
| `/root/r8_qa` | Independent file, source preservation, production, and native-player checks |

The roles use `D:/Projects/games/agents` instructions.
Human listening must determine whether the new version improves the track.
Technical measurements do not establish musical quality, comfort, or recognition.

## Source result

The final candidate retains the complete r7 foundation and adds the declared new layer.
The foundation control matches every original r7 sample.
The full Node suite passed 261 tests. The full Python suite passed fifty tests.
Thirteen Python tests cover this score and native output.
The source review page passed 44 browser checks.
The new candidate measures -14.5 LUFS with an estimated -2.7 dBFS true peak.
The earlier two supplied WAVs and the r7 source stems retain their recorded hashes.
The [result report](../STC-IDENTIFIED-RETURN-r8.md) states the musical and technical limits.
Both extracted archives passed 44 browser checks each.
The extracted SOURCE archive passed one HTTP test and thirteen Python production tests.
The user's later listening response requested more distinct percussion.
The separate [r9 task](STC-TRACK-010.md) applies that request while retaining this candidate.
