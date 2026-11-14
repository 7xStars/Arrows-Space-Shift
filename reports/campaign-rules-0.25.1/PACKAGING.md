# Release package preparation

Date: 2026-11-13. Candidate: 0.25.1-dev.1.
Mode: Integration and QA Verification.
No release ZIP was created during this preparation step.
The coordinator must finish the release documents before packaging.

## Selected files

Run `python tools/package-release.py --plan` to inspect the current selection.
Use `--plan-file PATH` to save its full file lists.
The saved plan in this folder identifies the inspected selection.
Its counts can change when the coordinator adds final reports.

The inspected PLAY selection has 241 files and 47,942,922 uncompressed bytes.
It contains the main campaign, Act IV, repair dock, and their runtime imports.
It contains all crossing sprites, the title image, and required notices.
It contains 80 recorded campaign stems and the selected r9 title recording.
It includes the Python and Node local launch paths.
It excludes research pages, listening pages, tests, raw WAVs, and authoring tools.

The inspected SOURCE selection has 3,669 files and 1,535,836,865 bytes.
It contains current source, tests, tools, documents, art, audio, and retained reports.
It contains retained archive files and extracted imports.
It contains 96 WAVs, including all 16 original Act master WAVs.
The WAVs total 1,199,201,904 bytes in the inspected selection.
FoxDot, SuperCollider, score JSON, and REAPER authoring files are included.

Both archives exclude previous release folders and compressed archives.
SOURCE excludes caches, node_modules, Git data, environment files, and private files.
It also excludes PDFs and electronic books. Reference books are not game assets.

## Output and verification

The default Windows output folder is:
`G:\Music Projects\Arrow Space Shift\releases\VERSION\`.
Use `--output PATH` to select another parent folder.
The command stops if either target ZIP already exists.
It does not delete or move an earlier release.

The packager reads the actual campaign music registry through Node.js.
It follows static HTML, CSS, and JavaScript references.
The sprite manifest and all exported sprite files form the dynamic art set.
The verifier checks root entries, required files, unique paths, and CRCs.
It checks relative file references and recorded segment identities.
It checks all files named by the sprite manifest.
The packager compares archive contents with the complete selected file list.
SHA-256 uses one-MiB reads. It does not read a whole ZIP into memory.

Run `python tools/verify-release.py ARCHIVE --label PLAY` for an independent check.
Use `--label SOURCE` for the source archive.
The shell wrapper calls the same Python packager.

Six failure and integrity tests passed:
`python -m unittest discover -s tests -p test_release_package.py -v`.
They cover missing imports, source exclusions, missing music, wrong music identity,
relative omissions, missing root entry, corrupt data, and streamed hashing.
This is package structure evidence. Browser startup still needs the extracted PLAY.

## Editable art preservation

The original active pixel master was absent from the authoritative v0.24.1 ZIP.
It was also absent from the other retained SOURCE ZIPs and extracted imports.
The older archived master has a different hash.
It was not substituted for the active master.

The new `art/source/crossing.mjs` was reconstructed from retained PNGs.
Its metadata states this origin and retains the unavailable original source hash.
It preserves 108 sprite identities, pixel dimensions, animation data, and atlas layout.
The new source names six existing image colors missing from the old palette record.
No image color was added or changed.

`tools/export-pixel-assets.mjs --refresh-manifest` compared all source pixel data
with the existing 108 sprite PNGs and atlas PNG before updating the manifest.
All 109 original PNG hashes and all RGBA hashes remain identical.
Only source metadata and palette tokens changed in the asset manifest.
The original and verified hashes are saved in the reconstruction JSON reports.

The export tool uses Node.js built-in modules.
`--check` validates all exported pixels and manifest hashes.
The new reconstructed-art regression passed.
This reconstruction supplies editable pixel data. It does not recover the lost
procedural authoring history or establish human recognition of the art.
