# Identified Return: percussion revision r9

This candidate follows the user's request for more distinct percussion.
It retains the r8 form, harmony, room, gate, pan, and original foundation.
It changes only the amplitude of the added mechanism events before native synthesis.
Each mechanism event receives a 10 dB increase.
The amplitude factor is `10 ** (10 / 20)`, or approximately 3.16228.
The revision adds no notes, hits, or instruments.

## Preserved source

`compose.py` and `operator_track.scd` are exact copies of their r8 sources.
The evaluated FoxDot score retains the r8 notes, timing, levels, gate schedule, and metadata.
The renderer applies the percussion factor when it writes the native OSC event.
The manifest records each affected source amplitude and native amplitude.
Harmony events do not receive this factor.

The retained r7 `room_mix.wav` remains the foundation.
The r8 full candidate remains the direct comparison reference.
Neither file is overwritten.
The original r5 stereo recording remains an earlier reference.
It is not combined with the r7 foundation as an aligned stem.

The layer bus gain remains 1.25.
The final linear gain remains 1.
The new harmony room contribution remains 0.11.
The existing foundation room relationship remains 0.12.
No new whole-mix compressor or room processor is added.
The native voices and private-bus routing are unchanged.

## Files

| File | Purpose |
|---|---|
| `ass-identified-return-r9-music.wav` | Complete candidate with stronger added percussion |
| `foundation-control.wav` | Retained r7 foundation |
| `new-layer.wav` | Complete added layer |
| `mechanical-response.wav` | Stronger added percussion only |
| `harmony-direct.wav` | Unchanged r8 harmony component |
| `gate-room-proof.wav` | Unchanged r8 gate-then-room contribution |
| `room-gate-proof.wav` | Unchanged r8 room-then-gate contribution |
| `foxdot-score.json` | Retained r8 finite musical sequence |
| `operator-track-score.osc` | New native sequence with only the percussion amplitudes increased |
| `render-manifest.json` | Sources, native commands, output hashes, and measurements |

All full WAV files are stereo PCM16 at 48 kHz.
Each contains 3,678,806 frames and lasts 76.6417917 seconds.
The opening, quiet gap, and ending retain their r8 timing.
These files have an ending. They are not seamless loops.

## Production

Run this command from the project folder:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' tools/render-foxdot-percussion-r9.py
```

The default command uses the selected gains.
The copied composer uses installed FoxDot 0.9.0 Pattern classes.
The adapter does not run the live FoxDot Clock.
SuperCollider 3.14.1 renders the copied voices with an explicit 64 MiB real-time memory budget.
The renderer rejects synthesis and allocation failures even when the native process returns zero.
Raw native output remains in the G scratch folder.
REAPER is not used for this native render.

## Verification contract

The renderer compares all unaffected component hashes with r8.
It compares the new percussion with the retained percussion multiplied by the fixed gain.
It also compares the full r9-minus-r8 difference with the percussion difference.
These PCM comparisons permit only the stated quantization tolerance.
The manifest records the actual errors and measured gain.

The measured percussion RMS increase is 10.00001 dB.
The complete r9-minus-r8 difference agrees with the percussion difference within one PCM sample unit.
The harmony, both ordered room contributions, and foundation control retain their r8 file hashes.
The full candidate measures -14.5 LUFS and approximately -2.7 dBTP.
No final gain reduction was necessary.
All seven full WAV files remain below full scale and contain finite samples.
The native compile and render completed without detected synthesis or allocation failures.

The source files and output files remain separate from listening approval.
Technical measurements do not establish better musical character, comfort, or recognition.
The user's listening feedback selects the next musical decision.
No game rule or campaign soundtrack changes in this revision.
