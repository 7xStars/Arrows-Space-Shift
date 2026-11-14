import test from 'node:test';
import assert from 'node:assert/strict';
import {exportProgress,importProgress,recoverProgressTransfer,TRANSFER_BACKUP_KEY} from '../src/progress-transfer.js';
import {FLEET_KEY,SAVE_KEY,PREFS_KEY,loadPreferences,savePreferences,DEFAULT_PREFERENCES} from '../src/storage.js';
import {ACT4_SAVE_KEY} from '../src/hyperbolic-campaign.js';
import {JOURNEY_KEY,createJourney,syncLegacyParts,setActFourBridge} from '../src/journey.js';
import {createFleetProfile} from '../src/fleet.js';
const memory=()=>{
  const map=new Map();return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
};
const prepared=()=>{
  const storage=memory(),profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module','curvature-seed'],selectedShip:8});
  storage.setItem(FLEET_KEY,JSON.stringify(profile));storage.setItem(SAVE_KEY,'null');
  storage.setItem(ACT4_SAVE_KEY,JSON.stringify({version:2,unlocked:2,resumeStage:2,score:900,completed:false,entries:{2:{score:900,echoes:3,seed:47}}}));
  const journey=createJourney();syncLegacyParts(journey,profile);
  setActFourBridge(journey,{shipId:8,seed:47,score:700,echoes:2,inventory:[],equipped:[null,null]});
  storage.setItem(JOURNEY_KEY,JSON.stringify(journey));
  savePreferences({...DEFAULT_PREFERENCES,musicVolume:.2,effectsVolume:.75,ambienceVolume:0},storage);
  return storage;
};
test('A complete export transfers fleet, Act IV entry, repair provenance, and independent gains',()=>{
  const from=prepared(),target=memory(),payload=exportProgress(from);
  assert.equal(payload.format,'campaign-progress');
  assert.equal(importProgress(payload,target).ok,true);
  assert.equal(JSON.parse(target.getItem(FLEET_KEY)).selectedShip,8);
  assert.equal(JSON.parse(target.getItem(ACT4_SAVE_KEY)).entries[2].echoes,3);
  assert.equal(JSON.parse(target.getItem(JOURNEY_KEY)).actFourBridge.score,700);
  assert.equal(Object.keys(JSON.parse(target.getItem(JOURNEY_KEY)).parts).length,3);
  assert.equal(loadPreferences(target).musicVolume,.2);assert.equal(loadPreferences(target).effectsVolume,.75);assert.equal(loadPreferences(target).ambienceVolume,0);
  assert.equal(target.getItem(TRANSFER_BACKUP_KEY),null);
});
test('Invalid campaign data does not replace any current progress',()=>{
  const storage=prepared(),before=[...storage.map];
  const payload=exportProgress(storage);payload.checkpoint={version:999};
  assert.throws(()=>importProgress(payload,storage),/checkpoint/);
  assert.deepEqual([...storage.map],before);
});
test('A failed multi-key write restores the previous usable progress',()=>{
  const target=prepared(),before=[...target.map],payload=exportProgress(prepared());
  payload.profile.selectedShip=1;
  const set=target.setItem;let failed=false;
  target.setItem=(key,value)=>{if(key===ACT4_SAVE_KEY&&!failed){failed=true;throw new Error('Simulated storage failure.');}return set(key,value);};
  const result=importProgress(payload,target);
  assert.deepEqual(result,{ok:false,recovered:true});
  assert.deepEqual(target.map,new Map(before));
});
test('An interrupted import restores its retained backup before continuation',()=>{
  const storage=prepared(),values=Object.fromEntries([FLEET_KEY,SAVE_KEY,ACT4_SAVE_KEY,JOURNEY_KEY,PREFS_KEY].map(key=>[key,storage.getItem(key)]));
  storage.setItem(TRANSFER_BACKUP_KEY,JSON.stringify({version:1,values}));storage.setItem(FLEET_KEY,'{}');storage.removeItem(JOURNEY_KEY);
  assert.equal(recoverProgressTransfer(storage),true);
  for(const [key,value] of Object.entries(values))assert.equal(storage.getItem(key),value);
});
test('Legacy fleet-only imports retain unrelated campaign and repair records',()=>{
  const storage=prepared(),journey=storage.getItem(JOURNEY_KEY),actFour=storage.getItem(ACT4_SAVE_KEY);
  assert.equal(importProgress({game:'Arrow Space Shift',format:'fleet-progress',profile:JSON.parse(storage.getItem(FLEET_KEY))},storage).ok,true);
  assert.equal(storage.getItem(JOURNEY_KEY),journey);assert.equal(storage.getItem(ACT4_SAVE_KEY),actFour);
});
test('Old preferences migrate to separate gains; invalid gains use safe defaults',()=>{
  const storage=memory();storage.setItem(PREFS_KEY,JSON.stringify({version:1,volume:.3,music:false,musicVolume:2,effectsVolume:-1,ambienceVolume:null}));
  const prefs=loadPreferences(storage);
  assert.equal(prefs.volume,.3);assert.equal(prefs.music,false);
  assert.equal(prefs.musicVolume,.55);assert.equal(prefs.effectsVolume,.8);assert.equal(prefs.ambienceVolume,.25);
});
test('Malformed recovery records remain present and block all import writes',()=>{
  const storage=prepared();storage.setItem(TRANSFER_BACKUP_KEY,'{broken');const before=new Map(storage.map);
  assert.equal(recoverProgressTransfer(storage),false);
  assert.deepEqual(importProgress(exportProgress(prepared()),storage),{ok:false,recovered:false});
  assert.deepEqual(storage.map,before);
});
test('A storage read failure cannot become a successful recovery or an empty export',()=>{
  const storage=prepared(),get=storage.getItem;
  storage.getItem=key=>{if(key===JOURNEY_KEY||key===TRANSFER_BACKUP_KEY)throw new Error('Read blocked.');return get(key);};
  assert.equal(recoverProgressTransfer(storage),false);
  assert.throws(()=>exportProgress(storage),/Read blocked/);
});
test('Primitive profiles cannot reset an earned fleet',()=>{
  const storage=prepared(),before=new Map(storage.map);
  for(const profile of [42,'fleet',[]])assert.throws(()=>importProgress({game:'Arrow Space Shift',format:'fleet-progress',profile},storage),/progress export/);
  assert.deepEqual(storage.map,before);
});
test('An export can retain live earned state after a persistent write fails',()=>{
  const storage=prepared(),live=JSON.parse(storage.getItem(JOURNEY_KEY));live.actFourBridge.score=1400;
  storage.setItem(JOURNEY_KEY,JSON.stringify({...live,actFourBridge:null}));
  const payload=exportProgress(storage,{journey:live});
  assert.equal(payload.journey.actFourBridge.score,1400);
  assert.equal(JSON.parse(storage.getItem(JOURNEY_KEY)).actFourBridge,null);
});
