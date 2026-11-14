import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTERS,enterChapter,tickWaveDirector,calculateStageGrade} from '../src/campaign.js';
import {createFlight} from '../src/simulation.js';
import {ACT_TWO_WAVE_SCRIPTS,compileWaveScript} from '../src/waves.js';
import {preparePattern} from '../src/boss.js';

const ACT_ONE_NAMES=['Two Sides','Quiet Belt','Counter Cycle','Loose Stones','Seven Operations','Drift Field','Front and Back','Last Approach','The Klein Fleet'];

test('Act I chapter order remains unchanged',()=>{
  assert.deepEqual(CHAPTERS.slice(0,9).map(c=>c.name),ACT_ONE_NAMES);
});

test('Seam Gap and Cross Current use authored combat and recovery waves',()=>{
  for(const id of ['seam-gap','cross-current']){
    const script=ACT_TWO_WAVE_SCRIPTS[id];
    assert.ok(script);
    assert.ok(script.waves.some(w=>w.kind==='break'));
    assert.ok(script.waves.some(w=>w.kind==='miniboss'));
    const compiled=compileWaveScript({waveScript:id},()=>.5);
    assert.ok(compiled.enemies.length>0);
    assert.ok(compiled.waves.length>=6);
    assert.equal(new Set(compiled.enemies.map(e=>e.waveId)).size,compiled.waves.filter(w=>w.kind!=='break').length);
  }
});

test('entering authored Act II stage compiles stable wave metadata',()=>{
  const s=createFlight('campaign',{fleetProfile:{fleetUnlocked:true,driveParts:['klein-relay'],unlockedShips:[0,1,8],selectedShip:0}});
  enterChapter(s,13);
  assert.equal(CHAPTERS[13].name,'Cross Current');
  assert.ok(s.campaign.wavePlan.length>=6);
  assert.ok(s.enemies.every(e=>e.waveId&&Number.isFinite(e.activationAt)));
  assert.ok(s.enemies.some(e=>e.linkGroup==='cross-current-pair'));
});

test('wave director starts authored wave without activating future waves',()=>{
  const s=createFlight('campaign',{fleetProfile:{fleetUnlocked:true,driveParts:['klein-relay'],unlockedShips:[0,1,8],selectedShip:0}});
  enterChapter(s,12);
  s.cameraZ=CHAPTERS[12].routeLength*.13;
  tickWaveDirector(s);
  const active=s.enemies.filter(e=>e.waveActive!==false);
  const future=s.enemies.filter(e=>e.activationAt>.4);
  assert.ok(active.length>0);
  assert.ok(future.every(e=>e.waveActive===false));
});

test('parameterized pattern grammar retains named family and authored size',()=>{
  const enemy={patternRole:'gap',patternCycle:0,patternConfig:{count:5,beats:3,gapWidth:2,gapMotion:1,recovery:2.4},firePeriod:2};
  const p=preparePattern(enemy,{vx:0,vz:-160});
  assert.equal(p.patternKey,'gap');
  assert.equal(p.beatCount,3);
  assert.equal(p.patternVolleys.length,3);
  assert.equal(p.patternVolleys[0].length,5);
  assert.equal(p.patternRecovery,2.4);
});

test('stage grading exposes stable components and a letter',()=>{
  const s={hull:4,enemies:[{},{},{}],campaign:{defeated:2,metrics:{grazes:3,seamCrossings:3,folds:1,unfolds:1}}};
  const grade=calculateStageGrade(s,{kleinSurface:true,lesson:'global-gap'});
  assert.ok(['S','A','B','C','D','E'].includes(grade.letter));
  assert.ok(grade.score>=0&&grade.score<=100);
  for(const key of ['survival','execution','precision','topology','control'])assert.ok(Number.isInteger(grade[key]));
});
