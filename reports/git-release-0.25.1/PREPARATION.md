# Git source update preparation

Date: November 13, 2026.
Role: Integration. Coordinator: `/root`.

The user authorized an update to the existing repository.
The target is `https://github.com/7xStars/Arrows-Space-Shift`.
The old local and remote main commit is:
`4a1d77e255db437602de68871d9a57c6f47ecc4d`.
Both refs matched during preparation. No remote divergence was found.

The isolated checkout is:
`G:/Music Projects/Arrow Space Shift/scratch/git-candidate-0.25.1`.
It was cloned from the existing public repository.
The candidate branch is `candidate/0.25.1-dev.1`.
The original D: working tree was not reset, stashed, moved, or deleted.

## Source selection

The current broad selection contains about 331 MB in 1,586 files.
Final reports can change these counts.
It includes all current code, tests, tools, documents, editable art, and encoded assets.
It includes all 81 selected campaign recording files.
It keeps the separate listening and laboratory pages functional.
It also includes nine retained laboratory WAV assets required by the media tests.
It includes FoxDot, SuperCollider, OSC scores, JSON scores, and REAPER handoff files.

Raw authoring and report WAVs remain outside Git.
They remain in the complete SOURCE and separate WAV artifacts.
Private reference PDFs, credentials, caches, old compressed releases, imports,
and local historical archive folders are excluded from this Git update.
The earlier source remains available in Git history.
No source license was added or changed.

The initial selected checkout omitted the laboratory WAV assets.
The media test found that omission. The selection was corrected.
The corrected isolated checkout passed `npm run check`: 299 tests, 75 syntax files.
See `npm-check.log`.

The restored `.gitattributes` will keep checked-out source text on LF.
That policy preserves the pixel master's recorded source hash across platforms.
The restored binary attributes cover PNG, OGG, WAV, OSC, SynthDef, video, and ZIP files.

## Publication access

The connected GitHub token reports `pull=true` and `push=false`.
The local noninteractive Git dry-run could not obtain a login.
It stopped with `Cannot prompt because user interactivity has been disabled`
and `unable to get password from user`.
No remote ref changed. No password or token was requested or read.

The coordinator will complete the final tests and package before the commit.
The final handoff will include a local commit and Git bundle if access remains unavailable.
No itch.io upload or jam submission is part of this source preparation.

See `PUBLIC-SOURCE-NOTES.md` for production and raw-audio reproduction limits.
The report uses short sentences and consistent terms.
A full ASD-STE100 dictionary and editorial conformity review is not claimed.
