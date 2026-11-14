import test from 'node:test';
import assert from 'node:assert/strict';
import {ACT_TWO_WAVE_SCRIPTS} from '../src/waves.js';
import {CHAPTERS,enterChapter,tickWaveDirector,calculateStageGrade,creditSeamTraversal,creditFoldDecision} from '../src/campaign.js';
import {createFlight,tick,STEP} from '../src/simulation.js';

const relayProfile={fleetUnlocked:true,driveParts:['klein-relay'],unlockedShips:[0,1,8],selectedShip:0};
const flightAt=index=>{const s=createFlight('campaign',{seed:42,fleetProfile:relayProfile});enterChapter(s,index);s.phase='running';return s;};

test('every scripted recovery is actually hostile-fire-free by default',()=>{
  for(const [id,script] of Object.entries(ACT_TWO_WAVE_SCRIPTS)){
    const breaks=script.waves.filter(w=>w.kind==='break');
    assert.ok(breaks.length,`${id} should teach with breaks`);
    for(const wave of breaks) assert.equal(wave.clearHostile,true,`${id}/${wave.id}`);
  }
});

test('recovery clears previous bullets and cancels attack telegraphs',()=>{
  const s=flightAt(12),c=CHAPTERS[12];
  s.enemyShots.push({owner:'enemy',x:0,z:200,vx:0,vz:-120});
  const enemy=s.enemies[0];enemy.waveActive=true;enemy.clock=0;
  enemy.telegraph={patternKey:'fan',due:s.time,remaining:0};
  s.cameraZ=c.routeLength*.22;tickWaveDirector(s);
  assert.equal(s.campaign.currentWave.kind,'break');
  assert.equal(s.enemyShots.length,0);
  assert.equal(enemy.telegraph,null);
  assert.ok(s.events.some(e=>e.type==='recovery-clear'));
  // An old active carrier may still exist; no new attack is permitted until
  // the next combat wave. The camera continues to move normally during rest.
  const before=s.cameraZ;
  tick(s,{horizontal:0,throttle:0,fire:false},STEP);
  assert.ok(s.cameraZ>before);
  assert.equal(s.enemyShots.length,0);
  assert.equal(enemy.telegraph,null);
});

test('raw seam/fold input counts no longer purchase grade credit',()=>{
  const s={hull:5,enemies:[{hp:1}],campaign:{defeated:0,metrics:{grazes:0,seamCrossings:100,folds:100,unfolds:100,seamEvidence:0,foldEvidence:0}}};
  let grade=calculateStageGrade(s,{kleinSurface:true,lesson:'surface'});
  assert.equal(grade.topology,0);
  grade=calculateStageGrade(s,{kleinSurface:true,lesson:'timing'});
  assert.equal(grade.control,0);
});

test('side seam grade evidence is capped to one per route segment',()=>{
  const s=flightAt(9),c=CHAPTERS[9];
  s.cameraZ=c.routeLength*.2;
  assert.equal(creditSeamTraversal(s,[{edge:'left'}]),true);
  assert.equal(creditSeamTraversal(s,[{edge:'right'}]),false);
  assert.equal(creditSeamTraversal(s,[{edge:'top'}]),false);
  assert.equal(s.campaign.metrics.seamEvidence,1);
  s.cameraZ=c.routeLength*.35;
  assert.equal(creditSeamTraversal(s,[{edge:'left'}]),true);
  assert.equal(s.campaign.metrics.seamEvidence,2);
});

test('manual fold grade credit requires threat, avoids automation, and is capped per wave',()=>{
  const s=flightAt(14),c=CHAPTERS[14];
  s.cameraZ=c.routeLength*.34;tickWaveDirector(s);
  s.enemyShots=[{owner:'enemy',x:0,z:300,vx:0,vz:-130}];
  assert.equal(creditFoldDecision(s,true),false);
  assert.equal(creditFoldDecision(s,false),true);
  assert.equal(creditFoldDecision(s,false),false);
  assert.equal(s.campaign.metrics.foldEvidence,1);
  s.cameraZ=c.routeLength*.49;tickWaveDirector(s);
  assert.equal(s.campaign.currentWave.kind,'break');
  assert.equal(creditFoldDecision(s,false),false);
});
