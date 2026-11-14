# Identified Return r8: added score

The new score adds three musical relationships to the retained r7 foundation.
It does not replace the kick, sub, acid phrase, stereo fade, or original drum events.
The original notes were not authored in FoxDot.
Installed FoxDot Patterns author the new finite events.
This adapter does not start the live FoxDot Clock.

## Time and form

The tempo is 134 BPM in 4/4.
Bar numbers start at zero.
Bar zero starts at 0.04 seconds.
One sixteenth-note step lasts `15/134` seconds.
One bar contains sixteen steps.
The form has forty bars.
The full supplied foundation has an ending and room tail. It is not a seamless loop.

## Three relationships

### Harmonic persistence

Seven quiet harmony entries start at bars 12, 16, 20, 24, 28, 32, and 36.
Each lasts 2.5 bars before the native voice release.
The first two entries use MIDI notes 53, 56, 60, and 63.
Later entries use MIDI notes 56, 60, 63, and 65.
Both voicings retain the Fm7 pitch classes: F, A-flat, C, and E-flat.
The cutoff rises gradually during the middle section.
The break entry uses a lower level and cutoff.
The new harmony remains a secondary voice.

### Transient rise and recovery

Eight individual mechanical answers use half-step offsets between existing attacks.
Four three-hit responses occur in bars 11, 19, 27, and 35.
Their step positions are 5.5, 9.5, and 13.5.
The response amplitudes come from a finite matrix trajectory.

The matrix is `[[0.6,2],[0,0.6]]`.
The initial state is `(0,1)`.
The score calculates state norms from steps zero through eight.
It selects steps zero, two, and six.
It divides each selected norm by the maximum norm in that trajectory.
The resulting gain sequence rises and then falls.
Its maximum is one before the stated instrument amplitude applies.
This is a musical gain mapping. It is not a physical percussion or ship-motion model.

No added percussion starts during bars 28 through 32.
The new percussion does not add another regular kick pulse.

### Operation order

The gate has eight control positions in each bar.
Its repeating levels are `1,1,0,1,1,0,1,0`.
These controls occur every half beat.
The native processor smooths each transition over 20 milliseconds.
Before bar 32, chronological order is gate then room: `R(G(x))`.
From bar 32, chronological order is room then gate: `G(R(x))`.
Only the added harmony uses these operations.
The musical meaning is a change from a continuing tail to an interrupted response.
It does not predict a game boundary or change any game event.

## Silence and recovery

The gate level is zero during bars 31.5 through 32.
The native output mask must also stop every added room tail during that interval.
The mask applies to the new layers. It must not process the retained foundation.
The last added harmony entry ends at bar 38.5 before its release.
The gate closes at bar 40.
All new output must end within the retained full file interval.

## API

`author_score()` returns a new dictionary on each call.
It contains the finite `events`, `gate_events`, `sections`, and `silence_intervals`.
It also contains the time units, FoxDot provenance, and complete transient trajectory.
Harmony events contain `notes` and `cutoff`.
Mechanism events contain `midi`.
Every event contains `id`, `instrument`, `time`, `bar`, `duration`, `amp`, and `pan`.
Gate events contain `time`, `level`, and chronological `order`.

Human listening must determine whether the new layers improve the track.
These authoring records do not establish musical quality, comfort, recognition, or transfer learning.
