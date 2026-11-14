import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {moveBolza,geodesicStep} from '../src/hyperbolic.js';
import {forecastBolzaPair} from '../src/hyperbolic-visuals.js';
import {ACT4_STAGES,createActFour,startActFour,stepActFour,actFourAction,
  quotientDistance,quotientAim,actFourProgress,nextActFour,ACT4_SAVE_KEY,finalComponentReceipt} from '../src/hyperbolic-campaign.js';

const path=dirname(fileURLToPath(import.meta.url));
const source=rel=>readFileSync(join(path,'..',rel),'utf8');

test('Act IV has eight authored lessons, recovery waves, and a distinct ninth boss',()=>{
  assert.equal(ACT4_STAGES.length,9);
  assert.equal(new Set(ACT4_STAGES.map(x=>x.name)).size,9);
  for(let i=0;i<8;i++){
    assert.equal(ACT4_STAGES[i].actStage,i+1);
    assert.ok(ACT4_STAGES[i].waves.length>=2);
    assert.ok(ACT4_STAGES[i].brief&&ACT4_STAGES[i].hint);
  }
  assert.equal(ACT4_STAGES[8].boss,true);
});

test('real crossing preserves quotient distance without creating a ghost hitbox',()=>{
  const start={x:0,y:0},direction={x:1,y:1};
  const motion=moveBolza(start,direction,2.25,.01);
  const i=motion.segments.findIndex(x=>x.jump);
  assert.ok(i>=0,'expected a real octagon side crossing');
  const jumped=motion.segments[i];
  assert.ok(quotientDistance(jumped.from,jumped.to)<.15,'seam must be short in intrinsic quotient distance');
  const preview=forecastBolzaPair(jumped.from,direction,{lookAhead:.5});
  // Render-only preview may or may not occur for this particular forward heading.
  assert.ok(preview===null||preview.collisionEntity===false);
  const s=createActFour();startActFour(s);
  const count=s.shots.length;
  forecastBolzaPair(start,direction,{lookAhead:2.25});
  assert.equal(s.shots.length,count,'forecast cannot create an extra real shot');
});

test('combat enters normal phase with telegraphed enemies and finite live shots',()=>{
  const s=createActFour(0);assert.equal(s.phase,'ready');
  assert.equal(startActFour(s),true);assert.equal(s.phase,'running');
  assert.equal(s.enemies.length,2);
  assert.ok(s.enemies.every(e=>e.gunClock>1));
  stepActFour(s,{},1/2);assert.equal(s.player.hull,5);
  assert.ok(s.shots.length<=125);
});

test('capture only consumes an actual hostile projectile within the quotient radius',()=>{
  const s=createActFour(3);startActFour(s);
  assert.equal(actFourAction(s,'capture'),false,'without a real hostile projectile, capture fails');
  s.captureReady=0;
  s.shots.push({id:101,team:'enemy',position:{...s.player.position},heading:{x:0,y:1},age:0,life:5,speed:1,arrival:0,joins:0});
  assert.equal(actFourAction(s,'capture'),true);
  assert.equal(s.echoes,1);assert.equal(s.captures,1);
  assert.ok(!s.shots.some(x=>x.id===101));
  assert.equal(actFourAction(s,'release'),true);
  assert.equal(s.echoes,0);assert.equal(s.releases,1);
  assert.equal(s.shots.filter(x=>x.team==='player').length,3);
});

test('two-sided fold changes both projectile speeds without removing collisions',()=>{
  const s=createActFour(4);startActFour(s);
  assert.equal(actFourAction(s,'fold'),true);assert.equal(s.foldUses,1);
  assert.equal(s.foldUntil,3.2);
  assert.equal(actFourAction(s,'fold'),false,'cannot spam fold cooldown');
  assert.equal(actFourAction(s,'fire'),true);assert.equal(s.shots.length,1);
  const shot=s.shots[0],oldPosition={...shot.position};
  stepActFour(s,{},.1);
  assert.ok(quotientDistance(shot.position,oldPosition)>.28,'player shot accelerates during fold');
});

test('completed waves transition to safe recovery and next chapter; mandatory objectives cannot be skipped',()=>{
  const s=createActFour(0);startActFour(s);
  s.enemies=[];stepActFour(s,{},.01);
  assert.ok(s.breakUntil>s.time);
  assert.ok(s.shots.every(x=>x.team==='player'));
  stepActFour(s,{},.5); // .5 bounded maximum
  for(let i=0;i<5;i++)stepActFour(s,{},.5);
  assert.equal(s.waveIndex,2,'second wave appears after recovery');
  s.enemies=[];stepActFour(s,{},.01);
  for(let i=0;i<5;i++)stepActFour(s,{},.5);
  assert.equal(s.phase,'running','crossing lesson cannot be skipped by just destroying enemies');
  s.crossings=1;stepActFour(s,{},.1);
  assert.equal(s.phase,'cleared');
  const next=nextActFour(s);
  assert.equal(next.stageIndex,1);
  assert.equal(next.phase,'ready');
  assert.equal(next.player.hull,5);
});

test('stage 9 boss victory is not confused with repairing the Warp Drive',()=>{
  const s=createActFour(8);startActFour(s);
  assert.ok(s.enemies[0].boss);
  const boss=s.enemies[0];boss.hp=1;boss.gunClock=99;
  s.shots.push({id:100,team:'player',position:{...boss.position},heading:{x:0,y:1},age:0,life:5,speed:0,power:1,joins:0,arrival:0});
  stepActFour(s,{},.01);
  assert.equal(s.finalReward.state,'exposed');assert.equal(s.phase,'running');
  assert.equal(finalComponentReceipt(s),null);
  s.player.position={...s.finalReward.position};stepActFour(s,{},.5);
  assert.equal(s.finalReward.state,'collected');assert.equal(s.phase,'running');
  assert.equal(finalComponentReceipt(s),null);
  s.player.position={...s.finalReward.extractionPosition};stepActFour(s,{},.01);
  assert.equal(s.phase,'won');
  assert.equal(nextActFour(s),null);
  assert.equal(finalComponentReceipt(s).extracted,true);
  assert.equal(s.driveAssembled,undefined);assert.equal(s.campaignCompleted,undefined);
  assert.match(s.message,/repair dock/);
});

test('save schema supports resume, replay and migration without mutating legacy checkpoint key',()=>{
  assert.equal(actFourProgress(null).unlocked,0);
  assert.deepEqual(actFourProgress({version:1,unlocked:9,score:1780,completed:true}),
    {version:3,unlocked:9,score:1780,completed:true,resumeStage:8,entries:{}});
  assert.equal(actFourProgress({version:1,unlocked:99,score:10000000}).unlocked,0);
  assert.notEqual(ACT4_SAVE_KEY,'arrow-space-shift:checkpoint:v1');
  assert.match(source('src/app.js'),/Launch Act IV · The Eight Edges/);
  assert.match(source('hyperbolic-act.html'),/Bolza/);
  assert.match(source('src/hyperbolic-act.js'),/localStorage\.setItem\(ACT4_SAVE_KEY/);
});

test('geodesic flow transports heading: direct and side-crossing shots reach targets to numerical tolerance',()=>{
  for(const [a,b] of [
    [{x:0,y:-.12},{x:.38,y:.22}],
    [{x:.5,y:.2},{x:-.32,y:.35}],
    [{x:.3,y:-.3},{x:-.14,y:.48}],
  ]){
    const h=quotientAim(a,b),d=quotientDistance(a,b);
    const arrived=moveBolza(a,h,d,.012);
    assert.ok(quotientDistance(arrived.position,b)<1e-9,
      `a guided geodesic should meet its target even after seam pairing: ${JSON.stringify({a,b,arrived})}`);
  }
});

test('a deterministic manual-fire pilot can clear lesson one without bypasses',()=>{
  const s=createActFour(0);startActFour(s);
  for(let tick=0;tick<90*35&&s.phase==='running';tick++){
    const enemy=s.enemies[0];const desired=enemy?quotientAim(s.player.position,enemy.position):{x:1,y:0};
    const h=s.player.heading;
    const cross=h.x*desired.y-h.y*desired.x,dot=h.x*desired.x+h.y*desired.y;
    const diff=Math.atan2(cross,dot);
    stepActFour(s,{turn:Math.abs(diff)<.035?0:Math.sign(diff),drive:!enemy&&s.crossings<1?1:0,
      fire:!!enemy&&Math.abs(diff)<.04},1/90);
  }
  assert.equal(s.phase,'cleared');
  assert.equal(s.kills,3);
  assert.ok(s.crossings>=1);
  assert.ok(s.player.hull>=1);
});
