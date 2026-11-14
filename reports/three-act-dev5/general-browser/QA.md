# General browser check: three-Act edition

Candidate: `0.25.1-dev.5`.
Target: Current source served by the existing local server.
Method: Isolated headless Microsoft Edge with ordinary pointer and keyboard input.

## Tool change

`tools/browser-acceptance.mjs` reads the target's `BUILD` and `isActAvailable` exports.
When Act IV is available, the tool retains the existing four-Act checks.
When the three-Act edition is selected, it checks the main game and its edition boundary.
It does not navigate to hidden future pages in the three-Act branch.
The separate three-Act release check owns direct-page and old-save guard coverage.

## Executed command

```powershell
node tools/browser-acceptance.mjs . reports/three-act-dev5/general-browser
```

Result: 30 checks passed.
No page exception or failed asset request occurred.
The adjacent `results.json` records the target edition and every assertion.

The check covers:

- A clean Level 0 entry and ordinary tutorial completion to Level 1.
- Manual steering, manual fire, fold, and unfold.
- Equipment pause and an earned checkpoint after reload.
- Saved mute and reduced-motion preferences.
- Hidden later-Act continuation, completion, links, and menu prompts.
- Native title playback, campaign recording playback, and one audio context.
- Manual pause and recording silence.
- Main controls and Options at 1280 by 900, 390 by 844, 320 by 568, and 640 by 450.
- Main controls in an RTL layout.

## Limits

This source run checks the three-Act branch only.
The retained four-Act branch was not executed during this task.
The release package must receive its own run after the source freeze.
The result does not establish a complete campaign playthrough, physical sound output, human comprehension, or physical mobile performance.

The writing uses short sentences and consistent terms.
A full ASD-STE100 dictionary and editorial review is not claimed.
