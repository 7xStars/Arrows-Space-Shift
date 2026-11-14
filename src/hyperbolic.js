/**
 * Experimental genus-two Bolza surface kernel in the Poincaré disk.
 * Regular hyperbolic octagon: vertices 2^(-1/4) exp(i(π/8 + kπ/4)),
 * interior angles π/4; opposite sides are paired by orientation-preserving
 * disk isometries. This is an isolated research kernel, not Act IV combat.
 * Reference: CGAL's Periodic Hyperbolic Triangulations/Bolza construction.
 */
export const vertexRadius=2**(-.25);
const TAU=Math.PI*2,EPS=1e-12;
export const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
export const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
export const mul=(a,b)=>({x:a.x*b.x-a.y*b.y,y:a.x*b.y+a.y*b.x});
export const conj=a=>({x:a.x,y:-a.y});
export const scale=(a,t)=>({x:a.x*t,y:a.y*t});
export const norm=a=>Math.hypot(a.x,a.y);
export const div=(a,b)=>{const d=b.x*b.x+b.y*b.y;if(d<EPS)throw new RangeError('invalid disk division');return scale(mul(a,conj(b)),1/d);};
export const unit=a=>{const n=norm(a);return n>EPS?scale(a,1/n):{x:1,y:0};};
export const rotate=angle=>({x:Math.cos(angle),y:Math.sin(angle)});
const insideDisk=z=>norm(z)<1;
const mobiusSub=(z,a)=>div(sub(z,a),sub({x:1,y:0},mul(conj(a),z)));
const mobiusAdd=(a,w)=>div(add(a,w),add({x:1,y:0},mul(conj(a),w)));
export const hyperbolicDistance=(a,b)=>{
  if(!insideDisk(a)||!insideDisk(b))throw new RangeError('points must be in the Poincaré disk');
  const q=Math.min(1-1e-14,norm(mobiusSub(b,a)));
  return 2*Math.atanh(q);
};
export const geodesicStep=(a,heading,length)=>{
  if(!insideDisk(a))throw new RangeError('point must be in the Poincaré disk');
  return mobiusAdd(a,scale(unit(heading),Math.tanh(length/2)));
};
/** Exact heading transport during a single hyperbolic geodesic step.
 * The conformal Mobius map changes tangent orientation away from the origin;
 * retaining an unrotated heading would turn a geodesic into a drifting curve.
 */
export function geodesicFlow(a,heading,length){
  if(!insideDisk(a))throw new RangeError('point must be in the Poincaré disk');
  const direction=unit(heading),w=scale(direction,Math.tanh(length/2));
  const denominator=add({x:1,y:0},mul(conj(a),w));
  return {position:mobiusAdd(a,w),heading:unit(div(direction,mul(denominator,denominator)))};
}
export const OCTAGON_VERTICES=Object.freeze(Array.from({length:8},(_,i)=>Object.freeze(scale(rotate(Math.PI/8+i*Math.PI/4),vertexRadius))));
const sideCenterRadius=(1+vertexRadius**2)/(2*vertexRadius*Math.cos(Math.PI/8));
const sideCircleRadius=Math.sqrt(sideCenterRadius**2-1);
export const SIDES=Object.freeze(Array.from({length:8},(_,i)=>Object.freeze({
  id:i,pair:i%4,from:OCTAGON_VERTICES[i],to:OCTAGON_VERTICES[(i+1)%8],
  center:Object.freeze(scale(rotate(Math.PI/4+i*Math.PI/4),sideCenterRadius)),radius:sideCircleRadius,
})));
export const sideMargin=(z,i)=>norm(sub(z,SIDES[i].center))-SIDES[i].radius;
export const insideOctagon=(z,tolerance=1e-9)=>insideDisk(z)&&SIDES.every((_,i)=>sideMargin(z,i)>=-tolerance);
// Möbius mapping source side i to opposite side i+4, reversing boundary
// orientation while preserving the orientation of the hyperbolic surface.
export function sidePairing(i){
  if(!Number.isInteger(i)||i<0||i>=8)throw new RangeError('side ID must be 0..7');
  const a=OCTAGON_VERTICES[i],a2=OCTAGON_VERTICES[(i+1)%8];
  const b=OCTAGON_VERTICES[(i+5)%8],b2=OCTAGON_VERTICES[(i+4)%8];
  const rotation=unit(div(mobiusSub(b2,b),mobiusSub(a2,a)));
  const apply=z=>mobiusAdd(b,mul(rotation,mobiusSub(z,a)));
  const derivative=z=>{
    const w=mul(rotation,mobiusSub(z,a));
    const one={x:1,y:0};
    const inner=div(scale(one,1-norm(a)**2),mul(sub(one,mul(conj(a),z)),sub(one,mul(conj(a),z))));
    const outer=div(scale(one,1-norm(b)**2),mul(add(one,mul(conj(b),w)),add(one,mul(conj(b),w))));
    return mul(mul(outer,rotation),inner);
  };
  return {i,target:(i+4)%8,apply,derivative};
}
const maps=Object.freeze(Array.from({length:8},(_,i)=>sidePairing(i)));
export const correspondingPair=i=>maps[i].target;
export function geodesicBetween(a,b,t){
  const w=mobiusSub(b,a),d=norm(w);
  if(d<EPS)return a;
  return mobiusAdd(a,scale(unit(w),Math.tanh(Math.atanh(d)*Math.max(0,Math.min(1,t)))));
}
/**
 * Follow a geodesic on the quotient. Small fixed intrinsic steps make edge
 * handling stable away from identified vertices. Returns seam transitions
 * and discontinuity-separated segments suitable for a research display.
 * Not yet the collision-sweep solution for dense projectile gameplay.
 */
export function moveBolza(point,heading,distance,stepLimit=.025){
  if(!insideOctagon(point,1e-6))throw new RangeError('starting point is outside the fundamental octagon');
  if(!Number.isFinite(distance)||Math.abs(distance)>20)throw new RangeError('unsupported displacement');
  let z={...point},direction=unit(heading),remaining=Math.abs(distance),crossings=[];const segments=[];
  if(distance<0)direction=scale(direction,-1);
  while(remaining>1e-10){
    const ds=Math.min(stepLimit,remaining),prior=z;
    const flowed=geodesicFlow(z,direction,ds);
    let next=flowed.position,nextHeading=flowed.heading;
    let transported=false;
    for(let attempt=0;!insideOctagon(next,1e-8)&&attempt<8;attempt++){
      const side=SIDES.reduce((best,s)=>sideMargin(next,s.id)<sideMargin(next,best)?s.id:best,0);
      const g=maps[side];
      const newHeading=unit(mul(g.derivative(next),nextHeading));
      next=g.apply(next);nextHeading=newHeading;transported=true;
      crossings.push({from:side,to:g.target,pair:side%4});
    }
    if(!insideOctagon(next,1e-6))throw new RangeError('crossed near a vertex; segment should be subdivided');
    segments.push({from:prior,to:next,jump:transported});
    z=next;direction=nextHeading;remaining-=ds;
  }
  if(distance<0)direction=scale(direction,-1);
  return {position:z,heading:direction,crossings,segments};
}
/** Area 4π and Euler characteristic -2 distinguish a genus-two quotient. */
export const BOLZA_TOPOLOGY=Object.freeze({sides:8,interiorAngle:Math.PI/4,area:4*Math.PI,eulerCharacteristic:-2,genus:2,orientable:true});
