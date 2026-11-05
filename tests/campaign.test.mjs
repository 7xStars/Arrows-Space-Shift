import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {CHAPTERS,enterChapter,continueCampaign,retryCampaign,arenaY,arenaZ,isBoss} from '../src/campaign.js';
import {presentEnemy,ENTRY_TIME,inCombatView} from '../src/combat-view.js';
import {addFold,removeFold} from '../src/space.js';
import {traceKlein,pathsHit,KLEIN_BOUNDS} from '../src/klein.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const run=(s,seconds,input={},present=true)=>{for(let i=0;i<Math.round(seconds/STEP);i++){if(present&&i%4===0)for(const enemy of s.enemies)presentEnemy(s,enemy);tick(s,input,STEP);}};
const setup=index=>{const s=createFlight('campaign',{seed:12345});enterChapter(s,index);return s;};
function finishWave(s){
  for(const e of s.enemies){if(e.hp<=0)continue;presentEnemy(s,e);e.visibleFor=ENTRY_TIME;e.hp=1;
    s.shots.push({x:e.x,z:arenaZ(s,arenaY(s,e.z)-10),vx:0,vz:680,payload:[]});}
  run(s,.05);
}
const finishRoute=s=>{s.cameraZ=CHAPTERS[s.campaign.index].routeLength-1;s.z=s.cameraZ;s.enemyShots=[];run(s,.05);};
test('The campaign contains eight numbered levels and a separate final battle',()=>{
  assert.equal(CHAPTERS.filter(c=>c.kind==='level').length,8);assert.equal(CHAPTERS.filter(c=>c.kind==='drill'||c.kind==='practice').length,0);assert.equal(CHAPTERS.at(-1).kind,'boss');
  assert.deepEqual(CHAPTERS.slice(0,8).map(c=>c.number),[1,2,3,4,5,6,7,8]);
  assert.deepEqual(CHAPTERS.filter(c=>c.kind==='level').map(c=>c.stage),[0,0,1,1,2,2,2,2]);
});
test('The route controls forward travel and ignores vertical input',()=>{
  const s=setup(0);run(s,.2);near(s.z,18);near(s.cameraZ,18);run(s,.2,{horizontal:1,throttle:1});assert.ok(s.x>0);near(s.z,s.cameraZ);assert.equal(s.facing,1);
  run(s,.1,{throttle:-1});near(s.z,s.cameraZ);assert.equal(s.facing,1);tick(s,{fire:true},STEP);assert.ok(s.shots.at(-1).vz>0);
});
test('Folding follows the campaign facing and unfolding restores the field stack',()=>{
  const s=setup(0);s.facing=-1;addFold(s);assert.ok(s.fields[0].end<s.z);assert.ok(removeFold(s));assert.equal(s.fields.length,0);
});
test('Scrolling levels finish at the route end rather than after the opening group',()=>{
  for(const index of [0,1,2,3,4,5,6,7]){
    const s=setup(index);s.enemies=[];run(s,.1);assert.equal(s.phase,'running');finishRoute(s);
    assert.equal(s.phase,'cleared');assert.equal(s.campaign.index,index);
  }
});
test('Continue enters the next scrolling route but cannot skip a running level',()=>{
  const s=setup(0);assert.equal(continueCampaign(s),false);finishRoute(s);assert.equal(continueCampaign(s),true);
  assert.equal(s.campaign.index,1);assert.ok(CHAPTERS[1].calm);assert.equal(s.phase,'running');assert.equal(continueCampaign(s),false);
});
test('Level 8 scrolls through a quieter asteroid belt before the boss',()=>{
  const s=setup(7);assert.ok(s.asteroids.length>s.enemies.length);run(s,.2);assert.ok(s.cameraZ>0);finishRoute(s);assert.equal(continueCampaign(s),true);assert.ok(isBoss(s));
});
test('Section transitions retain equipment and score but restore hull',()=>{
  const s=setup(0);finishRoute(s);s.hull=2;const score=s.score,key=s.equipped[0].key;
  continueCampaign(s);assert.equal(s.hull,5);assert.equal(s.score,score);assert.equal(s.equipped[0].key,key);
});
test('All even-numbered levels retain ordinary hull damage',()=>{
  for(const index of [1,3,5,7]){const s=setup(index);s.enemyShots=[{x:s.x,z:s.z+5,vx:0,vz:-145}];run(s,.1);assert.equal(s.hull,4);}
});
test('Even-numbered levels have no countdowns or target quotas',()=>{
  for(const index of [1,3,5,7]){const c=CHAPTERS[index];assert.equal(c.timeLimit,undefined);assert.equal(c.targetCount,undefined);const s=setup(index);s.enemies=[];s.asteroids=[];run(s,46);assert.equal(s.phase,'cleared');assert.ok(!s.events.some(e=>e.type==='drill-timeout'));}
});
test('Pause freezes route time and retry restores its checkpoint',()=>{
  const s=setup(1);run(s,2,{},false);s.phase='paused';const time=s.time;run(s,4);assert.equal(s.time,time);
  s.phase='lost';s.hull=1;s.campaign.defeated=2;retryCampaign(s);assert.equal(s.time-s.campaign.startedAt,0);assert.equal(s.campaign.defeated,0);assert.equal(s.hull,5);
});
test('Carriers are distributed through each route and missed carriers cannot stall its exit',()=>{
  for(const index of [0,2,4,6]){const s=setup(index),c=CHAPTERS[index];assert.equal(s.enemies.length,c.carriers);assert.ok(Math.max(...s.enemies.map(e=>e.z))>c.routeLength*.8);finishRoute(s);assert.equal(s.phase,'cleared');assert.ok(s.enemies.every(e=>!e.escaped));}
});
test('Folding increases route progress and even-numbered levels also scroll',()=>{
  const a=setup(0),b=setup(0);a.enemies=[];b.enemies=[];addFold(b);run(a,3);run(b,3);assert.ok(b.cameraZ>a.cameraZ);
  const p=setup(7);run(p,1);assert.ok(p.cameraZ>0);
});
test('Retry restores the section checkpoint without restarting the campaign',()=>{
  const s=setup(4),score=s.score;s.score+=900;s.hull=0;s.phase='lost';s.fields=[{start:0,end:100,factor:.5}];
  retryCampaign(s);assert.equal(s.campaign.index,4);assert.equal(s.hull,5);assert.equal(s.score,score);assert.equal(s.phase,'running');assert.equal(s.fields.length,0);
});
test('Seven-operation sections issue a complete test kit and open two slots',()=>{
  const s=setup(4);assert.equal(s.slotCount,2);assert.equal(new Set(s.inventory.map(seed=>seed.type)).size,7);assert.equal(s.inventory.length,14);
});
test('Right-to-left wrapping reverses vertical position and remaining vertical movement',()=>{
  const r=traceKlein({x:390,y:200},30,10);near(r.x,-380);near(r.y,670);assert.equal(r.twists,1);assert.equal(r.crossings[0].edge,'right');assert.equal(r.segments.length,2);
});
test('Left-to-right wrapping has the same inverse identification',()=>{
  const r=traceKlein({x:-390,y:400},-30,5);near(r.x,380);near(r.y,475);assert.equal(r.crossings[0].edge,'left');
});
test('Top and bottom wrapping preserve the horizontal coordinate',()=>{
  const top=traceKlein({x:80,y:940},0,30),bottom=traceKlein({x:-30,y:-60},0,-30);
  near(top.x,80);near(top.y,-50);near(bottom.x,-30);near(bottom.y,930);assert.equal(top.twists,0);
});
test('Two horizontal circuits restore orientation',()=>{
  const r=traceKlein({x:0,y:200},1600,20);near(r.x,0);near(r.y,220);assert.equal(r.twists,2);
});
test('Corner crossings and large movements remain finite and inside the chart',()=>{
  for(const [dx,dy] of [[800,1020],[1600,-2040],[50000,6000],[-2400,3060]]){
    const r=traceKlein({x:0,y:440},dx,dy);assert.ok(Number.isFinite(r.x)&&Number.isFinite(r.y));assert.ok(r.x>=-400&&r.x<=400&&r.y>=-70&&r.y<=950);
  }
});
test('A wrapped path does not collide through the intervening center',()=>{
  const r=traceKlein({x:390,y:200},30,10),center=[{from:{x:0,y:440},to:{x:0,y:440},t0:0,t1:1}];
  assert.equal(pathsHit(r.segments,center,18,KLEIN_BOUNDS),false);
  const landing=[{from:{x:-390,y:673},to:{x:-390,y:673},t0:0,t1:1}];assert.equal(pathsHit(r.segments,landing,18,KLEIN_BOUNDS),true);
});
test('Neighboring images collide consistently across the identified edges',()=>{
  const a=[{from:{x:395,y:200},to:{x:395,y:200},t0:0,t1:1}],b=[{from:{x:-395,y:680},to:{x:-395,y:680},t0:0,t1:1}];
  assert.equal(pathsHit(a,b,12),false);assert.equal(pathsHit(a,b,12,KLEIN_BOUNDS),true);
});
test('Boss enemies retain health and equipment after an edge crossing',()=>{
  const s=setup(8),e=s.enemies[0],equipment=structuredClone(e.equipped);e.x=395;e.z=arenaZ(s,200);e.driftX=100;e.driftY=30;
  tick(s,{},.1);near(e.x,-395);near(arenaY(s,e.z),677);assert.equal(e.hp,24);assert.deepEqual(e.equipped,equipment);assert.equal(e.driftY,-30);assert.ok(!e.escaped);
  assert.ok(s.events.some(event=>event.type==='klein-crossing'&&event.actor===`enemy-${e.id}`));
});
test('The player follows the same map and orientation rule',()=>{
  const s=setup(8);s.x=390;s.z=arenaZ(s,200);tick(s,{horizontal:1},.1);near(s.x,-380);near(arenaY(s,s.z),680);assert.equal(s.facing,-1);assert.ok(Array.isArray(s.gates));
});
test('Boss projectiles wrap, retain damage, and reverse vertical velocity on a side crossing',()=>{
  const s=setup(8);s.shots=[{x:390,z:arenaZ(s,200),vx:300,vz:100,damage:2,payload:[0],bornAt:0}];tick(s,{},.1);
  const shot=s.shots[0];near(shot.x,-380);near(arenaY(s,shot.z),670);assert.equal(shot.vz,-100);assert.equal(shot.damage,2);assert.deepEqual(shot.payload,[0]);
});
test('Boss projectile lifetimes prevent an unlimited bullet accumulation',()=>{
  const s=setup(8);s.shots=[{x:0,z:arenaZ(s,200),vx:300,vz:100,payload:[],bornAt:0}];run(s,5.2,{},false);assert.equal(s.shots.length,0);assert.equal(s.phase,'running');
});
test('Leaving the frame cannot end the boss battle',()=>{
  const s=setup(8);for(const e of s.enemies){e.x=399;e.driftX=200;}tick(s,{},.1);assert.equal(s.phase,'running');assert.equal(s.enemies.filter(e=>e.hp>0).length,3);
});
test('Boss victory requires destruction of the core and both escorts',()=>{
  const s=setup(8);assert.ok(isBoss(s));for(const e of s.enemies){e.driftX=0;e.driftY=0;}
  s.enemies[0].hp=0;s.enemies[1].hp=0;run(s,.1);assert.equal(s.phase,'running');
  finishWave(s);assert.equal(s.phase,'won');assert.ok(s.events.some(e=>e.type==='campaign-complete'));
});
test('An unpresented boss cannot take an invisible hit',()=>{
  const s=setup(8),e=s.enemies[0];e.driftX=0;e.driftY=0;s.shots=[{x:e.x,z:e.z-10,vx:0,vz:680,payload:[]}];run(s,.05,{},false);assert.equal(e.hp,24);
});
test('Normal player shots can defeat the full-health core in a stationary firing fixture',()=>{
  const s=setup(8),core=s.enemies[0];for(const e of s.enemies){e.driftX=0;e.driftY=0;}
  assert.equal(core.hp,24);run(s,5.5,{fire:true});assert.equal(core.hp,0);assert.equal(core.destroyed,true);
  assert.equal(s.enemies.filter(e=>e.hp>0).length,2);assert.equal(s.phase,'running');
});
test('A fold change that remaps a boss ship requires a fresh visible entry',()=>{
  const s=setup(8);for(let i=0;i<3;i++)addFold(s);const e=s.enemies[0];e.z=arenaZ(s,900);e.presented=true;e.visibleFor=ENTRY_TIME;
  s.fields=[];tick(s,{},STEP);assert.equal(e.presented,false);assert.equal(e.visibleFor,0);assert.equal(e.hp,24);
});

