# Operator laboratory result r1

Date: November 13, 2026.
Candidate: `stc-operator-lab-r1`.
Status: Technical delivery complete. Human listening and recognition remain open.

## Implemented scope

The operator laboratory is separate from the four-Act campaign.
It compares mechanical response, transient growth, sound-processing order, and retained projectile identity.
It does not change flight, collisions, damage, rewards, or campaign saves.
The ten grammar families are project design terms.
Their use in full encounters remains proposed.

| Files | Implemented result |
|---|---|
| `operator-lab.html`, `src/operator-lab-app.js` | Motion, sound-order, and space-kernel views with native controls and exported observations. |
| `src/operator-models.js` | Exact constant-target response, finite matrix operations, and existing topology trace adapters. |
| `src/operator-registry.js` | Ten grammar families, explicit limits, and retained first choices. |
| `audio/stc-operator-lab-r1/` | FoxDot source, SuperCollider processors, nine original WAV clips, measurements, and source records. |
| `assets/audio/stc-operator-lab-r1/` | Runtime clips and the clip catalog. |
| `docs/OPERATOR-SOURCE-REVIEW-r1.md` | Selected book passages, mathematical conditions, and writing-reference limits. |
| `docs/OPERATOR-AV-GRAMMAR-v2.md` | The operator vocabulary and its semantic contract. |

The motion view identifies its normalized target step from zero to one.
This is not a unit-force experiment or a new ship-motion rule.
The measured response includes overshoot and settling within the stated sample window.
The finite matrix view separates transient growth from eventual decay.

The space view uses `traceKlein` and `traceProjectiveSurface` through the existing geometry code.
The projectile keeps one ID across actual crossings.
Path segments stop at identified edges.
No segment sweeps through the position jump.
The hollow forecast is drawing data, not another collider.
The Projective Module chart remains an experimental prototype.
This work does not certify an RP² model, a connected sum, or a global Bolza collision solver.

## Sound comparisons

FoxDot 0.9.0 Pattern classes supplied the original four-note input and finite onset sequence.
The live FoxDot Clock did not run.
SuperCollider 3.14.1 rendered the native synthesis and processors.
The browser plays exported files and does not require FoxDot or SuperCollider.

Each clip has 576,000 stereo frames at 48 kHz.
Each PCM16 WAV file is exactly 12 seconds long.
The nine clips contain a dry source and four paired comparisons:

- A time-varying gate before or after a fixed linear room response.
- A changed gate phase and duty cycle before or after that response.
- A low-pass filter before or after nonlinear saturation.
- A constant gain before or after the linear room response.

Both paths in each pair use the same source and gain policy.
Both nonlinear paths receive the same fixed family trim.
One common linear gain then applies to all nine outputs.
The outputs are not normalized independently.
The maximum sample peak is 0.78.
These sample measurements do not establish equal loudness, comfort, or listening quality.

Gate then room means `R∘G`.
Room then gate means `G∘R`.
Their first output minus their second output is `RG−GR`, or `−[G,R]`.
The time-varying gate gives different outputs for the supplied input.
The constant scalar control gives equal samples in both orders.
Order does not always change the result.

Saturation is nonlinear.
Its ordered-output difference is separate from the bounded linear operator example.
The book's theorems do not certify the native audio implementation.
The room response is an authored signal effect, not a measured physical room.

## Native allocation fault and recovery

The low-memory diagnostic used an 8 MiB real-time memory budget.
`scsynth` returned exit code zero, but its log reported 21 delay-buffer allocation failures.
The constant-gain control then produced a false difference between its two orders.
Its RMS output difference was `0.002275029137797335` before the common gain.
This was a render fault, not evidence of noncommutation.

An explicit 64 MiB budget restored the room paths.
The accepted constant-gain control has an RMS output difference of zero.
The accepted render rejects allocation failures even when the native process returns zero.
The degraded diagnostic is not an accepted listening clip.

The [render record](../audio/stc-operator-lab-r1/render-manifest.json) retains commands, parameters, hashes, and measurements.
The [diagnostic record](../audio/stc-operator-lab-r1/diagnostics/result.json) retains the low-memory failure.

## Existing Act music and WAV delivery

The existing library has four tracks per Act.
Their lengths are one, two, four, and six minutes per Act.
The sixteen tracks total 52 minutes, or 3,120 seconds.
This iteration does not claim sixteen new compositions or new listening approval.
The accepted r7 title-theme take remains separate from the Act masters.

The dedicated WAV archive retains all sixteen original masters.
Every extracted SHA-256 value matches `WAV-MASTER-MANIFEST.json`.
All sixteen headers report stereo PCM16 at 48 kHz.
Every frame count matches its declared duration.
All archive paths were validated before extraction into the G scratch folder.
The archive contains no PDF files.
Its hash remained unchanged after browser verification.

The extracted static `index.html` opened through a native `file:` URL in Microsoft Edge 157.0.4341.46.
Keyboard Tab reached the first audio control.
Space started, paused, and resumed the first track.
Its metadata gave 60 seconds, and its playback time advanced.
All ten native-player checks passed.
The screenshot was inspected at 1280 by 900 pixels.
Track names, lengths, links, focus, and controls were readable in the inspected area.

The browser playback check covered the first track.
It did not play all sixteen tracks from start to finish.
Header and hash verification covered all sixteen files.
The [WAV delivery report](../reports/stc-operator-lab-r1/wav-delivery.json) records this distinction.
The [native-player screenshot](../reports/stc-operator-lab-r1/wav-delivery-native-edge.png) supplies presentation evidence.

## Executed source verification

| Command or method | Current result | Evidence limit |
|---|---|---|
| `npm run check` | 261 tests passed. Syntax passed for 64 files. | The complete game suite includes the twenty laboratory and server tests. |
| G FoxDot Python, `-m unittest discover -s tests -p 'test_*.py'` | 37 tests passed. | This is the full Python suite, not 37 additional native audio tests. |
| G FoxDot Python, `-m unittest discover -s tests -p test_operator_audio.py` | Nine passing native audio production tests. | This subset is included in the full Python count. |
| Safe extraction, native WAV headers, and SHA-256 | Sixteen of sixteen files passed. Total: 3,120 seconds. | No human listening result. |
| Native extracted page in headless Edge | Ten of ten checks passed. | First-track startup and control behavior only. |
| `node tools/operator-lab-browser.mjs` | 72 source browser checks passed. | Headless Microsoft Edge. No page exceptions, normal missing assets, or storage writes. |

The final archive identities are in `releases/stc-operator-lab-r1/MANIFEST.json`.
The extracted-build results are supplied beside those archives in `VERIFICATION.json`.
These adjacent records identify the packaged files after this source report was prepared.
The PLAY and SOURCE archives contain the separate laboratory. They do not contain the complete campaign.
The sixteen-track music collection retains its earlier complete PLAY and SOURCE archives.

The G Python executable is `G:\Music Tools\FoxDot\venv\Scripts\python.exe`.
The laboratory browser command is `node tools/operator-lab-browser.mjs`.
The nine-test production record is [production-tests.txt](../audio/stc-operator-lab-r1/production-tests.txt).
The [source browser record](../reports/stc-operator-lab-r1/browser-source/results.json) includes the tested file hashes.
The [Node result](../reports/stc-operator-lab-r1/automated-check.txt) retains the final source command output.
The browser tool also covers sound cancellation, missing-audio recovery, and exported event order.
The rendered chart, desktop, 320-pixel, RTL, and 200% text screenshots were inspected.
Long native select text is shortened at 200%. Keyboard selection and accessible names remain available.

## Final extracted-build result

Both extracted archives passed the same 72 browser checks.
Both root entries returned HTTP 200 and loaded the laboratory with sound muted.
Neither root-entry run produced missing resources or page exceptions.
The extracted SOURCE archive also passed twenty Node tests and nine Python production tests.
Representative screenshots were inspected after those runs.
All 2,093 preserved source files retain their recorded hashes.
All twelve earlier campaign and music archives retain their recorded hashes.
The r7 title WAV matches the file in its earlier SOURCE archive.

| Delivery | File | Bytes |
|---|---|---:|
| Laboratory PLAY | [PLAY ZIP](../releases/stc-operator-lab-r1/Arrow-Space-Shift-Operator-Lab-r1-PLAY.zip) | 5,268,563 |
| Laboratory SOURCE | [SOURCE ZIP](../releases/stc-operator-lab-r1/Arrow-Space-Shift-Operator-Lab-r1-SOURCE.zip) | 10,583,341 |
| Sixteen Act WAV masters | [WAV ZIP](../releases/stc-act-library-r1/Arrow-Space-Shift-16-Act-WAV-Masters-r1.zip) | 500,284,295 |
| Title-theme WAV | [r7 WAV](../audio/stc-study/foxdot-bass-r7/room_mix.wav) | See the retained title hash in the release verification. |

The [release verification](../releases/stc-operator-lab-r1/VERIFICATION.json) contains final hashes and extracted-build evidence.
This section records the later archive checks. The source report inside the archive precedes them.
The laboratory is available locally at `http://127.0.0.1:4192/operator-lab.html`.
The complete Act listening library remains available at `http://127.0.0.1:4192/music-library.html`.
No publication is part of this local delivery.

## Source and evidence limits

The source review examined complete pages in selected book sections.
It did not review the complete book.
Spectral-radius, local-invertibility, projection, and stability claims retain their stated assumptions.
A projection need not be orthogonal.
An involution does not establish a game-surface model by itself.
Local checks do not establish global correctness merely because they are called local.
Mechanical animation and player learning are creative applications, not conclusions supplied by the book.

The local writing reference is ASD-STE100 Issue 8, April 2021.
The review used selected writing rules and dictionary entries.
It does not establish full Issue 9 conformity or a complete comparison between editions.
Reference PDFs and complete extracted text remain outside the game and audio delivery archives.

The supplied video links are creative references.
This result does not claim an audition or a complete transcript review of those videos.
No reference recording is included in the supplied music.

First recorded choices remain separate from later feedback and corrections.
They do not establish human understanding.
If a person opens explanatory material first, record that assistance before interpreting the choice.
Human listening, recognition, comfort, and unfamiliar-case transfer remain open.
No physical-device audio, screen-reader, performance, or physical-latency result is claimed here.
No GitHub, itch.io, or ChatGPT Sites publication is claimed.

## Proposed next bounded study

Use one existing short track from each Act.
Keep the accepted title take separate.
For each Act, compare one fixed motif with one controlled change.
Use a different texture for each Act while retaining a recognizable phrase.
Keep the study within the current campaign scope.

1. Obtain a listening observation for the unmodified short track.
2. Change one musical property, such as filter motion, voicing, or gate order.
3. Compare matched output levels and record the listener's preference.
4. Pair one changed motif with one existing, verified topology operation.
5. Record the first prediction before feedback or a destination forecast.
6. Present an unfamiliar input or timing arrangement governed by the same relation.
7. Compare audible and muted conditions.
8. Record assistance, corrections, and recognition separately.

The first decision is whether the controlled change improves musical character and structural recognition.
The result must precede wider encounter integration.
This proposal does not authorize a campaign-wide audiovisual rewrite or a change to combat timing.
