# Arrow Space Shift: asset and notice register

Scope: 0.14.0 browser candidate.
This record documents provenance and open decisions.
It does not certify rights clearance.
The game's source license remains undecided.

| ID | Material | Source / use | Shipped? | Evidence and status | Owner / next action |
|---|---|---|---|---|---|
| ART-001 | Crossing pixel sprites | AI-assisted native masks authored in this project from the user's visual brief | Yes, PNGs and atlas | Source, PNG exports, hashes, and manifest exist. Exact palette and alpha checks run separately. No exclusive copyright claim is made. | Project owner: select the project's publication terms. |
| REF-001 | User image reference | User-supplied sheet, copied to `art/references/user-crossing-reference.png` for local review | No | Used for inspiration. Ownership and reuse rights were not independently verified. No crop enters the runtime. | Project owner: verify permission before distributing this reference. |
| REF-002 | Generated concept draft | Built-in image_gen, November 4, 2026; prompt and file in `art/GENERATION-RECORD.md` | No | Concept reference only. It is not the runtime atlas. No output-rights opinion was made. | Project owner: review applicable terms if publishing the draft. |
| CODE-001 | Game and pixel exporter | Project code using browser and Node built-ins | Runtime code only | No third-party runtime package is declared. Source license not selected. | Project owner: select a source license before public source publication. |
| AUDIO-001 | Browser tones | Oscillator code in the game | Yes | No third-party sample or music file enters the package. Authored music and combat SFX remain incomplete. | Audio production: supply the planned cue handoff. |

The browser package includes `NOTICE.txt`.
Guide includes the AI-assisted art and code disclosure.
The page-description draft includes the disclosure too.
The art source and reference sheets remain outside the browser ZIP.
No Aseprite, PixelLab, or Blender license was acquired or used for this task.
