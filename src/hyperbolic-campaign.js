/**
 * Act IV field campaign on the genus-two Bolza quotient.
 * Independent combat vertical slice: the live entities (never the hollow
 * projections) are transported with the exact research-room side pairings.
 * Geometry/collision use bounded intrinsic steps and depth-one neighboring
 * lifts; this is NOT a proof of continuous collision on all shortest paths.
 */
import {insideOctagon,moveBolza,hyperbolicDistance,sidePairing,geodesicBetween,sub,mul,div,conj,unit,rotate,scale} from './hyperbolic.js';
import {shipById} from './fleet.js';

export const ACT4_SAVE_KEY='arrow-space-shift:act4:v1';
const r=(count,pattern,interval=2.3,hp=2)=>Object.freeze({count,pattern,interval,hp});
export const ACT4_STAGES=Object.freeze([
  {name:'The Eight Edges',lesson:'Pairing',brief:'A and A′ are the same joined passage. Cross one marked edge before clearing the beacons.',hint:'Turn ←/→; move ↑/↓; Space fires. Your ship and LIVE shots share the paired surface.',waves:[r(2,'aim',3.5,1),r(1,'aim',3.2,1)],require:{crossings:1}},
  {name:'Future Is Not Fire',lesson:'Prediction',brief:'A hollow image predicts one real projectile’s arrival. It is not a second collidable shot.',hint:'Read LIVE solid cores and hollow FUTURE images. The actual bullet stays dangerous after the join.',waves:[r(2,'edge',3.6,1),r(2,'edge',3.2,1)]},
  {name:'Bent Straight Lines',lesson:'Geodesics',brief:'Fire along the intrinsic straight path. It may look curved in the Poincaré disk.',hint:'The visual chord is not the route: steering changes a geodesic launch direction.',waves:[r(2,'aim',3,2),r(3,'fan',3.3,1)]},
  {name:'Borrowed Danger',lesson:'Capture / Release',brief:'Capture a LIVE hostile projectile with C; redirect its energy with E.',hint:'Use C within capture range, then E to release the stored echo. Manual Space fire remains.',waves:[r(2,'aim',3.5,1),r(2,'fan',3.4,1)],require:{captures:1,releases:1}},
  {name:'Timing Is a Fold',lesson:'Risk / Reward',brief:'Shift temporarily increases BOTH friendly and hostile projectile speed.',hint:'Shift toggles a three-second phase with a cooldown. Read danger before accelerating it.',waves:[r(2,'fan',3,2),r(2,'edge',2.8,2)],require:{foldUses:1}},
  {name:'The Curvature Current',lesson:'Transport',brief:'Frame orientation changes under side pairing; follow an attack through its exit.',hint:'Watch A–D, their primed partners, and the actual re-entry rings.',waves:[r(3,'edge',2.9,2),r(3,'sweep',2.8,2)],require:{crossings:1}},
  {name:'Pressure Lattice',lesson:'Density',brief:'No new geometry: the familiar families begin to overlap.',hint:'Aim / Fan / Sweep / Edge retain their identifiers. Recovery intervals remain safe.',waves:[r(3,'fan',2.7,2),r(3,'sweep',2.6,2),r(4,'edge',2.5,2)]},
  {name:'Bolza Mastery',lesson:'Synthesis',brief:'Traverse, anticipate, capture, release and choose when to accelerate the field.',hint:'Use all prior verbs; the last wave closes into a quiet interval.',waves:[r(3,'edge',2.8,2),r(4,'fan',2.6,2),r(4,'sweep',2.45,2)]},
  {name:'The Double Torus',lesson:'Final encounter',brief:'Defeat the Sentinel. Collect the Hyperbolic Core. Reach the extraction beacon to bank it.',hint:'Three phases combine Aim, Fan, Edge and Sweep. Read each warning. Recovery follows each phase change.',waves:[r(1,'aim',1.8,48)],boss:true},
].map((s,i)=>Object.freeze({...s,actStage:i+1,waves:Object.freeze(s.waves)})));
const TWO_PI=Math.PI*2,MAX_SHOTS=125,MAX_ECHOES=6,FOLD_SPEED_GAIN=1.38;
const centre=()=>({x:0,y:0});
const clonePoint=p=>({x:p.x,y:p.y});
const normV=p=>Math.hypot(p.x,p.y);
const unitHeading=p=>unit(p);
const turns=(heading,angle)=>mul(heading,rotate(angle));
const insideSafe=p=>insideOctagon(p,1e-6);

/** A conservative depth-one quotient-distance candidate search. */
export function quotientDistance(a,b){
  if(!insideSafe(a)||!insideSafe(b))throw new RangeError('Quotient points must be in the fundamental octagon.');
  let d=hyperbolicDistance(a,b);
  for(let i=0;i<8;i++){
    const image=sidePairing(i).apply(b);
    const candidate=hyperbolicDistance(a,image);
    if(candidate<d)d=candidate;
  }
  return d;
}
/** Direction in the conformal tangent chart, targeting the closest local lift. */
export function quotientAim(a,b){
  if(!insideSafe(a)||!insideSafe(b))throw new RangeError('Aim outside octagon');
  let target=b,best=hyperbolicDistance(a,b);
  for(let i=0;i<8;i++){
    const candidate=sidePairing(i).apply(b),d=hyperbolicDistance(a,candidate);
    if(d<best){target=candidate;best=d;}
  }
  const v=div(sub(target,a),sub({x:1,y:0},mul(conj(a),target)));
  return unitHeading(v);
}
const safeMove=(actor,distance)=>{
  try{
    const m=moveBolza(actor.position,actor.heading,distance,.015);
    const total=Math.abs(distance);
    for(const [index,segment] of m.segments.entries()){
      segment.t0=Math.min(1,index*.015/total);
      segment.t1=Math.min(1,(index+1)*.015/total);
    }
    actor.motion=m.segments;
    actor.position=m.position;actor.heading=m.heading;
    return m.crossings;
  }catch{return null;} // vertex ambiguity: hold an actor or retire its shot, never teleport it to a fake position
};
export function createActFour(stageIndex=0,{score=0,echoes=0,seed=1,shipId=0,inventory=[],equipped=[]}={}){
  if(!Number.isInteger(stageIndex)||stageIndex<0||stageIndex>8)throw new RangeError('Stage 1..9 required.');
  return {stageIndex,stage:ACT4_STAGES[stageIndex],phase:'ready',seed:seed>>>0,score:Math.max(0,score|0),
    shipId:shipById(shipId).id,inventory:copyEquipment(inventory),equipped:copyEquipment(equipped),
    player:{position:{x:0,y:-.12},heading:{x:0,y:1},hull:5,invuln:0,fireClock:0,driveVelocity:0},
    time:0,shotId:0,enemyId:0,shots:[],enemies:[],effects:[],kills:0,crossings:0,captures:0,releases:0,foldUses:0,
    waveIndex:0,breakUntil:null,foldUntil:0,foldReady:0,captureReady:0,echoes:Math.min(MAX_ECHOES,Math.max(0,echoes|0)),
    message:'Press Launch to start the lesson.',events:[],lastHit:null,paused:false,finalReward:null,bossPhase:0,bossRecoveryUntil:0};
}
const copyEquipment=value=>Array.isArray(value)?structuredClone(value.slice(0,14)):[];
export const actFourShip=s=>{
  const ship=shipById(s.shipId);
  return {name:ship.name,speed:1.58*ship.speed/360,reverse:1.2*ship.speed/360*(ship.reverseFactor||1),
    turn:2.8*360/ship.speed,core:.104*ship.coreRadius/18,acceleration:ship.acceleration?10:0};
};
// Forecast only a stable commanded geodesic. Reverse thrust changes travel direction.
export function actFourForecastMotion(s,input={},horizon=.22){
  const drive=Math.max(-1,Math.min(1,Number(input.drive)||0)),velocity=s.player.driveVelocity;
  if(s.phase!=='running'||s.paused||!drive||Math.abs(Number(input.turn)||0)>1e-8||
    !Number.isFinite(velocity)||Math.abs(velocity-drive)>1e-6||!Number.isFinite(horizon)||horizon<=0||horizon>1)return null;
  const ship=actFourShip(s),direction=Math.sign(velocity);
  return {position:clonePoint(s.player.position),heading:scale(s.player.heading,direction),
    distance:Math.abs(velocity)*(direction>0?ship.speed:ship.reverse)*horizon};
}
export function actFourShotForecastMotion(s,shot,horizon=.22){
  if(!shot||!Number.isFinite(shot.speed)||shot.speed<=0||!Number.isFinite(shot.age)||!Number.isFinite(shot.life)||
    !Number.isFinite(horizon)||horizon<=0||horizon>1)return null;
  // Leave one bounded simulation step before expiry and before a fold ends.
  const step=1/90,duration=Math.min(horizon,shot.life-shot.age-step);
  if(duration<=0)return null;
  const foldedDuration=Math.min(duration,Math.max(0,(s.foldUntil||0)-s.time-step));
  return {position:clonePoint(shot.position),heading:clonePoint(shot.heading),
    distance:shot.speed*(duration+(FOLD_SPEED_GAIN-1)*foldedDuration)};
}
function event(s,type,details={}){s.events.push({t:+s.time.toFixed(3),type,...details});if(s.events.length>120)s.events.shift();}
const points=[{x:-.32,y:.35},{x:.38,y:.22},{x:0,y:.45},{x:-.4,y:-.21},{x:.39,y:-.28},{x:-.14,y:.48},{x:.14,y:-.44}];
function spawnWave(s){
  const wave=s.stage.waves[s.waveIndex];if(!wave)return false;
  const current=s.waveIndex;
  for(let j=0;j<wave.count;j++){
    const base=points[(j*2+current*3+s.stageIndex)%points.length];
    s.enemies.push({id:++s.enemyId,position:clonePoint(base),heading:unitHeading({x:base.y,y:-base.x}),
      hp:wave.hp,maxHp:wave.hp,boss:s.stage.boss,pattern:wave.pattern,interval:wave.interval,
      gunClock:1.25+j*.42,warning:false,entryWave:current,shotCycle:0});
  }
  s.waveIndex++;s.breakUntil=null;
  s.message=`Wave ${s.waveIndex} / ${s.stage.waves.length}: ${wave.pattern.toUpperCase()}. Read the warning before it fires.`;
  event(s,'wave',{wave:s.waveIndex,pattern:wave.pattern});return true;
}
export function startActFour(s){
  if(s.phase!=='ready')return false;s.phase='running';s.time=0;spawnWave(s);event(s,'stage-start',{stage:s.stageIndex});return true;
}
function spawnBullet(s,position,heading,team,{power=1,speed=1.35}={}){
  if(s.shots.length>=MAX_SHOTS)return false;
  s.shots.push({id:++s.shotId,team,position:clonePoint(position),heading:unitHeading(heading),age:0,life:team==='player'?3:5,
    speed,power,joins:0,arrival:0});return true;
}
function enemyFire(s,enemy){
  const aim=quotientAim(enemy.position,s.player.position);
  const offset=enemy.pattern==='sweep'?Math.sin(enemy.shotCycle*1.45)*.27:0;
  const pattern=enemy.pattern;
  const angles=pattern==='fan'?[-.28,0,.28]:pattern==='edge'?[-.13,.13]:pattern==='boss'?[-.46,-.22,0,.22,.46]:[offset];
  const speed=pattern==='boss'?1.4:pattern==='edge'?1.65:pattern==='sweep'?1.22:1.04;
  const shotIds=[];
  for(const angle of angles)if(spawnBullet(s,enemy.position,turns(aim,angle),'enemy',{speed}))shotIds.push(s.shotId);
  enemy.shotCycle++;enemy.gunClock=enemy.interval;enemy.warning=false;
  if(shotIds.length)event(s,'enemy-volley',{pattern,enemy:enemy.id,shotIds});
  if(enemy.boss){const patterns=bossPatterns(s.bossPhase);enemy.pattern=patterns[enemy.shotCycle%patterns.length];}
}
const bossPatterns=phase=>phase===1?['aim','fan']:phase===2?['edge','sweep']:['sweep','fan','edge','aim'];
function updateBoss(s,enemy){
  const phase=enemy.hp>enemy.maxHp*2/3?1:enemy.hp>enemy.maxHp/3?2:3;
  if(s.bossPhase===phase)return;
  const previous=s.bossPhase;s.bossPhase=phase;enemy.pattern=bossPatterns(phase)[0];enemy.shotCycle=0;
  enemy.interval=phase===1?1.8:2.4;enemy.warning=false;enemy.gunClock=previous?3.2:1.25;
  if(previous){s.bossRecoveryUntil=s.time+2.3;s.shots=s.shots.filter(x=>x.team==='player');}
  s.message=previous?`Phase ${phase}. Recovery interval. Next attack: ${enemy.pattern.toUpperCase()}.`:'Sentinel ready. Read the AIM warning.';
  event(s,'boss-phase',{phase,previous,recoveryUntil:s.bossRecoveryUntil});
}
function killEnemy(s,enemy){
  s.enemies=s.enemies.filter(e=>e!==enemy);s.kills++;
  const earned=enemy.boss?400:85;s.score+=earned;
  event(s,'kill',{boss:enemy.boss,score:earned});
  if(enemy.boss){
    const position=clonePoint(enemy.position),exit={x:0,y:position.y<0?.55:-.55};
    s.finalReward={id:'hyperbolic-core',state:'exposed',position,extractionPosition:exit,readyAt:s.time+.35,exposedAt:s.time};
    s.shots=[];s.message='Sentinel defeated. Collect the Hyperbolic Core at the diamond marker.';
    event(s,'component-exposed',{part:'hyperbolic-core',position});
  }
}
function updateFinalReward(s){
  const reward=s.finalReward;if(!reward)return;
  if(reward.state==='exposed'&&s.time>=reward.readyAt&&quotientDistance(s.player.position,reward.position)<.15){
    reward.state='collected';reward.collectedAt=s.time;
    s.message='Hyperbolic Core aboard. Reach the square extraction beacon to bank it.';
    event(s,'drive-part-collected',{part:reward.id,position:reward.position});
  }
  if(reward.state==='collected'&&s.time>reward.collectedAt&&quotientDistance(s.player.position,reward.extractionPosition)<.16){
    reward.state='extracted';reward.extractedAt=s.time;s.phase='won';s.shots=[];
    s.message='Hyperbolic Core extracted. Return to the repair dock to assemble the Warp Drive.';
    event(s,'boss-extracted',{part:reward.id});event(s,'stage-clear',{stage:s.stageIndex,score:s.score});
  }
}
export function finalComponentReceipt(s){
  const reward=s.finalReward;
  if(s.phase!=='won'||s.stageIndex!==8||reward?.id!=='hyperbolic-core'||reward.state!=='extracted'||
    !Number.isFinite(reward.exposedAt)||!Number.isFinite(reward.collectedAt)||!Number.isFinite(reward.extractedAt)||
    reward.collectedAt<reward.exposedAt||reward.extractedAt<=reward.collectedAt)return null;
  return {id:'hyperbolic-core',source:'double-torus',stage:8,exposed:true,collected:true,extracted:true,
    seed:s.seed,shipId:s.shipId,score:s.score};
}
function requirements(s){
  const r=s.stage.require||{};
  return Object.entries(r).filter(([name,value])=>(s[name]||0)<value).map(([name,value])=>`${name} ${s[name]||0}/${value}`);
}
function advanceWaves(s){
  if(s.enemies.length)return;
  if(s.stage.boss){updateFinalReward(s);return;}
  if(s.breakUntil===null){
    s.breakUntil=s.time+2.3;
    // No hidden danger during the authored recovery beat.
    s.shots=s.shots.filter(x=>x.team==='player');
    s.message=s.waveIndex<s.stage.waves.length?'Recovery interval · hostile field cleared.':'All enemies cleared · check the lesson objective.';
    event(s,'recovery',{wave:s.waveIndex});
    return;
  }
  if(s.time<s.breakUntil)return;
  if(s.waveIndex<s.stage.waves.length){spawnWave(s);return;}
  const missing=requirements(s);
  if(!missing.length){
    s.phase='cleared';s.message='Lesson complete. Choose the next stage.';
    s.shots=[];event(s,'stage-clear',{stage:s.stageIndex,score:s.score});return;
  }
  // If the player destroyed the capture practice target, re-arm a low-pressure
  // training turret so the required C/E action remains possible.
  if(missing.some(x=>x.startsWith('captures'))&&s.time-s.breakUntil>=3){
    s.enemies.push({id:++s.enemyId,position:{x:0,y:.42},heading:{x:0,y:-1},hp:2,maxHp:2,boss:false,
      pattern:'aim',interval:3.7,gunClock:1.6,warning:true,entryWave:99,shotCycle:0,drill:true});
    s.breakUntil=null;s.message='Capture drill restored. Wait for a LIVE shot, press C near it, then E.';
  }else s.message=`Required before exit: ${missing.join(' · ')}.`;
}
export function fireActFour(s){
  if(s.phase!=='running'||s.paused||s.player.fireClock>0)return false;
  s.player.fireClock=.22;
  if(spawnBullet(s,s.player.position,s.player.heading,'player',{speed:2.8}))event(s,'fire',{shotId:s.shotId});
  return true;
}
export function actFourAction(s,action){
  if(s.phase!=='running'||s.paused)return false;
  if(action==='fire')return fireActFour(s);
  if(action==='fold'){
    if(s.time<s.foldReady)return false;
    s.foldUntil=s.time+3.2;s.foldReady=s.time+8;s.foldUses++;
    s.message='FOLD PHASE: outgoing AND incoming fire accelerate. No invulnerability.';
    event(s,'fold');return true;
  }
  if(action==='capture'){
    if(s.time<s.captureReady||s.echoes>=MAX_ECHOES)return false;
    s.captureReady=s.time+.7;
    let nearest=null,distance=.32;
    for(const shot of s.shots){if(shot.team!=='enemy')continue;const d=quotientDistance(s.player.position,shot.position);if(d<distance){nearest=shot;distance=d;}}
    if(!nearest){s.message='Capture missed: approach a LIVE hostile shot (solid core).';return false;}
    s.shots=s.shots.filter(x=>x!==nearest);s.echoes++;s.captures++;s.score+=35;
    s.message='Threat captured. Press E to release an echo.';event(s,'capture',{shotId:nearest.id});return true;
  }
  if(action==='release'&&s.echoes>0){
    if(s.shots.length>MAX_SHOTS-3){s.message='Release blocked. Wait for room for three echo shots.';return false;}
    s.echoes--;s.releases++;
    for(const a of [-.17,0,.17])spawnBullet(s,s.player.position,turns(s.player.heading,a),'player',{speed:3.15,power:2});
    s.message='Echo released along three geodesic trajectories.';event(s,'release');return true;
  }
  return false;
}
function collisionTick(s){
  for(const shot of [...s.shots]){
    if(shot.team==='enemy'){
      if(s.player.invuln>0)continue;
      if(quotientDistance(shot.position,s.player.position)<=actFourShip(s).core||sweptBolzaHit(shot.motion,s.player.motion,actFourShip(s).core)){
        s.shots=s.shots.filter(x=>x!==shot);s.player.hull--;s.player.invuln=1.2;
        s.lastHit={t:s.time,shotId:shot.id,joins:shot.joins};
        s.message=`Hit by LIVE projectile${shot.joins?' after an edge crossing':''}.`;
        event(s,'hit',{hull:s.player.hull,shotId:shot.id});
        if(s.player.hull<=0){s.phase='lost';s.shots=[];s.message='Hull lost. Retry this stage; earlier stage clearance is preserved.';}
      }
    }else{
      const enemy=s.enemies.find(e=>quotientDistance(shot.position,e.position)<=(e.boss?.20:.13)||sweptBolzaHit(shot.motion,e.motion,e.boss?.20:.13));
      if(enemy){s.shots=s.shots.filter(x=>x!==shot);enemy.hp-=shot.power;
        if(enemy.hp<=0){killEnemy(s,enemy);if(enemy.boss)return;}
      }
    }
    if(s.phase==='lost')break;
  }
}
// Test simultaneous local segments. A paired-edge jump is never a swept chord.
// Other real segments remain eligible when the same tick contains a jump.
// Endpoint quotient checks remain separate. This is not a global collision solver.
export function sweptBolzaHit(a,b,radius){
  if(!a?.length||!b?.length||!Number.isFinite(radius)||radius<0)return false;
  const times=(segment,index,count)=>[segment.t0??index/count,segment.t1??(index+1)/count];
  const point=(segment,time,start,end)=>geodesicBetween(segment.from,segment.to,end>start?(time-start)/(end-start):0);
  for(let i=0;i<a.length;i++){
    const first=a[i];if(first.jump)continue;
    const [aStart,aEnd]=times(first,i,a.length);
    for(let j=0;j<b.length;j++){
      const second=b[j];if(second.jump)continue;
      const [bStart,bEnd]=times(second,j,b.length),start=Math.max(aStart,bStart),end=Math.min(aEnd,bEnd);
      if(end<start)continue;
      const a0=point(first,start,aStart,aEnd),a1=point(first,end,aStart,aEnd),
        b0=point(second,start,bStart,bEnd),b1=point(second,end,bStart,bEnd);
      if(hyperbolicDistance(a0,b0)<=radius||hyperbolicDistance(a1,b1)<=radius)return true;
      const x=a0.x-b0.x,y=a0.y-b0.y,dx=a1.x-a0.x-b1.x+b0.x,dy=a1.y-a0.y-b1.y+b0.y;
      const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));
      if(hyperbolicDistance(geodesicBetween(a0,a1,t),geodesicBetween(b0,b1,t))<=radius)return true;
    }
  }
  return false;
}
/** One bounded physics tick; call repeatedly for variable frame time. */
export function tickActFour(s,input={},dt=1/90){
  if(s.phase!=='running'||s.paused)return s;
  if(!Number.isFinite(dt)||dt<=0||dt>.035)throw new RangeError('Use bounded simulation increments <= 35ms.');
  s.time+=dt;
  for(const actor of [s.player,...s.enemies,...s.shots])actor.motion=[{from:clonePoint(actor.position),to:clonePoint(actor.position),jump:false}];
  s.player.invuln=Math.max(0,s.player.invuln-dt);s.player.fireClock=Math.max(0,s.player.fireClock-dt);
  const turn=Math.max(-1,Math.min(1,Number(input.turn)||0)),drive=Math.max(-1,Math.min(1,Number(input.drive)||0));
  const ship=actFourShip(s);
  s.player.heading=turns(s.player.heading,turn*ship.turn*dt);
  s.player.driveVelocity=ship.acceleration?s.player.driveVelocity+Math.max(-ship.acceleration*dt,Math.min(ship.acceleration*dt,drive-s.player.driveVelocity)):drive;
  if(Math.abs(s.player.driveVelocity)>1e-8){
    const thrust=s.player.driveVelocity;
    const crossings=safeMove(s.player,thrust*(thrust>0?ship.speed:ship.reverse)*dt);
    if(crossings?.length){s.crossings+=crossings.length;event(s,'player-crossing',{from:crossings[0].from,to:crossings[0].to});}
  }
  if(input.fire)fireActFour(s);
  for(const enemy of s.enemies){
    if(enemy.boss)updateBoss(s,enemy);
    enemy.gunClock-=dt;
    if(enemy.gunClock<=0)enemyFire(s,enemy);
    else if(enemy.gunClock<=.8&&!enemy.warning){enemy.warning=true;event(s,'pattern-warning',{enemy:enemy.id,patternKey:enemy.pattern==='aim'?'aimed':enemy.pattern==='edge'?'return':enemy.pattern,fireAt:s.time+enemy.gunClock});}
    if(enemy.boss){enemy.heading=turns(enemy.heading,dt*.22);safeMove(enemy,.11*dt);}
  }
  for(const shot of [...s.shots]){
    shot.age+=dt;if(shot.age>shot.life){s.shots=s.shots.filter(x=>x!==shot);continue;}
    const speed=shot.speed*(s.time<s.foldUntil?FOLD_SPEED_GAIN:1),crossings=safeMove(shot,speed*dt);
    if(crossings===null){s.shots=s.shots.filter(x=>x!==shot);event(s,'vertex-retire',{shotId:shot.id});continue;}
    if(crossings.length){shot.joins+=crossings.length;shot.arrival=.4;event(s,'shot-crossing',{shotId:shot.id,team:shot.team,from:crossings[0].from,to:crossings[0].to});}
    shot.arrival=Math.max(0,shot.arrival-dt);
  }
  collisionTick(s);
  if(s.phase==='running')advanceWaves(s);
  return s;
}
export function stepActFour(s,input={},seconds=1/60){
  if(!Number.isFinite(seconds)||seconds<0||seconds>.5)throw new RangeError('Invalid frame duration');
  let remaining=seconds;
  while(remaining>1e-9&&s.phase==='running'&&!s.paused){
    const dt=Math.min(1/90,remaining);tickActFour(s,input,dt);remaining-=dt;
  }
  return s;
}
export function nextActFour(s){
  if(!['cleared','won'].includes(s.phase))return null;
  if(s.stageIndex===8)return null;
  return createActFour(s.stageIndex+1,{score:s.score,echoes:s.echoes,seed:s.seed,shipId:s.shipId,inventory:s.inventory,equipped:s.equipped});
}
export function actFourProgress(value){
  if(!value||![1,2,3].includes(value.version)||!Number.isInteger(value.unlocked)||value.unlocked<0||value.unlocked>9)
    return {version:3,unlocked:0,score:0,completed:false,resumeStage:0,entries:{}};
  const entries={};
  for(let index=0;index<=Math.min(8,value.unlocked);index++){
    const entry=value.entries?.[index];
    if(!entry||!validScore(entry.score)||!Number.isInteger(entry.echoes)||entry.echoes<0||entry.echoes>MAX_ECHOES||
      !Number.isInteger(entry.seed)||entry.seed<0||entry.seed>0xffffffff)continue;
    entries[index]={score:entry.score,echoes:entry.echoes,seed:entry.seed,shipId:shipById(entry.shipId).id,
      inventory:copyEquipment(entry.inventory),equipped:copyEquipment(entry.equipped)};
  }
  const last=Math.min(8,value.unlocked);
  return {version:3,unlocked:value.unlocked,score:validScore(value.score)?value.score:0,
    completed:Boolean(value.completed&&value.unlocked===9),
    resumeStage:Number.isInteger(value.resumeStage)&&value.resumeStage>=0&&value.resumeStage<=last?value.resumeStage:last,entries};
}
const validScore=value=>Number.isInteger(value)&&value>=0&&value<1e9;
const entryFromGame=s=>({score:s.score,echoes:s.echoes,seed:s.seed,shipId:s.shipId,inventory:copyEquipment(s.inventory),equipped:copyEquipment(s.equipped)});
export function seedActFourBridge(progress,bridge){
  const saved=actFourProgress(progress);
  if(saved.unlocked||saved.score||saved.entries[0]||!bridge||!validScore(bridge.score)||!Number.isInteger(bridge.seed)||bridge.seed<0||bridge.seed>0xffffffff)return saved;
  const game=createActFour(0,bridge);saved.entries[0]=entryFromGame(game);saved.score=game.score;
  return saved;
}
export function restoreActFour(progress,index){
  const saved=actFourProgress(progress),stage=index??saved.resumeStage;
  if(!Number.isInteger(stage)||stage<0||stage>Math.min(8,saved.unlocked))return null;
  // Older saves have no entry resources. Keep their latest score; earlier replays start at zero.
  const entry=saved.entries[stage]||{score:stage===Math.min(8,saved.unlocked)?saved.score:0,echoes:0,seed:1};
  return createActFour(stage,entry);
}
export function rememberActFourStage(progress,game){
  const saved=actFourProgress(progress),index=game.stageIndex;
  if(game.phase!=='ready'||!Number.isInteger(index)||index<0||index>Math.min(8,saved.unlocked))return saved;
  if(!saved.entries[index])saved.entries[index]=entryFromGame(game);
  saved.resumeStage=index;
  return saved;
}
export function recordActFourClear(progress,game){
  const saved=actFourProgress(progress);
  if(game.stageIndex===8&&!finalComponentReceipt(game))return saved;
  // A replay cannot replace the entry resources of the next uncompleted stage.
  if(!['cleared','won'].includes(game.phase)||game.stageIndex!==saved.unlocked)return saved;
  saved.unlocked=game.stageIndex+1;saved.score=game.score;saved.completed=game.stageIndex===8;
  if(game.stageIndex<8){
    saved.resumeStage=game.stageIndex+1;
    saved.entries[saved.resumeStage]=entryFromGame(game);
  }
  return saved;
}
