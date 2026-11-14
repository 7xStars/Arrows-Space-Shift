# Act III and Act IV composition handoff

Date: 2026-11-13. Revision: STC tempo r2.
Mode: Music Composition. Source: `act34.json` in this folder.
The coordinator owns scope. `tempo_production` owns synthesis and rendering.
The old tracks, library, and campaign runtime remain unchanged.

## Cue contract

| Field | Definition |
|---|---|
| Identity | `tempo-act3-01`, `tempo-act3-02`, `tempo-act4-01`, `tempo-act4-02` |
| Purpose | Test faster music through new composition, sparse note cells, clear drums, and retained identity. |
| Listener | Music review. Normal stereo playback. The low bass and kick remain centered. |
| Trigger | Manual playback of a rendered candidate. No gameplay trigger is added. |
| Timing | 4/4. The JSON BPM is the quarter-note tempo. Onsets use a sixteenth-note grid. |
| Structure | Four finite pieces. Each piece lasts 120 seconds, including its ending. |
| Lifecycle | Play from the start. Stop on request. These files are not seamless loops. |
| Mix | Short kick and snare bodies. Low room return. Slow upper-bass stereo movement. |
| Delivery | New WAV renders from the production agent. Preserve score JSON and native synthesis sources. |
| Evidence | Finite score checks completed. Render checks and listening remain separate. |

The selected production path uses FoxDot Pattern data and SuperCollider synthesis.
It is the finite offline extension of Route A.
This composition task did not record a live FoxDot performance or use REAPER.
REAPER files can retain the production stems and section boundaries when delivered.
Do not describe such files as an auditioned REAPER mix without that work.

## Musical identity

| Piece | Tempo | Bass cell | Role |
|---|---:|---|---|
| Ratchet Memory | 200 BPM | Eight notes and eight rests per bar. E-centered. | Hard industrial / EBM. Four-beat kick. Snare on beats two and four. |
| Pressure Has an Order | 240 BPM | Six notes and ten rests per bar. C-sharp-centered. | Fast kick with a half-time snare. Compare two operation orders. |
| A Measure of Elsewhere | 184 BPM | Seven notes and nine rests per bar. D-centered. | Hypnotic acid, open space, and retained harmonic identity. |
| The Same Light Returns | 220 BPM | Six notes and ten rests per bar. E-flat-centered. | Fast pulse with a half-time snare, sparse bass, and two ordered returns. |

The source bass rates are 6.667, 6.0, 5.367, and 5.5 onsets per second.
These rates do not describe the tempo as a different BPM.
They limit note density while the kick retains the stated pulse.
Only the 200 BPM piece uses the optional metal stutter operation.
The retained composer also adds occasional short hat fills.

All four pieces have new titles, seeds, roots, motifs, voicings, and forms.
No existing recording was retimed to make them.
The new definitions use the r1 score fields plus the parameters agreed with production.

## Constituents and operations

### Ratchet Memory

The low voice starts on E. The bass cell contains rests and short adjacent notes.
The kick carries the pulse. Offbeat hats and two metal accents keep separate roles.
The harmony uses E minor-seventh, A minor-seventh, and an added-ninth color.
The bass root moves to A in the third four-bar harmony phrase, then returns to E.

The form establishes the source before it rotates or reverses it.
At 62.4 seconds, the drum and bass levels fall to expose the harmony.
At 72 seconds, the reversed cell restores pressure.
At 110.4 seconds, the source returns. The closing section starts at 115.2 seconds.
The relative interval collection and rest count survive the phrase permutations.

### Pressure Has an Order

The six-note C-sharp cell leaves ten grid positions empty.
The kick keeps the 240 BPM quarter-note pulse.
The snare occurs on beat three. This supplies a half-time backbeat.
The hats occupy four offbeat positions per bar.

The first transformed section reverses, then rotates the cell by three positions.
The second rotates by three positions, then reverses it.
The two results differ with the actual FoxDot Pattern operations.
They retain the source notes and rest count.
At 60 seconds, the arrangement clears the foreground.
Both orders return before the source returns at 105 seconds.
The closing section starts at 114 seconds.

This is a musical order comparison. It does not implement a topology operation.
It does not provide evidence that a player understands a geometric commutator.

### A Measure of Elsewhere

The low D anchor remains centered while the upper bass moves slowly in stereo.
Every chord voicing retains D, F, A, and E as pitch classes.
Changing the register preserves this harmonic collection.
Sparse metal and a late snare leave room for the independent pad and noise events.

At 52.17 seconds, the bass cell rotates.
At 62.61 seconds, the percussion thins and the harmonic field remains.
The source returns at 78.26 seconds.
A later voicing change retains the same pitch classes.
The final chord section starts at 114.78 seconds.

### The Same Light Returns

The six-note cell uses an E-flat anchor.
Every chord retains E-flat, G-flat, B-flat, and F as pitch classes.
The fast kick and half-time snare remain separate from the slow upper-bass pan.
The pad events have irregular clock-scheduled spacing.
Their synthesis can also have independent slow modulation.

The first operation order starts at 26.18 seconds.
The second starts at 61.09 seconds.
At 69.82 seconds, the foreground thins while the harmonic field remains.
The first order returns at 87.27 seconds.
The source cell returns at 104.73 seconds.
The closing section starts at 113.45 seconds.

## Production parameters

The production agent accepted these optional fields before use.
Gains are note-event amplitudes before section gain. They are not master levels.
`room_mix` changes the atmosphere return. It does not add drum reverb.
`bass_gate` is a duration factor relative to one sixteenth-note grid step.
`pan_cycle_beats` gives one complete upper-bass stereo cycle.

| Parameter | 200 BPM | 240 BPM | 184 BPM | 220 BPM |
|---|---:|---:|---:|---:|
| `kick_decay` | 0.22 s | 0.20 s | 0.23 s | 0.21 s |
| `kick_gain` | 0.54 | 0.55 | 0.52 | 0.54 |
| `snare_gain` | 0.225 | 0.24 | 0.185 | 0.195 |
| `snare_decay` | 0.13 s | 0.105 s | 0.15 s | 0.12 s |
| `hat_gain` | 0.043 | 0.040 | 0.041 | 0.039 |
| `room_mix` | 0.055 | 0.045 | 0.075 | 0.085 |
| `bass_gate` | 0.82 | 0.80 | 0.88 | 0.86 |
| `pan_cycle_beats` | 32 | 32 | 64 | 64 |

Preserve the low-frequency center when the upper bass moves.
Use the existing low/upper separation as the starting point.
Keep the kick dry and distinguish its attack from the metal voice.
Keep the snare shorter than the gap to its next intended accent.
Check the combined mix for peaks and low-frequency accumulation.
Do not describe the stereo pan as a binaural-beat process.

The score stops new onsets before 117 seconds.
The last three seconds are reserved for the fade and effect tail.
The final WAV must have exactly 120 seconds at the selected sample rate.

## Checks completed

Installed FoxDot 0.9.0 generated each finite score twice with identical results.
The check used `G:/Music Tools/FoxDot/venv/Scripts/python.exe`.
It loaded the retained r1 composer without writing to the old library.
The optional production fields were not applied by that compatibility check.
The new renderer must check those fields separately.

| Piece | Events in compatibility score | Last onset |
|---|---:|---:|
| Ratchet Memory | 2,463 | 116.965 s |
| Pressure Has an Order | 2,546 | 116.915 s |
| A Measure of Elsewhere | 1,616 | 116.942174 s |
| The Same Light Returns | 1,919 | 116.971818 s |

Checks confirmed finite times, ordered sections, new identities, and a bounded ending.
They confirmed different reverse/rotate results for each source pattern.
They confirmed exact harmonic pitch-class persistence in both Act IV pieces.
These results do not establish drum clarity, mix quality, or listening acceptance.

## Next evaluation

Compare each rendered piece at a consistent listening level.
Check the kick, snare, hat, and metal identities during the strongest section.
Check that the breakdown provides space without a long room tail.
Check the upper-bass pan on headphones and speakers.
Check mono playback for loss of the bass anchor.
Compare the first source phrase with its return.
For the order studies, compare the two variants without their section labels.

The music does not announce a scheduled attack or provide hidden gameplay information.
Any future event mapping must use actual simulation events and visible equivalents.
Gameplay remains independent of this musical clock.

## Listening revision r2b: 240 BPM only

The user requested swells and stronger stereo motion in Pressure Has an Order.
The bass cell, drum grids, harmony, gain settings, and arrangement form remain unchanged.
Seven ten-second electronic swells use retained upper chord tones and filtered noise.
Each swell has two voices. The voices move in opposite phase over eight seconds.
Upper bass depth is 0.94 with a four-second cycle.
Atmosphere uses a six-second balance cycle at depth 0.65.
Kick and low-bass source routing stay centered. The existing room setting remains 0.045.
No HRTF or binaural processor is used.
Only tempo-act3-02 has mix_revision 2 and a nonzero swell_gain.
The other eight collection definitions remain unchanged.
Actual sample comparisons and listening limits are in reports/stc-tempo-r2b/.
