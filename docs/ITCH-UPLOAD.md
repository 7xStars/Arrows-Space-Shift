# itch.io upload preparation

This is a local upload candidate.
It has not been uploaded or submitted.

## Package

Run `npm run package:itch`.
The ZIP is written to `dist/itch/0.14.0/arrow-space-shift-0.14.0-itch.zip`.
The archive has `index.html` at its root.
It includes runtime JavaScript, CSS, pixel PNGs, the sprite manifest, and the notice.
It excludes tests, reports, development tools, and earlier prototype pages.
The public candidate does not expose the test interface through `?test=1`.

## Page settings

1. Set the project kind to HTML.
2. Upload the ZIP as a browser-playable file.
3. Use a 960 × 720 embed as the initial desktop setting.
4. Enable the fullscreen button.
5. Keep Click to Play enabled.
6. Keep iframe scrollbars disabled.
7. Do not mark the game as mobile-friendly. It requires a keyboard.
8. Copy the prepared text from [ITCH-DESCRIPTION.md](ITCH-DESCRIPTION.md).
9. Preview the draft page before publication.

The game sizes its viewport to the iframe.
An alternative is itch.io's fullscreen launch mode.
The [official HTML5 upload guide](https://itch.io/docs/creators/html5) explains ZIP layout, embedding, and fullscreen settings.

## Competition state

The [Game Off 2026 page](https://itch.io/jam/game-off-2026) requires a public GitHub source repository and an itch.io submission.
It gives the source deadline as December 1, 2026, at 13:37 PST.
The source repository is [7xStars/arrow-space-shift](https://github.com/7xStars/arrow-space-shift).
Use that URL in the jam's GitHub repository field.
No itch.io upload or jam submission has been performed.
The source license remains undecided.
The package and description include the AI disclosure.

Local archive checks do not establish that the hosted iframe works.
On the draft itch.io page, check keyboard focus, both Shift keys, fullscreen, sound startup, pause after focus loss, and a section retry.
