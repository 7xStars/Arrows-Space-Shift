import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {addFold,removeFold,advanceThroughSpace} from '../src/space.js';
import {auditTournament,counters,commonCounters,makeDrop,collectDrop,warpSide,warpIncoming,rotateDisplacement} from '../src/upgrades.js';

const active=()=>{const s=createFlight('warp-lab');s.phase='running';s.countdown=0;s.drops=[];s.labWave=999;return s;};
const run=(s,seconds,input={})=>{for(let i=0;i<Math.round(seconds/STEP);i++)tick(s,input,STEP);};
test('The three-node graph counters every single operation',()=>{
  const a=auditTournament(1);assert.equal(a.valid,true);assert.equal(a.edges.length,3);assert.equal(a.witnesses.length,3);
  assert.ok(counters(0,1)&&counters(1,3)&&counters(3,0));
});
test('The seven-node graph gives all 21 pairs an outside counter',()=>{
  const a=auditTournament(2);assert.equal(a.valid,true);assert.equal(a.edges.length,21);assert.equal(a.witnesses.length,21);
  for(const w of a.witnesses){assert.equal(w.counters.length,1);assert.ok(!w.set.includes(w.counters[0]));}
  assert.deepEqual(commonCounters([0,1],2),[6]);
});
test('The expanded graph preserves the initial cycle',()=>{
  assert.ok(auditTournament(1).edges.every(([a,b])=>auditTournament(2).edges.some(([x,y])=>a===x&&b===y)));
});
test('Collection and folding have different results in the same final space',()=>{
  const a=active(),b=active();const da=makeDrop(a,0,0),db=makeDrop(b,0,0);
  collectDrop(a,da);addFold(a);addFold(b);collectDrop(b,db);
  assert.deepEqual(a.fields,b.fields);assert.equal(a.x,b.x);assert.equal(a.z,b.z);
  assert.equal(warpSide(a),-1);assert.equal(warpSide(b),1);
  removeFold(a);assert.equal(warpSide(a),1);assert.equal(a.upgrade.imprint,1);
  addFold(a);assert.equal(warpSide(a),-1);assert.equal(a.upgrade.imprint,1);
});
test('A seed is consumed once',()=>{
  const s=active(),d=makeDrop(s,0,0);assert.equal(collectDrop(s,d),true);assert.equal(collectDrop(s,d),false);
  assert.equal(s.upgradeSerial,1);
});
test('Position Warp preserves radial distance for both sides',()=>{
  for(const side of [-1,1]){const r=rotateDisplacement(60,100,side);assert.equal(Math.hypot(r.x,r.z),Math.hypot(60,100));}
});
test('A warp preserves velocity and never converts the shot to a player shot',()=>{
  const s=active();collectDrop(s,makeDrop(s,0,0));
  const shot={x:60,z:100,vx:-12};const paths=warpIncoming(s,shot,{x:60,z:100},{x:0,z:0},STEP);
  assert.equal(paths.length,2);assert.equal(shot.vx,-12);assert.equal(shot.warped,true);assert.equal(s.shots.length,0);
  assert.equal(warpIncoming(s,shot,{...shot},{x:0,z:0},STEP),null);assert.equal(s.warpCount,1);
});
test('Warp landing does not sweep a collision through the ship',()=>{
  const s=active();collectDrop(s,makeDrop(s,0,0));s.enemyShots=[{x:0,z:150,vx:0}];
  run(s,STEP);assert.equal(s.hull,5);assert.equal(s.warpCount,1);
});
test('A warped shot can still damage the ship on its remaining path',()=>{
  const s=active();collectDrop(s,makeDrop(s,0,0));s.enemyShots=[{x:0,z:155,vx:0}];
  run(s,STEP);const shot=s.enemyShots[0];assert.ok(shot.warped);
  s.x=shot.x;s.z=shot.z-30;run(s,.2);assert.equal(s.hull,4);
});
test('A marked enemy drops a seed that can be collected through flight',()=>{
  const s=createFlight('upgrades');s.phase='running';
  run(s,1,{fire:true});assert.equal(s.kills,1);assert.equal(s.drops.length,1);
  run(s,4.1);assert.equal(s.upgrade?.id,'position-warp');assert.equal(s.upgrade.imprint,1);
});
test('Folding and unfolding do not swap the ship lane',()=>{
  const s=active();s.x=-120;addFold(s);run(s,3);assert.equal(s.x,-120);removeFold(s);run(s,2);assert.equal(s.x,-120);
});
test('A fresh lab has no retained upgrade or warped shots',()=>{
  const s=active();collectDrop(s,makeDrop(s,0,0));run(s,1);
  const fresh=createFlight('warp-lab');assert.equal(fresh.upgrade,null);assert.equal(fresh.warpCount,0);assert.equal(fresh.drops.length,1);
});
test('Opposite collection orders move the same shot to opposite sides',()=>{
  const shots=[];
  for(const foldFirst of [false,true]){
    const s=active();s.z=300;const d=makeDrop(s,0,300);
    if(foldFirst)addFold(s);collectDrop(s,d);if(!foldFirst)addFold(s);
    s.enemyShots=[{x:60,z:advanceThroughSpace(s.z,100,s.fields),vx:0}];run(s,STEP);shots.push(s.enemyShots[0]);
  }
  assert.ok(shots[0].x<0);assert.ok(shots[1].x>0);
});
test('Warp side changes damage during the same planned movement',()=>{
  for(const direction of [-1,1]){
    const hull=[];
    for(const side of [-1,1]){
      const s=active();if(side===-1)addFold(s);collectDrop(s,makeDrop(s,0,0));if(side===-1)removeFold(s);
      s.enemyShots=[{x:-direction*70,z:100,vx:0}];
      run(s,.5,{horizontal:direction});hull.push(s.hull);
    }
    assert.deepEqual(hull,direction===-1?[4,5]:[5,4]);
  }
});
