# Arrow Space Shift 0.25.1-dev.3

This candidate repairs music continuity and organizes the existing soundtrack.
It does not add a game rule or change the campaign soundtrack selection.

Some resume actions requested playback without the current game state.
That request could select Act I briefly in a later Act.
The runtime now supplies its state. The audio engine also retains its last observed state.

Flight recovery keeps a quiet beat instead of removing the rhythmic core.
Echo Forge selection keeps that beat while combat remains stopped.
Warnings lower the music by a smaller amount.
Repair and ending keep their atmosphere-only arrangement.
Manual pause, mute, hidden-page protection, and recording-error behavior remain required.

The local discography has 26 distinct compositions and 71:16.64 of music.
It contains sixteen Act Studies, nine Tempo Studies, and Identified Return r9.
The WAV archive includes playlists, track data, and an offline listening page.
Five recordings serve the current game. The other pieces remain review candidates.
Earlier mixes, stems, and previews are retained separately.

See `docs/COMPLETION-QA-v0.25.1-dev.3.md` for exact test results and limits.
See `docs/DISCOGRAPHY.md` for the track list and production records.
See `docs/KNOWN-ISSUES.md` for the remaining campaign and release risks.
No public repository, Site, or itch.io release was updated.
