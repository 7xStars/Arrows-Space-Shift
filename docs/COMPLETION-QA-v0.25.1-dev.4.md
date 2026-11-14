# QA: title startup and speaker control

Candidate: 0.25.1-dev.4. Date: November 13, 2026.
Task: [TITLE-SPEAKER-014](tasks/TITLE-SPEAKER-014.md).

## Implemented result

The title requests music on entry, before sprite loading finishes.
The recording loads while the browser waits for audio permission.
When automatic playback is permitted, the prepared recording starts without input.
When sound is blocked, the first permitted pointer or keyboard action starts it.
The old title music text button is removed.

A native speaker button sits in the lower-left corner of the main game view.
It has a 44-pixel target and supports Enter and Space.
Wave and cross shapes distinguish states without color alone.
Its accessible action is Enable sound or Mute sound.
Its pressed state reflects the enabled preference and a running context.
A description distinguishes waiting, loading, paused, and muted states.
The visible focus ring supports keyboard use.

The speaker controls the existing global sound preference.
The separate music switch remains in Options.
The action is retained at pointer press or keyboard activation.
A browser context change before click cannot turn Enable into Mute.
Mute persists after reload and cancels pending startup.
Manual pause remains silent. The speaker stays available.
The previous Forge continuity repair remains in the source.

## Executed checks

| Check | Result | Evidence |
|---|---:|---|
| Frozen dev.3 `npm run check` | 309 passed | G: dev.3 release folder, `title-speaker-baseline-309.log` |
| Current `npm run check` | 312 passed | `reports/title-speaker-dev4/npm-check.log` |
| FoxDot Python `-m unittest discover -s tests -p 'test_*.py'` | 83 passed | `reports/title-speaker-dev4/python-check.log` |
| `node tools/title-entry-browser.mjs . reports/title-speaker-dev4/browser-final-4` | 43 passed | Run `results.json` and `reports/title-speaker-dev4/QA.md` |
| Core module hashes | 11 unchanged | `reports/title-speaker-dev4/core-preservation.json` |

An early working-tree check overlapped active edits.
It is retained as an intermediate result, not a clean baseline.
The frozen dev.3 extraction passed its complete check during this task.

Three new audio tests cover preparation during blocked resume, mute during preparation, and repeated startup requests.
The retained tests cover launch cancellation, Stop, hidden-page safety, and the Forge repair.

## Native browser evidence

The final check used isolated Microsoft Edge processes and native Web Audio.
No audio policy or game profile in the user's browser was changed.
The permitted process started title playback before input.
It also started title playback while the atlas response was held.
The default and strict blocking processes had suspended contexts before input.
One speaker action started playback on the existing context.
One ordinary key also started blocked title playback without launching flight.
Repeated requests did not create duplicate title sources or contexts.

Saved mute, reload, keyboard actions, Options synchronization, and manual pause passed.
The earned Level 1 checkpoint remained intact during title review.
The normal main-game flow used ordinary tutorial input.
The Act III layout check used a late-Act fixture. It is not progression evidence.
No page exception or failed asset request occurred.

Automatic playback depends on browser policy.
The game cannot guarantee sound before a permitted action on every browser.
The official reference is [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay/).
The strict test uses `document-user-activation-required` in an isolated process.
An earlier `user-gesture-required` probe did not block Web Audio in this Edge version.
The report records that probe instead of treating its name as proof.

## Layout repairs

The coordinator inspected the final narrow screenshots.
The speaker clears the saved-game hint and flight actions at 320 by 568.
The four Act III buttons retain complete key labels and 54 by 46-pixel targets.
The two Act I buttons also retain complete labels.

The review found an existing Act III status defect.
The echo panel remained in normal flow below the game viewport.
It now sits in the measured HUD area.
The echo count and installed evolution text stay visible above the controls.
The existing HUD resize observer updates the view area.
No simulation or topology rule was changed.

## Accessibility review

Scope: the new speaker and the affected compact entry and flight controls.

| Severity before repair | Location | Before | After | Reason |
|---|---|---|---|---|
| Medium | `src/app.js` | The text action could remain disabled when sound was off. | The speaker can enable sound directly. | Keyboard and pointer access to sound. |
| Medium | `style.css` | The speaker could cover part of the saved-game hint. | The hint has reserved space. | Readable information in the narrow layout. |
| Medium | `src/interface.js` | Act III echo information could remain outside the viewport. | The panel is in the HUD. | Visible resource and action information. |
| Low | `style.css` | Compact key labels could extend beyond their buttons. | The targets retain complete labels. | Readable control instructions. |

The button has a native role, accessible name, state, keyboard action, and visible focus.
No new animation or flashing effect was added.
Approve the checked flow. This is not a complete accessibility conformity claim.
Screen-reader operation, physical devices, and physical sound output remain unverified.
The writing uses short sentences and consistent terms.
A complete ASD-STE100 dictionary and editorial review is not claimed.

## Delivery and continuation

The final package report is in `releases/0.25.1-dev.4`.
The source and playable archives retain the earlier releases separately.
The next listening check is a fresh title entry and the lower-left mute action.
No music master was changed. No public publication occurred.
