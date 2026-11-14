# Act music collection r1: production result

Candidate: `stc-act-library-r1`.
Game baseline: `0.25.0-dev.1`.
Date: November 13, 2026.

## Delivered music

Sixteen original compositions are rendered.
Each Act has 60-, 120-, 240-, and 360-second tracks.
The complete collection lasts 3,120 seconds, or 52 minutes.
The exact file durations include their endings and tails.
These are finite experimental tracks. They are not seamless loops.

The [grammar](STC-ACT-GRAMMAR-r1.md) lists the titles, purposes, and preserved properties.
The collection uses a repeated pulse with different rhythmic, harmonic, and textural structures.
Act I emphasizes electro and mechanical clarity.
Act II emphasizes hypnotic repetition and acid filtering.
Act III emphasizes EBM, industrial timbre, pressure, and recovery.
Act IV emphasizes sparse atmosphere, ordered operations, and harmonic persistence.
These are composition intentions. Listening approval remains open.

## Authoring and mix

Installed FoxDot 0.9.0 Patterns generate the new note and rhythm events.
Pattern rotation and reversal produce explicit finite variants.
Seeded PRand and PWhite generate repeatable variations and irregular pad spacing.
The finite note scores retain pitches, times, durations, gains, seeds, and transformation labels.
The adapter does not start the full live FoxDot Clock.

SuperCollider 3.14.1 renders ten original SynthDefs.
Eight definitions supply kick, bass, hats, snare, metal, chord stabs, pads, and noise.
Two persistent definitions supply the bass pan control and the two-stem mix.
SC LFNoise1 continues within pad and noise voices between note events.
This is not a granular engine or a literal Eurorack model.

The bass low path stays centered. Its upper path moves slowly between channels.
The actual kick envelope reduces bass and atmosphere gain during the kick.
Atmospheric timing and modulation remain independent; its amplitude has this shared relation to the kick.
Sparse metallic repeats occur in the two long Act III and IV pieces.
Chord revoicing can preserve pitch classes. Other authored chord changes intentionally change harmony.

The core stem contains drums, bass, short chord stabs, and a restrained delay return.
The atmosphere stem contains pads, noise, and their restrained room return.
Both outputs share one time origin, sample rate, frame interval, and common linear gain.
No stem is normalized independently.
The gain calculation bounds the PCM sample peaks of the full mix and both separate stems.
The final three-second fade belongs to all related outputs.

The WAV masters measure from -19.4 to -17.6 LUFS integrated loudness.
The highest measured WAV true peak is -1.4 dBFS.
These measurements do not establish musical quality or listening comfort.
Vorbis is lossy. Separately encoded layers do not need to null against the encoded full mix.
The actual encoded files receive separate decode checks.

## Files and reproduction

| Location | Contents |
|---|---|
| `audio/stc-act-library-r1/act12.json` and `act34.json` | Sixteen distinct composition definitions and forms |
| `audio/stc-act-library-r1/compose.py` | Original FoxDot score authoring |
| `audio/stc-act-library-r1/instruments.scd` | Original SC instruments and routing |
| `audio/stc-act-library-r1/scores/` | Finite JSON note scores and native OSC scores |
| `audio/stc-act-library-r1/masters/` | Sixteen full stereo 48 kHz PCM16 WAV masters |
| `audio/stc-act-library-r1/reaper/` | Sixteen two-track editing handoffs with checked source paths |
| `assets/audio/stc-act-library-r1/` | Catalog, full mixes, core stems, atmosphere stems, and 20-second preview excerpts |
| `reports/stc-act-library-r1/` | Native logs, measurements, hashes, decode checks, tests, and browser evidence |

Run the production renderer from the project folder:

```powershell
& 'G:\Music Tools\FoxDot\venv\Scripts\python.exe' tools/render-act-library.py --resume
```

The renderer uses G for temporary multichannel files because D has limited free space.
The final sources, masters, runtime files, and reports remain in this project.
The source fingerprint covers the track definition, composer, instruments, renderer, and mixer.
The verification command checks every delivered preview hash as well as the complete tracks.

```powershell
python tools/verify-act-library.py
```

REAPER was not opened or used for the renders.
The editing handoffs reference the delivered Vorbis stems.
The lossless full masters and editable note/instrument sources remain available.
No reference audio, melody, sample pack, or video asset was copied.
The YouTube references were unavailable for direct listening.
The supplied chapter study informed the design questions.

## Listening player and checks

The separate page is `music-library.html`.
It selects an Act and one track.
It loads only the selected core/atmosphere pair.
One context starts both sources at the same time and offset.
Pause retains the position. Resume uses the retained decoded pair.
Track replacement cancels obsolete requests and drops the prior pair.
Native decode jobs run serially to limit overlapping allocations.
Include atmosphere changes only the atmosphere gain.
The page does not write campaign progress or schedule combat.

The baseline suite passed 233 tests.
The new FoxDot composition suite passes 16 tests.
All production suites pass 28 tests.
All sixteen native track renders returned 0.
Sixteen WAV masters and all 64 Vorbis files passed hash, frame-count, finite-sample, and sample-headroom checks.
The [file report](../reports/stc-act-library-r1/file-verification.json) records the results.
The revised game and interface suite passes 241 tests.
The source listening page passes 28 browser checks in headless Microsoft Edge.
All sixteen native core/atmosphere pairs have matching stereo 48 kHz frames and exact durations.
Their decoded core, atmosphere, and summed samples are finite and below full scale.
The browser found no page exceptions, missing resources, or campaign-storage writes.
Desktop, 320-pixel, RTL, and 200%-text screens were inspected.
The tests found and repaired native fetch binding and a volume-readout overflow.
The browser fixture uses bounded decoded-buffer references for its measurement.
It does not establish physical output, heap retention, or listening approval.
The extracted PLAY library passed the same 28 browser checks, including all sixteen native stem pairs.
The campaign comparison passed 32 browser checks. Four root and page-link checks passed.
The extracted SOURCE passed 241 game/interface tests and 28 production tests.
All 2,093 preserved source files matched their retained hashes.
Both ZIPs passed integrity and unique-name checks.
The packaged code and audio are checked against the tested extraction after the final documentation update.
Release files are in `releases/stc-act-library-r1/`.

The first load is lazy. A six-minute decoded stereo pair contains about 264 MiB of sample data.
This is a sample-data calculation, not a measured application-memory peak.
Physical mobile performance and heap retention remain open.
The resume cache checks masters and stems; the separate verifier also checks previews.
If a cached preview is missing, render that track without `--resume`.

## Remaining review

The [listening protocol](ACT-LIBRARY-LISTENING-PROTOCOL.md) defines the next comparisons.
No human recognition, enjoyment, emotional-depth, or hypnotic-effect result is claimed.
Full-track headphone comfort, mono listening, physical mobile playback, and campaign warning masking remain open.
The music is available for selection in the listening library.
The campaign soundtrack has not been replaced by these experiments.
No GitHub, itch.io, or ChatGPT Sites publication occurred.

The official ASD-STE100 Issue 9 PDF request returned HTTP 403.
The text uses short sentences and consistent terms.
Full dictionary review and full ASD-STE100 conformity are not claimed.
