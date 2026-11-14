# Main title and dialog layout

The check used the `better-layout` skill.
It inspected the actual local title page in headless Microsoft Edge.
It did not change game files.

## Keep controls distinct from content

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| HIGH | `style.css:4`, ready overlay | At 320×568, Begin extends from y542 to588. Stop music is covered by the flight controls. At 640×450, the flight controls cover both title actions. | Coordinator repair required. | The first action must be visible and available. |

The title overlay can scroll when the browser moves focus to an action.
Trial click therefore recovered each action.
That automatic recovery does not establish a clear initial screen.
The initial title has no visible instruction to scroll.

The ready brief has a 7vh top margin in the narrow layout.
The dock and overlay padding already use much of the short viewport.
At 320×568, the brief occupies y246 through642.
At 640×450, it occupies y209 through483.
The fixed flight-control bar has higher visual priority than the title actions.
At 320 px, the two title buttons also wrap into separate rows.
Their combined width is 294.84 px in a 292 px brief.

## Verified scope

| CSS viewport | Title controls | Options and Guide |
|---|---|---|
| 320×568 | Clipped or covered on first view | All controls reachable by dialog scroll |
| 390×844 | All four measured controls fit | All controls reachable by dialog scroll |
| 640×450 | Both title actions covered on first view | All controls reachable by dialog scroll |
| 1280×900 | All four measured controls fit | All controls reachable by dialog scroll |

The check measured Begin, Stop music, Options, and Guide.
It checked 17 Options controls and five Guide controls at each size.
Both dialogs fit horizontally at all four sizes.
The dialogs use vertical scrolling for their content.
No page exception occurred.

Command: `node reports/title-layout/check.mjs . reports/title-layout/current`.
The detailed bounds are in `current/results.json`.
The image names include their state and CSS viewport.
The required narrow image is `current/title-320x568.png`.

This is a CSS viewport check.
Physical mobile devices, touch hardware, browser keyboard overlays,
200 percent zoom, translation, and RTL were not verified.
The scope does not include a human comprehension test.

Block until the two short-view title defects are repaired and checked again.
