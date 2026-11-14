# Tempo library browser verification

Date: November 13, 2026.
Owner: QA Verification agent `/root/campaign_design_qa`.
Target: local browser music library. Game physics and campaign progression are outside this change.

## Baseline result

`node tools/tempo-library-browser.mjs` passed 37 checks for the first nine-track r2 collection.
`baseline-r2/results.json` preserves that result and its source identities.
All nine native core and atmosphere pairs decoded in Microsoft Edge `157.0.4341.46`.
Each layer had 5,760,000 stereo sample frames at 48 kHz.
Each pair used the same scheduled start time and offset.

The native decoded core, atmosphere, and full-level sum contained finite samples.
None reached full scale.
The largest reconstructed sample peak was `0.8400409094`.
These are sample measurements. They are not listening approval or a physical output measurement.

The collection selector changed from the playing original collection to the tempo collection and back.
At each change, the player had zero active sources before navigation.
The native source probe also recorded zero active sources at that boundary.
The new page did not start audio automatically.
Track changes within one player used one native audio context.
Full collection navigation loads a new document and therefore a new player.

The checks also covered pause, resume, seek, natural ending, stop, atmosphere mute, full mute, retry, and actual download links.
The 144 BPM piece appeared in metadata and the Act I controls.
The complete tempo set was 120, 136, 144, 152, 168, 184, 200, 220, and 240 BPM.
The player did not write campaign or preference storage.
Normal playback produced no page exception or failed HTTP response.
The intentional 503 layer failure remained separate from normal request results.

## Interface review

Automated bounds checks passed at a 320-pixel viewport, with RTL direction and 200% text.
The desktop and 320-pixel RTL captures received visual inspection.
The native transport controls and collection selector remained available.
This is layout verification. It is not a complete localization or screen-reader assessment.

## Observation repairs

The first console and beacon probes did not retain the unload observation.
The context-destruction probe was unsuitable because the browser retained the old context.
These attempts did not establish an audible overlap defect.
Their result files remain in this directory.

The final probe uses a read-only protocol binding after the collection change handler.
The coordinator added an explicit `player.stop()` before navigation.
The passing result records both model state and native source state at that boundary.
The observer does not change player output or audio scheduling.

## Pending revision

The user requested more swells and stereo movement in the 240 BPM piece.
Audio Production is making the r2b revision while it preserves the first WAV and ZIP collection.
The baseline result above does not approve those revised files.
The final browser run will repeat all nine native pair checks after the revised catalog and files are stable.

## Evidence limits

This is local headless Edge with real Web Audio decoding and source nodes.
No human listening approval, physical-device performance, speaker, headphone, or input-to-output latency result is claimed.
The checks do not establish long-session heap retention or automatic page-visibility behavior.
No hosted update or publication was made.
Full ASD-STE100 dictionary and editorial review is incomplete.
