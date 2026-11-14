# Staged PLAY checks

Candidate: 0.25.1-dev.1. Date: 2026-11-13.
Target: `G:\Music Projects\Arrow Space Shift\scratch\play-0.25.1-dev.1`.
Method: local headless Microsoft Edge through Playwright.
The curated stage has 241 files and 47,942,922 bytes.
No release ZIP was created for these checks.

The `stage-manifest.json` file records every staged file hash.
The `package-plan.json` file records both package selections.
The source selection includes the reconstructed editable art master.

## Results

| Tool | Checks passed | Evidence |
|---|---:|---|
| `tools/browser-acceptance.mjs` | 32 | `browser/results.json` |
| `tools/act4-completion-browser.mjs` | 8 | `act4/results.json` |
| `tools/repair-browser-check.mjs` | 14 | `repair/results.json` |
| `tools/structural-feedback-browser.mjs` | 5 | `visual/results.json` |

Each tool ran from the D: source folder with the staged root argument.
Test tools were not copied into PLAY.
The browser checks reported no page exception or failed resource request.
Act IV combat finished with normal hull 5 and an extracted core receipt.
Reloads after exposure and collection did not bank the unextracted core.
The repair run required steering, fire, fold, capture, and release input.
The ending and campaign completion survived reload.

The browser acceptance tool uses ordinary tutorial input.
Its Act IV portion uses the local QA unlock.
The separate Act IV completion tool starts from a valid earlier-progress profile.
The repair tool starts from a valid four-part profile.
The structural feedback tool uses an isolated QA combat fixture.
These checks do not establish a complete fresh-profile browser playthrough.
They do not establish human understanding, listening quality, or physical touch behavior.

## Captures

- `browser/main-title.png`
- `browser/act4-combat.png`
- `browser/act4-320x568.png`
- `browser/act4-390x844.png`
- `browser/act4-640x450.png`
- `act4/core-exposed.png`
- `act4/core-collected.png`
- `act4/core-extracted.png`
- `repair/activation.png`
- `repair/ending.png`
- `repair/dock-320x568.png`
- `repair/dock-390x844.png`
- `repair/repair-and-ending.webm`
- `visual/combat.png`

The title capture and narrow Act IV capture were inspected visually.
Their controls remain inside the viewport.
The narrow capture still has the earlier hardcoded Act IV version label.
The coordinator will update that text before the final package.

`freeze-check.json` compares the staged hashes with current source files.
All runtime source hashes still matched after these checks.
Only NOTICE.txt had changed in the working folder.
The stage stays unchanged as test evidence.
