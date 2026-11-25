# Arrow Space Shift in Godot

Open `project.godot` with Godot 4.7.2.
Wait for Godot to import the assets.
Press F5 to play Acts I–III.
The renderer uses Compatibility mode.

## Flight controls

Use Left Arrow, Home, or number pad 4 to move left.
Use Right Arrow, End, or number pad 6 to move right.
Use the left and right Shift keys to fold space on their respective sides.
The Web build prevents the flight keys from scrolling the page while the game has focus.

## Flight results

The result screen shows your score when you lose your ship or finish the campaign.
A gold trace shows your progress through the campaign.
Reduce Motion shows the full trace immediately.

Open Leaderboard in the toolbar to view the ten best campaign records saved by this game installation or browser.
A retry can improve its campaign record.
Practice, imported checkpoints, and partial Act III replays show a score without a rank.

## Export and test

Install the Godot 4.7.2 export templates before export.
For Web export, select the matching templates for single-thread operation in the Web preset.
The preset uses relative output paths.

Run the commands below from the repository root after asset import.
The leaderboard test writes save data. Run it with a disposable application data directory.
On Windows, set APPDATA to an empty temporary directory in the test shell.
On Linux, set XDG_DATA_HOME to an empty temporary directory in the test shell.
Use absolute paths for the test reports.
Replace `godot` with the Godot command on your system.

```sh
godot --headless --path godot --script res://tests/check-leaderboard.gd -- /absolute/path/leaderboard.json
godot --headless --path godot --script res://tests/opening_035.gd -- --qa --output=/absolute/path/opening.json
godot --headless --path godot --script res://tests/campaign_flow.gd -- --qa --output=/absolute/path/campaign.json
godot --headless --path godot --script res://tests/projectile_journey_032.gd -- --qa --output=/absolute/path/projectiles.json
```

See the [build record](BUILD-RECORD.json) for the package hashes and automated test counts.
See the [game credits](../NOTICE.txt), [Godot license](../GODOT-LICENSE.txt), and [third-party notices](../THIRD_PARTY_NOTICES.txt).
OpenAI Codex assisted with the leaderboard, combat feedback, and verification code.
