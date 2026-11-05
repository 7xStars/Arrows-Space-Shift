import {KLEIN_BOUNDS,traceKlein,pathsHit} from './klein.js';
import {arenaY,arenaZ,chapter} from './campaign.js';
import {loadout,moveShot,applyOperations} from './upgrades.js';
import {combatReady,updateCombatReadiness} from './combat-view.js';

const point=(s,p)=>({x:p.x,y:arenaY(s,p.z)});
const still=(s,p)=>[{from:point(s,p),to:point(s,p),t0:0,t1:1}];

function wrap(s,object,from,actorKey=null){
  const start=point(s,from),end=point(s,object);
  const result=traceKlein(start,end.x-start.x,end.y-start.y);
  object.x=result.x;object.z=arenaZ(s,result.y);
  if(result.twists%2){if(object.vz!==undefined)object.vz*=-1;if(object.driftY!==undefined)object.driftY*=-1;if(object.facing)object.facing*=-1;}
  if(result.crossings.length){
    s.campaign.wraps+=result.crossings.length;object.presented=false;object.visibleFor=0;
    if(!actorKey&&object.gates)object.gates={};
    for(const crossing of result.crossings)s.events.push({type:'klein-crossing',actor:actorKey||'shot',...crossing,time:s.time,fraction:crossing.time});
    if(actorKey)for(const shot of [...s.shots,...s.enemyShots])if(shot.gates)delete shot.gates[actorKey];
  }
  return result;
}

function processShot(s,shot,dt,receiver,oldReceiver,facing,receiverWrapped){
  const from={x:shot.x,z:shot.z};moveShot(shot,dt,s.fields);
  const motion=wrap(s,shot,from);
  if(motion.crossings.length||!receiver||receiverWrapped)return motion.segments;
  const parts=applyOperations(s,receiver,shot,from,oldReceiver,dt,facing);
  if(!parts)return motion.segments;
  const paths=[];
  for(const part of parts){
    const a=point(s,part.from),b=point(s,part.to),r=traceKlein(a,b.x-a.x,b.y-a.y);
    for(const segment of r.segments)paths.push({...segment,t0:part.t0+(part.t1-part.t0)*segment.t0,t1:part.t0+(part.t1-part.t0)*segment.t1});
    if(r.twists%2)shot.vz*=-1;
    shot.x=r.x;shot.z=arenaZ(s,r.y);
  }
  return paths;
}

export function tickBoss(s,input,dt,hooks){
  s.time+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);s.effects=s.effects.filter(e=>e.until>s.time);
  const oldShip={x:s.x,z:s.z};
  s.thrust=0;
  s.x+=(input.horizontal||0)*300*dt;s.z=arenaZ(s,arenaY(s,s.z)+s.thrust*dt);
  const shipMotion=wrap(s,s,oldShip,'player');
  const enemyMotions=new Map(),oldEnemies=new Map();
  for(const enemy of s.enemies){
    if(enemy.hp<=0)continue;
    const old={x:enemy.x,z:enemy.z};oldEnemies.set(enemy.id,old);
    enemy.x+=enemy.driftX*dt;enemy.z=arenaZ(s,arenaY(s,enemy.z)+enemy.driftY*dt);
    enemy.facing=arenaY(s,s.z)>arenaY(s,enemy.z)?1:-1;
    enemyMotions.set(enemy.id,wrap(s,enemy,old,`enemy-${enemy.id}`));
  }
  updateCombatReadiness(s,dt);hooks.settleDebts(s);if(s.phase!=='running')return;
  s.fireClock=Math.max(0,s.fireClock-dt);
  if(input.fire&&s.fireClock<=0){
    s.shots.push({x:s.x,z:arenaZ(s,arenaY(s,s.z)+25*s.facing),vx:0,vz:680*s.facing,payload:loadout(s).map(seed=>seed.type),bornAt:s.time});s.fireClock=.16;
  }
  for(const enemy of s.enemies){
    if(enemy.hp<=0||!combatReady(s,enemy))continue;
    enemy.clock-=dt;
    if(enemy.clock<=0){
      const dx=s.x-enemy.x,dy=arenaY(s,s.z)-arenaY(s,enemy.z),length=Math.hypot(dx,dy)||1;
      s.enemyShots.push({x:enemy.x,z:enemy.z,vx:dx/length*155,vz:dy/length*155,payload:loadout(enemy).map(seed=>seed.type),bornAt:s.time});
      enemy.clock=enemy.name==='Core'?1.5:2.3;
    }
    const motion=enemyMotions.get(enemy.id);
    if(pathsHit(shipMotion.segments,motion?.segments||still(s,enemy),32,KLEIN_BOUNDS))hooks.damage(s,'Ship contact. One hull point lost.');
  }
  for(const shot of s.shots){
    shot.bornAt??=s.time;
    const receiver=s.enemies.filter(e=>e.hp>0&&combatReady(s,e)&&e.facing*(arenaY(s,shot.z)-arenaY(s,e.z))>=0).sort((a,b)=>Math.abs(arenaY(s,a.z)-arenaY(s,shot.z))-Math.abs(arenaY(s,b.z)-arenaY(s,shot.z)))[0];
    const motion=processShot(s,shot,dt,receiver,receiver?oldEnemies.get(receiver.id)||receiver:null,receiver?.facing||-1,enemyMotions.get(receiver?.id)?.crossings.length);
    for(const enemy of s.enemies){
      if(enemy.hp<=0||!combatReady(s,enemy))continue;
      if(pathsHit(motion,enemyMotions.get(enemy.id)?.segments||still(s,enemy),26,KLEIN_BOUNDS)){hooks.impact(s,enemy,shot);shot.dead=true;break;}
    }
  }
  for(const shot of s.enemyShots){
    shot.bornAt??=s.time;
    const motion=processShot(s,shot,dt,s,oldShip,s.facing,shipMotion.crossings.length);
    if(pathsHit(motion,shipMotion.segments,18,KLEIN_BOUNDS)){hooks.impact(s,s,shot);shot.dead=true;}
  }
  s.shots=s.shots.filter(shot=>!shot.dead&&s.time-shot.bornAt<5);
  s.enemyShots=s.enemyShots.filter(shot=>!shot.dead&&s.time-shot.bornAt<7);
  hooks.collectDrops(s);
  if(s.phase==='running'&&s.enemies.every(enemy=>enemy.hp<=0)){
    hooks.settleDebts(s,true);
    if(s.phase==='running'){s.phase='won';s.lastEvent='The Klein Fleet is destroyed. Campaign complete.';s.events.push({time:s.time,type:'campaign-complete',chapter:s.campaign.index});}
  }
}
