# QA: automatic title and tempo collection

Candidate: 0.25.1-dev.2. Date: November 13, 2026.
The previous candidate and its archives remain preserved.

## Scope

The title now starts on both a new-game entry and a restored-checkpoint entry.
Saved mute settings still apply. A manual pause during play stays silent.
The normal local address at port 4177 serves the current project.
The earlier comparison source remains on G:.

Nine original two-minute pieces add the requested 120–240 BPM range and 144 BPM.
The 240 BPM r2b revision adds electronic swells and stronger smooth panning.
The user found its first foundation hypnotic and requested these two changes.
The first take remains available. No approval of the revised take is claimed.
The other eight master WAVs retain identical hashes.

## Executed checks

| Check | Result and evidence |
|---|---|
| Baseline `npm run check` | 299 passed. `reports/tempo-r2-baseline-check.log` |
| Current `npm run check` | 303 passed. `reports/stc-tempo-r2/final-npm-check.log` |
| FoxDot Python `-m unittest discover -s tests -p 'test_*.py'` | 76 passed at the latest recorded check. `reports/stc-tempo-r2/final-production-check.log` |
| `node tools/title-entry-browser.mjs` | 19 passed. Normal training earned the saved checkpoint. `reports/stc-tempo-r2/title-browser/REPORT.md` |
| `node tools/music-library-browser.mjs` | 28 passed for the original collection. `reports/stc-tempo-r2/original-library-browser-fixed/results.json` |
| New collection, first mix | 37 passed across nine native stem pairs. `reports/stc-tempo-r2/browser/baseline-r2/results.json` |
| New collection, r2b | 41 passed across nine native stem pairs. `reports/stc-tempo-r2/browser/results.json` |
| r2b native file audit | Nine masters and 36 active OGGs passed. `reports/stc-tempo-r2b/file-verification.json` |
| Actual panning comparison | Measured 250–2600 Hz balance changes over 20–44 s. `reports/stc-tempo-r2b/stereo-comparison.md` |
| Core preservation | Eleven simulation, geometry, progression, and storage modules retain their earlier hashes. `reports/stc-tempo-r2/core-preservation.json` |

The title test used an isolated permitted-autoplay policy to check automatic starts.
A separate default-policy case was blocked and recovered after one Enable click.
The test did not change the user's browser policy.
It checked one context, Stop, restart, launch replacement, mute, and saved-entry layout at 320×568.
It checked that title playback did not change or advance the checkpoint.

The first source-package fixture omitted required entry-module references.
That fixture was corrected to represent the existing runtime dependency graph.
The package checks then passed. This was a test-fixture error.
The new collection selector also exposed a real enlarged-text overflow.
Its wrapping and width limits were repaired. The repeated original-library check passed.
Collection changes now stop native sources explicitly before navigation.

## Preserved campaign evidence

The earlier linked campaign check covered all 37 encounters, physical extraction, repair, ending, and reload.
Its controller timeout and earned-profile import remain in the retained report.
This update does not change simulation or geometry modules.
The final archive report identifies the packaged files and extracted-build checks.
Do not describe browser-clock tests as human play or device performance.

## Remaining limits

Human review of the revised music, physical speakers, headphones, latency, and mobile performance remains open.
The earlier CSS zoom probe, geometry approximation, Act IV equipment, and jam-history limits still apply.
The new nine-track collection supports listening and later campaign selection.
The live campaign retains its four previously selected produced tracks.
No BPM value controls attack timing, damage, physics, or rewards.
No publication or source-license change occurred.

The official Issue 9 reference was blocked in the earlier review.
A complete ASD-STE100 dictionary and editorial review is not claimed.
