# AUDIO-CONTINUITY-013

Candidate: 0.25.1-dev.3. Coordinator: /root. Status: Review.

## Requested result

Keep music continuous when the player folds or unfolds space.
Organize the existing compositions as a downloadable discography.
Preserve the current game rules, saves, music sources, and earlier releases.

The user reports that music returns when space is unfolded.
The Act was not specified in that report.
A passive check found the normal game paused in Act III, chapter 25.
Its recorded player had no load error or recorded underrun.
This observation does not establish the cause of the reported interruption.

## Ownership

| Owner | Result |
|---|---|
| /root/fold_audio_fix | Locate the audio fault. Repair playback and add regression tests. |
| /root/fold_browser_qa | Compare folded and open space in isolated browser sessions. |
| /root/discography | Verify unique compositions and package the WAV masters on G:. |
| /root | Integrate the results, update records, and verify release archives. |

Use the JavaScript engine workflow and the project runtime contracts.
Keep investigation records in `reports/fold-audio-dev3`.
Keep large new files in `G:/Music Projects/Arrow Space Shift`.
Do not reload the user's game or change its browser storage.

## Audio contract

A fold changes space. It must not restart a composition or suspend its audio context.
Warnings can lower music briefly. They must not remove the continuing rhythmic reference.
An intended recovery interval must remain distinct from a playback failure.
Pause, mute, defeat, hidden-page behavior, and title entry must still work.
The old procedural score must not return if a recording fails.
No audio callback can change simulation, collision, or damage.

## Discography contract

Count unique compositions separately from revisions, stems, and previews.
Verify the actual WAV headers, durations, and hashes.
State which compositions play in the campaign.
State which compositions remain review candidates.
Preserve authoring sources and all original master files.
Do not claim publication, listening approval, or release readiness from file checks.

## Verification

Baseline: `npm run check` passed 303 tests.
The log is `reports/fold-audio-baseline-check.log`.
Compare actual fold and unfold input with audio position, source count, context state, and layer gain.
Include Act III chapter 25 and a normal 24-second segment transition.
Check nearby pause, resume, and mute behavior.
Verify the final PLAY archive after extraction.

The official ASD-STE100 Issue 9 PDF returned HTTP 403 during this task.
Use short sentences and consistent terms. Full dictionary and editorial review remain incomplete.

## Result for archive review

The browser comparison reproduced the fold-to-Forge interruption in dev.2.
The repaired choice retains two native music sources and the audio clock.
The campaign clock stays fixed until a real evolution selection.
The omitted-state resume defect and complete recovery-rhythm removal are also repaired.
The exact unfold-only symptom remains an additional listening question.

The complete game suite passed 309 tests. The Python suite passed 83 tests.
Native fold checks passed 44. Title checks passed 19. Discography checks passed 38.
Eleven core gameplay modules retain their previous hashes.
The discography has 26 verified compositions and 71:16.64 of music.

The implementation and music archive satisfy their local technical checks.
The release agent owns final PLAY and SOURCE archive checks.
Its final report in `releases/0.25.1-dev.3` closes the archive review.
Human listening and public publication remain separate work.
