# Arrow Space Shift

This folder is the main local project for Arrow Space Shift.
The active source comes from `Arrow-Space-Shift-v0.24.1-SOURCE.zip`.
The local update is `0.25.0-dev.1`.
It adds the final core, extraction, repair challenge, saved ending, and original adaptive audio.
It is a development build. The complete campaign release gate remains open.

The user rejected the `music-r2` character after listening.
The separate [STC study](docs/tasks/STC-STUDY-003.md) develops its replacement.
The earlier campaign archives remain intact.
To open the separate study, run `npm run serve`.
Then open `http://127.0.0.1:4177/divergent-pulse.html`.
Use `npm run package:study` to create its separate review archives.
The current study uses the selected stereo take with a separate room return.
FoxDot sequences the take. SuperCollider renders the room effect.
The browser plays the exported files. It does not author this room render.
The Room control changes the return level. At 0%, it gives the dry mix.
See [the r6 room result](docs/STC-STEREO-ROOM-r6.md).
The rejected binaural revision remains in its separate r5 archive.

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
Run `python tools/verify-workspace.py` to check the preserved files.
Build output goes to `releases/0.25.0-dev.1/`.
The PLAY archive has `index.html` at its root.
The SOURCE archive contains the current source, tests, build tools, and preserved historical files.

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
This update includes original procedural arrangements for all four Acts, recovery, and ending.
Master, music, effects, and ambience levels save independently.
The audio design and measured render limits are in [the audio result](docs/AUDIO-RESULT-v0.25.0-dev.1.md).
Audible mix and human enjoyment remain unverified.

The ASD-STE100 Issue 9 PDF request returned HTTP 403 during this work.
The writing uses short sentences and consistent terms.
Full dictionary review and full ASD-STE100 conformity are not claimed.
