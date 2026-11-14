# Audio output review

Candidate: 0.25.1-dev.4. Date: November 13, 2026.

## Report and result

The user reported silence in the title and campaign.
The connected local tabs contained older builds.
One tab was paused. The other was on a defeat screen.
Neither tab had an active music source during the initial check.
The current source was not loaded in those documents.

The coordinator opened the current build in a separate normal tab.
The earlier tabs stayed open.
The saved checkpoint remained available.
The title context initially waited for a permitted audio action.
It then entered the running state and played one title source.
The user confirmed audible title music.
The user then confirmed audible campaign music and firing sounds after resuming.

These observations establish working sound in that current browser session.
They do not identify every cause of every earlier silence report.
No simulation, music master, or Windows audio setting was changed for this recovery.

## Signal checks

`tools/audio-signal-browser.mjs` measures native game PCM through Analyser nodes.
The original graph connections remain intact.
The measurement branches have zero-gain outputs.
The check uses ordinary pointer and keyboard controls in an isolated browser.

Fourteen checks passed.
The title, campaign music, and manual firing produced nonzero signals after their gains.
Their combined signal reached the master output before the hardware destination.
Speaker mute reduced the master signal to zero.
Enabling the speaker restored the signal.
One context served title, campaign, mute, and enable actions.
No page exception or failed asset response occurred.

The detailed values and controls are in [Audio signal verification](AUDIO-SIGNAL-QA.md).

The zero-volume control showed why source state alone is insufficient.
Its player reported playing while its final signal was zero.
Thus, an active source does not prove audible output.

A read-only Windows audio check also found nonzero, unmuted browser output.
Device identifiers, process details, and host logs remain local.
The diagnostic did not change device, volume, or mute settings.
The user confirmation is separate evidence of audible output.

## Continued verification

Check the loaded build before evaluating a change.
Check mute preferences, context state, post-master signal, output routing, and listening separately.
When the browser blocks automatic sound, use a permitted action to enable it.
Do not bypass the browser policy.
Do not label headless playback assertions as human listening.

The report uses short sentences and consistent terms.
A complete ASD-STE100 dictionary and editorial review was not completed.
