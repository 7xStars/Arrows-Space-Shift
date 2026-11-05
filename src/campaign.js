import {OPERATIONS,roster,loadout} from './upgrades.js';
import {advanceThroughSpace,spaceDistance} from './space.js';
import {randomFor} from './random.js';
import {traceKlein,KLEIN_BOUNDS} from './klein.js';

export const CHAPTERS=Object.freeze([
  {kind:'level',number:1,name:'Two Sides',stage:0,routeLength:3600,carriers:12,goal:'Fight through the carriers and reach the end of the route.',hint:'With one fold, a right seed moves right-side shots left. Unfold to reverse the accepted side.',waves:[[0,0],[0,0]]},
  {kind:'level',number:2,name:'Quiet Belt',stage:0,calm:true,routeLength:2400,carriers:3,asteroids:14,goal:'Reach the exit through a quiet asteroid belt.',hint:'Break or avoid asteroids. Enemy shots can break them too. Watch for an occasional carrier.',waves:[[0,0]]},
  {kind:'level',number:3,name:'Counter Cycle',stage:1,routeLength:4200,carriers:15,goal:'Reach the route end while fighting the three-operation carriers.',hint:'Position Warp counters Vector Lens. Vector Lens counters Impact Buffer. Impact Buffer counters Position Warp.',waves:[[0,1,3],[3,0,1]]},
  {kind:'level',number:4,name:'Loose Stones',stage:1,calm:true,routeLength:2800,carriers:3,asteroids:16,goal:'Reach the exit among asteroids and scattered carriers.',hint:'Use the three-operation set with less incoming fire. Rocks can block shots from either side.',waves:[[0,1,3]]},
  {kind:'level',number:5,name:'Seven Operations',stage:2,routeLength:4800,carriers:18,goal:'Reach the route end. Use two slots against seven-operation carriers.',hint:'A common counter can pass both opposing operations. Slot 1 acts before Slot 2.',waves:[[0,1,3],[2,4],[5,6]]},
  {kind:'level',number:6,name:'Drift Field',stage:2,calm:true,routeLength:3200,carriers:4,asteroids:18,goal:'Reach the exit through the drift field.',hint:'Try different equipment orders among breakable rocks and occasional enemies. Hull damage remains active.',waves:[[0,1,3,2,4,5,6]]},
  {kind:'level',number:7,name:'Front and Back',stage:2,routeLength:5400,carriers:21,goal:'Fight the returning carriers until you reach the route end.',hint:'Carriers use the Klein bottle edges. Side crossings reverse vertical position and motion. These carriers move and fire faster.',waves:[[0,1,3],[2,4,6]],moving:true,klein:true},
  {kind:'level',number:8,name:'Last Approach',stage:2,calm:true,routeLength:3600,carriers:4,asteroids:20,goal:'Reach the final battle through the last asteroid belt.',hint:'Use the quieter route to prepare your equipment. Asteroids and occasional carriers still cause hull damage.',waves:[[0,1,3,2,4,5,6]],moving:true},
  {kind:'boss',name:'The Klein Fleet',stage:2,goal:'Destroy the core and both escorts. Leaving the frame does not remove an enemy.',hint:'Left/right edges reverse vertical position and direction. Top/bottom edges preserve horizontal position. Your ship and shots use the same map.'},
]);
export const TUTORIAL=Object.freeze({kind:'tutorial',number:0,name:'Flight controls',stage:0,goal:'Move left and right. Then hit the training target with Space.',hint:'Left and Right steer. The route controls forward travel. There are no enemy shots in this level.'});
export const isCampaign=s=>s.mode==='campaign';
export const isTutorial=s=>isCampaign(s)&&s.campaign?.index===-1;
export const chapter=s=>isTutorial(s)?TUTORIAL:CHAPTERS[s.campaign?.index||0];
export const isBoss=s=>isCampaign(s)&&chapter(s).kind==='boss';
export const isScrollingLevel=s=>isCampaign(s)&&chapter(s).kind==='level';
export const isKleinRoute=s=>isScrollingLevel(s)&&Boolean(chapter(s).klein);
export const SCROLL_SPEED=90;
export const arenaY=(s,z)=>spaceDistance(s.cameraZ||0,z,s.fields);
export const arenaZ=(s,y)=>advanceThroughSpace(s.cameraZ||0,y,s.fields);

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
  s.enemies=Array.from({length:c.carriers},(_,i)=>{
    const type=pattern[i%pattern.length],polarity=i%2?-1:1,id=++s.campaign.enemySerial;
    const x=c.calm?(random()*500-250):i===0?0:Math.max(-280,Math.min(280,[0,-160,160,-80,80][i%5]+random()*80-40));
    const z=c.calm?650+i*(c.routeLength-900)/(c.carriers-1)+(random()-.5)*100:450+i*(c.routeLength-530)/(c.carriers-1)+(i===0?0:(random()-.5)*40);
    const hp=c.calm?1:2;
    return {id,x,z,hp,maxHp:hp,clock:c.klein ? .6+i%3*.15 : c.calm?2.8+random():1.4+i%3*.3,firePeriod:c.klein ? .9+i%3*.1 : c.calm?3.8+random():2.3+i%3*.2,shotSpeed:c.klein?210:145,stage:c.stage,
      equipped:[{type,polarity,key:`${type}:${polarity}`},...(c.stage===2?[{type:(type+3)%7,polarity,key:`${(type+3)%7}:${polarity}`}]:[])],
      dropsUpgrade:true,driftX:c.klein?(i%2?150:-150):c.moving?(i%2?45:-45):0,driftY:c.klein?(i%2?140:-140):c.moving?(i%2?30:-30):0,facing:-1};
  });
  s.asteroids=Array.from({length:c.asteroids||0},(_,i)=>{
    let x=random()*520-260;const z=350+i*(c.routeLength-550)/Math.max(1,c.asteroids-1)+(random()-.5)*50,radius=20+random()*10;
    if(s.enemies.some(e=>Math.abs(e.z-z)<110&&Math.abs(e.x-x)<90))x=x>0?-220:220;
    return {id:`rock-${i}`,x,z,radius,hp:2,maxHp:2,shape:Math.floor(random()*10000),rotation:random()*Math.PI*2,presented:false};
  });
  s.events.push({time:s.time,type:'route-start',chapter:s.campaign.index,length:c.routeLength,carriers:c.carriers});
}

export function enterChapter(s,index){
  const serial=s.campaign?.enemySerial||0;
  s.campaign={index,defeated:0,asteroidsBroken:0,enemySerial:serial,startedAt:s.time,wraps:0,routeReached:false};
  const c=chapter(s);s.stage=c.stage;s.slotCount=c.stage===2?2:1;
  s.x=0;s.z=0;s.cameraZ=0;s.facing=1;s.thrust=0;s.hull=5;s.invulnerable=0;s.fields=[];s.shots=[];s.enemyShots=[];s.asteroids=[];s.debts=[];s.effects=[];s.drops=[];s.gates=[];s.fireClock=0;
  s.enemies=[];
  if(c.kind!=='tutorial')issueKit(s,c.stage);
  s.phase='running';s.lastEvent=`${c.name}. ${c.goal}`;
  if(c.kind==='tutorial'){
    s.campaign.movement={left:0,right:0};s.campaign.lesson='move';
  }else if(c.kind==='boss'){
    s.enemies=[{name:'Core',hp:24,x:0,y:650,vx:90,vy:-56,type:6},
      {name:'Escort A',hp:8,x:-250,y:370,vx:-145,vy:80,type:1},
      {name:'Escort B',hp:8,x:250,y:780,vx:130,vy:95,type:3}].map((e,i)=>({
        id:++s.campaign.enemySerial,name:e.name,x:e.x,z:arenaZ(s,e.y),hp:e.hp,maxHp:e.hp,clock:1+i*.5,stage:2,boss:true,
        driftX:e.vx,driftY:e.vy,facing:-1,equipped:[{type:e.type,polarity:i%2?-1:1},{type:(e.type+3)%7,polarity:i%2?-1:1}],dropsUpgrade:true,
      }));
  }else spawnRoute(s);
  s.events.push({time:s.time,type:'chapter-start',chapter:index,kind:c.kind,name:c.name});
  s.campaign.checkpoint=structuredClone({inventory:s.inventory,equipped:s.equipped,score:s.score,kills:s.kills,time:s.time,upgradeSerial:s.upgradeSerial});
}

export function startCampaign(s){enterChapter(s,-1);s.phase='ready';}
export function tutorialMovement(s,oldX,oldZ){
  if(!isTutorial(s)||s.campaign.lesson!=='move')return;
  const dx=s.x-oldX,m=s.campaign.movement;
  if(dx<0)m.left-=dx;if(dx>0)m.right+=dx;
  if(Object.values(m).every(distance=>distance>=24)){
    s.campaign.lesson='shoot';
    s.enemies=[{id:++s.campaign.enemySerial,name:'Training target',training:true,x:0,z:s.z+220,hp:1,maxHp:1,clock:Infinity,stage:0,equipped:[],driftX:0,driftY:0,facing:-1,dropsUpgrade:false}];
    s.lastEvent='Movement complete. Align with the training target. Hold Space to fire.';
    s.events.push({time:s.time,type:'tutorial-movement-complete'});
  }
}
export function continueCampaign(s){
  if(!isCampaign(s)||s.phase!=='cleared')return false;
  if(s.campaign.index>=CHAPTERS.length-1)return false;
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
    if(s.campaign.lesson==='shoot'&&s.campaign.defeated>0){s.phase='cleared';s.lastEvent='Movement and firing complete. Start Level 1 when you are ready.';s.events.push({time:s.time,type:'tutorial-complete'});}
    return;
  }
  if(isScrollingLevel(s)){
    if(!s.campaign.routeReached&&s.z>=c.routeLength){s.campaign.routeReached=true;s.events.push({time:s.time,type:'route-end',chapter:s.campaign.index,distance:s.z});}
    if(!s.campaign.routeReached||s.debts.some(d=>d.target==='player'))return;
    s.phase='cleared';s.lastEvent=`${c.name} route complete.`;s.events.push({time:s.time,type:'chapter-cleared',chapter:s.campaign.index});return;
  }
}

function resetEnemyEntry(s,enemy,edge,klein=false){
  enemy.presented=false;enemy.visibleFor=0;enemy.escaped=false;enemy.loopCount=(enemy.loopCount||0)+1;
  for(const shot of [...s.shots,...s.enemyShots])if(shot.gates)delete shot.gates[`enemy-${enemy.id}`];
  s.campaign.wraps++;
  s.events.push({time:s.time,type:klein?'klein-crossing':'enemy-return',actor:`enemy-${enemy.id}`,target:enemy.id,edge,x:enemy.x,z:enemy.z,hp:enemy.hp});
}

export function moveCampaignEnemies(s,dt,cameraFrom=s.cameraZ){
  for(const enemy of s.enemies){
    if(enemy.hp<=0||enemy.escaped)continue;
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
    if(Math.abs(enemy.x)>280){enemy.x=Math.sign(enemy.x)*280;enemy.driftX*=-1;}
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
