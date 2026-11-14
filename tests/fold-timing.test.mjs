import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {enterChapter,CHAPTERS,tickWaveDirector} from '../src/campaign.js';
import {ACT_TWO_WAVE_SCRIPTS} from '../src/waves.js';

const profile={fleetUnlocked:true,driveParts:['klein-relay'],unlockedShips:[0,1,8],selectedShip:0};

test('Fold Timing has three authored comparison folds and recovery intervals',()=>{
  const script=ACT_TWO_WAVE_SCRIPTS['fold-timing'];
  assert.equal(script.scriptedFolds.length,3);
  assert.ok(script.waves.filter(w=>w.kind==='break').length>=3);
  assert.ok(script.waves.some(w=>w.label==='Chronometric Anchor'));
});

test('wave director creates an authored fold at the lesson threshold',()=>{
  const s=createFlight('campaign',{fleetProfile:profile});enterChapter(s,14);
  assert.equal(CHAPTERS[14].name,'Fold Timing');
  s.cameraZ=CHAPTERS[14].routeLength*.11;tickWaveDirector(s);
  assert.equal(s.fields.length,1);
  assert.equal(s.fields[0].source,'authored-lesson');
  assert.ok(s.events.some(e=>e.type==='timing-fold'));
});

test('a projectile records fold entry and its current depth',()=>{
  const s=createFlight('campaign',{fleetProfile:profile});enterChapter(s,14);
  s.fields=[{id:1,start:100,end:900,factor:.5}];
  s.shots=[{x:0,z:90,vx:0,vz:680,owner:'player'}];
  for(let i=0;i<8;i++)tick(s,{fire:false,horizontal:0,throttle:0},STEP);
  assert.ok(s.shots[0].foldTransitions>=1);
  assert.ok(Number.isFinite(s.shots[0].foldChangedAt));
  assert.ok(s.events.some(e=>e.type==='fold-entry'));
});
