import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight} from '../src/simulation.js';
import {enterChapter,hybridProjectiveActive,arenaZ} from '../src/campaign.js';
import {updateHybridPhase} from '../src/boss.js';
import {playerJoinForecast} from '../src/geometry-cues.js';

function boss(){
  const s=createFlight('campaign',{seed:2514});enterChapter(s,17);s.phase='running';s.campaign.introRemaining=0;
  s.x=125;s.z=arenaZ(s,915);s.facing=1;return s;
}
const health=(s,ratio)=>{for(const enemy of s.enemies)enemy.hp=enemy.maxHp*ratio;};

test('a later hybrid recovery never disarms an already active player join',()=>{
  const s=boss();health(s,.45);updateHybridPhase(s);
  assert.equal(s.campaign.hybridPhase,3);assert.equal(hybridProjectiveActive(s),false);
  const readyAt=s.campaign.hybridJoinReadyAt;s.time=readyAt+.01;
  assert.equal(hybridProjectiveActive(s),true);
  assert.equal(playerJoinForecast(s,{horizontalVelocity:0,horizon:2})?.rule,'projective');
  health(s,.2);updateHybridPhase(s);
  assert.equal(s.campaign.hybridPhase,4);assert.ok(s.campaign.phaseBreakUntil>s.time);
  assert.equal(s.campaign.hybridJoinReadyAt,readyAt);
  assert.equal(hybridProjectiveActive(s),true);
  assert.equal(playerJoinForecast(s,{horizontalVelocity:0,horizon:2})?.rule,'projective');
  assert.match(s.campaign.announcement.text,/join stays active/);
});

test('rapid damage preserves the first arming deadline through the next recovery',()=>{
  const s=boss();health(s,.45);updateHybridPhase(s);const readyAt=s.campaign.hybridJoinReadyAt;
  s.time=.4;health(s,.2);updateHybridPhase(s);
  assert.equal(s.campaign.hybridJoinReadyAt,readyAt);
  assert.equal(hybridProjectiveActive(s),false);
  s.time=readyAt-1e-6;assert.equal(hybridProjectiveActive(s),false);
  s.time=readyAt;assert.equal(hybridProjectiveActive(s),true);
  assert.ok(s.time<s.campaign.phaseBreakUntil,'attack recovery may outlast the join warning');
});

test('skipping directly to the last hybrid phase still requires the initial warning',()=>{
  const s=boss();s.time=3;health(s,.2);updateHybridPhase(s);
  assert.equal(s.campaign.hybridPhase,4);assert.equal(s.campaign.hybridJoinReadyAt,5.2);
  assert.equal(hybridProjectiveActive(s),false);
  assert.equal(playerJoinForecast(s,{horizontalVelocity:0,horizon:2})?.rule,'periodic');
  s.time=5.2;assert.equal(hybridProjectiveActive(s),true);
});
