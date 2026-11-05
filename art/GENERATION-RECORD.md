# Art generation record

Date: November 4, 2026.
Tool: built-in image_gen.
Mode: new concept image with a reference.
Reference: `art/references/user-crossing-reference.png`, supplied by the user.
Generated draft: `art/references/crossing-concept-v1.png`.
The draft is not a runtime atlas.
Its enemy directions, small labels, and exact colors were not accepted as production data.

Runtime art was then authored as new native pixel masks in `art/source/crossing.mjs`.
No sprite was cropped from the user reference or the generated draft.
The native export script writes transparent PNGs, an atlas, and metadata.
The generated draft and user reference remain outside the browser package.

## Final image-generation prompt

Use case: stylized-concept. Reference image role: visual inspiration only, not an edit target. Create a NEW professional pixel-art game production reference sheet for ARROW SPACE SHIFT, The Crossing. Off-white parchment sheet with thin dark panel borders and small pixel labels, generous spacing for clear silhouettes. Top-down orthographic vertical scroller: one player Arrow ship points UP, four enemies point DOWN: narrow one-hit SCOUT, wider twin-barrel GUNNER, broad layered armored HEAVY, thin fast KLEIN RUNNER with twisted split orange/blue tail. Weathered warm hulls, lighting top-left. Crisp pixels, no antialiasing, no gradients, no perspective, no realism. Restrict the art to Hull Light #D8C9A8, Hull Mid #9C8B6E, Hull Shadow #5A4E40, Outline #1B1626, Space Dark #2E2740, Glow #FFE9A0, Fold #E4572E, Unfold #3E7CB1 and stage accents #E8E4DC #F2A541 #E8D44D #7BC043 #2FA4A0 #7E5BC2 #C45AA8. Clearly separated panels: ENEMIES (4 down-facing sprites and enlarged Klein Runner); HEALTH AND RETURN (1 to 4 tiny pips, cracked heavy, bottom exit/top entry arrows); ASTEROIDS (large32, medium16, small8 relative logical pixels, 3 break frames, glint, shot absorption flash); KLEIN EDGES (side arrows reversed up/down with orange-blue half-twist, plain top/bottom pairs without twist, 3 frame right-edge crossing illustration which reverses vertical position and direction); ROUTE MARKERS (8 S0-S7, final rim split orange/blue); IN CONTEXT (5 by 7 quiet indigo asteroid belt, player at bottom, three rocks, one shot stopped by a rock, NO enemy or HUD); SCALE CHECK (all sprites compared at logical16 player size); PALETTE (role swatches); READABILITY (four enemy silhouettes and grayscale). Put only short panel labels and ARROW SPACE SHIFT title. This is a concept reference, not a packed runtime atlas. Clear communication and distinct silhouettes matter more than microscopic ornament. Keep 16-pixel sprite logic, consistent dark outline weight and warm hull ramp throughout.
