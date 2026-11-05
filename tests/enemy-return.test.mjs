import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {enterChapter,moveCampaignEnemies,arenaY,arenaZ} from '../src/campaign.js';
import {presentEnemy,combatReady,ENTRY_TIME} from '../src/combat-view.js';
import {addFold} from '../src/space.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const setup=index=>{const s=createFlight('campaign',{seed:22});enterChapter(s,index);return s;};
test('All route enemies return from bottom to top with their health and equipment',()=>{
  for(let index=0;index<8;index++){
    const s=setup(index),e=s.enemies[0];s.enemies=[e];e.x=100;e.z=arenaZ(s,index===6?-71:-121);e.driftX=0;e.driftY=0;e.hp=1;e.presented=true;e.visibleFor=1;e.routeActive=true;
    const equipped=structuredClone(e.equipped),id=e.id;moveCampaignEnemies(s,0);
    near(arenaY(s,e.z),949);near(e.x,100);assert.equal(e.hp,1);assert.equal(e.id,id);assert.deepEqual(e.equipped,equipped);assert.equal(e.escaped,false);assert.equal(e.presented,false);assert.equal(e.visibleFor,0);assert.ok(e.loopCount>0);
  }
});
test('Stage 7 side crossings reverse vertical position and drift',()=>{
  const s=setup(6),e=s.enemies[0];s.enemies=[e];e.x=395;e.z=arenaZ(s,200);e.driftX=150;e.driftY=140;e.routeActive=true;
  moveCampaignEnemies(s,.1);near(e.x,-390);near(arenaY(s,e.z),666);assert.equal(e.driftY,-140);assert.ok(s.events.some(event=>event.type==='klein-crossing'&&event.edge==='right'));
});
test('Stage 7 top crossings preserve horizontal position and drift',()=>{
  const s=setup(6),e=s.enemies[0];s.enemies=[e];e.x=90;e.z=arenaZ(s,945);e.driftX=0;e.driftY=140;e.routeActive=true;
  moveCampaignEnemies(s,.1);near(arenaY(s,e.z),-61);near(e.x,90);assert.equal(e.driftY,140);
});
test('Future Stage 7 carriers wait for the route before entering the Klein map',()=>{
  const s=setup(6),e=s.enemies.at(-1),before={x:e.x,z:e.z};s.enemies=[e];moveCampaignEnemies(s,1);near(e.x,before.x);near(e.z,before.z);assert.ok(!e.routeActive);assert.equal(e.loopCount,undefined);
  e.z=arenaZ(s,949);moveCampaignEnemies(s,.001);assert.ok(e.routeActive);assert.equal(e.loopCount,undefined);assert.ok(arenaY(s,e.z)>940);
});
test('Bottom returns use the fold metric and require a new visible entry',()=>{
  const s=setup(0);addFold(s);const e=s.enemies[0];s.enemies=[e];e.z=arenaZ(s,-121);e.presented=true;e.visibleFor=1;
  s.shots=[{gates:{[`enemy-${e.id}`]:true}}];moveCampaignEnemies(s,0);near(arenaY(s,e.z),949);assert.equal(combatReady(s,e),false);assert.equal(s.shots[0].gates[`enemy-${e.id}`],undefined);
  presentEnemy(s,e);assert.equal(combatReady(s,e),false);e.visibleFor=ENTRY_TIME;assert.equal(combatReady(s,e),true);
});
test('A Stage 7 crossing cannot create a collision through the center',()=>{
  const s=setup(6),e=s.enemies[0];s.enemies=[e];e.x=399;e.z=arenaZ(s,20);e.driftX=150;e.driftY=0;e.routeActive=true;e.presented=true;e.visibleFor=1;
  s.x=0;s.z=arenaZ(s,440);tick(s,{},.02);assert.equal(s.hull,5);assert.equal(e.presented,false);assert.equal(e.hp,2);
});
test('Stage 7 carriers move faster, fire faster, and launch faster shots',()=>{
  const s=setup(6),e=s.enemies[0];s.enemies=[e];e.x=100;e.z=arenaZ(s,400);e.routeActive=true;e.presented=true;e.visibleFor=1;e.clock=0;
  assert.ok(Math.abs(e.driftX)>45&&Math.abs(e.driftY)>30&&e.firePeriod<2.3);tick(s,{},STEP);
  assert.ok(s.enemyShots.length>0);assert.equal(Math.abs(s.enemyShots[0].vz),210);assert.ok(e.clock<=1.1);
});
