import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {enterChapter,CHAPTERS} from '../src/campaign.js';
import {traceKleinProjective,KLEIN_BOUNDS} from '../src/klein.js';
import {updateHybridPhase} from '../src/boss.js';

const profile={fleetUnlocked:true,driveParts:['klein-relay'],unlockedShips:[0,1,8],selectedShip:0};

function hybridFlight(){
  const s=createFlight('campaign',{fleetProfile:profile});
  enterChapter(s,17);s.campaign.introRemaining=0;s.campaign.announcement=null;
  return s;
}

test('hybrid quotient retains Klein side transport and adds projective top transport',()=>{
  const side=traceKleinProjective({x:390,y:300},30,80);
  assert.equal(side.crossings[0].edge,'right');
  assert.equal(side.crossings[0].rule,'klein');
  assert.equal(side.twists,1);
  assert.ok(side.y<KLEIN_BOUNDS.top+1);

  const top=traceKleinProjective({x:150,y:940},25,30);
  assert.equal(top.crossings[0].edge,'top');
  assert.equal(top.crossings[0].rule,'projective');
  assert.equal(top.projectiveCrossings,1);
  assert.ok(top.x<0,'projective transport flips the longitudinal representative');
});

test('hybrid boss progresses through Klein, intrusion, hybrid, and mastery phases',()=>{
  const s=hybridFlight();
  assert.equal(CHAPTERS[17].hybrid,true);assert.equal(s.campaign.hybridPhase,1);
  const total=s.enemies.reduce((n,e)=>n+e.maxHp,0);
  const setRemaining=ratio=>{
    let remaining=Math.floor(total*ratio);
    for(const enemy of s.enemies){const hp=Math.min(enemy.maxHp,remaining);enemy.hp=hp;remaining-=hp;}
  };
  setRemaining(.74);assert.equal(updateHybridPhase(s),2);
  assert.equal(s.enemies[2].geometryRule,'projective');
  assert.deepEqual(s.enemies[0].patternSequence,['gap','fan']);
  setRemaining(.49);assert.equal(updateHybridPhase(s),3);
  assert.equal(s.enemies[0].geometryRule,'hybrid');
  assert.ok(s.enemies[0].patternSequence.includes('crossfire'));
  setRemaining(.24);assert.equal(updateHybridPhase(s),4);
  assert.equal(s.enemies[1].geometryRule,'klein');
  assert.equal(s.enemies[2].geometryRule,'projective');
  assert.equal(s.events.filter(e=>e.type==='hybrid-phase').length,3);
});

test('Projective Module must be physically collected and extracted, then persists beside the relay',()=>{
  const s=hybridFlight();
  for(const enemy of s.enemies){enemy.hp=0;enemy.x=s.x;enemy.z=s.z;}
  s.campaign.lastDefeat={x:s.x,z:s.z,id:s.enemies.at(-1).id};
  tick(s,{horizontal:0,throttle:0,fire:false},STEP);
  assert.equal(s.campaign.bossPhase,'salvage');
  assert.equal(s.campaign.repairPart.id,'projective-module');
  assert.equal(s.fleetProfile.driveParts.includes('projective-module'),false,'defeat alone does not bank the module');

  s.campaign.repairPart.x=s.x;s.campaign.repairPart.z=s.z;s.campaign.repairPart.readyAt=s.time;
  tick(s,{horizontal:0,throttle:0,fire:false},STEP);
  assert.equal(s.campaign.bossPhase,'exit');
  assert.equal(s.fleetProfile.driveParts.includes('projective-module'),false,'pickup alone does not bank the module');

  s.campaign.exit.remaining=.01;
  tick(s,{horizontal:0,throttle:0,fire:false},STEP);
  assert.equal(s.phase,'won');
  assert.ok(s.fleetProfile.driveParts.includes('klein-relay'));
  assert.ok(s.fleetProfile.driveParts.includes('projective-module'));
  assert.equal(s.fleetProfile.projectiveModule,true);
  assert.ok(s.events.some(e=>e.type==='boss-extracted'&&e.part==='projective-module'));
});
