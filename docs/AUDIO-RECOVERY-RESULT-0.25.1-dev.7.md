# Audio startup and title alignment

Candidate: 0.25.1-dev.7. Date: November 13, 2026.
Owner: /root, Design, Engineering, QA, and Integration in sequence.
Contract and investigation: [AUDIO-RECOVERY-017](tasks/AUDIO-RECOVERY-017.md).

## Cause and decision

The user heard effects but no music in the normal Chrome game.
Options showed sound on, a 55 percent music level, and Music is off.
The unchecked music preference explained the inspected music silence.
Defaults enabled music, but startup preserved an earlier saved false value.
The speaker status did not identify that independent music switch.
The source does not establish what originally disabled it.

The user later heard music after enabling the speaker in a recovery tab.
That result separates saved mute from browser activation as two conditions.
The user requires sound and music enabled on every main-game launch, without a special URL.
The first local query-based repair was superseded before publication.

## Implemented behavior

Each main-game launch enables sound and music.
Zero saved master or music levels return to their defaults.
Nonzero levels and other settings remain saved.
Mute remains available during play. A new launch enables audio again.
Saved campaign progress is unchanged.

The speaker represents the enabled preference independently of the AudioContext state.
When browser policy blocks startup, it shows an enabled speaker and a Start sound action.
The normal Begin or Resume action resumes audio. Trusted ordinary input also retries a suspended context.
No separate speaker action is required by the game.
The game still requests title music automatically on entry.
No music URL option is required or interpreted.

The browser can require a user action before audible playback.
The game cannot guarantee sound before that action under normal Chrome policy.
See [Chrome's autoplay documentation](https://developer.chrome.com/blog/autoplay/).
No user browser flag, site permission, Windows volume, or output device was changed.

## Title alignment

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| Low | style.css, .brief .menu-kicker | Zero inline margins kept a width-limited paragraph against one side | Automatic inline margins center the paragraph | The objective line now shares the title panel's center |

The existing font, spacing scale, wording, and title layout remain.
Measured paragraph center offsets were zero in the focused cases.
Text-range center offsets remained below two pixels.
Checks cover 1280×900, 390×844, 320×568, 640×450, and RTL at 320×568.
Screenshots were retained in reports/audio-recovery-017/.
Native 200 percent browser zoom and physical-device layout were not verified.
Approve the declared alignment checks only.

## Verification

All 323 game tests passed after the launch-policy change.
The focused startup test passed in isolated Google Chrome and Microsoft Edge.
Each browser started with saved sound and music disabled and zero master and music levels.
The plain URL enabled audio. Begin produced nonzero post-master music PCM without a speaker click.
Mute still worked during play. Plain reload enabled audio again and produced nonzero PCM.
Each focused run also checked the five title layouts.
No page exception occurred.

The separate title suite checks strict, default, and permitted autoplay behavior in isolated processes.
The permitted case verifies title playback before a click.
The strict case verifies that the browser blocks output until an action.
The general browser suite checks settings, saved checkpoint recovery, and narrow layouts.
Release-package checks and GitHub publication are recorded separately in releases/0.25.1-dev.7/.

## Limits

The user confirmed audible music after a speaker action in the earlier recovery trial.
That does not establish automatic title sound or the final Begin path in the user's profile.
The final Begin path has technical Chrome and Edge evidence. Human acceptance remains open.
No recording, music arrangement, combat rule, or progression rule changed.
Full ASD-STE100 dictionary and editorial conformity were not verified.
