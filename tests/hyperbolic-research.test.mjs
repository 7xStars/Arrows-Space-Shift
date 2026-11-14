import test from 'node:test';
import assert from 'node:assert/strict';
import {OCTAGON_VERTICES,SIDES,vertexRadius,insideOctagon,sidePairing,hyperbolicDistance,geodesicStep,geodesicBetween,moveBolza,BOLZA_TOPOLOGY,norm,sub} from '../src/hyperbolic.js';
const close=(x,y,e=1e-7)=>assert.ok(Math.abs(x-y)<e,`${x} versus ${y}`);
const closePt=(x,y,e=1e-7)=>close(norm(sub(x,y)),0,e);
test('regular Bolza octagon has the correct disk radius and quotient topology',()=>{
  close(vertexRadius,2**(-.25));assert.equal(SIDES.length,8);assert.equal(BOLZA_TOPOLOGY.genus,2);
  assert.equal(BOLZA_TOPOLOGY.eulerCharacteristic,-2);assert.equal(BOLZA_TOPOLOGY.orientable,true);
  assert.equal(insideOctagon({x:0,y:0}),true);
  assert.equal(insideOctagon({x:.95,y:0}),false);
});
test('each opposite-side pairing maps the endpoints in reverse boundary order',()=>{
  for(let i=0;i<8;i++){
    const f=sidePairing(i);
    closePt(f.apply(OCTAGON_VERTICES[i]),OCTAGON_VERTICES[(i+5)%8]);
    closePt(f.apply(OCTAGON_VERTICES[(i+1)%8]),OCTAGON_VERTICES[(i+4)%8]);
    const g=sidePairing((i+4)%8),p={x:.12,y:-.18};
    closePt(g.apply(f.apply(p)),p,1e-6);
  }
});
test('side pairing preserves hyperbolic distances and tangent angle under inverse map',()=>{
  const points=[{x:0,y:0},{x:.22,y:.11},{x:-.2,y:.14},{x:.15,y:-.24}];
  for(let i=0;i<8;i++){
    const f=sidePairing(i);for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++){
      close(hyperbolicDistance(f.apply(points[a]),f.apply(points[b])),hyperbolicDistance(points[a],points[b]),1e-6);
    }
    const z=points[1],dir={x:.3,y:.95},tiny=geodesicStep(z,dir,.0001);
    const mapped=f.apply(z),mappedTiny=f.apply(tiny),der=f.derivative(z);
    const expected=Math.atan2(der.y*dir.x+der.x*dir.y,der.x*dir.x-der.y*dir.y);
    const actual=Math.atan2(mappedTiny.y-mapped.y,mappedTiny.x-mapped.x);
    close(Math.sin(expected-actual),0,1e-3);
  }
});
test('travel of specified intrinsic length agrees with hyperbolic distance inside the octagon',()=>{
  const p={x:0,y:0},q=geodesicStep(p,{x:1,y:1},.4);
  close(hyperbolicDistance(p,q),.4);
  closePt(geodesicBetween(p,q,1),q);
  const m=moveBolza(p,{x:1,y:1},.4);
  close(hyperbolicDistance(p,m.position),.4,1e-4);assert.equal(m.crossings.length,0);
});
test('crossing a pair preserves local quotient location and re-enters the fundamental domain',()=>{
  const start={x:0,y:0};
  for(const heading of [{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:.7,y:.7}]){
    const m=moveBolza(start,heading,2.2);
    assert.ok(m.crossings.length>=1,'long path crosses at least one opposite-side identification');
    assert.ok(insideOctagon(m.position,1e-6));
    assert.ok(Number.isFinite(m.heading.x)&&Number.isFinite(m.heading.y));
    assert.ok(m.segments.every(s=>[s.to.x,s.to.y].every(Number.isFinite)));
  }
});
