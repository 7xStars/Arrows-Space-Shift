# Arrow Space Shift: current design record

Source baseline: v0.24.1.
Local development version: 0.25.1-dev.8.
Date: November 13, 2026.

This record describes the imported game and the authorized completion slice below.
The [previous design contract](archive/workspace-v0.15.0-20261112/DESIGN.md) remains available with the previous source.
The imported source and release notes remain in `imports/downloads-2026-11-12/`.

## Purpose

The player changes spatial relationships to survive and progress.
The SHIFT theme acts through movement, distance, boundary identification, and attack control.
The geometry must affect gameplay.
The visual and sound systems must communicate the actual operations.

## Jam edition scope

The main Flight time display uses the continuous simulation time across levels.
Section time remains separate for speed grades, bonuses, and clear records.
Do not replace the main flight timer with elapsed section time.

Each main-game launch enables sound and music, as requested by the user.
Restore default master or music level only when its saved level is zero.
Keep nonzero mix levels, other preferences, and saved progress.
Mute remains available during play. A new launch enables audio again.
Request automatic playback under the browser's normal policy.
If that policy requires input, the normal Begin or Resume action starts audio.
The speaker represents the enabled preference separately from browser activation.
No URL music option is required or interpreted.

The fold lesson uses one armed training enemy during firing, folding, and unfolding.
Space stays active through those actions. Unfold does not reset the enemy or clear shots.
An early kill completes training without a mandatory input checklist.
The game uses normal simulation speed. The player learns through immediate consequences under attack.
Shift primarily offers faster route completion at the cost of faster hostile shots.
Automatic drive faults remain part of campaign pressure.
Scrolling routes now have a separate speed grade and a clear bonus of up to 1,000 points.
The curve compares elapsed section time with route length divided by SCROLL_SPEED.
Saving 70 percent of that reference time earns the maximum speed score.
Combat grades remain separate. See [the fold lesson contract](docs/tasks/FOLD-LESSON-016.md).

The user limits the jam build to Acts I–III.
Act III ends after the Curvature Seed is physically collected and extracted.
The finish screen offers replay. It does not award a completed Warp Drive.
Act IV and the later repair sequence remain in the source for post-jam work.
Their existing saved records remain intact.
Player menus, transitions, and the playable package must respect the edition gate.

## Full source campaign

| Act | Structure | Source and design record |
|---|---|---|
| I | Scrolling combat, manual fire, fold fields, Klein Fleet | `src/simulation.js`, `src/campaign.js`, `src/boss.js` |
| II | Eight Klein lessons and the hybrid boss | [Act II design](ACT-II-DESIGN.md), [release index](docs/ACT-II-RELEASE-INDEX.md) |
| III | Capture, release, finite echoes, build choices, Curvature Gate | [Projective Ecology](docs/PROJECTIVE-ECOLOGY-0.22.0.md) |
| IV | Eight Bolza lessons and the Double Torus encounter | `src/hyperbolic-campaign.js`, [v0.24.1 notes](RELEASE-NOTES-v0.24.1.md) |

Acts I–III share the main simulation, campaign, and renderer.
Act IV retains a separate simulation and renderer.
The Curvature Seed unlock links the pages on one browser origin.
Act IV has its own saved checkpoint.
The bridge retains ship identity, movement and core differences, score, echoes, and equipment records.
The seven equipment operation effects remain inactive in the Bolza chart.
Each stage retains its full-hull entry rule.

## Preserved rules

- Keep Space as manual fire.
- Keep the original scrolling campaign and its movement limits.
- Keep separate Left Shift and Right Shift fold controls in the scrolling campaign.
- Keep the documented Act IV fold phase and its effect on both projectile classes.
- Keep capture and release as deliberate actions with finite resources.
- Keep boss defeat, physical pickup, and extraction as separate states.
- Bank permanent parts only after successful extraction.
- Keep save changes additive where earlier saves are supported.
- Keep Position Warp collision paths split at the jump.
- Keep live projectile identity through real boundary crossings.
- Keep future images as rendering data without independent collision objects.
- Keep sound and animation independent of damage and physics.

This import preserves the v0.24.1 control behavior.
The imported Acts use different movement frames where their geometry requires them.
The local audiovisual work must not change those movement rules.

The later campaign integration instruction supersedes the imported main-route axial control.
Acts I–III now use Left and Right steering. Up and Down have no campaign motion authority.
Forward scrolling and identified-edge transport remain active.
Act IV keeps local turn and drive controls. The repair dock keeps its circuit controls.
The Aftwing reverse-drive benefit applies in Act IV. Its main-route description must state that limit.
See [the integration contract](docs/tasks/JAM-INTEGRATION-011.md).

## Geometry and code boundaries

Flight rules belong in `src/simulation.js`.
Upgrade operations belong in `src/upgrades.js`.
Fold distance calculations belong in `src/space.js`.
Klein edge motion belongs in `src/klein.js`.
Boss combat belongs in `src/boss.js`.
Campaign sections belong in `src/campaign.js`.
The Bolza kernel belongs in `src/hyperbolic.js`.
Act IV encounters belong in `src/hyperbolic-campaign.js`.

The hybrid Klein/projective mechanic is experimental.
It is not a verified connected-sum model.
Act IV uses finite geometry steps and a depth-one collision neighborhood.
It is not a complete global shortest-path or continuous-collision solver.
Audiovisual changes do not resolve these mathematical limits.

## Audiovisual design input

The November 12 design PDF and event registry propose Structural Techno-Cosmism.
The proposal links repetition, identity, transformation, rhythm, and sparse space.
Its implementation consumes actual game events.
The current audio slice adds original arrangements and independent mix gains.
It retains the visual projectile conventions.
The implementation ledger separates completed code from proposed extensions.

The 3D prototype remains a separate reference.
It does not replace the browser renderer or the Bolza kernel.
The current candidate includes the Act IV bridge, final component, extraction, repair, and ending.
Their verification limits remain in the completion report.

## Authorized completion slice: 0.25.0-dev.1

The user authorized implementation toward a 4.5/5 review target in every Game Off category.
The target is not a measured score or an acceptance result.
Keep the four Acts and existing browser engine.

The Act III extraction stores a copied Act IV bridge with ship identity, seed, score, echoes, inventory, and equipment.
Existing earned Act IV checkpoints take precedence on resume.
Act IV retains unsupported equipment as identified metadata; it must state which effects apply in the local geometry.
Ship movement and collision-core tradeoffs continue through the bridge.
Each stage retains its full-hull entry rule.

The final boss exposes a physical Hyperbolic Core.
The player must collect it and reach the extraction beacon before banking it.
Defeat, exposure, collection, extraction, assembly, activation, and campaign completion remain separate states.
Reload before extraction restores the stage entry and does not bank the core.
The repair dock requires saved provenance for all four parts.
Old banked parts retain explicitly identified legacy provenance.

The safe repair challenge uses actual charge deliveries through fold distance, a Klein edge, and capture/release.
Key presses alone do not complete those deliveries.
Failure in the dock costs no campaign hull or stored equipment.
The ending follows successful activation and saves completion after its visible sequence.

The audio slice extends the existing Web Audio engine.
Original small arrangements give each Act an identity through rhythm, filtering, and sparse layers.
Actual combat state changes musical density; it never changes combat timing.
Master, music, effects, and ambience controls persist independently.
Critical sound priorities, bounded resources, pause, and interruption recovery are required.
Silent and reduced-motion play retain all critical visual information.
No new engine, additional campaign branch, extra ship roster, or 3D conversion is authorized by this slice.

## Current musical direction: STC study r3

The user rejected the r2 chord and melody direction after listening.
Do not treat that score as an accepted soundtrack.
The next design unit is an isolated musical and playable study.
Use a stable pulse, repeated acid sequence, interlocking percussion, and gradual timbre changes.
Use a familiar pattern, a real paired-edge crossing, and an unfamiliar prediction case.
Keep the existing campaign rules and verified release archives intact.
The study cannot award campaign progress.
Do not use music playback to schedule gameplay.
Do not present an analogy as a mathematical equivalence.
See [the task contract](docs/tasks/STC-STUDY-003.md).

## Authorized binaural revision: r5

The user selected binaural positioning for the kick, sustained hum, and repeated acid notes.
Keep deep kick energy centered. Apply HRTF processing to selected upper layers and reflections.
The drone and acid voice can move slowly around a fixed listener.
Provide a session-only speaker stereo option.
Preserve the note pattern, rhythm, instrument settings, and event-cue positions.
The piece remains a title-screen candidate in the separate study.
Other campaign textures remain a later composition task.
See [the binaural task](docs/tasks/STC-BINAURAL-004.md).

## Selected stereo and room revision: r6

The user selected the stereo take after the binaural comparison.
Keep that exact dry recording. Add a separate room return.
FoxDot must sequence the take. SuperCollider must render the room effect.
Browser playback must use the exported dry and room files with one start time.
Keep the kick low frequencies clear. Filter the room return before and after reverb.
The Room control must change only the return level.
Keep actual attack cues separate from the recorded music.
The original composition was made with Web Audio. Do not change that source record.
This revision uses installed FoxDot Patterns for a finite sample-entry pattern.
It does not use the full live FoxDot scheduler.
The room suggests a large interior. It does not implement an in-world sound source.
No campaign rule, collision path, or music-driven attack timing changes.
See [the room task](docs/tasks/STC-ROOM-005.md).

## Bass fade and lower room: r7

The user requested a smooth ear-to-ear bass fade and less reverb.
Keep the repeated acid phrase and the existing rhythm.
Move only the upper part of the separate acid direct signal.
Keep its low part, the kick body, and the offbeat sub centered.
Retain the original stereo routing of other drum layers.
Use a four-bar left-to-right-to-left cycle at 134 BPM.
Use FoxDot for the pan sequence and SuperCollider for the render.
Reduce the default room return from 0.30 to 0.12.
Keep the previous room timing for comparison.
The required source separation bypasses the old shared compressor.
Label this as a new mix. Keep the r6 take and archives intact.
The stereo fade adds no HRTF, pitch offset, or gameplay timing change.
See [the bass task](docs/tasks/STC-BASS-006.md).

## Four-Act music collection

The user accepted the title-theme direction and requested four tracks for each Act.
Use 1-, 2-, 4-, and 6-minute tracks to test the expanded musical vocabulary.
Compose new notes and structures with FoxDot. Render original instruments with SuperCollider.
Keep the driving pulse, independent atmosphere, and restrained room as shared standards.
Test motif order, harmonic persistence, and recovery through distinct pieces.
Keep the music collection in a separate listening page until its campaign use is selected.
The listening page must not change combat, progression, or campaign audio settings.
Keep the r7 title study and previous release archives intact.
See [the music collection task](docs/tasks/STC-ACT-LIBRARY-007.md).

## Operator laboratory

Keep the operator study separate from campaign simulation and saved progression.
Compare mechanical response, transient growth, and operation order through controlled models.
Use the actual Klein and Projective Module kernels for the boundary examples.
Keep channel projection, topology forecasts, and combat collision identities separate.
Use one source and matched gain for each sound pair.
Include a constant-gain control that commutes with the fixed linear room response.
Record the first prediction before feedback. Record assistance with that prediction.
Keep human recognition claims separate from technical outputs.
See [the operator task](docs/tasks/STC-OPERATOR-008.md) and [the grammar](docs/OPERATOR-AV-GRAMMAR-v2.md).

## Identified Return r8

Use the retained r7 stereo mix as the foundation for the new title-track review.
Keep its pulse, acid phrase, stereo movement, and reduced room relationship.
Add Fm7 voicing persistence, sparse bounded percussion responses, and ordered room processing on the new harmony.
Keep this as a separate music review candidate until listening selects its campaign use.
See [the track contract](docs/tasks/STC-TRACK-009.md).
