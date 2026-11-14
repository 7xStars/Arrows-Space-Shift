# Operator sound comparisons r1

These nine original clips use one finite four-note source.
Each clip has 576,000 stereo frames at 48 kHz, or exactly 12 seconds.
The files use PCM16 WAV format.
Both filter/saturation orders receive the same fixed family trim of 0.08.
One common linear gain then applies to all nine clips.
No A/B order is normalized independently.
The native difference measurements remain before this family trim and common gain.
The final 0.25-second fade is common to all outputs.

The final common gain is 6.975415158483572.
The standard gate/room pair has sample RMS levels of about -26.49 and -26.43 dBFS.
The nonlinear pair has sample RMS levels of about -26.46 and -26.52 dBFS.
These measurements reduce the earlier family-level jump without different gains for the two orders.
They are sample RMS measurements, not equal-loudness or comfort results.
The maximum sample peak across all files is 0.78.

## Comparisons

| Files | Meaning |
|---|---|
| `dry.wav` | Original reference source |
| `gate-room.wav`, `room-gate.wav` | Time-varying gate and linear room in opposite orders |
| `transfer-gate-room.wav`, `transfer-room-gate.wav` | A different gate phase and duty cycle with the same source |
| `filter-drive.wav`, `drive-filter.wav` | A 260 Hz low-pass filter and nonlinear saturation in opposite orders |
| `constant-gate-room.wav`, `room-constant-gate.wav` | Constant gain 0.5 and linear room in opposite orders |

Gate then room means R after G, or R∘G.
Room then gate means G after R, or G∘R.
The source data records output-difference norms without assigning a commutator sign.
The time-varying gate and the fixed linear room have a measured difference for this input.
Their constant-gain control has equal samples in both orders.
Order does not always change the result.

The gate runs at 0.5 Hz.
Its standard duty cycle is 0.45. The transfer duty cycle is 0.35, with phase 0.25 cycles.
A 5 ms exponential lag smooths its opening and closing.
The selected closed-gate windows contain room-tail energy after Gate then room.
Room then gate is zero in those windows.
When that denominator is zero, the report gives no finite energy ratio.

The room uses fixed linear filters, six delay taps, a stable comb, and a direct path.
The delays are 0.073, 0.157, 0.293, 0.467, 0.95, and 1.21 seconds.
The comb delay is 0.113 seconds. Its positive decay parameter is 1.3 seconds.
This is an authored signal effect. It is not a measured physical room or hardware model.

The saturation maps a sample x to tanh(10x).
That operation is nonlinear.
Its order comparison is not a claim about two bounded linear Banach-algebra operators.
The book's theorems do not certify this audio implementation.

## Source and execution

`compose.py` uses installed FoxDot 0.9.0 Pattern classes for the new note sequence.
`operators.scd` defines the original voice and ordered processors.
`operator-score.osc` retains the finite native SC score.
`catalog.json` supplies the UI clip identities and chronology.
`render-manifest.json` records source hashes, output hashes, levels, native commands, and measured differences.

Run this command from the project folder:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' tools/render-operator-audio.py --diagnostic-low-memory
```

Run the production suite:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' -m unittest discover -s tests -p test_operator_audio.py
```

The adapter uses `tools/render-foxdot-room.py` for OSC and WAV utilities.
It uses `audio/stc-study/foxdot-room-r6/foxdot_take.py` to load the installed Pattern API.
It does not start the live FoxDot Clock.
SC 3.14.1 performs the native synthesis.
No REAPER capture, browser synthesis, reference recording, sample pack, HRTF, or physical audio device is used.
The sixteen Act tracks and earlier title takes remain separate.

## Allocation control

An initial scalar control failed although scsynth returned zero.
The log reported delay-buffer allocation failures.
The diagnostic removed the filter/feedback branch. The failure remained.
That result retained the delay allocation and shared-resource region as the suspect.
An explicit 64 MiB RT-memory budget restored all room paths.
The scalar control then produced equal samples in both orders.

The optional low-memory run uses 8 MiB to reproduce the degraded control.
It retains its log and measurements under `diagnostics/`.
That run is not accepted as an audio deliverable.
The accepted render rejects allocation failures even when the native exit code is zero.
A later ordinary render can retain the earlier diagnostic record when its operator-source hash still matches.

The root integration must copy the nine WAV files and catalog to its runtime asset folder.
The waveform and norm observations establish this finite signal result.
They do not establish audibility, comprehension, comfort, or gameplay transfer.
Listening and physical-device acceptance remain open.
