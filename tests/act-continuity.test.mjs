import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFlight} from '../src/simulation.js';
import {CHAPTERS,enterChapter,bossContinuationIndex,continueAfterBoss} from '../src/campaign.js';
import {createFleetProfile,unlockKleinFleet,unlockProjectiveModule,unlockCurvatureSeed} from '../src/fleet.js';
import {checkpointFromFlight,validateCheckpoint,restoreCheckpoint,writeCheckpoint,readCheckpoint,saveFleetProfile} from '../src/storage.js';

function storage(){
 const map=new Map();
 return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
}
function wonBoss(index,profile=createFleetProfile(),seed=2026){
 const s=createFlight('campaign',{seed,fleetProfile:profile});
 enterChapter(s,index);
 // The real boss handler awards the module at extraction; this fixture only
 // simulates that exact completed state without inventing new combat rules.
 if(index===8)unlockKleinFleet(s.fleetProfile);
 if(index===17)unlockProjectiveModule(s.fleetProfile);
 if(index===26)unlockCurvatureSeed(s.fleetProfile);
 s.phase='won';s.score=3600;s.kills=18;s.time=121;s.foldBonus=24;
 s.campaign.repairPart={id:index===8?'klein-relay':index===17?'projective-module':'curvature-seed',collected:true};
 return s;
}

test('Klein Fleet transitions to Act II in the SAME run with the banked relay',()=>{
 const s=wonBoss(8),before={seed:s.runSeed,score:s.score,time:s.time,kills:s.kills};
 assert.equal(bossContinuationIndex(s),9);
 const chosenShip=8;
 assert.equal(continueAfterBoss(s,chosenShip),true);
 assert.equal(s.campaign.index,9);
 assert.equal(CHAPTERS[s.campaign.index].name,'Return Flight');
 assert.equal(s.phase,'running');
 assert.equal(s.shipId,chosenShip);
 assert.equal(s.runSeed,before.seed);assert.equal(s.score,before.score);assert.equal(s.time,before.time);assert.equal(s.kills,before.kills);
 assert.equal(s.fleetProfile.fleetUnlocked,true);
 assert.ok(s.fleetProfile.driveParts.includes('klein-relay'));
 assert.ok(s.events.some(e=>e.type==='act-transition'&&e.from===8&&e.to===9));
});

test('Projective Intrusion transitions to Act III, retaining the relay and module',()=>{
 const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay'],selectedShip:8});
 const s=wonBoss(17,profile,419);
 const score=s.score,seed=s.runSeed;
 assert.equal(bossContinuationIndex(s),18);
 assert.equal(continueAfterBoss(s),true);
 assert.equal(s.campaign.index,18);
 assert.equal(CHAPTERS[s.campaign.index].name,'Projective Chart');
 assert.equal(s.score,score);assert.equal(s.runSeed,seed);
 assert.equal(s.shipId,8);
 assert.equal(s.fleetProfile.projectiveModule,true);
 assert.deepEqual(s.fleetProfile.driveParts,['klein-relay','projective-module']);
 assert.ok(s.projective,'Act III initializes its Echo Ecology state');
});

test('already owning Projective Module does not cause replayed Act I boss to restart at Level 0',()=>{
 const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module'],selectedShip:0});
 const s=wonBoss(8,profile);
 assert.equal(bossContinuationIndex(s),9);
 assert.equal(continueAfterBoss(s),true);
 assert.equal(s.campaign.index,9);
 assert.equal(s.fleetProfile.projectiveModule,true);
});

test('post-Klein checkpoint survives reload and resumes at Act II with the same loadout',()=>{
 const s=wonBoss(8),db=storage();
 const before=s.inventory.map(x=>x.key),profile=s.fleetProfile;
 assert.equal(saveFleetProfile(profile,db),true);
 const saved=checkpointFromFlight(s);
 assert.equal(saved.chapterIndex,9);assert.equal(saved.transitionFrom,8);
 assert.ok(saved.entry.equipped.length===2);
 assert.equal(writeCheckpoint(s,db),true);
 const restored=readCheckpoint(db);
 assert.ok(restored);assert.equal(restored.phase,'paused');
 assert.equal(restored.campaign.index,9);
 assert.equal(restored.restoredCheckpoint,true);
 assert.equal(restored.restoredTransitionFrom,8);
 assert.equal(restored.score,3600);
 assert.deepEqual(restored.inventory.map(x=>x.key),before);
 assert.ok(restored.fleetProfile.fleetUnlocked);
 assert.ok(restored.fleetProfile.driveParts.includes('klein-relay'));
});

test('post-projective checkpoint survives reload, preserving accumulated geometry modules',()=>{
 const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay'],selectedShip:8});
 const s=wonBoss(17,profile),db=storage();
 s.projective={echoes:3,capacity:6,chosen:['split-echo']};
 assert.equal(saveFleetProfile(s.fleetProfile,db),true);
 assert.equal(writeCheckpoint(s,db),true);
 const restored=readCheckpoint(db);
 assert.ok(restored);assert.equal(restored.campaign.index,18);
 assert.equal(restored.restoredTransitionFrom,17);
 assert.equal(restored.shipId,8);
 assert.ok(restored.fleetProfile.projectiveModule);
 assert.equal(restored.score,3600);
});

test('bosses cannot skip an Act before the physical reward is banked',()=>{
 const s=createFlight('campaign',{seed:5});enterChapter(s,8);
 s.phase='won';assert.equal(bossContinuationIndex(s),null);
 assert.equal(continueAfterBoss(s),false);
 assert.equal(checkpointFromFlight(s),null);
});

test('Act III Curvature Gate is a deliberate stopping point: no silent Act IV or Level 0 reset',()=>{
 const s=wonBoss(26,createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module']}));
 assert.equal(bossContinuationIndex(s),null);
 assert.equal(continueAfterBoss(s),false);
 assert.equal(s.campaign.index,26);
 assert.equal(s.phase,'won');
 assert.equal(checkpointFromFlight(s),null);
 assert.ok(s.fleetProfile.curvatureSeed);
});

test('legacy checkpoints keep restoring and malformed cross-act transitions are rejected',()=>{
 const original=createFlight('campaign',{seed:82});enterChapter(original,5);
 const cp=checkpointFromFlight(original);
 assert.ok(cp);delete cp.transitionFrom;
 assert.equal(validateCheckpoint(cp).chapterIndex,5);
 assert.equal(restoreCheckpoint(cp,createFleetProfile())?.campaign.index,5);
 const win=wonBoss(8),valid=checkpointFromFlight(win);
 assert.ok(validateCheckpoint(valid));
 assert.equal(restoreCheckpoint(valid,createFleetProfile()),null,'unearned part cannot unlock transition');
 assert.equal(validateCheckpoint({...valid,transitionFrom:17}),null);
 assert.equal(validateCheckpoint({...valid,transitionFrom:99}),null);
});

test('campaign victory UI uses explicit next-Act actions, not the generic Fly Again fallback',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/bossContinuationIndex\(flight\)/);
 assert.match(app,/continueAfterBoss\(flight,shipId\)/);
 assert.match(app,/if\(isCampaign\(flight\)&&flight\.phase!=='ready'\)return;/);
 assert.match(app,/Launch Act II/);
 assert.match(app,/Continue to Act III/);
 assert.match(app,/restoredTransitionFrom===8/);
 assert.match(app,/next Act is ready/i);
});
