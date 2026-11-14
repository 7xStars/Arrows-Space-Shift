export const KLEIN_BOUNDS=Object.freeze({left:-400,right:400,bottom:-70,top:950});
const EPS=1e-9;

/** Select one vertical representative without changing the surface point. */
export function kleinY(y,bounds=KLEIN_BOUNDS){
  const height=bounds.top-bounds.bottom;
  return bounds.bottom+((y-bounds.bottom)%height+height)%height;
}

export function traceKlein(point,dx,dy,bounds=KLEIN_BOUNDS){
  const {left,right,bottom,top}=bounds,width=right-left,height=top-bottom;
  let x=point.x,y=point.y,twists=0;
  const crossings=[],segments=[];
  while(x<left||x>right){const edge=x<left?'left':'right';if(x<left)x+=width;else x-=width;y=bottom+top-y;dy=-dy;twists++;crossings.push({edge,x,y,time:0});}
  while(y<bottom||y>top){const edge=y<bottom?'bottom':'top';y+=y<bottom?height:-height;crossings.push({edge,x,y,time:0});}
  let t0=0,remaining=1;
  for(let guard=0;guard<128;guard++){
    const tx=dx>EPS?(right-x)/dx:dx<-EPS?(left-x)/dx:Infinity;
    const ty=dy>EPS?(top-y)/dy:dy<-EPS?(bottom-y)/dy:Infinity;
    const fraction=Math.max(0,Math.min(1,tx,ty));
    const end={x:x+dx*fraction,y:y+dy*fraction},t1=t0+remaining*fraction;
    if(fraction>EPS)segments.push({from:{x,y},to:end,t0,t1});
    x=end.x;y=end.y;
    if(fraction>=1-EPS){if(!segments.length)segments.push({from:{x,y},to:{x,y},t0:0,t1:1});return {x,y,twists,crossings,segments};}
    dx*=1-fraction;dy*=1-fraction;remaining*=1-fraction;t0=t1;
    if(tx<=ty+EPS){
      const edge=dx>=0?'right':'left';x=edge==='right'?left:right;y=bottom+top-y;dy=-dy;twists++;
      crossings.push({edge,x,y,time:t0});
    }else{
      const edge=dy>=0?'top':'bottom';y=edge==='top'?bottom:top;crossings.push({edge,x,y,time:t0});
    }
  }
  throw new Error('Klein movement exceeded the crossing limit.');
}

const at=(segment,t)=>{
  const u=(t-segment.t0)/(segment.t1-segment.t0||1);
  return {x:segment.from.x+(segment.to.x-segment.from.x)*u,y:segment.from.y+(segment.to.y-segment.from.y)*u};
};
export function pathsHit(first,second,radius,bounds=null){
  if(bounds){
    const width=bounds.right-bounds.left,height=bounds.top-bounds.bottom;
    for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){
      const image=p=>({x:p.x+ix*width,y:(ix?bounds.bottom+bounds.top-p.y:p.y)+iy*height});
      if(pathsHit(first,second.map(segment=>({...segment,from:image(segment.from),to:image(segment.to)})),radius))return true;
    }
    return false;
  }
  for(const a of first)for(const b of second){
    const t0=Math.max(a.t0,b.t0),t1=Math.min(a.t1,b.t1);if(t1<t0)continue;
    const a0=at(a,t0),a1=at(a,t1),b0=at(b,t0),b1=at(b,t1);
    const x=a0.x-b0.x,y=a0.y-b0.y,dx=a1.x-b1.x-x,dy=a1.y-b1.y-y;
    const u=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));
    if(Math.hypot(x+dx*u,y+dy*u)<=radius)return true;
  }
  return false;
}


/**
 * Gameplay hybrid used by the Act II boss. Side joins retain the Klein
 * reflection. Top/bottom joins add an antipodal x identification, so the
 * battlefield simultaneously contains the learned Klein rule and the new
 * projective rule. It is intentionally introduced as a module overlap, not as
 * a claim that this rectangular quotient is pure RP^2.
 */
export function traceKleinProjective(point,dx,dy,bounds=KLEIN_BOUNDS){
  const {left,right,bottom,top}=bounds,width=right-left,height=top-bottom;
  let x=point.x,y=point.y,twists=0,projectiveCrossings=0;
  const crossings=[],segments=[];let t0=0,remaining=1;
  for(let guard=0;guard<128;guard++){
    const tx=dx>EPS?(right-x)/dx:dx<-EPS?(left-x)/dx:Infinity;
    const ty=dy>EPS?(top-y)/dy:dy<-EPS?(bottom-y)/dy:Infinity;
    const fraction=Math.max(0,Math.min(1,tx,ty));
    const end={x:x+dx*fraction,y:y+dy*fraction},t1=t0+remaining*fraction;
    if(fraction>EPS)segments.push({from:{x,y},to:end,t0,t1});x=end.x;y=end.y;
    if(fraction>=1-EPS)return {x,y,twists,projectiveCrossings,crossings,segments};
    dx*=1-fraction;dy*=1-fraction;remaining*=1-fraction;t0=t1;
    if(tx<=ty+EPS){
      const edge=dx>=0?'right':'left';x=edge==='right'?left:right;y=bottom+top-y;dy=-dy;twists++;
      crossings.push({edge,rule:'klein',x,y,time:t0});
    }else{
      const edge=dy>=0?'top':'bottom';y=edge==='top'?bottom:top;x=-x;dx=-dx;projectiveCrossings++;
      crossings.push({edge,rule:'projective',x,y,time:t0});
    }
  }
  throw new Error('Hybrid movement exceeded the crossing limit.');
}

/** Experimental Projective Module gameplay chart. Side and vertical joins
 * use distinct reversals; this square quotient is not a verified round RP²
 * model and must not be described as its intrinsic metric or topology.
 * A faithful hemisphere with antipodal boundary remains future work.
 */
export const traceProjectiveSurface=traceKleinProjective;

export function pathsHitProjective(a,b,radius,bounds=KLEIN_BOUNDS){
  const {left,right,bottom,top}=bounds,width=right-left,height=top-bottom,sumX=left+right,sumY=bottom+top;
  const moves=[p=>p,p=>({x:p.x+width,y:sumY-p.y}),p=>({x:p.x-width,y:sumY-p.y}),
    p=>({x:sumX-p.x,y:p.y+height}),p=>({x:sumX-p.x,y:p.y-height})];
  for(const tx of moves){
    const first=b.map(seg=>({...seg,from:tx(seg.from),to:tx(seg.to)}));
    if(pathsHit(a,first,radius))return true;
    for(const ty of moves.slice(1)){
      const second=first.map(seg=>({...seg,from:ty(seg.from),to:ty(seg.to)}));
      if(pathsHit(a,second,radius))return true;
    }
  }
  return false;
}
