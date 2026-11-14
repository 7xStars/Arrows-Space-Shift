# Title speaker verification

Candidate: `0.25.1-dev.4`.
Role: QA Verification and Triage.
Browser: isolated headless Microsoft Edge on Windows.
Final result: 43 checks passed. No page exception or failed asset request occurred.

## Executed command

```powershell
node tools/title-entry-browser.mjs . reports/title-speaker-dev4/browser-final-4
```

The exact source hashes and browser version are in `results.json`.
The final log is `../../title-speaker-dev4-final-4.log`.
The test starts its own local server.
It does not use the user's browser or saved profile.

## Automatic playback

The test observes native audio contexts, recording sources, and their playback state.
An `AudioContext` subclass records calls to the native implementation.
It does not replace the audio result or simulate permission.

| Policy case | Observed result |
|---|---|
| Default Edge, with Playwright's autoplay override removed | One context was created automatically. The native context stayed suspended. One speaker click started the title. |
| `document-user-activation-required`, with media-engagement bypass disabled | Native audio stayed suspended before input. One speaker click enabled playback with the same context. |
| `no-user-gesture-required` | Native title playback started before a click. It used one context and needed no resume call. |
| Sprite atlas held by a network gate | Title playback started while sprite loading was still incomplete. |
| Music loading held by a network gate | Speaker mute prevented the delayed recording from starting. |

The policy flags apply only to isolated test processes.
The user browser and its policy remain unchanged.
The default and strict cases establish a browser permission limit under those conditions.
They do not establish an implementation that can force sound before permission.

A separate native probe found that `user-gesture-required` did not suspend Web Audio in this Edge build.
The final blocking case therefore uses `document-user-activation-required`.
The final test asserts the native suspended state before it calls that case blocked.

## Controls and continuation

The native speaker button replaces the old title text button.
Its accessible action is `Enable sound` when the context is blocked or sound is muted.
Its accessible action is `Mute sound` when sound is enabled.
The speaker state has an `aria-pressed` value.
The SVG is decorative to assistive technology.

The checks cover the following cases:

- The first blocked speaker click enables sound instead of muting it.
- An ordinary key can start the blocked title without launching the game.
- Enter mutes the speaker. Space enables it again.
- Keyboard focus has a visible indicator.
- Tab navigation does not change the sound preference.
- A real tutorial completion earns the Level 1 checkpoint.
- Campaign launch replaces the title recording with its Act recording.
- A restored checkpoint can play the title without advancing the game clock.
- Manual pause stays silent.
- Options and the speaker share the same sound preference.
- Saved mute prevents automatic context creation after reload.
- The speaker can enable sound after saved mute.
- Mute and title playback preserve the earned checkpoint.

Music-specific mute remains a separate saved setting.
The speaker does not override an explicit Music Off choice.
This branch was inspected in source. It was not a separate browser case in this run.

## Geometry and visual review

The speaker is 44 by 44 CSS pixels.
It is 12 pixels from the left and bottom edges in the tested layouts.
The title controls fit 1280 by 900 and 320 by 568 viewports.
The old title music button is absent.

At 320 by 568, both Act I controls and all four Act III controls remain inside the viewport.
They do not intersect the speaker.
Each flight button is 54 by 46 pixels in the final layout.
The button client width and scroll width are both 52 pixels.
The `Right Shift` key label is 50.39 pixels wide and fits its button.
The checks also measure the actual text ranges.

All three saved-entry instruction lines remain inside the viewport.
They do not intersect the speaker.
The Echo count and build text remain visible above the flight controls.
Their final text rows are between 131 and 164 pixels from the top.

The coordinator's Act III layout fixture selects a late chapter through the local QA interface.
That fixture establishes control geometry only.
It does not establish ordinary campaign progression.
The title and saved-entry scenarios use normal input and an earned checkpoint.

The QA agent inspected these final captures:

- `saved-entry-320x568.png`
- `act3-controls-320x568.png`

The speaker, launch actions, saved-entry instructions, resource text, and flight controls are visible in these captures.

## Findings and repairs

| Severity | Location | Before | After | Reason |
|---|---|---|---|---|
| Medium | `style.css` | The new speaker overlapped part of a saved-entry instruction. | The instruction has reserved space and remains inside the viewport. | Prevent obscured content at the narrow layout. |
| Medium | `src/interface.js` | The existing Echo panel remained below the fixed viewport. | The existing panel is inside the HUD. Its text stays visible. | Preserve resource and build information. This fault existed before the speaker change. |
| Low | `style.css` | The `Right Shift` key border extended beyond a narrow button. A later padding change also shrank the two-button layout. | A 54-pixel minimum preserves both two-button and four-button layouts. | Preserve complete key labels. |

## Retained investigation records

`browser-initial` records the first 34-check pass.
`browser` records the next 37-check pass before the added visual constraints.
`browser-final` records a 41-check pass before settled text and scroll checks were added.
`browser-final-2` records the Act III key-width failure.
`browser-final-3` records the two-button key-width failure.
`browser-final-4` is the final candidate result.

The earlier passes did not include the later discriminating checks.
They do not replace the final result.

## Limits

No human listening review occurred.
No physical device, speaker, headphone, or audio latency was tested.
No screen reader was used.
Browser geometry and visible focus checks do not establish full WCAG conformity.
The test does not establish permission for automatic sound in every browser or embedded page.
The earlier campaign fairness, geometry, and release limits remain separate.

Approve the inspected speaker, startup, continuation, and narrow-layout behavior.
The unverified listening and assistive-technology conditions remain open.
The report uses short sentences and consistent terms.
A complete ASD-STE100 dictionary and editorial review was not performed.
