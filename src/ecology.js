/** Act III: constructive bullet heaven. Echoes require a deliberate, nearby capture.
 * Autonomous fire is optional and spends captured echoes, never free damage.
 */
import {KLEIN_BOUNDS} from './klein.js';
import {spaceDistance,advanceThroughSpace} from './space.js';

export const EVOLUTIONS=Object.freeze([
  Object.freeze({id:'wide-net',name:'Wide Net',description:'Capture range increases by 32 units.'}),
  Object.freeze({id:'deep-chamber',name:'Deep Chamber',description:'Store three additional echoes.'}),
  Object.freeze({id:'split-echo',name:'Split Echo',description:'Released echoes split into three narrower shots.'}),
  Object.freeze({id:'quick-return',name:'Quick Return',description:'Capture and release cooldowns shorten.'}),
  Object.freeze({id:'projective-twin',name:'Projective Twin',description:'Each release adds one mirrored companion shot.'}),
  Object.freeze({id:'echo-orbit',name:'Echo Orbit',description:'Automatically spend one stored echo on a periodic forward satellite.'}),
  Object.freeze({id:'echo-ward',name:'Echo Ward',description:'Spend two stored echoes to stop one otherwise-damaging hostile shot.'}),
  Object.freeze({id:'echo-focus',name:'Echo Focus',description:'Released echoes deal 50% more damage.'}),
]);
export const EVOLUTION_BY_ID=Object.freeze(Object.fromEntries(EVOLUTIONS.map(x=>[x.id,x])));
const unique=value=>Array.from(new Set(Array.isArray(value)?value.filter(id=>EVOLUTION_BY_ID[id]):[]));
const safeCount=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max?v:0;
export function createEcologyState(value={}){
  value ||= {};
  const upgrades=unique(value.upgrades);
  const capacity=6+(upgrades.includes('deep-chamber')?3:0);
  return {
    echoes:Math.min(capacity,safeCount(value.echoes,capacity)),capacity,
    upgrades, captured:safeCount(value.captured,1000000),released:safeCount(value.released,1000000),
    convertedDamage:safeCount(value.convertedDamage,1000000),
    captureCooldown:0,releaseCooldown:0,orbitClock:2,wardCooldown:0,
    offers:[],choiceCount:safeCount(value.choiceCount,32),stageChoices:0,
    pendingBreak:null,
  };
}
export function projectiveEquipped(s){return s?.mode==='campaign'&&s?.campaign?.index>=18&&Boolean(s.fleetProfile?.projectiveModule);}
const has=(s,id)=>s.projective?.upgrades?.includes(id);
export function drawEvolutions(s){
  const state=s.projective;if(!state)return [];
  const remaining=EVOLUTIONS.filter(item=>!state.upgrades.includes(item.id));
  if(!remaining.length)return [];
  const shift=(Math.imul((s.runSeed>>>0)^((s.campaign.index+1)*731),2654435761)>>>0)%remaining.length;
  const index=(shift+state.choiceCount*3)%remaining.length;
  return Array.from({length:Math.min(3,remaining.length)},(_,j)=>remaining[(index+j)%remaining.length]);
}
export function queueEvolution(s,waveId){
  if(!projectiveEquipped(s)||!s.projective||s.projective.stageChoices>=2||!waveId||s.projective.pendingBreak===waveId)return false;
  const choices=drawEvolutions(s);
  if(!choices.length)return false;
  s.projective.offers=choices.map(x=>x.id);s.projective.pendingBreak=waveId;
  s.projective.stageChoices++;
  s.phase='choosing';
  s.events.push({time:s.time,type:'evolution-offered',wave:waveId,offers:[...s.projective.offers]});
  s.lastEvent='Echo Forge: choose one transformation. The battle is paused.';
  return true;
}
export function chooseEvolution(s,id){
  if(s?.phase!=='choosing'||!s.projective?.offers?.includes(id)||!EVOLUTION_BY_ID[id])return false;
  const state=s.projective;state.upgrades.push(id);state.offers=[];state.choiceCount++;
  if(id==='deep-chamber')state.capacity+=3;
  s.phase='running';s.events.push({time:s.time,type:'evolution-chosen',id});
  s.lastEvent=`${EVOLUTION_BY_ID[id].name} installed. Capture to power it.`;
  return true;
}
/** Approximate nearest view-space distance, including side identifications. */
export function echoRange(s,shot){
  const width=KLEIN_BOUNDS.right-KLEIN_BOUNDS.left;
  const centerY=(s.facing||1)*spaceDistance(s.surfaceViewZ||0,s.z,s.fields);
  const shotY=(s.facing||1)*spaceDistance(s.surfaceViewZ||0,shot.z,s.fields);
  const dy=shotY-centerY;
  return Math.min(Math.hypot(shot.x-s.x,dy),
    Math.hypot(shot.x-s.x+width,KLEIN_BOUNDS.top+KLEIN_BOUNDS.bottom-shotY-centerY),
    Math.hypot(shot.x-s.x-width,KLEIN_BOUNDS.top+KLEIN_BOUNDS.bottom-shotY-centerY));
}
const emit=s=>s.events;
export function captureEchoes(s){
  if(!projectiveEquipped(s)||!s.projective||s.projective.captureCooldown>0)return 0;
  const p=s.projective,range=105+(has(s,'wide-net')?32:0),limit=has(s,'quick-return')?3:2;
  const available=s.enemyShots.filter(b=>!b.dead&&echoRange(s,b)<=range).sort((a,b)=>echoRange(s,a)-echoRange(s,b));
  let gained=0;
  for(const shot of available.slice(0,Math.min(limit,p.capacity-p.echoes))){shot.dead=true;gained++;p.echoes++;p.captured++;s.score+=30;
    emit(s).push({time:s.time,type:'echo-captured',x:shot.x,z:shot.z,source:shot.sourceName||'hostile projectile',pattern:shot.pattern||'unknown'});
  }
  p.captureCooldown=gained?has(s,'quick-return')?.55:1.1:.18;
  if(gained)s.lastEvent=`Projective capture: ${gained} echo${gained===1?'':'es'} stored (${p.echoes}/${p.capacity}).`;
  return gained;
}
function echoShot(s,angle,damage=1){
  const f=s.facing||1,c=Math.cos(angle),si=Math.sin(angle);
  return {x:s.x,z:advanceThroughSpace(s.z,f*25,s.fields),vx:680*si,vz:f*680*c,
    owner:'player',bornAt:s.time,damage,payload:[],geometryRule:'projective',echo:true};
}
export function releaseEchoes(s){
  const p=s.projective;if(!projectiveEquipped(s)||!p||p.releaseCooldown>0||p.echoes<1)return 0;
  const consumed=Math.min(p.echoes,3);p.echoes-=consumed;p.released+=consumed;
  const split=has(s,'split-echo'),damage=has(s,'echo-focus')?1.5:1;
  for(let k=0;k<consumed;k++){
    const central=(k-(consumed-1)/2)*.18;
    const angles=split?[central-.11,central,central+.11]:[central];
    for(const a of angles)s.shots.push(echoShot(s,a,damage));
    if(has(s,'projective-twin'))s.shots.push(echoShot(s,-central+.32,damage));
  }
  p.releaseCooldown=has(s,'quick-return')?.42:.85;
  s.events.push({time:s.time,type:'echo-released',count:consumed,bullets:consumed*(split?3:1)+(has(s,'projective-twin')?consumed:0)});
  s.lastEvent=`Released ${consumed} stored echo${consumed===1?'':'es'}.`;
  return consumed;
}
export function protectWithEcho(s,shot){
  const p=s.projective;
  if(!projectiveEquipped(s)||!has(s,'echo-ward')||!p||p.wardCooldown>0||p.echoes<2)return false;
  p.echoes-=2;p.wardCooldown=6;p.convertedDamage++;
  if(shot)shot.dead=true;
  s.events.push({time:s.time,type:'echo-ward',x:s.x,z:s.z,cost:2});
  s.lastEvent='Echo Ward: two stored echoes intercepted the hit.';return true;
}
export function tickEcology(s,input={},dt=0){
  if(!projectiveEquipped(s)||!s.projective||s.phase!=='running')return;
  const p=s.projective;
  for(const field of ['captureCooldown','releaseCooldown','wardCooldown','orbitClock'])p[field]=Math.max(0,p[field]-dt);
  if(input.capture)captureEchoes(s);
  if(input.release)releaseEchoes(s);
  if(has(s,'echo-orbit')&&p.orbitClock<=0){
    p.orbitClock=2.6;
    if(p.echoes>0){p.echoes--;p.released++;
      const phase=p.released%2?-.32:.32;s.shots.push(echoShot(s,phase,.8));
      s.events.push({time:s.time,type:'echo-orbit',x:s.x,z:s.z});
    }
  }
}
