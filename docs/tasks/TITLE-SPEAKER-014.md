# TITLE-SPEAKER-014

Candidate: 0.25.1-dev.4. Coordinator: /root. Status: Review.

## Requested result

Start title music on entry.
Replace the title music text button with a speaker in the lower-left corner.
Let the player turn sound on and off with that speaker.

The user's open tab still had dev.1 loaded during the passive check.
Its sound and music preferences were both on.
Its flight was paused. The tab was not reloaded or changed by that check.

## Scope and ownership

| Owner | Result |
|---|---|
| /root/title_audio_engine | Start and preload behavior, cancellation, and audio regression tests. |
| /root/title_speaker_qa | Native browser checks, state, keyboard, persistence, and layout. |
| /root | Speaker interface, application integration, records, and packaging. |

Use the existing JavaScript runtime and audio engine.
Keep the music masters, game rules, saves, and Forge repair unchanged.
Keep large reports and release archives on G:.

## Presentation contract

The speaker is a native button with a 44-pixel target.
Its wave and cross shapes distinguish sound states without color alone.
It has a descriptive accessible name, pressed state, description, and focus ring.
The button stays available during flight and manual pause.
Native modal dialogs can make it inactive with the rest of the page.
The speaker controls the existing global sound preference.
The separate music preference remains available in Options.

When the context is blocked, the first speaker action enables sound.
The action is retained at pointer or keyboard activation.
A context change before the click must not change Enable into Mute.
Mute persists after reload. It must cancel a pending title start.
The old title music text button is removed.

## Startup contract

Request title playback immediately on title entry.
Load the recording while the browser waits for audio permission.
Use one context and one title source.
Do not wait for sprite loading before requesting music.
When browser policy blocks sound, retry on the first permitted click or key press.
Do not change the user's browser settings or claim to bypass its policy.
Keep launch cancellation, manual pause, hidden-page safety, and saved mute.

Official browser reference: https://developer.chrome.com/blog/autoplay
The prior dev.3 SOURCE passed 309 tests in the frozen extraction during this task.
An initial working-tree run overlapped active edits. It is not a clean baseline.
Final checks must use the complete candidate.

The accessibility review uses the better-accessibility skill.
Native browser checks do not establish screen-reader behavior or physical sound output.
The writing uses short sentences and consistent terms.
A complete ASD-STE100 dictionary and editorial review is not claimed.

## Result for archive review

The source passed 312 game tests and 83 Python tests.
The final native title and speaker run passed 43 checks.
Permitted automatic playback and blocked first-action startup passed separately.
The new speaker, saved mute, keyboard actions, and compact control labels passed.
The layout review also repaired the existing off-screen Act III echo panel.
The coordinator inspected the final compact screenshots.
Eleven core simulation, geometry, storage, and progression modules retain their hashes.

The release agent owns final archive checks.
Its report in `releases/0.25.1-dev.4` closes the archive review.
Human listening and physical devices remain separate work.
