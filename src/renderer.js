import {advanceThroughSpace,metricAt,spaceDistance} from './space.js';
import {OPERATIONS,loadout,activeSourceSide,WARP_RADIUS} from './upgrades.js';
import {ROUTE_LENGTH,targetOpen} from './simulation.js';
import {combatViewLayout,projectInView,viewOrigin,viewY,viewZ,viewDirection,screenFacing,bossSideDestinationY,viewSegments,viewFieldIntervals,inCombatView,usesVisibleCombat,combatReady,presentEnemy,ENTRY_TIME} from './combat-view.js';
import {CHAPTERS,isCampaign,isBoss,isKleinRoute,isKleinSurfaceRoute,isHybridBoss,hybridProjectiveActive,isScrollingLevel,isTutorial,chapter,arenaY,arenaZ,SCROLL_SPEED} from './campaign.js';
import {enemyArt} from './pixel-art.js';
import {KLEIN_BOUNDS,traceKlein} from './klein.js';
import {activeShip} from './fleet.js';
import {playerJoinForecast,joinCueText} from './geometry-cues.js';
import {projectileManifoldRule,projectileJoinPreview,manifoldFrameIndicator,MANIFOLD_MARKS} from './manifold-visuals.js';
import {StructuralFeedback,mechanicalImpulse} from './structural-feedback.js';

export const REALM=Object.freeze({void:'#000000',space:'#000000',panel:'#101418',ivory:'#f0e4bd',brass:'#b4a170',muted:'#87929b',fold:'#e67f4e',unfold:'#79aade',projective:'#c88cff',danger:'#f0a080',safe:'#96c7ca'});
const TAU=Math.PI*2;
const CANVAS_FONT='"DejaVu Sans", Arial, sans-serif';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const operationResults=['WARPED','DEFLECTED','BENDING','HIT BUFFERED','SHOT HELD','SLOWED','SLOWER · DAMAGE ×2'];
const shortResults=['P WARP','V DEFLECT','B BEND','I BUFFER','D HOLD','A SLOW','U DAMAGE ×2'];
const playerImpactTypes=new Set(['damage','protected-contact','contact-protected','impact-absorbed','contact-absorbed','damage-absorbed','damage-prevented']);

/** A continuous approach to the fleet; retries restore the same sky density. */
export function starfieldProgress(s){
  if(isBoss(s))return 1;
  if(isTutorial(s))return 0;
  if(!isCampaign(s))return clamp((s.z||0)/ROUTE_LENGTH,0,1);
  const route=chapter(s);
  if(route.act===2){
    const levels=CHAPTERS.filter(section=>section.kind==='level'&&section.act===2),distance=levels.filter(section=>section.actStage<route.actStage).reduce((sum,section)=>sum+section.routeLength,0),total=levels.reduce((sum,section)=>sum+section.routeLength,0);
    return .72+.28*clamp((distance+clamp(s.cameraZ||0,0,route.routeLength||0))/Math.max(1,total),0,1);
  }
  if(route.act===3){
    const levels=CHAPTERS.filter(section=>section.kind==='level'&&section.act===3);
    const distance=levels.filter(section=>section.actStage<route.actStage).reduce((sum,section)=>sum+section.routeLength,0);
    const total=levels.reduce((sum,section)=>sum+section.routeLength,0);
    return .82+.18*clamp((distance+clamp(s.cameraZ||0,0,route.routeLength||0))/Math.max(1,total),0,1);
  }
  // Freeze Act I's original visual progression even after later acts are appended.
  const levels=CHAPTERS.filter(section=>section.kind==='level'&&section.act!==2&&section.act!==3),distance=levels.filter(section=>section.number<route.number).reduce((sum,section)=>sum+section.routeLength,0),total=levels.reduce((sum,section)=>sum+section.routeLength,0);
  return clamp((distance+clamp(s.cameraZ||0,0,route.routeLength||0))/total,0,1);
}

/** Presentation-only displacement. The aim, collision and simulation clocks do not move. */
export function impactJolt(age,amount=1){
  if(age<0||age>=.28)return {x:0,y:0};
  const envelope=(1-age/.28)**2,strength=Math.min(5,3.5+Math.max(1,amount)*.7)*envelope;
  return {x:Math.sin(age*91)*strength,y:Math.cos(age*73)*strength*.65};
}

/** The entry mark uses the actor's actual facing, including a Klein side crossing. */
export function operationCuePosition(s,seed,index=0){
  const side=activeSourceSide(s,seed),facing=isCampaign(s)?s.facing||1:1;
  return {x:s.x+side*(90+index*30),z:advanceThroughSpace(s.z,facing*WARP_RADIUS,s.fields),side,facing};
}
/** Keep every carried identity legible; a dual payload is not a single-color shot. */
export function payloadBadges(payload=[]){
  return [...new Set(payload)].filter(id=>OPERATIONS[id]).map(id=>({id,code:OPERATIONS[id].code,color:OPERATIONS[id].color}));
}
/** Source and destination share an identifier so a return cannot imply a new enemy. */
export function returnPreview(s,enemy){
  if(!isCampaign(s)||enemy.hp<=0||enemy.escaped||enemy.stage>s.stage||isTutorial(s))return null;
  if((isKleinRoute(s)||isKleinSurfaceRoute(s))&&!enemy.routeActive)return null;
  const y=viewY(s,enemy.z),klein=isBoss(s)||isKleinRoute(s)||isKleinSurfaceRoute(s);
  const dy=(isKleinSurfaceRoute(s)?1:viewDirection(s))*(enemy.driftY||0)-(isScrollingLevel(s)||isBoss(s)?SCROLL_SPEED:0);
  const sideY=isBoss(s)?bossSideDestinationY(s,y):880-y;
  let destination,edge;
  if(klein&&enemy.x>300&&(enemy.driftX||0)>0){edge='right';destination={x:-366,y:sideY};}
  else if(klein&&enemy.x< -300&&(enemy.driftX||0)<0){edge='left';destination={x:366,y:sideY};}
  else if(klein&&y>840&&dy>0){edge='top';destination={x:enemy.x,y:-36};}
  else if(y<80&&dy<0){edge='bottom';destination={x:enemy.x,y:916};}
  if(!destination)return null;
  return {id:enemy.id,name:enemy.name,hp:enemy.hp,edge,source:{x:enemy.x,z:enemy.z},destination:{x:destination.x,z:viewZ(s,clamp(destination.y,-36,916))}};
}
/** Show the next identified edge on the player's current course, before crossing it. */
export function playerReturnPreview(s,horizontalVelocity=0){
  if(!isBoss(s)&&!isKleinSurfaceRoute(s))return null;
  const facing=s.facing||1,lookAhead=.7,speed=activeShip(s).speed;
  const motion=traceKlein({x:s.x,y:arenaY(s,s.z)},clamp(horizontalVelocity,-speed,speed)*lookAhead,isKleinSurfaceRoute(s)?0:facing*SCROLL_SPEED*lookAhead);
  const crossing=motion.crossings[0];if(!crossing)return null;
  const twist=crossing.edge==='left'||crossing.edge==='right';
  return {edge:crossing.edge,facing:1,destination:{x:crossing.x,z:isKleinSurfaceRoute(s)?s.z:viewZ(s,0)},
    physicalFacing:twist?-facing:facing,physicalDestination:{x:crossing.x,z:arenaZ(s,crossing.y)}};
}
export function feedbackLabel(event){
  if(event.type==='operation')return operationResults[event.typeId]||'OPERATION';
  if(event.type==='counter-bypass')return `${OPERATIONS[event.attack]?.code||'?'} PASSES ${OPERATIONS[event.defense]?.code||'?'}`;
  if(event.type==='damage-debt')return `STORED HIT +${event.amount||1}`;
  if(event.type==='debt-paid')return `DEBT PAID −${event.amount||1}`;
  if(event.type==='damage')return `HULL HIT −${event.amount||1}`;
  if(['protected-contact','contact-protected','impact-absorbed','contact-absorbed','damage-absorbed','damage-prevented'].includes(event.type))return 'PROTECTED';
  if(event.type==='shield-block')return 'SHIELD CLOSED';
  if(event.type==='upgrade-collected')return event.duplicate?event.recycled?.includes('stored echo')?'DUPLICATE → ECHO':'DUPLICATE → SCORE':`${OPERATIONS[event.typeId]?.code||'SEED'} COLLECTED`;
  return null;
}

/** Rendering never changes simulation time, collision shapes, or projectile paths. */
export class FlightRenderer{
  constructor(ctx,pixelArt,options={}){
    this.ctx=ctx;this.art=pixelArt;this.options={reducedMotion:false,juice:true,showCore:true,patternLabels:true,manifoldCues:true,...options};
    this.lastState=null;this.seen=new WeakSet();this.enemyHull=new WeakMap();this.healthTrails=new WeakMap();this.enemyHits=new Map();this.playerHit=null;this.particles=[];this.messages=[];this.visualEvents=[];this.bank=0;this.previousFields=[];this.structuralFeedback=new StructuralFeedback();
  }
  setOptions(options={}){Object.assign(this.options,options);}
  render(s,{width=s.view?.width||900,height=s.view?.height||740,dt=0,flash=0,juice=this.options.juice,reducedMotion=this.options.reducedMotion,debug=false}={}){
    this.s=s;this.view={...s,view:{...s.view,width,height}};this.layout=combatViewLayout(this.view);
    this.scale=this.layout.scale;this.motion=Boolean(juice&&!reducedMotion);this.debug=debug;
    const newSection=this.lastState===s&&this.lastChapter!==s.campaign;
    if(this.lastState!==s||s.time<this.lastTime||newSection){
      this.seen=new WeakSet();this.enemyHull=new WeakMap();this.healthTrails=new WeakMap();this.enemyHits=new Map();this.playerHit=null;this.particles=[];this.messages=[];this.visualEvents=[];this.bank=0;this.lastX=s.x;this.previousFields=[];this.foldPulse=null;this.lastFire=-10;
      if(newSection||s.phase==='paused')for(const event of s.events||[])this.seen.add(event);
    }
    let lateral=s.x-this.lastX;
    if((isBoss(s)||isKleinSurfaceRoute(s))&&Math.abs(lateral)>(KLEIN_BOUNDS.right-KLEIN_BOUNDS.left)/2)lateral-=Math.sign(lateral)*(KLEIN_BOUNDS.right-KLEIN_BOUNDS.left);
    const speed=activeShip(s).speed;
    this.horizontalVelocity=s.phase==='running'&&dt>0?clamp(lateral/dt,-speed,speed):0;
    if(this.motion&&s.phase==='running'&&dt>0){
      const desired=this.horizontalVelocity/speed*.045;
      this.bank=mix(this.bank,desired,Math.min(1,dt*16));
    }else this.bank=0;
    this.lastX=s.x;this.lastState=s;this.lastTime=s.time;this.lastChapter=s.campaign;
    this.readEvents();
    this.response=this.structuralFeedback.update(s,{shipId:activeShip(s).id,reducedMotion,decorative:juice});
    if(!this.motion)this.particles=[];
    const ctx=this.ctx,L=this.layout;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.textBaseline='alphabetic';
    this.drawBackground();
    ctx.save();ctx.beginPath();ctx.rect(L.left,L.top,L.arenaWidth,L.arenaHeight);ctx.clip();
    this.jolt=this.motion&&s.phase==='running'&&this.playerHit?impactJolt(s.time-this.playerHit.time,this.playerHit.amount):{x:0,y:0};
    ctx.save();ctx.translate(this.jolt.x,this.jolt.y);
    this.drawDistanceGrid();this.drawFolds(flash);
    if(isBoss(s)||isKleinRoute(s)||isKleinSurfaceRoute(s))this.drawKleinEdges();
    this.drawReturns();this.drawGeometryForecasts();this.drawRocks();this.drawDrops();this.drawMissionPart();this.drawOperationCues();this.drawGates();
    this.drawTelegraphs();this.drawEnemies();this.drawEffects();this.drawManifoldPreviews();this.drawShots();this.drawExit();this.drawPlayer();this.drawManifoldStatus();
    this.drawParticles();this.drawFeedback();this.drawDebt();this.drawReferenceCue();this.drawMilestone();
    ctx.restore();this.drawDamageBorder();ctx.restore();this.drawArenaFrame();this.drawCountdown();ctx.restore();
    this.previousFields=(s.fields||[]).map(f=>({...f}));
  }
  project(x,z){return projectInView(this.view,x,z);}
  chartPoint(x,y){return {x:this.layout.centerX+x*this.scale,y:this.layout.zeroY-y*this.scale};}
  worldLine(from,to,color,width=1){
    for(const segment of viewSegments(this.view,from,to)){
      const a=this.chartPoint(segment.from.x,segment.from.y),b=this.chartPoint(segment.to.x,segment.to.y);
      this.line(a.x,a.y,b.x,b.y,color,width);
    }
  }
  line(x1,y1,x2,y2,color,width=1){const c=this.ctx;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  polygon(points,fill,stroke,lineWidth=1){
    const c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lineWidth;c.stroke();}
  }
  circle(x,y,r,color,width=1,fill=null){const c=this.ctx;c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(color){c.strokeStyle=color;c.lineWidth=width;c.stroke();}}
  sprite(id,x,y,w,h=w){return Boolean(this.art?.drawSized?.(this.ctx,id,x,y,w,h));}
  text(text,x,y,color=REALM.ivory,size=10,align='center'){
    const c=this.ctx;c.fillStyle=color;c.font=`${size}px ${CANVAS_FONT}`;c.textAlign=align;c.fillText(text,x,y);c.textAlign='left';
  }
  label(text,x,y,color=REALM.ivory,size=10){
    const c=this.ctx;c.font=`${size}px ${CANVAS_FONT}`;
    const w=c.measureText(text).width+12,h=size+8;
    x=clamp(x,this.layout.left+w/2+3,this.layout.right-w/2-3);
    c.fillStyle='#080a0ce8';c.fillRect(x-w/2,y-h+3,w,h);
    this.text(text,x,y,color,size);return {x,w,h};
  }
  eventPoint(e){
    if(Number.isFinite(e.x)&&Number.isFinite(e.z))return {x:e.x,z:e.z};
    if(e.to&&Number.isFinite(e.to.x)&&Number.isFinite(e.to.z))return e.to;
    if(playerImpactTypes.has(e.type))return {x:this.s.x,z:this.s.z};
    const target=e.actor?.startsWith?.('enemy-')?e.actor.slice(6):e.target;
    const actor=target!==undefined&&target!=='player'?this.s.enemies.find(enemy=>String(enemy.id)===String(target)):this.s;
    return actor?{x:actor.x,z:actor.z}:{x:this.s.x,z:this.s.z};
  }
  readEvents(){
    const s=this.s;
    for(const e of (s.events||[]).slice(-160)){
      if(this.seen.has(e))continue;this.seen.add(e);
      // Retry can restore an earlier clock while the record retains the old attempt.
      if(e.time>s.time+1e-8||s.time-e.time>1.5)continue;
      this.visualEvents.push(e);
      const p=this.eventPoint(e),label=feedbackLabel(e);
      if(label){
        const color=e.type==='operation'?(OPERATIONS[e.typeId]?.color||REALM.ivory):e.type==='counter-bypass'?REALM.safe:['damage','debt-paid'].includes(e.type)?REALM.danger:REALM.ivory;
        // In a hull collision, target identifies the obstacle, not the damaged
        // actor. Stored debts and operation effects retain their own target.
        const actor=playerImpactTypes.has(e.type)?'player':e.actor||(e.target!==undefined&&e.target!=='player'?`enemy-${e.target}`:'player');
        const priority=['damage','debt-paid','damage-debt'].includes(e.type)?4:e.type==='counter-bypass'?3:e.type==='operation'?2:1;
        const recent=this.messages.find(m=>m.actor===actor&&s.time-m.time<m.duration);
        if(recent&&recent.kind===e.type){
          recent.time=e.time;recent.count=Math.min(99,(recent.count||1)+1);
          if(e.type==='operation'){
            recent.operations=[...new Set([...recent.operations,e.typeId])].slice(-2);
            recent.text=recent.operations.length>1?recent.operations.map(id=>shortResults[id]).join(' · '):label;
          }else if(e.type==='counter-bypass'){
            recent.counters=[...new Set([...recent.counters,`${e.attack}:${e.defense}`])].slice(-2);
            const pairs=recent.counters.map(pair=>pair.split(':').map(Number));
            recent.text=pairs.every(pair=>pair[0]===pairs[0][0])?`${OPERATIONS[pairs[0][0]].code} PASSES ${pairs.map(pair=>OPERATIONS[pair[1]].code).join('/')}`:label;
          }else recent.text=label;
        }else if(!recent||s.time-recent.time>.45||priority>=recent.priority){
          // One badge per defender avoids a new floating sentence for every shot.
          this.messages=this.messages.filter(m=>m.actor!==actor);
          this.messages.push({...p,actor,kind:e.type,priority,text:label,color,time:e.time,duration:1.15,
            operations:e.type==='operation'?[e.typeId]:[],counters:e.type==='counter-bypass'?[`${e.attack}:${e.defense}`]:[],count:1});
        }
      }
      if(e.type==='fold'||e.type==='unfold'){
        const field=e.type==='fold'?s.fields.at(-1):this.previousFields.at(-1);
        this.foldPulse={time:e.time,type:e.type,field:field?{...field}:null};
      }
      if(e.type==='player-fire'||e.type==='fire')this.lastFire=e.time;
      if(e.type==='damage')this.playerHit={time:e.time,amount:e.amount||1};
      if(e.type==='enemy-hit')this.enemyHits.set(String(e.target),{time:e.time,amount:e.amount||1});
      if(!this.motion)continue;
      if(e.type==='player-fire'||e.type==='fire')this.burst(p,5,'muzzle',e.time,e.vx||0,e.vz||680*(s.facing||1));
      else if(e.type==='enemy-fire')this.burst(p,6,'enemy-muzzle',e.time,e.vx||0,e.vz||-145);
      else if(e.type==='target-hit')this.burst(p,26,'debris',e.time);
      else if(e.type==='asteroid-broken')this.burst(p,13,'rock',e.time);
      else if(['enemy-hit','asteroid-hit','damage'].includes(e.type))this.burst(p,e.type==='damage'?18:e.type==='enemy-hit'?12:8,e.type==='damage'?'damage':'spark',e.time,e.vx||0,e.vz||(e.type==='damage'?-145*(s.facing||1):680*(s.facing||1)));
      else if(e.type==='counter-bypass'||e.type==='operation')this.burst(p,5,'operation',e.time);
    }
    this.messages=this.messages.filter(m=>s.time-m.time<m.duration).slice(-6);
    this.visualEvents=this.visualEvents.filter(e=>s.time-e.time<.5).slice(-90);
    this.particles=this.particles.filter(p=>s.time-p.time<p.life).slice(-260);
    for(const [id,hit] of this.enemyHits)if(s.time-hit.time>1)this.enemyHits.delete(id);
  }
  burst(point,count,kind,time,vx=0,vz=0){
    const muzzle=kind.includes('muzzle'),directional=muzzle||kind==='spark'||kind==='damage',baseAngle=Math.atan2(vz,vx),seed=time*53+point.x*.17+point.z*.011;
    for(let i=0;i<count;i++){
      const r=noise(seed+i),angle=directional?baseAngle+(r-.5)*(muzzle?1.2:3.5):r*TAU;
      const speed=(muzzle?35:35+noise(seed+i+91)*100),life=muzzle?.13+noise(seed+i+4)*.08:.3+noise(seed+i+71)*.35;
      const color=kind==='operation'?REALM.unfold:kind==='damage'||kind==='enemy-muzzle'?REALM.fold:kind==='rock'?REALM.brass:i%3?REALM.ivory:REALM.fold;
      this.particles.push({x:point.x,z:point.z,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,time,life,color,size:muzzle?2:1.5+noise(i+seed+3)*2,kind});
    }
  }
  drawBackground(){
    const s=this.s,c=this.ctx,L=this.layout,progress=starfieldProgress(s);
    c.fillStyle=REALM.void;c.fillRect(0,0,L.width,L.height);
    // Stars remain distant points, with two slow parallax layers. The density
    // follows route progress rather than elapsed play time or frame rate.
    const count=34+216*progress,seed=(s.runSeed||0)%100003,span=Math.max(1,L.height-L.topInset);
    // Star movement follows actual route progress; the visible acceleration
    // makes the fold's speedrunning use discoverable without a tutorial.
    const travel=isBoss(s)?s.campaign.scrollDistance||0:isScrollingLevel(s)?s.cameraZ||0:isCampaign(s)?Math.max(0,s.time-(s.campaign?.startedAt||0))*SCROLL_SPEED:spaceDistance(0,viewOrigin(s),s.fields);
    c.save();
    for(let i=0;i<Math.ceil(count);i++){
      const depth=i%5===0?.17:.065,x=noise(i+seed+4)*L.width;
      const y=L.topInset+((noise(i+seed+781)*span+travel*depth*this.scale)%span+span)%span;
      const size=i%23===0?1.5:i%5===0?1.1:.8;
      c.globalAlpha=clamp(count-i,0,1)*(.24+noise(i+seed+91)*.4);
      c.fillStyle=i%11===0?'#d8d0b8':'#a8b8c8';c.fillRect(Math.round(x),Math.round(y),size,size);
    }
    c.restore();
  }
  drawDistanceGrid(){
    const s=this.s,L=this.layout,lesson=isScrollingLevel(s)&&chapter(s).number===1&&s.campaign.lesson!=='engage';
    if(!s.fields.length&&!lesson&&!isTutorial(s)&&!this.debug)return;
    const origin=isBoss(s)?arenaZ(s,-70):viewOrigin(s),far=isBoss(s)?arenaZ(s,950):advanceThroughSpace(origin,1000*viewDirection(s),s.fields);
    for(let x=-300;x<=300;x+=100){const a=this.project(x,origin);this.line(a.x,L.top,a.x,L.bottom,'#a8b8c80a');}
    for(let z=Math.ceil(Math.min(origin,far)/180)*180;z<Math.max(origin,far);z+=180){const p=this.project(0,z);this.line(L.left,p.y,L.right,p.y,isTutorial(s)?'#a8b8c84c':'#a8b8c81c');}
  }
  drawArenaFrame(){
    const L=this.layout,c=this.ctx;
    if(isBoss(this.s)||isKleinRoute(this.s))return;
    this.line(L.left,L.top,L.left,L.bottom,'#8e7b4938');this.line(L.right,L.top,L.right,L.bottom,'#8e7b4938');
    for(const x of [L.left,L.right])for(const y of [L.top,L.bottom]){
      const dx=x===L.left?1:-1,dy=y===L.top?1:-1;
      this.line(x,y,x+dx*18,y,'#c5ad746b');this.line(x,y,x,y+dy*18,'#c5ad746b');
      c.fillStyle=REALM.brass;c.fillRect(x+dx*3-1,y+dy*3-1,2,2);
    }
  }
  drawFolds(){
    const s=this.s,c=this.ctx,L=this.layout;
    const boundaryVisible=z=>!isBoss(s)||(arenaY(s,z)>=KLEIN_BOUNDS.bottom-1e-8&&arenaY(s,z)<=KLEIN_BOUNDS.top+1e-8);
    for(const field of s.fields){
      const intervals=viewFieldIntervals(s,field.start,field.end);if(!intervals.length)continue;
      c.fillStyle='#e67f4e0a';
      for(const interval of intervals){
        const low=this.chartPoint(0,interval.start),high=this.chartPoint(0,interval.end);
        c.fillRect(L.left,high.y,L.arenaWidth,low.y-high.y);
      }
      const forward=viewDirection(s)===1;
      for(const [z,entrance] of [[field.start,forward],[field.end,!forward]]){
        if(!boundaryVisible(z))continue;const p=this.project(0,z);
        if(p.y<L.top||p.y>L.bottom)continue;
        const pulse=this.motion&&this.foldPulse?.field?.id===field.id?Math.max(0,1-(s.time-this.foldPulse.time)/.6):0;
        const wobble=this.motion?Math.sin(s.time*2+field.id)*1.2:0;
        this.line(L.left,p.y,L.right,p.y,entrance?'#e6965e50':'#e6965e28');
        c.beginPath();c.moveTo(L.left,p.y);c.bezierCurveTo(L.left+L.arenaWidth*.3,p.y-4-wobble,L.left+L.arenaWidth*.7,p.y+4+wobble,L.right,p.y);
        c.strokeStyle=pulse>.1?REALM.ivory:REALM.fold;c.lineWidth=1+pulse*1.3;c.stroke();
        this.sprite(entrance?'fold.entry':'fold.exit',L.left+10,p.y,16,16);
        if(entrance)this.label(`FOLD ${field.id}  ·  SHOTS ×2`,L.left+70,p.y-6,REALM.fold,9);
        else this.text(`END ${field.id}`,L.right-6,p.y-5,'#c18b6c',8,'right');
      }
    }
    if(this.foldPulse&&s.time-this.foldPulse.time<.7){
      const pulse=this.foldPulse,color=pulse.type==='fold'?REALM.fold:REALM.unfold;
      const age=(s.time-pulse.time)/.7;
      if(this.motion&&pulse.field){
        c.save();c.globalAlpha=1-age;
        const frame=this.art?.animationFrame?.(pulse.type==='fold'?'effect.fold':'effect.unfold',(s.time-pulse.time)*1000);
        for(const z of [pulse.field.start,pulse.field.end]){
          if(!boundaryVisible(z))continue;
          const p=this.project(s.x,z);this.line(L.left,p.y,L.right,p.y,color,1.5+age*3);
          if(frame)this.sprite(frame,p.x,p.y,54*this.scale);
        }
        c.restore();
      }
      if(!isTutorial(s))this.label(pulse.type==='fold'?'SPACE FOLDED':'SPACE RESTORED',L.centerX,L.top+23,color,10);
    }
  }
  drawKleinEdges(){
    const s=this.s,L=this.layout,c=this.ctx,sideColor='#c3b38b',phase=isHybridBoss(s)?(s.campaign.hybridPhase||1):0;
    const active=hybridProjectiveActive(s),arming=isHybridBoss(s)&&phase>=3&&!active;
    const projective=active||Boolean(chapter(s)?.projectiveSurface)||Boolean(chapter(s)?.projectiveBoss),hybrid=isHybridBoss(s)&&active;
    this.line(L.left+1,L.top,L.left+1,L.bottom,sideColor,1.5);this.line(L.right-1,L.top,L.right-1,L.bottom,sideColor,1.5);
    this.line(L.left,L.top+1,L.right,L.top+1,projective?REALM.projective:REALM.unfold,projective?2:1.5);
    this.line(L.left,L.bottom-1,L.right,L.bottom-1,projective?REALM.projective:REALM.unfold,projective?2:1.5);
    const topText=arming?'HYBRID JOIN ARMING · TOP/BOTTOM STILL PERIODIC':projective?(L.arenaWidth>270?'PROJECTIVE JOIN · TOP/BOTTOM ANTIPODAL':'PROJECTIVE TOP/BOTTOM'):(L.arenaWidth>270?'TOP ↔ BOTTOM · KEEP FACING':'TOP ↔ BOTTOM');
    this.label(topText,L.centerX,L.top+16,projective?REALM.projective:REALM.unfold,9);
    if(L.arenaWidth>300){
      const bottomText=hybrid?'HYBRID · KLEIN SIDES + PROJECTIVE TOP/BOTTOM':arming?'HYBRID INCOMING · KLEIN SIDES REMAIN':phase===2?'PROJECTIVE ANCHOR ONLY · PLAYER JOINS STILL KLEIN':isBoss(s)?'SIDES JOIN · FOLLOW THE MATCHING MARKS':'KLEIN SIDES · CAMERA TURNS WITH YOU';
      this.label(bottomText,L.centerX,L.bottom-8,hybrid?REALM.projective:sideColor,8);
    }
    if(phase)this.label(`GEOMETRY PHASE ${phase} / 4`,L.centerX,L.top+34,phase===1?sideColor:REALM.projective,8);
    // Klein side marks remain asymmetric and twisted.
    for(let mark=1;mark<=3;mark++){
      const fraction=.2+(mark-1)*.3;
      for(let tick=0;tick<mark;tick++){
        const offset=(tick-(mark-1)/2)*4;
        const leftMetric=950-1020*fraction,leftY=this.chartPoint(0,leftMetric).y;
        const rightY=this.chartPoint(0,isBoss(s)?bossSideDestinationY(s,leftMetric):880-leftMetric).y;
        this.line(L.left+2,leftY+offset,L.left+9,leftY+offset,sideColor,1.5);
        this.line(L.right-9,rightY-offset,L.right-2,rightY-offset,sideColor,1.5);
        const x=L.left+L.arenaWidth*fraction+offset;
        this.line(x,L.top+2,x,L.top+8,projective?REALM.projective:REALM.unfold,1.5);
        this.line(projective?L.right-(x-L.left):x,L.bottom-8,projective?L.right-(x-L.left):x,L.bottom-2,projective?REALM.projective:REALM.unfold,1.5);
      }
    }
    for(const x of [L.left+8,L.right-8]){
      this.sprite('edge.twist',x,(L.top+L.bottom)/2,12,24);
      if(!this.art?.image){c.save();c.setLineDash([2,4]);this.line(x,L.top+40,x,L.bottom-40,'#c3b38b50');c.restore();}
    }
    if(projective){
      // Opposed circles and a diagonal identify antipodal transport without relying on color.
      for(const x of [L.left+34,L.right-34]){
        this.circle(x,L.top+7,3,REALM.projective,1);this.circle(L.right-(x-L.left),L.bottom-7,3,REALM.projective,1);
      }
      this.line(L.centerX-7,L.top+5,L.centerX+7,L.top+11,REALM.projective,1);
      this.line(L.centerX+7,L.bottom-11,L.centerX-7,L.bottom-5,REALM.projective,1);
    }
  }
  drawReturns(){
    const s=this.s,c=this.ctx;
    for(const enemy of s.enemies){
      const cue=returnPreview(s,enemy);if(!cue)continue;
      const a=this.project(cue.source.x,cue.source.z),b=this.project(cue.destination.x,cue.destination.z);
      const radius=Math.max(8,19*this.scale),id=cue.name?.toUpperCase()||String(cue.id).slice(-3);
      c.save();c.setLineDash([2,3]);this.circle(b.x,b.y,radius,REALM.brass);c.restore();
      this.sprite('return.entry',b.x,b.y,18,18);this.sprite('return.exit',a.x,a.y+29*this.scale,14,14);
      this.label(`↳ ${id} · ${Math.ceil(cue.hp)} HP`,b.x,clamp(b.y+radius+13,this.layout.top+25,this.layout.bottom-13),REALM.brass,8);
      if(a.y>=this.layout.top&&a.y<=this.layout.bottom)this.text(`↳ ${id}`,a.x,a.y+43*this.scale,REALM.brass,8);
    }
  }
  /** Player and hostile join predictions share the combat engine's boundary maps.
   * Guidance is conditional on current motion; the player may still change course.
   */
  drawGeometryForecasts(){
    const s=this.s,L=this.layout,c=this.ctx;
    if(s.phase!=='running')return;
    const player=playerJoinForecast(s,{horizontalVelocity:this.horizontalVelocity,axialInput:s.lastAxialInput||0});
    if(player){
      const x=clamp(this.chartPoint(player.destination.x,player.destination.y).x,L.left+16,L.right-16);
      const y=player.edge==='left'||player.edge==='right'
        ? clamp(this.chartPoint(player.destination.x,player.destination.y).y,L.top+70,L.bottom-54)
        : player.edge==='top'?L.bottom-24:L.top+42;
      const col=player.rule==='projective'?REALM.projective:REALM.safe;
      this.circle(x,y,12,col,2);
      this.polygon([[x-4,y+3],[x,y-5],[x+4,y+3]],null,col,1.2);
      this.label('YOUR EXIT',x,clamp(y+23,L.top+40,L.bottom-12),col,8);
      const text=joinCueText(player);
      this.label(`CURRENT COURSE · ${text}`,L.centerX,L.top+51,col,9);
    }
    // Ghost projections are drawn with the actual shots below, from the same
    // movement forecast. Duplicating the edge marks here would imply two shots.
    const last=[...(s.events||[])].reverse().find(e=>e.type==='klein-crossing'&&e.actor==='player'&&e.time<=s.time+1e-8&&s.time-e.time<1.15);
    if(last){
      const label=last.rule==='projective'?'PROJECTIVE JOIN · X REFLECTED':
        last.edge==='left'||last.edge==='right'?'KLEIN JOIN · FORWARD REVERSED':'PERIODIC JOIN · FORWARD KEPT';
      this.label(label,L.centerX,L.bottom-46,last.rule==='projective'?REALM.projective:REALM.safe,9);
    }
  }

  drawRocks(){
    const s=this.s,c=this.ctx;
    for(const rock of s.asteroids||[]){
      if(rock.hp<=0||!inCombatView(this.view,rock)){rock.presented=false;continue;}
      // This acknowledges a real, uncovered draw, exactly as enemy presentation does.
      if(s.phase==='running')rock.presented=true;
      const p=this.project(rock.x,rock.z),radius=rock.radius*this.scale;
      const id=rock.radius>=27?'asteroid.large':rock.radius>=23?'asteroid.medium':'asteroid.small';
      if(!this.sprite(id,p.x,p.y,radius*2,radius*2)){
          const points=Array.from({length:10},(_,i)=>{const a=(rock.rotation||0)+i/10*TAU,r=radius*(.87+noise(i+(rock.shape||0))*.13);return [p.x+Math.cos(a)*r,p.y+Math.sin(a)*r];});
          this.polygon(points,'#44494d',REALM.brass);
          this.line(p.x-radius*.35,p.y-radius*.4,p.x+radius*.2,p.y+radius*.3,'#9c8c79');
      }
      if(rock.hp<(rock.maxHp||2)){this.line(p.x-radius*.15,p.y-radius*.65,p.x+radius*.2,p.y,REALM.ivory,.8);this.line(p.x+radius*.2,p.y,p.x-radius*.3,p.y+radius*.5,REALM.brass,.8);}
      if(rock.foldWake&&rock.wakeUntil>s.time){
        this.circle(p.x,p.y,radius+7*this.scale,REALM.fold,2);
        this.label('FOLD WAKE',p.x,p.y-radius-9,REALM.fold,8);
      }
      if(rock.hitUntil>s.time)this.circle(p.x,p.y,radius+2,REALM.ivory,1.5);
      if(this.debug)this.circle(p.x,p.y,radius,'#ff5050');
    }
  }
  drawDrops(){
    const s=this.s,c=this.ctx;
    for(const drop of s.drops||[]){
      if(drop.collected)continue;const p=this.project(drop.x,drop.z);
      if(p.y<this.layout.top-20||p.y>this.layout.bottom+20)continue;
      const color=OPERATIONS[drop.type].color,r=Math.max(7,14*this.scale),lift=this.motion?Math.sin(s.time*3+drop.id)*1.2:0;
      this.circle(p.x,p.y,r+3,color,.8);this.polygon([[p.x,p.y-r+lift],[p.x+r,p.y+lift],[p.x,p.y+r+lift],[p.x-r,p.y+lift]],REALM.panel,color);
      if(!this.sprite(`seed.${OPERATIONS[drop.type].code.toLowerCase()}`,p.x,p.y+lift,r*1.8,r*1.8))this.text(OPERATIONS[drop.type].code,p.x,p.y+3+lift,color,9);
      this.label(`${drop.polarity===1?'R':'L'} · ${OPERATIONS[drop.type].code}`,p.x,p.y-r-6,color,9);
    }
  }
  drawMissionPart(){
    const s=this.s,part=s.campaign?.repairPart;
    if(!isBoss(s)||!part||part.collected||!Number.isFinite(part.x)||!Number.isFinite(part.z))return;
    const p=this.project(part.x,part.z),L=this.layout;
    if(p.y<L.top-24||p.y>L.bottom+24)return;
    const r=Math.max(9,19*this.scale),pulse=this.motion?Math.sin(s.time*4)*1.5:0;
    const points=Array.from({length:6},(_,i)=>{const a=-Math.PI/2+i*TAU/6;return [p.x+Math.cos(a)*(r+3+pulse),p.y+Math.sin(a)*(r+3+pulse)];});
    this.polygon(points,REALM.panel,REALM.safe,1.5);
    if(part.id==='curvature-seed'){
      this.circle(p.x,p.y,r*.65,REALM.fold,2);this.circle(p.x,p.y,r*.32,REALM.projective,1.8);this.line(p.x-r*.48,p.y+r*.48,p.x+r*.48,p.y-r*.48,REALM.ivory,1.6);
    }else if(part.id==='projective-module'){
      this.circle(p.x,p.y,r*.62,REALM.projective,1.8);this.circle(p.x-r*.34,p.y,2.2,null,1,REALM.ivory);this.circle(p.x+r*.34,p.y,2.2,null,1,REALM.ivory);
      this.line(p.x-r*.34,p.y-r*.34,p.x+r*.34,p.y+r*.34,REALM.projective,1.4);
    }else{
      this.line(p.x-r*.35,p.y-r*.5,p.x-r*.35,p.y+r*.5,REALM.ivory,2);
      this.line(p.x+r*.35,p.y-r*.5,p.x+r*.35,p.y+r*.5,REALM.ivory,2);
      this.line(p.x-r*.35,p.y,p.x+r*.35,p.y,REALM.brass,2);
    }
    this.label(part.id==='curvature-seed'?'CURVATURE SEED · PICK UP':part.id==='projective-module'?'PROJECTIVE MODULE · PICK UP':'KLEIN RELAY · PICK UP',p.x,clamp(p.y-r-8,L.top+20,L.bottom-20),part.id==='projective-module'?REALM.projective:REALM.safe,9);
  }
  drawOperationCues(){
    const s=this.s,c=this.ctx;
    for(const [index,seed] of loadout(s).entries()){
      const cue=operationCuePosition(s,seed,index),p=this.project(cue.x,cue.z),color=OPERATIONS[seed.type].color;
      const size=Math.max(4,10*this.scale);
      this.polygon([[p.x-cue.side*size,p.y-size],[p.x,p.y],[p.x-cue.side*size,p.y+size]],null,color,1.2);
      const marker=this.project(s.x,cue.z);
      c.save();c.setLineDash([2,5]);this.line(marker.x+cue.side*12*this.scale,marker.y,p.x-cue.side*size,p.y,`${color}42`);c.restore();
      this.label(`${index+1} ${OPERATIONS[seed.type].code} · ${cue.side===1?'RIGHT':'LEFT'}`,p.x,p.y-10-index*14,color,8);
    }
  }
  drawGates(){
    const s=this.s,L=this.layout,c=this.ctx;
    for(const gate of s.gates||[]){
      const p=this.project(0,gate.z);if(p.y<L.top||p.y>L.bottom)continue;
      const a=this.project(gate.gap-gate.width/2,gate.z),b=this.project(gate.gap+gate.width/2,gate.z);
      c.fillStyle='#cfb87717';c.fillRect(L.left,p.y-7,a.x-L.left,14);c.fillRect(b.x,p.y-7,L.right-b.x,14);
      this.line(L.left,p.y,a.x,p.y,REALM.brass,3);this.line(b.x,p.y,L.right,p.y,REALM.brass,3);
      this.line(a.x,p.y-10,a.x,p.y+10,REALM.ivory,2);this.line(b.x,p.y-10,b.x,p.y+10,REALM.ivory,2);
      this.label('OPENING',(a.x+b.x)/2,p.y-12,REALM.ivory,9);
    }
    if(s.encounterIndex===2&&s.encounter&&!s.encounter.hit){
      const a=this.project(s.x-220,s.z+360),b=this.project(s.x+220,s.z+360);
      c.save();c.setLineDash([4,5]);this.line(a.x,a.y,b.x,b.y,REALM.danger,1);c.restore();
      this.label('SALVO AIM AFTER HIT',(a.x+b.x)/2,a.y-10,REALM.danger,9);
    }
  }
  drawTelegraphs(){
    const s=this.s,c=this.ctx;
    for(const enemy of s.enemies){
      if(enemy.hp<=0||!inCombatView(this.view,enemy)||!combatReady(this.view,enemy))continue;
      const t=enemy.telegraph;if(!t)continue;
      const remaining=t.remaining??Math.max(0,(t.until??s.time)-s.time),duration=t.phase==='burst'?(t.beatInterval||.2):(t.duration||.42);
      const progress=clamp(1-remaining/duration,0,1),p=this.project(enemy.x,enemy.z);
      const aimX=t.aimX??t.targetX??s.x,aimZ=t.aimZ??t.targetZ??s.z,q=this.project(aimX,aimZ);
      c.save();c.setLineDash([3,6]);
      if(t.previewShots?.length){
        // Short rays communicate the committed launch shape. They do not solve
        // the later return path or mark a permanent safe corridor.
        const reach=Math.max(23,90*this.scale),gain=1/metricAt(enemy.z,s.fields);
        for(const shot of t.previewShots){
          const vx=shot.vx||0,vy=(shot.vz||0)*gain*viewDirection(s),length=Math.hypot(vx,vy)||1,rule=shot.geometryRule||t.geometryRule||enemy.geometryRule||'klein';
          const cueColor=rule==='projective'?`${REALM.projective}a8`:rule==='hybrid'?'#e8c0ffb0':'#e8a07a8c';
          this.line(p.x,p.y,p.x+vx/length*reach,p.y-vy/length*reach,cueColor,rule==='hybrid'?1.6:1);
          if(rule!=='klein'){const ex=p.x+vx/length*reach,ey=p.y-vy/length*reach,r=3;rule==='projective'?this.circle(ex,ey,r,REALM.projective,1):this.polygon([[ex,ey-r],[ex+r,ey],[ex,ey+r],[ex-r,ey]],null,REALM.projective,1);}
        }
      }else{
        this.worldLine({x:enemy.x,z:enemy.z},{x:aimX,z:aimZ},'#e8a07a70',1);
        this.circle(q.x,q.y,Math.max(4,9*this.scale),'#e8a07a88');
      }
      c.restore();
      const r=Math.max(9,33*this.scale);this.circle(p.x,p.y,r,'#e8a07a38');
      c.beginPath();c.arc(p.x,p.y,r,-Math.PI/2,-Math.PI/2+TAU*progress);c.strokeStyle=REALM.fold;c.lineWidth=2;c.stroke();
      if(!enemy.boss){const rule=t.geometryRule||enemy.geometryRule||'klein',prefix=rule==='projective'?'P · ':rule==='hybrid'?'K+P · ':'';
        this.label(t.patternName?`${prefix}${t.patternName} · ${t.phase==='burst'?`${Math.min(t.beatCount||1,(t.beatIndex||0)+1)}/${t.beatCount||1}`:'LOCK'}`:`${prefix}AIM LOCK`,p.x,p.y+r+25,rule==='klein'?REALM.danger:REALM.projective,8);}
    }
  }
  drawShip(x,y,{enemy=false,facing=1,id=null,size=56,bank=0,charge=0,hit=0,exhaust=null}={}){
    const c=this.ctx,player=enemy?null:activeShip(this.s),base=id||(enemy?'enemy.gunner':player.sprite);
    const oriented=enemy?(facing===1?`${base}-up`:base):facing===-1?`${base}-down`:base;
    const w=size*this.scale;c.save();c.translate(x,y);if(bank)c.rotate(bank);
    if(this.motion){
      const engine=exhaust||player?.exhaust,relativeSize=engine?size/56:1;
      const length=(engine?.length||18)*(1+charge*.18)*relativeSize*this.scale,width=(engine?.width||10)*relativeSize*this.scale;
      const nozzles=engine?engine.nozzles.map(nozzle=>({x:nozzle.x*w/engine.nativeSize,y:nozzle.y*w/engine.nativeSize*facing})):[{x:0,y:size*.35*this.scale*facing}];
      const animation=`engine.${enemy?'enemy':'player'}-${facing===1?'down':'up'}`,frame=this.art?.animationFrame?.(animation,this.s.time*1000);
      for(const nozzle of nozzles){
        if(!frame||!this.sprite(frame,nozzle.x,nozzle.y+length/2*facing,width,length)){
          const outer=enemy?4*this.scale:width*.28,inner=enemy?1.5*this.scale:width*.11;
          this.polygon([[nozzle.x-outer,nozzle.y],[nozzle.x,nozzle.y+length*facing],[nozzle.x+outer,nozzle.y]],enemy?'#79aade80':'#e5b674b0');
          this.polygon([[nozzle.x-inner,nozzle.y],[nozzle.x,nozzle.y+length*.7*facing],[nozzle.x+inner,nozzle.y]],REALM.ivory);
        }
      }
    }
    if(hit>0)c.filter=`brightness(${1+hit*2.8}) saturate(${1-hit*.65})`;
    if(!this.sprite(oriented,0,0,w,w)){
      const k=w/48,orient=points=>points.map(([px,py])=>[px,py*facing]);
      this.polygon(orient([[0,-24*k],[-8*k,-3*k],[-23*k,18*k],[-9*k,13*k],[0,20*k],[9*k,13*k],[23*k,18*k],[8*k,-3*k]]),enemy?'#654a48':'#4c4448',REALM.brass,1);
      this.polygon(orient([[0,-17*k],[-4*k,6*k],[0,12*k],[4*k,6*k]]),REALM.ivory);
      this.line(-12*k,8*k*facing,-18*k,15*k*facing,REALM.ivory);this.line(12*k,8*k*facing,18*k,15*k*facing,REALM.ivory);
    }
    c.restore();
  }
  healthTrail(enemy,maxHp){
    const now=this.s.time,hit=this.enemyHits.get(String(enemy.id));
    let trail=this.healthTrails.get(enemy);
    if(!trail){
      trail={hp:enemy.hp,from:hit?Math.min(maxHp,enemy.hp+hit.amount):enemy.hp,at:hit?.time??-Infinity};
      this.healthTrails.set(enemy,trail);
    }
    const remaining=this.motion?clamp(1-(now-trail.at-.18)/.46,0,1):now-trail.at<.6?1:0;
    const visible=mix(trail.hp,trail.from,remaining);
    if(enemy.hp<trail.hp){trail.from=Math.max(visible,trail.hp);trail.at=now;trail.hp=enemy.hp;}
    else if(enemy.hp>trail.hp){trail.hp=enemy.hp;trail.from=enemy.hp;}
    return clamp(enemy.hp<trail.from&&now===trail.at?trail.from:visible,enemy.hp,maxHp);
  }
  drawEnemies(){
    const s=this.s,c=this.ctx;
    for(const enemy of s.enemies){
      if(enemy.hp<=0||enemy.escaped||enemy.stage>s.stage)continue;
      const p=this.project(enemy.x,enemy.z),visible=usesVisibleCombat(s)?inCombatView(this.view,enemy):p.y>this.layout.top&&p.y<this.layout.bottom;
      if(!visible)continue;
      presentEnemy(this.view,enemy);
      if(!this.enemyHull.has(enemy))this.enemyHull.set(enemy,enemy.maxHp||Math.max(enemy.hp,1));
      const ready=combatReady(this.view,enemy),maxHp=enemy.maxHp||this.enemyHull.get(enemy),size=enemy.boss?(enemy.name==='Core'?72:60):56;
      const impact=this.enemyHits.get(String(enemy.id)),age=impact?s.time-impact.time:enemy.hitUntil>s.time?Math.max(0,.15-(enemy.hitUntil-s.time)):Infinity;
      const flash=this.motion?clamp(1-age/.13,0,1):0,recoil=this.motion?mechanicalImpulse(age,Boolean(enemy.boss)):0;
      c.save();if(!ready)c.globalAlpha=.48;
      this.drawShip(p.x,p.y-recoil,{enemy:true,facing:isCampaign(s)?screenFacing(s,enemy):-1,id:enemyArt({...enemy,maxHp},isKleinRoute(s)||isKleinSurfaceRoute(s)),size,hit:flash});c.restore();
      const half=Math.max(12,size*this.scale*.52),barY=p.y+size*this.scale*.55+5;
      if(usesVisibleCombat(s)){
        const trailing=this.healthTrail(enemy,maxHp);
        c.fillStyle='#030506ef';c.fillRect(p.x-half-1,barY-1,half*2+2,6);
        if(ready&&trailing>enemy.hp){c.fillStyle=REALM.danger;c.fillRect(p.x-half,barY,half*2*clamp(trailing/maxHp,0,1),4);}
        c.fillStyle=ready?REALM.brass:REALM.unfold;c.fillRect(p.x-half,barY,half*2*(ready?clamp(enemy.hp/maxHp,0,1):clamp((enemy.visibleFor||0)/ENTRY_TIME,0,1)),3);
        if(!ready)this.label(enemy.loopCount?`RETURN ${enemy.id} · ${Math.ceil(enemy.hp)} HP`:'ENTERING',p.x,barY+15,REALM.unfold,8);
        else if(enemy.boss){
          const t=enemy.telegraph,pattern=this.options.patternLabels&&t?.patternName?` · ${t.patternName}${t.phase==='burst'?` ${Math.min(t.beatCount||1,(t.beatIndex||0)+1)}/${t.beatCount||1}`:' LOCK'}`:t?' · AIM LOCK':'';
          this.label(`${Math.ceil(enemy.hp)} / ${maxHp}${pattern}`,p.x,barY+13,t?REALM.danger:REALM.ivory,8);
        }
      }
      if(enemy.foldWake&&enemy.wakeUntil>s.time){
        this.circle(p.x,p.y,size*.55*this.scale+5,REALM.fold,1.7);
        this.label('FOLD WAKE',p.x,p.y-size*.46*this.scale-8,REALM.fold,8);
      }
      if(age>=0&&age<(this.motion?.24:.45)||enemy.hitUntil>s.time){
        c.save();c.globalAlpha=this.motion?clamp(1-age/.24,0,1):.8;
        this.circle(p.x,p.y,size*.44*this.scale+2+(this.motion?Math.min(age,.24)*28:0),REALM.ivory,this.motion?2:1.3);c.restore();
      }
      if(enemy.dropsUpgrade||isTutorial(s)){
        const seeds=loadout(enemy),tag=seeds.map(seed=>`${OPERATIONS[seed.type].code}${seed.polarity===1?'R':'L'}`).join(' · ');
        if(tag)this.label(tag,p.x,p.y-size*this.scale*.55-7,REALM.ivory,9);
        if(enemy.name)this.label(enemy.name.toUpperCase(),p.x,p.y-size*this.scale*.55-(tag?22:7),REALM.brass,8);
        if(enemy.name==='Klein Warden'&&enemy.specialPhase)this.label(`WARDEN PHASE ${enemy.specialPhase}`,p.x,p.y+size*this.scale*.62+29,REALM.fold,8);
      }
      if(enemy.shield){
        const open=targetOpen(s),r=34*this.scale;c.save();c.setLineDash(open?[2,5]:[]);this.circle(p.x,p.y,r,open?REALM.safe:REALM.brass,2);c.restore();
        this.label(open?'TARGET OPEN':'SHIELD CLOSED',p.x,p.y+r+18,open?REALM.safe:REALM.brass,9);
      }
      if(this.debug)this.circle(p.x,p.y,26*this.scale,'#ff5050');
    }
  }
  drawEffects(){
    const s=this.s,c=this.ctx;
    for(const effect of s.effects||[]){
      if(effect.start>s.time)continue;
      const age=clamp((s.time-effect.start)/(effect.until-effect.start||1),0,1),p=this.project(effect.x,effect.z),defeat=effect.type==='defeat'||effect.type==='asteroid';
      c.save();c.globalAlpha=1-age;
      if(this.motion){
        const radius=(8+age*(defeat?52:24))*this.scale;
        this.circle(p.x,p.y,radius,effect.color||(defeat?REALM.fold:REALM.ivory),defeat?1.5:1);
        const animation=effect.type==='asteroid'?'asteroid.break':defeat?'effect.explosion':'effect.hit';
        const frame=this.art?.animationFrame?.(animation,(s.time-effect.start)*1000);if(frame)this.sprite(frame,p.x,p.y,(defeat?65:38)*this.scale);
      }else this.circle(p.x,p.y,22*this.scale,effect.color||REALM.ivory,1.3);
      if(defeat&&effect.points)this.label(`+${effect.points}`,p.x,p.y-25*this.scale-(this.motion?age*10:0),REALM.ivory,12);
      c.restore();
    }
    if(!this.motion)return;
    for(const event of this.visualEvents){
      const age=s.time-event.time;if(age<0||age>.45)continue;
      const animation=event.type==='player-fire'||event.type==='enemy-fire'?'effect.muzzle':event.type==='damage'?'effect.hit':event.type==='impact-absorbed'||event.type==='contact-absorbed'?'effect.absorb':event.type==='operation'&&event.typeId===0?'effect.warp':null;
      if(event.type==='miniboss-phase'){
        const point=this.eventPoint(event),p=this.project(point.x,point.z),radius=(18+age*90)*this.scale;
        c.save();c.globalAlpha=1-age/.45;this.circle(p.x,p.y,radius,REALM.fold,2);this.circle(p.x,p.y,radius*.72,REALM.unfold,1);c.restore();continue;
      }
      if(event.type==='fold-entry'||event.type==='fold-exit'){
        const point=this.eventPoint(event),p=this.project(point.x,point.z),radius=(8+age*34)*this.scale;
        c.save();c.globalAlpha=1-age/.45;this.circle(p.x,p.y,radius,event.type==='fold-entry'?REALM.fold:REALM.unfold,1.4);c.restore();continue;
      }
      if(!animation)continue;
      const frame=this.art?.animationFrame?.(animation,age*1000);if(!frame)continue;
      const point=this.eventPoint(event),p=this.project(point.x,point.z),size=(animation==='effect.muzzle'?22:44)*this.scale;
      this.sprite(frame,p.x,p.y,size,size);
    }
  }
  drawPayload(payload,x,y){
    const c=this.ctx,badges=payloadBadges(payload),unit=12,gap=3,total=badges.length*unit+Math.max(0,badges.length-1)*gap;
    badges.forEach((badge,i)=>{
      const bx=x-total/2+i*(unit+gap);c.fillStyle='#080a0ced';c.fillRect(bx,y-9,unit,12);c.strokeStyle=`${badge.color}a8`;c.lineWidth=.7;c.strokeRect(bx+.5,y-8.5,unit-1,11);
      this.text(badge.code,bx+unit/2,y,badge.color,8);
    });
  }
  /** Geometry glyph is independent of whether the mark is a real shot or
   * an informational projection. All shape encodings work without color.
   */
  drawManifoldMark(x,y,r,rule,{ghost=false}={}){
    const c=this.ctx,mark=MANIFOLD_MARKS[rule]||MANIFOLD_MARKS.klein;
    c.save();c.strokeStyle=mark.color;c.lineWidth=ghost?1.1:1.4;
    if(ghost)c.setLineDash([2,2]);
    this.circle(x,y,r+2,mark.color,ghost?1:1.4);
    c.setLineDash([]);
    if(rule==='klein'||rule==='hybrid')this.line(x-r*.55,y-r*.75,x+r*.05,y-r*.20,mark.color,1.4);
    if(rule==='projective'||rule==='hybrid'){
      this.line(x-r*.65,y,x-r*.22,y,mark.color,1.4);
      this.line(x+r*.22,y,x+r*.65,y,mark.color,1.4);
    }
    if(rule==='periodic'){
      this.line(x-r*.5,y-r*.32,x+r*.5,y-r*.32,mark.color,1);
      this.line(x-r*.5,y+r*.32,x+r*.5,y+r*.32,mark.color,1);
    }
    c.restore();
  }
  /** These previews are render-only; no extra shot enters s.enemyShots.
   * Never ghost the real hitbox merely because a chart image is reflected.
   */
  drawManifoldPreviews(){
    const s=this.s,L=this.layout,c=this.ctx;
    if(!this.options.manifoldCues||s.phase!=='running'||!(isBoss(s)||isKleinSurfaceRoute(s)))return;
    // Keep projection work bounded in later bullet-heaven swarms. Candidates
    // nearest an actual chart edge get priority; we never mutate or cull shots.
    const edgeDistance=shot=>{
      const y=arenaY(s,shot.z);
      return Math.min(Math.abs(KLEIN_BOUNDS.right-shot.x),Math.abs(shot.x-KLEIN_BOUNDS.left),
        Math.abs(KLEIN_BOUNDS.top-y),Math.abs(y-KLEIN_BOUNDS.bottom));
    };
    const candidates=(s.enemyShots||[]).filter(shot=>!shot.dead&&Number.isFinite(shot.x)&&Number.isFinite(shot.z))
      .sort((a,b)=>edgeDistance(a)-edgeDistance(b)).slice(0,96);
    const previews=candidates.map(shot=>projectileJoinPreview(s,{
      ...shot,vx:shot.vx??0,vz:shot.vz??-145},{horizon:1.05})).filter(Boolean)
      .sort((a,b)=>a.timeSeconds-b.timeSeconds).slice(0,3);
    for(const preview of previews){
      const p=this.chartPoint(preview.destination.x,preview.destination.y);
      const x=clamp(p.x,L.left+14,L.right-14),y=clamp(p.y,L.top+25,L.bottom-23);
      const color=preview.mark.color,r=Math.max(5,7*this.scale);
      c.save();c.globalAlpha=preview.status==='imminent'?.9:.52;
      c.setLineDash([3,4]);this.line(x-13*this.scale,y+13*this.scale,x,y,color,1.2);c.setLineDash([]);
      this.circle(x,y,r,color,preview.status==='imminent'?2:1.3);
      this.drawManifoldMark(x,y,r,preview.topology,{ghost:true});
      this.text(preview.classCode,x,y-11*this.scale,color,8);
      c.restore();
      // Only the imminent cue receives a time label. The ring itself is a
      // hollow future-location marker, not an additional collidable bullet.
      if(preview.status==='imminent')this.label(`${preview.classCode} JOIN ~${preview.timeSeconds.toFixed(1)}s`,
        clamp(x,L.left+73,L.right-73),clamp(y-19,L.top+48,L.bottom-30),color,8);
    }
  }
  drawManifoldStatus(){
    const s=this.s,L=this.layout,c=this.ctx;
    if(!this.options.manifoldCues)return;
    const info=manifoldFrameIndicator(s);if(!info)return;
    const x=L.left+10,y=L.bottom-17;
    const text=`${info.mark} · FRAME ${info.physicalForward} · ● LIVE / ○ FUTURE`;
    const fontSize=L.arenaWidth<280?7:8;
    c.save();c.font=`${fontSize}px ${CANVAS_FONT}`;const width=c.measureText(text).width+12;
    c.fillStyle='#070d12e3';c.fillRect(x-4,y-16,Math.min(L.arenaWidth-18,width),23);
    this.text(text,x,y,info.color,fontSize,'left');
    c.restore();
  }
  drawShots(){
    const s=this.s,c=this.ctx,L=this.layout;
    const draw=(shot,enemy)=>{
      if(shot.dead)return;const p=this.project(shot.x,shot.z);if(p.y<L.top-35||p.y>L.bottom+35)return;
      const boost=1/metricAt(shot.z,s.fields),vx=shot.vx||0,vz=shot.vz??(enemy?-145:680),speed=Math.hypot(vx,vz)||1,dx=vx/speed,dy=-vz*(isKleinSurfaceRoute(s)?1:viewDirection(s))/speed;
      const rule=(isBoss(s)||isKleinSurfaceRoute(s))?projectileManifoldRule(s,shot):(shot.geometryRule||'route'),geometryColor=rule==='projective'?REALM.projective:rule==='hybrid'?'#e8c0ff':null;
      const baseColor=geometryColor||(enemy?(payloadBadges(shot.payload)[0]?.color||REALM.danger):REALM.ivory);
      const depth=shot.foldDepth??0,color=depth?REALM.fold:baseColor,transitionAge=Number.isFinite(shot.foldChangedAt)?s.time-shot.foldChangedAt:Infinity;
      if(shot.salvo){
        const a=this.project(shot.x-shot.halfWidth,shot.z),b=this.project(shot.x+shot.halfWidth,shot.z);
        c.fillStyle='#e67f4e24';c.fillRect(a.x,p.y-14*this.scale,b.x-a.x,28*this.scale);this.line(a.x,p.y,b.x,p.y,REALM.fold,Math.max(2,6*this.scale));
        this.line(a.x,p.y-18*this.scale,a.x,p.y+18*this.scale,REALM.ivory,1);this.line(b.x,p.y-18*this.scale,b.x,p.y+18*this.scale,REALM.ivory,1);
        this.label(`SALVO · SHOTS ×${boost}`,p.x,p.y-14,REALM.danger,9);return;
      }
      if(this.motion&&!(shot.hold>0)){
        const length=(enemy?15:23)*this.scale*(1+Math.min(3,boost-1)*.55);
        c.save();c.globalAlpha=depth?.55:.35;this.line(p.x-dx*length,p.y-dy*length,p.x,p.y,color,(enemy?1.5:2)+(depth?depth*.45:0));
        if(depth){c.globalAlpha=.22;this.line(p.x-dx*length*.55-dy*3,p.y-dy*length*.55+dx*3,p.x-dy*3,p.y+dx*3,REALM.ivory,1);}
        c.restore();
      }
      if(depth){
        const multiplier=2**depth,r=Math.max(4,(5+depth*2)*this.scale);
        c.save();c.globalAlpha=transitionAge<.25?1:depth?0.72:0;this.circle(p.x,p.y,r,REALM.fold,transitionAge<.25?1.8:1);c.restore();
        if(transitionAge<.32)this.label(`FOLD ×${multiplier}`,p.x,p.y-12*this.scale,REALM.fold,8);
      }
      if(enemy){
        const r=Math.max(2.8,(shot.damage>1?8:5)*this.scale);
        if(rule==='projective')this.polygon([[p.x,p.y-r],[p.x+r,p.y],[p.x,p.y+r],[p.x-r,p.y]],color,REALM.ivory,.8);
        else if(rule==='hybrid'){this.circle(p.x,p.y,r,REALM.projective,1,color);this.polygon([[p.x,p.y-r*.72],[p.x+r*.72,p.y],[p.x,p.y+r*.72],[p.x-r*.72,p.y]],null,REALM.ivory,.8);}
        else this.circle(p.x,p.y,r,REALM.ivory,.7,color);
        if(shot.payload?.length)this.drawPayload(shot.payload,p.x,p.y-r-5);
        if(isBoss(s)||isKleinSurfaceRoute(s))this.drawManifoldMark(p.x,p.y,r,rule);
        if(Number.isFinite(shot.lastCrossingAt)&&s.time-shot.lastCrossingAt<.22&&s.time-shot.lastCrossingAt>=0){
          c.save();c.globalAlpha=this.motion?.9:.6;this.circle(p.x,p.y,r+5,MANIFOLD_MARKS[rule]?.color||REALM.safe,1.5);c.restore();
        }
        if(shot.damage>1)this.text(`×${shot.damage}`,p.x+r+7,p.y+3,REALM.fold,8);
      }else{
        c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(dy,dx)+Math.PI/2);
        if(!this.sprite('shot.player',0,0,Math.max(3,7*this.scale),18*this.scale))this.line(0,5*this.scale,0,-8*this.scale,REALM.ivory,2);c.restore();
      }
      if(shot.hold>0){this.circle(p.x,p.y,Math.max(7,13*this.scale),REALM.unfold,1);this.text('Ⅱ',p.x+12,p.y+3,REALM.unfold,10);}
      if(shot.impactDelay>0)this.circle(p.x,p.y,Math.max(5,9*this.scale),REALM.brass,.8);
    };
    for(const shot of s.shots||[])draw(shot,false);for(const shot of s.enemyShots||[])draw(shot,true);
  }
  drawExit(){
    const s=this.s,extraction=isBoss(s)&&s.campaign.bossPhase==='exit'&&s.campaign.exit;
    if(isCampaign(s)&&!isScrollingLevel(s)&&!extraction)return;
    const p=extraction?this.chartPoint(0,s.campaign.exit.remaining):this.project(0,isScrollingLevel(s)?chapter(s).routeLength:ROUTE_LENGTH),L=this.layout;
    if(p.y<L.top||p.y>L.bottom)return;
    this.line(L.left,p.y,L.right,p.y,REALM.safe,1.5);
    for(let i=0;i<8;i++){const x=L.left+(i+.5)*L.arenaWidth/8;this.polygon([[x-3,p.y+6],[x,p.y+2],[x+3,p.y+6]],null,REALM.safe);}
    this.label(extraction?`EXIT · ${s.campaign.repairPart?.id==='curvature-seed'?'SEED':s.campaign.repairPart?.id==='projective-module'?'MODULE':'RELAY'} SECURED`:isScrollingLevel(s)?'ROUTE COMPLETE AHEAD':'EXIT',L.centerX,p.y-11,REALM.safe,11);
  }
  drawPlayer(){
    const s=this.s,c=this.ctx,p=this.project(s.x,s.z),facing=isCampaign(s)?screenFacing(s):1,ship=activeShip(s);
    const firing=Math.max(0,1-(s.time-this.lastFire)/.1),recoil=(this.response?.recoilPixels||0)*this.scale;
    const impactAge=this.playerHit?s.time-this.playerHit.time:Infinity,impact=this.motion?clamp(1-impactAge/.16,0,1):0;
    c.save();if(s.invulnerable>0)c.globalAlpha=.76;
    this.drawShip(p.x,p.y+recoil*facing,{id:ship.sprite,exhaust:ship.exhaust,facing,bank:this.bank,size:56,charge:firing,hit:impact});c.restore();
    // This fixed ring shows the real collision radius; cosmetic recoil never moves it.
    const coreRadius=ship.coreRadius,showCore=this.options.showCore||s.invulnerable>0;
    if(showCore){
      this.circle(p.x,p.y,coreRadius*this.scale,s.invulnerable>0?REALM.unfold:'#e4d4a0c8',s.invulnerable>0?1.8:1.1);
      this.circle(p.x,p.y,Math.max(1.6,2.5*this.scale),null,1,REALM.ivory);
      if(this.options.showCore){const arm=Math.max(3,5*this.scale);this.line(p.x-arm,p.y,p.x+arm,p.y,'#f0e4bd80',.7);this.line(p.x,p.y-arm,p.x,p.y+arm,'#f0e4bd80',.7);}
    }else this.circle(p.x,p.y,Math.max(1.1,2*this.scale),null,1,REALM.ivory);
    if(impactAge>=0&&impactAge<.5){
      c.save();c.globalAlpha=this.motion?1-impactAge/.5:.85;
      this.circle(p.x,p.y,(this.motion?24+impactAge*75:30)*this.scale,REALM.danger,this.motion?2.5:1.5);c.restore();
    }
    if(isBoss(s)){
      const y=p.y-42*this.scale*facing,r=Math.max(3,6*this.scale);
      this.polygon([[p.x-r,y+r*facing],[p.x,y],[p.x+r,y+r*facing]],null,REALM.safe,1.2);
    }
    if(s.invulnerable>0){
      if(this.motion){const frame=this.art?.animationFrame?.('effect.shield',s.time*1000);if(frame)this.sprite(frame,p.x,p.y,56*this.scale);}
      c.save();c.setLineDash([3,4]);this.circle(p.x,p.y,26*this.scale,'#79aade80');c.restore();
      this.text('PROTECTED',p.x,p.y+38*this.scale+5,REALM.unfold,8);
    }
    if(this.debug)this.circle(p.x,p.y,coreRadius*this.scale,'#ff5050');
  }
  drawDamageBorder(){
    const age=this.playerHit?this.s.time-this.playerHit.time:Infinity;if(age<0||age>=.55)return;
    const c=this.ctx,L=this.layout,strength=this.motion?(this.response?.damage??Math.pow(1-age/.55,1.5)):.42;
    // A narrow perimeter cue leaves the middle and incoming aim warnings clear.
    c.save();c.globalAlpha=strength;
    for(let inset=0;inset<18;inset+=3){
      c.strokeStyle=`rgba(240,128,91,${.18*(1-inset/18)})`;c.lineWidth=3;
      c.strokeRect(L.left+inset+1.5,L.top+inset+1.5,L.arenaWidth-inset*2-3,L.arenaHeight-inset*2-3);
    }
    c.strokeStyle=REALM.danger;c.lineWidth=2;c.strokeRect(L.left+1,L.top+1,L.arenaWidth-2,L.arenaHeight-2);c.restore();
  }
  drawParticles(){
    if(!this.motion)return;const c=this.ctx,s=this.s;
    for(const particle of this.particles){
      const t=s.time-particle.time;if(t<0||t>=particle.life)continue;
      const age=t/particle.life,z=advanceThroughSpace(particle.z,particle.vy*t,s.fields),p=this.project(particle.x+particle.vx*t,z),size=Math.max(1,particle.size*this.scale);
      c.save();c.globalAlpha=(1-age)*(particle.kind==='debris'?.8:1);c.fillStyle=particle.color;
      if(particle.kind==='debris'||particle.kind==='rock'){c.translate(p.x,p.y);c.rotate(t*5);c.fillRect(-size/2,-size/2,size,size*1.8);}
      else this.line(p.x,p.y,p.x-particle.vx*.025*this.scale,p.y+particle.vy*viewDirection(s)*.025*this.scale,particle.color,size);
      c.restore();
    }
  }
  drawFeedback(){
    const s=this.s,c=this.ctx,occupied=[];
    for(const message of this.messages){
      const actor=message.actor==='player'?s:s.enemies.find(enemy=>`enemy-${enemy.id}`===message.actor);
      if(!actor||actor.hp<=0||actor.escaped||message.actor!=='player'&&!inCombatView(this.view,actor))continue;
      const p=this.project(actor.x,actor.z),age=(s.time-message.time)/message.duration;
      const caption=message.text+(message.kind==='counter-bypass'&&message.count>1?` (${message.count})`:''),fontSize=8;
      c.font=`${fontSize}px ${CANVAS_FONT}`;
      const width=c.measureText(caption).width+12,side=p.x>this.layout.centerX?-1:1;
      const x=clamp(p.x+side*(width/2+34*this.scale+8),this.layout.left+width/2+4,this.layout.right-width/2-4);
      let y=clamp(p.y+4,this.layout.top+18,this.layout.bottom-18);
      for(const row of occupied)if(Math.abs(row.x-x)<(row.width+width)/2+5&&Math.abs(row.y-y)<18)y=row.y-18;
      y=clamp(y,this.layout.top+14,this.layout.bottom-18);occupied.push({x,y,width});
      c.save();c.globalAlpha=Math.min(1,(1-age)*4);
      this.line(p.x+side*27*this.scale,p.y,x-side*width/2,y-3,`${message.color}66`,.7);
      this.label(caption,x,y,message.color,fontSize);c.restore();
    }
    for(const event of this.visualEvents){
      if(event.type!=='operation'||event.typeId!==0||!event.from||!event.to||event.time>s.time+1e-8||s.time-event.time>.3)continue;
      const a=this.project(event.from.x,event.from.z),b=this.project(event.to.x,event.to.z);
      this.circle(a.x,a.y,Math.max(4,8*this.scale),'#b8a6ed90');this.circle(b.x,b.y,Math.max(4,8*this.scale),'#b8a6ed');
      if(this.motion){c.save();c.setLineDash([2,5]);this.worldLine(event.from,event.to,'#b8a6ed66');c.restore();}
    }
  }
  drawDebt(){
    const s=this.s,groups=new Map();
    for(const debt of s.debts||[]){
      const key=debt.target,group=groups.get(key)||{amount:0,due:Infinity};group.amount+=debt.amount;group.due=Math.min(group.due,debt.due);groups.set(key,group);
    }
    for(const [target,debt] of groups){
      const actor=target==='player'?s:s.enemies.find(e=>e.id===target);if(!actor||target!=='player'&&!inCombatView(this.view,actor))continue;
      const p=this.project(actor.x,actor.z),r=(target==='player'?29:35)*this.scale;
      this.circle(p.x,p.y,r,REALM.fold,1.4);
      const due=Math.max(0,debt.due-s.time).toFixed(1);
      this.label(`DEBT ${debt.amount} · ${due}s`,p.x,p.y+r+16,REALM.fold,9);
    }
  }
  drawReferenceCue(){
    const s=this.s;if(s.mode!=='timing')return;
    const enemy=s.enemies.find(e=>e.hp>0&&e.shield);if(!enemy)return;
    const p=this.project(enemy.x,enemy.z);if(p.y>=this.layout.top)return;
    this.label(targetOpen(s)?'↑ TARGET AHEAD · OPEN':'↑ TARGET AHEAD · SHIELD CLOSED',this.layout.centerX,this.layout.top+35,targetOpen(s)?REALM.safe:REALM.brass,9);
  }
  /** A brief, nonblocking message makes the first geometry unlock a payoff.
   * The reward is NOT banked until extraction has actually succeeded.
   */
  drawMilestone(){
    const s=this.s;if(!isBoss(s))return;
    const recent=[...(s.events||[])].reverse().find(e=>
      ['boss-defeated','drive-part-collected','boss-extracted'].includes(e.type)&&e.time<=s.time+1e-8&&s.time-e.time<2.5);
    if(!recent)return;
    const L=this.layout,relay=s.campaign?.repairPart?.id==='klein-relay'||
      (s.campaign?.index===8),name=relay?'KLEIN RELAY':s.campaign?.repairPart?.id==='projective-module'?'PROJECTIVE MODULE':'CURVATURE SEED';
    const headline=recent.type==='boss-defeated'?`${name} EXPOSED`:recent.type==='boss-extracted'?`${name} BANKED`:`${name} ABOARD`;
    const sub=recent.type==='boss-defeated'?'Recover the physical component.':recent.type==='boss-extracted'&&relay?'Klein traversal unlocked for the next flight.':recent.type==='drive-part-collected'?'Cross the extraction line to bank it.':'';
    const y=L.top+93,col=relay?REALM.safe:REALM.projective;
    this.label(headline,L.centerX,y,col,14);
    if(sub)this.label(sub,L.centerX,y+20,REALM.ivory,10);
  }
  drawCountdown(){
    const s=this.s,L=this.layout;if(!(s.countdown>0&&s.phase==='running'))return;
    const y=L.top+L.arenaHeight*.45;
    this.circle(L.centerX,y-14,36,REALM.brass,1,null);this.text(String(Math.ceil(s.countdown)),L.centerX,y,REALM.ivory,36);
    this.label('GET READY',L.centerX,y+49,REALM.brass,11);
  }
}
