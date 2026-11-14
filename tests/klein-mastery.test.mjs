import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,updateSpecialEnemyPhase} from '../src/simulation.js';
import {enterChapter,CHAPTERS,tickWaveDirector} from '../src/campaign.js';
import {ACT_TWO_WAVE_SCRIPTS} from '../src/waves.js';

const profile={fleetUnlocked:true,driveParts:['klein-relay'],unlockedShips:[0,1,8],selectedShip:0};

test('Klein Mastery contains three examinations, a Warden, and a quiet approach',()=>{
  const script=ACT_TWO_WAVE_SCRIPTS['klein-mastery'];
  for(const label of ['Seam Escape','Folded Opening','False Safety Crossfire','Klein Warden','Quiet approach'])assert.ok(script.waves.some(w=>w.label===label));
  const quiet=script.waves.find(w=>w.label==='Quiet approach');assert.equal(quiet.clearHostile,true);
});

test('Klein Warden changes its canonical grammar at health thresholds',()=>{
  const s=createFlight('campaign',{fleetProfile:profile});enterChapter(s,16);
  const warden=s.enemies.find(e=>e.name==='Klein Warden');assert.ok(warden);
  warden.specialPhase=1;warden.hp=8;updateSpecialEnemyPhase(s,warden);
  assert.equal(warden.specialPhase,2);assert.deepEqual(warden.patternSequence,['gap','sweep','return']);
  warden.hp=5;updateSpecialEnemyPhase(s,warden);
  assert.equal(warden.specialPhase,3);assert.ok(warden.patternSequence.includes('crossfire'));
  warden.hp=2;updateSpecialEnemyPhase(s,warden);
  assert.equal(warden.specialPhase,4);assert.ok(warden.patternSequence.includes('fan'));
  assert.equal(s.events.filter(e=>e.type==='miniboss-phase').length,3);
});

test('quiet approach clears hostile bullets once it begins',()=>{
  const s=createFlight('campaign',{fleetProfile:profile});enterChapter(s,16);
  s.enemyShots=[{sourceId:1},{sourceId:2}];s.cameraZ=CHAPTERS[16].routeLength*.9;
  tickWaveDirector(s);
  assert.equal(s.enemyShots.length,0);
  assert.ok(s.events.some(e=>e.type==='recovery-clear'));
});
