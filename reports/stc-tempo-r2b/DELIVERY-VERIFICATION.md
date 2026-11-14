# r2b delivery verification

The 240 BPM piece now has seven ten-second electronic swells and stronger stereo motion.
The original r2 files and archives remain unchanged.
The other eight definitions and full-mix WAV hashes are unchanged.
The existing encoded bytes for those eight pieces were retained.

## Artifacts

All files are in `G:/Music Projects/Arrow Space Shift/stc-tempo-r2b/`.

| Archive | Bytes | SHA-256 |
|---|---:|---|
| `Arrow-Space-Shift-STC-Tempo-r2b-WAV.zip` | 160,444,870 | `269c929d99077d8693274c890b27e5e342bb9717032a33f09cdbeda395d5a210` |
| `Arrow-Space-Shift-STC-Tempo-r2b-SOURCE.zip` | 493,312,806 | `45ddede6dffbd5fccc42023054f5c5b90344b97d1d590b89bb1d9427134b3dc5` |

Both archives passed CRC and unique-path checks.
The WAV archive contains all nine current full mixes.
The SOURCE archive contains 214 files, including all 36 WAVs and nine relative REAPER editing sessions.
It also includes the original r2 authoring snapshot and current NOTICE.txt.
The REAPER sessions were not opened or rendered in REAPER.

The SOURCE archive was extracted to `G:/Music Projects/Arrow Space Shift/scratch/verified-tempo-r2b-source`.
All nine production-contract tests passed from that extracted source.
The full working-project Python suite passed 76 tests.

## Audio checks

All nine native renders and 36 active OGG decodes passed.
Full mixes and stems have 5,760,000 stereo frames at 48 kHz.
The PCM16 stems reconstruct their full mixes within one PCM unit.
The collection's highest measured master true peak is -1.5 dBFS.
Its highest measured decoded OGG true peak is -1.4 dBFS.
No non-finite or full-scale sample was found.

The actual 250–2600 Hz channel-energy probe found greater stereo variation in the revised 240 BPM files.
The full-mix balance deviation changes from 0.1789 to 0.2242 over 20–44 seconds.
The atmosphere deviation changes from 0.1435 to 0.6378 over the same interval.
The complete window series and low-band limits are in `stereo-comparison.json`.
The kick and low-bass source routes stay centered.
No perfectly mono complete low-band or perceptual-improvement claim follows from those routes.

Matched stereo excerpts are in `comparison/baseline-240-stereo.wav` and `comparison/revised-240-stereo.wav`.
The complete revised piece is `masters/tempo-act3-02.wav`.
These are actual rendered WAV files.

The active production manifest supplies all 45 media and session mappings on the new G: path.
It is available in both the r2b reports and the current r2 manifest location.
Browser integration and human listening remain separate evidence.
The independent browser agent then passed 41 native checks across all nine active pairs.
The revised 240 BPM pair used the new filenames and reported the r2b labels.
Its measured decoded sum peak was 0.8241445565.
All layers were finite, and all pairs retained matched start times.
See `reports/stc-tempo-r2/browser/QA.md` for that separate browser result.
No human listening approval is claimed.
Full ASD-STE100 dictionary and editorial review is incomplete.
