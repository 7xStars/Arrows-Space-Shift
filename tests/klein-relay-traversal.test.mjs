import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {createFleetProfile} from '../src/fleet.js';
import {CHAPTERS,enterChapter,arenaY,arenaZ,chapter,isKleinSurfaceRoute,SCROLL_SPEED} from '../src/campaign.js';
import {viewY,viewDirection,screenFacing,projectInView} from '../src/combat-view.js';
import {pathsHit,KLEIN_BOUNDS} from '../src/klein.js';

const eps=1e-6;
const close=(a,b,tolerance=eps)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≠ ${b}`);
function relayRoute(index=9){
  const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay'],unlockedShips:[0,1,8],selectedShip:0});
  const s=createFlight('campaign',{fleetProfile:profile,seed:2219});
  enterChapter(s,index);
  s.phase='running';
  s.enemies=[];s.asteroids=[];s.shots=[];s.enemyShots=[];s.drops=[];
  return s;
}

test('Klein Relay transport reflects longitudinal position and heading at side seams without violating lower-half viewport',()=>{
  const s=relayRoute();
  s.x=398;s.z=arenaZ(s,100);
  const progress=s.cameraZ;
  tick(s,{horizontal:1,throttle:0,fire:false},STEP);
  assert.ok(s.x<-398,'right side returns on left');
  close(arenaY(s,s.z),100);
  close(viewY(s,s.z),100);
  assert.equal(s.facing,-1,'physical orientation is reversed');
  assert.equal(viewDirection(s),-1,'view frame is transported with ship');
  assert.equal(screenFacing(s),1,'gun remains forward on the screen');
  assert.ok(s.z>600,'physical longitude is reflected');
  assert.ok(s.cameraZ>progress,'route progress advances despite the seam crossing');
  const crossing=s.events.find(e=>e.type==='klein-crossing'&&e.actor==='player');
  assert.equal(crossing?.edge,'right');
  assert.equal(s.campaign.shipMotion.segments.length,2,'sweep splits at the seam');
  // The camera cut must not produce a fictitious collision across the middle.
  const middle=[{from:{x:0,y:440},to:{x:0,y:440},t0:0,t1:1}];
  assert.equal(pathsHit(s.campaign.shipMotion.segments,middle,28,KLEIN_BOUNDS),false);
});

test('left join and return join both preserve lower-half presentation and toggle physical orientation',()=>{
  const s=relayRoute();s.x=-398;s.z=arenaZ(s,160);
  tick(s,{horizontal:-1,throttle:0,fire:false},STEP);
  assert.ok(s.x>398);assert.equal(s.facing,-1);close(arenaY(s,s.z),160);
  const first=s.cameraZ;
  // Cross back from the right, ending in the original physical orientation.
  s.x=398;
  tick(s,{horizontal:1,throttle:0,fire:false},STEP);
  assert.ok(s.x<-398);assert.equal(s.facing,1);close(arenaY(s,s.z),160);
  assert.ok(s.cameraZ>first);
});

test('Up and Down retain the route position while the camera scrolls forward',()=>{
  const s=relayRoute();s.z=arenaZ(s,220);
  for(let i=0;i<80;i++)tick(s,{horizontal:0,throttle:1,fire:false},STEP);
  close(arenaY(s,s.z),220);
  const before=s.cameraZ;
  for(let i=0;i<80;i++)tick(s,{horizontal:0,throttle:-1,fire:false},STEP);
  close(arenaY(s,s.z),220);
  assert.equal(s.lastAxialInput,0);
  assert.ok(s.cameraZ>before);
  assert.equal(s.phase,'running');
});

test('existing enemy and projectile are reflected in transported frame without replacing physical identities',()=>{
  const s=relayRoute();s.x=398;s.z=arenaZ(s,125);
  const enemy={id:321,x:0,z:arenaZ(s,350),routeActive:true,stage:2,hp:3,maxHp:3,clock:999,driftX:0,driftY:30,
    waveActive:true,dropsUpgrade:false,presented:true,visibleFor:2};
  const shot={id:445,x:0,z:arenaZ(s,250),vx:0,vz:-120,payload:[],owner:'enemy',sourceId:321};
  s.enemies=[enemy];s.enemyShots=[shot];
  tick(s,{horizontal:1,throttle:0,fire:false},STEP);
  assert.equal(enemy.id,321);assert.equal(enemy.hp,3);assert.equal(enemy.driftY,-30);
  assert.ok(arenaY(s,enemy.z)>525&&arenaY(s,enemy.z)<535,'enemy appears at the reflected height');
  assert.equal(shot.vz,120,'incoming bullet transports its velocity');
  assert.ok(arenaY(s,shot.z)>600,'incoming bullet is seen in the reflected chart');
});

test('later authored enemy waves remain ahead on the new surface after player turns',()=>{
  const s=relayRoute(12);s.x=398;s.z=arenaZ(s,100);
  const future={id:989,x:0,z:1200,routeDepth:1200,routeActive:false,waveActive:false,activationAt:.5,
    hp:2,maxHp:2,stage:2,driftX:0,driftY:30,clock:999,dropsUpgrade:false};
  s.enemies=[future];tick(s,{horizontal:1,throttle:0,fire:false},STEP);
  close(arenaY(s,future.z),future.routeDepth-s.cameraZ);
  assert.equal(future.routeActive,false);
  assert.equal(future.waveActive,false);
  assert.equal(future.driftY,30,'unspawned authored waves preserve their scripted movement');
});

test('post-relay manual shots still travel forward on screen after side reversal',()=>{
  const s=relayRoute();s.x=398;s.z=arenaZ(s,130);
  tick(s,{horizontal:1,throttle:0,fire:false},STEP);
  const before=arenaY(s,s.z);
  tick(s,{horizontal:0,throttle:0,fire:true},STEP);
  assert.equal(s.shots.length,1);
  const shot=s.shots[0];
  assert.equal(shot.vz,680);
  assert.equal(shot.geometryRule,'klein');
  assert.ok(arenaY(s,shot.z)>before,'shots project ahead despite reversed world longitude');
});

test('Act I retains its original bounded lateral movement, forward camera and fixed controls',()=>{
  const s=relayRoute(7);
  assert.equal(chapter(s).act,undefined);
  assert.equal(isKleinSurfaceRoute(s),false);
  s.x=349;s.z=arenaZ(s,100);
  tick(s,{horizontal:1,throttle:1,fire:false},STEP);
  assert.equal(s.x,350,'no sideways topological traversal in Act I Stage 8');
  assert.equal(s.facing,1);
  assert.equal(s.surfaceViewZ,0);
  close(arenaY(s,s.z),100);
  assert.ok(s.cameraZ>0);
});
