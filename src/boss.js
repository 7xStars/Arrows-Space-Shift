import {KLEIN_BOUNDS,traceKlein,traceKleinProjective,pathsHit,pathsHitProjective} from './klein.js';
import {arenaY,arenaZ,SCROLL_SPEED,chapter,isHybridBoss,isProjectiveBoss,hybridProjectiveActive} from './campaign.js';
import {loadout,moveShot,applyOperations} from './upgrades.js';
import {foldDepthAt} from './space.js';
import {combatReady,updateCombatReadiness,viewY,viewDirection} from './combat-view.js';
import {activeShip,unlockKleinFleet,unlockProjectiveModule,unlockCurvatureSeed} from './fleet.js';
import {projectileIdentity} from './projectile-id.js';

const TAU=Math.PI*2;
const point=(s,p)=>({x:p.x,y:arenaY(s,p.z)});
const still=(s,p)=>[{from:point(s,p),to:point(s,p),t0:0,t1:1}];

const PATTERN_SEQUENCE=Object.freeze(['fan','gap','sweep','aimed','wall','return']);
export const PATTERN_DEFINITIONS=Object.freeze({
  fan:Object.freeze({name:'FAN',purpose:'Several angles radiate from one source.'}),
  sweep:Object.freeze({name:'SWEEP',purpose:'The firing direction changes over committed beats.'}),
  gap:Object.freeze({name:'GAP',purpose:'A dense field leaves a readable opening.'}),
  aimed:Object.freeze({name:'AIMED',purpose:'A shot commits to the player position during the warning.'}),
  burst:Object.freeze({name:'BURST',purpose:'Several rapid volleys separated by recovery.'}),
  wall:Object.freeze({name:'WALL',purpose:'A broad obstruction pressures route choice.'}),
  spiral:Object.freeze({name:'SPIRAL',purpose:'A rotating emission develops over time.'}),
  crossfire:Object.freeze({name:'CROSSFIRE',purpose:'Multiple origins constrain different routes.'}),
  return:Object.freeze({name:'RETURN',purpose:'A familiar attack deliberately exploits a surface join.'}),
  convergence:Object.freeze({name:'CONVERGENCE',purpose:'Independent trajectories meet later.'}),
});
const PATTERN_NAMES=Object.freeze(Object.fromEntries(Object.entries(PATTERN_DEFINITIONS).map(([key,value])=>[key,value.name])));

/**
 * Freeze the whole attack when its warning starts. Only authored Stage 7 and
 * fleet actors opt in. The player keeps the same forward projectile weapon.
 * Counts, angles, and beat intervals below are playtest tuning candidates.
 */
export function preparePattern(enemy,aim){
  if(!enemy.patternRole||!aim||!Number.isFinite(aim.vx)||!Number.isFinite(aim.vz)||Math.hypot(aim.vx,aim.vz)<1e-9)return null;
  const cycle=Math.max(0,Math.floor(enemy.patternCycle||0)),sequence=enemy.patternSequence?.length?enemy.patternSequence:PATTERN_SEQUENCE;
  const key=enemy.patternRole==='cycle'?sequence[cycle%sequence.length]:enemy.patternRole;
  if(!PATTERN_NAMES[key])return null;
  const config=enemy.patternConfig||{},strength=enemy.boss?1:Math.max(0,Math.min(1,enemy.introduction??1));
  const core=enemy.patternRole==='cycle';
  let count=config.count??(enemy.boss?3:core?9:strength<.25?2:strength<.66?3:4);
  let beatCount=config.beats??(enemy.boss?2:strength<.25?1:strength<.66?2:3);
  if(key==='burst'){count=config.count??3;beatCount=config.beats??3;}
  if(key==='spiral'){count=config.count??2;beatCount=config.beats??4;}
  if(key==='crossfire'){count=config.count??4;beatCount=config.beats??2;}
  const beatInterval=config.beatInterval??(enemy.boss?.18:.22),spacing=config.spacing??(enemy.boss?.24:.18);
  const gapWidth=Math.max(1,Math.floor(config.gapWidth??2)),gapMotion=Math.floor(config.gapMotion??1);
  const rotate=angle=>({vx:aim.vx*Math.cos(angle)-aim.vz*Math.sin(angle),vz:aim.vx*Math.sin(angle)+aim.vz*Math.cos(angle)});
  const geometryRule=enemy.geometryRule||'klein';
  const volleys=Object.freeze(Array.from({length:beatCount},(_,beat)=>{
    const slots=key==='wall'?Math.max(5,count+2):count+(key==='gap'?gapWidth:0),center=(slots-1)/2;
    const gapStartRaw=(cycle%2?1+beat*gapMotion:count-1-beat*gapMotion),gapStart=Math.max(0,Math.min(slots-gapWidth,gapStartRaw));
    const rotation=config.rotation??.18;
    const sweep=key==='sweep'?(beat-(beatCount-1)/2)*rotation*(cycle%2?-1:1):0;
    const defaultSpread=key==='wall'?.11:key==='aimed'?.08:key==='return'?.72:key==='burst'?.045:spacing;
    const spread=config.spread??defaultSpread;
    let angles=[];
    if(key==='spiral'){
      const base=(config.rotation??.42)*beat*(cycle%2?-1:1);
      angles=Array.from({length:count},(_,i)=>base+i*TAU/count);
    }else if(key==='crossfire'){
      const half=Math.max(1,Math.floor(count/2)),offset=config.crossAngle??.34;
      angles=[...Array.from({length:half},(_,i)=>-offset+(i-(half-1)/2)*spacing),
        ...Array.from({length:count-half},(_,i)=>offset+(i-(count-half-1)/2)*spacing)];
    }else{
      angles=Array.from({length:slots},(_,i)=>i)
        .filter(i=>key!=='gap'||i<gapStart||i>=gapStart+gapWidth)
        .sort((a,b)=>Math.abs(a-center)-Math.abs(b-center)||a-b)
        .map(i=>(i-center)*spread+sweep);
    }
    return Object.freeze(angles.map((angle,rayIndex)=>Object.freeze({...rotate(angle),geometryRule,rayIndex,beatIndex:beat})));
  }));
  return Object.freeze({
    patternKey:key,patternName:PATTERN_NAMES[key],beatCount,beatInterval,geometryRule,
    patternRecovery:config.recovery??enemy.firePeriod??(enemy.boss?(enemy.name==='Core'?1.5:2.3):2.3),
    previewShots:volleys[0],patternVolleys:volleys,
  });
}

/** Return committed velocities; callers create fresh shot objects for a beat. */
export function patternVolley(cue,beatIndex=0){
  return cue.patternVolleys?.[beatIndex]||[];
}

function wrap(s,object,from,actorKey=null){
  const start=point(s,from),end=point(s,object);
  const phase=s.campaign.hybridPhase||0,hybrid=isHybridBoss(s)&&(hybridProjectiveActive(s)||(phase===2&&object.projective===true));
  const result=(hybrid||isProjectiveBoss(s)?traceKleinProjective:traceKlein)(start,end.x-start.x,end.y-start.y);
  object.x=result.x;object.z=arenaZ(s,result.y);
  if(result.twists%2){if(object.vz!==undefined)object.vz*=-1;if(object.driftY!==undefined)object.driftY*=-1;if(object.facing)object.facing*=-1;}
  if((isProjectiveBoss(s)||hybrid)&&result.projectiveCrossings%2){if(object.vx!==undefined)object.vx*=-1;if(object.driftX!==undefined)object.driftX*=-1;}
  if(result.crossings.length){
    s.campaign.wraps+=result.crossings.length;
    object.surfaceCrossings=(object.surfaceCrossings||0)+result.crossings.length;object.lastCrossing=result.crossings.at(-1);object.lastCrossingAt=s.time;
    if(actorKey==='player'&&s.campaign.metrics)s.campaign.metrics.seamCrossings+=result.crossings.length;
    // A committed source direction was solved in its previous physical lift.
    // Recompute the next warning after any source representative change.
    if(actorKey&&actorKey!=='player')object.telegraph=null;
    // A physical top/bottom representative can change in the middle of a
    // scrolling view. Only a real side return (or later camera cut) starts
    // another visible entry period; a coordinate relabel is not a new arrival.
    if(result.crossings.some(c=>c.edge==='left'||c.edge==='right')){
      object.presented=false;object.visibleFor=0;object.telegraph=null;object.contacting=false;
    }
    if(!actorKey&&object.gates)object.gates={};
    for(const crossing of result.crossings)s.events.push({type:'klein-crossing',actor:actorKey||'shot',objectId:actorKey||projectileIdentity(s,object),...crossing,rule:crossing.rule||(crossing.edge==='left'||crossing.edge==='right'?'klein':'periodic'),time:s.time,fraction:crossing.time});
    if(actorKey)for(const shot of [...s.shots,...s.enemyShots])if(shot.gates)delete shot.gates[actorKey];
  }
  return result;
}

function processShot(s,shot,dt,receiver,oldReceiver,facing,receiverWrapped){
  const from={x:shot.x,z:shot.z},previousDepth=foldDepthAt(shot.z,s.fields);moveShot(shot,dt,s.fields);
  const motion=wrap(s,shot,from),depth=foldDepthAt(shot.z,s.fields);
  if(depth!==previousDepth){shot.foldDepth=depth;shot.foldTransitions=(shot.foldTransitions||0)+1;shot.foldChangedAt=s.time;
    s.events.push({time:s.time,type:depth>previousDepth?'fold-entry':'fold-exit',actor:'shot',owner:shot.owner||'unknown',x:shot.x,z:shot.z,depth});}
  if(motion.crossings.length||!receiver||receiverWrapped)return motion.segments;
  const parts=applyOperations(s,receiver,shot,from,oldReceiver,dt,facing);
  if(!parts)return motion.segments;
  const paths=[];
  for(const part of parts){
    const a=point(s,part.from),b=point(s,part.to),phase=s.campaign.hybridPhase||0,hybrid=isHybridBoss(s)&&(hybridProjectiveActive(s)||(phase===2&&shot.projective===true)),r=(hybrid||isProjectiveBoss(s)?traceKleinProjective:traceKlein)(a,b.x-a.x,b.y-a.y);
    for(const segment of r.segments)paths.push({...segment,t0:part.t0+(part.t1-part.t0)*segment.t0,t1:part.t0+(part.t1-part.t0)*segment.t1});
    if(r.twists%2)shot.vz*=-1;
    if((isProjectiveBoss(s)||hybrid)&&r.projectiveCrossings%2)shot.vx*=-1;
    shot.x=r.x;shot.z=arenaZ(s,r.y);
  }
  return paths;
}


export function updateHybridPhase(s,hooks={recordEvent:(state,type,data)=>state.events.push({time:state.time,type,...data})}){
  if(!isHybridBoss(s)||s.campaign?.bossPhase!=='combat')return s.campaign?.hybridPhase||1;
  const total=s.enemies.reduce((n,e)=>n+(e.maxHp||0),0)||1,remaining=s.enemies.reduce((n,e)=>n+Math.max(0,e.hp),0);
  const ratio=remaining/total,phase=ratio>.75?1:ratio>.5?2:ratio>.25?3:4;
  if(phase===(s.campaign.hybridPhase||1))return phase;
  const previous=s.campaign.hybridPhase||1,joinWasActive=hybridProjectiveActive(s),previousBreak=s.campaign.phaseBreakUntil;
  s.campaign.hybridPhase=phase;s.campaign.phaseBreakUntil=s.time+2.2;s.enemyShots=[];
  if(phase>=3&&!Number.isFinite(s.campaign.hybridJoinReadyAt)){
    // Recovery changes the attack schedule, not an already armed boundary.
    s.campaign.hybridJoinReadyAt=previous>=3?
      (joinWasActive?s.time:Number.isFinite(previousBreak)?previousBreak:s.campaign.phaseBreakUntil):s.campaign.phaseBreakUntil;
  }
  const [core,kleinAnchor,antipodal]=s.enemies;
  for(const enemy of s.enemies){enemy.telegraph=null;enemy.clock=.5;enemy.patternCycle=0;}
  if(phase===2){
    core.patternSequence=['gap','fan'];core.geometryRule='klein';core.patternConfig={count:4,beats:2,recovery:1.45};
    kleinAnchor.patternSequence=['wall','fan'];kleinAnchor.geometryRule='klein';kleinAnchor.patternConfig={count:3,beats:2,recovery:1.75};
    antipodal.patternSequence=['return','aimed','sweep'];antipodal.geometryRule='projective';antipodal.projective=true;antipodal.patternConfig={count:3,beats:2,recovery:1.75};
  }else if(phase===3){
    core.patternSequence=['crossfire','gap','spiral'];core.geometryRule='hybrid';core.projective=true;core.patternConfig={count:4,beats:2,recovery:1.25};
    kleinAnchor.patternSequence=['wall','return','fan'];kleinAnchor.geometryRule='hybrid';kleinAnchor.projective=true;kleinAnchor.patternConfig={count:4,beats:2,recovery:1.45};
    antipodal.patternSequence=['return','aimed','gap'];antipodal.geometryRule='projective';antipodal.projective=true;antipodal.patternConfig={count:4,beats:2,recovery:1.45};
  }else if(phase===4){
    core.patternSequence=['fan','return','gap','crossfire','spiral'];core.geometryRule='hybrid';core.projective=true;core.patternConfig={count:5,beats:2,recovery:1.05};
    kleinAnchor.patternSequence=['wall','sweep','return'];kleinAnchor.geometryRule='klein';kleinAnchor.projective=false;kleinAnchor.patternConfig={count:4,beats:2,recovery:1.3};
    antipodal.patternSequence=['aimed','return','gap'];antipodal.geometryRule='projective';antipodal.projective=true;antipodal.patternConfig={count:4,beats:2,recovery:1.3};
  }
  const joinReady=hybridProjectiveActive(s),joinWait=Math.max(0,(s.campaign.hybridJoinReadyAt||s.time)-s.time);
  const text=phase===2?'PROJECTIVE INTRUSION: only the Antipodal Anchor uses the new join.':phase===3?'PROJECTIVE JOIN ARMING: 2.2 seconds until player top/bottom boundary changes.':phase===4?
    (joinReady?'HYBRID RECOVERY: the player join stays active. New attacks wait 2.2 seconds.':`HYBRID RECOVERY: the player join arms in ${joinWait.toFixed(1)} seconds. New attacks wait 2.2 seconds.`):'Klein baseline restored.';
  s.campaign.announcement={text,until:s.time+4};s.lastEvent=text;
  hooks.recordEvent(s,'hybrid-phase',{phase,previous,breakUntil:s.campaign.phaseBreakUntil,joinReadyAt:s.campaign.hybridJoinReadyAt,playerJoinActive:joinReady,geometry:phase===2?'projective-intrusion':phase>=3?'klein-projective-hybrid':'klein'});
  return phase;
}

/** The Act III exam changes combinations, not the mathematical surface.
 * Hyperbolic curvature is reserved for the later, fully specified module.
 */
export function updateCurvaturePhase(s,hooks={recordEvent:(state,type,data)=>state.events.push({time:state.time,type,...data})}){
  if(!isProjectiveBoss(s)||s.campaign?.bossPhase!=='combat')return s.campaign?.curvaturePhase||1;
  const total=s.enemies.reduce((n,e)=>n+(e.maxHp||0),0)||1;
  const remaining=s.enemies.reduce((n,e)=>n+Math.max(0,e.hp),0);
  const ratio=remaining/total,phase=ratio>.67?1:ratio>.34?2:3;
  if(phase===(s.campaign.curvaturePhase||1))return phase;
  s.campaign.curvaturePhase=phase;s.campaign.phaseBreakUntil=s.time+1.8;s.enemyShots=[];
  const [core,left,right]=s.enemies;
  for(const enemy of s.enemies){enemy.telegraph=null;enemy.clock=.7;enemy.patternCycle=0;}
  if(phase===2){
    core.patternSequence=['return','gap','crossfire'];core.patternConfig={count:4,beats:2,recovery:1.2};
    left.patternSequence=['fan','aimed'];right.patternSequence=['wall','sweep'];
  }else{
    core.patternSequence=['spiral','return','convergence','gap'];core.patternConfig={count:5,beats:3,recovery:1.1};
    left.patternSequence=['crossfire','fan'];right.patternSequence=['return','sweep','aimed'];
  }
  const text=phase===2?'Curvature anomaly: familiar patterns now demand captured echoes.':
    'Curvature Gate convergence: choose when to release your stored power.';
  s.campaign.announcement={text,until:s.time+4};s.lastEvent=text;
  hooks.recordEvent(s,'curvature-phase',{phase,breakUntil:s.campaign.phaseBreakUntil});
  return phase;
}

export function tickBoss(s,input,dt,hooks){
  if(s.campaign.introRemaining>0){s.campaign.introRemaining=Math.max(0,s.campaign.introRemaining-dt);return;}
  s.time+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);s.effects=s.effects.filter(e=>e.until>s.time);
  hooks.tickEcology?.(s,input,dt);
  hooks.tickDamagedDrive(s);
  const oldShip={x:s.x,z:s.z};
  // Forward flight continues on the surface. A side crossing transports its
  // direction with the ship; it is not a jump to another stationary lane.
  s.thrust=SCROLL_SPEED*s.facing;
  hooks.steerPlayer(s,input.horizontal,dt,true);s.z=arenaZ(s,arenaY(s,s.z)+s.thrust*dt);
  const shipMotion=wrap(s,s,oldShip,'player');
  s.thrust=SCROLL_SPEED*s.facing;
  s.cameraZ=s.z;
  s.campaign.scrollDistance=(s.campaign.scrollDistance||0)+SCROLL_SPEED*dt;
  if(shipMotion.twists%2)for(const enemy of s.enemies){
    // The transported camera reframes the whole view at a side join. A fresh
    // draw and entry period must precede combat in those new screen positions.
    enemy.presented=false;enemy.visibleFor=0;enemy.telegraph=null;enemy.contacting=false;
  }
  const enemyMotions=new Map(),oldEnemies=new Map();
  for(const enemy of s.enemies){
    if(enemy.hp<=0)continue;
    const old={x:enemy.x,z:enemy.z};oldEnemies.set(enemy.id,old);
    enemy.x+=enemy.driftX*dt;enemy.z=arenaZ(s,arenaY(s,enemy.z)+enemy.driftY*dt);
    enemyMotions.set(enemy.id,wrap(s,enemy,old,`enemy-${enemy.id}`));
    enemy.facing=(viewY(s,enemy.z)<0?1:-1)*viewDirection(s);
  }
  if(isHybridBoss(s))updateHybridPhase(s,hooks);
  if(isProjectiveBoss(s))updateCurvaturePhase(s,hooks);
  updateCombatReadiness(s,dt);hooks.settleDebts(s);if(s.phase!=='running')return;
  s.fireClock=Math.max(0,s.fireClock-dt);
  if(input.fire&&s.fireClock<=0){
    s.shots.push({x:s.x,z:arenaZ(s,arenaY(s,s.z)+25*s.facing),vx:0,vz:680*s.facing,payload:loadout(s).map(seed=>seed.type),bornAt:s.time,owner:'player',geometryRule:isProjectiveBoss(s)?'projective':isHybridBoss(s)&&(s.campaign.hybridPhase||1)>=3?'hybrid':'klein'});s.fireClock=.16;
    hooks.recordEvent(s,'player-fire',{...s.shots.at(-1),actor:'player'});
  }
  for(const enemy of s.enemies){
    if(enemy.hp<=0||!combatReady(s,enemy)){enemy.telegraph=null;enemy.contacting=false;continue;}
    hooks.tickEnemyWeapon(s,enemy,dt,true);
    const motion=enemyMotions.get(enemy.id);
    const hitPaths=isProjectiveBoss(s)||hybridProjectiveActive(s)?pathsHitProjective:pathsHit;
    const touching=hitPaths(shipMotion.segments,motion?.segments||still(s,enemy),32,KLEIN_BOUNDS);
    if(touching&&!enemy.contacting)hooks.damage(s,'Ship contact. One hull point lost.',1,false,{source:'ship',target:enemy.id});
    enemy.contacting=touching;
  }

  for(const shot of s.shots){
    if(shot.dead)continue;
    shot.bornAt??=s.time;
    const receiver=s.enemies.filter(e=>e.hp>0&&combatReady(s,e)&&e.facing*(arenaY(s,shot.z)-arenaY(s,e.z))>=0).sort((a,b)=>Math.abs(arenaY(s,a.z)-arenaY(s,shot.z))-Math.abs(arenaY(s,b.z)-arenaY(s,shot.z)))[0];
    const motion=processShot(s,shot,dt,receiver,receiver?oldEnemies.get(receiver.id)||receiver:null,receiver?.facing||-1,enemyMotions.get(receiver?.id)?.crossings.length);
    for(const enemy of s.enemies){
      if(enemy.hp<=0||!combatReady(s,enemy))continue;
      if((isProjectiveBoss(s)||hybridProjectiveActive(s)?pathsHitProjective:pathsHit)(motion,enemyMotions.get(enemy.id)?.segments||still(s,enemy),26,KLEIN_BOUNDS)){hooks.impact(s,enemy,shot);shot.dead=true;break;}
    }
  }
  for(const shot of s.enemyShots){
    if(shot.dead)continue;
    shot.bornAt??=s.time;
    const motion=processShot(s,shot,dt,s,oldShip,s.facing,shipMotion.crossings.length),coreRadius=activeShip(s).coreRadius;
    const projectiveHit=isProjectiveBoss(s)||hybridProjectiveActive(s)||(isHybridBoss(s)&&s.campaign.hybridPhase===2&&shot.projective===true);
    const hit=(projectiveHit?pathsHitProjective:pathsHit)(motion,shipMotion.segments,coreRadius,KLEIN_BOUNDS);
    if(!hit&&(projectiveHit?pathsHitProjective:pathsHit)(motion,shipMotion.segments,coreRadius+14,KLEIN_BOUNDS))hooks.grazePlayer?.(s,shot);
    if(hit){hooks.impact(s,s,shot);shot.dead=true;}
  }
  s.shots=s.shots.filter(shot=>!shot.dead&&s.time-shot.bornAt<5);
  s.enemyShots=s.enemyShots.filter(shot=>!shot.dead&&s.time-shot.bornAt<7);
  hooks.collectDrops(s,oldShip,shipMotion.segments);
  if(s.phase==='running'&&s.campaign.bossPhase==='combat'&&s.enemies.every(enemy=>enemy.hp<=0)){
    hooks.settleDebts(s,true);
    if(s.phase==='running'){
      s.enemyShots=[];
      const last=s.campaign.lastDefeat||s.enemies.at(-1)||{x:0,z:arenaZ(s,650)};
      const position=(isHybridBoss(s)||isProjectiveBoss(s)?traceKleinProjective:traceKlein)(point(s,last),0,0);
      s.campaign.bossPhase='salvage';s.drive.warningUntil=null;
      const projective=isHybridBoss(s),partId=isProjectiveBoss(s)?'curvature-seed':projective?'projective-module':'klein-relay';
      s.campaign.repairPart={id:partId,x:position.x,z:arenaZ(s,position.y),collected:false,readyAt:s.time+.35};
      s.lastEvent=partId==='curvature-seed'?'Curvature Gate defeated. Collect the physical Curvature Seed.':projective?'Intrusion defeated. Pick up the Projective Module.':'Fleet destroyed. Pick up the Klein relay. It stays on the surface until you reach it.';
      hooks.recordEvent(s,'boss-defeated',{...position,chapter:s.campaign.index});
    }
  }
  if(s.phase!=='running')return;
  const part=s.campaign.repairPart;
  if(s.campaign.bossPhase==='salvage'&&part&&!part.collected){
    const position=(part.id==='projective-module'||part.id==='curvature-seed'?traceKleinProjective:traceKlein)(point(s,part),0,0);part.x=position.x;part.z=arenaZ(s,position.y);
    if(s.time>=part.readyAt&&pathsHit(shipMotion.segments,still(s,part),28,KLEIN_BOUNDS)){
      part.collected=true;s.campaign.bossPhase='exit';s.campaign.exit={remaining:900,total:900,openedAt:s.time};
      s.lastEvent=part.id==='curvature-seed'?'Curvature Seed aboard. Cross the exit to bank it.':part.id==='projective-module'?'Projective Module aboard. Cross the exit to bank it.':'Klein Relay aboard. Cross the exit to bank the part and unlock the starter fleet.';
      hooks.recordEvent(s,'drive-part-collected',{part:part.id,x:part.x,z:part.z});
    }
  }
  const exit=s.campaign.exit;
  if(s.campaign.bossPhase==='exit'&&exit&&s.time>exit.openedAt){
    exit.remaining=Math.max(0,exit.remaining-SCROLL_SPEED*dt);
    if(exit.remaining<=1e-7){
      hooks.settleDebts(s,true);
      if(s.phase==='running'){
        hooks.collectDrops(s,oldShip,shipMotion.segments,{recoverAll:true});
        if(part.id==='curvature-seed')unlockCurvatureSeed(s.fleetProfile);else if(part.id==='projective-module')unlockProjectiveModule(s.fleetProfile);else unlockKleinFleet(s.fleetProfile);
        s.phase='won';s.lastEvent=part.id==='curvature-seed'?'Curvature Seed banked. Continue into Act IV to recover the final core.':part.id==='projective-module'?'Projective Module recovered. The next geometry can now become a normal traversal tool.':'Klein Relay recovered. Three starter ships are ready. The Warp Drive still needs its remaining parts.';
        hooks.recordEvent(s,'boss-extracted',{part:part.id,chapter:s.campaign.index});
        hooks.recordEvent(s,'campaign-complete',{chapter:s.campaign.index});
      }
    }
  }
}
