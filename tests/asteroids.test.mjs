import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP,readFlight} from '../src/simulation.js';
import {CHAPTERS,enterChapter,retryCampaign} from '../src/campaign.js';
import {inCombatView} from '../src/combat-view.js';
import {asteroidContact,contactTime} from '../src/asteroids.js';

function setup(seed=17,index=1){const s=createFlight('campaign',{seed});enterChapter(s,index);s.enemies=[];s.asteroids=[];return s;}
const rock=(s,z=300,x=0,hp=2)=>{const a={id:'rock-test',x,z,radius:26,hp,maxHp:hp,shape:31,rotation:.5,presented:true};s.asteroids.push(a);return a;};
const run=(s,seconds)=>{for(let i=0;i<Math.round(seconds/STEP);i++)tick(s,{},STEP);};
const layout=s=>({enemies:s.enemies.map(e=>[e.x,e.z,e.equipped,e.clock,e.firePeriod]),rocks:s.asteroids.map(a=>[a.x,a.z,a.radius,a.shape])});
test('Even routes have mostly asteroids and fewer, slower-firing enemies',()=>{
  for(const i of [1,3,5,7]){const s=createFlight('campaign',{seed:9});enterChapter(s,i);
    assert.ok(s.asteroids.length>s.enemies.length);assert.ok(s.enemies.length<=CHAPTERS[i-1].carriers/4);
    assert.ok(s.enemies.every(e=>e.firePeriod>=3.8));assert.ok(CHAPTERS[i].routeLength<CHAPTERS[i-1].routeLength);
  }
});
test('Different run seeds produce different enemy and asteroid positions',()=>{
  const a=createFlight('campaign',{seed:101}),b=createFlight('campaign',{seed:202});enterChapter(a,1);enterChapter(b,1);
  assert.notDeepEqual(a.enemies.map(e=>[e.x,e.z]),b.enemies.map(e=>[e.x,e.z]));assert.notDeepEqual(a.asteroids.map(e=>[e.x,e.z]),b.asteroids.map(e=>[e.x,e.z]));
});
test('A section retry reproduces the same layout and restores asteroid health',()=>{
  const s=createFlight('campaign',{seed:42});enterChapter(s,5);const before=layout(s);s.asteroids[0].hp=0;s.enemies[0].hp=0;s.hull=1;s.phase='lost';
  retryCampaign(s);assert.deepEqual(layout(s),before);assert.ok(s.asteroids.every(a=>a.hp===2));assert.equal(s.hull,5);assert.equal(s.runSeed,42);
});
test('Randomized belts remain inside the route and leave gaps between asteroid rows',()=>{
  for(let seed=0;seed<20;seed++)for(const index of [1,3,5,7]){
    const s=createFlight('campaign',{seed});enterChapter(s,index);const sorted=s.asteroids.toSorted((a,b)=>a.z-b.z);
    assert.ok(sorted.every(a=>Math.abs(a.x)<=260&&a.z>300&&a.z<CHAPTERS[index].routeLength&&a.radius<=30));
    assert.ok(sorted.slice(1).every((a,i)=>a.z-sorted[i].z>60));
  }
});
test('Player fire breaks an asteroid, consumes the shot, and credits it once',()=>{
  const s=setup(),a=rock(s);s.shots=[{x:0,z:280,vx:0,vz:680,payload:[]}];tick(s,{},STEP);assert.equal(a.hp,1);assert.equal(s.shots.length,0);
  s.shots=[{x:0,z:280,vx:0,vz:680,payload:[]}];tick(s,{},STEP);assert.equal(a.hp,0);assert.equal(s.score,10);assert.equal(s.asteroids.length,0);
  assert.equal(s.events.filter(e=>e.type==='asteroid-broken').length,1);assert.equal(s.events.find(e=>e.type==='asteroid-broken').owner,'player');
});
test('Enemy fire can break an asteroid without awarding player points',()=>{
  const s=setup(),a=rock(s,150,0,1);s.enemyShots=[{x:0,z:200,vx:0,vz:-145,payload:[]}];run(s,.3);
  assert.equal(a.hp,0);assert.equal(s.enemyShots.length,0);assert.equal(s.score,0);assert.equal(s.events.find(e=>e.type==='asteroid-broken').owner,'enemy');
});
test('An asteroid intercepts hostile fire before it reaches the player',()=>{
  const s=setup();rock(s,150,0,1);s.enemyShots=[{x:0,z:200,vx:0,vz:-145,payload:[]}];run(s,1);
  assert.equal(s.hull,5);assert.equal(s.enemyShots.length,0);assert.ok(!s.events.some(e=>e.type==='damage'));
});
test('Asteroid contact causes normal hull damage and breaks the rock',()=>{
  const s=setup(),a=rock(s,50,0,2);run(s,.2);assert.equal(s.hull,4);assert.equal(a.hp,0);assert.equal(s.score,0);assert.equal(s.events.find(e=>e.type==='asteroid-broken').owner,'ship');
});
test('A rock in front of an enemy stops the shot before enemy damage',()=>{
  const s=setup();const a=rock(s,300,0,1);s.enemies=[{id:99,x:0,z:360,hp:2,clock:999,stage:0,equipped:[],presented:true,visibleFor:1}];
  s.shots=[{x:0,z:260,vx:0,vz:680,payload:[]}];tick(s,{},.2);assert.equal(a.hp,0);assert.equal(s.enemies[0].hp,2);
});
test('A rock behind an enemy cannot absorb an earlier hit on that enemy',()=>{
  const s=setup(),a=rock(s,360,0,1);s.enemies=[{id:99,x:0,z:300,hp:2,clock:999,stage:0,equipped:[],presented:true,visibleFor:1}];
  s.shots=[{x:0,z:260,vx:0,vz:680,payload:[]}];tick(s,{},.2);assert.equal(s.enemies[0].hp,1);assert.equal(a.hp,1);
});
test('A rock before an operation entry stops the shot before the operation runs',()=>{
  const s=setup(),a=rock(s,190,60,1);s.enemies=[{id:99,x:0,z:350,hp:2,clock:999,stage:0,facing:-1,equipped:[{type:1,polarity:-1}],presented:true,visibleFor:1}];
  s.shots=[{x:60,z:140,vx:0,vz:680,payload:[]}];tick(s,{},.2);assert.equal(a.hp,0);assert.ok(!s.events.some(e=>e.type==='operation'));
});
test('A position warp can move a shot away from an asteroid after the entry',()=>{
  const s=setup(),a=rock(s,270,60,1);s.enemies=[{id:99,x:0,z:350,hp:2,clock:999,stage:0,facing:-1,equipped:[{type:0,polarity:-1}],presented:true,visibleFor:1}];
  s.shots=[{x:60,z:190,vx:0,vz:680,payload:[]}];tick(s,{},.2);assert.equal(a.hp,1);assert.ok(s.shots[0].x<0);assert.ok(s.shots[0].warped);
});
test('A warp jump does not sweep through an asteroid between its endpoints',()=>{
  const s=setup(),a=rock(s,210,0,1);s.enemies=[{id:99,x:0,z:350,hp:2,clock:999,stage:0,facing:-1,equipped:[{type:0,polarity:-1}],presented:true,visibleFor:1}];
  s.shots=[{x:60,z:190,vx:0,vz:680,payload:[]}];tick(s,{},.2);assert.equal(a.hp,1);assert.ok(s.shots[0].warped);
});
test('Hidden asteroids cannot be destroyed by unseen shots',()=>{
  const s=setup(),a=rock(s,1700,0,1);assert.equal(inCombatView(s,a),false);
  s.shots=[{x:0,z:1680,vx:0,vz:680,payload:[]}];s.enemyShots=[{x:0,z:1720,vx:0,vz:-145,payload:[]}];run(s,.1);assert.equal(a.hp,1);assert.ok(!s.events.some(e=>e.type==='asteroid-hit'));
});
test('The earliest rock contact is selected independent of array order',()=>{
  const s=setup();const far=rock(s,400,0,1),near=rock(s,300,0,1),paths=[{from:{x:0,z:260},to:{x:0,z:450}}];
  assert.equal(asteroidContact(s,paths).asteroid,near);assert.ok(contactTime(s,paths,near,26)<contactTime(s,paths,far,26));
});
test('Run seed and asteroid state are available as independent inspection records',()=>{
  const s=createFlight('campaign',{seed:0});enterChapter(s,1);const read=readFlight(s);assert.equal(read.runSeed,0);read.asteroids[0].hp=0;assert.equal(s.asteroids[0].hp,2);
});
