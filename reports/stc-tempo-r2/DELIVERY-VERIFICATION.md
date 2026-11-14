# Tempo collection r2 delivery verification

State: complete native production and archive verification.
Date: November 13, 2026.

The collection contains nine original full mixes at 120, 136, 144, 152, 168, 184, 200, 220, and 240 BPM.
Each piece lasts 120 seconds. The collection lasts 1,080 seconds.

## Verified artifacts

| Archive | Bytes | SHA-256 |
|---|---:|---|
| `Arrow-Space-Shift-STC-Tempo-r2-WAV.zip` | 160,361,047 | `e50c11ea47feea22c82d5b4abf579ccda83c7d762f8e9cc63c0da6e27eb0fb1a` |
| `Arrow-Space-Shift-STC-Tempo-r2-SOURCE.zip` | 485,031,459 | `805f0a0955ee41b3d870f905e538ac1c9596024f7692df43f9e755cec6e01b55` |

Both archives are in `G:/Music Projects/Arrow Space Shift/stc-tempo-r2/`.
Both passed CRC and unique-file checks.
The WAV archive contains nine complete full-mix masters.
The SOURCE archive has 241 files, including all 36 WAVs and nine relative REAPER sessions.
All eighteen stem paths used by those sessions are present in the archive.
The sessions were not opened or rendered in REAPER.

The SOURCE archive was extracted to `G:/Music Projects/Arrow Space Shift/scratch/verified-tempo-r2-source`.
All seven new production-contract tests passed from that extracted source.
The complete working-project Python suite also passed 73 tests.
See `extracted-source-tests.log` and `production-tests.log`.

## Native audio checks

All nine native SC renders returned success.
All 36 delivered OGG files decoded to their exact expected frame counts.
All masters and stems are stereo PCM16 at 48 kHz.
Full mixes and stems have 5,760,000 frames each. Previews have 960,000 frames each.
The PCM16 stem pairs reconstruct their full mixes within one PCM unit.
No native NaN, infinite sample, or full-scale sample was found.
The highest measured master true peak is -1.5 dBFS.
The highest measured OGG true peak is -1.4 dBFS.
Master integrated loudness ranges from -19.4 to -18.2 LUFS.

These results measure the rendered files. They do not establish human musical approval or the final gameplay mix.
The parent integration task owns actual browser playback checks.

`production-manifest.json` provides all 45 external file mappings for the complete game source package.
It includes nine masters, eighteen stems, nine preview WAVs, and nine REAPER sessions.
Each record supplies its absolute source, portable archive path, size, and hash.

The initial incomplete SOURCE attempt is retained under an explicit INCOMPLETE filename.
It is not a deliverable. The final SOURCE archive excludes volatile browser-test folders.
All owned audio, source, and delivery files are now stable.
