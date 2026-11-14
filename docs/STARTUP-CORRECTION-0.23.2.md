# Arrow Space Shift v0.23.2 — Level 17 automatic-start correction

## Root cause

The startup implementation automatically entered campaign chapter index 18 (displayed as **Level 17: Projective Chart**) whenever the stored fleet profile had a `projective-module`. A profile with only a `klein-relay` similarly skipped ahead to Act II. The player never explicitly requested the skip. Separately, the game could legitimately restore a stored checkpoint at a later stage; that case remains supported.

## Corrected behavior

- New flight begins with Level 0, even with existing unlocks.
- Continue Act II (Level 9) and Continue Act III (Level 17) are explicit buttons on the start screen, visible only when the relevant geometry module is owned.
- A previously saved section checkpoint still prompts Resume Level N. Start over · Level 0 is clearly available there and uses the existing reset confirmation so it never silently wipes the checkpoint.
- Permanent fleet profile, recovered geometry modules, unlocked ships, fabrication and stage records remain intact.
- QA-only section jumps still work and are not exposed in normal play.

## Regression gates

1. Fresh profile begins at tutorial (chapter index -1).
2. Relay-only and Projective Module profiles also begin at tutorial by default.
3. Explicit continuation works only for unlocked Act II/III.
4. Invalid or unauthorized skip requests leave the flight at tutorial.
5. Existing saved checkpoints restore their exact section with pause/resume.
6. All v0.23.1 combat and content tests pass unchanged, except the test whose expectation was automatic Act III launch.

## Delivery status

Local candidate, not published to ChatGPT Sites.
