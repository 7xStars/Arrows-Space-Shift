import { advanceThroughSpace, advanceProjectile, foldDepthAt, metricAt, spaceDistance } from './space.js';
export const ROUTE_LENGTH = 8400;
export const BASE_THRUST = 90;
export const X_LIMIT = 350;
export const STEP = 1 / 120;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function createFlight(mode = 'flight') {
  return {
    mode, phase: 'ready', x: 0, z: 0, time: 0, hull: 5, invulnerable: 0,
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
  };
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
  if (s.hull <= 0) { s.phase = 'lost'; s.lastEvent = 'Hull lost. Restart the flight.'; }
}

export function tick(s, input, dt = STEP) {
  if (s.phase !== 'running') return;
  const oldZ = s.z, oldX = s.x;
  s.time += dt;
  s.invulnerable = Math.max(0, s.invulnerable - dt);
  s.x = clamp(s.x + (input.horizontal || 0) * 300 * dt, -X_LIMIT, X_LIMIT);
  s.thrust = BASE_THRUST * (1 + (input.throttle || 0) * 0.4);
  s.z = advanceThroughSpace(s.z, s.thrust * dt, s.fields);
  s.fireClock = Math.max(0, s.fireClock - dt);
  if (input.fire && s.fireClock <= 0) {
    s.shots.push({ x: s.x, z: s.z + 25 });
    s.fireClock = 0.16;
  }
  for (const shot of s.shots) {
    const before = shot.z;
    shot.z = advanceProjectile(shot.z, 680 * dt, s.fields);
    for (const enemy of s.enemies) {
      if (enemy.hp <= 0 || enemy.escaped) continue;
      if (segmentNear(shot.x - enemy.x, spaceDistance(enemy.z, before, s.fields), shot.x - enemy.x, spaceDistance(enemy.z, shot.z, s.fields), 26)) {
        enemy.hp--; shot.dead = true;
        if (enemy.hp <= 0) {
          const bonus = 50 * foldDepthAt(enemy.z, s.fields);
          s.foldBonus += bonus; s.score += 100 + bonus; s.kills++;
          s.lastEvent = bonus ? `Enemy destroyed. +100 points. Fold bonus: +${bonus}.` : 'Enemy destroyed. +100 points.';
        }
        break;
      }
    }
  }
  for (const enemy of s.enemies) {
    if (enemy.hp <= 0 || enemy.escaped) continue;
    const distance = spaceDistance(s.z, enemy.z, s.fields);
    if (distance < -80) { enemy.escaped = true; continue; }
    if (distance < 920 && distance > 110) {
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
  for (const shot of s.enemyShots) {
    const px = shot.x, pz = shot.z;
    shot.z = advanceProjectile(shot.z, -145 * dt, s.fields);
    shot.x += shot.vx * Math.abs(spaceDistance(pz, shot.z, s.fields)) / 145;
    if (segmentNear(px - oldX, spaceDistance(oldZ, pz, s.fields), shot.x - s.x, spaceDistance(s.z, shot.z, s.fields), 18)) {
      shot.dead = true; damage(s, 'Shot impact. One hull point lost.');
    }
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
  if (s.phase === 'running' && s.z >= ROUTE_LENGTH) {
    s.z = ROUTE_LENGTH; s.phase = 'won'; s.lastEvent = 'Transit complete.';
  }
}

export function readFlight(s) {
  return { phase: s.phase, mode: s.mode, x: s.x, z: s.z, time: s.time,
    hull: s.hull, score: s.score, foldBonus: s.foldBonus, fields: s.fields.map(f=>({...f})),
    localFactor: 1 / metricAt(s.z, s.fields), thrust: s.thrust,
    shotCount: s.shots.length, enemyShotCount: s.enemyShots.length,
    foldsUsed: s.foldsUsed, lastEvent: s.lastEvent,
    projectiles: {player:s.shots.map(b=>({...b, distance:spaceDistance(s.z,b.z,s.fields), speedFactor:1/metricAt(b.z,s.fields)})),
      enemy:s.enemyShots.map(b=>({...b, distance:spaceDistance(s.z,b.z,s.fields), speedFactor:1/metricAt(b.z,s.fields)}))} };
}
