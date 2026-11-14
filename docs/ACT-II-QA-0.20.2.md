# Arrow Space Shift 0.20.2 — Act II QA candidate

This is an offline, merge-ready candidate based on the 0.20.1 source archive. It is **not deployed** to ChatGPT Sites and must be diffed against live 0.19.1 before integration. No Act I chapter definition was changed.

## Changes

1. All authored Act II recovery waves now clear existing hostile bullets by default. The director cancels old warnings, and enemies do not begin new telegraphs or attacks while the recovery wave is active. Stored impact debt is *not* cancelled. Stage 1–3 unscripted sections retain their established behavior.
2. Act II grades now separate raw input counts from spatial decision evidence. At most one side-seam credit is earned per authored combat wave (or distinct route segment), with a threat requirement after the first two teaching stages. Fold/unfold score credit applies only in Fold Timing and Klein Mastery under active threat, at most once per combat wave. This is a defensible *proxy* for consequential action, not a claim that every credited use saved the player.
3. Stage 1–8 and the boss continue using the existing attack grammar; Act I stage definitions and health remain untouched.

## Remaining open issues (not claimed solved)

- The candidate Klein/projective boundary rule is not yet a faithful connected-sum model of K # RP^2.
- Boss extraction still counts distance after picking up the module; a physical-gate traversal is future work.
- Full campaign human playthroughs, actual safe-path measurements, accessibility review, and live-Sites merge/deployment remain to be completed.
- Avoid interpreting stage pressure metadata as a validated difficulty prediction.

## Local run

Extract the PLAY ZIP and run `python -m http.server 4177` in its directory (or use the Windows launcher). Open `http://localhost:4177` in a browser. The playable ZIP keeps `index.html` at its root.

## QA

Run `npm test` and `npm run syntax` from extracted source.
