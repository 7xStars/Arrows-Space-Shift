import { advanceThroughSpace, advanceProjectile, foldDepthAt, metricAt, spaceDistance } from './space.js';
import {makeDrop,collectDrop,warpIncoming,warpSide} from './upgrades.js';
export const ROUTE_LENGTH = 8400;
export const BASE_THRUST = 90;
export const X_LIMIT = 350;
export const STEP = 1 / 120;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const ENCOUNTERS = Object.freeze([
  {name:'Hit the opening',brief:'The target opens briefly. Fold to make your shot arrive before it closes.',goal:'Hit the target while its shield is open.',opens:0.55,closes:1.2,limit:1.6},
  {name:'Make room to escape',brief:'You start inside a fold. A wide salvo is coming. Unfold, then steer beyond its edge.',goal:'Avoid the salvo without losing hull.',limit:4},
  {name:'Hit, then escape',brief:'The target opens briefly. A hit triggers guard fire at your current lane. Hit the target and avoid the salvo.',goal:'Hit the target and avoid the guard salvo.',opens:0.55,closes:1.2,limit:5},
]);

export function createFlight(mode = 'flight', options = {}) {
  const s = {
    mode, phase: 'ready', x: 0, z: 0, time: 0, hull: 5, invulnerable: 0,
    bonusEnabled: options.bonusEnabled ?? true, maxFolds: ['timing','upgrades','warp-lab'].includes(mode) ? 1 : 3,
    drops:[],dropSerial:0,upgradeSerial:0,upgrade:null,warpCount:0,labWave:0,
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
    countdown: mode==='timing'?2:0,
  };
  if(mode==='upgrades'){
    s.enemies[0].x=0;s.enemies[0].z=450;s.enemies[0].hp=1;s.enemies[0].clock=2.5;
    s.enemies.forEach((enemy,i)=>{enemy.dropsUpgrade=i%3===0;});
  }
  if(mode==='warp-lab'){
    s.enemies=[];s.gates=[];s.countdown=2;
    makeDrop(s,0,120,'lab-seed');
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
  return s;
}

export function recordEvent(s, type, data = {}) {
  s.events.push({time:s.time,type,...data});
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

function damage(s, reason) {
  if (s.invulnerable > 0 || s.phase !== 'running') return;
  s.hull--;
  s.invulnerable = 1.4;
  s.lastEvent = reason;
  recordEvent(s,'damage',{reason,hull:s.hull});
  if (s.hull <= 0) { s.phase = 'lost'; s.lastEvent = 'Hull lost. Restart the flight.'; }
}

export function tick(s, input, dt = STEP) {
  if (s.phase !== 'running') return;
  if(s.countdown>0){s.countdown=Math.max(0,s.countdown-dt);return;}
  const oldZ = s.z, oldX = s.x;
  s.time += dt;
  s.invulnerable = Math.max(0, s.invulnerable - dt);
  s.x = clamp(s.x + (input.horizontal || 0) * 300 * dt, -X_LIMIT, X_LIMIT);
  s.thrust = BASE_THRUST * (1 + (input.throttle || 0) * 0.4);
  s.z = advanceThroughSpace(s.z, s.thrust * dt, s.fields);
  if(s.mode==='warp-lab' && s.time>=3+s.labWave*2){
    const offset=s.labWave%2? -90:90;
    s.enemyShots.push({x:s.x+offset,z:advanceThroughSpace(s.z,230,s.fields),vx:0});s.labWave++;
  }
  s.fireClock = Math.max(0, s.fireClock - dt);
  if (input.fire && s.fireClock <= 0) {
    s.shots.push({ x: s.x, z: s.z + 25 });
    s.fireClock = 0.16;
    if(s.encounter)recordEvent(s,'fire',{x:s.x,z:s.z});
  }
  for (const shot of s.shots) {
    const before = shot.z;
    shot.z = advanceProjectile(shot.z, 680 * dt, s.fields);
    for (const enemy of s.enemies) {
      if (enemy.hp <= 0 || enemy.escaped) continue;
      if (segmentNear(shot.x - enemy.x, spaceDistance(enemy.z, before, s.fields), shot.x - enemy.x, spaceDistance(enemy.z, shot.z, s.fields), 26)) {
        if(enemy.shield && !targetOpen(s)) {
          shot.dead=true;
          recordEvent(s,'shield-block',{target:enemy.id});
          break;
        }
        enemy.hp--; shot.dead = true;
        if (enemy.hp <= 0) {
          const bonus = s.bonusEnabled ? 50 * foldDepthAt(enemy.z, s.fields) : 0;
          s.foldBonus += bonus; s.score += 100 + bonus; s.kills++;
          s.lastEvent = bonus ? `Enemy destroyed. +100 points. Fold bonus: +${bonus}.` : 'Enemy destroyed. +100 points.';
          recordEvent(s,'target-hit',{target:enemy.id,bonus});
          if(enemy.dropsUpgrade)makeDrop(s,enemy.x,enemy.z,`enemy-${enemy.id}`);
          if(s.encounter) {
            s.encounter.hit=true;
            if(s.encounterIndex===2) {
              launchSalvo(s,360);
              s.lastEvent='Target hit. Guard salvo launched at your lane.';
            }
          }
        }
        break;
      }
    }
  }
  for (const enemy of s.enemies) {
    if (enemy.hp <= 0 || enemy.escaped) continue;
    const distance = spaceDistance(s.z, enemy.z, s.fields);
    if (distance < -80) { enemy.escaped = true; continue; }
    if (!enemy.shield && distance < 920 && distance > 110) {
      enemy.clock -= dt;
      if (enemy.clock <= 0) {
        s.enemyShots.push({x: enemy.x, z: enemy.z - 20,
          vx: clamp((s.x - enemy.x) * 0.22, -90, 90)});
        enemy.clock = 2.3 + (enemy.id % 3) * 0.2;
      }
    }
    if (segmentNear(enemy.x - oldX, spaceDistance(oldZ, enemy.z, s.fields), enemy.x - s.x, spaceDistance(s.z, enemy.z, s.fields), 35)) {
      damage(s, 'Ship contact. One hull point lost.'); enemy.escaped = true;
    }
  }
  for(const drop of s.drops){
    if(!drop.collected && segmentNear(oldX-drop.x,spaceDistance(drop.z,oldZ,s.fields),s.x-drop.x,spaceDistance(drop.z,s.z,s.fields),28))collectDrop(s,drop);
  }
  for (const shot of s.enemyShots) {
    const px = shot.x, pz = shot.z;
    shot.z = advanceProjectile(shot.z, -145 * dt, s.fields);
    shot.x += shot.vx * Math.abs(spaceDistance(pz, shot.z, s.fields)) / 145;
    const warpedMotion=warpIncoming(s,shot,{x:px,z:pz},{x:oldX,z:oldZ},dt);
    const halfWidth=shot.halfWidth || 0;
    const edge = x => Math.sign(x) * Math.max(0,Math.abs(x)-halfWidth);
    const paths=warpedMotion || [{from:{x:px,z:pz},to:shot,shipFrom:{x:oldX,z:oldZ},shipTo:s}];
    if (paths.some(p=>segmentNear(edge(p.from.x-p.shipFrom.x),spaceDistance(p.shipFrom.z,p.from.z,s.fields),edge(p.to.x-p.shipTo.x),spaceDistance(p.shipTo.z,p.to.z,s.fields),18))) {
      shot.dead = true; damage(s, 'Shot impact. One hull point lost.');
    }
  }
  if(s.encounter && s.phase==='running') {
    if(s.hull<5)endEncounter(s,false,s.encounterIndex===2?'Salvo impact. Consider how the field changes the escape interval.':'Salvo impact. Unfold earlier, then steer clear of the marked band.');
    else if(s.encounterIndex===0 && s.encounter.hit)endEncounter(s,true,'Target hit during its opening.');
    else if(s.encounterIndex!==1 && !s.encounter.hit && s.time>=s.encounter.closes)
      endEncounter(s,false,'Target closed before the hit. Fold earlier and fire into the opening.');
    else if(s.encounter.salvoLaunched && s.enemyShots.every(b=>!b.salvo || b.z<s.z-40))
      endEncounter(s,true,s.encounterIndex===1?'Salvo avoided. Unfolding created escape time.':'Target hit and salvo avoided.');
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
  s.shots = s.shots.filter(b => !b.dead && b.z < s.z + 4200);
  s.enemyShots = s.enemyShots.filter(b => !b.dead && b.z > s.z - 100 && Math.abs(b.x) < 600);
  s.drops=s.drops.filter(d=>!d.collected && d.z>s.z-100);
  if (!s.encounter && s.phase === 'running' && s.z >= ROUTE_LENGTH) {
    s.z = ROUTE_LENGTH; s.phase = 'won'; s.lastEvent = 'Transit complete.';
  }
}

export function readFlight(s) {
  return { phase: s.phase, mode: s.mode, x: s.x, z: s.z, time: s.time,
    hull: s.hull, score: s.score, foldBonus: s.foldBonus, countdown:s.countdown,bonusEnabled:s.bonusEnabled,maxFolds:s.maxFolds,
    encounterIndex:s.encounterIndex ?? null,encounter:s.encounter?{...s.encounter,open:targetOpen(s)}:null,
    events:s.events.map(e=>({...e})),fields: s.fields.map(f=>({...f})),
    localFactor: 1 / metricAt(s.z, s.fields), thrust: s.thrust,
    shotCount: s.shots.length, enemyShotCount: s.enemyShots.length,
    foldsUsed: s.foldsUsed, lastEvent: s.lastEvent,upgrade:s.upgrade?{...s.upgrade}:null,warpSide:warpSide(s),warpCount:s.warpCount,
    drops:s.drops.map(d=>({...d,previewImprint:s.fields.length?-1:1})),
    projectiles: {player:s.shots.map(b=>({...b, distance:spaceDistance(s.z,b.z,s.fields), speedFactor:1/metricAt(b.z,s.fields)})),
      enemy:s.enemyShots.map(b=>({...b, distance:spaceDistance(s.z,b.z,s.fields), speedFactor:1/metricAt(b.z,s.fields)}))} };
}
