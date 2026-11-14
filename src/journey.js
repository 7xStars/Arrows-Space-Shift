export const JOURNEY_KEY='arrow-space-shift:journey:v1';
export const DRIVE_PARTS=Object.freeze(['klein-relay','projective-module','curvature-seed','hyperbolic-core']);
const chapters=Object.freeze({'klein-relay':8,'projective-module':17,'curvature-seed':26});
const count=(n,max=1e9)=>Number.isInteger(n)&&n>=0&&n<=max;
const ship=n=>[0,1,3,8].includes(n);
const copy=value=>structuredClone(value);
function receipt(value){
  if(!value||!DRIVE_PARTS.includes(value.id)||value.extracted!==true)return null;
  const final=value.id==='hyperbolic-core',legacy=value.source==='legacy-banked';
  if(final){
    if(value.source!=='double-torus'||value.stage!==8||value.exposed!==true||value.collected!==true)return null;
  }else if(legacy){
    if(value.legacy!==true||value.chapter!==chapters[value.id])return null;
  }else if(value.source!=='campaign-extraction'||value.chapter!==chapters[value.id])return null;
  if(!legacy&&(!count(value.seed,0xffffffff)||!ship(value.shipId)||!count(value.score)))return null;
  return {id:value.id,source:value.source,chapter:final?null:chapters[value.id],stage:final?8:null,
    exposed:true,collected:true,extracted:true,legacy,
    seed:legacy?null:value.seed,shipId:legacy?null:value.shipId,score:legacy?null:value.score};
}
function bridge(value){
  if(!value||!ship(value.shipId)||!count(value.seed,0xffffffff)||!count(value.score)||!count(value.echoes,100))return null;
  const inventory=[];
  for(const seed of Array.isArray(value.inventory)?value.inventory.slice(0,14):[]){
    if(!seed||!count(seed.type,6)||![1,-1].includes(seed.polarity))continue;
    const key=`${seed.type}:${seed.polarity}`;
    if(inventory.some(item=>item.key===key))continue;
    inventory.push({key,type:seed.type,polarity:seed.polarity,
      source:typeof seed.source==='string'?seed.source.slice(0,120):'campaign',
      instance:count(seed.instance)?seed.instance:inventory.length+1});
  }
  const equipped=(Array.isArray(value.equipped)?value.equipped:[]).slice(0,2).map(item=>{
    const key=typeof item==='string'?item:item?.key;
    return inventory.some(seed=>seed.key===key)?key:null;
  });
  while(equipped.length<2)equipped.push(null);
  return {shipId:value.shipId,seed:value.seed,score:value.score,echoes:value.echoes,inventory,equipped};
}
export function createJourney(value){
  const result={version:1,parts:{},actFourBridge:null,assembled:false,activated:false,completed:false,endingSeen:false};
  if(!value||value.version!==1)return result;
  for(const id of DRIVE_PARTS){const part=receipt(value.parts?.[id]);if(part&&part.id===id)result.parts[id]=part;}
  result.actFourBridge=bridge(value.actFourBridge);
  result.assembled=canAssemble(result)&&value.assembled===true;
  result.activated=result.assembled&&value.activated===true;
  result.completed=result.activated&&value.completed===true&&value.endingSeen===true;
  result.endingSeen=result.completed;
  return result;
}
function storageOrDefault(storage){if(storage!==undefined)return storage;try{return globalThis.localStorage;}catch{return null;}}
export function loadJourney(storage){
  try{return createJourney(JSON.parse(storageOrDefault(storage)?.getItem(JOURNEY_KEY)||'null'));}catch{return createJourney();}
}
export function saveJourney(journey,storage){
  try{const target=storageOrDefault(storage);if(!target)return false;target.setItem(JOURNEY_KEY,JSON.stringify(createJourney(journey)));return true;}catch{return false;}
}
export function syncLegacyParts(journey,fleetProfile){
  let changed=false;
  for(const id of Object.keys(chapters)){
    if(!fleetProfile?.driveParts?.includes(id)||receipt(journey.parts?.[id])?.id===id)continue;
    journey.parts[id]=receipt({id,source:'legacy-banked',chapter:chapters[id],legacy:true,extracted:true});changed=true;
  }
  return changed;
}
export function recordBankedPart(journey,value){
  const part=receipt(value);
  if(!part||part.source!=='campaign-extraction')return false;
  const existing=receipt(journey.parts?.[part.id]);
  if(existing?.id===part.id&&!existing.legacy)return false;
  journey.parts[part.id]=part;return true;
}
export function setActFourBridge(journey,value){
  const next=bridge(value);if(!next)return false;
  if(JSON.stringify(next)===JSON.stringify(journey.actFourBridge))return false;
  journey.actFourBridge=copy(next);return true;
}
export const hasFinalComponent=journey=>receipt(journey?.parts?.['hyperbolic-core'])?.id==='hyperbolic-core';
export function bankFinalComponent(journey,value){
  const part=receipt(value);
  if(!part||part.id!=='hyperbolic-core'||hasFinalComponent(journey))return false;
  journey.parts[part.id]=part;return true;
}
export const canAssemble=journey=>DRIVE_PARTS.every(id=>receipt(journey?.parts?.[id])?.id===id);
export function assembleDrive(journey){
  if(!canAssemble(journey)||journey.assembled)return false;
  journey.assembled=true;return true;
}
const repairProof=s=>s?.activated===true&&s.charged?.compression===true&&s.charged?.klein===true&&s.charged?.echo===true;
export function activateDrive(journey,repairState){
  if(!canAssemble(journey)||!journey.assembled||!repairProof(repairState)||journey.activated)return false;
  journey.activated=true;return true;
}
export function completeRepair(journey,repairState){
  if(!canAssemble(journey)||!journey.assembled||!repairProof(repairState)||repairState.phase!=='complete'||!Number.isFinite(repairState.endingTime)||repairState.endingTime<8||journey.completed)return false;
  journey.activated=true;journey.completed=true;journey.endingSeen=true;return true;
}
