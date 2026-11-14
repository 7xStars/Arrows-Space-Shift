/** Narrow technical safety diagnostic for authored Act II encounters.
 * This reports instantaneous safe *horizontal* lanes, not reachable player
 * trajectories, and does NOT certify an encounter as fair. No damage is taken
 * by the fixture so the entire window can be sampled consistently.
 */
import {createFlight,STEP} from '../src/simulation.js';
import {inCombatView,presentEnemy} from '../src/combat-view.js';
import {CHAPTERS,enterChapter,arenaY} from '../src/campaign.js';
import {activeShip} from '../src/fleet.js';
import {createFleetProfile} from '../src/fleet.js';
import {writeFileSync} from 'node:fs';

function inspect(index,shipId){
 const fleetProfile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module'],unlockedShips:[0,1,8,3],selectedShip:shipId});
 const s=createFlight('campaign',{seed:230700+index,shipId,fleetProfile});enterChapter(s,index);
 s.phase='running';s.invulnerable=Number.POSITIVE_INFINITY;
 let frames=0,maxShots=0,zeroLaneSamples=0,snapshots=0,lastWave='';
 const lanes=Array.from({length:15},(_,i)=>-330+i*(660/14));
 for(let n=0;n<16/STEP;n++){
   if(s.phase!=='running')break;
   // Imported below in the top-level scope, not via a hidden fixture mode.
   runTick(s,{},STEP);
   // The real renderer registers an enemy after it becomes visible.
   // This headless diagnostic must model that presentation, otherwise
   // the combat-readiness gate correctly suppresses *all* fire.
   if(n%4===0) for(const enemy of s.enemies) {
     if(inCombatView(s,enemy)) presentEnemy(s,enemy);
   }
   if(n%24!==0)continue;
   frames++;
   const y=arenaY(s,s.z),radius=activeShip(s).coreRadius+10;
   const close=s.enemyShots.filter(shot=>!shot.dead&&Math.abs(arenaY(s,shot.z)-y)<radius+34);
   maxShots=Math.max(maxShots,s.enemyShots.length);
   let valid=0;
   for(const lane of lanes){if(close.every(shot=>Math.abs(shot.x-lane)>radius+12))valid++;}
   if(valid===0)zeroLaneSamples++;
   snapshots++;
   lastWave=s.campaign?.currentWave?.id||lastWave;
 }
 return {index,stage:CHAPTERS[index].name,ship:activeShip(s).name,observedSeconds:Number(s.time.toFixed(2)),samples:snapshots,zeroLocalSafeLaneSamples:zeroLaneSamples,maxEnemyShots:maxShots,lastWave};
}
import {tick as runTick} from '../src/simulation.js';
const rows=[];
for(const index of [9,10,11,12,13,14,15,16])rows.push(inspect(index,0));
for(const index of [12,15])for(const shipId of [8,3])rows.push(inspect(index,shipId));
const report={scope:'Act II only; up to 16-second fixed-seed, stationary-player sampling (Arrow across eight stages; Needle and Aftwing in two stages)',limitations:'Instantaneous lane proxy; ignores vertical options, reachable path planning, player perception, and normal-health survival. Do not claim fairness based on this report.',rows};
const outfile=process.argv[2];if(outfile)writeFileSync(outfile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({scope:report.scope,observations:rows.length,anyNoLocalLane:rows.filter(r=>r.zeroLocalSafeLaneSamples>0),highestEnemyShots:Math.max(...rows.map(r=>r.maxEnemyShots))},null,2));
