# Arrow Space Shift 0.25.1-dev.4

The title requests music as soon as its entry screen loads.
It no longer waits for the ship artwork to load.
The title buffer loads while the browser waits for audio permission.
When automatic sound is permitted, playback starts without a click.
When automatic sound is blocked, the first permitted click or key press starts it.
The game does not change browser permissions.

The title music text button is removed.
A speaker button sits in the lower-left corner of the main game view.
Its wave and cross shapes show whether sound is enabled.
The button has a 44-pixel target, a keyboard action, a description, and a focus ring.
It controls the existing global sound preference.
The separate music switch remains in Options.
Sound mute persists after reload.

The first speaker action can enable a blocked context.
A context change between pointer press and click cannot turn that action into Mute.
The control stays available during flight and manual pause.
The previous Forge music repair remains active.

The compact layout keeps the speaker clear of flight actions and the saved-game hint.
Act III echo status now sits in the visible HUD.
Its existing position outside the viewport could hide that information on small screens.
The control row retains complete key labels.

No music master, simulation rule, topology rule, reward, or save format was changed.
See `docs/COMPLETION-QA-v0.25.1-dev.4.md` for checks and limits.
Earlier release archives remain preserved.
No repository, Site, or itch.io publication occurred.
