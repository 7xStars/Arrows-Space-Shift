# Public source contents

Candidate: 0.25.1-dev.1.

The Git candidate contains the current browser code, tests, editable pixel master,
production tools, audio scores, FoxDot and SuperCollider source, and runtime assets.
It retains the earlier repository history.
It does not change the source-license notice.

## Run and verify

Run `npm start` from the repository folder.
Open the URL from the local server.
Run `npm run check` for the JavaScript game tests.
Run `npm run art:export` to export the reconstructed pixel master.
Run `node tools/export-pixel-assets.mjs --check` to compare its pixels and manifest.

The live game does not require FoxDot, SuperCollider, or REAPER.
It plays the included original OGG files with Web Audio.
All 81 selected campaign recording files are included.
The separate laboratory and listening pages retain their encoded assets.

## Raw audio downloads and production

Raw WAV masters and intermediate WAV captures are excluded from Git.
They remain in the complete SOURCE archive and the separate WAV download archive.
This keeps the Git update smaller and avoids repeated large binary history.

The complete source artifact is named:
`Arrow-Space-Shift-v0.25.1-dev.1-SOURCE.zip`.
The sixteen-track master archive is named:
`Arrow-Space-Shift-16-Act-WAV-Masters-r1.zip`.
The local release report supplies their verified locations and hashes.
A public download URL has not yet been assigned.

The Act authoring files are in `audio/stc-act-library-r1/`.
Its `act12.json` and `act34.json` define the pieces.
Its `compose.py` uses FoxDot Patterns to produce finite event scores.
Its `instruments.scd` renders those events with SuperCollider.
Run `tools/render-act-library.py` in a configured FoxDot environment to render the pieces.
Run `tools/verify-act-library.py` after rendering.
Run `tools/export-campaign-music.py` to produce the segmented campaign stems.

The title r9 production files are in `audio/stc-study/foxdot-percussion-r9/`.
They retain the r8 and r7 foundation inputs.
Reproduction of that retained foundation requires the WAV inputs from SOURCE.
The REAPER files are editing handoffs. REAPER did not render the delivered audio.

Some Python audio tests inspect retained raw WAV files and their hashes.
Extract the complete SOURCE archive before running those tests.
The local production environment used:
`G:/Music Tools/FoxDot/venv/Scripts/python.exe`.
Tool installation paths can differ on another computer.
Inspect the production scripts and their reported dependencies before rendering.

## Exclusions and evidence limits

Git excludes private reference books, PDFs, caches, credentials, old release ZIPs,
and preserved local archive/import folders.
The previous code remains available in Git history.
The complete SOURCE artifact also retains the allowed historical source files.

No itch.io upload or jam submission follows from a Git update.
The development-history and human acceptance limits remain in the current QA report.
No full ASD-STE100 dictionary or editorial conformity review is claimed.
