import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {createFleetProfile} from '../src/fleet.js';
import {enterChapter,arenaZ} from '../src/campaign.js';
import {AVEventReader} from '../src/av-events.js';
function route(){
  const s=createFlight('campaign',{fleetProfile:createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module'],selectedShip:0}),seed:2501});
  enterChapter(s,9);s.phase='running';s.enemies=[];s.asteroids=[];s.drops=[];return s;
}
test('A manual shot retains its emitted identity through an actual route seam',()=>{
  const s=route();tick(s,{fire:true},STEP);
  const shot=s.shots[0],fired=s.events.find(e=>e.type==='player-fire');
  assert.ok(fired.objectId);assert.equal(fired.objectId,shot.objectId);
  shot.x=399;shot.z=arenaZ(s,220);shot.vx=500;shot.vz=0;
  tick(s,{},STEP);
  assert.equal(s.shots[0],shot);assert.equal(shot.owner,'player');
  const crossing=s.events.find(e=>e.type==='klein-crossing'&&e.objectId===fired.objectId);
  assert.ok(crossing);assert.equal(crossing.rule,'klein');
  const cues=new AVEventReader().read(s);
  assert.ok(cues.some(cue=>cue.type==='topology.klein.cross'&&cue.objectId===fired.objectId));
});
test('Different live projectiles have different presentation identities',()=>{
  const s=route();tick(s,{fire:true},STEP);s.fireClock=0;tick(s,{fire:true},STEP);
  const shots=s.events.filter(e=>e.type==='player-fire');
  assert.equal(shots.length,2);assert.notEqual(shots[0].objectId,shots[1].objectId);
});
