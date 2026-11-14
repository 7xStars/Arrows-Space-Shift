# Act I and Act II composition handoff

Contract: `ASS-STC-TEMPO-R2-ACT12`, revision 1.
Date: November 13, 2026.
Owner: Music Composition agent `/root/campaign_design_qa`.
State: five new finite compositions. Rendering and listening review are separate.

## Scope

`act12.json` contains three Act I pieces and two Act II pieces.
Each piece lasts 120 seconds, including its ending and tail.
The added 144 BPM piece preserves the earlier 120 and 136 BPM choices.
The complete r2 collection therefore has nine pieces when combined with Acts III and IV.
The sixteen r1 pieces remain unchanged.

These are new arrangements, not tempo changes to the r1 audio.
Each piece has a new ID, seed, bass cell, percussion pattern, harmonic voicings, and form.
No game rule or soundtrack selection changes in this handoff.

## Cue contract

| Field | Record |
|---|---|
| Identity | `tempo-act1-01`, `tempo-act1-02`, `tempo-act1-03`, `tempo-act2-01`, `tempo-act2-02` |
| Purpose | Driving, hypnotic electronic music with clear hard percussion and restrained space |
| Listener | Stereo listening. Keep the low bass centered. Move the upper bass smoothly between channels. This is stereo panning, not a binaural claim. |
| Trigger and authority | These finite music studies have no runtime trigger. Gameplay remains the source of physical events. |
| Timing | 4/4. Times start at zero. Definitions use section fractions; generated events use seconds and MIDI semitones. |
| Structure | A complete two-minute piece with entrance, development, a short clearing, return, and ending |
| Lifecycle | Play the file once for review. It is not a seamless loop. Runtime pause, replacement, and cue mapping require separate integration. |
| Mix | Give kick, snare, hat, and metal different timing roles. Keep the bass audible through the clearing. Keep room effects below the dry rhythmic layer. |
| Delivery request | Stereo WAV and OGG, 48 kHz, exactly 5,760,000 sample frames per piece. Production chooses the checked WAV encoding. |
| Route | Installed FoxDot Patterns -> finite event score -> native SuperCollider NRT -> rendered audio. This is the current Route A variant. No live FoxDot clock or REAPER performance is claimed. |
| Evidence | Definition checks now. Score, synthesis, file, decoded-format, and listening checks belong to Audio Production and the later review. |

## Five-axis definition

| Axis | Composition decision |
|---|---|
| Constituents | A short bass cell, hard low kick, separate backbeat, sparse high hats, inharmonic metal, sustained chord voices, and quiet texture |
| Operations | Repeat, rotate, reverse, compare operation order, change chord voicing, reduce percussion, restore the source, and end |
| Standards | Keep a continuous musical identity. Give the percussion separate spaces. Let the bass drive the quiet section. Do not replace musical development with unrelated effect sounds. |
| Invariance | Retain each source cell and voice family through its transformations. The 144, 152, and 168 BPM pieces preserve one seventh-chord pitch collection while its voicing changes. |
| Context and continuation | Establish a reference before changing it. Reduce density for a short interval. Restore the reference before the finite ending. |

Musical operations do not compute a Klein crossing.
The track titles and section labels express compositional ideas.
They do not announce a gameplay hazard or change a collider.

## Piece definitions

| ID | Title | Tempo | Bass center | Main character |
|---|---|---:|---|---|
| `tempo-act1-01` | Offset Bearing | 120 BPM | C2, with an F-minor section | Heavy electro with rests around the bass and displaced kicks |
| `tempo-act1-02` | Bearing Drift | 136 BPM | E-flat2, with an A-flat-minor section | A broken kick pattern, firm backbeat, and more active hat interplay |
| `tempo-act1-03` | Phase Alloy | 144 BPM | D2 | Hard electro with an acid filter range and two ordered phrase transformations |
| `tempo-act2-01` | Return Grammar | 152 BPM | F2 | Acid repetition, slow stereo travel, and a clear comparison of operation order |
| `tempo-act2-02` | Edges Remember | 168 BPM | E2 | Faster acid motion with fewer hat events and a stable four-beat kick |

`root_midi` follows the existing composer convention.
The composer adds twelve semitones before it applies the cell interval and harmony offset.
The centers above name the resulting event pitches.

### Offset Bearing

The cell uses ten bass events per sixteen steps.
Its rests leave room for the five kick events and the metal response.
The snare stays on steps 4 and 12.
The pad voicings add depth before the short clearing.
The ordered pair then changes the cell while retaining the drum level.

Form in seconds: 0 reference; 16 full groove; 40 voicing; 56 clearing;
64 reverse then rotate; 80 rotate then reverse; 96 original return; 112 exit.

### Bearing Drift

Six kick events create the most broken Act I rhythm in this set.
Eight base hat events interlock with the kick.
The lower hat gain limits high-frequency masking.
Three metal positions supply a separate response.
The stutter operation adds brief repeats at the existing eight-bar boundary.

Form in seconds: 0 dry reference; 14.118 full groove; 35.294 reverse;
49.412 clearing; 56.471 rotate; 77.647 ordered fracture;
91.765 original return; 105.882 exit.

### Phase Alloy

This is the additional 144 BPM piece.
Four regular kick positions remain, with two displaced additions.
The 0.29-second kick decay keeps the low body shorter than the quarter note.
The two ordered sections use the same energy, drum, pad, and texture gains.
Every listed chord voicing contains D, F, A, and C.
Filtering and atmospheric motion still continue, so this is not a controlled human experiment.

Form in seconds: 0 reference; 13.333 full groove; 33.333 reverse;
46.667 clearing; 53.333 reverse then rotate; 66.667 rotate then reverse;
80 reference return; 100 voicing; 106.667 exit.

### Return Grammar

The F-minor cell has five rests and a repeated opening root.
The kick has four regular positions and one late pickup.
The snare retains the backbeat through the transformed bass sections.
All chord voicings contain F, A-flat, C, and E-flat.
The 32-beat upper-bass pan cycle moves slowly across the faster grid.

Form in seconds: 0 reference; 12.632 reverse; 31.579 reverse then rotate;
44.211 rotate then reverse; 56.842 clearing with new voicing;
69.474 full return; 94.737 familiar reverse; 107.368 exit.

### Edges Remember

The tempo rises without an increase to continuous percussion density.
The kick has four base events per bar.
The hat also has only four base events per bar.
Three metal positions and the occasional stutter provide the displaced detail.
The snare has a shorter decay and more source gain than the hats.
All chord voicings contain E, G, B, and D.

Form in seconds: 0 reference; 11.429 full current; 34.286 rotate;
45.714 reverse; 57.143 clearing; 68.571 full return;
91.429 ordered return; 108.571 exit.

## Production parameters

Audio Production confirmed these optional r2 parameters before composition used them.
They are source settings, not measured output loudness or listening approval.

| Tempo | Kick decay | Kick gain | Snare gain | Snare decay | Hat gain | Room mix | Bass gate | Pan cycle |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 120 | 0.38 s | 0.56 | 0.230 | 0.170 s | 0.048 | 0.080 | 0.84 | 16 beats |
| 136 | 0.32 s | 0.55 | 0.235 | 0.155 s | 0.046 | 0.085 | 0.86 | 16 beats |
| 144 | 0.29 s | 0.55 | 0.235 | 0.150 s | 0.045 | 0.080 | 0.85 | 16 beats |
| 152 | 0.30 s | 0.54 | 0.240 | 0.145 s | 0.046 | 0.085 | 0.88 | 32 beats |
| 168 | 0.27 s | 0.53 | 0.245 | 0.135 s | 0.042 | 0.080 | 0.81 | 16 beats |

The first slower kick keeps more body.
The faster pieces shorten that body.
The hats become quieter as the acid pattern accelerates.
This keeps higher tempo separate from a simple increase in loudness.
The shared production pass must still check the resulting peaks and masking.

## Acceptance handoff

Audio Production must verify actual finite event counts and parameter routing.
It must verify native synthesis and both delivered formats.
It must check stereo frame counts, finite samples, peaks, tail shape, and low-frequency channel balance.
It must retain the new sources and all rendered WAV files.

Listening review must assess bass drive, percussion distinction, room level, and phrase continuity.
Gameplay review must remain separate from music-only listening.
No listening approval, player recognition, binaural result, or runtime integration is claimed here.
Full ASD-STE100 dictionary and editorial review is incomplete.
