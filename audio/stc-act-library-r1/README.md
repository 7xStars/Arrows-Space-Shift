# Act music collection r1

This folder contains sixteen original FoxDot compositions and native SC renders.
Each Act has 1-, 2-, 4-, and 6-minute pieces.
The full collection lasts 52 minutes.

`act12.json` and `act34.json` define motifs, rhythms, chords, gains, and forms.
`compose.py` uses the installed FoxDot Pattern API to make finite note events.
`instruments.scd` defines the original instruments and two-stem signal path.
`scores/` retains the JSON events and native OSC scores.
`masters/` retains sixteen full stereo 48 kHz PCM16 WAV files.
`reaper/` contains editing handoffs for the delivered core and atmosphere layers.
REAPER was not opened or used for rendering.

Run the production renderer from the project folder:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' tools/render-act-library.py --resume
python tools/verify-act-library.py
```

The native route requires the recorded FoxDot, SuperCollider, Node.js, and FFmpeg installations.
The player requires only a supported browser and a local or hosted web server.
The renderer uses G for temporary files. Final assets remain in this project.
The resume path checks existing masters and stems.
The separate verification command also checks every preview.
If a preview is missing, render that track without `--resume`.

The full file duration includes the ending fade and tail.
These are not seamless loops.
Core and atmosphere share one timeline and one common output gain.
Short chord stabs can remain in the core when atmosphere is off.
The new music does not control game timing or announce an attack.

The [result](../../docs/STC-ACT-LIBRARY-RESULT-r1.md) records checks and limits.
The [grammar](../../docs/STC-ACT-GRAMMAR-r1.md) records the vocabulary.
The [listening protocol](../../docs/ACT-LIBRARY-LISTENING-PROTOCOL.md) defines the next human review.
