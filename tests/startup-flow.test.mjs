import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFlight} from '../src/simulation.js';
import {createFleetProfile} from '../src/fleet.js';
import {checkpointFromFlight,restoreCheckpoint,validateCheckpoint} from '../src/storage.js';

const relay=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay'],selectedShip:8});
const projective=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module'],selectedShip:8});

test('fresh and previously unlocked campaigns always default to Level 0',()=>{
  for(const fleetProfile of [createFleetProfile(),relay,projective]){
    const s=createFlight('campaign',{seed:314159,fleetProfile});
    assert.equal(s.campaign.index,-1,'start at the tutorial, not a previously unlocked Act');
    assert.equal(s.phase,'ready');
    assert.equal(s.fleetProfile.projectiveModule,Boolean(fleetProfile.projectiveModule),'do not erase earned modules');
    assert.equal(s.fleetProfile.fleetUnlocked,Boolean(fleetProfile.fleetUnlocked));
  }
});

test('Act II and Act III are skipped to only after an explicit unlocked-Act choice',()=>{
  assert.equal(createFlight('campaign',{seed:12,fleetProfile:relay,continueAt:9}).campaign.index,9);
  assert.equal(createFlight('campaign',{seed:12,fleetProfile:projective,continueAt:9}).campaign.index,9);
  assert.equal(createFlight('campaign',{seed:12,fleetProfile:projective,continueAt:18}).campaign.index,18);
  assert.equal(createFlight('campaign',{seed:12,fleetProfile:relay,continueAt:18}).campaign.index,-1,'cannot enter locked Act III');
  assert.equal(createFlight('campaign',{seed:12,fleetProfile:createFleetProfile(),continueAt:9}).campaign.index,-1,'cannot enter locked Act II');
  assert.equal(createFlight('campaign',{seed:12,fleetProfile:projective,continueAt:17}).campaign.index,-1,'cannot jump to arbitrary boss chapter');
});

test('previous section checkpoints still resume at their exact saved stage',()=>{
  const s=createFlight('campaign',{seed:923,fleetProfile:projective,continueAt:18});
  s.phase='running';
  const serialized=checkpointFromFlight(s);
  assert.ok(serialized);assert.equal(validateCheckpoint(serialized).chapterIndex,18);
  const restored=restoreCheckpoint(serialized,projective);
  assert.equal(restored.campaign.index,18);
  assert.equal(restored.phase,'paused');
  assert.equal(restored.restoredCheckpoint,true);
  assert.equal(restored.shipId,8);
});

test('start menu exposes explicit replay and continuation actions',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  for(const id of ['primary','continue-act2','continue-act3','start-over']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(app,/Begin at Level 0/);
  assert.match(app,/Resume Level/);
  assert.match(app,/continueUnlockedAct\(18\)/);
});
