import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILD,isActAvailable,isJamCampaignComplete,isJamCompletionEntry} from '../src/build.js';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {enterChapter} from '../src/campaign.js';
import {createFleetProfile} from '../src/fleet.js';
import {writeCheckpoint,readCheckpoint,saveFleetProfile,loadFleetProfile} from '../src/storage.js';
import {createJourney,saveJourney,loadJourney,syncLegacyParts,bankFinalComponent} from '../src/journey.js';

const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
const profile=()=>createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module'],selectedShip:8});

test('the jam release exposes only the first three Acts',()=>{
  assert.equal(BUILD.maxAct,3);assert.equal(BUILD.maxChapterIndex,26);assert.equal(BUILD.postJamContent,false);
  for(const act of [1,2,3])assert.equal(isActAvailable(act),true);
  for(const act of [0,4,5,-1,1.5,'3',null,undefined])assert.equal(isActAvailable(act),false);
});

test('the jam end requires physical collection and successful Curvature Seed extraction',()=>{
  const state=createFlight('campaign',{fleetProfile:profile(),seed:503});enterChapter(state,26);
  state.phase='running';state.campaign.introRemaining=0;
  assert.equal(isJamCampaignComplete(state),false);
  for(const enemy of state.enemies){enemy.hp=0;enemy.x=state.x;enemy.z=state.z;}
  state.campaign.lastDefeat={id:state.enemies[0].id,x:state.x,z:state.z};
  tick(state,{},STEP);
  assert.equal(state.campaign.repairPart.id,'curvature-seed');
  assert.equal(isJamCampaignComplete(state),false);
  const part=state.campaign.repairPart;part.x=state.x;part.z=state.z;part.readyAt=state.time;
  tick(state,{},STEP);
  assert.equal(state.campaign.bossPhase,'exit');
  assert.equal(isJamCampaignComplete(state),false);
  state.campaign.exit.remaining=.01;tick(state,{},STEP);
  assert.equal(state.phase,'won');assert.equal(state.fleetProfile.curvatureSeed,true);
  assert.equal(isJamCampaignComplete(state),true);
  assert.ok(state.events.some(event=>event.type==='boss-extracted'&&event.part==='curvature-seed'));
  assert.equal(isJamCampaignComplete({...state,practice:true}),false);
  assert.equal(isJamCampaignComplete({...state,phase:'lost'}),false);
  assert.equal(isJamCampaignComplete({...state,campaign:{...state.campaign,index:17}}),false);
});

test('the release gate preserves a saved Act III checkpoint and the earned replay entry',()=>{
  const db=memory(),state=createFlight('campaign',{fleetProfile:profile(),seed:505,continueAt:18});
  state.phase='running';enterChapter(state,24);
  assert.equal(saveFleetProfile(state.fleetProfile,db),true);assert.equal(writeCheckpoint(state,db),true);
  const restored=readCheckpoint(db);assert.equal(restored.campaign.index,24);
  assert.equal(restored.phase,'paused');assert.equal(restored.runSeed,505);
  const earned=createFleetProfile({...state.fleetProfile,driveParts:['klein-relay','projective-module','curvature-seed']});
  assert.equal(saveFleetProfile(earned,db),true);
  const replay=createFlight('campaign',{fleetProfile:loadFleetProfile(db),seed:506,continueAt:18});
  assert.equal(replay.campaign.index,18);assert.equal(replay.fleetProfile.curvatureSeed,true);
  assert.equal(isJamCompletionEntry(restored,earned),false);
  const entry=createFlight('campaign',{fleetProfile:loadFleetProfile(db),seed:507});
  assert.equal(entry.phase,'ready');assert.equal(isJamCompletionEntry(entry),true);
  assert.equal(isJamCompletionEntry({...entry,restoredCheckpoint:true}),false);
  assert.equal(isJamCompletionEntry(createFlight('campaign',{fleetProfile:profile(),seed:508})),false);
});

test('hiding later Acts does not erase their saved receipt or award Warp Drive completion',()=>{
  const db=memory(),journey=createJourney();syncLegacyParts(journey,{driveParts:['klein-relay','projective-module','curvature-seed']});
  const receipt={id:'hyperbolic-core',source:'double-torus',stage:8,exposed:true,collected:true,extracted:true,seed:504,shipId:8,score:45};
  assert.equal(bankFinalComponent(journey,receipt),true);assert.equal(saveJourney(journey,db),true);
  const before=structuredClone(journey),loaded=loadJourney(db);
  assert.deepEqual(loaded,before);assert.equal(isActAvailable(4),false);
  assert.deepEqual(journey,before);assert.equal(loaded.completed,false);assert.equal(loaded.activated,false);assert.equal(loaded.assembled,false);
});
