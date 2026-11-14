import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {enterChapter,arenaY,arenaZ,CHAPTERS} from '../src/campaign.js';
import {createFleetProfile,unlockProjectiveModule,unlockKleinFleet,recordStageResult,craftAftwing,fabricationStatus,selectShip,shipById,STARTER_SHIPS,SHIPS} from '../src/fleet.js';
import {saveFleetProfile,loadFleetProfile,checkpointFromFlight,restoreCheckpoint} from '../src/storage.js';
import {createActFour,actFourShip} from '../src/hyperbolic-campaign.js';

const relay=()=>createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay']});
const advanced=()=>{const p=relay();unlockProjectiveModule(p);return createFleetProfile(p);};

test('Act I and the three starter hulls remain unchanged in the foundry release',()=>{
  assert.deepEqual(CHAPTERS.slice(0,9).map(c=>c.name),['Two Sides','Quiet Belt','Counter Cycle','Loose Stones','Seven Operations','Drift Field','Front and Back','Last Approach','The Klein Fleet']);
  assert.deepEqual(STARTER_SHIPS.map(s=>[s.id,s.name,s.speed,s.coreRadius]),[[0,'Arrow',360,18],[1,'Skater',440,18],[8,'Needle',320,15]]);
  assert.equal(SHIPS.length,4);
});

test('blueprint remains locked until Projective Module and salvage has been earned',()=>{
  const p=relay();assert.equal(fabricationStatus(p).available,0);assert.equal(fabricationStatus(p).blueprint,false);
  assert.equal(craftAftwing(p),false);assert.deepEqual(p.unlockedShips,[0,1,8]);
  recordStageResult(p,{chapter:9,result:'cleared',receipt:'9a'});
  recordStageResult(p,{chapter:9,result:'cleared',receipt:'9b'});
  assert.equal(fabricationStatus(p).earned,1,'two completions of one lesson generate one salvage');
  assert.equal(craftAftwing(p),false);
});

test('Projective Module unlocks Aftwing recipe, unique clears fund it, crafting cannot charge twice',()=>{
  const p=advanced();const stock=fabricationStatus(p);
  assert.equal(stock.blueprint,true);assert.equal(stock.earned,8);assert.equal(stock.available,8);
  assert.equal(craftAftwing(p),true);assert.equal(fabricationStatus(p).available,3);assert.equal(craftAftwing(p),false);
  assert.deepEqual(p.craftedShipIds,[3]);assert.equal(p.fabricationSpent,5);assert.ok(p.unlockedShips.includes(3));
  assert.equal(selectShip(p,3),true);assert.equal(p.selectedShip,3);
  const normalized=createFleetProfile(JSON.parse(JSON.stringify(p)));
  assert.equal(normalized.selectedShip,3);assert.deepEqual(normalized.craftedShipIds,[3]);assert.equal(fabricationStatus(normalized).available,3);
  unlockKleinFleet(normalized);assert.ok(normalized.unlockedShips.includes(3),'replaying the Klein boss cannot erase a crafted hull');
});

test('the recovered ship cannot be conjured by an unearned ID or invalid checkpoint',()=>{
  const p=relay();assert.equal(selectShip(p,3),false);
  const forged=createFleetProfile({...p,unlockedShips:[0,1,3,8],craftedShipIds:[3],selectedShip:3});
  assert.equal(forged.selectedShip,0);assert.equal(forged.unlockedShips.includes(3),false);
});

test('created ship survives persistence and checkpoint restore, even when old checkpoints lack it',()=>{
  const p=advanced();assert.equal(craftAftwing(p),true);assert.equal(selectShip(p,3),true);
  const mem=new Map(),storage={getItem:key=>mem.get(key)??null,setItem:(key,value)=>mem.set(key,value),removeItem:key=>mem.delete(key)};
  assert.equal(saveFleetProfile(p,storage),true);const loaded=loadFleetProfile(storage);assert.equal(loaded.selectedShip,3);
  const s=createFlight('campaign',{fleetProfile:loaded,shipId:3,seed:88});enterChapter(s,19);
  const checkpoint=checkpointFromFlight(s);assert.equal(checkpoint.shipId,3);
  const resumed=restoreCheckpoint(checkpoint,loaded);assert.equal(resumed.shipId,3);assert.equal(resumed.phase,'paused');
  const safe=restoreCheckpoint(checkpoint,relay());assert.equal(safe.shipId,0,'a checkpoint cannot equip a hull the profile does not own');
});

test('Aftwing retains its stats without adding main-campaign throttle authority',()=>{
  const p=advanced();craftAftwing(p);
  const base=createFlight('campaign',{fleetProfile:p,shipId:0,seed:61});enterChapter(base,9);base.shipId=0;
  const aft=createFlight('campaign',{fleetProfile:p,shipId:3,seed:61});enterChapter(aft,9);aft.shipId=3;
  for(const s of [base,aft]){s.enemies=[];s.asteroids=[];s.enemyShots=[];s.shots=[];s.drive.nextFaultAt=1e9;s.z=arenaZ(s,300);}
  const previous=base.cameraZ;
  tick(base,{horizontal:0,throttle:-1,fire:false},STEP);tick(aft,{horizontal:0,throttle:-1,fire:false},STEP);
  assert.ok(Math.abs(arenaY(aft,aft.z)-300)<1e-6);
  assert.ok(Math.abs(arenaY(base,base.z)-300)<1e-6);
  assert.equal(shipById(3).reverseFactor,1.5);assert.ok(base.cameraZ>previous);assert.ok(aft.cameraZ>previous);
  // Local Act IV drive retains the distinct reverse speed.
  const arrowLocal=actFourShip(createActFour(0,{shipId:0}));
  const aftLocal=actFourShip(createActFour(0,{shipId:3}));
  assert.ok(aftLocal.reverse>arrowLocal.reverse);
  assert.ok(aftLocal.speed<arrowLocal.speed);
  const old=createFlight('campaign',{fleetProfile:p,seed:62});enterChapter(old,7);old.z=arenaZ(old,200);old.shipId=3;
  const before=arenaY(old,old.z);tick(old,{horizontal:0,throttle:-1,fire:false},STEP);
  assert.ok(Math.abs(arenaY(old,old.z)-before)<1e-6);
});

test('new sprite is present in the atlas and separate PNG; geometry issue remains deferred',()=>{
  const root=new URL('../',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('../assets/crossing/manifest.json',import.meta.url)));
  assert.ok(manifest.frames['player.aftwing']);assert.ok(manifest.frames['player.aftwing-down']);
  assert.ok(fs.existsSync(new URL('../assets/crossing/player.aftwing.png',import.meta.url)));
  assert.match(fs.readFileSync(new URL('../docs/KNOWN-ISSUES.md',import.meta.url),'utf8'),/K#RP\^2|K\\#\\mathbb/);
});
