# Bass fade and lower room

Candidate: `stc-study-r7`.
Score: `identified-return-r7-bass-fade`.
Date: November 13, 2026.

## Result

The upper part of the acid bassline now fades between the ears.
One left-to-right-to-left cycle lasts four bars at 134 BPM, or about 7.164 seconds.
The notes, rhythm, instruments, and musical form remain from the original source.
The low acid path stays centered.
The kick, offbeat sub, drone, and shared delay retain their original routing.
The new pan does not process those accompaniment signals.

The default Room gain falls from 0.30 to 0.12.
This reduces the return by 60%, or about 8 dB, within the new mix.
Room timing remains the same for this comparison.
The study Room control can still remove the return at 0%.
The piece remains a title-screen candidate in the separate study.

## Source and production

The old stereo take contains the bass and drums in one compressed recording.
The revision extracts the acid direct signal from its original source graph.
It does not select a frequency band from the complete mix.
The capture uses the preserved r5 source in `audio/stc-study/r5-source/src/`.
It retains the acid gain, kick-duck envelope, and ending fade.
The shared acid and percussion delay remains in the accompaniment.

The capture has a stereo accompaniment and a mono acid direct signal.
Both start at the same source time and have 3,534,806 frames at 48 kHz.
The capture bypasses the old combined Web Audio compressor.
The revision is therefore a new mix. It is not an exact PCM reconstruction of r6.
The r6 sources, recordings, and release archives remain intact.

Installed FoxDot 0.9.0 Patterns author the pan targets.
Each four-bar cycle has 64 cosine-spaced targets, from -0.85 to +0.85 and back.
SuperCollider 3.14.1 smooths the targets with a 25 ms Lag and uses Pan2.
It splits only the isolated acid signal: low = LPF(source, 120 Hz); upper = source - low.
The low and upper signals thus remain complementary before their different pan operations.
The filter response is gradual. It is not a strict frequency boundary.

The dry mix combines the accompaniment, centered acid low part, and panned upper part.
One shared stereo-linked Compander processes that complete dry mix.
The room return comes from the processed dry mix.
The centered comparison uses the same sources, processing parameters, and common gain.
Actual entry and boundary-crossing cues stay separate from the music.
The music pan does not predict an attack or change its timing.

This is an ear-to-ear stereo fade.
It adds no HRTF, pitch offset, inter-ear delay, or polarity change.
The offline adapter does not run the full live FoxDot scheduler.
The original composition was not authored in FoxDot.
REAPER was not used for this render.

## Levels and files

The first new dry mix had RMS 0.119139, below the r6 reference RMS of 0.180749.
A single common gain of 1.5171233390444847 corrects that level difference.
The same gain applies to both runtime stems and both complete review variants.
The stems were not normalized independently.

The final room mix measures -14.6 LUFS integrated loudness and 2.4 LU loudness range.
Its measured true peak is about -2.9 dBFS.
These values do not establish musical quality or listening approval.

All full output WAVs share 3,678,806 stereo frames at 48 kHz.
They include a three-second tail. The room has a final 0.25-second fade.
The full take is not a seamless beat loop.

| File or location | Purpose |
|---|---|
| `audio/stc-study/foxdot-bass-r7/README.md` | Production commands, dependencies, routing, and limits |
| `foxdot_bass.py` in that folder | Editable FoxDot pan pattern |
| `bass_pan.scd` and `bass-score.osc` in that folder | SC processor and finite native render score |
| `source-capture.json` and `render-manifest.json` in that folder | Source hashes, output hashes, tools, levels, and native proof |
| `dry_take.wav` and `room_return.wav` in that folder | Synchronized runtime source stems |
| `room_mix.wav` and `centered_control.wav` in that folder | Full review variants with Room at 12% |
| `assets/audio/stc-title-r7-dry.ogg` and `stc-title-r7-room.ogg` | Encoded runtime stems |
| `tools/capture-stc-bass-source.mjs` | Original source-group capture |
| `tools/render-foxdot-bass.py` | FoxDot sequence, SC native render, levels, and output checks |

## Verification

| Check | Result |
|---|---|
| Baseline `npm run check` | 233 tests passed |
| Revised `npm run check` | 233 tests passed; 0 failed; 0 skipped |
| FoxDot environment: `python -m unittest discover -s tests -p 'test_foxdot*.py'` | 12 tests passed: 7 new bass tests and 5 retained room tests |
| Native SC compile and render | Both returned 0 |
| Raw centered-low proof | Left and right sample values match exactly |
| Raw upper-pan proof | Both endpoint windows favor their intended ear by more than 20:1 in energy |
| Native runtime decode | Both stereo stems have equal frame counts at 48 kHz |
| Decoded mixes at Room 0%, 12%, and 100% | No non-finite or full-scale samples |
| Source study browser | 73 checks passed in headless Microsoft Edge |
| Extracted PLAY study browser | 73 checks passed. No page exceptions, missing resources, or campaign-storage writes occurred. |
| Extracted PLAY campaign comparison | 32 checks passed. Act IV uses a QA unlock; this is not a complete campaign run. |
| Root entry and Game link | 2 checks passed |
| Extracted SOURCE | 233 game tests and 12 production tests passed. All 2,093 preserved files matched. |
| Release preservation | Eight earlier ZIPs matched their retained hashes. Both new ZIPs passed CRC and unique-name checks. |

The runtime retains synchronized starts, cached decoding, pause, resume, mute, and Room control.
The source UI uses the lower Room default and exports the r7 score identity.
The packaged Options screen was inspected at desktop size and at 320 by 568 pixels.
Its Room control remains reachable with keyboard input and dialog scrolling.
No flight rule, topology rule, collider, campaign reward, or saved campaign value changes.
The evidence is in `reports/stc-study-r7/`.
The new PLAY and SOURCE archives are in `releases/stc-study-r7/`.

## Listening review

- [Short bass-fade review](../audio/stc-study/foxdot-bass-r7/bass-pan-review.wav)
- [Full new mix](../audio/stc-study/foxdot-bass-r7/room_mix.wav)
- [Centered comparison](../audio/stc-study/foxdot-bass-r7/centered_control.wav)
- [Quiet-break review](../audio/stc-study/foxdot-bass-r7/quiet-break-review.wav)

The short clips have 20 ms edge fades. Their source intervals are recorded in `review-excerpts.json`.
The next review must assess the bass motion, driving pulse, drum clarity, and room amount.
Technical measurements cannot establish a hypnotic or enjoyable result.
Headphone comfort, mono listening, physical devices, and complete campaign listening remain unverified.
The other Act textures remain separate composition work.
No GitHub, itch.io, or ChatGPT Sites publication occurred.

The [Pan2 documentation](https://doc.sccode.org/Classes/Pan2.html) describes the two-channel panner.
This report records the measured native output separately from that API description.
Full ASD-STE100 conformity and complete dictionary review are not claimed.
