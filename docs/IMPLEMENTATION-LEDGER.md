# Implementation ledger

Current candidate: `0.25.1-dev.5`.
The current task is [THREE-ACT-JAM-015](tasks/THREE-ACT-JAM-015.md).
The user deferred content above Act III until after the jam.
The jam finish requires Curvature Seed collection and extraction.
Act IV and repair entries are gated before their runtimes load.
Their existing source and saved data remain intact.
The PLAY package uses three Act recordings and the title track.
The full source and music collection remain preserved.
The user confirmed audible title, campaign music, and firing sounds in the fresh dev.4 tab.
The native post-master audio diagnostic passed fourteen checks.
The current QA report separates edition checks, listening observations, and publication status.

## Prior candidate: 0.25.1-dev.4

The previous task is [TITLE-SPEAKER-014](tasks/TITLE-SPEAKER-014.md).
Title music is requested before sprite loading.
The recording can preload while browser audio permission is pending.
The old title text button is replaced by a lower-left speaker in the main game view.
The control preserves mute and supports keyboard input.
Compact layout checks also exposed the hidden Act III echo panel. It now sits in the HUD.
The current QA report records automatic and blocked startup separately.

## Prior candidate: 0.25.1-dev.3

The previous task is [AUDIO-CONTINUITY-013](tasks/AUDIO-CONTINUITY-013.md).
The source keeps the current Act during resume.
Recovery and Echo Forge selection retain a quiet rhythmic reference.
Warnings lower music less. Gameplay and topology rules remain unchanged.
The [discography](DISCOGRAPHY.md) contains 26 distinct compositions and 71:16.64 of music.
Native playback, archive checks, and the original fold report have separate evidence in the current QA report.

## Prior candidate: 0.25.1-dev.2

The previous task is [STC-TEMPO-012](tasks/STC-TEMPO-012.md).
It adds the nine-piece tempo collection, including 144 BPM.
The 240 BPM listening feedback requested electronic swells and more upper-range panning.
Title playback includes new-game and restored-checkpoint entries.
The normal 4177 launcher now serves the current project.
The title-entry browser check passed 19 checks.
The original collection passed 28 browser checks after its new collection selector.
Final music revision and package results are recorded in `reports/stc-tempo-r2/`.

## Prior candidate: 0.25.1-dev.1

The current task is [JAM-INTEGRATION-011](tasks/JAM-INTEGRATION-011.md).
It replaces the rejected live score with four produced Act recordings and the r9 title.
It adds bounded mechanical recoil and coupled damage feedback in the main and Bolza renderers.
It repairs main-campaign control authority, the hybrid join deadline, and local Bolza swept collision.
The live score has no automatic procedural fallback. A failed recording leaves SFX available.
The full suite currently passes 299 game tests and 64 production/package tests.
Five actual-combat presentation checks and 18 audio page checks passed.
The source now includes a reconstructed editable pixel master.
All 109 sprite and atlas exports retain identical file and pixel hashes.
All 2,093 preserved historical files still match their recorded hashes.
The event reader avoids repeated full scans of append-only history.
The linked browser path completed all four Acts, four earned extractions, repair, ending, and reload.
The first controller timed out in Act IV. The second used the normal progress-import control to continue its earned profile.
Both reports remain available. This is automated input, not human play.
Use the versioned release manifest for final archive paths and hashes.

## Earlier candidate and laboratory records

The following dated records describe their stated earlier candidates.
The final core, extraction, repair dock, saved ending, independent audio gains, and original Act arrangements are implemented.
See [the completion report](COMPLETION-QA-v0.25.0-dev.1.md) for current tests and evidence limits.
The dated records below retain the earlier baseline and review.
The current separate music study is r7 with an upper-bass fade and less room.
See [the bass result](STC-BASS-FADE-r7.md).
Source checks passed 233 game tests, 12 production tests, and 73 browser checks.
The extracted study passed the same checks. Its campaign comparison passed 32 browser checks.
The root entry and campaign link passed 2 checks. All 2,093 preserved files matched.
The r6 source and release archives remain intact.

## Act music collection r1

The user requested four pieces for each Act, from one to six minutes.
Sixteen original FoxDot scores and native SC renders are complete.
Each Act has 60-, 120-, 240-, and 360-second tracks. The total is 3,120 seconds.
All 16 WAV masters and 64 encoded files passed length, hash, finite-sample, and sample-headroom checks.
The new vocabulary includes ordered motif operations, harmonic persistence, and irregular atmospheric entries.
The separate listening player keeps one selected core/atmosphere pair on one timeline.
The [grammar](STC-ACT-GRAMMAR-r1.md) and [listening protocol](ACT-LIBRARY-LISTENING-PROTOCOL.md) separate implementation from human evidence.
Browser and package results are recorded in the collection result.
Source and extracted SOURCE passed 241 game/interface tests and 28 production tests.
Source and extracted PLAY library each passed 28 browser checks, including all sixteen native track pairs.
The packaged campaign comparison passed 32 browser checks. Four entry-link checks passed.
Listening approval and campaign use remain open.

## Binaural revision r5

The user approved HRTF processing for the current piece's kick layers, hum, and repeated acid notes.
The deep kick body remains centered.
The study supplies a session-only headphone/stereo control.
The full suite passed 229 tests.
The source and extracted PLAY study passed 56 browser checks each.
The packaged campaign comparison passed 32 browser checks.
The change does not install title music or compose the rest of the campaign.
See [the r5 result](STC-BINAURAL-r5.md).

## Structural Techno-Cosmism study r4

The user rejected the r2 chord direction.
The user found the r3 techno study closer and requested harder drums and a different synth tone.
The separate r4 pilot implements those changes and The Divergent Pulse.
It does not replace the campaign soundtrack or add campaign rewards.
The first prediction is retained before feedback.
Source and extracted SOURCE checks passed 226 tests.
The extracted PLAY study passed 43 browser checks.
Its campaign comparison passed 32 browser checks.
Musical acceptance, player understanding, and physical-device performance remain open.
See [the r4 result](STC-STUDY-RESULT-r4.md).

## Current implementation and verification

| Area | Change | Current evidence |
|---|---|---|
| Continuity | Saved Act III bridge; retained Act IV ship and run data | Checkpoint tests; complete seeded simulation chain |
| Final encounter | Three attack phases; recovery; physical core and extraction | Normal keyboard boss fixture, including reload before extraction |
| Repair and ending | Four validated receipts; three physical charge deliveries; saved completion | Keyboard repair fixture and reload checks |
| Progress transfer | Full export; old import support; recovery and failed-save protection | Ten transfer tests and three-page browser failure checks |
| Audio | Original arrangements; independent gains; bounded voices; gesture recovery; eight-bar music revision | Scheduler, ten revised offline renders, and browser checks; revised listening acceptance remains open |
| Projectile cues | Stable identity on real crossings; forecasts remain render-only | Identity and geometry regression tests |
| Ship and projectile forecasts | Signed Act IV travel; remaining projectile life and fold interval | Geometry regression; 27 Act IV tests and 32 browser checks passed |

The user reviewed two audio files and requested a clearer musical result.
The first packaged startup, boss, repair, and audio browser groups passed.
The source suite passes 212 tests after the music and forecast revisions.
The revised extracted PLAY passed startup 32, boss extraction 8, repair 14, and audio 8 browser checks.
The extracted SOURCE passed 212 tests and verified all 2,093 preserved files.
Release archives and their SHA-256 manifest are in `releases/0.25.0-dev.1/`.

## Historical November 12 candidate

Local development version: `0.24.2-dev.1`.
Date: November 12, 2026.
Objective: make this folder the current Arrow Space Shift workspace.
Apply the first safe audiovisual changes from the new design files.

## Source and preservation

| Item | Change | Evidence and status |
|---|---|---|
| Previous workspace | Preserved modified v0.15.0 under `archive/workspace-v0.15.0-20261112/` | 636 files checked by SHA-256 after the move |
| Downloads collection | Copied related files and extracted folders under `imports/downloads-2026-11-12/` | 1,457 copied files checked against their source hashes; 31 matched files or folders |
| Active source | Imported v0.24.1 source at the root | Source ZIP retained in the import folder |
| Existing Git history | Retained root `.git` | No commit or push made |
| New design input | Retained PDF, JSON registry, and 3D prototype ZIP | Proposals remain distinct from implemented features |

## Baseline checks

| Source | Command | Result |
|---|---|---|
| Previous modified v0.15.0 | `npm run check` | Could not run: the package had no `check` script |
| Previous modified v0.15.0 | `npm test` | 140 passed; 0 failed |
| Staged v0.24.1 | `node --test tests/*.test.mjs` | 148 passed; 0 failed; 0 skipped |

The imported syntax command uses Unix `find` and `xargs`.
The local build tools replace that command for Windows use.
The baseline results do not establish human comprehension or complete campaign acceptance.

## Local implementation

| Area | Intended result | Verification status |
|---|---|---|
| Build tools | Portable syntax check and stable local save origin | Syntax, occupied-port, and archive checks passed |
| Event grammar | Detached presentation events for supported actual game events | Ten AV tests passed; full suite passed |
| Audio | Separate capture, release, and topology cues; retain existing music | Event and scheduler tests passed; browser context unlock passed; audible review remains open |
| Act IV settings | Use shared saved audio and reduced-motion preferences | Regression and browser checks passed |
| Act IV pause | Allow the pause key to resume play | DOM and browser checks passed |
| Act IV checkpoint | Retain stage-entry score and echoes for retry and reload | Six new checkpoint tests passed; old saves remain readable |
| Act IV layout | Keep combat and controls in one viewport; move long text to Options | Browser bounds passed at 320px and larger; modal pause, Escape, and focus passed |
| Documentation | Source guide, design record, workspace index, six AV documents, and QA record | Written with implementation limits |

Final automated result: `npm run check` passed 165 tests with 0 failures and 0 skips.
Source browser result: 32 checks passed with no page exceptions or failed requests.
The extracted PLAY archive passed the same 32 browser checks.
Both release archives passed integrity and unique-name checks.
`python tools/verify-workspace.py` verified all 2,093 preserved files.

## Ordered completion work

1. Complete the Act III to Act IV progression handoff.
2. Verify Act IV collision paths, ordinary clears, and encounter fairness.
3. Add the final physical component and extraction sequence.
4. Add drive assembly, a playable repair challenge, and a persistent ending.
5. Run complete campaign browser tests with clean and existing profiles.
6. Run human comprehension and physical-device tests.
7. Complete release credits, provenance, jam eligibility review, and submission materials.

The first audiovisual slice does not complete the unified campaign milestone.
The final component, repair, ending, and complete human playtest remain absent.
The 3D prototype and the proposed Divergent Pulse encounter are not active campaign features.

## November 13 review

The [Game Off review](GAME-OFF-REVIEW-2026-11-13.md) assesses the same runtime candidate before further implementation.
It uses the official six category names and separate internal rating anchors.
Audio quality remains unscored pending listening evidence.
The review used the role instructions in `D:\Projects\games\agents`.
Fresh checks passed 165 automated tests and 32 browser checks.
The [QA report](../reports/review-2026-11-13/verification.md) records the suspended-audio recovery defect and wrong Curvature Seed pickup message.
The review changed documentation and project workflow instructions only.
The next work remains campaign continuity, the required repair ending, defect repair, and release checks.

## Stereo room revision: r6

The entries above record earlier checkpoints. Later completion and study reports supersede their open-work lists.
The current room revision follows the user's stereo selection and FoxDot instruction.
FoxDot Patterns sequence the selected recording. SuperCollider renders a separate room return.
The dry recording retains every source PCM sample. The render adds a three-second tail.
The study plays two synchronized exported files with a functional Room control.
It keeps actual action cues separate. It does not change campaign rules or rewards.

`npm run check` passed 233 tests. The FoxDot production suite passed 5 tests.
The source study passed 73 browser checks in Microsoft Edge.
Native decoding found equal stereo file lengths and no non-finite samples.
Measured dry plus room mixes stayed below full scale at Room 0%, 30%, and 100%.
Package verification is recorded in the [r6 result](STC-STEREO-ROOM-r6.md).
Listening acceptance, an actual in-world sound source, and other Act textures remain open.

## Operator laboratory and WAV delivery: r1

The [operator result](OPERATOR-LAB-RESULT-r1.md) supersedes the laboratory work items in earlier study records.
The existing campaign remains `0.25.0-dev.1`. This change is a separate laboratory candidate.

| Area | Implemented result | Verification |
|---|---|---|
| WAV delivery | Dedicated archive of sixteen unchanged Act masters; separate r7 title WAV | All sixteen hashes and headers match; 3,120 seconds; ten native Edge playback checks passed |
| Mechanical models | Exact second-order response, sampled settling measures, coupled transient comparison | Seventeen model tests passed, including variable time intervals and real kernel tracing |
| Ordered sound | Nine native FoxDot/SuperCollider clips; modulated gate, constant control, nonlinear filter/saturation | Nine production tests passed; constant control is sample-identical |
| Interface | Three laboratory sections, first-choice records, actual topology forecasts, reduced motion, silent use | Seventy-two source browser checks passed; no campaign storage writes |
| Local audio server | Correct WAV/Vorbis media types, accurate response length, body-free HEAD | Real HTTP regression passed; no unsupported range claim |
| Release | Separate PLAY and SOURCE archives; reference PDFs excluded | See the result report and package manifest for final extracted-build evidence |

The complete Node suite passed 261 tests. The Python production suite passed 37 tests.
The low-memory native audio fault and repaired positive control are recorded in the result report.
The grammar expands the design vocabulary. It does not prove human recognition or change campaign rules.
Human listening, transfer learning, full campaign acceptance, screen-reader use, and physical devices remain open.
Both extracted laboratory archives then passed 72 browser checks each.
Their root entries returned HTTP 200 with muted startup and no missing resources.
The extracted SOURCE archive passed twenty Node tests and nine Python production tests.
All 2,093 preserved files and twelve earlier release archives retain their recorded hashes.
The [final verification](../releases/stc-operator-lab-r1/VERIFICATION.json) identifies the exact archives and evidence.

## Identified Return: r8

The user requested an improvement to the supplied r5 and r7 title-track WAVs.
The new r8 candidate retains the r7 master as its unchanged foundation.
FoxDot Patterns author the added Fm7 voicings, percussion responses, and gate controls.
SuperCollider renders the new voices and both gate-and-room orders.
The changes do not alter campaign timing, collision, damage, rewards, saves, or soundtrack selection.

The foundation control matches the original r7 file exactly.
The two supplied masters and the retained r7 stems preserve their hashes.
The candidate and control have the same final gain and full frame interval.
The new track measures -14.5 LUFS. Its estimated true peak is -2.7 dBFS.
The new layer is 17.39 dB below the foundation over the declared active intervals.

The complete Node suite passed 261 tests. The complete Python suite passed fifty tests.
Thirteen independent Python tests cover the new score, source identity, native output, gaps, and additive reconstruction.
The source review page passed 44 browser checks. All nine WAV choices played natively.
The Node server now supports real byte-range requests for media seeking.
The actual HTTP regression and independent browser seek checks passed.
The headless hidden-page lifecycle case remains unverified.
Human listening must assess the harmony, room articulation, and subtle percussion responses.
The [result](STC-IDENTIFIED-RETURN-r8.md) and adjacent release verification identify the exact candidate and final archive evidence.

## More distinct percussion: r9

After listening to r8, the user requested more distinct percussion.
The r9 native render raises only mechanism-event amplitudes by 10 dB.
The source score, voices, harmony, stereo positions, gates, and room parameters remain unchanged.
The original r5, r7, and r8 WAV files retain their hashes.
The r8 release archives remain intact.

The measured percussion increase is 10.00001 dB.
The new full track retains the r8 rounded measurements of -14.5 LUFS and -2.7 dBTP.
The full-track difference matches the percussion difference within one PCM sample unit.
The four unrelated output components retain their r8 hashes.
The complete Python suite passed 58 tests, including eight new r9 tests.
The complete Node suite passed 261 tests. Syntax passed for 68 files.
The source listening page passed 41 browser checks.
The [r9 result](STC-IDENTIFIED-RETURN-r9.md) and adjacent release verification record final package checks and limits.
No new r9 listening result, campaign soundtrack replacement, or publication is claimed.
Both extracted r9 archives passed 41 browser checks each.
The extracted SOURCE passed one HTTP test and 21 Python tests.
The actual root entries passed 21 additional checks.
The [r9 final verification](../releases/stc-study-r9/VERIFICATION.json) binds these results to the archive hashes.
