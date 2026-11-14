# Discography r1: audio production result

Task: Local soundtrack organization for the fold-audio follow-up.
Role: Audio Production and file verification.
Game source: `0.25.1-dev.2` at the start of this task.
The coordinator owns the next game candidate and browser acceptance.

## Result

The collection contains 26 distinct compositions.
Its exact length is 4,276.641791667 seconds, or 71:16.64.
The total is 205,278,806 sample frames at 48 kHz.

| Group | Selected source | Count | Length |
|---|---|---:|---:|
| Act Studies | `stc-act-library-r1` full masters | 16 | 52:00 |
| Tempo Studies | `stc-tempo-r2b` full masters | 9 | 18:00 |
| Title single | `identified-return-r9` full master | 1 | 1:16.64 |

Each master is stereo 48 kHz PCM16 WAV.
Each selected master matches its production-record SHA-256 hash.
All 26 selected master hashes are different.
All 26 composition IDs are different.
The archive retains the original master bytes.
No new processing or rendering occurred.

The title and four Act recordings serve the current game.
The other 21 pieces remain review candidates.
The registry in `src/campaign-recorded-audio.js` supplies this runtime-use record.
The discography does not select new campaign music.

## Package

Archive:

`G:\Music Projects\Arrow Space Shift\discography\stc-discography-r1\Arrow-Space-Shift-Discography-r1-WAV.zip`

Size: 674,097,742 bytes.

SHA-256:

`03b2c319b2faab4cba9619d539b2607ae04c0c6a1262c05d7914c437859cea91`

The archive contains 34 members.
These are 26 WAV files and eight metadata or player files.
All archived masters match their sources.
All metadata files match the generated collection data.
The verifier reads each complete archived WAV stream.
ZIP CRC checks occur during this read.

The archive contains an offline `index.html` listening page.
It uses one native audio element and explicit Play actions.
It contains separate WAV links and visible keyboard focus.
It uses relative paths after extraction.
It does not use campaign storage or game audio preferences.

A complete copy was extracted on G: for browser review:

`G:\Music Projects\Arrow Space Shift\discography\stc-discography-r1\browser-review\index.html`

No full WAV copy or archive was added to D:.
The source masters and earlier versions remain in their existing folders.

## Files changed

- `tools/build-discography.py`: source audit, collection metadata, offline page, ZIP build, and full archive verification.
- `tests/test_discography.py`: source and archive regression checks.
- `docs/DISCOGRAPHY.md`: complete track list, runtime use, listening instructions, production route, and limits.
- `reports/discography-r1/discography.json`: file-level source identity and selected version.
- `reports/discography-r1/TRACKS.csv`: portable track data.
- `reports/discography-r1/VERIFICATION.json`: exact package result.

## Executed checks

```powershell
python -m unittest discover -s tests -p 'test_discography.py' -v
python tools/build-discography.py
```

The unit suite passed all seven tests.
It covers duplicate identities and audio, unsafe paths, exact total frames, WAV format, duration, incomplete payloads, metadata, archive bytes, unlisted members, changed audio, and one explicit audio player.
The full build passed its 26-master source and archive checks.

Browser playback is assigned to the coordinator.
No human listening session was performed for this organization task.
No physical output-device result is claimed.

## Boundaries and continuation

Earlier mixes of one piece are not additional compositions.
Stems, previews, sound effects, operator proof clips, and procedural fixtures are excluded from the count.
The latest selected 240 BPM master includes swells and more upper-range stereo movement.
The user called the earlier rhythmic foundation hypnotic.
Final approval of the selected r2b mix is not recorded.

File checks do not establish musical quality or recognition.
No public release or new distribution license is claimed.
The coordinator must keep this collection separate from the game's release-readiness result.

The writing uses short sentences and consistent terms.
A full ASD-STE100 dictionary and editorial review is not claimed.
