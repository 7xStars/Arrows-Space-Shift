# Public page verification status

Candidate: 0.25.1-dev.5. Page: https://noodl-exe.itch.io/arrows-space-shift.

## Verified backup

The public page and image backup is complete. No account cookie or editor control was used.

Backup folder: `G:/Music Projects/Arrow Space Shift/scratch/itch-page-backup-dev5`.

The folder contains the public HTML, one cover, eight gallery originals, and `backup-manifest.json`. The manifest records the public source URLs and SHA-256 hashes.

The old cover hash is `db2eecef47dd1125f92dcae2f2c27087a31215d3b1dabc68aac6e1d680dfeb30`.

The gallery contained five old images and three new images. The three new images match the selected native captures byte for byte:

| Image ID | Selected file |
| --- | --- |
| 32215893 | 01-act-i-folded-route.png |
| 32215895 | 02-klein-fleet.png |
| 32215894 | 03-act-ii-returning-fire.png |

The two remaining selected files were not present at backup time:

- `04-act-iii-echo-ecology.png`
- `05-curvature-gate.png`

The pre-save public iframe was `https://html-classic.itch.zone/html/20352702/index.html?v=1794083008`. This does not establish that dev.5 is hosted.

## Prepared check

`tools/verify-itch-page.mjs` passes `node --check`. The tool checks public media hashes, gallery order, theme, description, hosted build identity, active assets, native audio signals, pause and resume, speaker mute, and omitted later pages.

Run this command after the editor save is confirmed:

```powershell
node tools/verify-itch-page.mjs https://noodl-exe.itch.io/arrows-space-shift "G:/Music Projects/Arrow Space Shift/reports/itch-page-live-dev5"
```

Final hosted verification has not run. The coordinator did not send the live-save signal before the editing session stopped. Do not report the page changes or the hosted dev.5 game as verified.

Audio signal checks cannot establish human hearing. No full hosted campaign playthrough, physical mobile test, or player comprehension test is covered.
