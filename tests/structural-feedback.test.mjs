import test from 'node:test';
import assert from 'node:assert/strict';
import {StructuralFeedback,damageResponse,mechanicalImpulse} from '../src/structural-feedback.js';

const state=()=>({phase:'running',paused:false,time:0,x:12,z:80,events:[]});
test('a real manual-fire event drives a decorative response without changing simulation data',()=>{
  const s=state(),feedback=new StructuralFeedback();s.events.push({type:'player-fire',time:0});
  const before=structuredClone(s);feedback.update(s);assert.deepEqual(s,before);
  s.time=.08;const sample=feedback.update(s);assert.ok(sample.recoilPixels>0);assert.equal(sample.collisionOffset,0);
  assert.equal(s.x,12);assert.equal(s.z,80);
});
test('rendered mechanical response is bounded under repeated fire',()=>{
  const s=state(),feedback=new StructuralFeedback();
  for(let i=0;i<500;i++){s.time=i/120;s.events.push({type:'player-fire',time:s.time});s.events=s.events.slice(-12);
    const sample=feedback.update(s,{shipId:i%2?1:3});assert.ok(Number.isFinite(sample.recoilPixels));assert.ok(Math.abs(sample.recoilPixels)<=2.8);}
});
test('closed-form settling preserves the result across frame intervals',()=>{
  function run(steps){const s=state(),feedback=new StructuralFeedback();s.events.push({type:'player-fire',time:0});feedback.update(s);
    let sample;for(const dt of steps){s.time+=dt;sample=feedback.update(s);}return sample.recoilPixels;}
  assert.ok(Math.abs(run([.08])-run(Array(8).fill(.01)))<1e-10);
});
test('reduced motion retains a static damage signal with a fixed collision offset',()=>{
  const s=state(),feedback=new StructuralFeedback();s.events.push({type:'player-fire',time:0},{type:'damage',time:0});
  feedback.update(s);s.time=.08;const value=feedback.update(s,{reducedMotion:true});
  assert.equal(value.recoilPixels,0);assert.equal(value.damage,.42);assert.equal(value.collisionOffset,0);
});
test('forecast events do not produce physical response and retry clears old response',()=>{
  const s=state(),feedback=new StructuralFeedback();s.events.push({type:'damage',time:0,isPhysical:false},{type:'player-fire',time:0,forecast:true});
  feedback.update(s);s.time=.1;assert.equal(feedback.update(s).recoilPixels,0);
  s.events.push({type:'damage',time:.1});assert.ok(feedback.update(s).damage>0);
  s.time=0;assert.equal(feedback.update(s).damage,0);
});
test('coupled damage response rises briefly before it decays',()=>{
  assert.ok(damageResponse(.08)>damageResponse(0));assert.ok(damageResponse(.48)<damageResponse(.08));
  assert.equal(damageResponse(-1),0);assert.equal(damageResponse(1),0);
});
test('a heavy decorative response settles on a different time scale without changing its anchor',()=>{
  assert.ok(mechanicalImpulse(.1)>mechanicalImpulse(.1,true));
  assert.ok(mechanicalImpulse(.5,true)>mechanicalImpulse(.5));
  assert.equal(mechanicalImpulse(-1),0);assert.equal(mechanicalImpulse(3),0);
});
