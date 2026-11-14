# Identified Return r8

Date: November 13, 2026.
Candidate: `identified-return-r8`.
Status: Source technical review passed. Final archive verification is supplied beside the archives.

## Result

The new candidate adds three operator relationships to the retained r7 mix.
It preserves the existing drum timing, acid phrase, upper-acid stereo movement, and centered low path.
The new additions use installed FoxDot Patterns and custom SuperCollider SynthDefs.
The retained foundation predates those new FoxDot notes.
The finite adapter does not run the live FoxDot Clock.
REAPER was not used for the render.

The r5 and r7 masters remain unchanged.
The r5 file is an earlier reference. It is not an aligned stem for this mix.
The r7 foundation control is byte-identical to the supplied r7 master.
The candidate is that foundation plus the exported new layer, before PCM quantization.
It adds no full-mix compressor or full-mix room processor.

## Musical changes

| Relationship | Implemented expression | Preserved property |
|---|---|---|
| Harmonic persistence | Seven Fm7 entries use two voicings. The filter changes gradually. | Pitch classes F, A-flat, C, and E-flat remain the same. |
| Transient growth and recovery | Four sparse three-hit responses use selected norms from the declared coupled matrix. | The gain pattern rises and decays within a fixed bound. |
| Operation order | The added harmony uses gate then room before bar 32. It uses room then gate after bar 32. | Both room paths use the same source, timing, and gain. |

The new percussion also contains eight individual answers between existing attack times.
It adds no regular kick pulse.
The original acid remains the main voice.
The new harmony uses filtered sine and variable-saw components.
The new mechanical voice uses short, pitched partials.
These are original synthesis sources. No external recording, sample pack, or impulse response was added.

The coupled matrix supplies a musical gain sequence.
It is not a model of a physical drum or ship movement.
The room processors supply an authored sound effect. They do not model the game surface.
The music does not predict attacks or change gameplay timing.

## Times for comparison

Bar numbers start at zero. The first bar starts at 0.04 seconds.
The tempo is 134 BPM. The form has forty bars.

| Time | Expression |
|---|---|
| 0:00–0:07 | Retained r7 opening alone. |
| From 0:07 | Sparse added percussion responses. |
| From 0:21.53 | Fm7 harmony enters. |
| From 0:35.86 | The chord voicing changes while its pitch classes remain fixed. |
| 0:50.19–0:57.35 | No added percussion. The harmony and gated room supply the new quiet detail. |
| 0:56.46–0:57.35 | Every added component is zero. The retained foundation and its tail remain. |
| From 0:57.35 | The original pulse returns. The new harmony changes room-and-gate order. |

The complete WAV lasts 76.6418 seconds and includes the ending.
It is not a seamless loop.
The comparison clips use equal source-frame intervals and 20 ms edge fades.
They receive no separate gain adjustment.

## Levels and routing

The foundation retains its existing 0.12 room relationship.
The new harmony uses a separate 0.11 room contribution.
The added layer uses gain 1.25. One final linear gain of 1 applies to all full output files.
The proof stems retain their mix level. They are quieter than the complete track.
The added layer is 17.39 dB below the foundation in the measured active intervals.

| Measurement | New candidate | Foundation control |
|---|---:|---:|
| Integrated loudness | -14.5 LUFS | -14.6 LUFS |
| Estimated true peak | -2.7 dBFS | -2.9 dBFS |
| Format | Stereo, 48 kHz, PCM16 | Stereo, 48 kHz, PCM16 |
| Sample frames | 3,678,806 | 3,678,806 |

The new render uses an explicit 64 MiB real-time memory budget.
The renderer rejects native synthesis and allocation errors even when the process returns zero.
All raw multichannel files remain in the G scratch folder.

The first render used an explicit layer-gain argument before its parser default was updated.
A later source-identity test detected the resulting renderer-hash difference.
The frozen default command then rendered all seven full WAV files again.
Every WAV retained its earlier hash. The final manifest matches the current renderer.
The [provenance record](../audio/stc-study/foxdot-operator-r8/provenance-repair.json) retains this repair.

## Source and editable files

| Files | Purpose |
|---|---|
| `audio/stc-study/foxdot-operator-r8/compose.py` | Actual FoxDot note, voicing, rhythm, pan, gate, and gain Patterns. |
| `operator_track.scd` in that folder | Original native voices and both ordered room paths. |
| `tools/render-foxdot-operator-track.py` | Native compilation, score, render, shared gain, and source preservation. |
| `tools/prepare-track-review-r8.py` | Equal-interval short comparisons and REAPER handoff. |
| `Identified-Return-r8.RPP` in the audio folder | Editing handoff with foundation and added layer active. The full reference track is muted. |
| `track-review-r8.html`, `src/track-review-r8.js` | One native comparison player with section controls. |
| `tests/test_foxdot_operator_track.py` | Independent score, input identity, signal, and native production tests. |
| `reports/stc-study-r8/input-audit.json` | Separate measurements of the two supplied files. |
| `reports/stc-study-r8/output-audit.json` | Independent output levels, mono behavior, source identity, and signal reconstruction. |

The REAPER project has not been opened or rendered in REAPER.
Its relative file paths refer to the WAV files in the same folder.
The project contains no external plugin dependency.

## Technical review

The baseline `npm run check` passed 261 tests.
The full Python production suite passed fifty tests, including thirteen new r8 tests.
The independent additive reconstruction differs by at most one PCM sample unit.
The foundation control retains every original r7 sample.
The native gate-and-room paths produce distinct measured tails under the declared closed intervals.
No full-scale or non-finite output sample was found.
The mono-fold power difference remains approximately -0.054 dB.
These measurements do not establish perceived depth, comfort, or quality.

The local Node server initially returned full responses for requested WAV ranges.
Edge then exposed a zero-length seekable interval. Section buttons could not reach their destinations.
The repair adds bounded, open-ended, and suffix byte ranges for GET requests.
HEAD continues to return metadata without a body. It ignores Range.
The HTTP regression includes invalid bounds, large integers, unsupported forms, and conditional range fallback.
The implementation follows the relevant [RFC 9110 range semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-14).
The interface reports a selected position after the native seek finishes.

Final source and extracted-package browser results are supplied with the release verification.
The review archive contains this separate music page. It does not contain the campaign.
The source review passed 44 browser checks with no page exceptions, missing normal assets, or storage writes.
All nine player choices loaded and advanced through native playback.
The full-track section controls reached their measured destinations.
Native file startup and keyboard playback also passed.
Desktop, 320-pixel, and 200% text screenshots were inspected.
The mobile comparison rows retain readable text without page overflow.
The headless browser did not produce an actual hidden-page transition.
That lifecycle case remains unverified. No event was simulated to claim a pass.

The Node command `npm run check` passed 261 tests. Syntax passed for 66 files.
The Python command was `python -m unittest discover -s tests -p 'test_*.py'` in the installed FoxDot environment.
It passed fifty tests, including thirteen r8 tests.
The exact Python executable is `G:/Music Tools/FoxDot/venv/Scripts/python.exe`.
The source player command was `node tools/track-review-r8-browser.mjs`.
The [release verification](../releases/stc-study-r8/VERIFICATION.json) identifies the final archive checks.

## Listening questions and limits

Compare the new mix and foundation at the same playback volume.
Listen to the harmony entry and the break-and-return clips first.
Determine whether the added harmony supports the acid phrase.
Determine whether the changed room tail is useful and restrained.
Determine whether the short percussion response is clear under the original drums.

The percussion-only addition has a low average level because its events are sparse.
Its recognition under the existing drums remains a listening question.
The final two-beat interval stops the new layer. It is not total silence in the retained foundation.
No human listening, comfort, recognition, physical-device, or complete campaign result is claimed.
No campaign soundtrack replacement, GitHub push, Sites deployment, or itch.io publication occurred.
The writing uses short sentences and consistent terms. Full ASD-STE100 conformity is not claimed.

## Later listening response

The user selected: "Make the percussion more distinct".
The separate [r9 revision](STC-IDENTIFIED-RETURN-r9.md) raises only the added percussion.
The r8 WAVs and release archives remain unchanged for comparison.
Both extracted r8 archives passed 44 browser checks each.
The extracted SOURCE passed one HTTP test and thirteen Python production tests.
Their root entries passed twenty additional checks.
The adjacent `releases/stc-study-r8/VERIFICATION.json` retains those final results.
