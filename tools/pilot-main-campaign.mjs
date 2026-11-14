/** Normal-action feasibility probe. No damage, spawn, position, or hull overrides. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createFlight,tick,STEP,recordEvent,readFlight} from '../src/simulation.js';
import {chapter,isBoss,isTutorial,isKleinSurfaceRoute,arenaY,continueCampaign,continueAfterBoss,retryCampaign} from '../src/campaign.js';
import {FlightRenderer} from '../src/renderer.js';
import {viewY,inCombatView} from '../src/combat-view.js';
import {addFold,removeFold,metricAt} from '../src/space.js';
import {equipSeed} from '../src/upgrades.js';
import {chooseEvolution} from '../src/ecology.js';
import {traceKlein,traceProjectiveSurface} from '../src/klein.js';
import {createJourney,recordBankedPart,setActFourBridge,bankFinalComponent,assembleDrive,activateDrive,completeRepair,saveJourney,loadJourney} from '../src/journey.js';
import {seedActFourBridge,restoreActFour,startActFour,stepActFour,nextActFour,finalComponentReceipt} from '../src/hyperbolic-campaign.js';
import {createRepair,startRepair,stepRepair,repairAction} from '../src/repair.js';
import {pilotInput} from './pilot-act-four.mjs';
const output=resolve(process.argv[2]||'reports/completion-0.25.0-dev.1/main-pilot.json');
const seed=Number(process.argv[3]||2026)>>>0,maxRetries=Number(process.argv[4]||3);
const gradient={addColorStop(){}};
const ctx=new Proxy({measureText:value=>({width:String(value).length*7}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},
 {get:(o,key)=>key in o?o[key]:()=>{},set:(o,key,value)=>(o[key]=value,true)});
const renderer=new FlightRenderer(ctx,null,{juice:false,reducedMotion:true,manifoldCues:false});
const s=createFlight('campaign',{seed});s.view={width:1100,height:820,topInset:110,bottomInset:106};
const journey=createJourney();
// This is the same launch state change as the Start button. Later transitions use campaign APIs.
s.phase='running';
const attempts=[],sections=[],inputCounts={fireTicks:0,captureTicks:0,releaseTicks:0,folds:0,unfolds:0,equipmentChanges:0,evolutionChoices:0};
let counter=0,attempt=0,current=-1,entryTime=0,wall=0,lastControl={},lastDecision=-1,lastKit='';
const wrap=x=>((x+400)%800+800)%800-400;
function chooseKit(){
 const signature=`${s.campaign.index}:${s.slotCount}`;if(signature===lastKit)return;lastKit=signature;
 const first=s.inventory.find(x=>x.type===1&&x.polarity===1),second=s.inventory.find(x=>x.type===5&&x.polarity===-1);
 if(first&&equipSeed(s,first.key,0))inputCounts.equipmentChanges++;
 if(second&&s.slotCount>1&&equipSeed(s,second.key,1))inputCounts.equipmentChanges++;
}
function controls(){
 const elapsed=s.time-s.campaign.startedAt;
 if(isTutorial(s)){
  const lesson=s.campaign.lesson;
  if(lesson==='move')return {horizontal:s.campaign.movement.left<28?-1:1};
  if(lesson==='fold'){if(addFold(s)){recordEvent(s,'fold',{fields:s.fields.length});inputCounts.folds++;}}
  if(lesson==='unfold'){if(removeFold(s)){recordEvent(s,'unfold',{fields:s.fields.length});inputCounts.unfolds++;}}
  return {horizontal:Math.abs(s.x)>2?-Math.sign(s.x):0,fire:lesson==='shoot'||lesson==='engage'};
 }
 while(s.fields.length){if(!removeFold(s))break;recordEvent(s,'unfold',{fields:s.fields.length});inputCounts.unfolds++;}
 chooseKit();
 const boss=isBoss(s),surface=isKleinSurfaceRoute(s),shipY=arenaY(s,s.z),facing=s.facing||1;
 const part=s.campaign.repairPart;
 if(boss&&s.campaign.bossPhase!=='combat'){
  // Forward travel reaches every arena height. Lateral steering reaches the real pickup.
  const target=part&&!part.collected?part.x:0;
  return {horizontal:Math.abs(target-s.x)>4?Math.sign(target-s.x):0,fire:false};
 }
 const enemies=s.enemies.filter(e=>e.hp>0&&inCombatView(s,e));
 const target=enemies.filter(e=>viewY(s,e.z)>45).sort((a,b)=>viewY(s,a.z)-viewY(s,b.z))[0]||enemies[0];
 const lead=target?Math.max(.05,Math.min(1.1,Math.abs(viewY(s,target.z))/(680+90-Math.abs(target.driftY||0)))):0;
 const targetX=target?Math.max(-340,Math.min(340,boss||surface?wrap(target.x+(target.driftX||0)*lead):target.x+(target.driftX||0)*lead)):Math.sin(elapsed*.7+attempt)*230;
 const shots=s.enemyShots.filter(x=>!x.dead),rocks=s.asteroids.filter(x=>x.hp>0);
 let best=null;
 for(const horizontal of [-1,0,1]){
  let cost=0;
  for(const t of [.08,.18,.3,.45,.65]){
   const x=Math.max(-345,Math.min(345,s.x+horizontal*360*t));
   const y=boss?shipY+facing*90*t:shipY;
   for(const b of shots){
    const gain=1/metricAt(b.z,s.fields),dx=(b.vx||0)*gain*t,dy=(b.vz??-145)*gain*t;
    let p;
    if(boss||surface){const trace=b.geometryRule==='projective'?traceProjectiveSurface:traceKlein;p=trace({x:b.x,y:arenaY(s,b.z)},dx,dy-(surface?facing*90*t:0));}
    else p={x:b.x+dx,y:arenaY(s,b.z)+dy-90*t};
    const d=Math.hypot(x-p.x,y-p.y);
    cost+=d<34?40000*(1-t):d<100?180*(100-d)/(100+100*t):0;
   }
   for(const e of enemies){
    const ex=e.x+(e.driftX||0)*t,ey=arenaY(s,e.z)+(e.driftY||0)*t-(surface?facing*90*t:boss?0:90*t);
    const d=Math.hypot(x-ex,y-ey);if(d<45)cost+=40000*(1-t);
   }
   for(const r of rocks){const d=Math.hypot(x-r.x,arenaY(s,r.z)-90*t-y);if(d<(r.radius||25)+25)cost+=25000*(1-t);}
  }
  const nextX=Math.max(-345,Math.min(345,s.x+horizontal*90));
  cost+=Math.abs(nextX-targetX)*.15+(horizontal===lastControl.horizontal?0:2);
  // Small repeatable variations let a section retry try another legal approach.
  cost+=horizontal*Math.sin(elapsed*.9+attempt*2)*attempt*.7;
  if(!best||cost<best.cost)best={horizontal,cost};
 }
 return {horizontal:best.horizontal,fire:true,capture:true,release:Math.abs(s.x-targetX)<65};
}
function recordAttempt(result){
 const damage=s.events.filter(e=>e.type==='damage'&&e.time>=entryTime).map(e=>({time:e.time,source:e.source,reason:e.reason,hull:e.hull}));
 const value={chapter:current,name:current===-1?'Flight controls':chapter(s).name,attempt:attempt+1,result,hull:s.hull,seconds:+(s.time-entryTime).toFixed(2),score:s.score,kills:s.kills,damage,
  boss:s.campaign.bossPhase||null,remainingEnemies:s.enemies.filter(e=>e.hp>0).map(e=>({name:e.name,hp:e.hp})),cause:s.deathRecap||null};
 attempts.push(value);return value;
}
while(counter++<120*2400){
 if(current!==s.campaign.index){if(current===-1&&s.campaign.index===0)sections.push({chapter:-1,name:'Flight controls',result:'automatic tutorial clear',hull:s.hull});current=s.campaign.index;attempt=0;entryTime=s.time;lastDecision=-1;lastKit='';}
 if(s.phase==='choosing'){
  const priorities=['echo-ward','wide-net','quick-return','split-echo','deep-chamber','echo-focus','projective-twin','echo-orbit'];
  const selected=priorities.find(id=>s.projective.offers.includes(id));if(!chooseEvolution(s,selected))break;inputCounts.evolutionChoices++;
 }
 if(s.phase==='lost'){
  recordAttempt('lost');if(attempt>=maxRetries)break;attempt++;retryCampaign(s);entryTime=s.time;lastDecision=-1;lastKit='';continue;
 }
 if(s.phase==='cleared'){
  sections.push(recordAttempt('cleared'));continueCampaign(s);continue;
 }
 if(s.phase==='won'){
  sections.push(recordAttempt('extracted'));
  const part=s.campaign.repairPart;
  if(part?.collected)recordBankedPart(journey,{id:part.id,source:'campaign-extraction',chapter:s.campaign.index,
    exposed:true,collected:true,extracted:true,seed:s.runSeed,shipId:s.shipId,score:s.score});
  if(s.campaign.index===26){
    setActFourBridge(journey,{shipId:s.shipId,seed:s.runSeed,score:s.score,echoes:s.projective?.echoes||0,
      inventory:s.inventory,equipped:s.equipped.map(item=>item?.key||null)});break;
  }
  if(!continueAfterBoss(s,s.shipId))break;continue;
 }
 if(s.phase!=='running')break;
 if(s.time-entryTime>240){recordAttempt('controller timeout');break;}
 if(lastDecision<0||s.time-lastDecision>=.05){lastControl=controls();lastDecision=s.time;}
 if(lastControl.fire)inputCounts.fireTicks++;if(lastControl.capture)inputCounts.captureTicks++;if(lastControl.release)inputCounts.releaseTicks++;
 tick(s,lastControl,STEP);
 if(counter%4===0)renderer.render(s,{width:1100,height:820,dt:1/30,flash:0});
}
const final=readFlight(s);
const actFourEntry=journey.actFourBridge?restoreActFour(seedActFourBridge(null,journey.actFourBridge)):null;
const report={version:'0.25.0-dev.1',seed,method:'Normal-health deterministic simulation. Uses launch/continue/retry, legal movement, held manual fire, equipment API, authored fold/unfold, and capture/release. Real FlightRenderer runs against a no-output canvas proxy to preserve its visibility acknowledgement. No enemies or projectiles are removed by the controller. No position, health, invulnerability, or damage is edited.',
 limits:'This is not browser input, human play, or a fairness proof. Threat forecasts are approximate and do not solve the geometry globally. A loss or timeout can be a controller limitation. Each retry is recorded.',
 result:final.phase==='won'&&final.campaign.index===26?'Acts I–III extracted':'incomplete controller attempt',
 completedSections:sections.length,sections,attempts,inputCounts,journey,
 actFourEntry:actFourEntry?{stageIndex:actFourEntry.stageIndex,score:actFourEntry.score,echoes:actFourEntry.echoes,shipId:actFourEntry.shipId,seed:actFourEntry.seed,inventory:actFourEntry.inventory,equipped:actFourEntry.equipped}:null,
 final:{chapter:final.campaign.index,name:final.campaign.chapter.name,phase:final.phase,hull:final.hull,time:final.time,score:final.score,parts:final.fleetProfile.driveParts,deathRecap:final.deathRecap}};
if(process.argv.includes('--full')&&actFourEntry){
 const chain={actFour:[],assembled:false,activated:false,completed:false,persisted:false};report.fullChain=chain;
 let game=actFourEntry;
 for(let stage=0;stage<9;stage++){
  startActFour(game);
  while(game.phase==='running'&&game.time<180)stepActFour(game,pilotInput(game),1/60);
  chain.actFour.push({stage:stage+1,phase:game.phase,hull:game.player.hull,time:game.time,score:game.score,echoes:game.echoes,reward:game.finalReward?.state||null});
  if(!['cleared','won'].includes(game.phase))break;
  if(stage<8)game=nextActFour(game);
 }
 const receipt=finalComponentReceipt(game);
 if(receipt&&bankFinalComponent(journey,receipt)&&assembleDrive(journey)){
  chain.assembled=true;
  const repair=createRepair({shipId:game.shipId});startRepair(repair);
  for(let frame=0;frame<120*45&&repair.phase==='running';frame++){
   const goal=repair.stageIndex===0?-220:repair.stageIndex===1?220:repair.echoCount?-180:120;
   if(repair.stageIndex===0&&!repair.fields.length)repairAction(repair,'fold');
   stepRepair(repair,{horizontal:Math.abs(goal-repair.x)<2?0:Math.sign(goal-repair.x),
    fire:repair.stageIndex<2&&Math.abs(goal-repair.x)<3,capture:repair.stageIndex===2&&!repair.echoCount,
    release:repair.stageIndex===2&&repair.echoCount>0&&Math.abs(goal-repair.x)<3},1/120);
  }
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  if(repair.phase==='ending'){
   chain.activated=activateDrive(journey,repair);saveJourney(journey,storage);
   chain.activationReload={activated:loadJourney(storage).activated,completed:loadJourney(storage).completed};
   for(let frame=0;frame<120*9&&repair.phase==='ending';frame++)stepRepair(repair,{},1/120);
   chain.completed=completeRepair(journey,repair);saveJourney(journey,storage);chain.persisted=loadJourney(storage).completed;
  }
  chain.repair={phase:repair.phase,seconds:repair.time,endingSeconds:repair.endingTime,charged:repair.charged,
    actualKleinCrossings:repair.events.filter(e=>e.type==='klein-crossing').length,
    captures:repair.events.filter(e=>e.type==='echo-captured').length,releases:repair.events.filter(e=>e.type==='echo-released').length};
  chain.savedJourney=loadJourney(storage);
 }
 report.result=chain.persisted?'Fresh-profile complete simulation chain':'incomplete full-chain controller attempt';
}
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,result:report.result,sections:sections.length,attempts:attempts.length,final:report.final},null,2));
