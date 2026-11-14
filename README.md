# Arrow Space Shift

This folder is the main local project for Arrow Space Shift.
The active source comes from `Arrow-Space-Shift-v0.24.1-SOURCE.zip`.
The local update is `0.25.1-dev.8`.
It adds produced FoxDot techno, bounded mechanical feedback, and campaign rule repairs.
It is a development build. The complete campaign release gate remains open.

Flight time continues across level transitions.
Speed grades and bonuses still use the time for each section.

The plain game URL enables sound and music on each launch.
Earlier saved mute flags and zero music levels do not silence a new launch.
Mute still works during play. Other saved settings and progress remain available.
The game requests title music immediately. If browser policy blocks it, Begin or Resume starts audio.
No music query is required. The speaker shows the enabled preference while waiting for browser activation.

The fold lesson now keeps one armed enemy present during fire, fold, and unfold.
Space stays active throughout. Automatic campaign folds remain active.
The route timer shows saved time. Faster clears earn a separate speed grade and up to 1,000 bonus points.
See [the fold lesson result](docs/FOLD-LESSON-RESULT-0.25.1-dev.6.md) for checks and limits.

The [tempo collection](docs/STC-TEMPO-r2.md) adds nine original two-minute pieces across 120–240 BPM.
It includes the added 144 BPM piece and the 240 BPM swell and stereo revision.
Open `http://127.0.0.1:4177/music-library.html?collection=tempo` to listen.
The Collection control also gives access to the original sixteen pieces.
These new pieces are candidates for campaign selection.
The current campaign retains its four previously selected produced tracks.
Title playback now also covers the restored-checkpoint entry menu.
The normal port 4177 serves the current project.

The [WAV download list](docs/WAV-DOWNLOADS.md) supplies all sixteen Act masters and the r7 title theme.
The separate [operator laboratory](operator-lab.html) compares mechanical response, sound order, and actual kernel crossings.
Its [result report](docs/OPERATOR-LAB-RESULT-r1.md) records the current implementation and verification limits.
Use `python tools/package-operator-lab.py` to create its separate PLAY and SOURCE archives.
These laboratory archives do not contain the complete campaign or the sixteen-track music collection.
The later [Identified Return r8 review](track-review-r8.html) adds harmony, bounded percussion responses, and ordered room processing.
Its [result report](docs/STC-IDENTIFIED-RETURN-r8.md) gives the WAV files, production route, and review limits.
The [r9 listening page](track-review-r9.html) supplies the later percussion revision.
It raises only the added percussion by 10 dB after the user's r8 listening response.
The [r9 result](docs/STC-IDENTIFIED-RETURN-r9.md) gives the new WAV and equal-interval comparisons.

The user rejected the `music-r2` character after listening.
The separate [STC study](docs/tasks/STC-STUDY-003.md) develops its replacement.
The earlier campaign archives remain intact.
To open the separate study, run `npm run serve`.
Then open `http://127.0.0.1:4177/divergent-pulse.html`.
Use `npm run package:study` to create its separate review archives.
The current study adds a smooth ear-to-ear fade to the upper acid bassline.
FoxDot sequences the pan targets. SuperCollider renders the fade and room effect.
The browser plays the exported files. It does not author this room render.
The Room control changes the return level. At 0%, it gives the dry mix.
The default Room level is 12%, reduced from 30%.
The current r7 is a new mix from separate original source signals.
See [the r7 result](docs/STC-BASS-FADE-r7.md).
The [r6 room result](docs/STC-STEREO-ROOM-r6.md) and its archives remain available.
The rejected binaural revision remains in its separate r5 archive.

The [Act music collection](docs/STC-ACT-GRAMMAR-r1.md) adds sixteen new original pieces.
Each Act has tracks of 1, 2, 4, and 6 minutes. The collection lasts 52 minutes.
After starting the server, open `http://127.0.0.1:4177/music-library.html`.
Use Include atmosphere to compare the same core with and without pads and noise.
FoxDot authors the new notes and patterns. SuperCollider renders the instruments.
The listening page plays exported layers. It does not change campaign progress.
The WAV masters and authoring sources are in `audio/stc-act-library-r1/`.
Use `npm run package:music` to build the separate listening release.
The campaign now uses the four-minute track from each Act.
The title uses Identified Return r9. Repair and ending use the Act IV atmosphere.
The title requests automatic playback. If browser policy blocks sound, the first permitted action starts it.
Saved mute settings still apply. Listening approval for these campaign selections remains open.

## Start the game

1. Open a terminal in this folder.
2. Run `npm start`.
3. Open the local URL that the server prints.

On Windows, you can also use `START-GAME-WINDOWS.bat`.
Keep the server window open during play.
Use the same browser origin when you continue saved progress.
The normal launcher uses `http://127.0.0.1:4177/`.
If that port is in use, close the previous server before you start this build.
Browser saves do not transfer with a copied source folder.

The main page is `index.html`.
Act IV uses `hyperbolic-act.html`.
The main campaign unlocks Act IV after Curvature Seed collection and extraction.
Act IV retains its separate renderer and checkpoint.

## Check and package

Run `npm run check` to check syntax and run the automated tests.
Run `npm run package:release` to create the local release archives.
To include the external tempo production files, add `-- --tempo-manifest reports/stc-tempo-r2/production-manifest.json`.
Run `python tools/verify-workspace.py` to check the preserved files.
The package command reports its output folder and archive hashes.
The current large release output uses `G:/Music Projects/Arrow Space Shift/releases/`.
The PLAY archive has `index.html` at its root.
The SOURCE archive contains the current source, tests, build tools, and preserved historical files.
The [public source notes](reports/git-release-0.25.1/PUBLIC-SOURCE-NOTES.md) explain the smaller Git selection.
The complete SOURCE archive retains the raw audio masters used by production tests.

## Find the updated files

| Location | Contents |
|---|---|
| `src/`, `assets/`, `tests/` | Active game source, assets, and tests |
| [Workspace index](docs/WORKSPACE-INDEX.md) | Locations, source records, and archive rules |
| `imports/downloads-2026-11-12/files/` | Source and play ZIPs, design PDF, event registry, and 3D prototype ZIP |
| `imports/downloads-2026-11-12/extracted/` | Copies of the related extracted Downloads folders |
| `archive/workspace-v0.15.0-20261112/` | Previous workspace, including its uncommitted changes and pixel masters |
| [Implementation ledger](docs/IMPLEMENTATION-LEDGER.md) | Changes, evidence, and remaining work |
| [AV QA report](docs/AV-QA-REPORT.md) | Test results and test limits |

The Downloads originals remain in place.
The import manifest records source paths and SHA-256 values.
The archive manifest records the previous workspace files.
No Git commit, GitHub push, Sites deployment, or itch.io publication is part of this update.

## Game structure

Act I teaches manual fire and space folds.
Act II adds Klein boundary traversal and returning attacks.
Act III adds deliberate projectile capture and release.
Act IV uses the Bolza geometry kernel for eight lessons and the Double Torus encounter.

Space remains the manual fire control.
The on-screen Guide gives the controls for the current Act.
Act IV uses a local heading view, so its movement controls differ from the scrolling Acts.
Music and effects support the visual information. They must not control combat timing.

## Release limits

The final Hyperbolic Core must be collected and extracted before the repair dock can use it.
The dock requires all four saved part receipts.
Three actual charge deliveries activate the drive. The visible ending saves campaign completion.
The main title recognizes that completion after reload.
Act IV carries ship identity, movement tradeoffs, score, echoes, and equipment records.
The seven equipment operation effects remain inactive in the Bolza chart. The interface states this limit.
The hybrid topology and Act IV collision approximations still need further checks.
Human comprehension, complete campaign play, and physical mobile-device performance remain unverified.
See [known issues](docs/KNOWN-ISSUES.md) and the [completion roadmap](docs/FINISHING-ROADMAP.md).

The new Structural Techno-Cosmism PDF and JSON registry contain proposals.
Only the changes with test evidence in the implementation ledger are implemented.
The 3D prototype is retained as a separate reference.
The live game uses produced recordings for all four Acts, recovery, and ending.
The rejected procedural score is retained only for explicit offline tests.
If a recording fails, music stays silent. Options provides Retry music. SFX remain available.
Master, music, effects, and ambience levels save independently.
The current playback contract is in [the integration report](reports/campaign-music-v1/IMPLEMENTATION.md).
The earlier audio design is in [the previous audio result](docs/AUDIO-RESULT-v0.25.0-dev.1.md).
Audible mix and human enjoyment remain unverified.

The ASD-STE100 Issue 9 PDF request returned HTTP 403 during this work.
The writing uses short sentences and consistent terms.
Full dictionary review and full ASD-STE100 conformity are not claimed.
