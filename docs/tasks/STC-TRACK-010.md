# STC-TRACK-010

Date: November 13, 2026.
Candidate: `identified-return-r9`.
Status: Technical delivery complete. New listening review remains open.

## User observation

After the r8 listening question, the user selected: "Make the percussion more distinct".
This is a preference for a stronger percussion response.
It is not approval of the complete mix or a human recognition result.

## Controlled revision

Keep the complete r8 source, WAV files, and release archives unchanged.
Render a separate r9 candidate.
Raise only the added mechanical percussion by 10 dB.
Apply that gain to the native mechanism-event amplitudes.
Retain the exact FoxDot notes, event times, gate controls, chord voicings, and pan positions.
Retain the native voices, harmony level, room parameters, layer gain 1.25, and final gain 1.
Do not add hits or change the original kick, bass, or drums.
Keep the full frame interval and ending.

Supply the r9 full WAV and a short percussion comparison against r8.
Use the same comparison interval and gain policy.
Keep both versions available in the listening page.

## Owners

| Owner | Task |
|---|---|
| `/root` | Contract, listening page, excerpts, packages, and integration |
| `/root/r8_production` | New r9 native renderer, source copies, WAV files, and production proof |
| `/root/r8_qa` | Independent gain, source identity, delta, level, and native-player checks |

## Verification

The two supplied masters and r8 WAV files must retain their hashes.
The r9 harmony, ordered room proofs, and foundation must match their r8 files.
Measure the percussion gain change and the full-track true peak.
Compare the full-track difference with the difference between percussion stems.
Preserve the added-layer gaps and finite output values.
Keep technical results separate from the user's listening preference.
This revision does not alter campaign rules, saves, or soundtrack selection.

## Final result

The full Node suite passed 261 tests. Syntax passed for 68 files.
The full Python suite passed 58 tests, including eight new r9 tests.
The source page and both extracted archives each passed 41 browser checks.
The extracted SOURCE passed one HTTP test and 21 Python tests.
The actual root entries passed 21 additional checks.
The r8 comparison files and archives retain their hashes.
The [release verification](../../releases/stc-study-r9/VERIFICATION.json) identifies the final artifacts and evidence.
Human listening must determine whether the stronger percussion satisfies the user's preference.
