import {spaceDistance,advanceThroughSpace} from './space.js';
import {isBoss,isKleinSurfaceRoute,isProjectiveSurfaceRoute,arenaY,arenaZ} from './campaign.js';
import {KLEIN_BOUNDS,kleinY,traceProjectiveSurface,traceKlein} from './klein.js';

export const ENTRY_TIME=.65;
export const COMBAT_CHART=Object.freeze({left:-400,right:400,bottom:-70,top:950});
export const COMBAT_INSET=28;
export const usesVisibleCombat=s=>['campaign','upgrades','trio','paley'].includes(s.mode);
export const viewTop=s=>s.view?.topInset??112;
/** One world unit has the same size on both screen axes, at every aspect ratio. */
export function combatViewLayout(s){
  const width=Math.max(1,s.view?.width||900),height=Math.max(1,s.view?.height||740);
  const topInset=Math.max(0,Math.min(height-1,viewTop(s)));
  const bottomInset=Math.max(0,Math.min(height-topInset-1,s.view?.bottomInset??52));
  const availableHeight=Math.max(1,height-topInset-bottomInset);
  const scale=Math.min(width/800,availableHeight/1020);
  const arenaWidth=800*scale,arenaHeight=1020*scale;
  const left=(width-arenaWidth)/2,top=topInset+(availableHeight-arenaHeight)/2;
  return {width,height,scale,topInset,bottomInset,left,right:left+arenaWidth,
    top,bottom:top+arenaHeight,arenaWidth,arenaHeight,centerX:width/2,
    zeroY:top+COMBAT_CHART.top*scale};
}
export const campaignScale=s=>combatViewLayout(s).scale;
export const viewOrigin=s=>isBoss(s)?s.z:isKleinSurfaceRoute(s)?(s.surfaceViewZ||0):s.mode==='campaign'?(s.cameraZ||0):s.z;
/** Carry the viewing frame with the ship when the Klein surface reverses it. */
export const viewDirection=s=>isBoss(s)||isKleinSurfaceRoute(s)?s.facing||1:1;
export function screenFacing(s,actor=s){
  return (typeof actor==='number'?actor:actor?.facing||1)*viewDirection(s);
}
export function viewY(s,z){
  const y=viewDirection(s)*spaceDistance(viewOrigin(s),z,s.fields);
  return isBoss(s)?kleinY(y):y;
}
export function viewZ(s,y){
  return isBoss(s)?arenaZ(s,kleinY(arenaY(s,s.z)+viewDirection(s)*y)):
    isKleinSurfaceRoute(s)?arenaZ(s,y):advanceThroughSpace(viewOrigin(s),y,s.fields);
}
/** The side join moves with the camera; it is not a fixed 880-y screen flip. */
export function bossSideDestinationY(s,y){
  return kleinY(viewDirection(s)*(KLEIN_BOUNDS.bottom+KLEIN_BOUNDS.top-2*arenaY(s,s.z))-y);
}

/** Split a continuous physical segment at each vertical cut of the view. */
export function viewSegments(s,from,to){
  const dir=viewDirection(s),origin=viewOrigin(s);
  const a=dir*spaceDistance(origin,from.z,s.fields),b=dir*spaceDistance(origin,to.z,s.fields);
  if(!isBoss(s)&&!isKleinSurfaceRoute(s))return [{from:{x:from.x,y:a},to:{x:to.x,y:b},t0:0,t1:1}];
  const {bottom,top}=KLEIN_BOUNDS,height=top-bottom,dy=b-a,dx=to.x-from.x,cuts=[0,1];
  if(Math.abs(dy)>1e-9){
    const low=Math.min(a,b),high=Math.max(a,b);
    for(let k=Math.floor((low-bottom)/height)+1;k<=Math.floor((high-bottom)/height);k++){
      const t=(bottom+k*height-a)/dy;if(t>1e-9&&t<1-1e-9)cuts.push(t);
    }
  }
  cuts.sort((x,y)=>x-y);
  return cuts.slice(1).map((t1,i)=>{
    const t0=cuts[i],lift=Math.floor((a+dy*(t0+t1)/2-bottom)/height)*height;
    return {from:{x:from.x+dx*t0,y:a+dy*t0-lift},to:{x:from.x+dx*t1,y:a+dy*t1-lift},t0,t1};
  });
}

/** Visible pieces of one physical fold interval; never fill through a cut. */
export function viewFieldIntervals(s,start,end){
  const {bottom,top}=COMBAT_CHART;
  if(!isBoss(s)){
    const a=viewDirection(s)*spaceDistance(viewOrigin(s),start,s.fields),b=viewDirection(s)*spaceDistance(viewOrigin(s),end,s.fields);
    const lo=Math.max(bottom,Math.min(a,b)),hi=Math.min(top,Math.max(a,b));
    return hi>lo?[{start:lo,end:hi}]:[];
  }
  const lo=Math.max(bottom,Math.min(arenaY(s,start),arenaY(s,end))),hi=Math.min(top,Math.max(arenaY(s,start),arenaY(s,end)));
  if(hi<=lo)return [];
  const height=top-bottom,dir=viewDirection(s),camera=arenaY(s,s.z);
  const a=dir*(lo-camera),b=dir*(hi-camera),length=hi-lo;
  if(length>=height-1e-9)return [{start:bottom,end:top}];
  const first=kleinY(Math.min(a,b)),last=first+length;
  return last<=top?[{start:first,end:last}]:[{start:first,end:top},{start:bottom,end:bottom+last-top}];
}
export function projectInView(s,x,z){
  const {centerX,zeroY,scale}=combatViewLayout(s);
  return {x:centerX+x*scale,y:zeroY-viewY(s,z)*scale};
}
export function inCombatView(s,object){
  const y=viewY(s,object.z);
  return object.x>=COMBAT_CHART.left+COMBAT_INSET&&object.x<=COMBAT_CHART.right-COMBAT_INSET&&
    y>=COMBAT_CHART.bottom+COMBAT_INSET&&y<=COMBAT_CHART.top-COMBAT_INSET;
}
export function inPlayerShotView(s,shot){
  const y=viewY(s,shot.z);
  return shot.x>=COMBAT_CHART.left&&shot.x<=COMBAT_CHART.right&&
    y>=COMBAT_CHART.bottom&&y<=COMBAT_CHART.top;
}
export function combatReady(s,enemy){
  return !usesVisibleCombat(s)||Boolean(enemy.presented&&enemy.visibleFor>=ENTRY_TIME&&(enemy.wakeUntil??0)<=s.time&&inCombatView(s,enemy));
}
export function presentEnemy(s,enemy){
  if(!usesVisibleCombat(s)||s.phase!=='running'||!inCombatView(s,enemy)||enemy.stage>s.stage||enemy.hp<=0||enemy.escaped)return;
  if(!enemy.presented){
    enemy.presented=true;enemy.visibleFor=0;
    if(isBoss(s))enemy.lastViewY=viewY(s,enemy.z);
    s.events.push({time:s.time,type:'enemy-presented',target:enemy.id,x:enemy.x,z:enemy.z});
  }
}
export function updateCombatReadiness(s,dt){
  if(!usesVisibleCombat(s))return;
  for(const enemy of s.enemies){
    const klein=isBoss(s),y=klein?viewY(s,enemy.z):null;
    const crossedCut=klein&&Number.isFinite(enemy.lastViewY)&&Math.abs(y-enemy.lastViewY)>(COMBAT_CHART.top-COMBAT_CHART.bottom)/2;
    if(!inCombatView(s,enemy)||enemy.stage>s.stage||crossedCut){
      enemy.presented=false;enemy.visibleFor=0;
      if(klein){enemy.telegraph=null;enemy.contacting=false;}
    }
    else if(enemy.presented)enemy.visibleFor=(enemy.visibleFor||0)+dt;
    if(klein)enemy.lastViewY=y;
  }
}
