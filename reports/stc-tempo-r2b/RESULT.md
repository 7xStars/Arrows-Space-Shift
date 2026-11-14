# Pressure Has an Order: r2b production

The user found the 240 BPM piece hypnotic and requested swells and stronger panning.
This revision changes only that piece's musical definition.
The other eight definitions and full-mix WAV hashes remain identical.
Their encoded core, atmosphere, and full files retain their original bytes.
The original nine takes and both r2 archives remain on G:.
The original authoring files, catalog, and render reports are also retained in `baseline-r2/`.

## Implemented sound

The bass notes, drum grid, chord data, and arrangement form stay unchanged.
The new score adds seven ten-second electronic swells with two voices each.
The source combines fixed-pitch upper tones, resonant filtering, and filtered noise.
It does not add an orchestral or alarm-like rising pitch.
Each swell uses retained chord tones and a slow attack and release.

Upper bass pan depth changes from 0.58 to 0.94.
Its cycle changes from eight seconds to four seconds at 240 BPM.
Atmosphere adds a six-second balance cycle at depth 0.65.
The swell voices use slower, opposing eight-second motion.
The kick and low-bass source routes stay centered.
The room return remains at the original 4.5 percent setting.
No HRTF or binaural processor was added.

## Executed file checks

All nine native renders completed successfully.
All 36 active OGG files passed exact decoded frame and finite-sample checks.
All full mixes and stems remain stereo PCM16 at 48 kHz and 120 seconds.
The PCM16 stem pairs reconstruct their full mixes within one PCM unit.
The highest measured master true peak remains -1.5 dBFS across the collection.
The highest measured decoded OGG true peak remains -1.4 dBFS.
The new composition tests verify that the added swells do not retime the accepted core events.
The eight unchanged definitions have equal canonical hashes.
The eight unchanged full-mix WAVs have equal file hashes after native rendering.

## Actual stereo probe

The probe filters actual PCM to 250–2600 Hz and measures channel energy in 250 ms windows.
The comparison interval is 20 through 44 seconds.
Full-mix balance deviation rises from 0.1789 to 0.2242.
Core balance deviation rises from 0.1796 to 0.2244.
Atmosphere balance deviation rises from 0.1435 to 0.6378.
The complete window series and low-band measurements are in `stereo-comparison.json`.

The crossover is not a brick-wall filter.
Existing delays, upper-bass residue, and atmosphere can produce low-band channel differences.
These measurements do not claim a perfectly mono low band or a perceptual improvement.
The baseline and revised stereo excerpts support a separate listening comparison.

## Delivery

Current raw files are under `G:/Music Projects/Arrow Space Shift/stc-tempo-r2b/`.
The browser catalog keeps revision `stc-tempo-r2` and adds `mix_revision:r2b`.
The 240 BPM entry uses new `-r2b` filenames.
The first encoded 240 BPM files remain available for comparison.
The production manifest supplies all 45 portable media and REAPER-session mappings.
REAPER sessions remain generated editing handoffs. They were not opened or rendered in REAPER.

These are finite arrangements with endings, not seamless loops.
Human listening approval and physical headphone or speaker checks remain separate.
No publication or source-license change occurred.
