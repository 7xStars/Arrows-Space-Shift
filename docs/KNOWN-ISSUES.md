# Arrow Space Shift issue register

Current candidate: `0.25.1-dev.5`. Date: November 13, 2026.
See [the three-Act report](COMPLETION-QA-v0.25.1-dev.5.md) for the current change.
The earlier campaign acceptance evidence remains in the preceding reports.

| ID | Current status | Remaining work or evidence |
|---|---|---|
| QA-TEXT-01 | Repaired | Curvature Seed pickup names the correct part. |
| QA-AV-01 | Repaired in the tested interruption | Space resumes the same suspended context. Device and listening acceptance remain open. |
| QA-AV-02 | Repaired in the reproduced Forge interruption | The old folded Act III route reached a choice that stopped both sources. The repaired choice retains the pair and clock. Resume keeps the current Act. Recovery retains a quiet beat. The exact unfold-only report is not fully reproduced. Human listening remains open. |
| QA-AV-03 | Title startup and speaker control repaired | Entry requests music immediately and preloads its buffer. Permitted autoplay and blocked first-action recovery have separate browser checks. Saved mute remains active. Browser policy can still require an action before sound. |
| Act III compact echo status | Moved into the visible HUD | The former normal-flow panel could remain below the viewport. The counter and installed evolution text now use the measured HUD area. Human comprehension remains separate from layout checks. |
| Progress transfer | Implemented with recovery protection | Full export includes checkpoints, repair, and settings. Invalid records are rejected. Failed writes retain recovery data. Legacy fleet-only imports remain readable. |
| ASS-014 | Active join reset repaired; readability review remains | The first warning deadline stays fixed. Later recovery cannot disarm the active join. Broader player prediction remains unverified. The hybrid remains experimental. |
| ASS-015 | Broad encounter fairness remains unverified | Normal-action pilots establish specific paths, not fairness for all seeds and conditions. |
| ASS-016 | Produced campaign music integrated | The jam uses three Act recordings and title r9. Flight recovery keeps a quiet beat. The user confirmed title, campaign music, and firing sounds in the current browser. Musical acceptance and physical-device coverage remain separate. |
| Music catalog | Local discography preserved | 26 compositions total 71:16.64. Four recordings serve the jam. Six pieces are post-jam studies; sixteen remain review candidates. Earlier mixes and stems do not increase the count. |
| ASS-017 | Duplicate pickup balance remains unverified | Observe score and bounded hull repair in normal play. |
| ASS-018 | Human comprehension remains unverified | Test unfamiliar live/forecast and crossing cases with players. |
| ASS-019 | Separate publication checks required | Verify the public repository commit and hosted game independently. A source push does not update the itch.io playable file. The release report records actual publication results. |
| ASS-020 | Deferred with Act IV | The retained source has bounded sweep and depth-one quotient limits. Act IV is hidden and excluded from the current jam PLAY archive. |
| ASS-021 | Three-Act scope checked | The jam ends after physical Act III reward extraction. Completion, replay, saved checkpoint precedence, and hidden later entries have browser checks. Later records remain intact. |
| ASS-022 | Repaired in source, design record, and tests | Main scrolling Acts ignore Up and Down. Left and Right steer. Forward scrolling and seam transport remain. Act IV retains its local drive. |
| Release provenance and license | Open before publication | Document the reported earlier work. No source license was selected. |
| Narrow title actions | Repaired at the tested CSS viewports | Begin and Stop remain clear at 320×568, 390×844, 640×450, 1280×900, and RTL320. The separate CSS `zoom:2` probe still clips actions. Native browser zoom is unverified. |
| Git publication access | Local owner access verified | The connector remains read-only. Local owner credentials can update the repository. Final publication still requires a verified remote commit. |

The jam edition now ends at Act III. Later source content is reserved for post-jam work.
The final core, physical collection, extraction, assembly, safe activation challenge, and persistent ending remain in the full source.
Ordinary-input browser fixtures verify the new final sequence.
The fresh-profile linked browser path completed through normal progress import after one controller timeout.
Complete human play remains separate from that browser and simulation evidence.
No category is assigned 4.5/5 from technical results.

## Historical 0.24.2-dev.1 record

The entries below describe the earlier candidate. The table above gives the current status.

**Local update — November 12, 2026.**
Act IV now shares saved audiovisual preferences and the existing audio engine.
P can pause and resume play.
Stage-entry score, echoes, and seed persist for retry and reload.
Older saves retain their latest score. Earlier stage-entry resources cannot be recovered from those saves.
The normal launcher uses a stable port for browser saves.
The complete Act III to Act IV ship and equipment handoff remains open.
The final physical component, repair challenge, and persistent ending remain absent.
See [the local QA report](AV-QA-REPORT.md) for executed checks and limits.

**November 13 assessment.**
Fresh checks passed 165 automated tests and 32 browser checks.
The full campaign and audible mix remain unverified.
See [the current verification report](../reports/review-2026-11-13/verification.md).

**QA-AV-01 — Audio recovery after interruption. CONFIRMED; OPEN.**
A controlled browser probe suspended Act IV's AudioContext during play.
Manual fire did not resume it. Pause and resume recovered the same context.
Repair user-action recovery without restarting the flight or adding another context.
The frequency of real device interruptions is unknown.

**QA-TEXT-01 — Wrong Curvature Seed pickup message. CONFIRMED; OPEN.**
The Curvature Seed pickup uses the Klein Relay text in `src/boss.js`.
A targeted pickup fixture reproduced the message.
Check all existing boss-part names after the repair.

**Progress export coverage. FLEET ONLY.**
The current export omits the main checkpoint and Act IV stage checkpoint.
It cannot transfer all progress to another browser origin.
Clarify the interface label or define a complete transfer format.

**TRANSITION-001 — Level clear appears frozen. FIXED IN THIS CANDIDATE.**
The `updateCampaignUI()` results panel referenced a `pace` variable only defined
within `updateUI()`, throwing a `ReferenceError` on level clear. v0.23.7 defines
its own local pace snapshot, preserving the 2.8-second automatic handoff.
Chromium DOM/animation-frame smoke tests verify Level 1→2, Act II 9→10 and
Act III 18→19 with no runtime exceptions. An older running local server can
still serve an old build; use the exact freshly printed launcher URL.

**ASS-014 — Hybrid join predictability. PARTIALLY ADDRESSED; STILL BLOCKING RELEASE.**
The Act II hybrid boss now announces a 2.2-second projective arming interval
while the player's Klein top/bottom rule remains active; the display and actual
geometry switch together after the warning. Predicted crossings show rule,
approximate time, and exit lane. The rectangular hybrid geometry remains an
experimental game mechanic, NOT a mathematically established K#RP^2 connected
sum. Real player perception and unintended jumps need end-to-end testing.

**ASS-015 — Safe responses to layered attacks. UNVERIFIED.**
Scripted recovery intervals clear hostile shots and avoid spawning surprise
attackers; windups and attack definitions have automated tests. The bounded
Act II diagnostic in `ACT-II-THREAT-AUDIT-v0.23.7.json` samples instantaneous
horizontal separation with a headless renderer-presentation proxy. It found
one zero-local-lane sample at Klein Mastery (of 80 observed time points for
Arrow) but does not establish unavoidable damage. Vertical motion, seam joins,
continuous reachability, player skill, ordinary-health play, and other seeds
are not covered. Playtest all four ships and document any unavoidable hit.

**ASS-016 — Music and sound. DEFERRED AT USER REQUEST.**
Audio quality, mix and musical composition will be addressed separately later.
This release makes no new music changes.

**ASS-017 — Duplicate loot. IMPROVED IN ACT II; BALANCE UNVERIFIED.**
Act II duplicates still award 35 score each. Two collected duplicates now
can provide one hull-point field patch when below max health, once per stage.
No effect on Act I loot; Act III echoes retain the two-per-stage limit. Test
whether this encourages useful pickups without overpowering the campaign.

**ASS-018 — First-time comprehension. AWAITING HUMAN TESTS.**
Tutorial, geometry cues, guide and local questionnaire exist. No independent
blind-playtest evidence is available. Use the playtest checklist and do not
claim the comprehension criterion has passed from code inspection alone.

**ASS-019 — Existing ChatGPT Sites deployment. NOT COMPLETED.**
v0.23.7 is a local/itch development candidate. The existing live Site has not
been updated. Do not replace the live project with an older reconstructed
source without an explicit merge and regression pass.

**ASS-020 — Hyperbolic Act IV collision/performance acceptance. DEVELOPMENT CANDIDATE.**
The nine-encounter field campaign uses a genus-two Bolza kernel and finite geodesic transport. Collision proximity checks the home chart plus eight adjacent lifts. It can miss or falsely assign seam or corner interactions. Their frequency is unverified. Automated tests cover direct seams but do not prove fairness under all combat states. Local headless Edge checks now cover a live crossing, fold input, settings, pause, and compact layouts. Complete encounter play and physical-device performance remain unverified.

**ASS-021 — Unified end-to-end campaign handoff. PARTIAL.**
The Curvature Seed unlocks the Act IV page on the same browser origin, and Act IV preserves a separate checkpoint. The hyperbolic campaign is not integrated into the legacy scrolling/camera/ship-loadout renderer. No v0.25.x repair, final drive component, 3D assets or persistent ending are shipped.
