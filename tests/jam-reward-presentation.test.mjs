import test from 'node:test';import assert from 'node:assert/strict';
import {campaignNotice} from '../src/interface.js';
import {createFlight} from '../src/simulation.js';import {enterChapter} from '../src/campaign.js';

test('Relay exposure and aboard states are distinct from banking at extraction',()=>{
 const s=createFlight('campaign',{seed:10});enterChapter(s,8);s.phase='running';
 s.campaign.introRemaining=0;s.campaign.announcement=null;s.campaign.bossPhase='salvage';
 s.campaign.repairPart={id:'klein-relay',collected:false};
 assert.match(campaignNotice(s)?.text||'',/Recover the Klein Relay/);
 s.campaign.repairPart.collected=true;s.campaign.bossPhase='exit';
 assert.match(campaignNotice(s)?.text||'',/Reach extraction to bank/);
 assert.equal(s.fleetProfile.fleetUnlocked,false);
});
