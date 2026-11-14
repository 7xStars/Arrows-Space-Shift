# Identified Return: operator revision r8

This is a music review candidate for the title study.
The foundation is the retained r7 `room_mix.wav`.
The r5 master is an earlier reference. The render does not combine the two masters.
The existing kick, sub, acid motif, drum timing, and stereo fade remain in the foundation.
The existing room relationship remains 0.12.

## Added musical relationships

FoxDot Patterns author the new finite score in `compose.py`.
SuperCollider renders the new voices and ordered processors in `operator_track.scd`.
The old foundation is not resynthesized.
The browser does not compose or render this revision.

1. Persistence: Fm7 changes its voicing while its pitch classes remain the same.
2. Transient growth and recovery: selected finite matrix norms control three percussion levels.
3. Operation order: the new harmony uses gate then room before bar 32, then room then gate.

The musical mapping is a design choice.
It does not model physical percussion, ship movement, or the game surface.
The new harmony remains above the deep bass region.
The added percussion supplies sparse responses. It does not add another kick pattern.
The original acid remains the main repeated voice.

## Timing and routing

Tempo: 134 BPM. Meter: 4/4. Form: forty bars.
Bar numbers start at zero. Bar zero starts at 0.04 seconds.
All full files have 3,678,806 stereo frames at 48 kHz.
Their duration is 76.6417917 seconds, including the ending.
These full files are not seamless loops.

New voices write to private audio buses 32 and 34.
The layer processor writes eight output channels for the native capture.
Its outputs contain harmony direct, percussion, gate then room, and room then gate.
The source and room settings are the same for both room orders.
Each gate transition has 20 ms smoothing.

Only the new harmony passes through the new gate and room processors.
The new harmony room contribution is 0.11.
The new-layer bus gain is 1.25.
One final linear gain of 1 applies to the candidate, control, new layer, and proof stems.
The files are not normalized independently.
No new compressor or room processor acts on the complete foundation.

The selected new-layer active RMS is 17.39 dB below the foundation active RMS.
The complete candidate measures -14.5 LUFS and approximately -2.7 dBTP.
The retained foundation measures -14.6 LUFS and approximately -2.9 dBTP.
The foundation control has the same file hash as the retained r7 master.
All seven full files contain finite samples and remain below full scale.
The native compile and render returned zero with no detected synthesis or allocation failures.
Independent production and playback results are recorded by the QA owner.

The renderer combines the added components with the decoded r7 foundation.
Before PCM quantization, candidate equals foundation plus new layer.
The two proof stems include the actual 0.11 room contribution.
They do not receive an independent listening gain.
The final mix selects the first room order before bar 32.
It selects the second order after a 20 ms transition at bar 32.

All new components are silent before bar 4.
They are also silent from bar 31.5 through bar 32, including the room tail.
The shared new-layer mask has 20 ms boundary fades.
It has a final 0.25-second fade to zero.
The foundation does not use this mask.

## Files

| File | Purpose |
|---|---|
| `ass-identified-return-r8-music.wav` | Complete new candidate |
| `foundation-control.wav` | Retained foundation with the same final gain |
| `new-layer.wav` | Combined added harmony, percussion, and selected room contribution |
| `harmony-direct.wav` | Added harmony after the gate |
| `mechanical-response.wav` | Added percussion |
| `gate-room-proof.wav` | New harmony gated before the fixed room response |
| `room-gate-proof.wav` | New harmony room response gated afterward |
| `foxdot-score.json` | Evaluated notes, timing, levels, gate schedule, and source metadata |
| `operator-track-score.osc` | Finite native render score |
| `render-manifest.json` | Source hashes, output hashes, gain policy, native commands, and measurements |
| `initial-levels.json` | First calibration at layer gain 1, before the selected 1.25 setting |

## Production

Run this command from the project folder:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' tools/render-foxdot-operator-track.py
```

The default command uses the selected layer gain of 1.25.
The installed FoxDot distribution is version 0.9.0.
The finite adapter uses Pattern classes. It does not run the live FoxDot Clock.
The native renderer uses SuperCollider 3.14.1 and an explicit 64 MiB real-time memory budget.
It rejects synthesis and allocation failures even when the native process returns zero.
Raw floating-point output remains in the G scratch folder.
The render uses original project sources and stock synthesis units.
It adds no external sample, recording, or impulse response.
REAPER was not used for this render.

## Evidence limits

The manifest supplies technical measurements.
These measurements do not establish better musical character, comfort, or recognition.
Human listening must compare the new candidate with the retained foundation.
No campaign soundtrack replacement or game-rule change is part of this revision.
No binaural, HRTF, physical-device, or physical-latency claim is made.
