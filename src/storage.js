import {createFlight} from './simulation.js';
import {createEcologyState} from './ecology.js';
import {CHAPTERS,enterChapter,isCampaign,bossContinuationIndex} from './campaign.js';
import {OPERATIONS} from './upgrades.js';
import {createFleetProfile} from './fleet.js';
import {BUILD} from './build.js';

export const SAVE_VERSION=1;
export const SAVE_KEY='arrow-space-shift:checkpoint:v1';
export const PREFS_KEY='arrow-space-shift:preferences:v1';
export const BEST_KEY='arrow-space-shift:best-score:v1';
export const FLEET_KEY='arrow-space-shift:fleet:v1';
export const DEFAULT_PREFERENCES=Object.freeze({sound:true,volume:.5,music:true,musicVolume:.55,effectsVolume:.8,ambienceVolume:.25,juice:true,reducedMotion:false,showCore:true,patternLabels:true,manifoldCues:true});
const preferenceFlags=['sound','music','juice','reducedMotion','showCore','patternLabels','manifoldCues'];

function availableStorage(storage){
  if(storage!==undefined)return storage;
  try{return globalThis.localStorage;}catch{return null;}
}
function read(key,storage){try{return JSON.parse(availableStorage(storage)?.getItem(key)||'null');}catch{return null;}}
function write(key,value,storage){try{const target=availableStorage(storage);if(!target)return false;target.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export function clearCheckpoint(storage){try{availableStorage(storage)?.removeItem(SAVE_KEY);}catch{/* Storage can be unavailable in a private or embedded browser. */}}
const bounded=(n,max=1e9)=>Number.isFinite(n)&&n>=0&&n<=max;

export function loadPreferences(storage,systemReducedMotion=false){
  const saved=read(PREFS_KEY,storage),prefs={...DEFAULT_PREFERENCES,reducedMotion:systemReducedMotion};
  if(!saved||saved.version!==SAVE_VERSION)return prefs;
  for(const key of preferenceFlags)if(typeof saved[key]==='boolean')prefs[key]=saved[key];
  for(const key of ['volume','musicVolume','effectsVolume','ambienceVolume'])if(bounded(saved[key],1))prefs[key]=saved[key];
  return prefs;
}
export function savePreferences(preferences,storage){
  const saved={version:SAVE_VERSION};
  for(const key of preferenceFlags)if(typeof preferences[key]==='boolean')saved[key]=preferences[key];
  for(const key of ['volume','musicVolume','effectsVolume','ambienceVolume'])if(bounded(preferences[key],1))saved[key]=preferences[key];
  return write(PREFS_KEY,saved,storage);
}

export function loadFleetProfile(storage){return createFleetProfile(read(FLEET_KEY,storage));}
export function saveFleetProfile(profile,storage){return write(FLEET_KEY,createFleetProfile(profile),storage);}

// Checkpoints deliberately contain section-entry progress, never in-flight shots,
// protection windows, or damage debts. A reload therefore behaves like Retry.
export function checkpointFromFlight(s){
  if(!isCampaign(s)||s.phase==='ready')return null;
  // Boss victories are a recoverable intermission. Reloading must offer the
  // next Act, rather than silently restarting at Level 0 after extraction.
  const bossDestination=s.phase==='won'?bossContinuationIndex(s):null;
  if(s.phase==='won'&&bossDestination===null)return null; // End of current content.
  const advance=s.phase==='cleared';
  const chapterIndex=bossDestination??s.campaign.index+(advance?1:0);
  if(chapterIndex>=CHAPTERS.length||chapterIndex>BUILD.maxChapterIndex)return null;
  const source=advance||bossDestination!==null?s:s.campaign.checkpoint;
  if(!source)return null;
  return {version:SAVE_VERSION,build:BUILD.version,savedAt:new Date().toISOString(),seed:s.runSeed,bonusEnabled:s.bonusEnabled,chapterIndex,shipId:s.shipId??0,
    transitionFrom:bossDestination===null?null:s.campaign.index,
    entry:{inventory:structuredClone(source.inventory),equipped:source.equipped.map(seed=>seed?.key||null),
      score:source.score,kills:source.kills,time:source.time,upgradeSerial:source.upgradeSerial,
      foldBonus:source.foldBonus||0,foldsUsed:source.foldsUsed||0,projective:source.projective?createEcologyState(source.projective):null}};
}

export function validateCheckpoint(value){
  if(!value||value.version!==SAVE_VERSION||!Number.isInteger(value.seed)||!bounded(value.seed,0xffffffff)||
    !Number.isInteger(value.chapterIndex)||value.chapterIndex< -1||value.chapterIndex>=CHAPTERS.length||typeof value.bonusEnabled!=='boolean')return null;
  // Only the two actual boss->Act boundaries can declare a pending transition.
  // Older v1 checkpoints omit this field and remain valid.
  const transitionFrom=value.transitionFrom??null;
  if(transitionFrom!==null&&!(transitionFrom===8&&value.chapterIndex===9||transitionFrom===17&&value.chapterIndex===18))return null;
  const e=value.entry;
  if(!e||!Array.isArray(e.inventory)||e.inventory.length>14||!Array.isArray(e.equipped)||e.equipped.length!==2)return null;
  const inventory=[],keys=new Set();
  for(const seed of e.inventory){
    if(!seed||!Number.isInteger(seed.type)||!OPERATIONS[seed.type]||![1,-1].includes(seed.polarity))return null;
    const key=`${seed.type}:${seed.polarity}`;
    if(seed.key!==key||keys.has(key))return null;
    keys.add(key);inventory.push({key,type:seed.type,polarity:seed.polarity,id:OPERATIONS[seed.type].key,source:'checkpoint',instance:inventory.length+1});
  }
  const equipped=e.equipped.map(key=>key===null?null:inventory.find(seed=>seed.key===key));
  if(equipped.some(seed=>seed===undefined)||equipped[0]&&equipped[1]&&equipped[0].type===equipped[1].type)return null;
  for(const key of ['score','kills','time','upgradeSerial'])if(!bounded(e[key]))return null;
  if(!Number.isInteger(e.score)||!Number.isInteger(e.kills)||!Number.isInteger(e.upgradeSerial))return null;
  return {seed:value.seed,bonusEnabled:value.bonusEnabled,chapterIndex:value.chapterIndex,transitionFrom,
    shipId:[0,1,3,8].includes(value.shipId)?value.shipId:0,
    entry:{inventory,equipped,score:e.score,kills:e.kills,time:e.time,upgradeSerial:Math.max(e.upgradeSerial,inventory.length),
      foldBonus:bounded(e.foldBonus)?e.foldBonus:0,foldsUsed:bounded(e.foldsUsed)?e.foldsUsed:0,projective:e.projective?createEcologyState(e.projective):null}};
}
export function restoreCheckpoint(value,profile){
  const saved=validateCheckpoint(value);if(!saved)return null;
  const fleetProfile=createFleetProfile(profile);
  if(saved.transitionFrom===8&&!fleetProfile.fleetUnlocked ||
     saved.transitionFrom===17&&!fleetProfile.projectiveModule)return null;
  const s=createFlight('campaign',{seed:saved.seed,bonusEnabled:saved.bonusEnabled,fleetProfile,shipId:fleetProfile.unlockedShips.includes(saved.shipId)?saved.shipId:0});
  Object.assign(s,structuredClone(saved.entry));enterChapter(s,saved.chapterIndex);
  s.phase='paused';s.restoredCheckpoint=true;
  s.restoredTransitionFrom=saved.transitionFrom;
  s.lastEvent=saved.transitionFrom===8?'Klein Relay banked. Act II is ready to launch.':
    saved.transitionFrom===17?'Projective Module banked. Act III is ready to launch.':
    'Section checkpoint restored. Your route layout, equipment, and score are ready.';
  return s;
}
export function readCheckpoint(storage){return restoreCheckpoint(read(SAVE_KEY,storage),loadFleetProfile(storage));}
export function writeCheckpoint(s,storage){const value=checkpointFromFlight(s);return value?write(SAVE_KEY,value,storage):false;}
export function bestScore(storage){const value=read(BEST_KEY,storage);return Number.isInteger(value)&&bounded(value)?value:0;}
export function updateBestScore(score,storage){const best=Math.max(bestScore(storage),Number.isInteger(score)&&bounded(score)?score:0);write(BEST_KEY,best,storage);return best;}
