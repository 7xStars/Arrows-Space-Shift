# Arrow Space Shift discography

Collection: `stc-discography-r1`.
Status: Local listening collection. No public release is claimed.

The current jam edition ends at Act III.
It uses the title recording and three selected Act recordings.
Act IV music remains a post-jam study. Its masters are preserved.
The original collection metadata below describes the retained full-source selection.

The collection contains 26 distinct compositions.
The exact duration is 4,276.641791667 seconds, or 71:16.64.
Earlier mixes of one composition do not increase the count.
Stems, previews, sound effects, and operator proof clips do not increase the count.

## Collections

| Collection | Selected revision | Compositions | Duration |
|---|---|---:|---:|
| Structural Techno-Cosmism - Act Studies | `stc-act-library-r1` | 16 | 52:00 |
| Structural Techno-Cosmism - Tempo Studies | `stc-tempo-r2b` | 9 | 18:00 |
| Identified Return | `identified-return-r9` | 1 | 1:16.64 |

These names organize the local files.
They do not establish commercial album releases or publication dates.

## Act Studies

| Act | Composition | BPM | Duration | Current game use |
|---|---|---:|---:|---|
| I | Vector Engine | 132 | 1:00 | Review library |
| I | Vacuum Bearings | 132 | 2:00 | Review library |
| I | Off Axis | 134 | 4:00 | Act I |
| I | Transfer Engine | 132 | 6:00 | Review library |
| II | Identified Pulse | 134 | 1:00 | Review library |
| II | Second Horizon | 134 | 2:00 | Review library |
| II | Order of Returns | 134 | 4:00 | Act II |
| II | Seam Memory | 134 | 6:00 | Review library |
| III | Iron Intake | 130 | 1:00 | Review library |
| III | After the Release | 128 | 2:00 | Review library |
| III | Order of Force | 132 | 4:00 | Act III |
| III | Machinery of Return | 130 | 6:00 | Review library |
| IV | Paired Horizon | 128 | 1:00 | Review library |
| IV | Quiet Curvature | 126 | 2:00 | Review library |
| IV | Order Leaves a Trace | 128 | 4:00 | Act IV; atmosphere also serves repair and ending |
| IV | The Surface Remembers | 128 | 6:00 | Review library |

## Tempo Studies

| Act | Composition | BPM | Duration |
|---|---|---:|---:|
| I | Offset Bearing | 120 | 2:00 |
| I | Bearing Drift | 136 | 2:00 |
| I | Phase Alloy | 144 | 2:00 |
| II | Return Grammar | 152 | 2:00 |
| II | Edges Remember | 168 | 2:00 |
| III | Ratchet Memory | 200 | 2:00 |
| III | Pressure Has an Order | 240 | 2:00 |
| IV | A Measure of Elsewhere | 184 | 2:00 |
| IV | The Same Light Returns | 220 | 2:00 |

All nine pieces remain review candidates for later campaign selection.
The r2b selection changes only the 240 BPM master from its first take.
It adds swells and stronger upper-range stereo movement.
The other eight masters retain their first-take bytes.
The user called the earlier 240 BPM foundation hypnotic.
Final listening approval for the selected r2b mix is not recorded.

## Title single and earlier mixes

The current title uses Identified Return at 134 BPM.
This collection selects its r9 percussion revision.
The selected file contains 3,678,806 stereo frames at 48 kHz.
The earlier r5, r7, and r8 versions remain in their source folders.
They are revisions of this composition.
Rejected binaural experiments are not selected as additional tracks.
No source file is moved, changed, or deleted by this collection.

## Listening and files

The complete WAV archive is on G:.

`G:\Music Projects\Arrow Space Shift\discography\stc-discography-r1\Arrow-Space-Shift-Discography-r1-WAV.zip`

1. Extract the complete ZIP.
2. Open its `index.html` file in a browser.
3. Select a Play button.

The page uses one native audio player.
It starts playback only after a Play action.
It works with local WAV paths and does not require a web server.
It does not read or write campaign saves.
It does not change audio preferences in the game.

Alternatively, open `All-Tracks.m3u8` in a media player.
Each collection also has its own playlist.
`TRACKS.csv` lists titles, tempos, durations, revisions, paths, and hashes.
`discography.json` includes provenance and runtime use for every composition.

All selected masters use stereo 48 kHz PCM16 WAV.
The archive retains the complete original WAV bytes.
No new normalization, effects, or mastering was applied.
Each finite file includes its ending fade and tail.
This package does not make a seamless-loop claim.

The game still uses its existing four campaign recordings and title recording.
This discography does not change campaign track selection.
The browser review library remains at `music-library.html`.
Use `music-library.html?collection=tempo` for the tempo collection.

## Reproduction and verification

Run these commands from the game project:

```powershell
python -m unittest discover -s tests -p 'test_discography.py' -v
python tools/build-discography.py
```

The builder rejects an existing archive path.
If an archive is already present, use `--output` with a new folder.
The builder reads local masters when they are present in an extracted source release.
Otherwise, it reads the recorded tempo-master paths on G:.
Use `--tempo-masters` to specify another master folder.
Every selected master must match its production-record hash.

The checks cover distinct IDs, duplicate audio, file paths, formats, complete WAV payloads, durations, hashes, and archived bytes.
The exact total is 205,278,806 sample frames at 48 kHz.
The offline page has one explicit audio element.
The page retains native audio controls and visible keyboard focus.

File checks do not establish musical acceptance or player comprehension.
Physical-device listening and final track selection remain separate work.
No distribution license or public publication is selected by this archive.

## Production and credits

FoxDot Pattern classes generate finite event scores.
Native SuperCollider SynthDefs render the original instruments and effects.
The adapter does not run a live FoxDot Clock.
REAPER projects are editing handoffs.
No REAPER render is claimed.

The compositions and synthesis are original project work.
Coding agents assisted with composition, synthesis, integration, tests, and documentation.
No reference recording, commercial sample, or external impulse response was added.
HATE, Intellijel, and Larry Heard remain analytical references.

The writing uses short sentences and consistent terms.
A full ASD-STE100 dictionary and editorial review is not claimed.
