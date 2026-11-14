# Stereo Room r6

This revision adds a room return to the selected r5 stereo take.
The original take stays at its original gain, speed, and stereo position.
This file is a title-screen music candidate.

FoxDot 0.9.0 supplies the actual Pattern classes for the finite sample sequence.
`foxdot_take.py` loads these classes without the live Clock or server manager.
It creates one sample event at beat zero.
`foxdot-events.json` records the event and the import method.
The original composition was not made in FoxDot.

SuperCollider 3.14.1 compiles `stereo_room.scd`.
`scsynth` then renders `room-score.osc` in non-real-time mode.
No audio device or live FoxDot scheduler is used.
The script does not change system settings.

The dry path uses stereo sample playback at rate 1 and gain 1.
The room path has a 220 Hz high-pass filter and a 4800 Hz low-pass filter.
It has a 30 ms predelay, separate early reflections, and a diffuse comb/allpass tail.
The comb decay is 2.2 seconds.
The dry kick attack and low-frequency body stay in the dry path.
The room is an original signal-processing effect.
It is not a measured room or a physical room model.

The files have one common start and length:

- `dry_take.wav`: Exact source PCM, with 3 seconds of zero samples at the end.
- `room_return.wav`: Wet return only. Its last 0.25 seconds fade to zero.
- `room_mix.wav`: Dry take plus 0.30 times the room return.

All files use stereo 48 kHz, 16-bit PCM.
The extra tail is part of each file.
These full takes are not seamless beat loops.
No normalization changes the dry take.
`render-manifest.json` records the source hash, sample checks, levels, and tool versions.

To make the files, run this command from the project folder:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' tools/render-foxdot-room.py
```

To check the files, run this command:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' -m unittest discover -s tests -p test_foxdot_room.py
```

`Stereo Room r6.rpp` contains two aligned tracks for REAPER.
The dry track has gain 1. The room track has gain 0.30.
The project file was generated. It was not opened or rendered in REAPER.

The browser plays exported stems. It does not author this room effect.
The room does not add a sound source to the game world.
A listening review is still required.
No claim of user acceptance or full ASD-STE100 conformity is made.
