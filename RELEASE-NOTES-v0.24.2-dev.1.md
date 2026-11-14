# Arrow Space Shift 0.24.2-dev.1

Date: November 12, 2026.
Status: local development candidate.

## Source integration

The active source comes from the downloaded v0.24.1 SOURCE package.
The previous modified v0.15.0 workspace remains in `archive/workspace-v0.15.0-20261112/`.
Related Downloads packages, extracted folders, and design references are in `imports/downloads-2026-11-12/`.
The original files remain in Downloads.
SHA-256 verification covers 636 archived workspace files and 1,457 imported files.

## Changes

- Added a detached audiovisual event adapter and an immutable grammar registry.
- Added separate sounds for successful capture, release, and actual boundary crossings.
- Kept the existing music. Act IV reuses the existing recovery arrangement.
- Shared the saved sound, volume, music, reduced-motion, and display options with Act IV.
- Fixed Act IV pause and resume through P.
- Kept Act IV combat and touch controls in one viewport. Options pauses play.
- Added stage-entry score, echo, and seed records for Act IV retry and reload.
- Kept old Act IV saves readable. Old saves have no earlier stage-entry resource records.
- Stopped scheduled music notes when play pauses.
- Replaced the Unix syntax command with a Node script for Windows.
- Added portable release packaging and preservation checks.
- Kept the default local port at 4177 for browser save continuity.
- Added a clear error when another server uses that port.

The source keeps the separate Act IV renderer and the original Bolza kernel.
The update does not change movement rates, damage, collision rules, or attack intervals.
The local QA query does not bank campaign progress.

## Verification

See `docs/AV-QA-REPORT.md` for final command results and browser evidence.
The v0.24.1 automated baseline passed 148 tests.
The previous v0.15.0 workspace passed 140 tests.

## Remaining release work

The full Act III to Act IV ship and loadout handoff remains incomplete.
The final physical component, extraction, drive assembly, repair challenge, and persistent ending remain absent.
The hybrid topology and Act IV collision approximations need further tests.
Complete campaign play, human comprehension, audible mix, and physical-device performance remain unverified.
The 3D prototype and Divergent Pulse encounter remain proposals.

No GitHub push, Sites deployment, or itch.io publication was made.
No source license was selected.
