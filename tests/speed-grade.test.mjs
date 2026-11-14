import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {CHAPTERS,SCROLL_SPEED,enterChapter,calculateSpeedGrade,campaignAfterTick} from '../src/campaign.js';
import {addFold,advanceProjectile,spaceDistance} from '../src/space.js';
import {recordStageResult,createFleetProfile} from '../src/fleet.js';

const make=()=>{const s=createFlight('campaign',{seed:918});enterChapter(s,0);return s;};

test('speed curve rewards faster section times against a fixed open-space reference',()=>{
  const s=make(),reference=CHAPTERS[0].routeLength/SCROLL_SPEED;
  const samples=[1.2,1,.8,.6,.4,.3,.2].map(ratio=>{
    s.time=s.campaign.startedAt+reference*ratio;return calculateSpeedGrade(s);
  });
  assert.equal(samples[0].bonus,0);assert.equal(samples[1].bonus,0);
  assert.equal(samples.at(-1).bonus,1000);assert.equal(samples.at(-1).letter,'S');
  for(let i=1;i<samples.length;i++)assert.ok(samples[i].bonus>=samples[i-1].bonus);
  assert.equal(calculateSpeedGrade(s,{kind:'boss'}),null);
  assert.equal(calculateSpeedGrade(s,{kind:'tutorial'}),null);
});

test('clear bonus is awarded once after pending damage, and is part of the retained score',()=>{
  const s=make(),reference=CHAPTERS[0].routeLength/SCROLL_SPEED;
  s.time=s.campaign.startedAt+reference*.5;s.cameraZ=s.z=CHAPTERS[0].routeLength;
  s.score=250;s.debts=[{target:'player',due:s.time+1,amount:1}];
  campaignAfterTick(s);assert.equal(s.phase,'running');assert.equal(s.score,250);
  s.debts=[];campaignAfterTick(s);
  assert.equal(s.phase,'cleared');assert.ok(s.campaign.grade.speed.bonus>0);
  assert.equal(s.score,250+s.campaign.grade.speed.bonus);
  const score=s.score;campaignAfterTick(s);assert.equal(s.score,score);
  assert.equal(s.events.filter(e=>e.type==='speed-bonus').length,1);
  recordStageResult(s.fleetProfile,{chapter:0,result:'cleared',score:s.score,time:s.campaign.grade.speed.elapsed,grade:s.campaign.grade});
  const restored=createFleetProfile(JSON.parse(JSON.stringify(s.fleetProfile)));
  assert.equal(restored.stageRecords[0].bestScore,s.score);
  assert.equal(restored.stageRecords[0].bestClearTime,s.campaign.grade.speed.elapsed);
});

test('pausing adds no section time or speed penalty',()=>{
  const s=make();s.time+=3;const before=calculateSpeedGrade(s);
  s.phase='paused';for(let i=0;i<120;i++)tick(s,{horizontal:0,fire:true},STEP);
  assert.deepEqual(calculateSpeedGrade(s),before);
});

test('route completion uses the displayed route distance rather than the ship offset',()=>{
  const s=make(),length=CHAPTERS[0].routeLength;
  s.z=length+144;s.cameraZ=length-1;
  campaignAfterTick(s);assert.equal(s.phase,'running');
  s.cameraZ=length;campaignAfterTick(s);assert.equal(s.phase,'cleared');
});

test('one fold compresses the same route and gives identical travel gain in both shot directions',()=>{
  const s=make();addFold(s);
  const field=s.fields[0],from=field.start+200,to=field.start+400;
  assert.equal(spaceDistance(from,to,s.fields),100);
  assert.equal(advanceProjectile(from,25,s.fields)-from,100);
  assert.equal(to-advanceProjectile(to,-25,s.fields),100);
});
