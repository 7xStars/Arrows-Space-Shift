# STC-ACT-LIBRARY-007

Date: November 13, 2026.
Candidate: `stc-act-library-r1`.
Status: Technical production and package checks passed. Listening review remains open.

## Authorized result

The user accepted the direction of the r7 title-theme study.
The user requested four experimental tracks for each of the four Acts.
Each Act will have tracks of 60, 120, 240, and 360 seconds.
The total collection will have 16 tracks and 52 minutes of music.
The exact duration includes the ending fade and tail.
The tracks are complete listening studies. They are not seamless loops.

The references add independent atmosphere, ordered motif changes, and harmonic persistence.
The user supplied a structural interpretation of the Intellijel and Larry Heard videos.
The video fetches failed. The team does not claim to have heard or transcribed the videos.
No reference recording, sample, melody, or visual asset will be copied.

## Musical contract

Keep a driving pulse and a recognizable bass motif as common anchors.
Give each piece distinct notes, percussion, phrase changes, and form.
Act I uses electro and mechanical rhythm.
Act II uses hypnotic repetition and acid filtering.
Act III uses EBM, industrial timbre, pressure, and recovery.
Act IV uses sparse atmosphere, acid motion, and harmonic persistence.
Use restrained room levels. Keep the kick body and low bass centered.
Let the upper bass move slowly between the ears.
Do not use the music clock to change game physics or collision.

Use installed FoxDot Patterns for original notes, rhythm gates, and finite transformations.
Use seeded PRand and PWhite for repeatable variations and irregular event spacing.
Use custom original SuperCollider instruments for synthesis.
Let SC LFNoise1 continue inside pad and noise voices between note events.
Do not call irregular note spacing granular synthesis or unclocked control voltage.
Do not equate musical rotation with a geometric isometry.

The authoring route extends the existing verified offline FoxDot-to-SC route.
It does not start the full live FoxDot Clock.
REAPER editing remains a separate handoff. Do not claim REAPER capture or rendering.

## Delivery and runtime

Deliver a full WAV master for each track.
Deliver a compressed full mix and two synchronized runtime stems for each track.
The core stem contains the pulse, bass, percussion, and any short chord stabs.
The atmosphere stem contains pads, noise, and their room return.
Apply one common linear gain to the related outputs.
Do not normalize stems independently.
Measure the full mix and each stem for headroom.

Add a separate listening page with Act and track selection.
Let the listener remove the atmosphere without changing the core.
Keep one selected track pair and one audio context.
Support pause, resume, stop, mute, loading failure, and track replacement.
Do not replace the campaign soundtrack during this listening experiment.
Do not write campaign progress from the listening page.

## Owners

| Owner | Role and files |
|---|---|
| `/root` | Coordinator, synthesis, render tools, integration, encoding, package, and final checks |
| `/root/act12_composition` | Music Composition: Act I and II definitions; production score tests |
| `/root/act34_composition` | Music Composition: Act III and IV definitions; grammar and listening protocol |
| `/root/music_library_ui` | Engineering and QA: listening page, bounded player, browser checks |

The team uses the role files in `D:\Projects\games\agents`.
Temporary multichannel renders use G because D has limited free space.
Final sources, WAV masters, runtime files, and records stay in this project.
The earlier r7 study and all earlier release ZIPs remain intact.

## Evidence

The baseline `npm run check` passed 233 tests.
The new composition suite passed 16 tests with the installed FoxDot environment.
Listening quality and player understanding require actual listener evidence.
No technical test establishes hypnosis, emotional response, or a jam score.

All sixteen native tracks are rendered with exact requested lengths.
The revised game/interface suite passed 241 tests. The production suite passed 28 tests.
The source library passed 28 browser checks, including native decode and alignment checks for all sixteen stem pairs.
All 64 delivered Vorbis files passed independent hash, frame-count, finite-sample, and sample-headroom checks.
See [the production result](../STC-ACT-LIBRARY-RESULT-r1.md) for files and limits.
The extracted PLAY library passed the same 28 browser checks.
Its campaign comparison passed 32 checks. Four entry-link checks passed.
The extracted SOURCE passed 241 game/interface tests and 28 production tests.
All 2,093 retained source files matched their hashes.
