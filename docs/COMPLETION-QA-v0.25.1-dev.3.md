# QA: music continuity and discography

Candidate: 0.25.1-dev.3. Date: November 13, 2026.
The earlier candidates, masters, and release archives remain preserved.

## Observed interruption

The user reported that music stopped during a fold and returned after unfolding.
A passive check found the user's game paused in Act III, chapter 25.
The recorded player had no load error or recorded underrun.
The user's page and browser storage were not changed by these checks.

A controlled browser comparison reproduced one related interruption.
It used the three original audio and application modules from the verified dev.2 PLAY archive.
The remaining simulation and geometry modules were unchanged.
Real fold input advanced Projective Mastery into an Echo Forge choice.
In dev.2, that choice stopped both music sources.
In dev.3, the same choice keeps both sources and their clock active.
The simulation clock stays fixed during the choice.
A real evolution selection resumes combat without restarting the composition.

This establishes the fold-to-Forge interruption path.
It does not establish every possible cause of the user's unfold-only symptom.
The control and final reports retain that distinction.

## Other repairs

Some launch and resume calls omitted the game state.
That omission could select Act I briefly during a later Act.
A regression test failed before the repair and passed afterward.
The caller now supplies its state. The engine also retains its last observed state.

Flight recovery no longer removes the complete rhythmic core.
Its target gain is 0.42 before bus and master volume.
Warnings multiply the core by 0.75 and atmosphere by 0.9.
Repeated warnings cannot reduce the recovery core target below 0.315.
These are gain measurements, not evidence of perceived loudness.
Repair and ending retain their atmosphere-only arrangement.

## Executed checks

| Command or check | Result | Evidence |
|---|---:|---|
| Baseline `npm run check` | 303 passed | `reports/fold-audio-baseline-check.log` |
| Current `npm run check` | 309 passed | `reports/fold-audio-dev3/final-npm-check.log` |
| `G:/Music Tools/FoxDot/venv/Scripts/python.exe -m unittest discover -s tests -p 'test_*.py'` | 83 passed | `reports/fold-audio-dev3/final-production-check.log` |
| `node tools/fold-audio-browser-check.mjs` | 44 passed | `reports/fold-audio-dev3/browser/QA.md` |
| Exact dev.2 audio control | 39 checks completed | `reports/fold-audio-dev3/browser-dev2-control/results.json` |
| `node tools/title-entry-browser.mjs . reports/fold-audio-dev3/title-browser` | 19 passed | Adjacent `results.json` |
| `node tools/discography-browser-check.mjs <extracted-discography> reports/fold-audio-dev3/discography-browser` | 38 passed | Adjacent `results.json` |
| Discography source and archive check | 26 master hashes match | `reports/discography-r1/VERIFICATION.json` |
| Core preservation | 11 module hashes unchanged | `reports/fold-audio-dev3/core-preservation.json` |

The final browser check covers fold and unfold input in the scrolling Acts.
It covers sustained folded Act III combat and a real Echo Forge choice.
It covers Act IV fold input and a 24-second recording segment boundary.
It also covers pause, resume, and music mute.
No page exception or failed asset request occurred in that check.
Late-Act QA entry fixtures were used. This was not a fresh campaign playthrough.

The title check covers permitted autoplay and normal browser blocking.
It also covers one-action recovery, saved mute, Stop, launch, and an earned checkpoint.
These tests use isolated browser profiles.
They do not change the user's browser policy.

The offline discography player passed native full-WAV playback for one track from each collection.
All 26 WAV paths exist. Pause and seeking passed.
The page fits a 320-pixel viewport.
The coordinator inspected the captured narrow layout.
This is browser and visual evidence. It is not a headphone or speaker review.

## Discography

The collection has 26 distinct compositions and 71:16.64 of music.
Sixteen Act Studies total 52 minutes. Nine Tempo Studies total 18 minutes.
Identified Return r9 adds 1:16.64.
The WAV archive includes one offline player, playlists, JSON, CSV, and instructions.
Its 26 selected WAV masters match their production records and archived bytes.
Earlier mixes, stems, previews, and sound effects do not increase the composition count.

The campaign still uses four selected Act recordings and the title recording.
The remaining 21 compositions are review candidates.
This task did not change which compositions play in the campaign.

## Limits and continuation

The exact persistent loss that ends only on unfold was not reproduced independently.
The confirmed Forge interruption, wrong-Act resume, and recovery mix are repaired.
Human listening must assess the revised level during folded combat and recovery.
No new music render, listening approval, physical-device performance, or human playtest is claimed.
The preceding campaign, geometry, equipment, fairness, and jam-history limits still apply.
The next audio step is a listening check of the fixed Act III transition.
After that check, choose among the remaining pieces for campaign use.

Final archive paths and extracted-build results are recorded under `releases/0.25.1-dev.3`.
No public repository, Site, or itch.io publication occurred.
The official ASD-STE100 Issue 9 PDF returned HTTP 403 during this task.
A complete dictionary and editorial conformity review was not completed.
