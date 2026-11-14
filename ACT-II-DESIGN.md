# Act II — Klein Bullet Hell

Act I is frozen. Act II begins only after the Klein Fleet and the Klein Relay. The existing attack grammar remains canonical. The next eight stages teach how that grammar behaves on the Klein surface, alternating pressure with short recovery intervals. The ninth encounter is a hybrid Klein / real-projective intrusion; defeating it awards the Projective Module.

Stages: Return Flight; Intentional Crossing; Returning Fire; Seam Gap; Cross Current; Fold Timing; Pressure Field; Klein Mastery; then The Projective Intrusion.

The hybrid boss keeps Klein side joins and introduces projective antipodal top/bottom identification in later phases. This is intentionally a module-overlap gameplay geometry, not a claim that the rectangular hybrid quotient is pure RP^2.

Implementation status: the complete Act II sequence is represented in release 0.20.1, including the eight Klein lessons, the hybrid ninth encounter, Projective Module recovery, practice, records and progress portability. See `docs/ACT-II-RELEASE-INDEX.md`.


## v0.20.3 — Klein Relay traversal correction

The Klein Fleet is a pre-Relay demonstration. Once the player collects the
Klein Relay and enters Act II, the ship uses the same side identification as
the fleet: crossing left or right reflects the longitudinal surface position
and transports its physical forward direction. The camera frame follows that
change, so the ship continues pointing up in the viewport. This is a genuine
surface traversal with consistent ship/projectile/enemy chart transforms, not
a cosmetic x-coordinate teleport.

The camera's physical surface chart is separate from monotonically increasing
route progress. Up is limited to the arena midpoint with a ship-height margin;
Down is limited at the bottom, and the level does not scroll backward. Future
authored enemies still enter according to route progress after a seam crossing.
Act I encounter definitions, controls, and combat balance are unchanged.

## Act III extension through 0.22.0

After recovering and extracting the Projective Module, eight Projective Ecology stages introduce deliberate projectile capture and release, build choices at recovery breaks, and a finite-cost power economy. The ninth Curvature Gate encounter is a **prototype**, not a mathematically verified hyperbolic surface. Details in `docs/PROJECTIVE-ECOLOGY-0.22.0.md`.
