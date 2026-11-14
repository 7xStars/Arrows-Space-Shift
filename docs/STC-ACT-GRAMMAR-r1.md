# Structural Techno-Cosmism: Act grammar r1

Candidate: `stc-act-library-r1`.
Source: `audio/stc-act-library-r1/compose.py` and `instruments.scd`.
Definitions: `act12.json` and `act34.json` in the same folder.
Listening page: `music-library.html`.
Status: This document describes the source grammar. Render checks and human findings require separate records.

Structural Techno-Cosmism is the project's provisional artistic language.
It is not an established historical genre.
Its common foundation is a repeated pulse with a retained bass identity.
Different Acts change the organization around that foundation.
The experimental library does not replace the campaign soundtrack or change game rules.

## The sixteen pieces

| Act | Piece | Length | Main distinction |
|---|---|---|---|
| I | Vector Engine | 1 minute | A short bass cell and interlocking percussion |
| I | Vacuum Bearings | 2 minutes | The same rhythmic core with sparse atmosphere |
| I | Off Axis | 4 minutes | Phrase order within a broken electro grid |
| I | Transfer Engine | 6 minutes | Pressure, recovery, harmonic movement, and return |
| II | Identified Pulse | 1 minute | A bass phrase, its reversal, and its return |
| II | Second Horizon | 2 minutes | Regular bass with irregular atmospheric entries |
| II | Order of Returns | 4 minutes | Two orders of phrase transformation |
| II | Seam Memory | 6 minutes | A long form with retained motifs and harmonic relations |
| III | Iron Intake | 1 minute | A bass call and a mechanical response |
| III | After the Release | 2 minutes | Mechanical pressure followed by open harmony |
| III | Order of Force | 4 minutes | Ordered operations over an EBM pulse |
| III | Machinery of Return | 6 minutes | Pressure, withheld layers, and harmonic recovery |
| IV | Paired Horizon | 1 minute | Retained bass identity with upper-range stereo motion |
| IV | Quiet Curvature | 2 minutes | A stable G pedal under changing atmosphere |
| IV | Order Leaves a Trace | 4 minutes | Ordered phrase changes and pitch-class persistence |
| IV | The Surface Remembers | 6 minutes | Discovery, pressure, quiet space, and harmonic return |

Each Act supplies 13 minutes. The complete library supplies 52 minutes.
The full file lengths include their endings.
The tracks are finite studies, not seamless loops.

Act I emphasizes electro rhythm and mechanical clarity.
Act II emphasizes recurring acid figures and recognizable returns.
Act III emphasizes EBM pressure, complementary responses, and recovery.
Act IV emphasizes atmosphere, order, register, and harmonic persistence.
These are composition intentions. They do not establish listener responses.

## Five-axis account

| Axis | Current source relation | Question for listening |
|---|---|---|
| Constituents | Kick, snare, hats, metal, bass, chord stabs, pads, and filtered noise | Can the listener distinguish the core from the atmosphere? |
| Operations | Repeat, rotate, reverse, change register, move the filter, add layers, and withhold layers | Which change does the listener identify? |
| Standards | Clear pulse, bounded levels, readable returns, and room for game warnings | Does the mix remain clear and comfortable? |
| Invariance and equivariance | Rotation and reversal retain the note/rest collection. Octave changes retain pitch classes. | Can the listener recognize a relation after its representation changes? |
| Context and continuation | Introductory references, contrasts, recoveries, returns, and finite endings | Does a later return depend on the established reference? |

The framework defines questions. It does not prove an emotional or learning effect.

## Vocabulary and syntax

| ID | Constituents and operation | Syntax and intended meaning | Current use and limit |
|---|---|---|---|
| `STC-LIB-PULSE` | Kick grid, bass attacks, hats, and accents | Establish a reference; add interlocking parts; retain a reference during contrast | A musical anchor. It does not synchronize collisions or announce an attack. |
| `STC-LIB-MOTIF` | A sixteen-position note/rest cell, source voice, and filter envelope | State the cell; change timbre or order; restore it | A retained musical identity. Recognition remains a human question. |
| `STC-LIB-AIR` | Long pad envelopes, filtered noise, irregular entry gaps, and slow modulation | Admit atmosphere around the core; let it change on another timescale | Independent texture organization. It is not granular synthesis or continuous unclocked CV. |
| `STC-LIB-ORDER` | Reverse and rotate operations on an asymmetric cell | State the source; apply one order; restore it; apply the other order | The finite sequences can differ. No geometric equivalence follows from that fact. |
| `STC-LIB-HARMONIC-PERSISTENCE` | Chord pitches, register, and octave displacement | Preserve pitch classes while a voicing changes | A local musical invariant. Different source chords can intentionally change harmony. |
| `STC-LIB-COMPLEMENT` | Act III bass rhythm and short chord stabs | Place a compact response after a reference figure; withhold or restore it | A capture/release analogy for listening. It is not a new gameplay event mapping. |
| `STC-LIB-NEGATIVE-SPACE` | Layer gains, rests, sparse entries, and reduced percussion | Reduce density; retain a reference; rebuild the arrangement | A recovery and disclosure proposal. No comfort or comprehension result is established. |
| `STC-LIB-SPATIAL-IDENTITY` | Centered bass low path and moving upper path | Retain the low reference while the upper range moves between channels | Stereo movement. It does not locate a projectile or identify a paired edge. |
| `STC-LIB-FRACTURE` | A metallic attack and a quieter displaced repeat | Establish the percussion; add a short repeat at selected phrase endings; retain the pulse | A controlled musical interruption. It is not a boundary-crossing or teleport warning. |

The explicit `stutter` operation is enabled in `act3-04` and `act4-04`.
It adds a quieter metal repeat three quarters of a step after the source attack.
It occurs in the final bar of each eight-bar group when the source attack is present.
The other fourteen pieces do not enable that repeat branch.

## What the source actually does

Installed FoxDot Patterns author finite notes, rhythm gates, transformations, and variation.
`PRand` chooses from finite sets. Seeded `PWhite` values set irregular entry gaps and positions.
The adapter writes those decisions into an inspectable event score.
It does not run a live FoxDot Clock.

The bass filter setting is sampled for each note event.
Its SuperCollider envelope changes the filter during that voice.
`LFNoise1` changes pad and noise properties while each voice runs.
Those local changes do not wait for the next FoxDot note event.
This is separate from the finite scheduling of the voice's entry.

The original SuperCollider instruments generate the sound.
The current source uses sine, saw, pulse, and triangle oscillators, noise, envelopes, and filters.
The upper bass uses a four-bar stereo cycle.
Its low path and sub remain centered.
The kick envelope reduces bass and atmosphere during each pulse.
Those gain changes are part of the source render.
Turning atmosphere off does not change the bass's retained pulse behavior.
The atmospheric effect return is separate from the rhythmic core.
The output mix uses one common linear gain for its full mix and both stems.
There is no new shared nonlinear processor after the rendered stems combine.

The library player starts the core and atmosphere with one audio time and offset.
The Include atmosphere control removes the atmospheric stem without restarting the core.
The core includes drums, bass, core delay, and Act III chord stabs.
Atmosphere includes sustained pads, filtered noise, and their effect return.
Thus, turning atmosphere off does not remove all harmony from every piece.
Playback, decode, pause, resume, and alignment require the integration checks.
This source inspection alone is not a browser acceptance result.

## Two precise structural relations

The composer applies a rotation of three positions.
For an asymmetric motif, reverse-then-rotate can differ from rotate-then-reverse.
An installed FoxDot check on `act4-03` produced these initial values:

```text
reverse-rotate: [5, None, 3, 0, 7, 12, None, 0, ...]
rotate-reverse: [3, 7, 0, 0, None, 10, 5, None, ...]
```

Both complete sequences retained the same note/rest collection.
This executed check establishes a local pattern result.
It does not establish listener recognition or an analogy with a particular isometry.

`voice_chord` can move the highest note down twelve semitones.
This retains its pitch class modulo twelve.
The four source voicings in `act4-03` all have pitch classes `{0, 5, 7, 8}`.
Those classes are C, F, G, and A-flat.
This property is exact for those note arrays.
Audible harmonic continuity remains a listening question.

## Structural Disclosure Method

| Stage | Bounded use in this library |
|---|---|
| Decomposition | Identify the core, atmosphere, motif positions, voicings, and form sections. |
| Representation change | Compare the sound with the finite note score and a simple note/rest strip. |
| Discriminating probes | Compare the same time interval with atmosphere off and on. Compare two operation orders. |
| Candidate generation | Consider rhythm, pitch order, register, timbre, loudness, and prior exposure as possible recognition cues. |
| Relationship establishment | Check actual FoxDot outputs and pitch-class sets. Keep rendered and human evidence separate. |
| Disclosure | After the first response, show the source and resulting sequences. Explain the operation that changed them. |
| Transfer testing | Use a new motif or register before showing the answer. Record the first response and any assistance. |

The method is applied from its supplied registry summary and skill instructions.
The full research paper was not supplied for this task.
This document does not claim a complete transcription or validation of that paper.

The [listening protocol](ACT-LIBRARY-LISTENING-PROTOCOL.md) defines the human questions.
The current library has no human recognition, enjoyment, emotional-depth, or hypnotic-effect result.
Its proposed gameplay analogies do not become engine rules by being named.

## Source and production limits

The pieces use original FoxDot note data and custom SuperCollider instruments.
No reference recording, melody, sample pack, or video asset is used.
The Intellijel and Larry Heard studies supplied by the user informed the design questions.
The referenced YouTube content was not available for direct listening during this work.
The chapter architecture and interpretive account are user-supplied reference material.
The team does not claim to have heard, transcribed, or reproduced the videos.

The library introduces no collision clock, OSC bridge, granular engine, or hardware simulation.
It adds no new capture, release, warning, or boundary-crossing gameplay behavior.
Any later mapping must originate from actual game state and retain useful visual information when muted.
The existing campaign remains the authority for movement, collision, reward, and progression.

The text uses short sentences and consistent technical terms.
Full ASD-STE100 conformity and complete dictionary review are not claimed.
