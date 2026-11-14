import test from 'node:test';
import assert from 'node:assert/strict';
import {forecastJoin,playerJoinForecast,threatJoinForecasts,joinCueText} from '../src/geometry-cues.js';
import {traceKleinProjective} from '../src/klein.js';
import {createFlight} from '../src/simulation.js';
import {enterChapter} from '../src/campaign.js';

test('Klein side warning identifies reflected landing and orientation',()=>{
  const cue=forecastJoin({x:375,y:300},{vx:100,vy:0},{horizon:.8});
  assert.equal(cue.edge,'right');assert.equal(cue.rule,'klein');assert.equal(cue.orientation,'forward-reverses');
  assert.ok(Math.abs(cue.timeSeconds-.25)<.01);assert.equal(cue.destination.x,-400);assert.equal(cue.destination.y,580);
  assert.match(joinCueText(cue),/FORWARD REVERSAL/);
});
test('projective upper-edge warning predicts antipodal lateral destination',()=>{
  const cue=forecastJoin({x:125,y:930},{vx:0,vy:100},{horizon:.6,projective:true});
  assert.equal(cue.rule,'projective');assert.equal(cue.destination.x,-125);assert.equal(cue.destination.y,-70);
  assert.equal(cue.orientation,'lateral-reverses');
  assert.deepEqual([cue.destination.x,cue.destination.y],(()=>{const out=traceKleinProjective({x:125,y:930},0,60);return[out.crossings[0].x,out.crossings[0].y]})());
});
test('no approach or invalid velocity has no warning',()=>{
  assert.equal(forecastJoin({x:0,y:400},{vx:0,vy:0}),null);
  assert.equal(forecastJoin({x:0,y:400},{vx:NaN,vy:0}),null);
});
test('player cue uses Klein until the hybrid stage actually changes the player rule',()=>{
  const s=createFlight('campaign',{seed:123});enterChapter(s,17);s.campaign.introRemaining=0;s.phase='running';s.x=390;s.z=0;
  s.campaign.hybridPhase=2;
  assert.equal(playerJoinForecast(s,{horizontalVelocity:120,horizon:.4}).rule,'klein');
  s.campaign.hybridPhase=3;
  assert.equal(playerJoinForecast(s,{horizontalVelocity:120,horizon:.4}).rule,'klein');
});
test('hostile projectile forecasts do not invent a return for bullets not approaching an edge',()=>{
  const s=createFlight('campaign',{seed:333});enterChapter(s,17);s.campaign.introRemaining=0;s.phase='running';
  s.enemyShots=[{x:0,z:0,vx:0,vz:0,geometryRule:'klein'}, {x:390,z:0,vx:120,vz:0,geometryRule:'klein'}];
  assert.equal(threatJoinForecasts(s).length,1);
  assert.equal(threatJoinForecasts(s)[0].edge,'right');
});
