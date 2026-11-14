import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {enterChapter,CHAPTERS,tickWaveDirector,arenaY} from '../src/campaign.js';
import {addFold,removeFold,metricAt} from '../src/space.js';
import {revealFoldWake,foldRoutePace} from '../src/fold-wake.js';
import {combatReady} from '../src/combat-view.js';
import {recordStageResult,createFleetProfile} from '../src/fleet.js';
import {FlightRenderer} from '../src/renderer.js';

const make=(index=0,seed=2303)=>{const s=createFlight('campaign',{seed});enterChapter(s,index);s.phase='running';return s;};
const run=(s,seconds)=>{for(let i=0;i<Math.round(seconds/STEP);i++)tick(s,{horizontal:0,throttle:0,fire:false},STEP);};

test('folding speeds ordinary scrolling route and visibly advances the same-distance pace',()=>{
  const open=make(),folded=make();
  assert.equal(addFold(folded),true);
  run(open,5);run(folded,5);
  assert.ok(folded.cameraZ>open.cameraZ+120,{open:open.cameraZ,folded:folded.cameraZ});
  assert.equal(open.time,folded.time);
  assert.equal(foldRoutePace(open).leadSeconds,0);
  assert.ok(foldRoutePace(folded).leadSeconds>1);
});

test('late manual folds are placed ahead of the moving camera, not behind the ship',()=>{
  const s=make();s.drive.status='stable';run(s,15);
  const progress=s.cameraZ;
  assert.ok(progress>1250);
  assert.equal(addFold(s),true);
  assert.equal(s.fields[0].start,progress+120);
  const at=progress+140;
  assert.equal(metricAt(at,s.fields),.5);
});

test('fold wakes add visible, off-center enemy traffic with a safe entry interval',()=>{
  const s=make();addFold(s);
  const before=s.enemies.length,result=revealFoldWake(s);
  assert.deepEqual({enemies:result.enemies,asteroids:result.asteroids},{enemies:1,asteroids:0});
  assert.equal(s.enemies.length,before+1);
  const echo=s.enemies.at(-1);
  assert.equal(echo.foldWake,true);assert.ok(Math.abs(echo.x)>=200);
  assert.ok(arenaY(s,echo.z)>750);assert.equal(echo.hp,1);
  echo.presented=true;echo.visibleFor=1;
  assert.equal(combatReady(s,echo),false);
  s.time+=1.21;assert.equal(combatReady(s,echo),true);
});

test('fold depth progressively reveals asteroids and additional ships',()=>{
  const s=make(0);
  addFold(s);revealFoldWake(s);
  addFold(s);let result=revealFoldWake(s);
  assert.deepEqual({enemies:result.enemies,asteroids:result.asteroids},{enemies:1,asteroids:1});
  let rock=s.asteroids.at(-1);
  assert.equal(rock.foldWake,true);assert.ok(arenaY(s,rock.z)>750);
  addFold(s);result=revealFoldWake(s);
  assert.deepEqual({enemies:result.enemies,asteroids:result.asteroids},{enemies:2,asteroids:1});
  assert.equal(s.campaign.foldWakes.total,3);
  removeFold(s);addFold(s);
  assert.equal(revealFoldWake(s),null);
  assert.equal(s.campaign.foldWakes.total,3);
});

test('quiet asteroid belts reveal rocks on the first manual fold',()=>{
  const s=make(1);
  addFold(s);
  const before=s.asteroids.length;
  const result=revealFoldWake(s);
  assert.equal(result.asteroids,1);assert.equal(result.enemies,0);
  assert.equal(s.asteroids.length,before+1);
});

test('fold wake spawns deterministically for equal seed, section, and choices',()=>{
  const a=make(2,55),b=make(2,55);
  for(const s of [a,b]){addFold(s);revealFoldWake(s);addFold(s);revealFoldWake(s);}
  const shape=s=>({enemies:s.enemies.filter(e=>e.foldWake).map(e=>[e.id,e.x,e.z]),rocks:s.asteroids.filter(r=>r.foldWake).map(r=>[r.id,r.x,r.z,r.shape])});
  assert.deepEqual(shape(a),shape(b));
});

test('repeated toggles and late folds cannot farm extra wake waves',()=>{
  const s=make(2);addFold(s);assert.ok(revealFoldWake(s));
  removeFold(s);addFold(s);assert.equal(revealFoldWake(s),null);
  const old=s.campaign.foldWakes.total;
  s.cameraZ=CHAPTERS[2].routeLength*.92;
  addFold(s);assert.equal(revealFoldWake(s),null);assert.equal(s.campaign.foldWakes.total,old);
});

test('authored combat breaks never create wake hazards when folding',()=>{
  const s=make(12),c=CHAPTERS[12];
  s.cameraZ=c.routeLength*.22;tickWaveDirector(s);
  assert.equal(s.campaign.currentWave.kind,'break');
  const before=[s.enemies.length,s.asteroids.length];
  addFold(s);
  assert.equal(revealFoldWake(s),null);
  assert.deepEqual([s.enemies.length,s.asteroids.length],before);
});

test('boss and pre-flight tutorial do not generate fold wakes',()=>{
  const boss=make(8);addFold(boss);assert.equal(revealFoldWake(boss),null);
  const tutorial=make(-1);addFold(tutorial);assert.equal(revealFoldWake(tutorial),null);
});

test('best clear time is persistent but losses and old profiles remain safe',()=>{
  const p=createFleetProfile({});
  recordStageResult(p,{chapter:0,result:'cleared',time:51.3});
  recordStageResult(p,{chapter:0,result:'lost',time:8});
  recordStageResult(p,{chapter:0,result:'cleared',time:42.6});
  assert.equal(createFleetProfile(p).stageRecords[0].bestClearTime,42.6);
  assert.equal(createFleetProfile({stageRecords:{0:{completions:1,bestScore:300}}}).stageRecords[0].bestClearTime,null);
});

test('fold wakes render under full and reduced motion without changing collision state',()=>{
  const s=make(1);s.view={width:1000,height:780,topInset:100,bottomInset:70};
  addFold(s);revealFoldWake(s);
  const fake=new Proxy({measureText:x=>({width:String(x).length*7})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  for(const reducedMotion of [true,false]){
    const renderer=new FlightRenderer(fake,null,{reducedMotion});
    assert.doesNotThrow(()=>renderer.render(s,{width:1000,height:780,dt:1/60}));
  }
});
