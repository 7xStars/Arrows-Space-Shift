# Arrow Space Shift 0.13.0

Historical record. See [the pixel-art candidate](RELEASE-0.14.md).

This is a technical upload candidate.
Music and art production remain incomplete.
See [the pipeline status](PIPELINE-STATUS.md).

## Changed behavior

Living enemies in Levels 1–8 return at the top after leaving the bottom.
They retain their identity, remaining hull, equipment, and firing clock.
A return does not award points or drop a seed.
The renderer must show the returned enemy before its new 0.65-second entry period starts.
An enemy cannot fire or receive damage during that entry period.

Stage 7 enemies now use Klein bottle edge paths.
Side crossings reverse vertical position and vertical drift.
Top and bottom crossings retain horizontal position and drift.
Future carriers enter through the scrolling route before these map rules apply.
The route still ends at its exit.

| Stage 7 setting | Earlier value | New value |
|---|---:|---:|
| Lateral drift magnitude | 45 | 150 |
| Vertical drift magnitude before scrolling | 30 | 140 |
| Firing interval | 2.3–2.7 s | 0.9–1.1 s |
| Shot speed | 145 | 210 |

These values need a human difficulty test.
Stage 7 applies the map to enemies.
The final boss retains its existing map for ships and projectiles.
No manual forward or backward control was added.
No music or imported art was created during this repair.

## Verification

131 Node checks passed.
The browser suites passed 82 existing checks, 55 campaign checks, 37 interface checks, 21 enemy-return checks, and 18 extracted-ZIP checks.
The edge cases use prepared fixtures.
They check health retention, side reversal, top/bottom return, new entry, and collision safety.
They do not establish full-level balance or player recognition.

Captures: [Stage 7 flight](stage-seven-flight.png), [side return](stage-seven-side-return.png), [bottom return](enemy-bottom-return.png).
These are actual browser captures.
The return captures use prepared edge states.

## Upload artifact

[ZIP](../dist/itch/0.13.0/arrow-space-shift-0.13.0-itch.zip).
Size: 44,783 bytes.
SHA-256: `e10ca5250f617a374c517e7e1c14385e6bb220140946369cb2041a038083690a`.
The extracted package passed the local iframe checks.
It was not uploaded or submitted.
No source license or public repository was created.

Full ASD-STE100 conformity is not claimed.
A complete dictionary and editorial review remains unperformed.
