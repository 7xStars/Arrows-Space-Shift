export const KLEIN_BOUNDS=Object.freeze({left:-400,right:400,bottom:-70,top:950});
const EPS=1e-9;

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
