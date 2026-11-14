# Identified Return: original music study

Current revision: `stc-study-r6`, score `identified-return-r6-room`.
The user selected the stereo take and rejected binaural playback.
FoxDot sequences the existing take. SuperCollider renders a separate room return.
The browser plays synchronized dry and room files.
See [the r6 production record](../../docs/STC-STEREO-ROOM-r6.md).
The authoring files are in `foxdot-room-r6/`.
The original composition was authored with Web Audio. FoxDot did not compose it.
The following instrument and rhythm record describes that earlier sound design.
Its Web Audio route is historical. It is not the current music playback route.
The [r5 routing record](../../docs/STC-BINAURAL-r5.md) describes the rejected binaural revision.
The r4 sources and review files remain preserved.
The r3 sources, score, and captures remain preserved for comparison.
Project: Arrow Space Shift.
Status: implemented music pilot. Listening acceptance is open.

The user rejected the earlier chord-led score.
This study uses pulse, repetition, interlocking rhythm, and timbre change.
It does not use the earlier Dm–Bb–F–C progression or sustained lead melody.

## Historical sources and route: r4

| Source | Purpose |
|---|---|
| `src/stc-score.js` | Original pattern, instrument requests, articulation, and authored form |
| `src/stc-audio.js` | Original Web Audio synthesis, mix, scheduling, and actual-event cues |
| `audio/stc-study/score-r4.json` | Current finite 640-step score with seconds, notes, gates, accents, and filter values |
| `audio/stc-study/r3-source/` and `score-r3.json` | Preserved earlier instruments and score |
| `tools/render-stc-study.mjs` | Browser offline capture through the same instrument graph |
| `reports/stc-study-r4/` | Current WAV captures, measurement JSON, and later review evidence |

The selected route is browser synthesis for this small pilot.
The live study and offline capture use the same source.
The browser does not require REAPER, FoxDot, or SuperCollider.
No REAPER session, FoxDot performance, SuperCollider capture, or A/B/C workstation comparison was executed.
Those tools remain available for later production.

The original note sequence and percussion use no external recording or sample pack.
The noise buffer is generated from a fixed seed.
The references are HATE's A/V direction and the user's structural analysis.
No track, melody, sample, or visual asset was copied from those references.
The team did not claim to hear the inaccessible YouTube recordings.

The user found r3 closer to the intended direction.
The user requested harder, more active drums and a revised synth character.
Revision r4 changes the instrument paths and controlled phrase-end fills.
It preserves tempo, form, pitch identity, the quiet interval, and master/bus settings.
It does not normalize the A/B files to the same loudness.

## Form

Tempo: 134 BPM. Meter: 4/4. One step: a sixteenth note.
The musical form lasts 71.6418 seconds. The full capture adds two seconds for its ending.
The full capture is not a seamless loop.

| Bars | Time | Function |
|---|---|---|
| 1–4 | 0.00–7.16 s | Establish the quarter-note pulse and a short acid figure |
| 5–12 | 7.16–21.49 s | Add offbeat sub, hats, clap, and syncopated rim |
| 13–20 | 21.49–35.82 s | Open the resonant filter; retain pitch and rhythm identity |
| 21–28 | 35.82–50.15 s | Add a 15-step metallic cycle against the 16-step bar |
| 29–32 | 50.15–57.31 s | Remove the kick; retain fragments and space; leave a final gap |
| 33–40 | 57.31–71.64 s | Return the pulse with displaced rim accents and lower acid variants |

The stable root is F.
The acid sequence repeats 16 steps with rests, accents, and selected tied slides.
The pattern changes through its filter envelope and articulation.
It does not depend on a chord progression.
The authored form is a musical structure. It does not schedule enemy fire.

## Instrument and mix settings

| Layer | Implemented signal path |
|---|---|
| Kick | Sine body, 165 to 49 to 44 Hz; triangle punch layer; sharper short noise click; saturation; shaped half-second decay |
| Sub | Offbeat F1 sine; 0.23-second envelope; gain reduction follows the musical kick |
| Low texture | Kick send through delay, 38 Hz high-pass, 165 Hz low-pass, saturation, and bounded feedback |
| Hats | Generated noise, high-pass and low-pass filters, short or open envelope, restrained panning |
| Clap | Four short noise rises, 620 Hz high-pass, 5.2 kHz low-pass, saturation, and a short triangle snare-body layer |
| Rim and metal | Original inharmonic sine mixtures with brief envelopes, saturation, and low-pass filtering; displaced rhythmic cycles |
| Acid | Two persistent oscillators, sawtooth and quiet square; two low-pass stages; resonant filter envelope; stronger controlled saturation; post-filter; selected tied pitch slides |
| Delay | Three- and five-sixteenth delays; filtered returns; 0.29 feedback; restrained stereo placement |
| Atmosphere | Quiet paired sine textures through the independent ambience bus |

The first acid filter uses Q values near 4.2 to 5.3 during ordinary sections.
The quieter interval uses Q 3.3.
The square component is quieter than in r3.
A 2.3 kHz post-filter removes excess upper harmonics after drive.
Accents change amplitude and filter-envelope depth.
Tied notes retain a continuous oscillator and slide over 75 ms.
The actual complication phase adds 90 Hz to the acid filter base.
It does not change the sequence, tempo, collision, or firing clock.
Combat intensity can make a small additional filter change.

The master has a safety compressor at −8 dB, with an 8:1 ratio.
This is not a claim of mastering or a complete clipping guarantee.
The captures use master 1.0, music 0.55, effects 0.80, and ambience 0.25.
No loudness normalization was applied.
The final fade is part of the capture policy.

## Reproduce and review

1. Run `node --test tests/stc-audio.test.mjs`.
2. Run `node tools/render-stc-study.mjs --legacy` for the earlier Web Audio capture.
3. Review `ass-identified-return-r4-music.wav` first.
4. Review `ass-identified-return-r4-crossing-mix.wav` at the same output level.
5. Record the output device and player volume.
6. Record whether the pulse, groove, and filter changes match the intended character.

The crossing mix is an event fixture with synthetic presentation times.
It is not a gameplay recording.
Its return positions and side indexes come from actual `moveBolza` traces.
It announces source identity before the returning motif.
The playable study supplies its own real Bolza crossing events.
Keep that distinction when reporting the evidence.

The seven focused tests passed.
They check pattern identity, real filter automation, tied slides, actual versus predicted crossing records,
stable object motifs, bounded allocation, settings, pause, and context recovery.
The native browser captures contain no non-finite samples or full-scale samples.
The r4 renders reached 11 transient voices and 25 active sources, with no dropped voice.
These measurements apply to the recorded cases.
They do not establish musical quality, player recognition, or physical-device performance.

Short English and consistent technical terms were used.
Full ASD-STE100 dictionary and editorial review were not completed.
