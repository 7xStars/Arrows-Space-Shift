import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {isTutorial,continueCampaign,retryCampaign} from '../src/campaign.js';
import {presentEnemy} from '../src/combat-view.js';
const run=(s,seconds,input={})=>{for(let i=0;i<seconds/STEP;i++){for(const e of s.enemies)presentEnemy(s,e);tick(s,input,STEP);}};
test('Level 0 starts before the eight routes and waits for actual movement',()=>{
  const s=createFlight('campaign');assert.ok(isTutorial(s));assert.equal(s.phase,'ready');s.phase='running';
  run(s,2,{fire:true});assert.equal(s.campaign.lesson,'move');assert.equal(s.enemies.length,0);assert.equal(s.cameraZ,0);assert.equal(continueCampaign(s),false);
  run(s,.2,{throttle:-1});assert.equal(s.z,0);assert.equal(s.facing,1);
});
test('Left and right movement unlock a visible target with no return fire',()=>{
  const s=createFlight('campaign');s.phase='running';
  run(s,.2,{horizontal:1});run(s,.2,{horizontal:-1});run(s,.5,{throttle:1});run(s,.2,{throttle:-1});assert.equal(s.z,0);
  assert.equal(s.campaign.lesson,'shoot');assert.equal(s.enemies.length,1);assert.equal(s.campaign.defeated,0);
  run(s,5);assert.equal(s.enemyShots.length,0);assert.equal(s.phase,'running');
  s.facing=s.enemies[0].z>s.z?1:-1;run(s,2,{fire:true});
  assert.equal(s.phase,'cleared');assert.ok(s.events.some(e=>e.type==='tutorial-complete'));
  assert.equal(continueCampaign(s),true);assert.equal(s.campaign.index,0);assert.equal(s.inventory.length,2);assert.equal(s.phase,'running');
});
test('Tutorial retry clears movement progress without skipping Level 0',()=>{
  const s=createFlight('campaign');s.phase='running';run(s,.2,{horizontal:1});retryCampaign(s);
  assert.ok(isTutorial(s));assert.equal(s.campaign.lesson,'move');assert.equal(s.campaign.movement.right,0);assert.equal(s.enemies.length,0);
});
