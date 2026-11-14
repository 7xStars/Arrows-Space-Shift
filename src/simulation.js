import { advanceThroughSpace, advanceProjectile, foldDepthAt, metricAt, spaceDistance, addFold } from './space.js';
import {makeDrop,collectDrop,applyOperations,operationEntryTime,moveShot,warpSide,loadout,roster,upgradeModes,activeSourceSide} from './upgrades.js';
import {usesVisibleCombat,inCombatView,inPlayerShotView,combatReady,updateCombatReadiness} from './combat-view.js';
import {startCampaign,enterChapter,isCampaign,isTutorial,isBoss,isScrollingLevel,isKleinRoute,isKleinSurfaceRoute,SCROLL_SPEED,chapter,campaignAfterTick,moveCampaignEnemies,arenaY,arenaZ,tutorialMovement,tutorialAction,tickWaveDirector,creditSeamTraversal,creditFoldDecision,isProjectiveSurfaceRoute,isProjectiveBoss,surfaceTrace} from './campaign.js';
import {tickBoss,preparePattern,patternVolley} from './boss.js';
import {pathsHit,pathsHitProjective,traceKlein,KLEIN_BOUNDS} from './klein.js';
import {newRunSeed,randomFor} from './random.js';
import {interceptAsteroid,breakAsteroid} from './asteroids.js';
import {activeShip,createFleetProfile} from './fleet.js';
import {tickEcology,protectWithEcho} from './ecology.js';
import {projectileIdentity} from './projectile-id.js';
export const ROUTE_LENGTH = 8400;
export const BASE_THRUST = 90;
export const X_LIMIT = 350;
export const STEP = 1 / 120;
export const DAMAGE_PROTECTION = 1.4;
export const ENEMY_WINDUP = .65;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const ENCOUNTERS = Object.freeze([
  {name:'Hit the opening',brief:'The target opens briefly. Fold to make your shot arrive before it closes.',goal:'Hit the target while its shield is open.',opens:0.55,closes:1.2,limit:1.6},
  {name:'Make room to escape',brief:'You start inside a fold. A wide salvo is coming. Unfold, then steer beyond its edge.',goal:'Avoid the salvo without losing hull.',limit:4},
  {name:'Hit, then escape',brief:'The target opens briefly. A hit triggers guard fire at your current lane. Hit the target and avoid the salvo.',goal:'Hit the target and avoid the guard salvo.',opens:0.55,closes:1.2,limit:5},
]);

export function createFlight(mode = 'flight', options = {}) {
  const fleetProfile=createFleetProfile(options.fleetProfile);
  const requestedShip=options.shipId??fleetProfile.selectedShip;
  const s = {
    mode,runSeed:options.seed===undefined?newRunSeed():options.seed>>>0, phase: 'ready', x: 0, z: 0, time: 0, hull: 5, invulnerable: 0,
    bonusEnabled: options.bonusEnabled ?? true, maxFolds: mode==='timing' ? 1 : 3,
    drops:[],dropSerial:0,upgradeSerial:0,upgrade:null,warpCount:0,labWave:0,
    inventory:[],equipped:[null,null],selectedSlot:0,slotCount:1,debts:[],stage:mode==='paley'?2:mode==='trio'?1:0,
    startStage:mode==='paley'?2:mode==='trio'?1:0,labDropClock:6,
    view:{width:900,height:740},effects:[],asteroids:[],facing:1,cameraZ:0,surfaceViewZ:0,
    fleetProfile,shipId:fleetProfile.unlockedShips.includes(requestedShip)?requestedShip:0,lateralVelocity:0,
    score: 0, foldBonus: 0, kills: 0, fields: [], foldSerial: 0, foldsUsed: 0,
    shots: [], enemyShots: [], fireClock: 0, thrust: BASE_THRUST,
    enemies: mode === 'space' ? [] : Array.from({length: 24}, (_, i) => ({
      id: i, x: [-240, 160, 0, 255, -110, 90][i % 6],
      z: 1000 + i * 285, hp: i % 4 === 3 ? 3 : 2,
      clock: 1 + (i % 3) * 0.35, escaped: false,
    })),
    gates: mode === 'space' ? [] : Array.from({length: 7}, (_, i) => ({
      z: 1700 + i * 920, gap: [-140, 150, 0, -190, 180, -60, 100][i],
      width: 250, checked: false,
    })),
    lastEvent: 'Ready for flight.',
    events: [],
    countdown: mode==='timing'?2:0,deathRecap:null,
  };
  if(['upgrades','trio','paley'].includes(mode)){
    s.slotCount=s.stage===2?2:1;
    s.enemies=Array.from({length:27},(_,i)=>{
      const stage=Math.max(s.startStage,i<4?0:i<13?1:2),ids=stage===0?[0]:roster(stage),type=ids[i%ids.length];
      const polarity=i%2?-1:1;
      return {id:i,x:[0,180,-180,90,-90][i%5],z:450+i*275,hp:2,clock:1.6+(i%3)*.3,stage,escaped:false,
        equipped:[{type,polarity,key:`${type}:${polarity}`},...(stage===2?[{type:ids[(i+3)%ids.length],polarity,key:`${ids[(i+3)%ids.length]}:${polarity}`}]:[])],dropsUpgrade:true};
    });
    s.enemies[0].hp=1;
    makeDrop(s,0,100,'intro-seed',0,1);
  }
  if(mode==='warp-lab'){
    s.enemies=[];s.gates=[];s.countdown=2;
    makeDrop(s,0,120,'lab-seed',0,1);
  }
  if (mode === 'timing') {
    s.encounterIndex = clamp(options.encounterIndex ?? 0, 0, ENCOUNTERS.length - 1);
    s.enemies = []; s.gates = [];
    s.encounter = { ...ENCOUNTERS[s.encounterIndex], hit:false, salvoLaunched:false };
    if(s.encounterIndex !== 1) s.enemies.push({id:0,x:0,z:1000,hp:1,clock:999,escaped:false,shield:true});
    else {
      s.fields=[{id:1,start:0,end:1200,factor:0.5}];s.foldSerial=1;
      launchSalvo(s,500);
    }
  }
  if(mode==='campaign'){
    // A new flight always begins at Level 0. Owning a geometry module is not
    // permission to silently skip Acts. The player may explicitly continue
    // at a previously unlocked Act from the title screen.
    startCampaign(s);
    const next=options.continueAt===18&&fleetProfile.projectiveModule?18:
      options.continueAt===9&&fleetProfile.fleetUnlocked?9:null;
    if(next!==null){
      enterChapter(s,next);s.phase='ready';
      s.lastEvent=next===18?'Projective Module installed. Begin Act III: capture and transform the projectile field.':
        'Klein Relay installed. Choose a ship and begin Act II.';
    }
  }
  return s;
}

export function recordEvent(s, type, data = {}) {
  if(type==='player-fire'||type==='enemy-fire'){
    const shot=(type==='player-fire'?s.shots:s.enemyShots).at(-1);
    if(shot)data={...data,objectId:projectileIdentity(s,shot)};
  }
  s.events.push({time:s.time,type,...data});
  if(type==='player-fire'||type==='fold'||type==='unfold')tutorialAction(s,type);
  const metrics=s.campaign?.metrics;
  if(!metrics)return;
  if(type==='fold'){metrics.folds=(metrics.folds||0)+1;creditFoldDecision(s,Boolean(data.automatic));}
  else if(type==='unfold'){metrics.unfolds=(metrics.unfolds||0)+1;creditFoldDecision(s,Boolean(data.automatic));}
  else if(type==='graze')metrics.grazes=(metrics.grazes||0)+1;
  else if(type==='damage')metrics.damage=(metrics.damage||0)+(data.amount||1);
}

/** Flight handling changes position, never weapon output or simulation time. */
export function steerPlayer(s,horizontal,dt,wrap=false){
  const ship=activeShip(s),direction=clamp(horizontal||0,-1,1),target=direction*ship.speed;
  if(ship.acceleration){
    const velocity=s.lateralVelocity||0;
    // Releasing or countersteering uses the stronger brake. A fast hull should
    // not keep sliding through a dodge while it fights its previous momentum.
    const rate=direction&&direction*velocity>=0?ship.acceleration:ship.braking,change=rate*dt;
    s.lateralVelocity=velocity+clamp(target-velocity,-change,change);
  }else s.lateralVelocity=target;
  const next=s.x+s.lateralVelocity*dt;
  s.x=wrap?next:clamp(next,-X_LIMIT,X_LIMIT);
  if(!wrap&&s.x!==next)s.lateralVelocity=0;
}

export function tickDamagedDrive(s){
  if(!isCampaign(s)||chapter(s).kind==='tutorial'||s.drive?.status!=='damaged'||s.phase!=='running')return;
  if(['fold-timing','klein-mastery'].includes(chapter(s).waveScript))return;
  if(isBoss(s)&&s.campaign.bossPhase!=='combat')return;
  const drive=s.drive;
  if(drive.warningUntil!==null){
    if(s.time<drive.warningUntil)return;
    drive.warningUntil=null;drive.attempts=(drive.attempts||0)+1;
    if(addFold(s)){
      drive.faults++;s.fields.at(-1).source='drive-fault';
      recordEvent(s,'fold',{fields:s.fields.length,automatic:true});
      recordEvent(s,'drive-fault',{fields:s.fields.length});
      s.lastEvent='Damaged Warp Drive: space folded. Right Shift unfolds the latest field.';
    }else recordEvent(s,'drive-fault-blocked',{fields:s.fields.length});
    const random=randomFor(s.runSeed^0x4b1e1,s.campaign.index*101+drive.attempts);
    drive.nextFaultAt=s.time+14+random()*8;
    return;
  }
  if(s.time>=drive.nextFaultAt){
    drive.warningUntil=s.time+1.4;
    recordEvent(s,'drive-warning',{due:drive.warningUntil});
    s.lastEvent='Damaged Warp Drive: fold surge incoming. Prepare to unfold with Right Shift.';
  }
}

export function targetOpen(s, time = s.time) {
  return !s.encounter || (time >= s.encounter.opens && time < s.encounter.closes);
}

function launchSalvo(s, ahead) {
  s.enemyShots.push({x:s.x,z:s.z+ahead,vx:0,halfWidth:220,salvo:true});
  s.encounter.salvoLaunched=true;
  recordEvent(s,'salvo',{x:s.x,ahead});
}

function endEncounter(s, won, reason) {
  s.phase=won?'won':'lost';s.lastEvent=reason;
  recordEvent(s,won?'encounter-cleared':'encounter-failed',{reason});
}

export function segmentNear(ax, az, bx, bz, radius) {
  const dx = bx - ax, dz = bz - az;
  const t = clamp(-(ax * dx + az * dz) / (dx * dx + dz * dz || 1), 0, 1);
  return Math.hypot(ax + dx * t, az + dz * t) <= radius;
}

function admitPlayerHit(s,kind='impact',position=s){
  if(s.phase!=='running')return false;
  if(s.invulnerable>0){recordEvent(s,`${kind}-absorbed`,{x:position.x,z:position.z,target:'player'});return false;}
  s.invulnerable=DAMAGE_PROTECTION;
  return true;
}

function damageRecap(details={},retained=false){
  if(retained){
    if(details.source==='projectile'){
      const original=damageRecap(details,false);
      return {title:'Stored impact damage',detail:`Originally admitted by ${original.title}. ${original.detail}`};
    }
    return {title:'Stored impact damage',detail:'An earlier Impact Buffer debt resolved.'};
  }
  if(details.source==='projectile'){
    const source=details.sourceName||'enemy projectile',pattern=details.patternName?`${details.patternName} `:'';
    const crossing=details.surfaceCrossings?` It crossed ${details.surfaceCrossings} surface join${details.surfaceCrossings===1?'':'s'}${details.lastEdge?`, last through ${details.lastEdge}`:''}.`:'';
    const damage=details.damageMultiplier>1?` Damage ×${details.damageMultiplier}.`:'';
    return {title:`${source} · ${pattern}hit`,detail:`${details.geometryRule==='projective'?'Projective':details.geometryRule==='hybrid'?'Hybrid':'Klein'} trajectory.${crossing}${damage}`};
  }
  if(details.source==='ship')return {title:'Carrier collision',detail:'The ship crossed an enemy hull.'};
  if(details.source==='asteroid')return {title:'Asteroid collision',detail:'The ship contacted a breakable rock.'};
  return {title:'Hull damage',detail:'The final hit was recorded.'};
}

function damage(s,reason,amount=1,retained=false,details={}){
  if(s.phase!=='running'||(!retained&&!admitPlayerHit(s,details.source==='ship'?'contact':'impact',s)))return false;
  s.hull=Math.max(0,s.hull-amount);
  // A stored debt was admitted earlier. Paying it cannot restart protection.
  s.lastEvent=reason;
  recordEvent(s,'damage',{reason,hull:s.hull,amount,retained,x:s.x,z:s.z,...details});
  if(s.hull<=0){s.phase='lost';s.deathRecap=damageRecap(details,retained);s.lastEvent=`Hull lost. ${s.deathRecap.title}.`;}
  return true;
}

function predictedCarrierX(enemy,delay){
  const x=enemy.x+(enemy.driftX||0)*delay;
  if(Math.abs(x)<=330)return x;
  return Math.sign(x)*(660-Math.abs(x));
}

/** Freeze the actual launch velocity, including forward travel during warning and flight. */
function lockedEnemyAim(s,enemy,boss=false){
  if(boss){
    const forward=isKleinSurfaceRoute(s)?SCROLL_SPEED:SCROLL_SPEED*s.facing,speed=enemy.shotSpeed||155;
    const source=traceKlein({x:enemy.x,y:arenaY(s,enemy.z)},(enemy.driftX||0)*ENEMY_WINDUP,(enemy.driftY||0)*ENEMY_WINDUP);
    const player=traceKlein({x:s.x,y:arenaY(s,s.z)},0,forward*ENEMY_WINDUP);
    const originZ=arenaZ(s,source.y),shotFields=s.fields.map(field=>({...field,factor:field.factor*field.factor}));
    // Lock one visible intercept. The squared metric gives the travel time of
    // the actual shot along this straight chart path, including fold speed.
    const sample=time=>{
      const target=traceKlein(player,0,forward*time),dx=target.x-source.x,dy=target.y-source.y,length=Math.hypot(dx,dy);
      const aimZ=arenaZ(s,target.y);
      const travel=Math.abs(dy)>1e-8?Math.abs(spaceDistance(originZ,aimZ,shotFields))*length/(speed*Math.abs(dy)):length*metricAt(originZ,s.fields)/speed;
      return {aimX:target.x,aimZ,vx:dx/(length||1)*speed,vz:dy/(length||1)*speed,error:travel-time};
    };
    const cuts=[0],{bottom,top}=KLEIN_BOUNDS;
    const seam=(forward>0?top-player.y:bottom-player.y)/forward;
    if(seam>0&&seam<7)cuts.push(seam);
    cuts.push(7);
    let aim=null;
    // A chart seam is a position jump, not a zero of the intercept equation.
    for(let i=1;i<cuts.length&&!aim;i++){
      const end=cuts[i]-1e-7;let left=cuts[i-1]+1e-7,a=sample(left);
      while(left<end&&!aim){
        const right=Math.min(end,left+.05),b=sample(right);
        if(a.error*b.error<=0){
          let lo=left,hi=right,lowError=a.error;
          for(let step=0;step<28;step++){
            const middle=(lo+hi)/2,error=sample(middle).error;
            if(error*lowError>0){lo=middle;lowError=error;}else hi=middle;
          }
          aim=sample((lo+hi)/2);
        }
        left=right;a=b;
      }
    }
    // If no direct intercept fits this shot's life, retain a readable shot at
    // the predicted launch position. It can still wrap after a missed pass.
    aim??=sample(0);
    return {aimX:aim.aimX,aimZ:aim.aimZ,vx:aim.vx,vz:aim.vz};
  }
  const aimX=s.x,forward=s.thrust;
  const playerZ=advanceThroughSpace(s.z,forward*ENEMY_WINDUP,s.fields);
  const sourceX=(isKleinRoute(s)||isKleinSurfaceRoute(s))?enemy.x+(enemy.driftX||0)*ENEMY_WINDUP:predictedCarrierX(enemy,ENEMY_WINDUP);
  const sourceZ=advanceThroughSpace(enemy.z,(enemy.driftY||0)*ENEMY_WINDUP,s.fields);
  const delta=spaceDistance(playerZ,sourceZ,s.fields),direction=-Math.sign(delta)||-1;
  const originZ=advanceThroughSpace(sourceZ,20*direction,s.fields);
  const speed=enemy.shotSpeed||145,vz=speed*direction,side=-direction;
  const gap=t=>side*spaceDistance(advanceThroughSpace(playerZ,forward*t,s.fields),advanceProjectile(originZ,vz*t,s.fields),s.fields);
  if(gap(0)<=0||gap(20)>=0)return null;
  let lo=0,hi=20;
  for(let i=0;i<36;i++){const middle=(lo+hi)/2;if(gap(middle)>0)lo=middle;else hi=middle;}
  const aimZ=advanceThroughSpace(playerZ,forward*hi,s.fields);
  const travel=Math.abs(spaceDistance(originZ,advanceProjectile(originZ,vz*hi,s.fields),s.fields))/speed;
  return {aimX,aimZ,vx:(aimX-sourceX)/Math.max(.05,travel),vz};
}

function shotDamageDetails(shot={}){
  return {source:'projectile',sourceId:shot.sourceId,sourceName:shot.sourceName,pattern:shot.pattern,
    patternName:shot.patternName,geometryRule:shot.geometryRule||'klein',surfaceCrossings:shot.surfaceCrossings||0,
    lastEdge:shot.lastCrossing?.edge||shot.lastEdge||null,damageMultiplier:shot.damage||1};
}

function noteFoldTransition(s,shot,previousDepth){
  const depth=foldDepthAt(shot.z,s.fields);shot.foldDepth=depth;
  if(previousDepth===depth)return;
  shot.foldTransitions=(shot.foldTransitions||0)+1;shot.foldChangedAt=s.time;
  recordEvent(s,depth>previousDepth?'fold-entry':'fold-exit',{actor:'shot',owner:shot.owner||'unknown',x:shot.x,z:shot.z,depth});
}

export function grazePlayer(s,shot){
  if(shot.grazed||s.phase!=='running')return false;
  shot.grazed=true;s.score+=5;recordEvent(s,'graze',{sourceId:shot.sourceId,pattern:shot.pattern,x:shot.x,z:shot.z,points:5});
  s.lastEvent='Graze +5.';return true;
}


export function updateSpecialEnemyPhase(s,enemy){
  if(enemy.name!=='Klein Warden'||enemy.hp<=0)return 0;
  const ratio=enemy.hp/Math.max(1,enemy.maxHp||enemy.hp),phase=ratio>.75?1:ratio>.5?2:ratio>.25?3:4;
  if((enemy.specialPhase||1)===phase){enemy.specialPhase=phase;return phase;}
  enemy.specialPhase=phase;enemy.telegraph=null;enemy.clock=.65;enemy.phaseBreakUntil=s.time+.65;
  s.enemyShots=s.enemyShots.filter(shot=>shot.sourceId!==enemy.id);
  if(phase===2){enemy.patternSequence=['gap','sweep','return'];enemy.patternConfig={count:4,beats:2,gapWidth:2,recovery:1.2};}
  else if(phase===3){enemy.patternSequence=['wall','crossfire','return'];enemy.patternConfig={count:5,beats:2,recovery:1.05};}
  else if(phase===4){enemy.patternSequence=['fan','return','gap','sweep','wall','crossfire'];enemy.patternConfig={count:5,beats:2,recovery:.92};}
  const text=phase===2?'Klein Warden: opening geometry.':phase===3?'Klein Warden: cross-current geometry.':'Klein Warden: full surface mastery.';
  s.lastEvent=text;recordEvent(s,'miniboss-phase',{target:enemy.id,name:enemy.name,phase,x:enemy.x,z:enemy.z});
  return phase;
}

function tickEnemyWeapon(s,enemy,dt,boss=false){
  updateSpecialEnemyPhase(s,enemy);
  if(enemy.phaseBreakUntil>s.time){enemy.telegraph=null;return;}
  if(enemy.shield||enemy.waveActive===false)return;
  // Scripted Act II recovery is not another surprise attack phase.
  if(isScrollingLevel(s)&&s.campaign?.currentWave?.kind==='break'){enemy.telegraph=null;return;}
  if(boss&&s.campaign?.phaseBreakUntil>s.time){enemy.telegraph=null;return;}
  const distance=spaceDistance(s.z,enemy.z,s.fields);
  const inRange=boss||Math.abs(distance)>110&&Math.abs(distance)<920;
  const quietLesson=isScrollingLevel(s)&&chapter(s).number===1&&(isKleinSurfaceRoute(s)?s.cameraZ:s.z)<900;
  if(!combatReady(s,enemy)||!inRange||quietLesson){enemy.telegraph=null;return;}
  if(enemy.telegraph){
    const cue=enemy.telegraph;cue.remaining=Math.max(0,cue.due-s.time);
    if(cue.remaining>1e-8)return;
    const direction=Math.sign(cue.vz)||-1;
    const volley=cue.patternKey?patternVolley(cue,cue.beatIndex||0):[{vx:cue.vx,vz:cue.vz}];
    for(const velocity of volley){
      const geometryRule=velocity.geometryRule||cue.geometryRule||enemy.geometryRule||'klein';
      const shot={x:enemy.x,z:boss?enemy.z:isKleinSurfaceRoute(s)?arenaZ(s,arenaY(s,enemy.z)+20*direction):advanceThroughSpace(enemy.z,20*direction,s.fields),...velocity,
        payload:loadout(enemy).map(seed=>seed.type),bornAt:s.time,pattern:cue.patternKey,patternName:cue.patternName,
        owner:'enemy',sourceId:enemy.id,sourceName:enemy.name||`Carrier ${enemy.id}`,geometryRule,
        projective:geometryRule==='projective'||geometryRule==='hybrid'};
      s.enemyShots.push(shot);
      recordEvent(s,'enemy-fire',{...shot,actor:`enemy-${enemy.id}`,target:enemy.id,aimX:cue.aimX,aimZ:cue.aimZ,beat:cue.beatIndex||0});
    }
    if(cue.patternKey&&(cue.beatIndex||0)+1<cue.beatCount){
      cue.beatIndex=(cue.beatIndex||0)+1;cue.phase='burst';cue.due+=cue.beatInterval;cue.remaining=Math.max(0,cue.due-s.time);
      cue.previewShots=patternVolley(cue,cue.beatIndex);
    }else{
      enemy.telegraph=null;enemy.clock=cue.patternRecovery??enemy.firePeriod??(boss?(enemy.name==='Core'?1.5:2.3):2.3+(enemy.id%3)*.2);
      if(cue.patternKey)enemy.patternCycle=(enemy.patternCycle||0)+1;
    }
    return;
  }
  enemy.clock-=dt;
  if(enemy.clock>0)return;
  if(isCampaign(s)&&(s.time<(s.nextEnemyWindup||0)||s.enemies.filter(e=>e.telegraph).length>=(chapter(s).maxConcurrentWarnings||2)))return;
  const aim=lockedEnemyAim(s,enemy,boss||isKleinSurfaceRoute(s));if(!aim)return;
  enemy.telegraph={...aim,...preparePattern(enemy,aim),phase:'tell',beatIndex:0,x:aim.aimX,z:aim.aimZ,duration:ENEMY_WINDUP,remaining:ENEMY_WINDUP,startedAt:s.time,due:s.time+ENEMY_WINDUP};
  recordEvent(s,'enemy-windup',{actor:`enemy-${enemy.id}`,target:enemy.id,x:enemy.x,z:enemy.z,...aim,duration:ENEMY_WINDUP,patternKey:enemy.telegraph.patternKey});
  if(enemy.telegraph.patternKey)recordEvent(s,'pattern-warning',{actor:`enemy-${enemy.id}`,target:enemy.id,patternKey:enemy.telegraph.patternKey,patternName:enemy.telegraph.patternName,x:enemy.x,z:enemy.z});
  if(isCampaign(s)){const c=chapter(s);s.nextEnemyWindup=s.time+(c.calm?1.1:c.number===1?.7:(c.klein||c.kleinSurface)?.75:.55);}
}

function destroyEnemy(s,enemy){
  if(enemy.destroyed)return;
  enemy.destroyed=true;enemy.telegraph=null;
  const bonus=s.bonusEnabled?50*foldDepthAt(enemy.z,s.fields):0,points=100+bonus;
  s.foldBonus+=bonus;s.score+=points;s.kills++;
  if(isCampaign(s)){s.campaign.defeated++;if(s.campaign.metrics)s.campaign.metrics.kills=(s.campaign.metrics.kills||0)+1;}
  if(isBoss(s))s.campaign.lastDefeat={x:enemy.x,z:enemy.z,id:enemy.id};
  s.lastEvent=bonus?`Enemy destroyed. +100 points. Fold bonus: +${bonus}.`:'Enemy destroyed. +100 points.';
  recordEvent(s,'target-hit',{target:enemy.id,bonus,x:enemy.x,z:enemy.z,visible:inCombatView(s,enemy),presented:!!enemy.presented});
  s.effects.push({type:'defeat',x:enemy.x,z:enemy.z,start:s.time,until:s.time+.7,points});
  if(enemy.dropsUpgrade)loadout(enemy).forEach((seed,i,seeds)=>makeDrop(s,enemy.x+(seeds.length>1?(i?22:-22):0),enemy.z,`enemy-${enemy.id}`,seed.type,seed.polarity));
  if(enemy.linkGroup){
    for(const survivor of s.enemies.filter(e=>e.hp>0&&!e.destroyed&&e.linkGroup===enemy.linkGroup)){
      survivor.patternRole='cycle';survivor.patternSequence=survivor.patternSequence||['fan','gap','return','sweep'];
      survivor.firePeriod=Math.max(.85,(survivor.firePeriod||1.6)*.78);
      survivor.patternConfig={...(survivor.patternConfig||{}),recovery:Math.max(.85,(survivor.patternConfig?.recovery||1.5)*.78)};
      survivor.telegraph=null;survivor.clock=.35;
    }
    s.lastEvent=`${enemy.name||'Linked carrier'} destroyed. Its partner changed pattern.`;
    recordEvent(s,'linked-pattern-shift',{group:enemy.linkGroup,target:enemy.id});
  }
  if(s.encounter){s.encounter.hit=true;if(s.encounterIndex===2){launchSalvo(s,360);s.lastEvent='Target hit. Guard salvo launched at your lane.';}}
}

function hitEnemy(s,enemy,amount){
  enemy.hp-=amount;enemy.hitUntil=s.time+.15;
  recordEvent(s,'enemy-hit',{target:enemy.id,amount,x:enemy.x,z:enemy.z});
  s.effects.push({type:'hit',x:enemy.x,z:enemy.z,start:s.time,until:s.time+.2});
  if(enemy.hp<=0)destroyEnemy(s,enemy);
}

function impact(s,actor,shot){
  if(actor===s&&protectWithEcho(s,shot))return;
  const amount=shot.damage||1;
  if(shot.impactDelay){
    if(actor===s&&!admitPlayerHit(s,'impact',shot))return;
    const debt={target:actor===s?'player':actor.id,due:s.time+shot.impactDelay,amount,x:actor.x,z:actor.z,details:actor===s?shotDamageDetails(shot):null};
    s.debts.push(debt);
    recordEvent(s,'damage-debt',debt);
    s.lastEvent=`Impact stored. ${amount} damage remains due.`;
  }else if(actor===s)damage(s,'Shot impact. Hull damage received.',amount,false,shotDamageDetails(shot));
  else hitEnemy(s,actor,amount);
}

function settleDebts(s,all=false){
  const pending=[];
  for(const debt of s.debts){
    if(!all&&debt.due>s.time){pending.push(debt);continue;}
    const enemy=debt.target==='player'?null:s.enemies.find(e=>e.id===debt.target);
    if(enemy&&enemy.hp>0&&!enemy.escaped&&!combatReady(s,enemy)){pending.push(debt);continue;}
    recordEvent(s,'debt-paid',{target:debt.target,amount:debt.amount,x:enemy?.x??s.x,z:enemy?.z??s.z});
    if(debt.target==='player')damage(s,'Stored impact applied. Hull damage received.',debt.amount,true,debt.details||{});
    else if(enemy&&enemy.hp>0&&!enemy.escaped)hitEnemy(s,enemy,debt.amount);
  }
  s.debts=pending;
}


function moveKleinRouteProjectile(s,shot,dt){
  const from={x:shot.x,z:shot.z},a={x:shot.x,y:arenaY(s,shot.z)},previousDepth=foldDepthAt(shot.z,s.fields);
  const speedFactor=1/metricAt(shot.z,s.fields),dx=(shot.vx||0)*dt*speedFactor,dy=(shot.vz||0)*dt*speedFactor;
  const motion=surfaceTrace(s,a,dx,dy);shot.x=motion.x;shot.z=arenaZ(s,motion.y);
  if(motion.twists%2)shot.vz*=-1;
  if(isProjectiveSurfaceRoute(s)&&motion.projectiveCrossings%2)shot.vx*=-1;
  if(motion.crossings.length){
    shot.surfaceCrossings=(shot.surfaceCrossings||0)+motion.crossings.length;shot.lastCrossing=motion.crossings.at(-1);shot.lastCrossingAt=s.time;
    for(const crossing of motion.crossings)recordEvent(s,'klein-crossing',{...crossing,
      rule:crossing.rule||(crossing.edge==='left'||crossing.edge==='right'?'klein':'periodic'),
      actor:shot.owner==='player'?'player-shot':'enemy-shot',objectId:projectileIdentity(s,shot),sourceId:shot.sourceId,
      time:s.time,fraction:crossing.time,x:shot.x,z:shot.z});
  }
  noteFoldTransition(s,shot,previousDepth);
  return motion.segments.map(seg=>({from:{x:seg.from.x,z:arenaZ(s,seg.from.y)},to:{x:seg.to.x,z:arenaZ(s,seg.to.y)},t0:seg.t0,t1:seg.t1}));
}

const surfaceHit=(s,a,b,r)=>isProjectiveSurfaceRoute(s)?pathsHitProjective(a,b,r,KLEIN_BOUNDS):pathsHit(a,b,r,KLEIN_BOUNDS);
const routeScreenPaths=(s,paths)=>paths.map(seg=>({from:{x:seg.from.x,y:arenaY(s,seg.from.z)},to:{x:seg.to.x,y:arenaY(s,seg.to.z)},t0:seg.t0??0,t1:seg.t1??1}));
const stationaryScreen=(s,obj)=>[{from:{x:obj.x,y:arenaY(s,obj.z)},to:{x:obj.x,y:arenaY(s,obj.z)},t0:0,t1:1}];

export function tick(s, input, dt = STEP) {
  if (s.phase !== 'running') return;
  if(s.countdown>0){s.countdown=Math.max(0,s.countdown-dt);return;}
  s.lastAxialInput=isCampaign(s)?0:input.throttle||0;
  if(isBoss(s)){tickBoss(s,input,dt,{damage,impact,settleDebts,collectDrops,tickEnemyWeapon,recordEvent,steerPlayer,tickDamagedDrive,grazePlayer,tickEcology});return;}
  const oldZ = s.z, oldX = s.x;
  s.time += dt;
  tickDamagedDrive(s);
  s.invulnerable = Math.max(0, s.invulnerable - dt);
  steerPlayer(s,input.horizontal,dt,isKleinSurfaceRoute(s));
  s.thrust = isCampaign(s)?0:BASE_THRUST * (1 + (input.throttle || 0) * 0.4);
  if(isCampaign(s)){
    const route=isKleinSurfaceRoute(s),cameraFrom=route?(s.surfaceViewZ||0):s.cameraZ;
    const facingFrom=s.facing||1,offset=arenaY(s,s.z);
    if(isScrollingLevel(s))s.cameraZ=Math.min(chapter(s).routeLength,advanceThroughSpace(s.cameraZ,SCROLL_SPEED*dt,s.fields));
    let frameTurned=false;
    if(route){
      // The level's forward progress and the transported camera are distinct.
      // Crossing a Klein side join changes the physical forward direction,
      // never the direction of the scrolling route or the screen limits.
      s.surfaceViewZ=advanceThroughSpace(cameraFrom,facingFrom*SCROLL_SPEED*dt,s.fields);
      const lower=25,upper=(KLEIN_BOUNDS.top+KLEIN_BOUNDS.bottom)/2-35;
      // Campaign input changes the lateral path. The scrolling frame carries
      // longitudinal position and keeps the existing lower-half bounds.
      const targetY=clamp(offset,lower,upper);
      const motion=surfaceTrace(s,{x:oldX,y:offset},s.x-oldX,targetY-offset);
      s.x=motion.x;s.z=arenaZ(s,motion.y);
      frameTurned=(motion.twists%2)!==0;
      if(frameTurned){
        s.facing=-facingFrom;
        // Carry the camera across the twisted join. The world is reflected
        // in the new chart, but the ship stays in the bottom-half viewport.
        s.surfaceViewZ=advanceThroughSpace(s.z,-s.facing*targetY,s.fields);
        for(const enemy of s.enemies){if(enemy.routeActive)enemy.driftY=-(enemy.driftY||0);enemy.presented=false;enemy.visibleFor=0;enemy.telegraph=null;enemy.contacting=false;}
        for(const shot of [...s.shots,...s.enemyShots])if(Number.isFinite(shot.vz))shot.vz=-shot.vz;
        s.events.push({time:s.time,type:'klein-frame-turn',facing:s.facing,edge:motion.crossings.find(c=>c.edge==='left'||c.edge==='right')?.edge});
        s.lastEvent='Klein side join: forward direction reversed on the surface. The camera follows your ship.';
      }
      // Collision paths must be expressed in the same post-crossing chart as
      // every projectile; split seam segments rather than drawing a fake hit.
      s.campaign.shipMotion={...motion,segments:frameTurned?motion.segments.map(seg=>({
        ...seg,from:{x:seg.from.x,y:KLEIN_BOUNDS.top+KLEIN_BOUNDS.bottom-seg.from.y},
        to:{x:seg.to.x,y:KLEIN_BOUNDS.top+KLEIN_BOUNDS.bottom-seg.to.y}})):motion.segments};
      if(motion.crossings.length){
        s.campaign.wraps+=motion.crossings.length;
        for(const crossing of motion.crossings)s.events.push({time:s.time,type:'klein-crossing',actor:'player',edge:crossing.edge,fraction:crossing.time,x:crossing.x,y:crossing.y});
        if(s.campaign.metrics){s.campaign.metrics.seamCrossings+=motion.crossings.length;creditSeamTraversal(s,motion.crossings);}
      }
      s.thrust=SCROLL_SPEED;
    }else{
      s.z=arenaZ(s,offset);
      s.thrust=spaceDistance(oldZ,s.z,s.fields)/dt;
    }
    moveCampaignEnemies(s,dt,cameraFrom,facingFrom,frameTurned);
    tutorialMovement(s,oldX,oldZ);tickWaveDirector(s);
  }else s.z = advanceThroughSpace(s.z, s.thrust * dt, s.fields);
  if(modeStage(s)!==s.stage){s.stage=modeStage(s);s.slotCount=s.stage===2?2:1;recordEvent(s,'stage',{stage:s.stage});s.lastEvent=s.stage===1?'Three upgrades are now in play.':'Seven upgrades are now in play. The second slot is available.';}
  updateCombatReadiness(s,dt);s.effects=s.effects.filter(e=>e.until>s.time);
  settleDebts(s);
  if(s.phase!=='running')return;
  if(s.mode==='warp-lab' && s.time>=3+s.labWave*2){
    const offset=s.labWave%2? -90:90;
    s.enemyShots.push({x:s.x+offset,z:advanceThroughSpace(s.z,230,s.fields),vx:-Math.sign(offset)*40,vz:-145,payload:[]});s.labWave++;
  }
  if(s.mode==='warp-lab'&&s.time>=s.labDropClock){makeDrop(s,s.x,advanceThroughSpace(s.z,160,s.fields),'lab-repeat',0,Math.round(s.labDropClock/6)%2?-1:1);s.labDropClock+=6;}
  tickEcology(s,input,dt);
  s.fireClock = Math.max(0, s.fireClock - dt);
  // Keep manual fire active while the player changes distance.
  const tutorialFireAllowed=!isTutorial(s)||['shoot','fold','unfold','engage'].includes(s.campaign.lesson);
  if (input.fire && tutorialFireAllowed && s.fireClock <= 0) {
    s.shots.push({ x: s.x, z: isCampaign(s)?advanceThroughSpace(s.z,25*s.facing,s.fields):s.z+25,vx:0,vz:680*(isCampaign(s)&&!isKleinSurfaceRoute(s)?s.facing:1),payload:loadout(s).map(seed=>seed.type),owner:'player',geometryRule:isProjectiveSurfaceRoute(s)?'projective':isKleinSurfaceRoute(s)?'klein':'route' });
    s.fireClock = 0.16;
    recordEvent(s,'player-fire',{...s.shots.at(-1),actor:'player'});
    if(s.encounter)recordEvent(s,'fire',{x:s.x,z:s.z});
  }
  for (const shot of s.shots) {
    if(shot.dead)continue;
    if(usesVisibleCombat(s)&&!inPlayerShotView(s,shot)){shot.dead=true;continue;}
    const from={x:shot.x,z:shot.z};shot.vz??=680;
    let paths;if(isKleinSurfaceRoute(s))paths=moveKleinRouteProjectile(s,shot,dt);else{const previousDepth=foldDepthAt(shot.z,s.fields);moveShot(shot,dt,s.fields);noteFoldTransition(s,shot,previousDepth);paths=[{from,to:shot}];}
    const defender=s.enemies.filter(e=>e.hp>0&&!e.escaped&&e.stage<=s.stage&&combatReady(s,e)&&loadout(e).length&&!shot.gates?.[`enemy-${e.id}`]&&Math.sign(shot.vz)*spaceDistance(from.z,e.z,s.fields)>=0).sort((a,b)=>Math.abs(a.z-from.z)-Math.abs(b.z-from.z))[0];
    const bodies=s.asteroids.length?s.enemies.filter(e=>e.hp>0&&!e.escaped&&e.stage<=s.stage&&combatReady(s,e)).map(object=>({object,radius:26})):[];
    if(s.asteroids.length){const entry=defender?operationEntryTime(s,defender,shot,from,defender,isCampaign(s)?defender.facing:-1):null;
      if(interceptAsteroid(s,paths,shot,'player',{before:entry??Infinity,bodies}))continue;}
    if(defender)paths=applyOperations(s,defender,shot,from,defender,dt,isCampaign(s)?defender.facing:-1)||paths;
    if(s.asteroids.length&&interceptAsteroid(s,paths,shot,'player',{bodies}))continue;
    for (const enemy of s.enemies) {
      if (enemy.hp <= 0 || enemy.escaped || enemy.stage>s.stage || !combatReady(s,enemy)) continue;
      const hit=isKleinSurfaceRoute(s)?surfaceHit(s,routeScreenPaths(s,paths),stationaryScreen(s,enemy),26):paths.some(p=>segmentNear(p.from.x-enemy.x,spaceDistance(enemy.z,p.from.z,s.fields),p.to.x-enemy.x,spaceDistance(enemy.z,p.to.z,s.fields),26));
      if (hit) {
        if(enemy.shield && !targetOpen(s)) {
          shot.dead=true;
          recordEvent(s,'shield-block',{target:enemy.id});
          break;
        }
        impact(s,enemy,shot);shot.dead=true;
        break;
      }
    }
  }
  for (const enemy of s.enemies) {
    if (enemy.hp <= 0 || enemy.escaped || enemy.stage>s.stage) continue;
    const distance = spaceDistance(s.z, enemy.z, s.fields);
    if (!isCampaign(s)&&distance < -80) { enemy.escaped = true; continue; }
    if(!combatReady(s,enemy)){enemy.telegraph=null;enemy.contacting=false;continue;}
    if(usesVisibleCombat(s))tickEnemyWeapon(s,enemy,dt);
    else if(!enemy.shield&&distance<920&&distance>110){
      enemy.clock-=dt;
      if(enemy.clock<=0){
        const shot={x:enemy.x,z:enemy.z-20,vz:-145,vx:clamp((s.x-enemy.x)*.22,-90,90),payload:loadout(enemy).map(seed=>seed.type)};
        s.enemyShots.push(shot);recordEvent(s,'enemy-fire',{...shot,actor:`enemy-${enemy.id}`,target:enemy.id});
        enemy.clock=enemy.firePeriod??2.3+(enemy.id%3)*.2;
      }
    }
    const touching=!enemy.training&&(isKleinSurfaceRoute(s)?surfaceHit(s,s.campaign.shipMotion?.segments||stationaryScreen(s,s),stationaryScreen(s,enemy),35):segmentNear(enemy.x-oldX,spaceDistance(oldZ,enemy.z,s.fields),enemy.x-s.x,spaceDistance(s.z,enemy.z,s.fields),35));
    if(touching&&!enemy.contacting)damage(s,'Ship contact. One hull point lost.',1,false,{source:'ship',target:enemy.id});
    enemy.contacting=touching;
  }

  collectDrops(s,{x:oldX,z:oldZ},isKleinSurfaceRoute(s)?s.campaign.shipMotion?.segments:null);
  for (const shot of s.enemyShots) {
    if(shot.dead)continue;
    const px = shot.x, pz = shot.z;
    shot.vz??=-145;const previousDepth=foldDepthAt(shot.z,s.fields);const kleinPaths=isKleinSurfaceRoute(s)?moveKleinRouteProjectile(s,shot,dt):null;if(!kleinPaths){moveShot(shot,dt,s.fields);noteFoldTransition(s,shot,previousDepth);}
    if(s.asteroids.length){
      const nominal=[{from:{x:px,z:pz},to:shot,shipFrom:{x:oldX,z:oldZ},shipTo:s}];
      const entry=operationEntryTime(s,s,shot,{x:px,z:pz},{x:oldX,z:oldZ},isCampaign(s)?s.facing:1);
      if(interceptAsteroid(s,nominal,shot,'enemy',{before:entry??Infinity,bodies:[{object:s,radius:activeShip(s).coreRadius,moving:true,halfWidth:shot.halfWidth||0}]}))continue;
    }
    const warpedMotion=isKleinSurfaceRoute(s)?kleinPaths:applyOperations(s,s,shot,{x:px,z:pz},{x:oldX,z:oldZ},dt,isCampaign(s)?s.facing:1);
    const halfWidth=shot.halfWidth || 0;
    const edge = x => Math.sign(x) * Math.max(0,Math.abs(x)-halfWidth);
    const paths=warpedMotion || [{from:{x:px,z:pz},to:shot,shipFrom:{x:oldX,z:oldZ},shipTo:s}];
    if(s.asteroids.length&&interceptAsteroid(s,paths,shot,'enemy',{bodies:[{object:s,radius:activeShip(s).coreRadius,moving:true,halfWidth}]}))continue;
    const coreRadius=activeShip(s).coreRadius,shipPath=s.campaign.shipMotion?.segments||stationaryScreen(s,s);
    const hitPlayer=isKleinSurfaceRoute(s)?surfaceHit(s,routeScreenPaths(s,paths),shipPath,coreRadius):paths.some(p=>segmentNear(edge(p.from.x-p.shipFrom.x),spaceDistance(p.shipFrom.z,p.from.z,s.fields),edge(p.to.x-p.shipTo.x),spaceDistance(p.shipTo.z,p.to.z,s.fields),coreRadius));
    const nearPlayer=!hitPlayer&&(isKleinSurfaceRoute(s)?surfaceHit(s,routeScreenPaths(s,paths),shipPath,coreRadius+14):paths.some(p=>segmentNear(edge(p.from.x-p.shipFrom.x),spaceDistance(p.shipFrom.z,p.from.z,s.fields),edge(p.to.x-p.shipTo.x),spaceDistance(p.shipTo.z,p.to.z,s.fields),coreRadius+14)));
    if(nearPlayer)grazePlayer(s,shot);
    if (hitPlayer) {
      shot.dead = true; impact(s,s,shot);
    }
  }
  for(const rock of s.asteroids){
    if(rock.hp<=0||!rock.presented||rock.wakeUntil>s.time||!inCombatView(s,rock))continue;
    if(isKleinSurfaceRoute(s)?surfaceHit(s,s.campaign.shipMotion?.segments||stationaryScreen(s,s),stationaryScreen(s,rock),rock.radius+activeShip(s).coreRadius):segmentNear(oldX-rock.x,spaceDistance(rock.z,oldZ,s.fields),s.x-rock.x,spaceDistance(rock.z,s.z,s.fields),rock.radius+18)){
      damage(s,'Asteroid impact. One hull point lost.',1,false,{source:'asteroid',target:rock.id});breakAsteroid(s,rock,'ship');
    }
  }
  s.asteroids=s.asteroids.filter(rock=>rock.hp>0&&(!isScrollingLevel(s)||arenaY(s,rock.z)>-140));
  if(s.encounter && s.phase==='running') {
    if(s.hull<5)endEncounter(s,false,s.encounterIndex===2?'Salvo impact. Consider how the field changes the escape interval.':'Salvo impact. Unfold earlier, then steer clear of the marked band.');
    else if(s.encounterIndex===0 && s.encounter.hit)endEncounter(s,true,'Target hit during its opening.');
    else if(s.encounterIndex!==1 && !s.encounter.hit && s.time>=s.encounter.closes)
      endEncounter(s,false,'Target closed before the hit. Fold earlier and fire into the opening.');
    else if(s.encounter.salvoLaunched && s.enemyShots.every(b=>!b.salvo || b.z<s.z-40))
      endEncounter(s,true,s.encounterIndex===1?'Salvo avoided. No hull damage.':'Target hit and salvo avoided.');
    else if(s.time>=s.encounter.limit)endEncounter(s,false,'Encounter time ended. Retry this encounter.');
  }
  for (const gate of s.gates) {
    if (!gate.checked && oldZ < gate.z && s.z >= gate.z) {
      gate.checked = true;
      const crossX = oldX + (s.x - oldX) * (gate.z - oldZ) / (s.z - oldZ);
      if (Math.abs(crossX - gate.gap) > gate.width / 2 - 15) damage(s, 'Gate impact. Fly through the opening.');
      else { s.score += 25; s.lastEvent = 'Gate cleared.'; }
    }
  }
  s.shots = s.shots.filter(b => !b.dead && b.z < s.z + 4200 && (!usesVisibleCombat(s)||inPlayerShotView(s,b)));
  s.enemyShots = s.enemyShots.filter(b => !b.dead && (isScrollingLevel(s)?arenaY(s,b.z)>-140:isCampaign(s)?inPlayerShotView(s,b):b.z>s.z-100) && Math.abs(b.x) < 600);
  s.drops=s.drops.filter(d=>!d.collected && (isScrollingLevel(s)?arenaY(s,d.z)>-140:isCampaign(s)||d.z>s.z-100));
  campaignAfterTick(s);
  if (!isCampaign(s)&&!s.encounter && s.phase === 'running' && s.z >= ROUTE_LENGTH) {
    settleDebts(s,true);s.z=ROUTE_LENGTH;if(s.phase==='running'){s.phase='won';s.lastEvent='Transit complete.';}
  }
}

function collectDrops(s,old={x:s.x,z:s.z},motion=null,{recoverAll=false}={}){
  const stationary=object=>[{from:{x:object.x,y:arenaY(s,object.z)},to:{x:object.x,y:arenaY(s,object.z)},t0:0,t1:1}];
  const klein=isBoss(s)||isKleinSurfaceRoute(s);
  for(const drop of s.drops){
    if(drop.collected)continue;
    if(klein){
      // Drop offsets and later fold changes can place salvage outside the chart.
      // Map it onto the surface without changing the seed's fixed handedness.
      const position=surfaceTrace(s,{x:drop.x,y:arenaY(s,drop.z)},0,0);
      drop.x=position.x;drop.z=arenaZ(s,position.y);
      // Use the actual split flight path. No path joins opposite seam endpoints.
      if(recoverAll||(isProjectiveSurfaceRoute(s)?pathsHitProjective(motion||stationary(s),stationary(drop),28,KLEIN_BOUNDS):pathsHit(motion||stationary(s),stationary(drop),28,KLEIN_BOUNDS)))collectDrop(s,drop);
    }else if(segmentNear(old.x-drop.x,spaceDistance(drop.z,old.z,s.fields),s.x-drop.x,spaceDistance(drop.z,s.z,s.fields),28))collectDrop(s,drop);
  }
  if(klein)s.drops=s.drops.filter(d=>!d.collected);
}

function modeStage(s){return s.mode==='upgrades'?Math.max(s.startStage,s.z<1300?0:s.z<3800?1:2):s.stage;}

export function readFlight(s) {
  return structuredClone({ phase: s.phase,mode:s.mode,runSeed:s.runSeed, x: s.x, z: s.z, time: s.time,
    hull: s.hull, score: s.score,kills:s.kills, foldBonus: s.foldBonus, countdown:s.countdown,bonusEnabled:s.bonusEnabled,maxFolds:s.maxFolds,facing:s.facing,cameraZ:s.cameraZ,
    shipId:s.shipId,ship:activeShip(s),fleetProfile:s.fleetProfile,lateralVelocity:s.lateralVelocity,drive:s.drive,surfaceViewZ:s.surfaceViewZ,
    campaign:isCampaign(s)?{...s.campaign,chapter:chapter(s),elapsed:s.time-s.campaign.startedAt}:null,deathRecap:s.deathRecap,projective:s.projective||null,
    encounterIndex:s.encounterIndex ?? null,encounter:s.encounter?{...s.encounter,open:targetOpen(s)}:null,
    events:s.events.map(e=>({...e})),fields: s.fields.map(f=>({...f})),
    localFactor: 1 / metricAt(s.z, s.fields), thrust: s.thrust,
    shotCount: s.shots.length, enemyShotCount: s.enemyShots.length,
    foldsUsed: s.foldsUsed, lastEvent: s.lastEvent,upgrade:s.upgrade?{...s.upgrade}:null,warpSide:warpSide(s),warpCount:s.warpCount,
    stage:s.stage,slotCount:s.slotCount,selectedSlot:s.selectedSlot,inventory:s.inventory.map(seed=>({...seed})),equipped:s.equipped.map(seed=>seed?{...seed}:null),debts:s.debts.map(d=>({...d})),
    view:s.view,effects:s.effects,asteroids:s.asteroids,
    enemies:s.enemies.map(e=>({...e,visible:inCombatView(s,e),ready:combatReady(s,e),equipped:loadout(e).map(seed=>({...seed}))})),
    drops:s.drops.map(d=>({...d,accepts:activeSourceSide(s,d)})),
    projectiles: {player:s.shots.map(b=>({...b, distance:spaceDistance(s.z,b.z,s.fields), speedFactor:1/metricAt(b.z,s.fields)})),
      enemy:s.enemyShots.map(b=>({...b, distance:spaceDistance(s.z,b.z,s.fields), speedFactor:1/metricAt(b.z,s.fields)}))} });
}
