import {traceKlein,traceKleinProjective,KLEIN_BOUNDS} from './klein.js';
import {arenaY,isBoss,isHybridBoss,isKleinSurfaceRoute,isProjectiveBoss,isProjectiveSurfaceRoute,hybridProjectiveActive,SCROLL_SPEED} from './campaign.js';
import {activeShip} from './fleet.js';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

/** Forecast with exactly the same chart transition code used by combat.
 * These are *candidate* crossings under present velocity, not guaranteed future
 * trajectories. The player can still steer before reaching the boundary.
 */
export function forecastJoin(point,velocity,{horizon=.9,projective=false,bounds=KLEIN_BOUNDS}={}){
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!Number.isFinite(velocity?.vx)||!Number.isFinite(velocity?.vy)||horizon<=0)return null;
  const method=projective?traceKleinProjective:traceKlein;
  const motion=method(point,velocity.vx*horizon,velocity.vy*horizon,bounds);
  const crossing=motion.crossings.find(c=>c.time>0&&c.time<=1);
  if(!crossing)return null;
  const rule=crossing.rule||(crossing.edge==='left'||crossing.edge==='right'?'klein':'periodic');
  return Object.freeze({edge:crossing.edge,rule,timeSeconds:Number((crossing.time*horizon).toFixed(2)),
    destination:Object.freeze({x:crossing.x,y:crossing.y}),
    orientation:rule==='klein'?'forward-reverses':rule==='projective'?'lateral-reverses':'unchanged'});
}

export function playerJoinForecast(s,{horizontalVelocity=s.lateralVelocity||0,axialInput=s.lastAxialInput||0,horizon=2}={}){
  if(!(isBoss(s)||isKleinSurfaceRoute(s))||s.phase!=='running')return null;
  const projective=isProjectiveBoss(s)||isProjectiveSurfaceRoute(s)||hybridProjectiveActive(s);
  const y=arenaY(s,s.z),velocityX=clamp(horizontalVelocity,-activeShip(s).speed,activeShip(s).speed);
  const axis=isBoss(s)?SCROLL_SPEED*(s.facing||1):
    clamp(axialInput,-1,1)*210*(axialInput<0?(activeShip(s).reverseFactor||1):1);
  const dy=isBoss(s)?axis:clamp(y+axis*horizon,25,(KLEIN_BOUNDS.top+KLEIN_BOUNDS.bottom)/2-35)-y;
  return forecastJoin({x:s.x,y},{vx:velocityX,vy:isBoss(s)?axis:dy/horizon},{horizon,projective});
}

/** A small, legible set of approaching *hostile* returns; no omniscient
 * full-path overlay. Only calls with a real projected chart crossing emit a cue.
 */
export function threatJoinForecasts(s,{horizon=.85,max=2}={}){
  if(!(isBoss(s)||isKleinSurfaceRoute(s))||s.phase!=='running')return [];
  return (s.enemyShots||[]).filter(shot=>!shot.dead&&Number.isFinite(shot.vx)&&Number.isFinite(shot.vz))
    .map(shot=>{
      const projective=shot.geometryRule==='projective'||shot.geometryRule==='hybrid';
      const depth=Number.isFinite(shot.foldDepth)?Math.max(0,shot.foldDepth):0;
      const forecast=forecastJoin({x:shot.x,y:arenaY(s,shot.z)},
        {vx:shot.vx,vy:shot.vz*2**Math.min(depth,3)},{horizon,projective});
      return forecast?{...forecast,sourceId:shot.sourceId??shot.id??null}:null;
    }).filter(Boolean).sort((a,b)=>a.timeSeconds-b.timeSeconds).slice(0,max);
}

export function joinCueText(forecast){
  if(!forecast)return '';
  const where=forecast.edge.toUpperCase();
  if(forecast.rule==='projective')return `PROJECTIVE ${where} JOIN · LATERAL MIRROR IN ~${forecast.timeSeconds.toFixed(1)}s`;
  if(forecast.rule==='klein')return `KLEIN ${where} JOIN · FORWARD REVERSAL IN ~${forecast.timeSeconds.toFixed(1)}s`;
  return `TOP/BOTTOM JOIN · DIRECTION PRESERVED IN ~${forecast.timeSeconds.toFixed(1)}s`;
}
