import test from 'node:test';
import assert from 'node:assert/strict';
import {traceKlein,traceProjectiveSurface,pathsHit} from '../src/klein.js';
import {MATRIX_MODELS as M,MOTION_PROFILES,multiply2,apply2,subtract2,commutator2,vectorNorm2,matrixNorm2,spectralRadius2,
  operatorTrajectory,stepMechanical,mechanicalEnergy,sampleMechanical,TOPOLOGY_BOUNDS,advanceTopology,forecastTopology} from '../src/operator-models.js';

const close=(actual,expected,tolerance=1e-10)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} differs from ${expected}`);
const closeState=(actual,expected,tolerance=1e-10)=>{close(actual.position,expected.position,tolerance);close(actual.velocity,expected.velocity,tolerance);};

test('the projection and swap satisfy their stated finite matrix identities',()=>{
  assert.deepEqual(multiply2(M.projection,M.projection),M.projection);
  assert.deepEqual(multiply2(M.swap,M.swap),M.identity);
  assert.deepEqual(multiply2(multiply2(M.swap,M.projection),M.swap),subtract2(M.identity,M.projection));
  assert.deepEqual(commutator2(M.projection,M.swap),[[0,1],[-1,0]]);
  assert.notDeepEqual(apply2(multiply2(M.projection,M.swap),[2,3]),apply2(multiply2(M.swap,M.projection),[2,3]));
});

test('matrix products apply the rightmost operator first without changing the inputs',()=>{
  const a=Object.freeze([Object.freeze([2,1]),Object.freeze([0,3])]),b=Object.freeze([Object.freeze([0,-1]),Object.freeze([1,0])]),v=Object.freeze([4,-2]);
  assert.deepEqual(apply2(multiply2(a,b),v),apply2(a,apply2(b,v)));
  assert.deepEqual(v,[4,-2]);assert.deepEqual(a,[[2,1],[0,3]]);
});

test('spectral radius and induced Euclidean norm remain distinct for the coupled example',()=>{
  close(spectralRadius2(M.coupled),.6);close(spectralRadius2(M.decay),.6);
  close(matrixNorm2(M.identity),1);close(matrixNorm2([[0,-2],[2,0]]),2);close(spectralRadius2([[0,-2],[2,0]]),2);
  assert.ok(matrixNorm2(M.coupled)>2);close(vectorNorm2([3,4]),5);
  close(matrixNorm2([[0,0],[0,0]]),0);close(spectralRadius2([[0,0],[0,0]]),0);
});

test('the stated stable matrix has transient growth and eventual decay for the stated vector',()=>{
  const coupled=operatorTrajectory(M.coupled,[0,1],48),uncoupled=operatorTrajectory(M.decay,[0,1],48);
  assert.ok(coupled[1].norm>2);assert.ok(coupled[2].norm>coupled[1].norm);
  assert.ok(coupled.at(-1).norm<1e-7);
  assert.ok(uncoupled.every((sample,index)=>index===0||sample.norm<uncoupled[index-1].norm));
  for(const sample of coupled.slice(1)){
    close(sample.value[0],2*sample.step*.6**(sample.step-1),1e-11);
    close(sample.value[1],.6**sample.step,1e-12);
  }
});

test('the critical response agrees with its closed form',()=>{
  const t=.37,response=stepMechanical({position:0,velocity:0},1,t,MOTION_PROFILES.settled);
  close(response.position,1-(1+10*t)*Math.exp(-10*t));close(response.velocity,100*t*Math.exp(-10*t));
});

test('constant-target mechanical results agree at 30, 60, and 144 Hz and with irregular frame times',()=>{
  for(const profile of Object.values(MOTION_PROFILES)){
    const initial=Object.freeze({position:-.2,velocity:.35}),expected=stepMechanical(initial,1,4,profile);
    for(const count of [120,240,576]){
      let state=initial;for(let i=0;i<count;i++)state=stepMechanical(state,1,4/count,profile);closeState(state,expected,2e-11);
    }
    let state=initial,time=0,index=0;const parts=[.007,.024,.011,.052,.19,.003,.25];
    while(time<4-1e-12){const dt=Math.min(parts[index++%parts.length],4-time);state=stepMechanical(state,1,dt,profile);time+=dt;}
    closeState(state,expected,2e-11);assert.deepEqual(initial,{position:-.2,velocity:.35});
  }
});

test('passive free response does not create mechanical energy',()=>{
  for(const damping of [0,3,20,55]){
    const profile={mass:1,stiffness:100,damping};let state={position:1,velocity:.2},energy=mechanicalEnergy(state,0,profile);
    for(let i=0;i<160;i++){
      state=stepMechanical(state,0,[1/144,1/30,.2][i%3],profile);const next=mechanicalEnergy(state,0,profile);
      assert.ok(next<=energy+1e-10);energy=next;
    }
  }
});

test('an over-damped update agrees under subdivision and a long interval stays finite',()=>{
  const profile={mass:2,damping:80,stiffness:30},initial={position:0,velocity:.4};
  let divided=initial;for(let i=0;i<200;i++)divided=stepMechanical(divided,1,.01,profile);
  closeState(divided,stepMechanical(initial,1,2,profile),1e-11);
  for(const preset of Object.values(MOTION_PROFILES))closeState(stepMechanical(initial,1,60,preset),{position:1,velocity:0},1e-10);
});

test('near-critical profiles retain the continuous response and interval composition',()=>{
  const initial={position:-.3,velocity:.2},critical=stepMechanical(initial,1,.4,{mass:1,damping:20,stiffness:100});
  for(const damping of [20-1e-8,20+1e-8]){
    const profile={mass:1,damping,stiffness:100},whole=stepMechanical(initial,1,.4,profile);
    closeState(whole,critical,1e-8);
    closeState(stepMechanical(stepMechanical(initial,1,.13,profile),1,.27,profile),whole,1e-10);
  }
});

test('response samples retain measurable overshoot and finite-window settling distinctions',()=>{
  const heavy=sampleMechanical('heavy'),elastic=sampleMechanical('elastic'),settled=sampleMechanical('settled');
  assert.ok(elastic.metrics.overshootRatio>.35&&elastic.metrics.overshootRatio<.4);
  assert.equal(settled.metrics.overshoot,0);assert.ok(heavy.metrics.overshootRatio<.01);
  assert.ok(settled.metrics.settlingTime<heavy.metrics.settlingTime);
  assert.ok(elastic.metrics.settlingTime>settled.metrics.settlingTime);
  assert.equal(sampleMechanical('heavy',{seconds:.1}).metrics.settlingTime,null);
  assert.equal(heavy.samples[0].time,0);close(heavy.samples.at(-1).time,6);
  assert.equal(sampleMechanical('heavy',{seconds:0,initial:{position:1,velocity:0}}).metrics.settlingTime,0);
});

test('invalid model inputs fail before a non-finite presentation state can escape',()=>{
  assert.throws(()=>apply2([[1,2],[3,4]],[NaN,1]),RangeError);
  assert.throws(()=>vectorNorm2([Number.MAX_VALUE,Number.MAX_VALUE]),RangeError);
  assert.throws(()=>multiply2([[1,2]],M.identity),TypeError);
  assert.throws(()=>operatorTrajectory(M.coupled,[0,1],257),RangeError);
  for(const dt of [-1,61,Infinity])assert.throws(()=>stepMechanical({position:0,velocity:0},1,dt),RangeError);
  assert.throws(()=>stepMechanical({position:0,velocity:0},1,.1,{mass:0,damping:1,stiffness:1}),RangeError);
  assert.throws(()=>sampleMechanical('heavy',{dt:1e-9}),RangeError);
});

test('Klein advancement uses the existing kernel and transports the retained velocity',()=>{
  const source=Object.freeze({id:'same-shot',x:.9,y:.35,vx:.8,vy:.2}),actual=advanceTopology(source,.5,'klein'),reference=traceKlein(source,.4,.1,TOPOLOGY_BOUNDS);
  close(actual.projectile.x,reference.x);close(actual.projectile.y,reference.y);
  assert.equal(actual.projectile.id,'same-shot');assert.equal(actual.projectile.vx,.8);assert.equal(actual.projectile.vy,-.2);
  close(Math.hypot(actual.projectile.heading.x,actual.projectile.heading.y),1);
  assert.deepEqual(source,{id:'same-shot',x:.9,y:.35,vx:.8,vy:.2});
  assert.equal(actual.kernel,'traceKlein');assert.equal(actual.crossings[0].objectId,'same-shot');assert.equal(actual.crossings[0].predicted,false);
});

test('the Projective Module prototype uses its actual vertical identification and heading reversal',()=>{
  const source={id:12,x:.35,y:.9,vx:.2,vy:.8},actual=advanceTopology(source,.5,'projective'),reference=traceProjectiveSurface(source,.1,.4,TOPOLOGY_BOUNDS);
  close(actual.projectile.x,reference.x);close(actual.projectile.y,reference.y);
  assert.equal(actual.projectile.id,12);assert.equal(actual.projectile.vx,-.2);assert.equal(actual.projectile.vy,.8);
  assert.equal(actual.projectiveCrossings,1);assert.equal(actual.crossings[0].rule,'projective');
  assert.equal(actual.kernel,'traceProjectiveSurface');
});

test('seam jumps stay separate from physical motion segments',()=>{
  const actual=advanceTopology({id:'edge-shot',x:.9,y:.7,vx:.8,vy:0},.5,'klein');
  assert.equal(actual.segments.length,2);assert.equal(actual.jumps.length,1);assert.equal(actual.jumps[0].renderOnly,true);
  close(actual.segments[0].to.x,1);close(actual.segments[1].from.x,-1);
  const center=[{from:{x:0,y:0},to:{x:0,y:0},t0:0,t1:1}];
  assert.equal(pathsHit(actual.segments,center,.1),false);
  for(const segment of actual.segments)assert.ok(Math.abs(segment.to.x-segment.from.x)<.5);
});

test('forecasts retain one identity and mark predictions without changing the input',()=>{
  const source=Object.freeze({id:'one-identity',x:.9,y:.3,vx:.8,vy:.2}),before=structuredClone(source),
    forecast=forecastTopology(source,.5,'klein'),actual=advanceTopology(source,.5,'klein');
  assert.deepEqual(forecast.projectile,actual.projectile);assert.equal(forecast.projectile.id,source.id);
  assert.equal(forecast.renderOnly,true);assert.equal(forecast.collisionRelevant,false);assert.equal(forecast.createsCollider,false);
  assert.ok(forecast.crossings.every(crossing=>crossing.predicted&&crossing.objectId===source.id));
  assert.ok(actual.crossings.every(crossing=>!crossing.predicted));assert.deepEqual(source,before);
});

test('topology transport agrees for one interval and its subdivision across both seam types',()=>{
  for(const kind of ['klein','projective']){
    const source={id:'retained',x:.78,y:.81,vx:.73,vy:.92},expected=advanceTopology(source,2.1,kind);
    let state=source,crossings=0;
    for(let i=0;i<21;i++){const result=advanceTopology(state,.1,kind);state=result.projectile;crossings+=result.crossings.length;}
    close(state.x,expected.projectile.x,1e-9);close(state.y,expected.projectile.y,1e-9);
    close(state.vx,expected.projectile.vx);close(state.vy,expected.projectile.vy);
    assert.equal(state.id,source.id);assert.equal(crossings,expected.crossings.length);
  }
});

test('topology input limits preserve the existing kernel assumptions',()=>{
  const shot={id:0,x:0,y:0,vx:1,vy:0};
  assert.equal(advanceTopology(shot,0).projectile.id,0);
  assert.throws(()=>advanceTopology({...shot,id:null},.1),TypeError);
  assert.throws(()=>advanceTopology({...shot,x:2},.1),RangeError);
  assert.throws(()=>advanceTopology(shot,.1,'projective',{left:0,right:2,bottom:-1,top:1}),RangeError);
  assert.throws(()=>advanceTopology(shot,.1,'unknown'),RangeError);
});
