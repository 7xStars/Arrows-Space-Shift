# Game Off page images

Candidate: `0.25.1-dev.5`. Scope: Acts I–III.

The cover uses the existing `assets/realm-title.png` artwork.
It uses the existing game title and UI font style.
No new illustration or generative image tool was used.
The existing title artwork retains its earlier AI-use provenance in `NOTICE.txt`.

## Files for upload

| File | Size | Caption |
|---|---|---|
| `cover-630x500.png` | 630 × 500 | Arrow Space Shift |
| `01-act-i-folded-route.png` | 1280 × 800 | Fold distance during manual-fire scrolling combat. |
| `02-klein-fleet.png` | 1280 × 800 | Read the Klein Fleet and its returning attacks. |
| `03-act-ii-returning-fire.png` | 1280 × 800 | Change attack timing on the Klein surface. |
| `04-act-iii-echo-ecology.png` | 1280 × 800 | Capture hostile shots and release stored echoes. |
| `05-curvature-gate.png` | 1280 × 800 | Face the Curvature Gate at the end of Act III. |

The five screenshot files are unchanged native browser captures.
Their bytes match the selected capture files.
No projectile, warning, damage state, or HUD element was added or retouched.
The closed QA controls are not shown.
Act IV and the later repair sequence are not shown.

The cover is an RGB PNG.
Its centered crop retains the existing ship and paired arcs.
The title color is the existing warm UI color, `#f3e5c8`.
The source title image retains its original hash.
The font file is not redistributed.

`cover-art-only-630x500.png` is the comparison without title typography.
`cover-review-315x250.png` checks the final cover at half scale.
`cover-recipe.json` records source identity and processing.
`media-manifest.json` records image hashes, capture states, and captions.

## Capture method and limits

The capture tool starts an isolated local server and Microsoft Edge context.
The viewport is 1280 by 800 CSS pixels at device scale 1.
Existing QA chapter selection provides access to the five scenes.
Later movement, manual firing, folds, capture, release, and evolution choices use keyboard input.
The selected Act III capture records two captured shots and two released echoes.
The capture did not use invulnerability or altered damage.
No user browser or saved profile was changed.

Both capture runs had no page exception or missing asset response.
All five selected images were inspected at their capture size.
The cover was inspected at 630 by 500 and 315 by 250.
These captures do not establish a complete human playthrough or encounter fairness.
They must not be presented as proof of human comprehension.

The source snapshot matches the current application, interface, build, stylesheet, and sprite manifest hashes.
The raw candidates and contact sheet remain in the task's G: scratch folder.
The capture script uses a new run seed, so later executions can show different combat states.

## Reproduction

Run `python tools/prepare-itch-cover.py` to export the cover variants.
Run `node tools/capture-itch-media.mjs` to capture scene candidates.
The capture tool takes an optional output folder and scene ID.
The original game artwork and music masters are not changed by either tool.

The page update owner must check the hosted image dimensions and screenshot order after upload.
No page publication is performed by these tools.
The writing uses short sentences and consistent terms.
A complete ASD-STE100 dictionary and editorial review was not completed.
