import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFlight} from '../src/simulation.js';
import {enterChapter,arenaZ,hybridProjectiveActive} from '../src/campaign.js';
import {playerJoinForecast} from '../src/geometry-cues.js';
import {makeDrop,collectDrop} from '../src/upgrades.js';
import {createStageClearClock} from '../src/stage-flow.js';
import {continueCampaign} from '../src/campaign.js';
import {BUILD} from '../src/build.js';

const chapterFlight=(index,seed=227)=>{const s=createFlight('campaign',{seed});enterChapter(s,index);s.phase='running';return s;};

test('result rendering defines the pace value in the result function, not just in HUD update',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const body=source.split('function updateCampaignUI(')[1]?.split('function resize(')[0];
  assert.ok(body,'the route results UI is present');
  assert.match(body,/const pace=foldRoutePace\(s\)/,'the stage-clear result renderer needs a local pace snapshot');
  assert.match(body,/const paceText=pace\?/);
});

test('clear clock is independent from gameplay simulation and can move an already-bankable level forward',()=>{
 const s=chapterFlight(4);s.phase='cleared';s.campaign.grade={letter:'B',score:73};
 const clock=createStageClearClock();
 let count=0;
 for(let i=0;i<40;i++)if(clock.tick(s,.1,{maxChapterIndex:BUILD.maxChapterIndex}))count++;
 assert.equal(count,1);
 assert.equal(continueCampaign(s),true);
 assert.equal(s.campaign.index,5);
 assert.equal(s.phase,'running');
});

test('projective player join arms only after 2.2-second hybrid transition break',()=>{
 const s=chapterFlight(17);s.campaign.introRemaining=0;s.x=125;s.z=arenaZ(s,915);s.facing=1;
 s.campaign.hybridPhase=3;s.campaign.phaseBreakUntil=s.time+2.2;
 assert.equal(hybridProjectiveActive(s),false);
 const before=playerJoinForecast(s,{horizontalVelocity:0,horizon:2});
 assert.equal(before?.edge,'top');assert.equal(before?.rule,'periodic');
 s.time+=2.2;
 assert.equal(hybridProjectiveActive(s),true);
 const after=playerJoinForecast(s,{horizontalVelocity:0,horizon:2});
 assert.equal(after?.rule,'projective');assert.equal(after?.destination.x,-125);
});

test('hybrid player topology in phase two remains Klein while the Antipodal Anchor demonstrates the change',()=>{
 const s=chapterFlight(17);s.campaign.introRemaining=0;s.x=125;s.z=arenaZ(s,915);s.facing=1;s.campaign.hybridPhase=2;
 assert.equal(hybridProjectiveActive(s),false);
 assert.equal(playerJoinForecast(s,{horizontalVelocity:0,horizon:2})?.rule,'periodic');
});

test('Act II duplicate seeds repair one lost hull after two pickups, only once per stage',()=>{
 const s=chapterFlight(10);s.hull=2;const initial=s.inventory.length;
 const collect=()=>collectDrop(s,makeDrop(s,0,0,'qa-duplicate',0,1));
 collect();assert.equal(s.hull,2);assert.equal(s.campaign.duplicateRepairSeeds,1);
 collect();assert.equal(s.hull,3);assert.equal(s.campaign.duplicateRepairUsed,true);
 for(let i=0;i<6;i++)collect();
 assert.equal(s.hull,3,'no infinite hull farming');assert.equal(s.score,35*8);
 assert.equal(s.inventory.length,initial,'duplicate does not create a seed tier');
 assert.equal(s.events.filter(e=>e.type==='duplicate-repair').length,1);
});

test('Act II duplicate repair stays available if collected at full hull, without granting a sixth point',()=>{
 const s=chapterFlight(9);s.hull=5;
 for(let i=0;i<2;i++)collectDrop(s,makeDrop(s,0,0,'qa',0,1));
 assert.equal(s.hull,5);assert.equal(s.campaign.duplicateRepairUsed,undefined);
 s.hull=4;collectDrop(s,makeDrop(s,0,0,'qa',0,1));
 assert.equal(s.hull,5);assert.equal(s.campaign.duplicateRepairUsed,true);
});

test('Act I duplicate pickups do not award hull repairs or extra score',()=>{
 const s=chapterFlight(6);s.hull=2;
 for(let i=0;i<4;i++)collectDrop(s,makeDrop(s,0,0,'qa',0,1));
 assert.equal(s.hull,2);assert.equal(s.score,0);assert.equal(s.campaign.duplicateRepairUsed,undefined);
});
