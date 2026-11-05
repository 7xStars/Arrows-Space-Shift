# Arrow Space Shift upload candidate

Historical record. See [version 0.13](RELEASE-0.13.md) and [the production pipeline status](PIPELINE-STATUS.md).

Candidate: 0.12.0.
Date: November 4, 2026.
Status: local package prepared and checked.
No upload, source publication, or jam submission was performed.

## Gameplay change

Left and Right steer the ship.
Up and Down do not change campaign position, thrust, or facing.
The scrolling route controls forward travel.
Folding and unfolding remain the means of changing forward distance and shot travel time.
The final map still changes vertical position and facing when the ship crosses a side edge.
That is a map operation, not a manual forward or backward input.
Level 0 now requires movement to the left and right, then an actual target hit.

## Viewport change

The canvas fills the game page and the iframe.
The status area and menus are inside the viewport.
There are no outside sidebars, instructions, or action bars.
Guide retains the controls and exact rule explanations.
The page description also gives the controls.
Combat excludes the status area so covered enemies cannot attack or take damage there.

Equipment, Guide, and Options still pause play.
Their contents can scroll inside a modal panel.
The game page itself does not scroll.
Prototype selection and research records are hidden in the public candidate.
The public candidate does not enable fixture controls with `?test=1`.

## Deliverables

- [Upload ZIP](../dist/itch/0.12.0/arrow-space-shift-0.12.0-itch.zip)
- [Page description](../docs/ITCH-DESCRIPTION.md)
- [Upload settings and remaining steps](../docs/ITCH-UPLOAD.md)
- [Package identity](../dist/itch/0.12.0/package.json)
- [Extracted-ZIP browser results](itch-browser-results.json)
- [Actual viewport capture](itch-viewport.png)

ZIP size: 44,145 bytes.
SHA-256: `e9aa6e2e9683abb0c2fbe10257e695fc8db950ef49857fecf61439e79bfa0d2a`.
The archive contains 14 files.
Its root contains `index.html`, `style.css`, `NOTICE.txt`, and the `src` directory.
All runtime links are relative.

## Executed checks

| Layer | Passed | Failed |
|---|---:|---:|
| Node rules | 124 | 0 |
| Existing browser checks | 82 | 0 |
| Campaign browser checks | 55 | 0 |
| Interface browser checks | 37 | 0 |
| Extracted ZIP in a local cross-origin iframe | 18 | 0 |

The archive check compares the ZIP hash with the package record.
The browser serves the extracted ZIP, not the development source.
It completes Level 0 with real input and enters Level 1.
It checks both Shift keys, vertical-key rejection, paused equipment, and resource loading.
It checks 960 × 720, 640 × 480, and 320 × 568 iframe sizes.
The first package review found an encoding problem in status labels.
The package script now reads and writes UTF-8 explicitly.
The rebuilt archive passed its text and runtime checks.

## Notice review

The game-license-register skill was used for a scoped notice check.
`package.json` declares no runtime dependencies.
The inspected runtime modules import only local modules.
The actual archive contains procedural graphics code and oscillator sound code.
It has no image, font, sample, music-recording, or external runtime-library files.
`NOTICE.txt` is included in the ZIP.
Guide retains the existing AI and asset disclosure.
The prepared page description also includes it.

No formal license register was found.
No source license was selected or added.
No third-party license obligation was identified from the inspected package inventory.
That inventory check is not a complete rights opinion or legal clearance.
The user owns the source-license decision before public source publication.

## Remaining checks and actions

The host page requires a public GitHub repository and an itch.io submission.
See the [Game Off page](https://itch.io/jam/game-off-2026).
The local iframe check does not verify the actual itch.io host.
The draft page still needs keyboard focus, fullscreen, sound startup, and focus-loss checks.
A complete campaign playthrough and human difficulty review remain unperformed.
The package has not been submitted to the competition.

Full ASD-STE100 conformity is not claimed.
The official dictionary and complete editorial review remain unavailable or unperformed.
