# Editable pixel source

`crossing.mjs` was reconstructed from the retained PNG exports on 2026-11-13.
It is not the missing original master named by the imported manifest.
Each row contains one palette token per pixel. A period means transparency.
The source retains all 108 sprite identities and the existing atlas positions.

Six colors already present in the PNGs were absent from the imported palette.
The reconstructed palette gives those colors tokens. It does not add image colors.

Run `node tools/export-pixel-assets.mjs --check` to compare source pixels with exports.
Run `node tools/export-pixel-assets.mjs` to export edited source.
Use `--output=PATH` to export to another folder.
The export uses Node.js built-in modules. It needs no image package.

The reconstruction record is in `reports/campaign-rules-0.25.1/`.
The original PNG file hashes and RGBA hashes remain in that record.
