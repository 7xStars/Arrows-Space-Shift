# Title entry browser verification

Date: 2026-11-13. Candidate: 0.25.1-dev.2.
Mode: QA Verification. Target: the current D: source folder.
Browser: isolated headless Microsoft Edge 157.0.4341.46.

Executed command:
`node tools/title-entry-browser.mjs . reports/stc-tempo-r2/title-browser`

Result: 19 checks passed. No page exception or resource failure occurred.
The tool changed no game source. It did not control the user's browser.
It used no QA parameter, injected profile, or simulation write.

## Observed behavior

The default-policy browser attempted the title before a click.
Its native AudioContext was suspended.
The page displayed Enable title music.
One click started the title recording in the existing context.

The permitted-policy case used `--autoplay-policy=no-user-gesture-required`
only in its isolated browser process. Chrome documents this developer switch
for permitted-autoplay tests. It is not a promise about browser defaults.
See [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay).

Under that policy, clean entry started the title without a click.
Normal keyboard training earned a real Level 1 checkpoint.
Launching training replaced the title with the Act I recording.
Reload restored the Level 1 entry and started the title without another click.

The stored checkpoint remained byte-identical during title playback, Stop,
and restart. Its route seed, stage, score, and simulation time remained intact.
Resume replaced the title with Act I music. It did not restart Level 0.
Each active audio page used one context.

A normal manual pause stayed quiet and hid the title control.
The Options sound switch saved mute through the real interface.
After reload, saved mute prevented audio-context creation and title playback.
The muted entry retained the same earned checkpoint.

At 320 by 568, Resume Level 1 and Stop title music were visible and in bounds.
Hit testing confirmed that no other element covered either control.
The saved-entry screenshot was inspected visually.

## Evidence and limits

- `results.json`: checks, native context counts, read-only states, and source hashes.
- `default-title.png`: default-policy title after its Enable action.
- `saved-entry-320x568.png`: restored entry with both controls in view.
- `run.log`: final successful run.

Initial test-fixture failures are retained in `initial-run.log` and
`initial-fixture-failure.png`. The policy argument handling and optional
command-line inspection were corrected in the checker. No game repair was needed.

Edge did not expose its full command line through the CDP inspection call.
The requested launch arguments are recorded. Native playback state was observed.
The checker observes AudioContext state and the game's read-only recording state.
It does not perform a listening review or measure physical output latency.
It does not establish permission behavior in every browser or device.
No settings or flags were changed in the user's browser.
