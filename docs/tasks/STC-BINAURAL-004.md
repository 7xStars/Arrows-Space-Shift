# STC-BINAURAL-004

Date: November 13, 2026.
Baseline: `stc-study-r4`, score `identified-return-r4`.
Retained baseline verification: 226 passing tests.
Candidate: `stc-study-r5`, score `identified-return-r5-binaural`.
Status: Done for the authorized routing change. Headphone listening acceptance remains open.

## Authorized change

The user approved binaural positioning for the kick, sustained hum, and repeated notes.
Apply the earlier proposed split: keep deep kick energy centered.
Apply HRTF processing to selected upper kick layers and reflections.
Apply HRTF processing to the sustained sine drone and repeated acid voice.
Use restrained motion with the existing audio clock.
Provide a session-only stereo playback option.

The current piece is a title-screen candidate.
This task does not install it on the campaign title screen.
It does not compose the other campaign textures.
The earlier suggestions about other processing remain proposals.
Do not add binaural beats.
Do not change rhythm, tempo, instrument settings, or note data to make the spatial effect stronger.
Do not change attack cues, their actual positions, physics, or campaign storage.

## Owners

| Owner | Role | Owned work |
|---|---|---|
| `/root` | Coordinator, Integration, Audio Production | Baseline preservation, render/export, package, and combined checks |
| `/root/binaural_engine` | Engineering and Sound Design | HRTF routes, fallback, lifecycle, and regression tests |
| `/root/binaural_browser` | Engineering and QA | Native headphone/stereo control and actual browser checks |

Use the applicable role instructions in `D:\Projects\games\agents`.
The existing browser-synthesis production route remains selected.
No authoring-tool installation or runtime engine change is required.

## Preserved evidence

The r4 review WAVs and score JSON remain unchanged.
Nine r4 source files are preserved in `audio/stc-study/r4-source/`.
Their manifest also records the three review-file hashes.
Keep the earlier release archives intact.

## Acceptance

- Actual HRTF nodes process the three selected instrument families.
- The deep kick retains its centered path.
- The stereo setting actually bypasses the HRTF processing.
- Spatial motion uses bounded existing nodes and the audio clock.
- Pause, resume, reset, mute, and mode switches handle all sources safely.
- One page retains one AudioContext.
- The actual event cues keep their existing spatial meaning.
- Native browser renders contain finite samples without full-scale samples.
- The delivered WAV and live study use the same instruments and route settings.
- The full available suite and packaged browser checks pass.

Technical routing and channel measurements do not establish headphone localization or musical acceptance.
Report those listening limits separately.

## Result

Six fixed HRTF routes process the selected musical layers.
The speaker setting bypasses HRTF processing.
The deep kick keeps its centered route.
Ten focused audio tests and the full 229-test suite passed.
Source and extracted PLAY checks passed 56 browser cases each.
The packaged campaign comparison passed 32 browser checks.
The root entry and Game link passed two checks.
Three native audio renders and four decoded WAV files passed sample checks.
The r4 review files and source snapshots remain unchanged.
See [the result](../STC-BINAURAL-r5.md).
