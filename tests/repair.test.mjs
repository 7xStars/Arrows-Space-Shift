import test from 'node:test';
import assert from 'node:assert/strict';
import {createRepair,startRepair,stepRepair,repairAction} from '../src/repair.js';
import {createJourney,syncLegacyParts,bankFinalComponent,assembleDrive,activateDrive,completeRepair,saveJourney,loadJourney} from '../src/journey.js';

function control(s){
  const goal=s.stageIndex===0?-220:s.stageIndex===1?220:s.echoCount?-180:120;
  if(s.stageIndex===0&&!s.fields.length)repairAction(s,'fold');
  return {horizontal:Math.abs(goal-s.x)<2?0:Math.sign(goal-s.x),fire:s.stageIndex<2&&Math.abs(goal-s.x)<3,
    capture:s.stageIndex===2&&!s.echoCount,release:s.stageIndex===2&&s.echoCount>0&&Math.abs(goal-s.x)<3};
}
function runUntil(s,predicate,seconds=30){for(let i=0;i<seconds*120&&!predicate(s);i++)stepRepair(s,control(s),1/120);assert.ok(predicate(s));return s;}
function parts(){const j=createJourney();syncLegacyParts(j,{driveParts:['klein-relay','projective-module','curvature-seed']});bankFinalComponent(j,{id:'hyperbolic-core',source:'double-torus',stage:8,exposed:true,collected:true,extracted:true,seed:1,shipId:0,score:500});assembleDrive(j);return j;}

test('manual fire alone cannot charge the distance receiver before charge decay',()=>{
  const s=createRepair();startRepair(s);
  for(let i=0;i<8*120;i++)stepRepair(s,{horizontal:s.x>-220?-1:0,fire:true},1/120);
  assert.equal(s.charged.compression,false);assert.equal(s.stageIndex,0);
  repairAction(s,'fold');
  for(let i=0;i<2*120&&s.stageIndex===0;i++)stepRepair(s,{fire:true},1/120);
  assert.equal(s.charged.compression,true);assert.equal(s.stageIndex,1);
});

test('ordinary steering, manual fire, fold, real Klein return, capture, and release activate the drive',()=>{
  const s=createRepair({shipId:8});startRepair(s);
  const crossings=[];
  for(let i=0;i<30*120&&s.phase==='running';i++){
    stepRepair(s,control(s),1/120);
    for(const event of s.events)if(event.type==='klein-crossing'&&!crossings.includes(event))crossings.push(event);
  }
  assert.equal(s.phase,'ending');assert.deepEqual(s.charged,{compression:true,klein:true,echo:true});
  assert.ok(crossings.some(event=>event.edge==='right'&&event.rule==='klein'));
  assert.ok(s.events.some(event=>event.type==='echo-captured'));assert.ok(s.events.some(event=>event.type==='echo-released'));
  assert.ok(s.time<30);assert.equal(s.activated,true);assert.equal(s.endingTime,0);
});

test('capture requires a physical charge in range and release spends a captured echo',()=>{
  const s=createRepair();startRepair(s);runUntil(s,state=>state.stageIndex===2);
  assert.equal(repairAction(s,'capture'),false);assert.equal(repairAction(s,'release'),false);
  runUntil(s,state=>state.echoCount===1);
  assert.equal(s.charges.length,0);assert.equal(repairAction(s,'release'),true);assert.equal(s.echoCount,0);
  assert.equal(repairAction(s,'release'),false);
});

test('pause stops every repair clock and rejects commands',()=>{
  const s=createRepair();startRepair(s);s.paused=true;const before=structuredClone(s);
  stepRepair(s,{horizontal:1,fire:true,capture:true,release:true},.5);
  assert.deepEqual(s,before);assert.equal(repairAction(s,'fold'),false);
  assert.equal(repairAction(s,'fire'),false);assert.equal(s.shots.length,0);
});

test('activation persists before the ending; completion persists only after the ending',()=>{
  const j=parts(),s=createRepair();startRepair(s);runUntil(s,state=>state.phase==='ending');
  assert.equal(activateDrive(j,s),true);assert.equal(completeRepair(j,s),false);assert.equal(j.completed,false);
  const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  saveJourney(j,storage);const restored=loadJourney(storage);
  assert.equal(restored.activated,true);assert.equal(restored.completed,false);
  const resumed=createRepair({resumeEnding:restored.activated});
  for(let i=0;i<15;i++)stepRepair(resumed,{},.5);
  assert.equal(completeRepair(restored,resumed),false);
  for(let i=0;i<2;i++)stepRepair(resumed,{},.5);
  assert.equal(resumed.phase,'complete');assert.equal(completeRepair(restored,resumed),true);
  saveJourney(restored,storage);assert.equal(loadJourney(storage).completed,true);
  const replay=createRepair();startRepair(replay);stepRepair(replay,{fire:true},.5);
  assert.equal(loadJourney(storage).completed,true,'replay cannot erase a banked ending');
});

test('repair is a safe separate simulation with no campaign resource writes',()=>{
  const j=parts(),before=structuredClone(j),s=createRepair();startRepair(s);runUntil(s,state=>state.phase==='ending');
  assert.deepEqual(j,before);assert.equal('hull' in s,false);assert.equal('score' in s,false);
  assert.throws(()=>stepRepair(s,{},1),RangeError);
});
