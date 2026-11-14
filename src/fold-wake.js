import {advanceThroughSpace} from './space.js';
import {chapter,isScrollingLevel,isKleinSurfaceRoute,arenaZ,SCROLL_SPEED} from './campaign.js';
import {randomFor} from './random.js';

/**
 * A manual fold compresses the route and may expose one additional encounter.
 * This is encounter content, never a teleporting hit. The wave is authored by
 * seed, chapter, route quarter, and fold depth, and cannot be farmed by toggling.
 * Automatic Damaged Drive faults do not surprise-spawn extra hazards.
 */
export function revealFoldWake(s){
  if(s.phase!=='running'||!isScrollingLevel(s)||!s.campaign||!s.fields.length)return null;
  const c=chapter(s),distance=Math.max(0,s.cameraZ||0),progress=distance/Math.max(1,c.routeLength);
  if(progress>=.84)return null;
  // A lesson's intended recovery is a real recovery, even if the player folds.
  if(s.campaign.currentWave?.kind==='break'||c.breaks?.some(mark=>Math.abs(mark-progress)<.045))return null;
  const zone=Math.min(3,Math.floor(progress*4)),depth=Math.min(3,s.fields.length);
  const wakes=s.campaign.foldWakes ||= {keys:[],total:0,enemies:0,asteroids:0};
  const key=`${zone}:${depth}`;
  if(wakes.total>=3||wakes.keys.includes(key))return null;
  const random=randomFor(s.runSeed^0x464f4c44,s.campaign.index*113+zone*7+depth);
  const willBeCalm=Boolean(c.calm),popcornCount=willBeCalm?(depth>=2?1:0):depth===3?2:1;
  const asteroidCount=willBeCalm?Math.min(2,depth):depth>=2?1:0;
  const count=popcornCount+asteroidCount;
  if(!count)return null;
  // Each object emerges well above the upper-half player boundary. The danger
  // materializes ahead, marked and noncontacting during its brief entrance cue.
  const side=random()<.5?-1:1;
  const locations=Array.from({length:count},(_,i)=>{
    const x=side*(220+(i%2)*64)*(i%2?-1:1);
    const y=830+i*44;
    const z=isKleinSurfaceRoute(s)?arenaZ(s,y):advanceThroughSpace(s.cameraZ,y,s.fields);
    return {x,z};
  });
  for(let i=0;i<popcornCount;i++){
    const {x,z}=locations[i],id=++s.campaign.enemySerial;
    s.enemies.push({id,name:'Fold Echo',role:'popcorn',foldWake:true,wakeUntil:s.time+1.2,
      x,z,hp:1,maxHp:1,stage:s.stage,clock:2.6,firePeriod:3.1,shotSpeed:120,
      patternRole:'fan',patternCycle:0,patternConfig:{count:2,beats:1,recovery:2.5},
      equipped:[],dropsUpgrade:false,driftX:0,driftY:0,facing:-1,
      routeActive:isKleinSurfaceRoute(s),presented:false,visibleFor:0});
  }
  for(let i=0;i<asteroidCount;i++){
    const {x,z}=locations[popcornCount+i],id=`fold-rock-${s.campaign.index}-${zone}-${depth}-${i}`;
    s.asteroids.push({id,x,z,radius:20+random()*5,hp:2,maxHp:2,
      shape:Math.floor(random()*10000),rotation:random()*Math.PI*2,
      foldWake:true,wakeUntil:s.time+1.2,presented:false});
  }
  wakes.keys.push(key);wakes.total++;wakes.enemies+=popcornCount;wakes.asteroids+=asteroidCount;
  const result={zone,depth,enemies:popcornCount,asteroids:asteroidCount};
  s.events.push({time:s.time,type:'fold-wake',...result,x:locations[0].x,z:locations[0].z});
  return result;
}

/** Display-only open-space comparison: preserves the simulation clock. */
export function foldRoutePace(s){
  if(!isScrollingLevel(s)||!s.campaign)return null;
  const routeLength=chapter(s).routeLength,elapsed=Math.max(0,s.time-(s.campaign.startedAt??0));
  const progress=Math.min(routeLength,Math.max(0,s.cameraZ||0));
  const openDistance=Math.min(routeLength,elapsed*SCROLL_SPEED);
  return {progress,routeLength,elapsed,openDistance,
    leadSeconds:Math.max(0,(progress-openDistance)/SCROLL_SPEED)};
}
