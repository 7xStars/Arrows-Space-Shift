import {spaceDistance,advanceThroughSpace,advanceProjectile,metricAt} from './space.js';

export const WARP_RADIUS=140;
export const EFFECT_AXES=['Position','Distance','Path','Velocity','Arrival time','Damage','Utility'];
export const OPERATIONS=Object.freeze([
  {id:0,code:'P',key:'position-warp',name:'Position Warp',color:'#b8a6ed',status:'Playable',effects:['Move a shot to the opposite side.','Preserve radial distance.','Continue from the new position.','Keep base velocity.','Keep the forward distance.','Keep contact damage.','Open one side while retaining danger on the other.']},
  {id:1,code:'V',key:'vector-lens',name:'Vector Lens',color:'#7ae8e0',status:'Playable',effects:['Keep the trigger position.','Reduce forward travel per second.','Send the shot outward.','Set outward lateral velocity; reduce forward velocity.','Delay forward contact.','Keep contact damage.','Change a crossing route without removing the shot.']},
  {id:2,code:'B',key:'path-bend',name:'Path Bend',color:'#f1a6dd',status:'Playable',effects:['Keep the trigger position.','Increase the curved path length.','Curve outward for 0.8 seconds.','Add lateral acceleration.','Change the next contact time.','Keep contact damage.','Trade a clear center for danger farther out.']},
  {id:3,code:'I',key:'impact-buffer',name:'Impact Buffer',color:'#ecd283',status:'Playable',effects:['Keep the shot position.','Keep the approach distance.','Keep the approach path.','Keep base velocity.','Apply a hit after a 0.8-second delay.','Retain the complete damage debt.','Buy time; a stored hit can still defeat its target.']},
  {id:4,code:'D',key:'arrival-delay',name:'Arrival Delay',color:'#9dbdff',status:'Playable',effects:['Hold at the trigger point.','Keep the remaining route distance.','Resume the same route.','Pause for 0.65 seconds, then resume.','Delay the approach.','Keep contact damage, including during the hold.','Separate approaching threats.']},
  {id:5,code:'A',key:'distance-anchor',name:'Distance Anchor',color:'#a5d98b',status:'Playable',effects:['Keep the trigger position.','Reduce travel per second.','Keep the current heading.','Halve both velocity components.','Delay contact.','Keep contact damage.','Create room while retaining the threat.']},
  {id:6,code:'U',key:'utility-exchange',name:'Utility Exchange',color:'#ffbd82',status:'Playable',effects:['Keep the trigger position.','Reduce forward travel per second.','Keep the current heading.','Halve both velocity components.','Delay contact.','Double the retained shot damage.','Advance the next shot by 0.12 seconds at the cost of a heavier threat.']},
]);
export const roster=stage=>stage===1?[0,1,3]:[0,1,2,3,4,5,6];
export const counters=(a,b)=>a!==b && [1,2,4].includes((b-a+7)%7);
export function commonCounters(selected,stage){return roster(stage).filter(a=>!selected.includes(a)&&selected.every(b=>counters(a,b)));}
export function auditTournament(stage){
  const vertices=roster(stage),k=stage===1?1:2;
  const sets=k===1?vertices.map(v=>[v]):vertices.flatMap((v,i)=>vertices.slice(i+1).map(w=>[v,w]));
  const witnesses=sets.map(set=>({set,counters:commonCounters(set,stage)}));
  return {stage,k,vertices,edges:vertices.flatMap(a=>vertices.filter(b=>counters(a,b)).map(b=>[a,b])),witnesses,
    valid:vertices.every(a=>vertices.every(b=>a===b || counters(a,b)!==counters(b,a)))&&witnesses.every(w=>w.counters.length),
    claim:'Counter rule checked. Overall combat balance is not established.'};
}

export const upgradeModes=['campaign','upgrades','trio','paley','warp-lab'];
export const foldSign=s=>s.fields.length%2?-1:1;
export const activeSourceSide=(s,seed)=>seed.polarity * -foldSign(s);
export const warpSide=s=>s.upgrade?-activeSourceSide(s,s.upgrade):null;
export const seedLabel=seed=>`${seed.polarity===1?'Right':'Left'} ${OPERATIONS[seed.type].name}`;
export const loadout=actor=>actor.equipped?.filter(Boolean) || (actor.upgrade?[actor.upgrade]:[]);
const event=(s,type,data)=>s.events.push({time:s.time,type,...data});
export function makeDrop(s,x,z,source='fixture',type=0,polarity=1){
  const drop={id:++s.dropSerial,kind:OPERATIONS[type].key,type,polarity,x,z,source,collected:false};
  s.drops.push(drop);event(s,'upgrade-drop',{drop:drop.id,typeId:type,polarity,x,z,source});return drop;
}
export function equipSeed(s,key,slot=s.selectedSlot||0){
  const seed=s.inventory.find(item=>item.key===key);if(!seed || slot>=s.slotCount)return false;
  const other=s.equipped.findIndex(item=>item?.type===seed.type);if(other>=0 && other!==slot)s.equipped[other]=null;
  s.equipped[slot]=seed;s.upgrade=s.equipped[0]||s.equipped[1]||null;
  event(s,'equip',{key,slot,typeId:seed.type});return true;
}
export function collectDrop(s,drop){
  if(drop.collected)return false;drop.collected=true;
  const key=`${drop.type}:${drop.polarity}`;
  let seed=s.inventory.find(item=>item.key===key);
  if(!seed){seed={key,id:OPERATIONS[drop.type].key,type:drop.type,polarity:drop.polarity,source:drop.source,instance:++s.upgradeSerial};s.inventory.push(seed);}
  const empty=s.equipped.slice(0,s.slotCount).findIndex(item=>!item);
  const existing=s.equipped.findIndex(item=>item?.type===seed.type);
  equipSeed(s,key,existing>=0?existing:empty>=0?empty:s.selectedSlot);event(s,'upgrade-collected',{drop:drop.id,typeId:seed.type,polarity:seed.polarity});
  s.lastEvent=`${seedLabel(seed)} collected. ${s.drops.filter(d=>!d.collected).length} seeds remain ahead.`;return true;
}

export function moveShot(shot,dt,fields){
  const moving=Math.max(0,dt-Math.min(dt,shot.hold||0));shot.hold=Math.max(0,(shot.hold||0)-dt);
  if(!moving)return;
  const curveTime=Math.min(moving,shot.curveTime||0);
  const vx=shot.vx||0,ax=shot.ax||0;
  const before=shot.z;shot.z=advanceProjectile(shot.z,(shot.vz??-145)*moving,fields);
  const elapsed=Math.abs(shot.vz??-145)<.001?moving/metricAt(shot.z,fields):Math.abs(spaceDistance(before,shot.z,fields))/Math.max(1,Math.abs(shot.vz??-145));
  shot.x+=vx*elapsed+ax*curveTime*curveTime/2;
  shot.vx=vx+ax*curveTime;shot.curveTime=Math.max(0,(shot.curveTime||0)-moving);if(!shot.curveTime)shot.ax=0;
}

export function operationEntryTime(s,actor,shot,from,oldActor,facing=1){
  if(!loadout(actor).length)return null;
  const actorKey=actor===s?'player':`enemy-${actor.id}`;
  if(shot.gates?.[actorKey])return null;
  const a=facing*spaceDistance(oldActor.z,from.z,s.fields),b=facing*spaceDistance(actor.z,shot.z,s.fields);
  if(a<0 || b>WARP_RADIUS || b>a || Math.abs(from.x-oldActor.x)>500)return null;
  return a<=WARP_RADIUS?0:Math.max(0,Math.min(1,(a-WARP_RADIUS)/(a-b)));
}
export function applyOperations(s,actor,shot,from,oldActor,dt,facing=1){
  const t=operationEntryTime(s,actor,shot,from,oldActor,facing);if(t===null)return null;
  const seeds=loadout(actor),actorKey=actor===s?'player':`enemy-${actor.id}`;shot.gates||={};
  const center={x:oldActor.x+(actor.x-oldActor.x)*t,z:oldActor.z+(actor.z-oldActor.z)*t};
  const entry={x:from.x+(shot.x-from.x)*t,z:from.z+(shot.z-from.z)*t};
  shot.gates[actorKey]=true;
  shot.x=entry.x;shot.z=entry.z;
  const parts=[{from,to:{...entry},shipFrom:oldActor,shipTo:center,t0:0,t1:t}];
  let applied=false;
  for(const seed of seeds){
    const currentRelative=shot.x-center.x;
    const currentSource=Math.abs(currentRelative)<8?0:Math.sign(currentRelative);
    if(currentSource!==activeSourceSide(s,seed))continue;
    const resistance=(shot.payload||[]).find(type=>counters(type,seed.type));
    if(resistance!==undefined){event(s,'counter-bypass',{actor:actorKey,attack:resistance,defense:seed.type});continue;}
    const before={x:shot.x,z:shot.z};
    switch(seed.type){
      case 0:shot.x=center.x-(shot.x-center.x);shot.warped=true;shot.warpSide=-currentSource;s.warpCount++;break;
      case 1:shot.vx=currentSource*140;shot.vz=(shot.vz??-145)*.75;break;
      case 2:shot.ax=currentSource*320;shot.curveTime=.8;break;
      case 3:shot.impactDelay=.8;break;
      case 4:shot.hold=.65;break;
      case 5:shot.vx=(shot.vx||0)*.5;shot.vz=(shot.vz??-145)*.5;break;
      case 6:shot.vx=(shot.vx||0)*.5;shot.vz=(shot.vz??-145)*.5;shot.damage=(shot.damage||1)*2;
        if(actor===s)s.fireClock=Math.max(0,s.fireClock-.12);else actor.clock=Math.max(0,actor.clock-.12);break;
    }
    applied=true;
    event(s,'operation',{actor:actorKey,typeId:seed.type,source:currentSource,from:before,to:{x:shot.x,z:shot.z}});
  }
  const landing={x:shot.x,z:shot.z};moveShot(shot,dt*(1-t),s.fields);
  parts.push({from:landing,to:{x:shot.x,z:shot.z},shipFrom:center,shipTo:{x:actor.x,z:actor.z},t0:t,t1:1});
  if(applied)shot.operated=true;
  return parts;
}
