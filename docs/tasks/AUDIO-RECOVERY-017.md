# AUDIO-RECOVERY-017

Baseline: 0.25.1-dev.6. Local candidate: 0.25.1-dev.7.
Status: Local repair verified; plain-URL listening confirmation pending.
Owner: /root, Research Support and QA.

## Report

The user reports audible effects and silent music in the normal Chrome game.
Earlier headless checks used separate browser storage.
Those checks do not establish the current user's saved settings or audible music.

## Current evidence

The inspected normal page uses http://127.0.0.1:4177/.
Options reports sound on, master volume 50 percent, music volume 55 percent, and Music is off.
The Recorded techno music checkbox is unchecked in the inspected screenshot.
The game also has a separate paused state during inspection.
The user confirms that effects were audible during play.

The main speaker control reports Sound is on without identifying that music is disabled.
This is a presentation gap. It does not establish a recording or decoding failure.
Defaults enable music. loadPreferences preserves a saved false value.
Opening a new tab or replacing source on the same origin does not reset that value.
No evidence establishes who or what originally disabled music.

## Recovery and limits

Native input controls did not reliably apply changes to the selected window.
The user was asked to enable Recorded techno music and resume play.
The user reported continued silence. The inspected page still reported Music is off.
The next check is the exact music status after the user changes the checkbox.
Keep multiple tabs and paused play separate from an engine playback failure.
Do not reset progress, overwrite all preferences, change Windows audio settings, or force sound through browser policy.
Do not change a recording or publish another build without evidence of a code or asset defect.
The existing dev.6 release ZIP and GitHub commit remain unchanged.

## URL clue and local repair

The user recalls music working with a music query in the URL.
The dev.6 main runtime contains no music query handler.
The exact earlier URL and its role remain unknown. Do not treat it as an established historical cause.

The first local repair added an explicit music recovery query.
The user heard music after a speaker click, but rejected the query and manual speaker requirement.
That trial was superseded before publication.
The final dev.7 runtime does not interpret a music query.
Each normal launch enables sound and music.
Zero master or music levels return to their defaults. Nonzero levels remain.
Other saved preferences and progress remain unchanged.
Mute still works during play. It does not silence the next launch.
The speaker represents the enabled preference even while browser activation is pending.
The normal Begin or Resume action resumes the native audio context when needed.
The permitted-policy check separately verifies automatic music before a click.
The speaker description now identifies music disabled or music volume zero.
No music master, audio scheduling rule, combat rule, or Windows setting was changed.

## Verification

All 323 game tests passed.
Eight focused browser checks passed with normal audio policy.
The browser started with sound and music disabled and both relevant levels at zero.
The plain URL enabled both flags and restored nonzero levels.
The normal Begin action produced music without a speaker click or URL parameter.
Mute worked during play. Plain reload enabled music again.
The observed peak was 0.12173 in both samples. These are digital samples before hardware output.
No page exception occurred.
Evidence: reports/audio-recovery-017/browser-results.json and npm-check.log.
Thirty general browser checks passed. Forty-three title and speaker checks passed.
The latter compare default, strict, and permitted autoplay policy in isolated browser processes.
The user's browser policy was not changed.
Port 4177 was independently checked and serves dev.7 with no-store caching.

The plain URL was reopened in the normal browser.
The user was asked to confirm audibility without a separate speaker click.
The earlier recovery-link listening confirmation does not establish this final plain-URL result.
