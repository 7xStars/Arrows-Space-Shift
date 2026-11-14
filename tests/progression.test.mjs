import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetProfile,recordStageResult,markChapterReached,practiceChapters,unlockProjectiveModule,FLEET_PROFILE_VERSION} from '../src/fleet.js';

test('version 2 relay profiles migrate without losing the starter fleet',()=>{
  const profile=createFleetProfile({version:2,fleetUnlocked:true,driveParts:['klein-relay'],unlockedShips:[0,1,8],selectedShip:8});
  assert.equal(profile.version,FLEET_PROFILE_VERSION);
  assert.equal(profile.selectedShip,8);
  assert.deepEqual(profile.unlockedShips,[0,1,8]);
  assert.ok(profile.reachedChapters.includes(9));
  assert.deepEqual(practiceChapters(profile),[9]);
});

test('stage records retain best results and unlock reached practice lessons',()=>{
  const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay'],selectedShip:0});
  recordStageResult(profile,{chapter:9,name:'Return Flight',result:'cleared',score:1200,grazes:4,shipId:0,grade:{letter:'B',score:78},time:54,receipt:'a'});
  recordStageResult(profile,{chapter:9,name:'Return Flight',result:'cleared',score:1100,grazes:8,shipId:8,grade:{letter:'A',score:86},time:50,receipt:'b'});
  const record=profile.stageRecords[9];
  assert.equal(record.bestScore,1200);assert.equal(record.bestGrade,'A');assert.equal(record.bestGradeScore,86);assert.equal(record.bestGrazes,8);
  assert.equal(record.completions,2);assert.equal(record.attempts,2);
  assert.ok(profile.completedChapters.includes(9));assert.ok(profile.reachedChapters.includes(10));
  assert.deepEqual(practiceChapters(profile),[9,10]);
  assert.equal(profile.runHistory.length,2);
});

test('failed attempts create history without completing or advancing a lesson',()=>{
  const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay']});markChapterReached(profile,11);
  recordStageResult(profile,{chapter:11,name:'Returning Fire',result:'lost',score:300,grazes:2,shipId:1,cause:'RETURN projectile',receipt:'loss'});
  assert.equal(profile.stageRecords[11].attempts,1);assert.equal(profile.stageRecords[11].completions,0);
  assert.equal(profile.completedChapters.includes(11),false);assert.equal(profile.reachedChapters.includes(12),false);
  assert.equal(profile.runHistory[0].cause,'RETURN projectile');
});

test('Projective Module remains additive and unlocks all Act II practice records',()=>{
  const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay'],completedChapters:[9]});unlockProjectiveModule(profile);
  assert.deepEqual(profile.driveParts,['klein-relay','projective-module']);
  assert.equal(profile.projectiveModule,true);
  assert.deepEqual(practiceChapters(profile),[9,10,11,12,13,14,15,16,17,18]);
  const roundTrip=createFleetProfile(JSON.parse(JSON.stringify(profile)));
  assert.deepEqual(roundTrip.driveParts,profile.driveParts);assert.deepEqual(roundTrip.reachedChapters,profile.reachedChapters);
});
