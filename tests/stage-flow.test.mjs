import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFlight} from '../src/simulation.js';
import {enterChapter,continueCampaign,CHAPTERS} from '../src/campaign.js';
import {checkpointFromFlight,validateCheckpoint} from '../src/storage.js';
import {autoAdvanceEligible,createStageClearClock,STAGE_CLEAR_SECONDS} from '../src/stage-flow.js';
import {BUILD} from '../src/build.js';

function clearedLevel(index=0){
 const s=createFlight('campaign',{seed:781});enterChapter(s,index);
 s.score=350; s.time=8; s.campaign.metrics.kills=3;
 s.phase='cleared';return s;
}
function runClock(clock,s,seconds){let fired=false;for(let n=0;n<Math.ceil(seconds*10);n++)fired=clock.tick(s,.1,{maxChapterIndex:BUILD.maxChapterIndex})||fired;return fired;}

test('ordinary level completion automatically advances after an unobstructed results interval',()=>{
 const s=clearedLevel(0),clock=createStageClearClock();
 assert.ok(autoAdvanceEligible(s,BUILD.maxChapterIndex));
 assert.equal(runClock(clock,s,STAGE_CLEAR_SECONDS-.3),false);
 assert.equal(s.campaign.index,0,'player still sees results briefly');
 assert.equal(runClock(clock,s,.5),true);
 assert.equal(clock.tick(s,.1,{maxChapterIndex:BUILD.maxChapterIndex}),false,'single automatic handoff per clear');
 assert.equal(validateCheckpoint(checkpointFromFlight(s)).chapterIndex,1,'reload already targets next level');
 assert.equal(continueCampaign(s),true);
 assert.equal(s.campaign.index,1);
 assert.equal(CHAPTERS[s.campaign.index].number,2);
 assert.equal(s.phase,'running');
 assert.equal(s.hull,5);
 assert.equal(s.score,350,'score is carried into next level');
 assert.equal(s.time,8,'run clock remains cumulative');
 assert.equal(clock.tick(s,.1,{maxChapterIndex:BUILD.maxChapterIndex}),false);
});

test('Act II ordinary route also advances without changing geometry, equipment or module state',()=>{
 const s=clearedLevel(9),clock=createStageClearClock();
 const initial=s.campaign.index;
 s.fleetProfile.fleetUnlocked=true;
 s.fleetProfile.driveParts=['klein-relay'];
 assert.equal(runClock(clock,s,STAGE_CLEAR_SECONDS+.2),true);
 assert.equal(continueCampaign(s),true);
 assert.equal(s.campaign.index,initial+1);
 assert.equal(CHAPTERS[s.campaign.index].act,2);
 assert.equal(CHAPTERS[s.campaign.index].kleinSurface,true);
});

test('pause-worthy dialogs and hidden tabs stop the countdown, never discard the result',()=>{
 const s=clearedLevel(1),clock=createStageClearClock();
 for(let i=0;i<100;i++)assert.equal(clock.tick(s,.1,{blocked:true,maxChapterIndex:BUILD.maxChapterIndex}),false);
 assert.ok(clock.remaining()>STAGE_CLEAR_SECONDS-.01);
 assert.equal(runClock(clock,s,STAGE_CLEAR_SECONDS+.2),true);
});

test('boss recoveries, practice, defeat, tutorial, last level and noncampaign modes do not auto advance',()=>{
 const clock=createStageClearClock();
 const boss=clearedLevel(8);boss.phase='won';
 const practice=clearedLevel(9);practice.practice=true;
 const defeated=clearedLevel(2);defeated.phase='lost';
 const final=clearedLevel(26);
 const tutorial=createFlight('campaign',{seed:781});tutorial.phase='cleared';
 const another=clearedLevel(2);another.mode='space';
 for(const s of [boss,practice,defeated,final,tutorial,another]){
  assert.equal(autoAdvanceEligible(s,BUILD.maxChapterIndex),false);
  assert.equal(runClock(clock,s,10),false);
 }
});

test('the live animation frame and result overlay use the same automatic continuation path',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/if\(stageClearClock\.tick\(flight,dt,[\s\S]*?\)\)advanceChapter\(\)/);
 assert.match(app,/function advanceChapter\(\)\{stageClearClock\.reset\(\)/);
 assert.match(app,/starts automatically in/);
 assert.match(app,/blocked:document\.hidden\|\|Boolean\(document\.querySelector\('dialog\[open\]'\)\)/);
});
