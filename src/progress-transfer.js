import {FLEET_KEY,SAVE_KEY,SAVE_VERSION,PREFS_KEY,validateCheckpoint,loadPreferences} from './storage.js';
import {createFleetProfile} from './fleet.js';
import {ACT4_SAVE_KEY,actFourProgress} from './hyperbolic-campaign.js';
import {JOURNEY_KEY,createJourney} from './journey.js';
export const TRANSFER_BACKUP_KEY='arrow-space-shift:transfer-backup:v1';
const keys=[FLEET_KEY,SAVE_KEY,ACT4_SAVE_KEY,JOURNEY_KEY,PREFS_KEY];
const storageFor=value=>value===undefined?globalThis.localStorage:value;
const read=(storage,key)=>{const value=storage.getItem(key);return value===null?null:JSON.parse(value);};
const checkpoint=value=>{
  if(value===null)return null;
  const normalized=validateCheckpoint(value);
  if(!normalized)throw new Error('Invalid section checkpoint.');
  return {...normalized,version:SAVE_VERSION,entry:{...normalized.entry,equipped:normalized.entry.equipped.map(seed=>seed?.key||null)}};
};
export function exportProgress(storage,live={}){
  const target=storageFor(storage);
  const value=key=>Object.hasOwn(live,key)?live[key]:read(target,{profile:FLEET_KEY,checkpoint:SAVE_KEY,actFour:ACT4_SAVE_KEY,journey:JOURNEY_KEY}[key]);
  const preferences=Object.hasOwn(live,'preferences')?live.preferences:loadPreferences({getItem:()=>JSON.stringify(read(target,PREFS_KEY))});
  return {game:'Arrow Space Shift',format:'campaign-progress',version:1,
    profile:createFleetProfile(value('profile')),checkpoint:value('checkpoint'),
    actFour:value('actFour'),journey:value('journey'),preferences};
}
export function validateProgressExport(payload){
  if(!payload||payload.game!=='Arrow Space Shift'||!payload.profile||typeof payload.profile!=='object'||Array.isArray(payload.profile))throw new Error('Not an Arrow Space Shift progress export.');
  const profile=createFleetProfile(payload.profile);
  if(payload.format==='fleet-progress')return {[FLEET_KEY]:profile};
  if(payload.format!=='campaign-progress'||payload.version!==1)throw new Error('Unsupported progress export version.');
  if(payload.actFour!==null&&(!payload.actFour||![1,2,3].includes(payload.actFour.version)||!Number.isInteger(payload.actFour.unlocked)||payload.actFour.unlocked<0||payload.actFour.unlocked>9))throw new Error('Invalid Act IV progress.');
  if(payload.journey!==null&&(!payload.journey||payload.journey.version!==1))throw new Error('Invalid repair progress.');
  const prefsStorage={getItem:key=>key===PREFS_KEY?JSON.stringify({...payload.preferences,version:SAVE_VERSION}):null};
  return {[FLEET_KEY]:profile,[SAVE_KEY]:checkpoint(payload.checkpoint),
    [ACT4_SAVE_KEY]:payload.actFour===null?null:actFourProgress(payload.actFour),
    [JOURNEY_KEY]:payload.journey===null?null:createJourney(payload.journey),
    [PREFS_KEY]:{version:SAVE_VERSION,...loadPreferences(prefsStorage)}};
}
export function recoverProgressTransfer(storage){
  let target;
  try{
    target=storageFor(storage);const saved=read(target,TRANSFER_BACKUP_KEY);
    if(!saved)return true;
    if(saved.version!==1||!saved.values||!keys.every(key=>saved.values[key]===null||typeof saved.values[key]==='string'))return false;
    for(const key of keys){const value=saved.values[key];if(value===null)target.removeItem(key);else target.setItem(key,value);}
    target.removeItem(TRANSFER_BACKUP_KEY);return true;
  }catch{return false;}
}
export function importProgress(payload,storage){
  const next=validateProgressExport(payload);let target;
  try{
    target=storageFor(storage);
    if(!recoverProgressTransfer(target))return {ok:false,recovered:false};
    const values=Object.fromEntries(keys.map(key=>[key,target.getItem(key)]));
    target.setItem(TRANSFER_BACKUP_KEY,JSON.stringify({version:1,values}));
    for(const [key,value] of Object.entries(next)){if(value===null)target.removeItem(key);else target.setItem(key,JSON.stringify(value));}
    target.removeItem(TRANSFER_BACKUP_KEY);return {ok:true,recovered:true};
  }catch{return {ok:false,recovered:recoverProgressTransfer(target)};}
}
