# r8 listening page

The page supplies one player for a music comparison.
It keeps the established black space and warm text colors.
It uses no new game controls or saved settings.

## Design plan

| Token | Value and use |
|---|---|
| Space | `#030709`, page background |
| Surface | `#0b1418`, player background |
| Text | `#eee5ce`, primary text |
| Secondary | `#c1cdc4`, supporting text |
| Focus | `#efce87`, links and keyboard focus |
| Edge | `#49625c`, structural boundaries |

Use the project's system font for instructions.
Use the existing monospace font only for time values.
Keep the title, track selection, player, and comparison times in one reading order.
Place direct WAV downloads after the player.
Use a compact table for the three musical changes.
Keep all controls in the normal document flow.
Do not add automatic visual motion or audio playback.

```text
Title and short purpose
Track selection
One native audio player
Harmony / Break / Return controls
Direct WAV downloads
Three musical changes and listening limits
```

## Brief review

The black background and warm accents come from the existing game.
They are not a new visual direction.
The page uses the actual track and its existing musical sections.
It does not require a decorative geometry display, animation, or new external font.
The main decision is the audible comparison.
The interface must keep that decision easy to repeat.

## Verification limits

Use native controls, explicit labels, and keyboard focus.
Retain source selection and downloads at a width of 320 pixels.
Pause the single player before replacing its source.
Pause it when the page becomes hidden.
Keep campaign storage unchanged.
Do not claim screen-reader or physical-device acceptance from a browser script.
