import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {CHAPTERS,enterChapter,arenaY,arenaZ,ACT_THREE_START_INDEX,ACT_THREE_BOSS_INDEX,chapter} from '../src/campaign.js';
import {createFleetProfile,unlockCurvatureSeed,recordStageResult,practiceChapters} from '../src/fleet.js';
import {createEcologyState,captureEchoes,releaseEchoes,queueEvolution,chooseEvolution,protectWithEcho,EVOLUTIONS} from '../src/ecology.js';
import {traceProjectiveSurface} from '../src/klein.js';
import {checkpointFromFlight,validateCheckpoint,restoreCheckpoint} from '../src/storage.js';
import {waveScriptFor} from '../src/waves.js';

const profile=()=>createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module'],selectedShip:8});
function third(index=18){const s=createFlight('campaign',{seed:73001,fleetProfile:profile()});enterChapter(s,index);s.phase='running';return s;}

test('Act I is retained and Act III supplies exactly eight lessons followed by one boss',()=>{
  assert.equal(CHAPTERS.length,27);assert.equal(ACT_THREE_START_INDEX,18);assert.equal(ACT_THREE_BOSS_INDEX,26);
  assert.deepEqual(CHAPTERS.slice(0,9).map(c=>c.name),['Two Sides','Quiet Belt','Counter Cycle','Loose Stones','Seven Operations','Drift Field','Front and Back','Last Approach','The Klein Fleet']);
});

test('Projective Module opens Act III without consuming the Klein Relay',()=>{
  const s=createFlight('campaign',{fleetProfile:profile(),seed:54,continueAt:18});
  assert.equal(s.campaign.index,18);assert.equal(s.fleetProfile.driveParts.includes('klein-relay'),true);
  assert.equal(s.fleetProfile.projectiveModule,true);assert.equal(s.projective?.echoes,0);
  assert.ok(waveScriptFor(chapter(s))?.waves?.length>=7);
});

test('every Act III lesson has recovery opportunities, old wave grammar and a culminating encounter',()=>{
  const names=new Set();
  for(const c of CHAPTERS.slice(18,26)){
    assert.equal(c.kind,'level');assert.equal(c.act,3);assert.equal(c.projectiveSurface,true);
    const script=waveScriptFor(c);assert.ok(script,`missing wave script ${c.name}`);
    assert.ok(script.waves.filter(w=>w.kind==='break'&&w.clearHostile).length>=3);
    assert.ok(script.waves.at(-1).members.some(m=>m.role==='miniboss'));
    names.add(c.waveScript);
  }
  assert.equal(names.size,8);
});

test('top and side crossings use their declared orientation changes',()=>{
  const top=traceProjectiveSurface({x:110,y:946},0,20);
  assert.equal(top.projectiveCrossings,1);assert.equal(top.twists,0);
  assert.equal(top.crossings[0].rule,'projective');assert.ok(Math.abs(top.x+110)<1e-9);
  const side=traceProjectiveSurface({x:397,y:200},15,0);
  assert.equal(side.twists,1);assert.equal(side.projectiveCrossings,0);
  assert.equal(side.crossings[0].rule,'klein');assert.ok(Math.abs(side.y-680)<1e-9);
});

test('Act III keeps its lower-half route position and forward scroll under Up and Down',()=>{
  const s=third();s.enemies=[];s.asteroids=[];s.enemyShots=[];s.shots=[];s.drops=[];
  s.z=arenaZ(s,160);
  for(let i=0;i<80;i++)tick(s,{horizontal:0,throttle:1,fire:false},STEP);
  assert.ok(Math.abs(arenaY(s,s.z)-160)<1e-4);
  const progress=s.cameraZ;
  for(let i=0;i<80;i++)tick(s,{horizontal:0,throttle:-1,fire:false},STEP);
  assert.ok(Math.abs(arenaY(s,s.z)-160)<1e-4);
  assert.equal(s.lastAxialInput,0);
  assert.ok(s.cameraZ>progress);
});

test('capture is bounded and costs proximity; release consumes echoes and shoots forward manually',()=>{
  const s=third(20);s.enemyShots=[];s.shots=[];
  s.enemyShots.push({x:s.x,z:s.z+24,vx:0,vz:-20,bornAt:s.time,owner:'enemy',sourceName:'Test Carrier',pattern:'fan'});
  s.enemyShots.push({x:275,z:s.z+500,vx:0,vz:-20,bornAt:s.time,owner:'enemy'});
  assert.equal(captureEchoes(s),1);assert.equal(s.projective.echoes,1);
  assert.equal(s.enemyShots[0].dead,true);assert.notEqual(s.enemyShots[1].dead,true);
  assert.equal(releaseEchoes(s),1);assert.equal(s.projective.echoes,0);
  assert.ok(s.shots.every(b=>b.owner==='player'&&b.vz>0&&b.echo));
  assert.equal(releaseEchoes(s),0,'echoes are not freely regenerated');
});

test('Echo Forge pauses on a recovery and rejects invalid or duplicate choices',()=>{
  const s=third(21);s.projective=createEcologyState();
  assert.equal(queueEvolution(s,'recovery-a'),true);assert.equal(s.phase,'choosing');
  assert.equal(s.projective.offers.length,3);assert.equal(queueEvolution(s,'recovery-a'),false);
  assert.equal(chooseEvolution(s,'not-real'),false);
  const chosen=s.projective.offers[0];assert.equal(chooseEvolution(s,chosen),true);
  assert.equal(s.phase,'running');assert.ok(s.projective.upgrades.includes(chosen));
  assert.equal(queueEvolution(s,'recovery-b'),true);
  const chosen2=s.projective.offers[0];assert.notEqual(chosen2,chosen);
  assert.equal(chooseEvolution(s,chosen2),true);assert.equal(queueEvolution(s,'recovery-c'),false);
  assert.equal(s.projective.upgrades.length,2);
});

test('Echo Orbit requires captured energy; Echo Ward spends two echoes to stop a hit',()=>{
  const s=third(24);s.projective=createEcologyState({upgrades:['echo-orbit','echo-ward'],echoes:2});
  const count=s.shots.length;
  s.projective.orbitClock=0;tick(s,{horizontal:0,throttle:0,fire:false},STEP);
  assert.ok(s.shots.length>=count+1);assert.equal(s.projective.echoes,1);
  s.projective.echoes=2;const shot={x:s.x,z:s.z};
  assert.equal(protectWithEcho(s,shot),true);assert.equal(s.projective.echoes,0);assert.equal(shot.dead,true);
  assert.equal(protectWithEcho(s,{x:0,z:0}),false);
});

test('Checkpoint retains earlier chosen build and remains recoverable',()=>{
  const s=third(23);s.projective=createEcologyState({upgrades:['split-echo','wide-net'],choiceCount:2,echoes:2});
  enterChapter(s,24);s.phase='running';
  const raw=checkpointFromFlight(s);assert.ok(raw);const checked=validateCheckpoint(raw);
  assert.deepEqual(checked.entry.projective.upgrades,['split-echo','wide-net']);
  const recovered=restoreCheckpoint(raw,s.fleetProfile);assert.equal(recovered.campaign.index,24);
  assert.deepEqual(recovered.projective.upgrades,['split-echo','wide-net']);
});

test('Curvature Seed is additive and final boss is flagged as experimental',()=>{
  const s=third(26);assert.equal(chapter(s).projectiveBoss,true);
  const p=s.fleetProfile;assert.equal(unlockCurvatureSeed(p),true);
  assert.deepEqual(p.driveParts,['klein-relay','projective-module','curvature-seed']);
  assert.equal(unlockCurvatureSeed(p),false);
  assert.equal(createFleetProfile(p).curvatureSeed,true);
});
