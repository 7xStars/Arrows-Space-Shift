import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick} from '../src/simulation.js';
import {enterChapter} from '../src/campaign.js';
import {inCombatView,projectInView} from '../src/combat-view.js';
import {advanceThroughSpace} from '../src/space.js';
test('Boss vertical input has no movement or facing authority',()=>{
  for(const throttle of [-1,1]){
    const a=createFlight('campaign',{seed:7}),b=createFlight('campaign',{seed:7});enterChapter(a,8);enterChapter(b,8);
    tick(a,{},.1);tick(b,{throttle},.1);assert.equal(b.z,a.z);assert.equal(b.facing,a.facing);assert.equal(b.thrust,0);
  }
});
test('The viewport status area excludes covered enemies from combat',()=>{
  const s=createFlight('campaign');enterChapter(s,0);s.view={width:960,height:720,topInset:190};
  const scale=(720-190-88)/950;
  const e={x:0,z:advanceThroughSpace(0,(720-88-170)/scale,s.fields)};
  assert.ok(Math.abs(projectInView(s,e.x,e.z).y-170)<1e-6);assert.equal(inCombatView(s,e),false);
  e.z=advanceThroughSpace(0,(720-88-210)/scale,s.fields);assert.equal(inCombatView(s,e),true);
});
