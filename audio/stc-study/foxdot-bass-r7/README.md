# Bass fade r7

This revision keeps the existing acid notes and rhythm.
It moves only the isolated direct acid voice.
The kick, offbeat sub, drone, and shared delay stay in the fixed accompaniment.
The source extraction uses the preserved r5 Web Audio instruments.
It does not pan a frequency band from the full mix.

FoxDot 0.9.0 Pattern classes author the pan sequence.
One complete left-to-right-to-left cycle takes four bars at 134 BPM.
Each leg takes eight beats.
The pan range is -0.85 to +0.85.
FoxDot writes 64 cosine targets for each complete cycle.
The offline adapter writes finite events to the SC NRT score.
It does not start a live FoxDot Clock or server manager.
This is not a full live FoxDot session.

SuperCollider 3.14.1 splits the isolated acid signal at 120 Hz.
The low path is `LPF(source, 120)`.
The upper path is `source - low`.
The low path stays centered.
`Pan2` gives the upper path an equal-power stereo fade.
A 25 ms lag smooths the targets.
The filter slopes are gradual. This is not a sharp frequency boundary.
No HRTF, inter-ear delay, detuning, polarity change, or binaural beats are added.

The original full mix used one nonlinear Web Audio safety compressor.
Separate source captures cannot reproduce that compressed sum exactly.
This candidate is a new mix from pre-safety captures.
One shared SC Compander processes the complete reconstructed dry mix.
The room return comes from that dry mix.
The default Room amount is 0.12 instead of 0.30.
The room delay, filters, and decay keep the r6 settings.

One common linear gain matches the r6 dry RMS when headroom permits.
The same gain applies to dry, room, panned review, and centered control.
No stem is normalized independently.
The manifest records the initial levels, selected gain, and supported mix peaks.
The initial dry RMS was 0.119139013.
The common gain is 1.5171233390444847.
The final dry RMS is 0.180748577, which matches the r6 reference.
Mix peaks at Room 0, 0.12, and 1 are 0.722215, 0.716997, and 0.787164.
FFmpeg measures the final Room 0.12 mix at -14.6 LUFS integrated loudness.
Its measured loudness range is 2.4 LU. Its true peak is about -2.9 dBFS.
The initial mix measured -18.2 LUFS before the common gain.

The native upper-path energy favors the intended ear by about 65 to 1 near each endpoint.
The two native low-path channels have zero sample difference.
These values establish the signal routing. They do not establish a listener's perception.

The files share a 48 kHz time origin and frame count.
Each full output has 3,678,806 stereo frames, or 76.641791667 seconds.
They retain the three-second tail interval.
The room return has a final 0.25-second fade to zero.
These full takes are not seamless beat loops.

- `dry_take.wav`: Panned candidate without the room return.
- `room_return.wav`: Wet return only.
- `room_mix.wav`: Panned candidate plus 0.12 times the return.
- `centered_control.wav`: The same processing and gain with the acid centered.
- `bass_upper_pan.wav`: Isolated upper-path proof before the shared safety stage.
- `bass_low_center.wav`: Isolated centered-low proof before the shared safety stage.
- `source-capture.json`: Capture method, source hashes, and source file checks.
- `foxdot-pan-events.json`: Actual evaluated FoxDot pan pattern.
- `render-manifest.json`: Native render, mix, gain, and pan-proof results.
- `bass-pan-review.wav`: Two pan cycles in the full mix, starting at bar 8.
- `quiet-break-review.wav`: Seconds 49 to 60 of the full mix.
- `review-excerpts.json`: Clip frames and 20 ms edge fades.
- `initial-levels.json`, `initial-loudness.txt`, and `final-loudness.txt`: Level comparison records.

Run the source capture from the project folder:

```powershell
node tools/capture-stc-bass-source.mjs
```

Run the native render with the installed FoxDot Python environment:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' tools/render-foxdot-bass.py
```

Run the checks:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' -m unittest discover -s tests -p test_foxdot_bass.py
```

The original instrument source was not authored in FoxDot.
This revision uses actual FoxDot Pattern code for the new stereo movement.
SC performs the native sample playback, split, pan, shared safety, and room render.
REAPER was not opened or used for capture.
The files do not establish a stronger groove, listening approval, or physical-device performance.
The earlier r6 files remain unchanged.
Seven Python tests passed for the pan pattern, source identity, native routing, output files, gain, and mix.
The SC compile and both native render passes returned exit code zero.
