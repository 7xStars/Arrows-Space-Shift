import test from 'node:test';
import assert from 'node:assert/strict';
import { metricAt, spaceDistance, advanceThroughSpace, advanceProjectile, addFold, removeFold } from '../src/space.js';
import { createFlight, tick, readFlight, segmentNear, STEP, ROUTE_LENGTH } from '../src/simulation.js';
const fields = [{start:100,end:300,factor:0.5},{start:200,end:400,factor:0.5}];
const near = (actual,expected) => assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);
const run = (s,seconds,input={}) => { for(let i=0;i<Math.round(seconds/STEP);i++)tick(s,input); return s; };

test('overlapping fields preserve interval boundaries and multiply distance',()=>{
  assert.equal(metricAt(99,fields),1);
  assert.equal(metricAt(100,fields),0.5);
  assert.equal(metricAt(200,fields),0.25);
  assert.equal(metricAt(300,fields),0.5);
  assert.equal(metricAt(400,fields),1);
  assert.equal(spaceDistance(0,500,fields),325);
  assert.equal(spaceDistance(500,0,fields),-325);
});
test('movement crosses all field boundaries in both directions',()=>{
  near(advanceThroughSpace(0,150,fields),200);
  near(advanceThroughSpace(500,-150,fields),300);
  for(const from of [0,100,150,200,300,400,700]){
    for(const distance of [-600,-50,0,10,75,450]){
      const end=advanceThroughSpace(from,distance,fields);
      near(spaceDistance(from,end,fields),distance);
      near(advanceThroughSpace(end,-distance,fields),from);
    }
  }
});
test('movement is independent of simulation partition at a field boundary',()=>{
  const end=advanceThroughSpace(0,325,fields);
  let split=0;
  for(let i=0;i<325;i++)split=advanceThroughSpace(split,1,fields);
  near(split,end);
});
test('unfold restores geometry without reversing travel or damage',()=>{
  const s=createFlight('space');
  assert.equal(addFold(s),true);assert.equal(addFold(s),true);
  assert.equal(spaceDistance(120,1320,s.fields),300);
  s.z=500;s.hull=3;s.time=7;
  const latest=s.fields.at(-1).id;
  assert.equal(removeFold(s).id,latest);
  assert.equal(removeFold(s).id,latest-1);
  assert.equal(spaceDistance(120,1320,s.fields),1200);
  assert.equal(s.z,500);assert.equal(s.hull,3);assert.equal(s.time,7);
  assert.equal(removeFold(s),null);
});
test('fold stack is bounded and new fields use the current route position',()=>{
  const s=createFlight('space');s.z=200;
  for(let i=0;i<3;i++)assert.equal(addFold(s),true);
  assert.equal(addFold(s),false);
  assert.equal(s.fields[0].start,320);assert.equal(s.fields[0].end,1520);
  assert.equal(s.foldsUsed,3);
});
test('a folded region increases route progress at equal thrust and elapsed time',()=>{
  const open=createFlight('space'),folded=createFlight('space');
  open.z=300;folded.z=300;open.phase=folded.phase='running';
  folded.fields=[{id:1,start:0,end:1200,factor:0.5}];
  run(open,1);run(folded,1);
  near(open.z,390);near(folded.z,480);near(open.time,folded.time);
  assert.equal(open.thrust,folded.thrust);
});
test('folding does not accelerate the firing clock',()=>{
  const a=createFlight('space'),b=createFlight('space');a.phase=b.phase='running';
  b.fields=[{id:1,start:0,end:1200,factor:0.5}];
  run(a,0.5,{fire:true});run(b,0.5,{fire:true});
  assert.equal(a.shots.length,b.shots.length);assert.ok(a.shots.length>=3);
  near(a.time,b.time);
});
test('shots can hit an enemy between simulation endpoints',()=>{
  const s=createFlight();s.phase='running';
  s.enemies=[{id:0,x:0,z:100,hp:1,clock:100,escaped:false}];s.gates=[];
  run(s,0.2,{fire:true});assert.equal(s.kills,1);assert.equal(s.score,100);
  assert.equal(segmentNear(0,-20,0,20,2),true);
  assert.equal(segmentNear(30,-20,30,20,2),false);
});
test('gate crossing uses the opening and protects the ship after a hit',()=>{
  const s=createFlight();s.phase='running';s.z=1699;s.enemies=[];
  tick(s,{},0.1);assert.equal(s.hull,4);
  s.gates.push({z:s.z+1,gap:-200,width:100,checked:false});
  tick(s,{},0.1);assert.equal(s.hull,4);
  const safe=createFlight();safe.phase='running';safe.z=1699;safe.x=-140;safe.enemies=[];
  tick(safe,{},0.1);assert.equal(safe.hull,5);assert.equal(safe.score,25);
});
test('pause freezes the full flight state',()=>{
  const s=createFlight('space');s.phase='paused';const before=readFlight(s);
  run(s,2,{fire:true,horizontal:1,throttle:1});assert.deepEqual(readFlight(s),before);
});
test('hull loss and route completion terminate flight',()=>{
  const lost=createFlight();lost.phase='running';lost.hull=1;lost.z=1699;lost.enemies=[];
  tick(lost,{},0.1);assert.equal(lost.phase,'lost');
  const won=createFlight('space');won.phase='running';won.z=ROUTE_LENGTH-1;
  tick(won,{},0.1);assert.equal(won.phase,'won');assert.equal(won.z,ROUTE_LENGTH);
});

test('projectiles visibly accelerate in compressed space after projection',()=>{
  const field=[{start:0,end:2000,factor:0.5}];
  const open=advanceProjectile(300,68,[]);
  const folded=advanceProjectile(300,68,field);
  near(spaceDistance(300,open,[]),68);
  near(spaceDistance(300,folded,field),136);
  const incoming=advanceProjectile(800,-14.5,field);
  near(spaceDistance(800,incoming,field),-29);
});

test('projectile acceleration crosses boundaries without a step-size change',()=>{
  for(const distance of [-300,300]){
    const start=distance>0?0:500;
    let split=start;
    for(let i=0;i<300;i++)split=advanceProjectile(split,Math.sign(distance),fields);
    near(split,advanceProjectile(start,distance,fields));
  }
});

function trial({folds=0,incoming=false,unfoldAt=Infinity}={}){
  const s=createFlight('space');s.phase='running';
  s.fields=Array.from({length:folds},(_,i)=>({id:i+1,start:0,end:1800,factor:0.5}));
  if(incoming)s.enemyShots=[{x:0,z:800,vx:0}];
  else {s.enemies=[{id:0,x:0,z:800,hp:1,clock:999,escaped:false}];s.shots=[{x:0,z:25}];}
  for(let i=0;i<720;i++){
    if(s.time>=unfoldAt)while(s.fields.length)removeFold(s);
    tick(s,{});
    if(incoming?s.hull<5:s.kills>0)return s;
  }
  throw new Error('Trial did not resolve');
}

test('fold reward: the same shot reaches its target earlier',()=>{
  const open=trial(),folded=trial({folds:1});
  assert.ok(folded.time<open.time/2);
  assert.equal(open.score,100);assert.equal(folded.score,150);
  assert.equal(folded.foldBonus,50);
});

test('fold risk: the same incoming shot reaches the ship earlier',()=>{
  const open=trial({incoming:true}),folded=trial({incoming:true,folds:1});
  assert.ok(folded.time<open.time/2);
  assert.equal(folded.hull,4);
});

test('unfold buys reaction time but removes the pending kill bonus',()=>{
  const folded=trial({incoming:true,folds:1});
  const unfolded=trial({incoming:true,folds:1,unfoldAt:0.3});
  assert.ok(unfolded.time>folded.time+0.5);
  const kill=trial({folds:1,unfoldAt:0});
  assert.equal(kill.score,100);assert.equal(kill.foldBonus,0);
});

test('stacked folds increase the earned bonus without duplicate kill credit',()=>{
  const s=trial({folds:3});
  assert.equal(s.score,250);assert.equal(s.foldBonus,150);assert.equal(s.kills,1);
  run(s,0.1);assert.equal(s.score,250);assert.equal(s.kills,1);
});
