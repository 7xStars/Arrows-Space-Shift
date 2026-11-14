import test from 'node:test';
import assert from 'node:assert/strict';
import {createActFour,startActFour,stepActFour,actFourAction,actFourShip,quotientAim,quotientDistance,
  seedActFourBridge,rememberActFourStage,restoreActFour,recordActFourClear,finalComponentReceipt,sweptBolzaHit,actFourForecastMotion,actFourShotForecastMotion} from '../src/hyperbolic-campaign.js';
import {createJourney,bankFinalComponent,hasFinalComponent} from '../src/journey.js';
import {moveBolza} from '../src/hyperbolic.js';
import {forecastBolzaPair} from '../src/hyperbolic-visuals.js';

const point=(x,y)=>({x,y});
const path=(from,to,jump=false)=>[{from,to,jump}];

test('ship previews use stable signed thrust and cannot predict forward motion while stopped or reversing',()=>{
  const s=createActFour();startActFour(s);s.player.position=point(.6,0);s.player.heading=point(1,0);
  assert.equal(actFourForecastMotion(s,{drive:0}),null);
  s.player.driveVelocity=1;
  assert.equal(actFourForecastMotion(s,{drive:-1}),null,'a reverse command during braking has no constant-speed forecast');
  s.player.driveVelocity=-1;
  const reverse=actFourForecastMotion(s,{drive:-1});assert.equal(reverse.heading.x,-1);
  assert.equal(forecastBolzaPair(reverse.position,reverse.heading,{lookAhead:reverse.distance}),null,'reverse thrust moves away from the right join');
  s.player.position=point(-.6,0);
  const crossing=actFourForecastMotion(s,{drive:-1}),preview=forecastBolzaPair(crossing.position,crossing.heading,{lookAhead:crossing.distance,stepLimit:.02});
  const actual=moveBolza(s.player.position,s.player.heading,-crossing.distance,.02),segment=actual.segments.find(x=>x.jump);
  assert.ok(preview&&segment);assert.deepEqual(preview.destination,segment.to);
  assert.equal(actFourForecastMotion(s,{drive:-1,turn:1}),null,'turning does not promise a straight continuation');
  assert.equal(actFourForecastMotion(s,{drive:0}),null,'a released command has no imminent travel marker');
  s.paused=true;assert.equal(actFourForecastMotion(s,{drive:-1}),null);
});

test('projectile previews stop at expiry and apply only the remaining fold speed interval',()=>{
  const s=createActFour();startActFour(s);
  const shot={position:point(.6,0),heading:point(1,0),speed:1.04,age:4.92,life:5};
  const short=actFourShotForecastMotion(s,shot);
  assert.ok(short);assert.equal(forecastBolzaPair(short.position,short.heading,{lookAhead:short.distance}),null);
  shot.age=4.5;
  const long=actFourShotForecastMotion(s,shot),preview=forecastBolzaPair(long.position,long.heading,{lookAhead:long.distance,stepLimit:.02});
  const actual=moveBolza(shot.position,shot.heading,long.distance,.02).segments.find(x=>x.jump);
  assert.ok(preview&&actual);assert.deepEqual(preview.destination,actual.to);
  shot.age=4.999;assert.equal(actFourShotForecastMotion(s,shot),null);
  shot.age=5;assert.equal(actFourShotForecastMotion(s,shot),null);
  shot.age=4.5;s.time=2;s.foldUntil=2.05;
  const partial=actFourShotForecastMotion(s,shot);
  assert.ok(partial.distance>long.distance);
  assert.ok(partial.distance<long.distance*1.38,'the fold must not accelerate the full forecast horizon');
  assert.ok(partial.distance-long.distance<=shot.speed*.38*.05);
  s.foldUntil=1;assert.equal(actFourShotForecastMotion(s,shot).distance,long.distance);
});

test('Act IV bridge, stage continuation and retry keep ship and ordered equipment metadata',()=>{
  const bridge={shipId:8,seed:311,score:2300,echoes:4,inventory:[{key:'0:1',type:0,polarity:1},{key:'1:-1',type:1,polarity:-1}],equipped:['1:-1','0:1']};
  let progress=seedActFourBridge(null,bridge),s=restoreActFour(progress);
  assert.equal(s.shipId,8);assert.equal(s.score,2300);assert.equal(s.echoes,4);
  assert.deepEqual(s.equipped,bridge.equipped);assert.deepEqual(s.inventory,bridge.inventory);
  progress=rememberActFourStage(progress,s);s.phase='cleared';s.score=2600;s.echoes=3;
  progress=recordActFourClear(progress,s);s=restoreActFour(JSON.parse(JSON.stringify(progress)));
  assert.equal(s.stageIndex,1);assert.equal(s.shipId,8);assert.equal(s.seed,311);
  assert.equal(s.score,2600);assert.equal(s.echoes,3);assert.deepEqual(s.equipped,bridge.equipped);
  assert.deepEqual(seedActFourBridge(progress,{...bridge,score:9999}),progress,'later handoffs cannot reset an active Act IV run');
});

test('ship differences affect actual speed, turn, reverse thrust and collision core',()=>{
  const ships=[0,1,8,3].map(shipId=>createActFour(0,{shipId}));
  for(const s of ships){startActFour(s);stepActFour(s,{drive:1},.5);}
  const travelled=ships.map(s=>quotientDistance(point(0,-.12),s.player.position));
  assert.ok(travelled[1]>travelled[0]);assert.ok(travelled[0]>travelled[2]);
  assert.ok(actFourShip(ships[2]).core<actFourShip(ships[0]).core);
  assert.ok(actFourShip(ships[3]).reverse>actFourShip(ships[0]).reverse);
  assert.ok(actFourShip(ships[1]).turn<actFourShip(ships[0]).turn);
});

test('boss phase changes announce scheduled attacks and supply a safe recovery interval',()=>{
  const s=createActFour(8);startActFour(s);stepActFour(s,{},.5);
  const boss=s.enemies[0];assert.equal(s.bossPhase,1);
  boss.hp=30;s.shots.push({id:999,team:'enemy',position:point(.3,.1),heading:point(1,0),age:0,life:5,speed:1,joins:0});
  stepActFour(s,{},.01);assert.equal(s.bossPhase,2);assert.equal(s.shots.length,0);
  const recoveryEnd=s.bossRecoveryUntil;
  while(s.time<recoveryEnd-.05)stepActFour(s,{},.05);
  assert.equal(s.events.filter(e=>e.type==='enemy-volley').length,0);
  while(!s.events.some(e=>e.type==='pattern-warning'&&e.patternKey==='return'))stepActFour(s,{},.05);
  const warning=s.events.find(e=>e.type==='pattern-warning'&&e.patternKey==='return');assert.ok(warning.fireAt>s.time-.05);
  while(!s.events.some(e=>e.type==='enemy-volley'))stepActFour(s,{},.05);
  const shot=s.events.find(e=>e.type==='enemy-volley');assert.equal(shot.pattern,'edge');
  assert.ok(shot.t>=warning.fireAt-.002);
});

test('local collision sweeps find a crossing path and never bridge a paired-edge jump',()=>{
  const still=path(point(0,0),point(0,0));
  assert.equal(sweptBolzaHit(path(point(-.2,0),point(.2,0)),still,.04),true);
  assert.equal(sweptBolzaHit(path(point(-.2,.1),point(.2,.1)),still,.04),false);
  assert.equal(sweptBolzaHit(path(point(-.6,0),point(.6,0),true),still,.04),false);
  assert.equal(sweptBolzaHit(still,path(point(-.6,0),point(.6,0),true),.04),false);
});

test('release cannot consume an echo or emit a cue when its three shots cannot fit',()=>{
  const s=createActFour(8,{echoes:1});startActFour(s);
  s.shots=Array.from({length:124},(_,id)=>({id,team:'player',position:point(0,0),heading:point(0,1)}));
  assert.equal(actFourAction(s,'release'),false);assert.equal(s.echoes,1);assert.equal(s.releases,0);
  assert.ok(!s.events.some(e=>e.type==='release'));
});

test('a normal-health manual-fire pilot can defeat, collect and extract the final component',()=>{
  const s=createActFour(8,{seed:71});startActFour(s);
  for(let tick=0;tick<90*90&&s.phase==='running';tick++){
    const boss=s.enemies[0],reward=s.finalReward;
    const target=boss?.position||(reward?.state==='exposed'?reward.position:reward?.extractionPosition);
    if(!target){stepActFour(s,{},1/90);continue;}
    const desired=quotientAim(s.player.position,target),h=s.player.heading;
    const diff=Math.atan2(h.x*desired.y-h.y*desired.x,h.x*desired.x+h.y*desired.y);
    stepActFour(s,{turn:Math.abs(diff)<.02?0:Math.sign(diff),drive:!boss&&Math.abs(diff)<.15&&quotientDistance(s.player.position,target)>.08?1:0,
      fire:!!boss&&Math.abs(diff)<.04},1/90);
  }
  assert.equal(s.phase,'won');assert.ok(s.player.hull>0);
  const receipt=finalComponentReceipt(s);assert.ok(receipt);assert.equal(receipt.seed,71);
  const j=createJourney();assert.equal(hasFinalComponent(j),false);assert.equal(bankFinalComponent(j,receipt),true);
  assert.equal(hasFinalComponent(j),true);assert.equal(j.completed,false);assert.equal(j.assembled,false);
});

test('reload before extraction restores the boss entry and cannot turn exposure into a receipt',()=>{
  const s=createActFour(8,{score:1700,echoes:2,shipId:3}),progress=rememberActFourStage({version:2,unlocked:8,score:1700},s);
  startActFour(s);s.finalReward={id:'hyperbolic-core',state:'collected',exposedAt:1,collectedAt:2};
  assert.equal(finalComponentReceipt(s),null);assert.equal(recordActFourClear(progress,s).unlocked,8);
  const retry=restoreActFour(JSON.parse(JSON.stringify(progress)));
  assert.equal(retry.stageIndex,8);assert.equal(retry.finalReward,null);assert.equal(retry.score,1700);assert.equal(retry.echoes,2);assert.equal(retry.shipId,3);
  const j=createJourney();assert.equal(bankFinalComponent(j,{id:'hyperbolic-core',source:'double-torus',stage:8,exposed:true,collected:true,extracted:false}),false);
  assert.equal(hasFinalComponent(j),false);
});

test('all eight lessons can clear through movement, manual shots and deliberate module actions at normal hull',()=>{
  for(let index=0;index<8;index++){
    const s=createActFour(index,{seed:2026});startActFour(s);
    for(let tick=0;tick<90*90&&s.phase==='running';tick++){
      const enemy=s.enemies[0],desired=enemy?quotientAim(s.player.position,enemy.position):{x:1,y:0};
      const h=s.player.heading,diff=Math.atan2(h.x*desired.y-h.y*desired.x,h.x*desired.x+h.y*desired.y);
      if(s.shots.some(x=>x.team==='enemy'&&quotientDistance(s.player.position,x.position)<.3))actFourAction(s,'capture');
      if(s.echoes>0&&enemy&&Math.abs(diff)<.08)actFourAction(s,'release');
      if(index===4&&!s.foldUses)actFourAction(s,'fold');
      stepActFour(s,{turn:Math.abs(diff)<.025?0:Math.sign(diff),drive:!enemy&&s.stage.require?.crossings>s.crossings?1:0,
        fire:!!enemy&&Math.abs(diff)<.04&&!(index===3&&!s.captures)},1/90);
    }
    assert.equal(s.phase,'cleared',`Stage ${index+1}: ${s.message}; hull ${s.player.hull}`);
    assert.ok(s.player.hull>0);
  }
});
