# Workspace index

Date: November 12, 2026.
Main local folder: `D:\Projects\games\game-off-2026`.
Keep this game separate from Lamirys and `D:\Projects\game_jam`.

## Active project

The root source comes from `Arrow-Space-Shift-v0.24.1-SOURCE.zip` in Downloads.
The local development version is `0.24.2-dev.1`.
The root `index.html` starts the main game.
The root `hyperbolic-act.html` starts the separate Act IV page.
The root `hyperbolic-lab.html` contains the geometry research view.

Use the root source for new work.
Use the imported and archived copies to compare earlier behavior.
Do not copy an older package over the active source without a comparison.

## Imported Downloads

Import folder: `imports/downloads-2026-11-12/`.

| Path below the import folder | Contents |
|---|---|
| `files/` | 22 original files, including source ZIPs, play ZIPs, art sheet, design PDF, JSON registry, and 3D prototype ZIP |
| `extracted/` | 9 related folders copied from Downloads |
| `file-manifest.json` | Source path, destination path, byte count, and SHA-256 value for each imported file |

The import contains 1,457 files across 31 matched files or folders.
Each copied file was checked against its source hash.
The Downloads originals remain in place.
The search matched Arrow Space Shift names and `ASS_STC_AV_` names.
The import does not claim to identify unrelated files with unknown names.

Important files in `files/`:

- `Arrow-Space-Shift-v0.24.1-SOURCE.zip`: source baseline.
- `Arrow-Space-Shift-v0.24.1-PLAY.zip`: original playable package.
- `Arrow_Space_Shift_Structural_Techno_Cosmism_Design_Bible_v1.pdf`: November 12 design proposal.
- `ASS_STC_AV_Grammar_Registry_v1.json`: proposed event families and invariants.
- `Arrow_Space_Shift_3D_Prototype.zip`: separate prototype reference.

Earlier packages range from v0.14.0 through v0.23.7.
Their source and play identities remain in the filenames.

## Previous workspace

Archive folder: `archive/workspace-v0.15.0-20261112/`.
The archive retains 636 previous workspace files.
The file hashes were checked after the move.
The archive includes the uncommitted source, assets, tests, art masters, reports, and marketing files.

- `file-manifest.json` records the file hashes.
- `git-status-before.txt` records the earlier Git status.
- `working-changes.patch` records the earlier tracked-file differences.
- `DESIGN.md` retains the previous design contract.
- `art/source/` retains the previous pixel masters.

The existing `.git` folder remains at the project root.
This update did not create a commit or push changes.

## Evidence and output

The [implementation ledger](IMPLEMENTATION-LEDGER.md) lists changes and remaining work.
The [AV QA report](AV-QA-REPORT.md) records the checks and their limits.
The [known-issues register](KNOWN-ISSUES.md) retains the imported release risks.
Local build output goes to `releases/0.24.2-dev.1/`.

The active source archive does not need duplicate historical packages to run.
The full historical collection remains in this workspace.
Check the release manifests before distributing a build.
