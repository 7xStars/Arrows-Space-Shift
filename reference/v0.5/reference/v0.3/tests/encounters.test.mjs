import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {addFold,removeFold} from '../src/space.js';

function attempt(index,policy,{bonusEnabled=true,throttle=0}={}) {
  const s=createFlight('timing',{encounterIndex:index,bonusEnabled});s.phase='running';
  for(let i=0;i<1200 && s.phase==='running';i++) {
    const input=policy(s) || {};
    tick(s,{throttle,...input},STEP);
  }
  return s;
}
const foldAndFire=s=>{if(!s.fields.length)addFold(s);return {fire:true};};
const combined=s=>{
  if(!s.encounter.hit){if(!s.fields.length)addFold(s);return {fire:true};}
  removeFold(s);return {horizontal:1};
};

test('the timing course permits only one active fold',()=>{
  const s=createFlight('timing');assert.equal(addFold(s),true);assert.equal(addFold(s),false);
});
test('outgoing encounter requires a folded arrival even with continuous fire',()=>{
  for(const throttle of [-1,0,1]) {
    assert.equal(attempt(0,()=>({fire:true}),{throttle}).phase,'lost');
    const success=attempt(0,foldAndFire,{throttle});
    assert.equal(success.phase,'won');assert.ok(success.time>=0.55 && success.time<1.2);
    assert.equal(success.score,150);
  }
});
test('shield blocks early shots and the target has one legal opening',()=>{
  const s=attempt(0,foldAndFire);
  assert.ok(s.events.some(e=>e.type==='shield-block' && e.time<0.55));
  const hits=s.events.filter(e=>e.type==='target-hit');
  assert.equal(hits.length,1);assert.ok(hits[0].time>=0.55 && hits[0].time<1.2);
});
test('defensive encounter fails when kept folded, even at minimum thrust',()=>{
  for(const throttle of [-1,0,1]) {
    const s=attempt(1,()=>({horizontal:1}),{throttle});
    assert.equal(s.phase,'lost');assert.equal(s.hull,4);
  }
});
test('unfolding creates enough time to steer clear of the defensive salvo',()=>{
  for(const throttle of [-1,0,1]) {
    const s=attempt(1,s=>{removeFold(s);return {horizontal:1};},{throttle});
    assert.equal(s.phase,'won');assert.equal(s.hull,5);
  }
});
test('combined encounter rewards a hit followed by a defensive release',()=>{
  for(const bonusEnabled of [true,false]) {
    const s=attempt(2,combined,{bonusEnabled});
    assert.equal(s.phase,'won');assert.equal(s.hull,5);
    assert.equal(s.score,bonusEnabled?150:100);
    assert.equal(s.foldBonus,bonusEnabled?50:0);
    const types=s.events.map(e=>e.type);
    assert.ok(types.indexOf('target-hit')<types.indexOf('salvo'));
  }
});
test('combined encounter defeats always-open and always-folded policies',()=>{
  assert.equal(attempt(2,()=>({fire:true,horizontal:1})).phase,'lost');
  const folded=attempt(2,s=>{
    if(!s.fields.length)addFold(s);
    return {fire:true,horizontal:s.encounter.hit?1:0};
  });
  assert.equal(folded.phase,'lost');assert.equal(folded.encounter.hit,true);
});
test('score comparison changes rewards without changing encounter behavior',()=>{
  const on=attempt(2,combined),off=attempt(2,combined,{bonusEnabled:false});
  assert.equal(on.time,off.time);assert.equal(on.z,off.z);assert.equal(on.x,off.x);
  assert.equal(on.hull,off.hull);assert.equal(on.kills,off.kills);
  assert.deepEqual(on.enemyShots,off.enemyShots);assert.deepEqual(on.shots,off.shots);
});
test('encounter reset preserves options and restores its initial hazard',()=>{
  const s=createFlight('timing',{encounterIndex:1,bonusEnabled:false});
  assert.equal(s.encounterIndex,1);assert.equal(s.bonusEnabled,false);
  assert.equal(s.fields.length,1);assert.equal(s.enemyShots.length,1);
  assert.equal(s.time,0);assert.equal(s.encounter.hit,false);
});
