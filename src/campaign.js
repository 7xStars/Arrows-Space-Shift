import {OPERATIONS,roster,loadout} from './upgrades.js';
import {advanceThroughSpace,spaceDistance,addFold} from './space.js';
import {randomFor} from './random.js';
import {traceKlein,traceProjectiveSurface,KLEIN_BOUNDS} from './klein.js';
import {createEcologyState,queueEvolution} from './ecology.js';
import {compileWaveScript,waveScriptFor} from './waves.js';
import {BUILD} from './build.js';

export const CHAPTERS=Object.freeze([
  {kind:'level',number:1,name:'Two Sides',stage:0,routeLength:3600,carriers:12,goal:'Fight through the carriers and reach the end of the route.',hint:'Left Shift folds the route. Right Shift unfolds it. Watch the grid and the accepted side, then meet the carriers.',waves:[[0,0],[0,0]]},
  {kind:'level',number:2,name:'Quiet Belt',stage:0,calm:true,routeLength:2400,carriers:3,asteroids:14,goal:'Reach the exit through a quiet asteroid belt.',hint:'Break or avoid asteroids. Enemy shots can break them too. Watch for an occasional carrier.',waves:[[0,0]]},
  {kind:'level',number:3,name:'Counter Cycle',stage:1,routeLength:4200,carriers:15,goal:'Reach the route end while fighting the three-operation carriers.',hint:'Position Warp counters Vector Lens. Vector Lens counters Impact Buffer. Impact Buffer counters Position Warp.',waves:[[0,1,3],[3,0,1]]},
  {kind:'level',number:4,name:'Loose Stones',stage:1,calm:true,routeLength:2800,carriers:3,asteroids:16,goal:'Reach the exit among asteroids and scattered carriers.',hint:'Use the three-operation set with less incoming fire. Rocks can block shots from either side.',waves:[[0,1,3]]},
  {kind:'level',number:5,name:'Seven Operations',stage:2,routeLength:4800,carriers:18,goal:'Reach the route end. Use two slots against seven-operation carriers.',hint:'A common counter can pass both opposing operations. Slot 1 acts before Slot 2.',waves:[[0,1,3],[2,4],[5,6]]},
  {kind:'level',number:6,name:'Drift Field',stage:2,calm:true,routeLength:3200,carriers:4,asteroids:18,goal:'Reach the exit through the drift field.',hint:'Try different equipment orders among breakable rocks and occasional enemies. Hull damage remains active.',waves:[[0,1,3,2,4,5,6]]},
  {kind:'level',number:7,name:'Front and Back',stage:2,routeLength:5400,carriers:21,goal:'Read the carrier volleys and reach the route end.',hint:'FAN repeats. SWEEP turns across three beats. GAP moves an opening. The warning fixes the attack. Carriers return through the Klein joins.',waves:[[0,1,3],[2,4,6]],moving:true,klein:true},
  {kind:'level',number:8,name:'Last Approach',stage:2,calm:true,routeLength:3600,carriers:4,asteroids:20,goal:'Reach the final battle through the last asteroid belt.',hint:'Use the quieter route to prepare your equipment. Asteroids and occasional carriers still cause hull damage.',waves:[[0,1,3,2,4,5,6]],moving:true},
  {kind:'boss',act:1,name:'The Klein Fleet',stage:2,intro:'The Klein Drive has been engaged. Now entering the Alice Universe',goal:'Destroy the fleet. Collect the drive part, then cross the exit.',hint:'FAN, SWEEP, GAP. Read the warning and the return. Ships and shots use the Klein joins. Hold Space to fire forward. Right Shift unfolds space.'},
  {kind:'level',act:2,actStage:1,number:9,name:'Return Flight',stage:2,routeLength:3900,carriers:7,goal:'Learn to inhabit the Klein surface. Compare familiar attacks before and after the surface begins to matter.',hint:'The Klein Relay is active. Left and Right steer through the side joins. The route keeps scrolling.',waves:[[0,1,3]],moving:true,kleinSurface:true,lesson:'surface',patternPlan:['fan','fan','gap','fan','sweep','gap','fan'],lanePlan:[0,-180,180,0,-300,300,0],breaks:[.29,.6,.82],lessonNotices:[{at:0,text:'Klein Relay active. First, read the same familiar FAN you already know.'},{at:.2,text:'The ship, enemies, bullets, and pickups now share the Klein surface.'},{at:.34,text:'Break: use the quiet space to cross a side seam deliberately.'},{at:.48,text:'Compare the next familiar pattern with its position on the joined surface.'},{at:.66,text:'Break: return to a comfortable lane before the next pattern.'},{at:.84,text:'Final check: use the surface without abandoning ordinary shmup reading.'}]},
  {kind:'level',act:2,actStage:2,number:10,name:'Intentional Crossing',stage:2,routeLength:4200,carriers:9,goal:'Use the side joins as a movement tool, not just an escape accident.',hint:'A seam can be the shortest safe route. Read the formation, then choose the surface path.',waves:[[0,1,3],[2,4]],moving:true,kleinSurface:true,lesson:'seam',patternPlan:['fan','wall','fan','gap','wall','fan','gap','wall','sweep'],lanePlan:[0,-315,315,0,300,-300,0,315,-315],breaks:[.27,.57,.81],lessonNotices:[{at:0,text:'Intentional Crossing: the seam is now part of your movement vocabulary.'},{at:.17,text:'A WALL is coming. The local gap is tight; the side seam gives you another route.'},{at:.32,text:'Break: cross once on purpose, then watch where the screen representation returns you.'},{at:.46,text:'Do not chase the empty screen. Choose the safest path on the whole surface.'},{at:.62,text:'Break: light formation only. Reset your position.'},{at:.74,text:'Use the seam before the WALL closes your local lane.'},{at:.85,text:'Final crossing: combine ordinary dodging with a deliberate surface shortcut.'}]},
  {kind:'level',act:2,actStage:3,number:11,name:'Returning Fire',stage:2,routeLength:4400,carriers:11,goal:'Track familiar attacks after they cross the Klein joins.',hint:'The grammar is unchanged. What changes is where the same shot returns.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,lesson:'return',patternPlan:['fan','return','gap','return','sweep','return','fan','return','gap','return','sweep'],lanePlan:[0,-260,210,300,-300,0,250,-250,0,310,-310],breaks:[.24,.51,.77],lessonNotices:[{at:0,text:'Returning Fire: first read the ordinary pattern.'},{at:.14,text:'RETURN uses the same grammar but sends outer trajectories through the side join.'},{at:.29,text:'Break: old bullets may still return. Read the surface before moving into empty space.'},{at:.4,text:'GAP + RETURN: the visible opening is only part of the answer.'},{at:.56,text:'Break: no new rule. Let the previous return clear.'},{at:.66,text:'SWEEP + RETURN: track the committed pattern beyond the visible edge.'},{at:.82,text:'Final check: predict the return before the projectile leaves the screen.'}]},
  {kind:'level',act:2,actStage:4,number:12,name:'Seam Gap',stage:2,routeLength:4500,carriers:15,waveScript:'seam-gap',goal:'Find the safe opening on the whole Klein surface.',hint:'A local gap can close when an older volley returns. Read the surface, not only the screen.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,lesson:'global-gap',patternPlan:['gap','fan','gap','return','gap','wall','gap','return','sweep','gap','return','gap','wall'],breaks:[.22,.48,.72]},
  {kind:'level',act:2,actStage:5,number:13,name:'Cross Current',stage:2,routeLength:4800,carriers:18,waveScript:'cross-current',goal:'Read two familiar pattern families at once.',hint:'Pattern layering begins here. FAN, SWEEP, GAP and RETURN remain the same grammar.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,lesson:'layer',patternPlan:['fan','sweep','gap','fan','return','sweep','gap','wall','fan','return','sweep','gap','return','wall','fan'],breaks:[.2,.44,.68,.84]},
  {kind:'level',act:2,actStage:6,number:14,name:'Fold Timing',stage:2,routeLength:4700,carriers:7,waveScript:'fold-timing',goal:'Use folds to change when an already-understood pattern arrives.',hint:'Geometry tells you where. Fold depth changes when. Density drops while timing complexity rises.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,lesson:'timing',patternPlan:['fan','return','gap','sweep','return','gap','fan','return','sweep','gap','return','fan','gap'],breaks:[.26,.53,.8]},
  {kind:'level',act:2,actStage:7,number:15,name:'Pressure Field',stage:2,routeLength:5200,carriers:23,waveScript:'pressure-field',maxConcurrentWarnings:3,goal:'Survive the established grammar at true bullet-hell density.',hint:'No new topology rule. Density, overlap and enemy count rise while the geometry stays familiar.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,lesson:'density',pressure:true,patternPlan:['fan','gap','sweep','wall','fan','return','gap','sweep','fan','wall','return','gap','fan','sweep','wall','return','gap','fan','sweep','return'],breaks:[.18,.4,.63,.82]},
  {kind:'level',act:2,actStage:8,number:16,name:'Klein Mastery',stage:2,routeLength:5600,carriers:19,waveScript:'klein-mastery',maxConcurrentWarnings:3,tailQuiet:.14,goal:'Combine seam travel, returning fire, folds and layered bullet fields.',hint:'Nothing here is new. Use the entire Klein vocabulary, then reach the quiet approach.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,lesson:'mastery',pressure:true,patternPlan:['fan','return','gap','sweep','wall','return','gap','fan','sweep','return','wall','gap','fan','return','sweep','gap','wall','return','fan','sweep','gap','return'],breaks:[.2,.43,.66,.86]},
  {kind:'boss',act:2,hybrid:true,name:'The Projective Intrusion',stage:2,intro:'Projective identification detected. Klein and projective rules are overlapping.',goal:'Survive the hybrid geometry. Destroy the intrusion, recover the Projective Module, and extract.',hint:'The attack grammar is unchanged. Watch which boundary rule each return uses.'},
  // Act III — traditional projective traversal → bullet hell → constructive bullet heaven.
  {kind:'level',act:3,actStage:1,number:17,name:'Projective Chart',stage:2,routeLength:3900,carriers:12,waveScript:'projective-chart',goal:'Learn the Projective Module’s antipodal boundary and keep the forward gun.',hint:'Left and Right steer. Side and longitudinal joins have different return directions.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,projectiveSurface:true,lesson:'projective',breaks:[.22,.49,.74]},
  {kind:'level',act:3,actStage:2,number:18,name:'Echo Capture',stage:2,routeLength:4200,carriers:12,waveScript:'echo-capture',goal:'Press C near a hostile projectile to turn danger into a stored echo.',hint:'Capture is deliberate, limited by range and cooldown; do not treat it as invulnerability.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,projectiveSurface:true,lesson:'capture',breaks:[.22,.49,.74]},
  {kind:'level',act:3,actStage:3,number:19,name:'Echo Release',stage:2,routeLength:4400,carriers:13,waveScript:'echo-release',goal:'Press E to spend stored echoes as forward shots while continuing to fire with Space.',hint:'Capture, choose your firing lane, then release. Power comes from the field you survived.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,projectiveSurface:true,lesson:'release',breaks:[.22,.49,.74]},
  {kind:'level',act:3,actStage:4,number:20,name:'Ordered Synthesis',stage:2,routeLength:4600,carriers:14,waveScript:'ordered-synthesis',goal:'Combine echo release with the seven established ordered operations.',hint:'Slot order remains consequential. The Projective Module gives an extra interaction, not a replacement gun.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,projectiveSurface:true,lesson:'synthesis',breaks:[.22,.49,.74]},
  {kind:'level',act:3,actStage:5,number:21,name:'Stellar Harvest',stage:2,routeLength:5000,carriers:18,waveScript:'stellar-harvest',goal:'Harvest projectiles from dense but readable enemy populations.',hint:'More enemies supply more danger and more possible power. Capture requires positioning.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,projectiveSurface:true,lesson:'harvest',pressure:true,breaks:[.22,.49,.74]},
  {kind:'level',act:3,actStage:6,number:22,name:'Antipodal Storm',stage:2,routeLength:5100,carriers:17,waveScript:'antipodal-storm',goal:'Read returning patterns, grow a build, and keep the player collision core visible.',hint:'The attack grammar is unchanged; now its projective return can be converted into strength.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,projectiveSurface:true,lesson:'storm',pressure:true,breaks:[.22,.49,.74]},
  {kind:'level',act:3,actStage:7,number:23,name:'Power Without Passivity',stage:2,routeLength:5300,carriers:19,waveScript:'power-without-passivity',goal:'Manage a growing build without losing meaningful manual control.',hint:'Orbitals spend stored echoes. Ward uses two echoes. Capture and release still require judgment.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,projectiveSurface:true,lesson:'agency',pressure:true,breaks:[.22,.49,.74]},
  {kind:'level',act:3,actStage:8,number:24,name:'Projective Mastery',stage:2,routeLength:5600,carriers:21,waveScript:'projective-mastery',tailQuiet:.12,goal:'Complete the full learn → capture → build → release loop.',hint:'Nothing new: shoot, dodge, use identifications, transform threats, build power, and choose when to spend it.',waves:[[0,1,3],[2,4,6]],moving:true,kleinSurface:true,projectiveSurface:true,lesson:'mastery',pressure:true,breaks:[.22,.49,.74]},
  {kind:'boss',act:3,projectiveBoss:true,name:'The Curvature Gate',stage:2,intro:'A hyperbolic anomaly detected beyond the projective chart.',goal:'Defeat the gate, collect its Curvature Seed, and extract.',hint:'Your projective echo abilities remain active. The curvature cues are a gameplay prototype, not a completed hyperbolic double-torus metric.'},
]);
export const TUTORIAL=Object.freeze({kind:'tutorial',number:0,name:'Flight controls',stage:0,goal:'Destroy the training enemy. Fold distance to attack faster.',hint:'Left / Right steer. Hold Space. Left Shift folds; Right Shift unfolds. Both sides’ shots accelerate in folded space.'});
export const isCampaign=s=>s.mode==='campaign';
export const isTutorial=s=>isCampaign(s)&&s.campaign?.index===-1;
export const chapter=s=>isTutorial(s)?TUTORIAL:CHAPTERS[s.campaign?.index||0];
export const isBoss=s=>isCampaign(s)&&chapter(s).kind==='boss';
export const isScrollingLevel=s=>isCampaign(s)&&chapter(s).kind==='level';
export const isKleinRoute=s=>isScrollingLevel(s)&&Boolean(chapter(s).klein);
// Retained API name for backwards compatibility: includes the later projective chart.
export const isKleinSurfaceRoute=s=>isScrollingLevel(s)&&Boolean(chapter(s).kleinSurface);
export const isProjectiveSurfaceRoute=s=>isKleinSurfaceRoute(s)&&Boolean(chapter(s).projectiveSurface);
export const isProjectiveBoss=s=>isBoss(s)&&Boolean(chapter(s).projectiveBoss);
export const surfaceTrace=(s,p,dx,dy)=>isProjectiveSurfaceRoute(s)||isProjectiveBoss(s)?traceProjectiveSurface(p,dx,dy):traceKlein(p,dx,dy);
export const isHybridBoss=s=>isBoss(s)&&Boolean(chapter(s).hybrid);
/** A new join must be announced before it can change the player's physics.
 * The Antipodal Anchor alone demonstrates the projective rule in phase 2.
 */
export const hybridProjectiveActive=s=>isHybridBoss(s)&&
  (s.campaign?.hybridPhase||1)>=3&&s.time>=(s.campaign?.hybridJoinReadyAt??s.campaign?.phaseBreakUntil??0);
export const isActTwo=s=>isCampaign(s)&&Number(chapter(s).act)===2;
export const SCROLL_SPEED=90;
export const ACT_TWO_START_INDEX=9;
export const ACT_TWO_BOSS_INDEX=17;
export const ACT_THREE_START_INDEX=18;
export const ACT_THREE_BOSS_INDEX=26;
// A boss reward advances the *same campaign*, not a new flight from Level 0.
// Act III uses the saved bridge to the separate Bolza runtime.
// It does not continue through this main-runtime chapter index map.
export const BOSS_CONTINUATIONS=Object.freeze({8:ACT_TWO_START_INDEX,17:ACT_THREE_START_INDEX});
export function bossContinuationIndex(s){
  if(!isBoss(s)||s.practice||s.phase!=='won')return null;
  const next=BOSS_CONTINUATIONS[s.campaign.index];
  if(next===undefined||next>BUILD.maxChapterIndex||!CHAPTERS[next])return null;
  if(s.campaign.index===8&&!s.fleetProfile?.fleetUnlocked)return null;
  if(s.campaign.index===17&&!s.fleetProfile?.projectiveModule)return null;
  return next;
}
export function continueAfterBoss(s,shipId=s.shipId){
  const destination=bossContinuationIndex(s);
  if(destination===null)return false;
  if(s.fleetProfile?.unlockedShips?.includes(shipId))s.shipId=shipId;
  const from=s.campaign.index;
  enterChapter(s,destination);
  s.events.push({time:s.time,type:'act-transition',from,to:destination,shipId:s.shipId});
  return true;
}
export function pressureBudget(c){
  if(!c||c.kind!=='level')return null;
  const density=Math.max(.5,(c.carriers||0)/10),speed=c.pressure?1.25:c.kleinSurface?1.05:1;
  const overlap=c.pressure?1.35:c.lesson==='layer'||c.lesson==='mastery'?1.2:1;
  const targeting=c.lesson==='global-gap'||c.lesson==='mastery'?1.25:1;
  const geometry=c.kleinSurface?(c.lesson==='surface'?1.1:c.lesson==='return'||c.lesson==='timing'?1.35:c.lesson==='mastery'?1.5:1.2):1;
  return Object.freeze({density,speed,overlap,targeting,geometry,total:Number((density*speed*overlap*targeting*geometry).toFixed(2))});
}
// Credit one meaningful geometry interaction per authored wave (or route
// segment). Repeatedly shuttling across one seam or toggling the same fold
// can never accumulate unlimited grade credit. Raw action counts are still
// recorded for diagnostics, separate from these scoring credits.
function spatialCreditWindow(s){
  const c=chapter(s),progress=Math.max(0,Math.min(.9999,(s.cameraZ||0)/Math.max(1,c.routeLength||1)));
  return c.waveScript&&s.campaign?.currentWave?.kind==='combat'
    ?`wave:${s.campaign.currentWave.id}`:`segment:${Math.floor(progress*8)}`;
}
function spatialThreatPresent(s){
  return s.enemyShots?.length>0||s.enemies?.some(e=>e.hp>0&&e.waveActive!==false&&Boolean(e.telegraph));
}
export function creditSeamTraversal(s,crossings=[]){
  if(!isKleinSurfaceRoute(s)||!crossings.some(x=>x.edge==='left'||x.edge==='right'))return false;
  const c=chapter(s);
  if(!['surface','seam'].includes(c.lesson)&&!spatialThreatPresent(s))return false;
  if(s.campaign?.currentWave?.kind==='break'&&!['surface','seam'].includes(c.lesson))return false;
  const seen=s.campaign.seamCreditWindows ||= [];const window=spatialCreditWindow(s);
  if(seen.includes(window))return false;
  seen.push(window);s.campaign.metrics.seamEvidence=(s.campaign.metrics.seamEvidence||0)+1;
  s.events.push({time:s.time,type:'seam-credit',window,lesson:c.lesson});
  return true;
}
export function creditFoldDecision(s,automatic=false){
  if(automatic||!isKleinSurfaceRoute(s))return false;
  const c=chapter(s);if(!['timing','mastery'].includes(c.lesson)||!spatialThreatPresent(s)||s.campaign?.currentWave?.kind==='break')return false;
  const seen=s.campaign.foldCreditWindows ||= [];const window=spatialCreditWindow(s);
  if(seen.includes(window))return false;
  seen.push(window);s.campaign.metrics.foldEvidence=(s.campaign.metrics.foldEvidence||0)+1;
  s.events.push({time:s.time,type:'fold-credit',window,lesson:c.lesson});
  return true;
}

export function calculateSpeedGrade(s,c=chapter(s)){
  if(c.kind!=='level'||!(c.routeLength>0))return null;
  const elapsed=Math.max(0,s.time-(s.campaign?.startedAt??s.time)),reference=c.routeLength/SCROLL_SPEED;
  const score=Math.round(100*Math.max(0,Math.min(1,(1-elapsed/reference)/.7)));
  const letter=score>=92?'S':score>=82?'A':score>=70?'B':score>=55?'C':score>=40?'D':'E';
  return Object.freeze({letter,score,bonus:score*10,elapsed,reference});
}

export function calculateStageGrade(s,c=chapter(s)){
  const metrics=s.campaign?.metrics||{},totalEnemies=Math.max(1,s.enemies?.length||0);
  const survival=Math.max(0,Math.round(40*Math.max(0,s.hull)/5));
  const execution=Math.round(20*Math.min(1,(s.campaign?.defeated||0)/totalEnemies));
  const precision=Math.min(15,Math.round((metrics.grazes||0)*2.5));
  const topologyTarget=c.lesson==='surface'||c.lesson==='seam'?2:c.lesson==='return'||c.lesson==='global-gap'?3:c.lesson==='mastery'?4:1;
  const topology=c.kleinSurface?Math.min(15,Math.round(15*(metrics.seamEvidence||0)/topologyTarget)):15;
  const controlTarget=c.lesson==='timing'||c.lesson==='mastery'?2:0;
  const control=controlTarget?Math.min(10,Math.round(10*(metrics.foldEvidence||0)/controlTarget)):10;
  const score=Math.max(0,Math.min(100,survival+execution+precision+topology+control));
  const letter=score>=92?'S':score>=82?'A':score>=70?'B':score>=55?'C':score>=40?'D':'E';
  return Object.freeze({letter,score,survival,execution,precision,topology,control,speed:calculateSpeedGrade(s,c),metrics:{...metrics}});
}

// Boss motion and collision stay in one canonical Klein chart. Its moving
// camera is only a choice of view, never a change to physical collision paths.
export const arenaY=(s,z)=>isKleinSurfaceRoute(s)
  ? (s.facing||1)*spaceDistance(s.surfaceViewZ||0,z,s.fields)
  : spaceDistance(isBoss(s)?0:s.cameraZ||0,z,s.fields);
export const arenaZ=(s,y)=>isKleinSurfaceRoute(s)
  ? advanceThroughSpace(s.surfaceViewZ||0,(s.facing||1)*y,s.fields)
  : advanceThroughSpace(isBoss(s)?0:s.cameraZ||0,y,s.fields);

function issueKit(s,stage){
  const ids=stage===0?[0]:roster(stage);
  for(const type of ids)for(const polarity of [1,-1]){
    const key=`${type}:${polarity}`;
    if(!s.inventory.some(seed=>seed.key===key))s.inventory.push({key,type,polarity,id:OPERATIONS[type].key,source:'training-kit',instance:++s.upgradeSerial});
  }
  if(!loadout(s).length)s.equipped[0]=s.inventory.find(seed=>seed.key==='0:1');
  s.upgrade=s.equipped[0]||s.equipped[1]||null;
}

function spawnRoute(s){
  const c=chapter(s),pattern=c.waves.flat(),random=randomFor(s.runSeed,s.campaign.index);
  const lanes=[0,-320,320,-160,160,-80,80],compiled=compileWaveScript(c,random);
  if(compiled){
    s.enemies=compiled.enemies.map((spec,i)=>{
      const type=pattern[i%pattern.length],polarity=i%2?-1:1,id=++s.campaign.enemySerial;
      const first=420,routeSpan=c.routeLength-first-100;
      const x=spec.lane,z=first+routeSpan*spec.progress*(1-(c.tailQuiet||0));
      const role=spec.role||'pattern-carrier',baseHp=role==='popcorn'?1:role==='anchor'?3:role==='miniboss'?6:1;
      const hp=spec.hp??baseHp,sign=i%2?1:-1;
      return {id,name:spec.name||`${role==='popcorn'?'Scout':role==='anchor'?'Anchor':role==='miniboss'?'Miniboss':'Carrier'} ${i+1}`,
        x,z,routeDepth:z,hp,maxHp:hp,role,waveId:spec.waveId,waveLabel:spec.waveLabel,waveKind:spec.waveKind,
        waveActive:false,activationAt:spec.activationAt,attackDelay:spec.attackDelay,clock:spec.attackDelay,
        firePeriod:spec.firePeriod??(role==='popcorn'?2.8:role==='anchor'?1.55:role==='miniboss'?1.2:(c.pressure?1.35:1.85))+i%3*.08,
        shotSpeed:spec.shotSpeed??(c.pressure?175:150),stage:c.stage,introduction:spec.introduction??Math.min(1,.4+i/9),
        patternRole:spec.pattern||'fan',patternCycle:0,patternConfig:spec.patternConfig||null,patternSequence:spec.patternSequence||null,
        geometryRule:spec.geometryRule||(c.projectiveSurface?'projective':'klein'),linkGroup:spec.linkGroup||null,
        equipped:[{type,polarity,key:`${type}:${polarity}`},{type:(type+3)%7,polarity,key:`${(type+3)%7}:${polarity}`}],
        dropsUpgrade:spec.dropsUpgrade!==false,driftX:spec.driftX??(c.moving?sign*(role==='popcorn'?70:45):0),
        driftY:spec.driftY??(c.moving?sign*(role==='popcorn'?42:30):0),facing:-1};
    });
    s.campaign.wavePlan=compiled.waves;s.campaign.waveIndex=-1;s.campaign.scriptedFolds=compiled.scriptedFolds;s.campaign.scriptedFoldIndex=0;
    s.campaign.lessonNotices=compiled.notices;
  }else{
    s.enemies=Array.from({length:c.carriers},(_,i)=>{
      const type=pattern[i%pattern.length],polarity=i%2?-1:1,id=++s.campaign.enemySerial;
      // Edge carriers make both outer lanes part of combat. Each depth still has open space.
      const lane=c.calm?(i===1?-320:i===2?320:random()*400-200):(c.lanePlan?.[i]??lanes[i%lanes.length]);
      const x=i===0&&!c.calm?0:Math.max(-330,Math.min(330,lane+(random()-.5)*(Math.abs(lane)>300?12:60)));
      const first=c.number===1?1450:c.klein?650:450;
      const progress=i/Math.max(1,c.carriers-1),ramp=c.klein?Math.min(1,i/8):0;
      const authoredProgress=(()=>{
        if(!c.breaks?.length)return progress;
        const half=.035,segments=[];let start=0;
        for(const center of c.breaks){const a=Math.max(start,center-half),b=Math.min(1,center+half);if(a>start)segments.push([start,a]);start=b;}
        if(start<1)segments.push([start,1]);
        const total=segments.reduce((n,[a,b])=>n+b-a,0),target=progress*total;let cursor=0;
        for(const [a,b] of segments){const len=b-a;if(target<=cursor+len||[a,b]===segments.at(-1))return a+(target-cursor);cursor+=len;}
        return progress;
      })();
      const z=c.calm?650+i*(c.routeLength-900)/(c.carriers-1)+(random()-.5)*80:
        first+(c.routeLength-first-80)*(c.klein?Math.pow(progress,.55):authoredProgress*(1-(c.tailQuiet||0)))+(i===0?0:(random()-.5)*30);
      const hp=c.calm?1:c.klein?1:c.kleinSurface?(c.pressure?2:1):2,sign=i%2?1:-1;
      const role=c.kleinSurface?(i===c.carriers-1&&c.actStage>=5?'miniboss':c.actStage>=5&&i>2&&i%6===0?'anchor':i%4===0?'popcorn':'pattern-carrier'):'carrier';
      const roleHp=role==='miniboss'?5:role==='anchor'?3:hp;
      return {id,x,z,...(c.kleinSurface?{routeDepth:z}:{}),hp:roleHp,maxHp:roleHp,role,
        clock:c.klein?1.8-1.2*ramp+i%3*.15:c.calm?2.8+random():1.4+i%3*.3,
        firePeriod:c.klein?2.3-1.4*ramp+i%3*.1:c.kleinSurface?((role==='popcorn'?2.8:role==='anchor'?1.55:role==='miniboss'?1.2:(c.pressure?1.35:1.85))+i%3*.12):c.calm?3.8+random():2.3+i%3*.2,
        shotSpeed:c.klein?145+65*ramp:c.kleinSurface?(c.pressure?175:150):145,stage:c.stage,introduction:c.kleinSurface?Math.min(1,.35+i/8):ramp,
        ...((c.klein||c.kleinSurface)?{patternRole:role==='miniboss'?'cycle':c.patternPlan?.[i]||(i<3?'fan':i<6?'sweep':'gap'),patternCycle:0}:{}),
        equipped:[{type,polarity,key:`${type}:${polarity}`},...(c.stage===2?[{type:(type+3)%7,polarity,key:`${(type+3)%7}:${polarity}`}]:[])],
        dropsUpgrade:true,driftX:c.klein?sign*(45+105*ramp):c.moving?sign*45:0,
        driftY:c.klein?sign*(35+105*ramp):c.moving?sign*30:0,facing:-1};
    });
    s.campaign.lessonNotices=c.lessonNotices||null;
  }
  s.asteroids=Array.from({length:c.asteroids||0},(_,i)=>{
    let x=i%7===3?-326:i%7===6?326:random()*520-260;
    const z=350+i*(c.routeLength-550)/Math.max(1,c.asteroids-1)+(random()-.5)*50,radius=20+random()*10;
    if(s.enemies.some(e=>Math.abs(e.z-z)<110&&Math.abs(e.x-x)<90))x=x>0?-220:220;
    return {id:`rock-${i}`,x,z,radius,hp:2,maxHp:2,shape:Math.floor(random()*10000),rotation:random()*Math.PI*2,presented:false};
  });
  s.campaign.pressureBudget=pressureBudget(c);s.campaign.routeLength=c.routeLength;s.campaign.lessonNoticeIndex=-1;
  s.events.push({time:s.time,type:'route-start',chapter:s.campaign.index,length:c.routeLength,carriers:s.enemies.length,pressure:s.campaign.pressureBudget});
}

export function tickWaveDirector(s){
  if(!isScrollingLevel(s))return;
  const c=chapter(s),script=waveScriptFor(c);if(!script)return;
  const progress=Math.max(0,Math.min(1,(s.cameraZ||0)/Math.max(1,c.routeLength)));
  for(const enemy of s.enemies){
    if(enemy.waveActive!==false||progress+1e-9<enemy.activationAt)continue;
    enemy.waveActive=true;enemy.clock=enemy.attackDelay??.2;
    s.events.push({time:s.time,type:'wave-enemy-activated',wave:enemy.waveId,target:enemy.id});
  }
  const plan=s.campaign.wavePlan||[];let index=-1;
  for(let i=0;i<plan.length;i++)if(progress+1e-9>=plan[i].at)index=i;
  if(index!==s.campaign.waveIndex){
    s.campaign.waveIndex=index;
    if(index>=0){const current=plan[index];s.campaign.currentWave=current;
      s.events.push({time:s.time,type:current.kind==='break'?'wave-break':'wave-start',wave:current.id,label:current.label,progress});
      if(current.kind==='break'){
        if(current.clearHostile){
          const cleared=s.enemyShots.length;s.enemyShots=[];
          for(const enemy of s.enemies){if(enemy.waveActive!==false){enemy.telegraph=null;enemy.clock=Math.max(.5,enemy.clock||0);}}
          s.events.push({time:s.time,type:'recovery-clear',wave:current.id,cleared});
        }
        s.lastEvent=`Recovery: ${current.label}.`;
        if(c.act===3)queueEvolution(s,current.id);
      }
    }
  }
  s.campaign.clearedWaves ||= [];
  for(const wave of plan){
    if(wave.kind==='break'||s.campaign.clearedWaves.includes(wave.id)||progress<wave.at)continue;
    const members=s.enemies.filter(enemy=>enemy.waveId===wave.id);
    if(members.length&&members.every(enemy=>enemy.hp<=0||enemy.escaped)){
      s.campaign.clearedWaves.push(wave.id);if(s.campaign.metrics)s.campaign.metrics.wavesCleared++;
      s.events.push({time:s.time,type:'wave-cleared',wave:wave.id,label:wave.label});
    }
  }
  const foldEvents=s.campaign.scriptedFolds||[];
  while((s.campaign.scriptedFoldIndex||0)<foldEvents.length&&progress+1e-9>=foldEvents[s.campaign.scriptedFoldIndex].at){
    const event=foldEvents[s.campaign.scriptedFoldIndex++];
    if(event.action==='add'&&addFold(s)){
      s.fields.at(-1).source='authored-lesson';s.fields.at(-1).label=event.label;
      s.events.push({time:s.time,type:'fold',fields:s.fields.length,automatic:true,authored:true});
      s.events.push({time:s.time,type:'timing-fold',label:event.label,fields:s.fields.length});
      s.lastEvent=`${event.label}: space folded. Keep it or use Right Shift to restore the earlier timing.`;
    }
  }
}

/** The lesson follows route position and observed actions. It never gates the exit. */
export function updateSpaceLesson(s){
  if(!isScrollingLevel(s)||chapter(s).number!==1)return;
  const lesson=s.campaign.spaceLesson,depth=s.fields.length;
  if(depth>lesson.lastDepth)lesson.folded=true;
  if(depth<lesson.lastDepth&&lesson.folded)lesson.unfolded=true;
  lesson.lastDepth=depth;
  const previous=s.campaign.lesson;
  s.campaign.lesson=s.z>=900?'engage':lesson.unfolded?'ready':lesson.folded||s.z>=320?'unfold':'fold';
  const hints={
    fold:'Left Shift shortens the route. Keep firing.',
    unfold:depth?'Faster exit, faster enemy shots. Right Shift opens space.':'Fold to reach the exit faster. Keep firing.',
    ready:'Fold for speed. Unfold for reaction time. Keep firing.',
    engage:'Fold for speed. Unfold for reaction time. Steer out of the locked lane.',
  };
  s.campaign.hint=hints[s.campaign.lesson];
  if(previous!==s.campaign.lesson){s.events.push({time:s.time,type:'space-lesson',lesson:s.campaign.lesson,x:s.x,z:s.z});s.lastEvent=s.campaign.hint;}
}

export function enterChapter(s,index){
  const serial=s.campaign?.enemySerial||0;
  const previousEcology=s.projective;
  s.campaign={index,defeated:0,asteroidsBroken:0,enemySerial:serial,startedAt:s.time,wraps:0,routeReached:false,scrollDistance:0,metrics:{grazes:0,seamCrossings:0,seamEvidence:0,folds:0,unfolds:0,foldEvidence:0,damage:0,kills:0,wavesCleared:0}};
  const c=chapter(s);s.stage=c.stage;s.slotCount=c.stage===2?2:1;
  s.projective=c.act===3?createEcologyState(previousEcology):null;
  s.x=0;s.z=0;s.cameraZ=0;s.surfaceViewZ=0;s.facing=1;s.thrust=0;s.lateralVelocity=0;s.hull=5;s.invulnerable=0;s.fields=[];s.shots=[];s.enemyShots=[];s.asteroids=[];s.debts=[];s.effects=[];s.drops=[];s.gates=[];s.fireClock=0;
  const driveRandom=randomFor(s.runSeed^0x4b1e1,index*101);
  s.drive={status:'damaged',warningUntil:null,nextFaultAt:s.time+(c.number===1?6:10)+driveRandom()*3,faults:0,attempts:0};
  s.enemies=[];s.nextEnemyWindup=0;
  if(c.kind!=='tutorial')issueKit(s,c.stage);
  s.phase='running';s.lastEvent=`${c.name}. ${c.goal}`;
  if(c.kind==='tutorial'){
    s.campaign.movement={left:0,right:0};s.campaign.lesson='move';
    s.campaign.training={shot:false,folded:false,unfolded:false,enemySpawned:false,completeAt:null};
  }else if(c.kind==='boss'){
    s.campaign.bossPhase='combat';s.campaign.introRemaining=4;if(c.hybrid)s.campaign.hybridPhase=1;if(c.projectiveBoss)s.campaign.curvaturePhase=1;
    s.campaign.announcement={text:c.intro,until:s.time+8};
    s.lastEvent=c.intro;
    s.enemies=(c.projectiveBoss?[{name:'Curvature Core',hp:55,x:0,y:650,vx:145,vy:-105,type:6,geometryRule:'projective',sequence:['fan','return','gap','spiral']},
      {name:'Arc Left',hp:22,x:-250,y:370,vx:-215,vy:145,type:1,geometryRule:'projective',sequence:['fan','wall','crossfire']},
      {name:'Arc Right',hp:22,x:250,y:780,vx:210,vy:160,type:3,geometryRule:'projective',sequence:['sweep','aimed','return']}]:
      c.hybrid?[{name:'Projective Core',hp:46,x:0,y:650,vx:145,vy:-95,type:6,geometryRule:'klein',sequence:['fan','gap','sweep']},
      {name:'Klein Anchor',hp:18,x:-250,y:370,vx:-220,vy:155,type:1,geometryRule:'klein',sequence:['fan','wall','return']},
      {name:'Antipodal Anchor',hp:18,x:250,y:780,vx:210,vy:175,type:3,geometryRule:'projective',projective:true,sequence:['sweep','aimed','return']}]:
      [{name:'Core',hp:44,x:0,y:650,vx:135,vy:-90,type:6},{name:'Escort A',hp:18,x:-250,y:370,vx:-220,vy:150,type:1},{name:'Escort B',hp:18,x:250,y:780,vx:205,vy:170,type:3}]).map((e,i)=>({
        id:++s.campaign.enemySerial,name:e.name,x:e.x,z:arenaZ(s,e.y),hp:e.hp,maxHp:e.hp,clock:1+i*.5,stage:2,boss:true,
        driftX:e.vx,driftY:e.vy,facing:-1,geometryRule:e.geometryRule||'klein',projective:Boolean(e.projective),
        patternRole:(c.hybrid||c.projectiveBoss)?'cycle':(i===0?'cycle':i===1?'fan':'sweep'),patternSequence:e.sequence||null,patternCycle:0,
        patternConfig:(c.hybrid||c.projectiveBoss)?{count:i===0?4:3,beats:2,recovery:i===0?1.35:1.75}:null,
        equipped:[{type:e.type,polarity:i%2?-1:1},{type:(e.type+3)%7,polarity:i%2?-1:1}],dropsUpgrade:true,
      }));
  }else {
    if(c.number===1){s.campaign.lesson='fold';s.campaign.spaceLesson={folded:false,unfolded:false,lastDepth:0};}
    spawnRoute(s);if(c.number===1)updateSpaceLesson(s);
  }
  s.events.push({time:s.time,type:'chapter-start',chapter:index,kind:c.kind,name:c.name});
  s.campaign.checkpoint=structuredClone({inventory:s.inventory,equipped:s.equipped,score:s.score,kills:s.kills,foldBonus:s.foldBonus,foldsUsed:s.foldsUsed,time:s.time,upgradeSerial:s.upgradeSerial,projective:s.projective});
}

export function startCampaign(s){enterChapter(s,-1);s.phase='ready';}
/** Act I onboarding is a strict, observable input sequence; no timed skip. */
export function tutorialMovement(s,oldX,oldZ){
  if(!isTutorial(s)||s.campaign.lesson!=='move')return;
  const dx=s.x-oldX,m=s.campaign.movement;
  if(dx<0)m.left-=dx;if(dx>0)m.right+=dx;
  if(Object.values(m).every(distance=>distance>=24)){
    s.campaign.lesson='shoot';
    s.enemies=[{id:++s.campaign.enemySerial,name:'Training enemy',training:true,x:0,z:s.z+620,hp:10,maxHp:10,clock:.25,firePeriod:1.4,shotSpeed:145,stage:0,equipped:[],driftX:0,driftY:0,facing:-1,dropsUpgrade:false}];
    s.campaign.training.enemySpawned=true;
    s.lastEvent='Hold Space. Left Shift folds distance.';
    s.events.push({time:s.time,type:'tutorial-movement-complete'});
    s.events.push({time:s.time,type:'tutorial-enemy-spawned',target:s.enemies[0].id});
  }
}

/** Called for successful player actions, not merely key presses. */
export function tutorialAction(s,type){
  if(!isTutorial(s)||s.phase!=='running')return false;
  const lesson=s.campaign.lesson,training=s.campaign.training;
  if(lesson==='shoot'&&type==='player-fire'){
    training.shot=true;s.campaign.lesson='fold';
    s.lastEvent='Keep firing. Left Shift folds distance.';
    s.events.push({time:s.time,type:'tutorial-shot-complete'});
    return true;
  }
  if(lesson==='fold'&&type==='fold'){
    training.folded=true;s.campaign.lesson='unfold';
    s.lastEvent='Shots arrive faster. Right Shift unfolds.';
    s.events.push({time:s.time,type:'tutorial-fold-complete'});
    return true;
  }
  if(lesson==='unfold'&&type==='unfold'&&s.fields.length===0){
    training.unfolded=true;s.campaign.lesson='engage';
    s.lastEvent='Space opens. Keep firing.';
    s.events.push({time:s.time,type:'tutorial-unfold-complete'});
    return true;
  }
  return false;
}
export function continueCampaign(s){
  if(!isCampaign(s)||s.phase!=='cleared')return false;
  if(s.campaign.index>=Math.min(CHAPTERS.length-1,BUILD.maxChapterIndex))return false;
  enterChapter(s,s.campaign.index+1);return true;
}
export function retryCampaign(s){
  const index=s.campaign.index,checkpoint=structuredClone(s.campaign.checkpoint);
  Object.assign(s,checkpoint);enterChapter(s,index);return true;
}
export function campaignAfterTick(s){
  if(!isCampaign(s)||s.phase!=='running'||isBoss(s))return;
  const c=chapter(s);
  if(isTutorial(s)){
    if(s.campaign.lesson!=='complete'&&s.campaign.training.enemySpawned&&s.campaign.defeated>0){
      s.campaign.lesson='complete';s.campaign.training.completeAt=s.time;
      s.shots=[];s.enemyShots=[];
      s.lastEvent='Training complete. Level 1 beginning.';
      s.events.push({time:s.time,type:'tutorial-complete'});
    }
    if(s.campaign.lesson==='complete'&&s.time-s.campaign.training.completeAt>=1.05){
      // Advance seamlessly and show the next chapter briefly. The UI must
      // checkpoint the new section without writing a fake Level-0 clear.
      enterChapter(s,0);
      s.campaign.autoFromTutorial=true;
      s.campaign.announcement={text:'LEVEL 1 · TWO SIDES',until:s.time+2.2};
    }
    return;
  }
  if(isScrollingLevel(s)){
    updateSpaceLesson(s);
    const routeProgress=s.cameraZ;
    if(!s.campaign.routeReached&&routeProgress>=c.routeLength){s.campaign.routeReached=true;s.events.push({time:s.time,type:'route-end',chapter:s.campaign.index,distance:routeProgress});}
    if(!s.campaign.routeReached||s.debts.some(d=>d.target==='player'))return;
    s.campaign.grade=calculateStageGrade(s,c);
    const speed=s.campaign.grade.speed;
    s.score+=speed.bonus;
    s.events.push({time:s.time,type:'speed-bonus',chapter:s.campaign.index,...speed});
    s.phase='cleared';s.lastEvent=`${c.name} route complete · Speed ${speed.letter} · +${speed.bonus}.`;s.events.push({time:s.time,type:'chapter-cleared',chapter:s.campaign.index,grade:s.campaign.grade});return;
  }
}

function resetEnemyEntry(s,enemy,edge,klein=false){
  enemy.presented=false;enemy.visibleFor=0;enemy.escaped=false;enemy.telegraph=null;enemy.contacting=false;enemy.loopCount=(enemy.loopCount||0)+1;
  for(const shot of [...s.shots,...s.enemyShots])if(shot.gates)delete shot.gates[`enemy-${enemy.id}`];
  s.campaign.wraps++;
  s.events.push({time:s.time,type:klein?'klein-crossing':'enemy-return',actor:`enemy-${enemy.id}`,target:enemy.id,edge,x:enemy.x,z:enemy.z,hp:enemy.hp});
}

export function moveCampaignEnemies(s,dt,cameraFrom=s.cameraZ,oldFacing=1,frameTurned=false){
  for(const enemy of s.enemies){
    if(enemy.hp<=0||enemy.escaped)continue;
    if(isKleinSurfaceRoute(s)){
      // Unseen authored waves belong to route progress, not to the physical
      // coordinate chart that the player abandoned at a side seam.
      if(frameTurned&&!enemy.routeActive&&Number.isFinite(enemy.routeDepth))
        enemy.z=arenaZ(s,enemy.routeDepth-(s.cameraZ||0));
      if(enemy.waveActive===false&&!enemy.routeActive)continue;
      const currentY=arenaY(s,enemy.z);
      const oldY=frameTurned
        ? (enemy.routeActive?KLEIN_BOUNDS.bottom+KLEIN_BOUNDS.top-oldFacing*spaceDistance(cameraFrom||0,enemy.z,s.fields):currentY+SCROLL_SPEED*dt)
        : oldFacing*spaceDistance(cameraFrom||0,enemy.z,s.fields);
      if(!enemy.routeActive&&currentY>KLEIN_BOUNDS.top)continue;
      const startY=enemy.routeActive?oldY:Math.min(oldY,KLEIN_BOUNDS.top);
      enemy.routeActive=true;
      const motion=surfaceTrace(s,{x:enemy.x,y:startY},(enemy.driftX||0)*dt,currentY-startY+(enemy.driftY||0)*dt);
      enemy.x=motion.x;enemy.z=arenaZ(s,motion.y);
      enemy.facing=(arenaY(s,s.z)>motion.y?1:-1)*(s.facing||1);
      if(motion.twists%2){enemy.driftY*=-1;enemy.facing*=-1;}
      if(isProjectiveSurfaceRoute(s)&&motion.projectiveCrossings%2)enemy.driftX*=-1;
      for(const crossing of motion.crossings)resetEnemyEntry(s,enemy,crossing.edge,true);
      continue;
    }
    enemy.facing=s.z>enemy.z?1:-1;
    if(isKleinRoute(s)){
      const oldY=spaceDistance(cameraFrom||0,enemy.z,s.fields),currentY=arenaY(s,enemy.z);
      if(!enemy.routeActive&&currentY>KLEIN_BOUNDS.top)continue;
      const startY=enemy.routeActive?oldY:Math.min(oldY,KLEIN_BOUNDS.top);enemy.routeActive=true;
      const motion=traceKlein({x:enemy.x,y:startY},(enemy.driftX||0)*dt,currentY-startY+(enemy.driftY||0)*dt);
      enemy.x=motion.x;enemy.z=arenaZ(s,motion.y);
      if(motion.twists%2){enemy.driftY*=-1;enemy.facing*=-1;}
      for(const crossing of motion.crossings)resetEnemyEntry(s,enemy,crossing.edge,true);
      continue;
    }
    enemy.x+=(enemy.driftX||0)*dt;
    if(Math.abs(enemy.x)>330){enemy.x=Math.sign(enemy.x)*330;enemy.driftX*=-1;}
    if(isScrollingLevel(s)){
      enemy.z=advanceThroughSpace(enemy.z,(enemy.driftY||0)*dt,s.fields);
      const y=arenaY(s,enemy.z);
      if(y< -120){enemy.z=arenaZ(s,-120+((y+120)%1070+1070)%1070);resetEnemyEntry(s,enemy,'bottom');}
    }else{
      const y=arenaY(s,enemy.z)+enemy.driftY*dt,limited=Math.max(-15,Math.min(820,y));if(y!==limited)enemy.driftY*=-1;
      enemy.z=arenaZ(s,limited);
    }
  }
}
