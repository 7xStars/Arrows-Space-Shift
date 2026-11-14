# Title layout recheck

The coordinator repaired the title layout in `src/app.js` and `style.css`.
Begin now appears before the music control.
The first title has a shorter instruction.
Inactive flight controls and status text no longer cover the title.
Short views no longer use the 7vh top margin or the bottom control reserve.

The same check ran again after those changes.
All four requested CSS viewport sizes passed.
The RTL probe at 320×568 also passed.

| Case | Title controls | Options and Guide |
|---|---|---|
| 320×568 | Visible and available | All 22 controls reachable by dialog scroll |
| 390×844 | Visible and available | All 22 controls reachable by dialog scroll |
| 640×450 | Visible and available | All 22 controls reachable by dialog scroll |
| 1280×900 | Visible and available | All 22 controls reachable by dialog scroll |
| RTL at 320×568 | Visible and available | All 22 controls reachable by dialog scroll |

At 320×568, Begin now occupies y359 through405.
Stop music occupies y413 through452.
Both buttons receive input at their centers.
The dialogs fit horizontally in every normal and RTL case.
No page exception occurred.

Command: `node reports/title-layout/check.mjs . reports/title-layout/repaired --extended`.
The control bounds and errors are in `repaired/results.json`.
The required narrow image is `repaired/title-320x568.png`.

## CSS zoom probe

The additional probe applied `zoom:2` to the document at 640×450.
This was a CSS simulation, not native browser zoom.
It found seven failures.
The title actions moved below the viewport.
Options and Guide close buttons were not reachable by trial click.
Some Options controls also extended beyond the viewport after scrolling.
The detailed failures and images remain in `repaired/`.

These findings establish a limit of this CSS zoom configuration.
They do not establish a native browser zoom failure.
Native 200 percent browser zoom remains unverified.
Physical mobile devices, touch hardware, keyboard overlays, and translation
also remain unverified.

## Audio after the interface changes

`node tools/audio-browser-check.mjs . reports/integration-0.25.1/final-source/audio`

Result: all 18 checks passed.
There were no missing assets, visible research links, or page exceptions.
This check used source files after the title repair.
It did not establish human listening approval.

Approve the four normal viewport sizes and the RTL probe.
CSS zoom:2 support remains blocked by the recorded failures.
