import test from 'node:test';
import assert from 'node:assert/strict';
import {moveBolza,sidePairing,hyperbolicDistance,insideOctagon} from '../src/hyperbolic.js';
import {forecastBolzaPair,pairedSideGlyph,HYPERBOLIC_VISUAL_CONTRACT} from '../src/hyperbolic-visuals.js';

test('paired-side labels use A/B/C/D and opposite primed labels',()=>{
 for(let i=0;i<4;i++){
   assert.equal(pairedSideGlyph(i),'ABCD'[i]);
   assert.equal(pairedSideGlyph(i+4),'ABCD'[i]+'′');
 }
 assert.equal(pairedSideGlyph(-1),null);
 assert.equal(pairedSideGlyph(9),null);
});

test('Bolza forecast is a render-only destination from the same intrinsic mover',()=>{
 const near=moveBolza({x:0,y:0},{x:1,y:0},1.2);
 const before=structuredClone(near);
 const prediction=forecastBolzaPair(near.position,near.heading,{lookAhead:.45});
 assert.ok(prediction);assert.equal(prediction.kind,'future-projection');
 assert.equal(prediction.collisionEntity,false);
 assert.equal(prediction.sourceGlyph,'D′');assert.equal(prediction.targetGlyph,'D');
 assert.equal(prediction.to,(prediction.from+4)%8);
 assert.ok(insideOctagon(prediction.destination));
 const actual=moveBolza(near.position,near.heading,.45,.02);
 assert.equal(actual.crossings[0].from,prediction.from);
 assert.equal(actual.crossings[0].to,prediction.to);
 const jump=actual.segments.find(segment=>segment.jump);
 assert.deepEqual(prediction.destination,jump.to);
 assert.deepEqual(near,before,'forecast cannot mutate a live mover');
});

test('side-pairing prediction corresponds to same quotient location, not a new projectile',()=>{
 const near=moveBolza({x:0,y:0},{x:1,y:0},1.4);
 const prediction=forecastBolzaPair(near.position,near.heading,{lookAhead:.3});
 assert.ok(prediction);
 const g=sidePairing(prediction.from);
 // A finite movement step crosses the pair boundary; the sampled source is
 // within 0.03 intrinsic units of the mapped destination.
 assert.ok(hyperbolicDistance(g.apply(prediction.source),prediction.destination)<.031);
 assert.match(HYPERBOLIC_VISUAL_CONTRACT.hollow,/not an extra collider/);
});

test('no impending pair and invalid or near-vertex requests do not invent a destination',()=>{
 assert.equal(forecastBolzaPair({x:0,y:0},{x:1,y:0},{lookAhead:.1}),null);
 assert.equal(forecastBolzaPair({x:1.1,y:0},{x:1,y:0}),null);
 assert.equal(forecastBolzaPair({x:0,y:0},{x:1,y:0},{lookAhead:0}),null);
});
