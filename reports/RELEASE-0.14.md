# Arrow Space Shift 0.14.0

This candidate contains the first Crossing pixel set.
The current gameplay and collision rules are preserved.
The set is a technical art candidate. Human acceptance remains open.

## Delivered art

- Two player facing views.
- Scout, Gunner, Heavy, and Klein Runner enemy forms, with opposite-facing views.
- A 32 × 32 Klein Runner icon.
- Two damaged Heavy views and one-pixel health-pip frames.
- Three asteroid sizes and a three-frame break clip.
- Return arrows, edge tiles, a half-twist tile, and eight route markers.
- Glint, absorption, and projectile assets.

There are 42 individual transparent PNGs.
The runtime atlas is 320 × 240 pixels.
Its source, palette, and frame records are in [the manifest](../assets/crossing/manifest.json).
The authoritative native pixel source is [crossing.mjs](../art/source/crossing.mjs).
The JSON pixel export is available beside it.

See [the production sheet](../art/crossing-production-sheet.png), [asset contract](../art/ASSET-CONTRACT.md), and [generation record](../art/GENERATION-RECORD.md).
The built-in image generator produced a separate concept draft.
Runtime sprites were authored as new pixel masks rather than cropped from either reference sheet.
Aseprite was not installed or used.

## Integration and evidence

The game draws pixel ships, rocks, player shots, return cues, and edge twists.
The route marker appears beside the section label.
Facing changes select separate frames with top-left shading.
Atlas draws use integer scales and nearest filtering.
The existing procedural renderer remains available if sprite loading fails.

138 Node checks passed.
The browser suites passed 82 existing checks, 55 campaign checks, 37 interface checks, 21 enemy-return checks, 19 extracted-ZIP checks, and 11 art checks.
The pixel checks cover palette, alpha, dimensions, hashes, atlas bounds, mask differences, edge joins, and frame timing.
The browser checks inspect actual texture use, compact layout, and missing-manifest recovery.

Captures: [quiet belt](art-quiet-belt.png), [Klein return](art-klein-return.png), [compact view](art-compact.png).
These are actual game captures.
They do not establish human recognition or visual contact alignment.

## Upload candidate

[ZIP](../dist/itch/0.14.0/arrow-space-shift-0.14.0-itch.zip).
Size: 62,406 bytes.
SHA-256: `75d566c71190ff544af2645b438cc540369018f991cc15dc19f12361c8aed924`.
The package includes the atlas, individual PNGs, manifest, code, and notice.
It excludes the user reference, generated concept image, source masks, reports, and development tools.
The packaged atlas loads and draws the player in the local iframe check.
No upload or jam submission was performed.

Music, authored combat SFX, listening, human art acceptance, and full campaign playtesting remain open.
The [license register](../docs/legal/LICENSE-REGISTER.md) records provenance and the unresolved source-license decision.
No complete rights clearance is claimed.
Full ASD-STE100 conformity is not claimed. The full dictionary review remains unperformed.
