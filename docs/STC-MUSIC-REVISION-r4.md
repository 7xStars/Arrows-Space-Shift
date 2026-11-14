# Music study revision r4

Status: implemented and technically checked. Listening acceptance remains open.
Project: Arrow Space Shift.

## Feedback and selected change

The user found r3 closer to the intended musical direction.
The user requested harder, more active drums and a revised synth character.
The current revision keeps the hypnotic organization and acid sequence.
It changes the drum body, transients, phrase-end activity, and synth filtering.
It does not return to the rejected chord-led score.

| Part | Concrete change |
|---|---|
| Kick | Stronger controlled drive; a triangle punch layer; shorter, sharper click; retained low fundamental |
| Clap / snare | Saturated noise rises and a short pitched body layer |
| Percussion | Filtered, driven rim and metal; more interlocking tom fills at selected phrase ends |
| Rhythm | Selected half-step ghost kicks and rim accents; the four-beat pulse remains |
| Acid | Lower resonance and sweep range; less square wave; stronger controlled drive; 2.3 kHz post-filter |
| Space | The quiet interval and final gap remain |

Tempo remains 134 BPM.
The 40-bar musical form remains 71.6418 seconds.
The full capture retains its two-second ending interval.
Master and bus settings match r3.
Neither comparison file received loudness normalization.
The added drum energy changes measured loudness.
This is not a loudness-matched comparison or an accepted master.

## Source and return identity

`announce(event)` requires an actual typed `attack-entered` event.
`attack(event)` is an alias for the same method.
The event includes a stable object ID, event ID, family or motif, and source position.
The announcement uses the same retained two-note identity as the actual crossing cue.
Its pan comes from the source position or the actual supplied pan.
The crossing cue uses the actual destination pan.

The source record is distinct from a crossing record.
It does not increase the crossing count.
Prediction and render-only records produce neither cue.
The playable study controls when entry information is permitted.
The transfer entry remains silent until the first prediction, except in an unscored listening probe.

## Delivered files

- [Current music-only study](../reports/stc-study-r4/ass-identified-return-r4-music.wav).
- [Current entry/return mix](../reports/stc-study-r4/ass-identified-return-r4-crossing-mix.wav).
- [Render measurements](../reports/stc-study-r4/render-results.json).
- [Current finite score](../audio/stc-study/score-r4.json).
- [Source and instrument record](../audio/stc-study/README.md).
- [Preserved r3 verification](../reports/stc-study-r4/r3-preservation.json).

The two WAVs and the finite score from r3 match their saved SHA-256 values.
The r3 source modules are preserved in `audio/stc-study/r3-source/`.
The r3 reviewed files were not rewritten for this revision.

## Executed checks and limits

`node --test tests/stc-audio.test.mjs` passed seven tests.
`node tools/render-stc-study.mjs` rendered both current WAVs in native headless Edge.
The full file measured about −2.89 dBFS sample peak and 0.1904 RMS.
The entry/return mix measured about −3.08 dBFS sample peak and 0.1849 RMS.
Both files contained zero non-finite samples and zero full-scale samples.
Both reached 11 transient voices and 25 active sources, with no dropped voice.
The integration owner records independent loudness and true-peak measurements.

The mix fixture uses actual Bolza traces at synthetic presentation times.
It is not a recording of player combat.
These checks do not establish musical preference, player comprehension, or physical-device performance.
The next listening question concerns drum force and synth fit within the black-space, geometric game aesthetic.
