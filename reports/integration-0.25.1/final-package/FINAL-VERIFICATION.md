# Final archive verification

Candidate: 0.25.1-dev.1. Date: 2026-11-13.
Git candidate: `97c52a599e3653f1dcc97b60bc97d267dd9aa325`.

Both archives were created with `python tools/package-release.py --output "G:/Music Projects/Arrow Space Shift/releases"`.
The Git bundle and its records were preserved. Its SHA-256 remains unchanged.

| Archive | Bytes | Files | Result |
|---|---:|---:|---|
| PLAY | 47,276,925 | 241 | CRC, root index, required files, relative dependencies, music IDs, and art files passed. |
| SOURCE | 1,170,946,859 | 3,833 | CRC, root index, required files, and art files passed. |

The archive paths and SHA-256 values are in `FINAL-VERIFICATION.json`.
The release folder also has `manifest.json`, `package-file-lists.json`, and `SHA256SUMS.txt`.
All archive paths were checked after creation. Both SHA-256 values were checked again.

Both archives were extracted into new G: scratch folders:

- `G:/Music Projects/Arrow Space Shift/scratch/verified-0.25.1-dev.1-play`
- `G:/Music Projects/Arrow Space Shift/scratch/verified-0.25.1-dev.1-source`

The extracted PLAY passed 32 browser acceptance checks in local headless Edge.
It reported no page exception or failed resource request.
The test used ordinary training input and the local Act IV QA unlock.
The separate full fresh-profile browser run remains separate evidence.

The extracted SOURCE passed these commands from its own folder:

- `npm run check`: syntax passed; 299 tests passed.
- `G:/Music Tools/FoxDot/venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: 64 tests passed.
- `node tools/export-pixel-assets.mjs --check`: all 108 sprite PNGs and the atlas matched the editable source.

SOURCE includes 96 WAVs and all 16 Act master WAVs.
It includes FoxDot, SuperCollider, score, REAPER, and reconstructed pixel-source files.
It excludes Git data, installed tools, caches, environment files, reference PDFs, books, and earlier release archives.

All 241 PLAY files match the final audio-tested stage byte for byte.
The 18 staged audio checks therefore apply to these packaged bytes.
They were not repeated after extraction. See `stage-byte-comparison.json`.
No human listening, physical touch, or device-performance result is claimed here.

This report was produced after packaging. It is external to SOURCE.
No GitHub or itch.io publication was performed by this packaging task.
