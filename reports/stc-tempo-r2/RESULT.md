# STC tempo studies r2: production result

Date: November 13, 2026. State: native renders and file checks complete.

Nine new original pieces last two minutes each. The collection lasts 18 minutes.
The tempos are 120, 136, 144, 152, 168, 184, 200, 220, and 240 BPM.
The composers supplied new cells, drum patterns, harmony, and forms.
These files do not change the playback rate of the older recordings.
The earlier sixteen Act masters and r9 title source remain separate.

## Production route

FoxDot 0.9.0 Patterns author the finite event scores.
SuperCollider 3.14.1 generates the sound through ten original SynthDefs.
The renderer uses native non-realtime synthesis.
It does not run a live FoxDot Clock or use REAPER to render.
The installed FoxDot environment has no NumPy dependency for this route.
The existing streaming Node.js mixer applies one common linear gain.
It retains the shared origin and 5,760,000 sample frames for each stem pair.
Each master is stereo PCM16 at 48 kHz. Each file lasts exactly 120 seconds.

The new instruments accept per-track kick and snare decay, drum gain, room return, bass gate, and pan period.
Fast pieces use short kick bodies and fewer hat attacks.
The low bass and kick stay centered. The upper bass moves between channels.
The atmospheric room return stays below 18 percent in the source contract.
The current definitions use 4.5 through 8.5 percent.
The final three seconds contain a fade and tail.
These finite pieces are not seamless loops.

## Executed checks

`python -m unittest discover -s tests -p test_tempo_library.py -v` used the installed FoxDot Python.
All seven new score and production-contract tests passed.

`python tools/render-tempo-library.py --resume` rendered all nine pieces.
All native synthesis processes returned success.
Sclang emitted notices about absent optional metadata files during first compilation.
All ten SynthDefs were created. No native server failure was recorded.

`python tools/verify-tempo-library.py` passed all nine master and 36 OGG checks.
All delivered decodes have the exact expected frame count and no NaN or infinite samples.
The PCM16 core and atmosphere reconstruct their full mix within one PCM unit.
Master integrated loudness ranges from -19.4 to -18.2 LUFS.
The highest measured master true peak is -1.5 dBFS.
The highest measured decoded OGG true peak is -1.4 dBFS.
These are offline measurements. They do not establish the final game mix.

The production manifest identifies nine masters, eighteen stems, nine preview WAVs, and nine REAPER sessions.
The browser catalog identifies the 36 stable OGG files.
Large audio files are on `G:/Music Projects/Arrow Space Shift/stc-tempo-r2/`.
The browser assets occupy 65,247,478 bytes at initial render completion.

## Delivery and limits

The WAV archive contains the nine full masters.
The music SOURCE archive includes the master and stem WAVs, previews, new authoring files, and their required source helpers.
It includes generated REAPER editing sessions with relative stem paths.
Those sessions were not opened or rendered in REAPER.
See the external `manifest.json` for final archive names, sizes, hashes, and CRC checks.

The initial SOURCE archive attempt encountered a disappearing browser-test screenshot in a shared report folder.
That incomplete archive is retained separately. It is not a release deliverable.
The corrected selection includes only immutable production reports.
No recording was changed during that packaging repair.

Human listening approval, gameplay integration, physical output, and latency are separate checks.
Coding agents assisted with composition, synthesis, production, and tests.
No reference recording, sample pack, commercial sample, or external impulse response was added.
No source license was selected. No publication occurred.
Full ASD-STE100 dictionary and editorial conformity review is incomplete.
