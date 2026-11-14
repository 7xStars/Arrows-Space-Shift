/**
 * Manifold presentation contract (v0.23.8+).
 *
 * A Klein bottle or Dyck surface has no globally privileged "front" and
 * "back" sheet. A displayed neighboring representative is the SAME physical
 * point, not a new object with its own collision flag. Therefore all real
 * hostile shots stay solid/live; hollow images are presentation-only future
 * position previews. Never promise immunity based only on chart parity.
 */
import {KLEIN_BOUNDS} from './klein.js';
import {forecastJoin} from './geometry-cues.js';
import {arenaY,isBoss,isHybridBoss,isKleinSurfaceRoute,isProjectiveBoss,isProjectiveSurfaceRoute,hybridProjectiveActive} from './campaign.js';
import {metricAt} from './space.js';

export const MANIFOLD_MARKS=Object.freeze({
  klein:Object.freeze({code:'K',name:'Klein twist',shape:'notch',color:'#e6c38b'}),
  projective:Object.freeze({code:'P',name:'Projective antipode',shape:'opposed-ticks',color:'#cba2fa'}),
  hybrid:Object.freeze({code:'K+P',name:'Mixed Klein/projective rules',shape:'braided',color:'#efc6f2'}),
  periodic:Object.freeze({code:'↕',name:'Periodic join',shape:'parallel-ticks',color:'#9bcbd1'}),
  bolza:Object.freeze({code:'H',name:'Hyperbolic paired edges',shape:'paired-edge',color:'#8dc8c1'}),
});

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const hasSurface=s=>Boolean(isBoss(s)||isKleinSurfaceRoute(s));

/** Resolve from actual combat policy, not from a decorative projectile label. */
export function projectileManifoldRule(s,shot={}){
  if(!hasSurface(s))return 'periodic';
  if(isProjectiveSurfaceRoute(s)||isProjectiveBoss(s))return 'projective';
  if(isHybridBoss(s)){
    if(hybridProjectiveActive(s))return shot.geometryRule==='projective'?'projective':'hybrid';
    if((s.campaign?.hybridPhase||1)===2&&shot.projective===true)return 'projective';
    return 'klein';
  }
  return 'klein';
}

/** The top/bottom crossing uses the antipodal rule ONLY in projective policy. */
export function usesProjectiveJoin(s,shot={}){
  const rule=projectileManifoldRule(s,shot);
  return rule==='projective'||rule==='hybrid';
}

/** All non-dead simulation shots are real collidable entities; no parity mask. */
export function projectileVisualTruth(s,shot={}){
  const rule=projectileManifoldRule(s,shot);
  return Object.freeze({kind:'real',collisionEntity:!shot.dead,status:shot.dead?'removed':'live',rule,mark:MANIFOLD_MARKS[rule]});
}

/** Purely predictive imagery. This object is NEVER inserted into the simulation. */
export function projectileJoinPreview(s,shot,{horizon=1.05}={}){
  if(!hasSurface(s)||!shot||shot.dead||!Number.isFinite(shot.x)||!Number.isFinite(shot.z)||
    !Number.isFinite(shot.vx)||!Number.isFinite(shot.vz)||shot.salvo)return null;
  const factor=clamp(1/metricAt(shot.z,s.fields||[]),.25,16);
  const entry={x:shot.x,y:arenaY(s,shot.z)};
  const forecast=forecastJoin(entry,{vx:shot.vx*factor,vy:shot.vz*factor},{horizon,projective:usesProjectiveJoin(s,shot)});
  if(!forecast)return null;
  const rule=forecast.rule==='klein'?'klein':forecast.rule==='projective'?'projective':'periodic';
  const topology=projectileManifoldRule(s,shot);
  return Object.freeze({kind:'future-projection',collisionEntity:false,notAnAdditionalProjectile:true,
    status:forecast.timeSeconds<=.22?'imminent':'preview',rule,topology,
    classCode:topology==='hybrid'?`K+P / ${rule==='projective'?'P':rule==='klein'?'K':'↕'}`:rule==='projective'?'P':rule==='klein'?'K':'↕',
    timeSeconds:forecast.timeSeconds,edge:forecast.edge,destination:forecast.destination,
    mark:MANIFOLD_MARKS[rule],source:entry});
}

export function manifoldFrameIndicator(s){
  if(!hasSurface(s))return null;
  let name='KLEIN',mark='K',color=MANIFOLD_MARKS.klein.color;
  if(isHybridBoss(s)){
    if(hybridProjectiveActive(s)){name='K + PROJECTIVE (PROTOTYPE)',mark='K+P';color=MANIFOLD_MARKS.hybrid.color;}
    else if((s.campaign?.hybridPhase||1)===2){name='KLEIN · P ANCHOR',mark='K/P';color=MANIFOLD_MARKS.projective.color;}
  }else if(isProjectiveSurfaceRoute(s)||isProjectiveBoss(s)){name='PROJECTIVE CHART',mark='P';color=MANIFOLD_MARKS.projective.color;}
  return Object.freeze({name,mark,color,physicalForward:(s.facing||1)>0?'+' : '−',
    annotation:'Solid: live shot  ·  Hollow: future image (not an extra shot)'});
}

export const MANIFOLD_VISUAL_CONTRACT=Object.freeze({
  live:'Filled core and solid trail = real simulation projectile; normal collision rules apply.',
  preview:'Hollow core and dashed trail = a future chart image, not another projectile/hitbox.',
  imminent:'Pulsing edge mark = the real shot is predicted to cross soon; it can change course.',
  topology:'K = Klein twist; P = projective mapping; K+P = mixed prototype; letter pairs = hyperbolic edges.',
  caveat:'A nonorientable surface has no global opposite-side immunity. An identified copy may still mark a real threat.',
});
