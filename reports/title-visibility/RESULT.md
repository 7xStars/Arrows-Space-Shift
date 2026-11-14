# Title visibility lifecycle

The live audio engine now stops music when `document.hidden` is true.
The stop retains the current audio position.
A visible title can resume that position if its request remains active.
An explicit Stop or disabled music setting prevents that return.
The title request also checks visibility before and after context resume.
A late resume cannot start a source on a hidden page.

The guard does not change physics or the simulation clock.
Offline rendering does not use the page visibility guard.
Node tests can run without a `document` object.

Two new regression tests passed.
They check source cancellation, held position, visible return, explicit Stop,
disabled music, late context resume, and independent offline rendering.
The recorded audio test file now has 18 passing tests.

`npm run check` passed 299 tests and 72 syntax files.
The normal audio browser tool passed all 18 checks again.
It found no missing asset or visible research link.
The logs are `npm-check.log` and `normal-browser/results.json`.

## Native visibility limit

The native probe opened another tab and selected it with `bringToFront()`.
It did not replace or override `document.hidden`.
The probe ran in headless Edge and in a temporary headed Edge session.
Both configurations kept both pages at `visibilityState='visible'`.
The native hidden condition therefore did not occur.
The reports are `before/results.json` and `before-headed/results.json`.

The hidden-page change has unit verification.
It does not have a successful native hidden-tab test in this environment.
The normal browser result does not remove that limit.
The coordinator owns the immediate page visibility event handler and restaging.
