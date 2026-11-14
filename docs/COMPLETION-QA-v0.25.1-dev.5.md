# QA: three-Act jam edition

Candidate: 0.25.1-dev.5. Date: November 13, 2026.
The user deferred content above Act III until after the jam.

## Implemented scope

Acts I–III retain their combat, controls, equipment, ship differences, and music.
The Curvature Seed must still be collected physically and extracted.
Successful extraction shows the Act III finish and an explicit replay action.
Reload recognizes the banked completion.
A saved section checkpoint takes precedence over replay.
A new Level 0 campaign requires an explicit choice.
The jam finish does not award a completed Warp Drive.

Main, Guide, Equipment, and Options views do not advertise later content.
The later HTML entry guards run before their simulation, audio, or storage code.
They show the edition boundary without changing saved data.
PLAY excludes their pages, runtimes, and Act IV music.
SOURCE retains those systems, recordings, and existing progress support.

## Executed source checks

| Check | Result | Evidence |
|---|---:|---|
| `npm run check` | 316 passed | `reports/three-act-progression-full.log` |
| FoxDot Python `-m unittest discover -s tests -p 'test_*.py'` | 87 passed | `reports/three-act-dev5/python-check.log` |
| `node tools/three-act-browser-check.mjs` | 35 passed | `reports/three-act-dev5/QA.md` |
| Edition-aware general browser check | 30 passed | `reports/three-act-dev5/general-browser/results.json` |
| Native post-master signal diagnostic | 14 passed | `docs/AUDIO-SIGNAL-QA.md` |
| Marketing capture runs | No page exception or missing asset | `art/marketing/game-off-2026/media-manifest.json` |

The final browser record is `reports/three-act-dev5/browser-final-4/results.json`.
It checks saved later profiles, hidden entries, complete-menu text, reload, replay, and new-campaign choice.
The direct later pages create no audio context and request no original later runtime.
They do not write to the supplied saved records.

The final-reward fixture begins after boss defeat.
Ordinary keyboard input then collects the exposed seed and reaches extraction.
The permanent reward is false after pickup and true only after successful extraction.
The screen does not show an Act IV continuation or full-drive completion.
This check does not establish boss-combat fairness or a fresh full playthrough.
The original encounter tests remain present.

Earlier investigation failures are retained in named reports.
They found an Options link, a footer prompt, and a presentation-update timing assumption.
The visible link and prompt were gated. The test now waits for the actual end card.
The simulation event history and later save data were not rewritten to hide the prompt.

## Audio evidence

The user confirmed audible title music in the fresh dev.4 tab.
The user then confirmed audible campaign music and firing sounds.
The earlier connected documents contained older paused or defeated builds.
The signal diagnostic separately measured nonzero title, campaign, and effects output after their gains.
Mute and zero volume supplied silent controls.
No Windows audio setting was changed.
This edition change does not modify the audio engine or musical masters.

## Page assets

The cover is exactly 630 by 500 pixels.
It reuses existing title artwork and game typography.
Five 1280 by 800 screenshots show the current Acts I–III renderer.
The selected PNG bytes are unchanged native captures.
Later scenes use recorded selection fixtures with actual game simulation and input.
No projectile or warning was added to an image.
No generative image tool was used.
The coordinator reviewed the cover and screenshot contact sheet.
Source artwork and all music masters remain unchanged.

## Release and remaining work

The final archive report is in `releases/0.25.1-dev.5`.
It records extracted-build checks, source checks, hashes, and publication status.
GitHub source, itch.io page images, page theme, and playable upload need separate verification.
The user authorized replacement of the older live playable game with the tested three-Act build.
The user also authorized the cover, gallery, and theme update.

Broader human balance, unfamiliar-player comprehension, physical-device coverage, source-license selection, and jam provenance remain open.
No category score is established by these technical checks.
The writing uses short sentences and consistent terms.
A complete ASD-STE100 dictionary and editorial review is not claimed.
