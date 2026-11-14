import test from 'node:test';
import assert from 'node:assert/strict';
import {actFourProgress,createActFour,restoreActFour,rememberActFourStage,recordActFourClear,
  startActFour,stepActFour,actFourAction} from '../src/hyperbolic-campaign.js';

const roundTrip=value=>JSON.parse(JSON.stringify(value));

test('Act IV retry and reload restore stage-entry score, echoes and seed',()=>{
  let progress=actFourProgress(null),first=createActFour(0,{seed:2026});
  progress=rememberActFourStage(progress,first);
  first.phase='cleared';first.score=290;first.echoes=3;
  progress=recordActFourClear(progress,first);
  const stage=restoreActFour(roundTrip(progress));
  assert.equal(stage.stageIndex,1);assert.equal(stage.score,290);
  assert.equal(stage.echoes,3);assert.equal(stage.seed,2026);
  stage.phase='lost';stage.score=900;stage.echoes=0;
  const retry=restoreActFour(progress,stage.stageIndex);
  assert.equal(retry.score,290);assert.equal(retry.echoes,3);
  assert.equal(retry.player.hull,5);
  assert.deepEqual(recordActFourClear(progress,stage),progress,'defeat cannot bank attempt rewards');
});

test('Act IV replay keeps its original resources and cannot replace frontier rewards',()=>{
  const first=createActFour(0,{seed:33});
  let progress=rememberActFourStage(null,first);
  first.phase='cleared';first.score=255;first.echoes=2;
  progress=recordActFourClear(progress,first);
  const replay=restoreActFour(progress,0);
  assert.equal(replay.score,0);assert.equal(replay.echoes,0);
  progress=rememberActFourStage(progress,replay);
  assert.equal(restoreActFour(roundTrip(progress)).stageIndex,0,'reload resumes the selected replay');
  replay.phase='cleared';replay.score=10000;replay.echoes=6;
  const after=recordActFourClear(progress,replay);
  assert.deepEqual(after,progress);
  assert.equal(restoreActFour(after,1).score,255);assert.equal(restoreActFour(after,1).echoes,2);
  assert.equal(restoreActFour(after,2),null,'locked stages stay locked');
});

test('Act IV old saves retain their latest score and reject invalid entry resources',()=>{
  const legacy=actFourProgress({version:1,unlocked:4,score:600,completed:false});
  assert.equal(restoreActFour(legacy).score,600);
  assert.equal(restoreActFour(legacy).stageIndex,4);
  assert.equal(restoreActFour(legacy,1).score,0,'unknown old replay scores are not invented');
  const malformed=actFourProgress({...legacy,version:2,resumeStage:9,entries:{
    4:{score:800,echoes:7,seed:2},5:{score:800,echoes:2,seed:2},
    1:{score:10,echoes:2,seed:-1}}});
  assert.deepEqual(malformed.entries,{});
  assert.equal(malformed.resumeStage,4);
});

test('Act IV pause blocks simulation and actions without losing the attempt',()=>{
  const s=createActFour(4,{echoes:2});startActFour(s);s.paused=true;
  const before=structuredClone(s);
  stepActFour(s,{fire:true,turn:1,drive:1},.5);
  for(const action of ['fire','fold','capture','release'])assert.equal(actFourAction(s,action),false);
  assert.deepEqual(s,before);
  s.paused=false;stepActFour(s,{fire:true},.1);
  assert.ok(s.time>0);assert.ok(s.shots.length>0);
});

test('Act IV final clear retains the boss entry and does not award drive repair',()=>{
  let progress=actFourProgress({version:1,unlocked:8,score:1700,completed:false});
  const boss=restoreActFour(progress);
  progress=rememberActFourStage(progress,boss);
  boss.phase='won';boss.score=2100;
  assert.equal(recordActFourClear(progress,boss).unlocked,8,'a phase flag alone cannot bank the final stage');
  boss.finalReward={id:'hyperbolic-core',state:'extracted',exposedAt:10,collectedAt:11,extractedAt:12};
  const complete=recordActFourClear(progress,boss);
  assert.equal(complete.unlocked,9);assert.equal(complete.completed,true);assert.equal(complete.score,2100);
  const replay=restoreActFour(roundTrip(complete));
  assert.equal(replay.stageIndex,8);assert.equal(replay.score,1700);
  assert.equal(complete.driveAssembled,undefined);assert.equal(complete.campaignCompleted,undefined);
});

test('Act IV fire events identify real shots and stay silent when the shot pool is full',()=>{
  const s=createActFour();startActFour(s);
  assert.equal(actFourAction(s,'fire'),true);
  assert.equal(s.events.find(e=>e.type==='fire').shotId,s.shots[0].id);
  const source=s.shots[0];
  s.shots=Array.from({length:125},(_,i)=>({...source,id:i+1,position:{x:0,y:-.6},heading:{x:0,y:1}}));
  s.shotId=125;s.player.fireClock=0;
  const fireEvents=s.events.filter(e=>e.type==='fire').length;
  assert.equal(actFourAction(s,'fire'),true,'the existing fire cooldown behavior remains');
  assert.equal(s.shots.length,125);
  assert.equal(s.events.filter(e=>e.type==='fire').length,fireEvents);
  for(const enemy of s.enemies)enemy.gunClock=0;
  stepActFour(s,{},1/90);
  assert.equal(s.events.filter(e=>e.type==='enemy-volley').length,0);
});
