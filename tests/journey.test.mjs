import test from 'node:test';
import assert from 'node:assert/strict';
import {JOURNEY_KEY,createJourney,loadJourney,saveJourney,syncLegacyParts,recordBankedPart,setActFourBridge,
  bankFinalComponent,hasFinalComponent,canAssemble,assembleDrive,activateDrive,completeRepair} from '../src/journey.js';
const final=()=>({id:'hyperbolic-core',source:'double-torus',stage:8,exposed:true,collected:true,extracted:true,seed:123,shipId:8,score:456});
const allParts=()=>{const j=createJourney();syncLegacyParts(j,{driveParts:['klein-relay','projective-module','curvature-seed']});bankFinalComponent(j,final());return j;};
const proof=(phase='complete')=>({phase,activated:true,charged:{compression:true,klein:true,echo:true},endingTime:8});

test('legacy parts retain banked provenance without inventing encounter records',()=>{
  const j=createJourney();assert.equal(syncLegacyParts(j,{driveParts:['klein-relay','hyperbolic-core']}),true);
  assert.equal(j.parts['klein-relay'].source,'legacy-banked');assert.equal(j.parts['klein-relay'].seed,null);
  assert.equal(j.parts['klein-relay'].score,null);assert.equal(j.parts['klein-relay'].legacy,true);
  assert.equal(hasFinalComponent(j),false);assert.equal(canAssemble(j),false);
  assert.equal(syncLegacyParts(j,{driveParts:['klein-relay']}),false);
});

test('new campaign extraction receipts replace legacy metadata and retain their actual source',()=>{
  const j=createJourney();syncLegacyParts(j,{driveParts:['klein-relay']});
  assert.equal(recordBankedPart(j,{id:'klein-relay',source:'campaign-extraction',chapter:17,seed:1,shipId:0,score:9,extracted:true}),false);
  const actual={id:'klein-relay',source:'campaign-extraction',chapter:8,seed:99,shipId:3,score:900,extracted:true};
  assert.equal(recordBankedPart(j,actual),true);assert.equal(j.parts['klein-relay'].legacy,false);
  assert.equal(j.parts['klein-relay'].seed,99);assert.equal(recordBankedPart(j,actual),false);
  syncLegacyParts(j,{driveParts:['klein-relay']});assert.equal(j.parts['klein-relay'].source,'campaign-extraction');
});

test('only the complete Double Torus extraction receipt banks the final component',()=>{
  for(const change of [{exposed:false},{collected:false},{extracted:false},{source:'boss-defeat'},{stage:7},{seed:-1},{shipId:19},{score:NaN}]){
    const j=createJourney();assert.equal(bankFinalComponent(j,{...final(),...change}),false);assert.equal(hasFinalComponent(j),false);
  }
  const j=createJourney();assert.equal(bankFinalComponent(j,final()),true);assert.equal(bankFinalComponent(j,final()),false);
  assert.equal(j.parts['hyperbolic-core'].seed,123);assert.equal(j.parts['hyperbolic-core'].shipId,8);
  const mismatched=createJourney();syncLegacyParts(mismatched,{driveParts:['klein-relay']});
  mismatched.parts['hyperbolic-core']=mismatched.parts['klein-relay'];assert.equal(hasFinalComponent(mismatched),false);
});

test('bridge metadata is detached and accepts equipped keys or seed objects',()=>{
  const j=createJourney(),seed={type:0,polarity:1,key:'0:1',instance:4,source:'enemy-3'};
  const value={shipId:3,seed:123,score:600,echoes:2,inventory:[seed],equipped:[seed,null]};
  assert.equal(setActFourBridge(j,value),true);seed.type=5;
  assert.equal(j.actFourBridge.inventory[0].type,0);assert.deepEqual(j.actFourBridge.equipped,['0:1',null]);
  assert.equal(setActFourBridge(j,{...value,shipId:999}),false);
  assert.deepEqual(createJourney(j).actFourBridge,j.actFourBridge);
});

test('assembly, activation, and witnessed completion remain separate persistent states',()=>{
  const partial=createJourney();assert.equal(assembleDrive(partial),false);assert.equal(completeRepair(partial,proof()),false);
  const j=allParts();assert.equal(canAssemble(j),true);assert.equal(j.assembled,false);
  assert.equal(completeRepair(j,proof()),false);assert.equal(assembleDrive(j),true);assert.equal(assembleDrive(j),false);
  assert.equal(j.activated,false);assert.equal(j.completed,false);
  assert.equal(activateDrive(j,proof('ending')),true);assert.equal(j.completed,false);
  assert.equal(completeRepair(j,{...proof(),endingTime:7.9}),false);
  assert.equal(completeRepair(j,{...proof(),endingTime:NaN}),false);
  assert.equal(completeRepair(j,{...proof(),endingTime:undefined}),false);
  assert.equal(completeRepair(j,{...proof(),charged:{compression:true,klein:false,echo:true}}),false);
  assert.equal(completeRepair(j,proof()),true);assert.equal(j.endingSeen,true);
  assert.equal(completeRepair(j,proof()),false);assert.deepEqual(createJourney(j),j);
});

test('reload cannot turn partial extraction or unsupported save flags into completion',()=>{
  const unearned={version:1,parts:{'hyperbolic-core':{...final(),extracted:false}},assembled:true,activated:true,completed:true,endingSeen:true};
  const restored=createJourney(unearned);assert.deepEqual(restored.parts,{});assert.equal(restored.completed,false);assert.equal(restored.assembled,false);
  assert.equal(createJourney({...allParts(),assembled:true,activated:true,completed:true,endingSeen:false}).completed,false);
  assert.equal(createJourney({...unearned,version:99}).completed,false);
});

test('journey save is additive and a rejected write leaves the previous save available',()=>{
  const values=new Map([['arrow-space-shift:fleet:v1','original-profile']]);
  const store={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  const j=allParts();assert.equal(saveJourney(j,store),true);assert.equal(values.get('arrow-space-shift:fleet:v1'),'original-profile');
  assert.deepEqual(loadJourney(store),j);
  const old=values.get(JOURNEY_KEY);store.setItem=()=>{throw new Error('Storage full');};
  assert.equal(saveJourney({...j,assembled:true},store),false);assert.equal(values.get(JOURNEY_KEY),old);
  assert.equal(loadJourney({getItem:()=>'{broken'}).completed,false);assert.equal(saveJourney(j,null),false);
});
