# Arrow Space Shift interface audit

Historical record. Version 0.12 uses only sideways movement and one viewport.
See [the current release record](../reports/RELEASE-0.12.md).

Date: November 4, 2026.
Base: local version 0.10.0.
Target: local version 0.11.0.
Mode: audit and implementation, as requested.
There is no Git revision for either candidate.

## 1. Executive assessment

The game now starts with Level 0 for movement and firing.
The main game screen contains the mission, live status, flight field, and action reminders.
Equipment, Guide, and Options open panels that pause play.
Detailed rules remain available before the player resumes.

The main confirmed problems were separated combat information and reset actions without a confirmation.
Both were corrected in the inspected flow.
The requested tutorial was absent from the base and is now implemented.

This audit covers a new player's entry, tutorial completion, combat status, equipment changes, and section recovery.
It also covers representative narrow layouts and the existing prototype controls.
The inferred audience is a sighted player with a keyboard and no prior knowledge of the upgrades.
English is the only inspected language.
The person's task is to control the ship, understand the current operation, and continue the campaign.
Jam submission and publication goals do not determine that task.

The base evidence includes the source inspected before editing and an existing version 0.10 capture.
Target evidence includes source, rendered captures, automated runtime interactions, and calculated contrast ratios.
No participant research was performed.
No screenshot establishes gaze order or comprehension.
The information hierarchy below is a design hypothesis.

The supplied successive-read heuristic guided attention and access.
The five-axis method is the user's synthesis.
This report does not attribute that full method to Zach Gage.

## 2. Five-axis decision contract

| Axis | Decision contract |
|---|---|
| Constituents | Preserve the ship, enemies, asteroids, shots, folds, facing, seed identity, equipment order, hull, score, stored damage, route, and section checkpoint. Distinguish a seed's handedness from its current accepted side. Distinguish current hull from damage still due. |
| Operations | Observe a threat, inspect facing and accepted side, move or fire, resolve the authoritative hit, and retain its consequence. A panel pauses the game before inspection or equipment changes. Closing it does not resume combat. |
| Standards | Constraints: preserve arrow movement, separate Shift controls, visibility rules, upgrade effects, normal campaign damage, and boss edge rules. Aim: keep information needed for the next action near the flight field. Measures: runtime state, control access, layout bounds, and separate player tasks. Judgment: persistent side and damage text serves combat better than a section below the screen. |
| Invariance / Equivariance | Resizing must retain controls, complete operation names, and status access. Text can wrap and panels can scroll. Folding must update accepted-side text with the authoritative rule. Opening a panel must preserve all gameplay state while time is stopped. Retry must restore the declared checkpoint. |
| Context / Continuation | Teach movement before introducing hostile combat. Teach firing with an actual target hit. Retain detailed explanations in Guide and Equipment. Permit explicit resume after inspection. Confirm reset costs before removing progress. Preserve the current page-memory limit and disclose it. |

Relevant continuations are the next shot, equipment change, section retry, next level, and page reload.
This audit does not cover every possible campaign state.

## 3. Strengths to preserve

- Drawing and combat use the same projection function in `src/combat-view.js`.
- Enemies require renderer acknowledgment and a visible entry period before combat.
- The accepted side is calculated from the actual seed and fold state.
- Position Warp retains separate collision paths before and after its jump.
- Equipment order remains explicit: Slot 1 acts before Slot 2.
- Section checkpoints retain earlier campaign progress.
- Focus loss pauses play.
- Reduced-motion rendering already removes decorative flame variation, fold sway, asteroid rotation, expanding hit rings, and the fold flash.

These are source and runtime findings in the checked cases.
They do not establish that players understand those relationships.

## 4. Information hierarchy

| Decision / state | Information needed | Cue and access route | When needed | Retained explanation |
|---|---|---|---|---|
| Start a campaign | Required device and first task | Start screen names the keyboard and Level 0 | Before Start | Guide retains controls |
| Move in Level 0 | Which directions remain | In-field prompt lists each arrow and completion text | During movement | Completed items remain marked until firing starts |
| Fire in Level 0 | Target, facing direction, fire input | Named target, ship orientation, and persistent direction prompt | Before the shot | Guide retains Up/Down and Space rules |
| Respond in combat | Threat position, hull, facing, accepted side | Flight field, hull display, and status directly above the field | Before the next action | Equipment retains exact operation rules |
| Fold or unfold | Current fold count, local factor, control, tradeoff | Live status and separate Shift key reminders | Before pressing Shift | Guide retains the field list, metric, and score rule |
| Handle stored damage | Amount still due | Persistent Stored damage text | Before its consequence and next action | Equipment retains the delay explanation |
| Change equipment | Collected seed, selected slot, equipped seed, order | Equipment button opens a paused panel with selected-state text | Before resuming | Inventory and slots retain the selection |
| Retry or clear campaign | Which progress will be removed | Options, consequence text, and confirmation | Before reset | Cancel keeps the existing state |
| Continue after inspection | Whether time is running | Paused overlay and Resume action | After closing a panel | Pause state remains until deliberate resume |

Proposed attention order is the current task and flight field, then live status, then exact rules on demand.
It is not a measured gaze sequence.
No fixed reading time is assumed.
Spectator understanding was not tested.
A recording can show live status but cannot open the panels.

## 5. Coverage

| Journey / state / transformation | Evidence inspected | Check and result | Remaining limit |
|---|---|---|---|
| Base Quiet Belt screen | Version 0.10 source and `reports/ui-before.png` | Confirmed three-column layout and equipment below the flight field | Existing capture, not a participant session |
| Ready and Level 0 | `tests/tutorial.test.mjs`, interface browser suite, target captures | Actual movement in four directions unlocks a target; actual Space input completes the lesson | Does not establish learning |
| Level 1 after tutorial | Interface browser suite | Continue enters Level 1 and supplies its seed kit | Full player journey not observed |
| Equipment while running | Native dialog and browser interactions | Time stops; equipment changes; Tab stays inside; Escape closes; focus returns | Screen-reader announcements not tested |
| Cancel New run | Confirmation interaction and retained seed / section state | Cancel keeps the campaign | Browser crash and reload still clear page memory |
| Eight route exits and boss | Campaign browser suite | 55 checks passed | Route exits start near the exit; boss ending uses one-hit targets |
| Prototype consumers | Existing browser suite | 82 checks passed after menu access paths were updated | Does not establish genre balance |
| 1440 × 1000 and 1280 × 720 | Runtime bounds and captures | Main controls fit without page scrolling in checked states | Other heights not exhaustively checked |
| 390 × 844 and 320 × 740 | Runtime bounds and captures | No horizontal overflow; controls fit; two-slot campaign text wraps at 320 px | Keyboard still required; not a touch playtest |
| 720 × 500 | Runtime bounds | No horizontal overflow; Guide fits and scrolls | Reduced window space, not an actual browser zoom test; page can scroll vertically |
| Six live text pairs | Computed opaque colors and WCAG luminance formula | Ratios range from 8.95:1 to 16.18:1 | Not every color pair or state was measured |
| Reduced motion | Source branches and browser preference | Decorative motion branches use the preference; core gameplay motion remains | No human motion-sensitivity assessment |
| Failure and recovery | Existing loss checks, confirmation, retry, pause | Section retry and explicit resume remain available | No persistent save system |

The relevant [WCAG 2.2 reference](https://www.w3.org/TR/WCAG22/) distinguishes text contrast, visible focus, and reflow.
It also permits exceptions for content that needs a two-dimensional layout, including games.
This audit does not claim blanket WCAG conformity.
Screen-reader play, actual 200% browser zoom, localization, controller input, and physical-device audio were not verified.

Domain coverage:

| Domain | Evidence | Result |
|---|---|---|
| Accessibility | Native buttons and dialogs; keyboard interactions; focus outline; source motion branches | Inspected paths pass; nonvisual gameplay and screen readers remain unverified |
| Layout | Base and target captures; window bounds; two-slot status | Main screen and panel changes verified at named sizes |
| Writing | Mission, control, tutorial, reset, and resume text | Current action and reset consequence are explicit; full STE dictionary review incomplete |
| Typography | Existing system fonts; computed styles; wrapped target captures | Existing type family retained; small live labels remain a player-reading question |
| Color | Six computed text/background pairs in `reports/interface-contrast.json` | All six exceed 4.5:1; no global contrast claim |
| UI polish | Existing palette and surfaces; dialog states; reduced-motion source | Established style retained; no complete motion playback review |

## 6. Prioritized findings

| ID / priority / evidence | Location and affected task | Observation, mechanism, and consequence | Revision and preservation | Acceptance and result |
|---|---|---|---|---|
| F1 / High / Confirmed problem in base; corrected | Version 0.10 `src/app.js`, New run handler; player retaining campaign progress | The button replaced the current campaign immediately. The operation removed page-memory progress without a confirmation. An accidental selection had no recovery route. | Move reset controls to Options. State the loss. Ask for confirmation. Cancel retains the campaign. Preserve the existing checkpoint and new-layout rules. Axes: Operations, Standards, Continuation. | Cancel must retain the run seed and section. Confirmed by browser interaction. Confirmed resets also pass the campaign suite. |
| F2 / Medium / Confirmed problem against requested scope; corrected | Base Quiet Belt image, right panel and sections below the canvas; player inspecting combat state | The detailed fold state, equipment, and stored damage were outside the flight field. Equipment and debt could require page scrolling. That access route competes with a timed combat decision. It does not prove that a player missed the information. | Keep accepted side, fold count, local factor, and stored damage in the main screen. Put exact rules and equipment in named paused panels. Preserve seed identity, order, counts, costs, and explanations. Axes: Constituents, Operations, Continuation. | Main controls must fit at named sizes. Two operation names must remain available at 320 px. Time must stop before panel use. These checks passed. Reduced player errors remain unverified. |
| F3 / Medium / Required but absent in base; corrected | Version 0.10 `src/campaign.js` began with Level 1; new-player movement and firing | The base had control text but no requested Level 0. Instructions alone did not confirm that an action had occurred. This was a missing requested feature, not proof that a tutorial was previously necessary. | Add Level 0 before the existing eight routes. Confirm actual movement and a successful target hit. Use no incoming fire or deadline. Preserve the campaign rules in Levels 1–8. Axes: Operations, Standards, Continuation. | Movement must unlock the target. Firing without a hit must not complete the lesson. Retry must reset lesson progress. Node and real-key browser checks passed. Transfer of learning remains unverified. |

The broader screen changes are a coordinated revision.
No causal claim is made for one spacing, color, or text change alone.

Implementation references: `src/interface.js:1`, `src/app.js:269`, `src/campaign.js:16`, `src/campaign.js:78`, and `style.css:37`.

Open hypotheses:

- U1: The larger flight field may change target detection and experienced difficulty. The rules and distance calculation remain, but screen geometry changes. Compare actual encounters before treating the revision as difficulty-neutral.
- U2: Small status text may still be hard to inspect during dense combat. Test reading under play conditions before increasing every label.
- U3: Level 0 may support basic control use without teaching transfer to combat. Ask a new player to hit an off-center target in Level 1 without coaching.

These are investigation priorities, not confirmed defects.
No optional feature expansion is required by this audit.

## 7. Preservation ledger and visual evidence

| Distinction | Dependent action | Change and replacement | Available in time? | Evidence / limit |
|---|---|---|---|---|
| Local factor versus total fold count | Know whether the ship is inside a field | Retain both in live status; keep detailed field positions in Guide | Live values immediate; inspection pauses play | Runtime text and source; comprehension unknown |
| Seed handedness versus accepted side | Choose an operation for an incoming shot | Keep full name and current accepted side in the live line; retain inventory identity | Before action and after a fold | Existing side-rule checks pass |
| Duplicate player-operation labels near the ship | Associate an operation with its accepted side | On canvases at most 500 px wide, retain the side markers and full live status; omit duplicate local text that overlaps nearby entry labels | Live line remains above the field; Equipment retains slot order | Compact capture reviewed; player association remains untested |
| Slot 1 versus Slot 2 | Control operation order | Keep selected slots and complete names in Equipment | Before resume | Paused changes and narrow layout checked |
| Hull now versus stored damage | Anticipate a retained consequence | Keep hull in the field and stored damage above it | During play | Calculated from separate state fields; recognition unknown |
| General controls versus advanced explanations | Learn input, then inspect exact rules | Level 0 and key reminders remain visible; Guide retains controls and details | Before launch or during paused inspection | Real input and dialog checks pass |
| Current section versus completed sections | Decide whether to retry | Confirmation states the reset boundary | Before commitment | Retry and cancel checks pass |
| Campaign progress versus saved progress | Decide whether to close or reload | Options states that reload clears progress | Inspectable before closing the page | No persistent save was added |

No consequential rule was removed to make the screen cleaner.
Panel opening now pauses play, which changes the time available for inspection.
This is an explicit interaction change and must be included in balance observations.
The Level 0 target is a training exception: it cannot cause contact damage.
Normal damage remains active in Levels 1–8.

All images below are actual browser captures.
They are unannotated and uncropped.
The base and target Quiet Belt layouts use different generated runs.
Their enemy positions are not a matched mechanical comparison.

- [Base Quiet Belt](../reports/ui-before.png): supports F2's layout observation, not a comprehension claim.
- [Target flight screen](../reports/ui-flight.png): shows live status and the flight field in one screen.
- [Target Level 0](../reports/ui-tutorial.png): shows the named target and current firing instruction; it does not prove learning.
- [Target two-slot screen at 320 px](../reports/ui-two-slots-compact.png): supports the wrapping check; it is not a phone-input test.

## 8. Verification and revision plan

Completed:

1. Inspect the base screen and the relevant source.
2. Consolidate live information without removing exact rules.
3. Add paused native panels and reset confirmations.
4. Add Level 0 and test the actual movement and hit conditions.
5. Check the existing route, upgrade, and boss behavior.
6. Inspect target captures and named window sizes.

Executed commands:

```powershell
npm test
node tools/browser-check.mjs
node tools/campaign-browser-check.mjs
node tools/interface-browser-check.mjs
```

Results: 122 Node checks, 82 existing browser checks, 55 campaign browser checks, and 36 interface browser checks passed.
No runtime error was recorded by those browser suites.
See [the verification report](../reports/VERIFICATION.md) for scope limits.

Proposed player tasks, not yet run:

1. Ask a new keyboard player to start the game and reach Level 1 without coaching. Record assistance, wrong inputs, and the explanation of firing direction.
2. Ask that player to hit an off-center target. Before collecting evidence, require a successful alignment and an explanation of Up/Down facing as the acceptance condition.
3. In a defined encounter, ask the player which side the equipped seed accepts and what a fold will change. Require a correct explanation before the next attempt.
4. Ask the player to inspect equipment, close the panel, and continue. Record whether the pause state is understood and whether play resumes deliberately.
5. Ask what Retry and New run remove before confirming either action. Require the declared checkpoint boundary to be understood.

Use the same encounter rules when comparing layouts.
Record prior exposure and order.
Do not infer an improvement percentage from these tasks.

Verdict: Approve the implemented entry, panel, and layout paths within the inspected scope.
Human comprehension, full-route difficulty, nonvisual gameplay, and actual zoom behavior remain unverified.

Full ASD-STE100 conformity is not claimed.
The official Issue 9 PDF returned HTTP 403 during this turn.
A complete dictionary and editorial review remains unperformed.
