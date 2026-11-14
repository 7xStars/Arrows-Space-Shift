# Tempo library browser verification

Date: November 13, 2026.
Owner: QA Verification agent `/root/campaign_design_qa`.
Target: local browser music library. Game physics and campaign progression are outside this change.

## Final r2b result

The final revised catalog passed all 41 browser checks across nine real stem pairs.
The command was:

```powershell
node tools/tempo-library-browser.mjs . reports/stc-tempo-r2/browser --expect-r2b
```

`results.json` identifies `mixRevision:r2b`.
It records the current HTML, player, catalog, and eighteen encoded-layer hashes.
The player source SHA-256 is `64abbea6d233deffc121800c8403bf0208089bb456a9ac0fc2f1686d4330dcf5`.
The collection header displayed the revision.
The selected 240 BPM piece displayed `Swells and stereo revision`.
Its four catalog paths selected the new r2b files.

All nine pairs decoded to 5,760,000 stereo frames at 48 kHz.
Each pair used one start time and one offset.
The revised 240 BPM pair started at `6.701333333333333` on both source nodes, with zero offsets.
Its native decoded core peak was `0.8249353170`.
Its atmosphere peak was `0.0346134529`.
Its reconstructed sum peak was `0.8241445565`.
Every tested native layer and sum had zero non-finite samples and zero full-scale samples.
The largest reconstructed peak across all nine tracks remained `0.8400409094`.

The sixteen encoded-layer hashes for the eight unaffected tracks match the retained baseline.
The normal flow had zero page exceptions and zero failed HTTP responses.
The intentional unavailable-layer fixture recovered through Play without a second native context.
The storage probe recorded no write, removal, or clear operation.
The collection round trip stopped each native pair before navigation.

`library-240-r2b.png` records the revised track and its visible label.
The final desktop and compact layout captures remain beside `results.json`.
The earlier 37-check baseline is retained under `baseline-r2`.
The 39-check revised-audio pass before the final label change is retained under `revised-r2b-before-labels`.

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
The initial binding setup needed the Runtime protocol domain enabled.
An early label assertion also needed to account for the header's uppercase presentation.
Those tool failures remain in the attempt records.
The coordinator added an explicit `player.stop()` before navigation.
The passing result records both model state and native source state at that boundary.
The observer does not change player output or audio scheduling.

## Revision scope

The user requested more swells and stereo movement in the 240 BPM piece.
Audio Production made the r2b revision and preserved the first WAV and ZIP collection.
The final browser run repeated all nine native pair checks on the revised stable catalog.
Production retains its separate source, native-file, and stereo-change measurements.
The browser result does not establish that a person prefers the new swells or stereo movement.

## Evidence limits

This is local headless Edge with real Web Audio decoding and source nodes.
No human listening approval, physical-device performance, speaker, headphone, or input-to-output latency result is claimed.
The checks do not establish long-session heap retention or automatic page-visibility behavior.
No hosted update or publication was made.
Full ASD-STE100 dictionary and editorial review is incomplete.
