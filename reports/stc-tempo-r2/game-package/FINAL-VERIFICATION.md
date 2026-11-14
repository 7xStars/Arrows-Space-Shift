# dev.2 game package verification

Candidate: 0.25.1-dev.2. Date: 2026-11-13.
Production mix: stc-tempo-r2b. The earlier dev.1 and r2 archives remain in place.

The frozen source was packaged with:
`python tools/package-release.py --output "G:/Music Projects/Arrow Space Shift/releases" --tempo-manifest reports/stc-tempo-r2/production-manifest.json`

| Archive | Bytes | Files | SHA-256 |
|---|---:|---:|---|
| PLAY | 47,276,775 | 241 | `e072d82548436d65da484e56a3c05f4f779ac7671c3e4a6fde442c306fc64f22` |
| SOURCE | 1,667,621,535 | 4,269 | `cdf296ae48326ea987e8d8f90ac138c45591e62cb04257d81cf8f74e9d1203e4` |

The output folder is `G:/Music Projects/Arrow Space Shift/releases/0.25.1-dev.2/`.
Both archives exist. Both SHA-256 values were checked again after creation.
CRC, root index, required runtime files, relative dependencies, music IDs, and art checks passed.
The release folder contains the archive manifest and full file lists.

## Extracted checks

Both archives were extracted into new G: scratch folders:

- `G:/Music Projects/Arrow Space Shift/scratch/verified-0.25.1-dev.2-play`
- `G:/Music Projects/Arrow Space Shift/scratch/verified-0.25.1-dev.2-source`

The extracted PLAY passed 32 browser acceptance checks and 19 title-entry checks.
No page exception or resource failure occurred.
The title test earned a Level 1 checkpoint through ordinary keyboard training.
It checked automatic saved-entry playback under a permitted autoplay policy.
The default-policy case needed one Enable click.
Stop, restart, resume, mute, manual-pause silence, and the narrow entry layout passed.
All test browsers were isolated. The user's browser was not changed.

The extracted SOURCE passed:

- `npm run check`: 303 tests and syntax checks passed.
- `G:/Music Tools/FoxDot/venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: 76 tests passed.
- `node tools/export-pixel-assets.mjs --check`: 108 sprite PNGs and the atlas matched the editable source.

## Production files

All 45 external production files were checked inside SOURCE and after extraction.
Their byte counts and SHA-256 values match the revised production manifest.
They comprise nine masters, eighteen stems, nine previews, and nine REAPER sessions.
Every session resolves both relative stem paths after extraction.
The files are under portable `audio/stc-tempo-r2/` paths in SOURCE.
No large production file was copied to D: during packaging or verification.
See `production-from-source.json` for all file hashes and session references.

SOURCE retains forty tempo OGG assets: the original set and four revised 240 BPM variants.
The active catalog selects thirty-six files for the nine current pieces.
The archived media player hash matches the frozen source:
`64abbea6d233deffc121800c8403bf0208089bb456a9ac0fc2f1686d4330dcf5`.
The media browser owner's earlier result remains separate evidence.

PLAY retains the existing four campaign recordings and r9 title recording.
The new nine-piece collection is supplied through editable SOURCE and the separate listening delivery.
These arrangements have finite endings. They are not seamless loops.

This report was created after packaging. It is external to SOURCE.
No new full campaign run was required for this audio and entry revision.
No human listening approval or physical device-performance result is claimed.
No GitHub or itch.io publication was performed by this packaging pass.
