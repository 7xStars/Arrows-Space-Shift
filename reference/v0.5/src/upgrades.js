import {spaceDistance,advanceThroughSpace,advanceProjectile} from './space.js';

export const WARP_RADIUS=160;
export const OPERATIONS=Object.freeze([
  {id:0,code:'P',name:'Position Warp',status:'Playable prototype',effects:['Rotate an incoming shot around the ship.','Preserve its radial distance in the current space.','Move the origin of its remaining path.','Preserve its base velocity.','Change its remaining arrival time.','Keep it hostile with the same damage.','Move danger away from, or into, a future route.']},
  {id:1,code:'V',name:'Vector Lens',status:'Proposal',effects:['No immediate position change.','Change distance covered per second.','Change the future trajectory.','Exchange forward and lateral velocity.','Change interception time.','Keep contact damage; change which contacts occur.','Trade a direct approach for a crossing approach.']},
  {id:2,code:'B',name:'Path Bend',status:'Proposal',effects:['Continue from the current position.','Change the traveled path length.','Curve the remaining route.','Change heading under an authored rule.','Change when the route reaches a target.','Keep damage unless a separate rule changes it.','Reach a target around an obstacle.']},
  {id:3,code:'I',name:'Impact Buffer',status:'Proposal',effects:['Retain position at contact.','Keep the contact distance.','Preserve the approach path.','Do not inherently change velocity.','Delay the damage consequence.','Store damage instead of removing it.','Buy action time with a retained liability.']},
  {id:4,code:'D',name:'Arrival Delay',status:'Proposal',effects:['Retain a shot at its trigger point.','Retain the remaining distance.','Keep the declared destination.','Pause then restore its base velocity.','Move the arrival to a later window.','Keep the pending damage.','Separate simultaneous threats.']},
  {id:5,code:'A',name:'Distance Anchor',status:'Proposal',effects:['Keep world identity and position.','Change a local distance factor.','Keep endpoints while changing travel cost.','Change route speed under the spatial rule.','Change time to contact.','Keep base damage; change exposure.','Make room without deleting the threat.']},
  {id:6,code:'U',name:'Utility Exchange',status:'Proposal',effects:['Use a declared event location.','Use a declared collection range.','Keep or replace a remaining route explicitly.','Specify any momentum cost.','Delay a later benefit after a cost.','Exchange damage capacity for another resource.','Create a different future option instead of a flat bonus.']},
]);
export const EFFECT_AXES=['Position','Distance','Path','Velocity','Arrival time','Damage','Utility'];
export const roster=stage=>stage===1?[0,1,3]:[0,1,2,3,4,5,6];
export const counters=(a,b)=>a!==b && [1,2,4].includes((b-a+7)%7);
export function commonCounters(selected,stage){return roster(stage).filter(a=>!selected.includes(a)&&selected.every(b=>counters(a,b)));}
export function auditTournament(stage){
  const vertices=roster(stage),k=stage===1?1:2,sets=k===1?vertices.map(v=>[v]):vertices.flatMap((v,i)=>vertices.slice(i+1).map(w=>[v,w]));
  const witnesses=sets.map(set=>({set,counters:commonCounters(set,stage)}));
  const oriented=vertices.every(a=>vertices.every(b=>a===b || counters(a,b)!==counters(b,a)));
  return {stage,k,vertices,edges:vertices.flatMap(a=>vertices.filter(b=>counters(a,b)).map(b=>[a,b])),witnesses,valid:oriented&&witnesses.every(w=>w.counters.length>0),claim:'Design graph only. Combat interactions are not validated.'};
}

export const foldSign=s=>s.fields.length?-1:1;
export const warpSide=s=>s.upgrade ? s.upgrade.imprint*foldSign(s) : null;
const event=(s,type,data)=>s.events.push({time:s.time,type,...data});
export function makeDrop(s,x,z,source='fixture'){
  const drop={id:++s.dropSerial,kind:'position-warp',x,z,source,collected:false};
  s.drops.push(drop);event(s,'upgrade-drop',{drop:drop.id,x,z,source});return drop;
}
export function collectDrop(s,drop){
  if(drop.collected)return false;
  drop.collected=true;
  s.upgrade={id:'position-warp',instance:++s.upgradeSerial,imprint:foldSign(s),source:drop.source};
  event(s,'upgrade-collected',{drop:drop.id,imprint:s.upgrade.imprint,folded:s.fields.length>0});
  s.lastEvent=`Position Warp acquired. ${s.upgrade.imprint===1?'Open':'Fold'} imprint retained. Shift changes its active side.`;
  return true;
}
export function rotateDisplacement(x,z,side){return {x:side*z,z:-side*x};}

export function warpIncoming(s,shot,oldShot,oldShip,dt){
  if(!s.upgrade || shot.warped)return null;
  const a={x:oldShot.x-oldShip.x,z:spaceDistance(oldShip.z,oldShot.z,s.fields)};
  const b={x:shot.x-s.x,z:spaceDistance(s.z,shot.z,s.fields)};
  const dx=b.x-a.x,dz=b.z-a.z,A=dx*dx+dz*dz,B=2*(a.x*dx+a.z*dz),C=a.x*a.x+a.z*a.z-WARP_RADIUS*WARP_RADIUS;
  let t=0;
  if(C>0){const discriminant=B*B-4*A*C;if(!A || discriminant<0)return null;t=(-B-Math.sqrt(discriminant))/(2*A);if(t<0 || t>1)return null;}
  const relative={x:a.x+dx*t,z:a.z+dz*t};if(relative.z<=0)return null;
  const ship={x:oldShip.x+(s.x-oldShip.x)*t,z:oldShip.z+(s.z-oldShip.z)*t};
  const entry={x:oldShot.x+(shot.x-oldShot.x)*t,z:oldShot.z+(shot.z-oldShot.z)*t};
  const side=warpSide(s),rotated=rotateDisplacement(relative.x,relative.z,side);
  const landing={x:ship.x+rotated.x,z:advanceThroughSpace(ship.z,rotated.z,s.fields)};
  shot.x=landing.x;shot.z=advanceProjectile(landing.z,-145*dt*(1-t),s.fields);
  shot.x+=shot.vx*Math.abs(spaceDistance(landing.z,shot.z,s.fields))/145;
  shot.warped=true;shot.warpSide=side;s.warpCount++;
  event(s,'position-warp',{side,imprint:s.upgrade.imprint,from:entry,to:landing});
  return [
    {from:oldShot,to:entry,shipFrom:oldShip,shipTo:ship},
    {from:landing,to:{x:shot.x,z:shot.z},shipFrom:ship,shipTo:{x:s.x,z:s.z}},
  ];
}
