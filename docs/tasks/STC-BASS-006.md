# STC-BASS-006

Date: November 13, 2026.
Candidate: `stc-study-r7`.
Baseline: `stc-study-r6`.
Status: Technical checks passed. Listening approval remains open.

The user wants a driving, hypnotic bassline with a smooth fade between the ears.
The user also wants less reverb.
This task interprets “baseline” as the repeated bassline.
The requested motion is a stereo fade. It does not require different pitches in each ear.

## Contract

Keep the original acid phrase, drums, tempo, and musical form.
Capture the acid direct signal before its original panner and shared compressor.
Keep the kick, offbeat sub, drone, and existing shared delay in the accompaniment.
Retain their original stereo routing. Do not apply the new bass pan to them.
Do not treat a frequency band from the complete mix as an isolated instrument.

Use FoxDot Patterns to author the pan sequence.
Use SuperCollider to render the ear-to-ear fade.
Apply a full left-to-right-to-left cycle over four bars at 134 BPM.
Use pan limits of -0.85 and +0.85.
Keep the kick body, offbeat sub, and low part of the isolated acid signal centered.
Use a 120 Hz split for the isolated acid signal.
Use the source minus its low part for the upper signal.
This complementary split must not add or remove a source at the split itself.
Use one shared safety stage after the dry signals combine.
Reduce the default Room gain from 0.30 to 0.12.
Keep the room timing for comparison.

The source capture bypasses the old shared compressor.
This revision is a new mix of the original sources.
It cannot claim an exact PCM match with the r6 compressed take.
The r6 source files, review files, and release ZIPs remain available.

## Owners

| Owner | Role and files |
|---|---|
| `/root` | Coordinator, Integration, and Audio Production: player, defaults, encoding, package, and final record |
| `/root/stereo_room_engine` | Music Composition and Sound Design: source capture, FoxDot pan sequence, native SC render, proof stems, and production tests |
| `/root/stereo_room_browser` | Engineering and QA: study UI, export identity, and browser checks |
| `/root/bass_review` | Sound Design review: source separation, pan period, centered low range, and room amount |

The team uses the role files in `D:\Projects\games\agents`.
The authoring route is the verified offline FoxDot-to-SuperCollider adapter.
The browser plays exported files. It does not author the new pan sequence.
REAPER editing is outside this render. Its use must not be claimed.

## Checks

The baseline `npm run check` passed 233 tests.
The new production checks must test the real source separation and rendered pan.
Check channel movement, low-part identity, output levels, and common stem frames.
Check the decoded runtime files.
Check startup, mute, pause, resume, Room, and manual play in the browser.
Keep game rules, actual topology cues, and campaign storage unchanged.
Keep technical evidence separate from listening approval.

The next listening review must assess bass motion, pulse, drum clarity, and room amount.
No improvement in perceived groove is established by channel measurements alone.

## Source result

The native render and source separation are complete.
The raw low path has equal samples in both channels.
The upper path favors each intended ear in its endpoint windows.
The mix uses one common gain to match the previous dry RMS.
Its integrated loudness measures -14.6 LUFS.
The revised source passed 233 game tests, 12 production tests, and 73 browser checks.
The extracted PLAY study passed 73 browser checks.
Its campaign comparison passed 32 checks. Its entry links passed 2 checks.
The extracted SOURCE passed 233 game tests and 12 production tests.
All 2,093 preserved files matched. Eight earlier release ZIPs matched their retained hashes.
See [the result](../STC-BASS-FADE-r7.md) for production files, review clips, and evidence limits.
