# Audio task

Task ID: `ASS-AUDIO-025`.
Target: `0.25.0-dev.1`.
Authority: the user authorized the described audio implementation.
Scope: original runtime arrangements, sound routing, independent gains, voice limits, and lifecycle recovery.

The Music Composition, Sound Design, and Audio Production roles share this task.
One agent owns `src/audio.js`, `src/music.js`, audio tests, and this audio record.
The integration owner owns preferences and page controls.
The Act IV owner connects its page to the same API.

Preserve manual shooting, geometry, collision, damage, event order, and progression.
Audio must consume game state without changing it.
Do not install production tools.
Do not replace the current renderer or engine.

The selected route is browser runtime synthesis.
The source files are the editable composition and synthesis records.
No external recording is required.
REAPER, FoxDot, and SuperCollider are not runtime dependencies.
No A/B/C workstation comparison is included in this bounded task.

Required checks:

1. Check independent gains and mute behavior.
2. Check actual event priorities at voice capacity.
3. Check bounded noise buffers and retiring sources.
4. Check suspended-context recovery without duplicate context creation.
5. Check music scheduling without simulation mutation.
6. Check the four Act arrangements, recovery, and ending.
7. Render a bounded offline mix fixture and measure its samples.
8. Report listening and device-output limits separately.

The [audio design record](AUDIO-DESIGN-BIBLE.md) defines current meanings and lifecycle behavior.
The [result](AUDIO-RESULT-v0.25.0-dev.1.md) records executed checks.
