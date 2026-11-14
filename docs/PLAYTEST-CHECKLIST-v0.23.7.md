# v0.23.7 ordinary-player acceptance checklist

This is an evidence-collection protocol. Automated tests alone cannot certify
comprehension or bullet-hell fairness. Music is explicitly outside this pass.

## Level transition / stale-server QA

1. Extract the v0.23.7 PLAY ZIP fully, close any old game windows or servers,
   run `START-GAME-WINDOWS.bat`, and copy the freshly printed URL.
2. Complete Level 0 normally: arrows, Space, left fold, right unfold, training
   enemy. Confirm Level 1 begins automatically.
3. Clear Levels 1 and 2: the result panel appears and the next level starts
   within about three seconds **without pressing a button or reloading**.
4. Repeat on one Act II stage and one Act III stage, including with an opened
   options/equipment dialog (countdown should pause while dialog is open).
5. Save/reload after a clear: resume should offer the next section; no progress
   should be lost. Boss part pickup/extraction should still require an explicit
   decision. No automatic boss skip.

## Hybrid join / attack warnings

6. Enter the Act II hybrid boss through a reached stage or local QA option.
   During the second→third geometry transition, observe the 2.2-second arming
   notice before the player becomes subject to projective identification.
7. Cross top/bottom once after arming and compare exit lane, direction, and
   displayed state with the cue. Record any visually unannounced jump.
8. Check projectile-return warnings with overlapping volleys and reduced motion.
   Keep specific clip/time and seed if a cue lies or arrives too late.

## Combat response and loot QA

9. Test Arrow, Skater, Needle, and Aftwing on Stage 7, Seam Gap, Pressure Field,
   Klein Mastery and the hybrid boss with ordinary health and manual shooting.
   For a suspect pattern, record whether a reachable path existed before it
   arrived; do not equate a difficult reaction with an unavoidable hit.
10. In Act II, collect two duplicate operation seeds while missing at least one
    hull point; verify exactly one repair and no more repairs that stage.
    Verify Act I has no duplicate-healing behavior, and Act III's Echo limit.
11. Ask new players to explain what the fold changed, where a Klein/projective
    join leads, what killed them, and which decision they would try next.
    Record the answer before teaching the rule.

## Release acceptance

- No runtime exceptions, lost checkpoint, stuck screen, or unwanted Act reset.
- All legitimate observed hybrid crossings have understandable advance cues.
- No verified unavoidable damage where the design promises a response.
- No farming of duplicate rewards or unearned permanent parts.
- Human playtests provide direct evidence for readability, enjoyment and
  intended learning transfer. Otherwise mark these checks **unverified**.
