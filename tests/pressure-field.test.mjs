import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,grazePlayer} from '../src/simulation.js';
import {enterChapter,CHAPTERS,calculateStageGrade} from '../src/campaign.js';
import {ACT_TWO_WAVE_SCRIPTS} from '../src/waves.js';
import {DEFAULT_PREFERENCES} from '../src/storage.js';

const profile={fleetUnlocked:true,driveParts:['klein-relay'],unlockedShips:[0,1,8],selectedShip:0};

test('Pressure Field contains density waves, anchors, recovery, and a miniboss',()=>{
  const script=ACT_TWO_WAVE_SCRIPTS['pressure-field'];
  assert.ok(script.waves.some(w=>w.label==='Anchor field'));
  assert.ok(script.waves.some(w=>w.kind==='break'&&w.label==='Recovery corridor'));
  assert.ok(script.waves.some(w=>w.label==='Field Overseer'&&w.kind==='miniboss'));
  const roles=script.waves.flatMap(w=>w.members||[]).map(m=>m.role);
  assert.ok(roles.includes('popcorn'));assert.ok(roles.includes('anchor'));assert.ok(roles.includes('miniboss'));
});

test('Pressure Field enters with three warning slots and authored roles',()=>{
  const s=createFlight('campaign',{fleetProfile:profile});enterChapter(s,15);
  assert.equal(CHAPTERS[15].name,'Pressure Field');
  assert.equal(CHAPTERS[15].maxConcurrentWarnings,3);
  assert.ok(s.enemies.some(e=>e.role==='anchor'));
  assert.ok(s.enemies.some(e=>e.role==='miniboss'));
});

test('graze is awarded once per projectile and affects precision grade',()=>{
  const s=createFlight('campaign',{fleetProfile:profile});enterChapter(s,15);s.phase='running';
  const shot={x:s.x+20,z:s.z,sourceId:9,pattern:'fan'};
  assert.equal(grazePlayer(s,shot),true);assert.equal(grazePlayer(s,shot),false);
  assert.equal(s.campaign.metrics.grazes,1);assert.equal(s.score,5);
  const grade=calculateStageGrade(s,CHAPTERS[15]);assert.ok(grade.precision>0);
});

test('collision core visibility is enabled by default',()=>{
  assert.equal(DEFAULT_PREFERENCES.showCore,true);
  assert.equal(DEFAULT_PREFERENCES.patternLabels,true);
});
