import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {addFold,removeFold,advanceThroughSpace} from '../src/space.js';
import {ENTRY_TIME,inCombatView,presentEnemy,combatReady,projectInView} from '../src/combat-view.js';

function setup(z=450){
  const s=createFlight('trio');s.phase='running';s.drops=[];s.gates=[];s.events=[];
  s.enemies=[{id:0,x:0,z,hp:1,clock:0,stage:1,equipped:[],dropsUpgrade:true}];return s;
}
const run=(s,seconds,input={})=>{for(let i=0;i<Math.round(seconds/STEP);i++)tick(s,input,STEP);};
const ready=s=>{presentEnemy(s,s.enemies[0]);s.enemies[0].visibleFor=ENTRY_TIME;};
const shotAtEnemy=s=>{s.shots=[{x:0,z:s.enemies[0].z-10,vx:0,vz:680,payload:[]}];};

test('Shots cannot destroy an enemy beyond the visible flight area',()=>{
  const s=setup(1700);shotAtEnemy(s);run(s,.1);
  assert.equal(s.enemies[0].hp,1);assert.equal(s.kills,0);assert.equal(s.shots.length,0);assert.equal(s.enemyShots.length,0);
});
test('An enemy within the view cannot fight before it has been drawn',()=>{
  const s=setup();assert.equal(inCombatView(s,s.enemies[0]),true);shotAtEnemy(s);run(s,.1);
  assert.equal(s.kills,0);assert.equal(s.enemyShots.length,0);assert.equal(combatReady(s,s.enemies[0]),false);
});
test('A newly drawn enemy has a short entry period before combat',()=>{
  const s=setup();presentEnemy(s,s.enemies[0]);shotAtEnemy(s);run(s,.1);
  assert.equal(s.kills,0);assert.equal(s.enemyShots.length,0);assert.ok(s.enemies[0].visibleFor<ENTRY_TIME);
  run(s,.6);assert.equal(combatReady(s,s.enemies[0]),true);assert.ok(s.enemyShots.length>0);
});
test('A visible enemy can be hit after its entry period',()=>{
  const s=setup();ready(s);shotAtEnemy(s);run(s,.1);
  assert.equal(s.kills,1);assert.ok(s.effects.some(e=>e.type==='defeat'));
  const result=s.events.find(e=>e.type==='target-hit');assert.equal(result.visible,true);assert.equal(result.presented,true);
});
test('Three folds cannot reveal and destroy an undrawn enemy in one simulation step',()=>{
  const s=setup(1700);for(let i=0;i<3;i++)addFold(s);
  assert.equal(inCombatView(s,s.enemies[0]),true);shotAtEnemy(s);tick(s,{},STEP);assert.equal(s.kills,0);
  presentEnemy(s,s.enemies[0]);run(s,.1);assert.equal(s.kills,0);
});
test('Unfolding beyond the visible range removes attack eligibility immediately',()=>{
  const s=setup(1500);addFold(s);ready(s);assert.equal(combatReady(s,s.enemies[0]),true);
  removeFold(s);shotAtEnemy(s);tick(s,{},STEP);
  assert.equal(s.kills,0);assert.equal(s.enemies[0].presented,false);assert.equal(s.enemyShots.length,0);
});
test('Returning to view requires a new presentation and entry period',()=>{
  const s=setup(1500);addFold(s);ready(s);removeFold(s);tick(s,{},STEP);addFold(s);tick(s,{},STEP);
  assert.equal(combatReady(s,s.enemies[0]),false);presentEnemy(s,s.enemies[0]);run(s,.2);
  assert.equal(combatReady(s,s.enemies[0]),false);
});
test('Compact screen boundaries are used by combat, not only by drawing',()=>{
  const s=setup(850);ready(s);assert.equal(inCombatView(s,s.enemies[0]),true);
  s.view={width:320,height:390};assert.equal(inCombatView(s,s.enemies[0]),false);
  shotAtEnemy(s);tick(s,{},STEP);assert.equal(s.kills,0);
});
test('The HUD band and side edges are outside the combat area',()=>{
  const s=setup();s.enemies[0].z=advanceThroughSpace(s.z,1020,s.fields);
  assert.ok(projectInView(s,0,s.enemies[0].z).y<112);assert.equal(inCombatView(s,s.enemies[0]),false);
  s.enemies[0].z=450;s.enemies[0].x=390;assert.equal(inCombatView(s,s.enemies[0]),false);
});
test('Upgrade fire is straight even when an off-center enemy exists',()=>{
  const s=setup();s.enemies[0].x=180;ready(s);tick(s,{fire:true},STEP);
  assert.equal(s.shots[0].vx,0);assert.equal(s.shots[0].x,s.x);
});
test('Player shots expire outside the view while existing hostile shots retain their path',()=>{
  const s=setup();s.enemies=[];s.shots=[{x:0,z:1400,vx:0,vz:680}];s.enemyShots=[{x:0,z:1400,vx:0,vz:-145}];
  tick(s,{},STEP);assert.equal(s.shots.length,0);assert.equal(s.enemyShots.length,1);assert.ok(s.enemyShots[0].z<1400);
});
test('Stored enemy damage waits while the enemy is outside the view',()=>{
  const s=setup(1500);s.debts=[{target:0,due:0,amount:1}];tick(s,{},STEP);
  assert.equal(s.kills,0);assert.equal(s.debts.length,1);
  addFold(s);ready(s);tick(s,{},STEP);assert.equal(s.kills,1);assert.equal(s.debts.length,0);
});
test('A paused or covered flight does not acknowledge a newly drawn enemy',()=>{
  const s=setup();s.phase='paused';presentEnemy(s,s.enemies[0]);assert.ok(!s.enemies[0].presented);
});
