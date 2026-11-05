# The Crossing: pixel asset contract

Candidate: Arrow Space Shift 0.14.0.
Source: `art/source/crossing.mjs`.
Pixel record: `art/source/crossing-pixels.json`.
Runtime manifest: `assets/crossing/manifest.json`.

## Intent

Use warm, weathered hull metal against deep indigo space.
Keep four enemy forms different in silhouette.
Use crisp pixel edges and top-left lighting.
Keep the existing gameplay and collision rules.
The visual forms do not introduce new attack types.

## Dimensions and palette

Player and enemy cells are 16 × 16 pixels.
The Klein inspection icon is 32 × 32.
Rocks are 8 × 8, 16 × 16, and 32 × 32.
Projectile glints are 4 × 8.
Transparent pixels have alpha 0. Opaque pixels have alpha 255.
There are no partially transparent edge pixels in the sprite exports.

The source palette contains the exact colors supplied by the user.
The manifest records each hex value.
The grayscale proof is a diagnostic view. Its gray values are outside the sprite palette by design.
The generated concept sheet is a visual draft. Its labels and colors are not the runtime specification.

## Identity and facing

`player.arrow` faces up.
`player.arrow-down` is its opposite-facing view.
`enemy.scout`, `enemy.gunner`, `enemy.heavy`, and `enemy.klein` face down.
The `-up` variants preserve their form while restoring top-left shading.
The Heavy has cracked variants for both directions.
Facing changes select another source frame. They do not rotate the lighting.

The Scout is used for one-hull carriers.
Ordinary two-hull carriers use the Gunner or Heavy form.
Stage 7 uses Klein Runner art.
The boss core uses the Heavy form at a larger display scale.
Boss escorts use the Gunner form.
These choices describe current behavior. They do not change hull, firing, damage, or equipment.

## Anchors, export, and playback

The pivot is the center of the untrimmed source cell.
The atlas uses 40-pixel slots with four pixels of leading padding.
The manifest gives each source rectangle and pivot.
Atlas cells do not overlap.
The renderer uses integer display scales and disables image smoothing for sprite draws.
Rock sprites do not rotate during playback. This preserves their pixel grid and light direction.

The rock break clip has three frames: 90 ms, 90 ms, and 120 ms.
It does not loop.
The existing effect ring can continue after the 300 ms sprite clip ends.
The authoritative rock break event starts the effect.
It does not create damage, a reward, or a second break event.

Side-edge tiles have vertical rails that join at repeat boundaries.
Top and bottom tiles have horizontal rails without a twist.
The route markers S0–S7 map to the eight main routes in order.
Level 0 has no route marker.

## Review fixtures and limits

Review the quiet belt at 960 × 720 and 320 × 568.
Review a Stage 7 side crossing, a damaged Heavy, a normal hit, and a rock break.
Retain the seed, source hashes, and screenshots with the review.
If sprite loading fails, the earlier procedural renderer remains available.

Palette, alpha, dimensions, hashes, mask differences, and tile joins have automated checks.
The reference sheet includes native-size silhouettes and grayscale views.
Those checks do not prove that players recognize the enemy types.
Visual contact alignment and artistic acceptance still need human review.
The collision rules were preserved; no claim of full visual-to-collider parity is made.

## Revision

Edit the masks, feature pixels, or palette in `art/source/crossing.mjs`.
Run `npm run art:export`.
Review `art/crossing-production-sheet.png`.
Run the asset checks and the rendered fixtures.
Rebuild the itch.io ZIP after accepting a revision.
The JSON pixel record is an export of the source, not a second authoritative master.
Aseprite was not installed or used.
