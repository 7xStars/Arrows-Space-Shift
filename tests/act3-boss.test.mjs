import test from 'node:test';import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {createFleetProfile} from '../src/fleet.js';
import {enterChapter} from '../src/campaign.js';
import {updateCurvaturePhase} from '../src/boss.js';
import {presentEnemy} from '../src/combat-view.js';

function gate(){const s=createFlight('campaign',{fleetProfile:createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module']}),seed:18});enterChapter(s,26);s.phase='running';s.campaign.introRemaining=0;return s;}
test('Curvature Gate teaches three phases using the existing vocabulary and clears old fire at transitions',()=>{
 const s=gate(),total=s.enemies.reduce((n,e)=>n+e.maxHp,0);
 const setHealth=ratio=>{let remaining=total*ratio;for(const e of s.enemies){e.hp=Math.min(e.maxHp,remaining);remaining-=e.hp;}};
 setHealth(.60);s.enemyShots=[{id:1,x:0,z:800,vz:-145}];assert.equal(updateCurvaturePhase(s),2);
 assert.equal(s.enemyShots.length,0);assert.ok(s.enemies[0].patternSequence.includes('return'));
 setHealth(.25);assert.equal(updateCurvaturePhase(s),3);assert.ok(s.enemies[0].patternSequence.includes('convergence'));
 assert.deepEqual(s.events.filter(x=>x.type==='curvature-phase').map(x=>x.phase),[2,3]);
});
test('Curvature Seed is a physical boss reward and is not granted on defeat or pickup alone',()=>{
 const s=gate();for(const e of s.enemies){e.hp=0;e.x=s.x;e.z=s.z;}
 s.campaign.lastDefeat={id:s.enemies[0].id,x:s.x,z:s.z};
 tick(s,{},STEP);assert.equal(s.campaign.repairPart?.id,'curvature-seed');assert.equal(s.fleetProfile.curvatureSeed,false);
 const part=s.campaign.repairPart;part.x=s.x;part.z=s.z;part.readyAt=s.time;
 tick(s,{},STEP);assert.equal(s.campaign.bossPhase,'exit');assert.equal(s.fleetProfile.curvatureSeed,false);
 s.campaign.exit.remaining=.01;tick(s,{},STEP);
 assert.equal(s.phase,'won');assert.equal(s.fleetProfile.curvatureSeed,true);
 assert.deepEqual(s.fleetProfile.driveParts,['klein-relay','projective-module','curvature-seed']);
});
