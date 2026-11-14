/** Fresh-profile browser probe. All game actions use ordinary browser input. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,appendFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const args=process.argv.slice(2).filter(value=>!value.startsWith('--'));
const project=resolve(import.meta.dirname,'..'),root=resolve(args[0]||project);
const out=resolve(args[1]||join(project,'reports/campaign-concept-review/full-browser'));
const resumeArgument=process.argv.find(value=>value.startsWith('--resume-snapshot='));
const resumePath=resumeArgument?resolve(resumeArgument.slice('--resume-snapshot='.length)):null;
const virtual=!process.argv.includes('--real-time'),maxRetries=Number(process.env.ASS_PILOT_RETRIES||8);
const maxSeconds=Number(process.env.ASS_PILOT_SECONDS||4800),decisionMs=Number(process.env.ASS_PILOT_STEP_MS||50);
const load=name=>import(pathToFileURL(join(root,'src',name)).href);
const [{chapter,isBoss,isTutorial,isKleinSurfaceRoute,arenaY},{viewY},{metricAt},{traceKlein,traceProjectiveSurface},{quotientAim,quotientDistance,ACT4_STAGES}]=await Promise.all([
  load('campaign.js'),load('combat-view.js'),load('space.js'),load('klein.js'),load('hyperbolic-campaign.js')]);
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const report={root,started:new Date().toISOString(),method:'Fresh isolated browser storage. Keyboard steering, held manual fire, capture, release, fold, and ordinary page controls. State APIs and localStorage are read only. No QA route, profile seed, position, hull, invulnerability, spawn, damage, or simulation setter is used.',
  clock:virtual?'Playwright browser virtual clock. Each step runs scheduled browser frames. Audio remains a separate clock.':'Browser wall clock.',
  limits:'State-informed automated input is not human play or a perception test. Threat forecasts use local approximations. A loss or timeout can be a controller limit. Virtual time does not establish physical reaction time, audio synchronization, listening quality, or device frame rate.',
  result:'incomplete',sections:[],attempts:[],checks:[],errors:[],badRequests:[],inputCounts:{},damageObservations:[],observedSeconds:0,decisionMs,readbackEventLimit:200};
report.sourceHashes=Object.fromEntries(await Promise.all(['src/build.js','src/app.js','src/simulation.js','src/campaign.js','src/hyperbolic-act.js','src/hyperbolic-campaign.js','src/repair-app.js','src/repair.js','src/audio.js'].map(async path=>[path,createHash('sha256').update(await readFile(join(root,path))).digest('hex')])));
let browser,page,context,base,held=new Set(),clockReady=false,attempt=0,current=null,sectionStart=0,sectionWall=0,lastControl=0,lastKit='',reloadDone=false,act4Stage=null,act4Start=0,previousMain=null,actFlags={},hullKey='',lastHull=0,nextProgress=10;
const wallStart=Date.now();
const save=async()=>writeFile(join(out,'results.json'),JSON.stringify({...report,wallSeconds:+((Date.now()-wallStart)/1000).toFixed(2)},null,2)+'\n');
const log=async value=>{console.log(JSON.stringify(value));await appendFile(join(out,'events.jsonl'),JSON.stringify({wall:new Date().toISOString(),...value})+'\n');};
const check=(label,value)=>{assert.ok(value,label);report.checks.push(label);};
const key=async(name,on)=>{if(on&&!held.has(name)){await page.keyboard.down(name);held.add(name);report.inputCounts[name]=(report.inputCounts[name]||0)+1;}else if(!on&&held.has(name)){await page.keyboard.up(name);held.delete(name);}};
const release=async()=>{for(const name of [...held])await key(name,false);};
const press=async name=>{await key(name,false);await page.keyboard.press(name);report.inputCounts[name]=(report.inputCounts[name]||0)+1;};
const advance=async(ms=page?.url().includes('repair-dock.html')?25:page?.url().includes('hyperbolic-act.html')?Math.min(50,decisionMs):decisionMs)=>{if(virtual)await page.clock.runFor(ms);else await page.waitForTimeout(ms);report.observedSeconds+=ms/1000;};
const click=async selector=>{
  await release();
  const button=page.locator(selector);
  for(let wait=0;wait<30&&(!await button.isVisible()||!await button.isEnabled());wait++)await advance(50);
  check(`Visible enabled control: ${selector}`,await button.isVisible()&&await button.isEnabled());
  // The virtual clock is stopped. Native pointer input bypasses only the frame stability wait.
  await button.click({force:virtual});await advance(35);
};
const initClock=async()=>{
  if(!virtual)return;
  if(!clockReady){await page.clock.install();clockReady=true;}
  await page.clock.pauseAt(new Date(Date.now()+1000));
};
const api=async name=>page.evaluate(name=>!!window[name],name);
const mainRead=()=>page.evaluate(()=>{const snapshot=window.arrowSpaceShift.read();snapshot.events=snapshot.events.slice(-200);return snapshot;});
const actRead=()=>page.evaluate(()=>window.arrowSpaceShiftActFour.read());
const repairRead=()=>page.evaluate(()=>window.arrowSpaceShiftRepair.read());
const waitReady=async(predicate,label)=>{
  for(let i=0;i<200;i++){
    try{if(await page.evaluate(predicate))return;}catch{}
    await advance(50);await new Promise(resolve=>setTimeout(resolve,5));
  }
  throw new Error(`${label} readiness timeout.`);
};
const screenshot=async name=>{await page.screenshot({path:join(out,name+'.png')});};
const wrap=x=>((x+400)%800+800)%800-400;
async function observe(s,scope,index,hull){
  const identity=`${scope}:${index}:${attempt}`;
  if(identity!==hullKey){hullKey=identity;lastHull=hull;}
  if(hull<lastHull){const entry={scope,index,attempt:attempt+1,time:s.time,from:lastHull,to:hull,events:s.events.filter(e=>['damage','hit','defeat'].includes(e.type))};report.damageObservations.push(entry);await log({damage:entry});}
  lastHull=hull;
  if(report.observedSeconds>=nextProgress){nextProgress=report.observedSeconds+10;report.progress={scope,index,attempt:attempt+1,phase:s.phase,time:s.time,hull};await log({progress:report.progress});await save();}
}

async function chooseKit(s){
  const signature=`${s.campaign.index}:${s.slotCount}`;if(lastKit===signature)return;lastKit=signature;
  const choices=[s.inventory.find(item=>item.type===1&&item.polarity===1),s.inventory.find(item=>item.type===5&&item.polarity===-1)];
  const changed=choices.some((item,i)=>item&&i<s.slotCount&&s.equipped[i]?.key!==item.key);if(!changed)return;
  await click('#open-equipment');
  for(let i=0;i<choices.length&&i<s.slotCount;i++)if(choices[i]&&s.equipped[i]?.key!==choices[i].key){
    await click(i?'#slot-two':'#slot-one');
    await click(`#inventory button[data-seed="${choices[i].key}"]`);
  }
  await click('#equipment-dialog [data-close]');await click('#primary');await page.locator('#space').focus();
}
function mainControl(s){
  const c=s.campaign,elapsed=c.elapsed;
  if(isTutorial(s))return {horizontal:c.lesson==='move'?(c.movement.left<28?-1:1):Math.abs(s.x)>2?-Math.sign(s.x):0,fire:['shoot','engage'].includes(c.lesson),action:c.lesson==='fold'?'ShiftLeft':c.lesson==='unfold'?'ShiftRight':null};
  if(s.fields.length)return {horizontal:0,action:'ShiftRight'};
  const boss=isBoss(s),surface=isKleinSurfaceRoute(s),shipY=arenaY(s,s.z),facing=s.facing||1,part=c.repairPart;
  if(boss&&c.bossPhase!=='combat'){const goal=part&&!part.collected?part.x:0;return {horizontal:Math.abs(goal-s.x)>4?Math.sign(goal-s.x):0};}
  const enemies=s.enemies.filter(e=>e.hp>0&&e.visible);
  const target=enemies.filter(e=>viewY(s,e.z)>45).sort((a,b)=>viewY(s,a.z)-viewY(s,b.z))[0]||enemies[0];
  const lead=target?Math.max(.05,Math.min(1.1,Math.abs(viewY(s,target.z))/(770-Math.abs(target.driftY||0)))):0;
  const targetX=target?Math.max(-340,Math.min(340,boss||surface?wrap(target.x+(target.driftX||0)*lead):target.x+(target.driftX||0)*lead)):Math.sin(elapsed*.7+attempt)*230;
  const shots=s.projectiles.enemy.filter(x=>!x.dead),rocks=s.asteroids.filter(x=>x.hp>0),speed=s.ship?.speed||360;
  let best=null;
  for(const horizontal of [-1,0,1]){
    let cost=0;
    for(const t of [.08,.18,.3,.45,.65]){
      const x=Math.max(-345,Math.min(345,s.x+horizontal*speed*t)),y=boss?shipY+facing*90*t:shipY;
      for(const b of shots){
        const gain=1/metricAt(b.z,s.fields),dx=(b.vx||0)*gain*t,dy=(b.vz??-145)*gain*t;
        const p=boss||surface?(b.geometryRule==='projective'?traceProjectiveSurface:traceKlein)({x:b.x,y:arenaY(s,b.z)},dx,dy-(surface?facing*90*t:0)):{x:b.x+dx,y:arenaY(s,b.z)+dy-90*t};
        const d=Math.hypot(x-p.x,y-p.y);cost+=d<34?40000*(1-t):d<100?180*(100-d)/(100+100*t):0;
      }
      for(const e of enemies){const d=Math.hypot(x-e.x-(e.driftX||0)*t,y-arenaY(s,e.z)-(e.driftY||0)*t+(surface?facing*90*t:boss?0:90*t));if(d<45)cost+=40000*(1-t);}
      for(const r of rocks){const d=Math.hypot(x-r.x,arenaY(s,r.z)-90*t-y);if(d<(r.radius||25)+25)cost+=25000*(1-t);}
    }
    cost+=Math.abs(Math.max(-345,Math.min(345,s.x+horizontal*90))-targetX)*.15+(horizontal===lastControl?0:2);
    cost+=horizontal*Math.sin(elapsed*.9+attempt*2)*attempt*.7;
    if(!best||cost<best.cost)best={horizontal,cost};
  }
  lastControl=best.horizontal;return {horizontal:best.horizontal,fire:true,capture:true,release:Math.abs(s.x-targetX)<65};
}
async function applyMain(control){
  await key('ArrowLeft',control.horizontal<0);await key('ArrowRight',control.horizontal>0);await key('Space',!!control.fire);await key('c',!!control.capture);await key('e',!!control.release);
  if(control.action)await press(control.action);
}
function mainResult(s,result){return {chapter:current,name:s.campaign.chapter.name,attempt:attempt+1,result,hull:s.hull,seconds:+(s.time-sectionStart).toFixed(2),wallSeconds:+((Date.now()-sectionWall)/1000).toFixed(2),score:s.score,kills:s.kills,boss:s.campaign.bossPhase||null,part:s.campaign.repairPart||null,damage:s.events.filter(e=>e.type==='damage'&&e.time>=sectionStart),deathRecap:s.deathRecap||null};}
async function recordMain(s,result){const entry=mainResult(s,result);report.attempts.push(entry);if(result!=='lost')report.sections.push(entry);await log(entry);await save();}

try{
  base=await new Promise((accept,reject)=>{let value='';const timer=setTimeout(()=>reject(new Error('Server startup timeout.')),10000);server.stdout.on('data',chunk=>{value+=chunk;const match=value.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});server.on('error',reject);});
  browser=await chromium.launch({headless:true,channel:'msedge'});report.browserVersion=browser.version();context=await browser.newContext({viewport:{width:1280,height:900}});page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(error.message));page.on('response',res=>{if(res.status()>=400)report.badRequests.push({status:res.status(),url:res.url()});});
  await page.goto(base);await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  check('Fresh isolated context has no earned journey',await page.evaluate(()=>!localStorage.getItem('arrow-space-shift:journey:v1')));
  check('No QA mutation API is exposed',!await api('arrowSpaceShiftTest'));
  await initClock();await screenshot('fresh-title');
  if(resumePath){
    const previous=JSON.parse(await readFile(resumePath,'utf8'));
    check('Continuation snapshot came from earned main-campaign extraction',previous.sections?.some(item=>item.chapter===26&&item.result==='extracted')&&!!previous.storage);
    const {exportProgress}=await load('progress-transfer.js');
    const payload=exportProgress({getItem:key=>previous.storage[key]??null});
    const payloadPath=join(out,'earned-progress-recovery.json'),payloadText=JSON.stringify(payload,null,2)+'\n';await writeFile(payloadPath,payloadText);
    report.continuation={previous:resumePath,previousSourceHashes:previous.sourceHashes,payloadPath,payloadSha256:createHash('sha256').update(payloadText).digest('hex'),source:'Exact saved records captured from the preceding fresh-profile browser run. The original export function builds the file. The normal import file control applies it. No part, unlock, score, or health value is invented.'};
    check('Recovery retains the three earned component receipts',JSON.stringify(payload.journey.parts)===JSON.stringify(JSON.parse(previous.storage['arrow-space-shift:journey:v1']).parts));
    await click('#open-options');await page.locator('#import-progress').setInputFiles(payloadPath);await advance(100);
    check('Normal import accepts the earned snapshot',await page.locator('#progress-transfer-status').textContent().then(text=>text.startsWith('Progress imported.')));
    await click('#options-dialog [data-close]');
    await Promise.all([page.waitForURL('**/hyperbolic-act.html'),click('#continue-act4')]);
  }else{await click('#primary');await page.locator('#space').focus();}
  while(report.observedSeconds<maxSeconds){
    if(!page.url().endsWith('/')&&!page.url().endsWith('index.html'))break;
    const s=await mainRead();
    await observe(s,'main',s.campaign.index,s.hull);
    if(current!==s.campaign.index){
      if(current===-1&&s.campaign.index===0&&previousMain)await recordMain(previousMain,'automatic tutorial clear');
      if(current!==null)await log({transition:{from:current,to:s.campaign.index,phase:s.phase,seed:s.runSeed,hull:s.hull}});
      current=s.campaign.index;attempt=0;sectionStart=s.time;sectionWall=Date.now();lastKit='';
      if(isBoss(s))await screenshot(`main-boss-${current}-entry`);
    }
    previousMain=s;
    if(s.phase==='choosing'){
      await release();const priority=['echo-ward','wide-net','quick-return','split-echo','deep-chamber','echo-focus','projective-twin','echo-orbit'];
      const id=priority.find(id=>s.projective.offers.includes(id))||s.projective.offers[0];await click(`[data-evolution="${id}"]`);await page.locator('#space').focus();continue;
    }
    if(s.phase==='lost'){
      await release();await recordMain(s,'lost');await screenshot(`main-${current}-loss-${attempt+1}`);if(attempt++>=maxRetries)throw new Error(`Main chapter ${current} retry limit.`);
      await click('#primary');sectionStart=(await mainRead()).time;sectionWall=Date.now();lastKit='';continue;
    }
    if(s.phase==='cleared'){
      await release();await recordMain(s,'cleared');await advance(3100);continue;
    }
    if(s.phase==='won'){
      await release();await recordMain(s,'extracted');await screenshot(`main-boss-${current}-extracted`);
      check(`Boss ${current} rewards require physical pickup`,s.campaign.repairPart?.collected===true);
      if(current===8){await click('#fleet-ships button[data-ship="0"]');}
      if(current===26)await Promise.all([page.waitForURL('**/hyperbolic-act.html'),click('#primary')]);
      else await click('#primary');await advance(50);continue;
    }
    if(s.phase==='paused'){await click('#primary');continue;}
    if(s.phase==='ready'){await click('#primary');continue;}
    if(s.phase!=='running')throw new Error(`Unexpected main phase ${s.phase}.`);
    if(s.time-sectionStart>240)throw new Error(`Main chapter ${current} controller timeout.`);
    if(current===9&&!reloadDone&&s.campaign.elapsed>2){
      await release();await press('p');const before=await mainRead();await page.reload();await waitReady(()=>window.arrowSpaceShift?.assets().ready,'Main checkpoint');await advance(50);
      const after=await mainRead();check('Earned Act II checkpoint survives reload',after.campaign.index===before.campaign.index&&after.runSeed===before.runSeed);
      report.checkpointReload={before:{chapter:before.campaign.index,phase:before.phase,seed:before.runSeed,hull:before.hull},after:{chapter:after.campaign.index,phase:after.phase,seed:after.runSeed,hull:after.hull}};
      reloadDone=true;lastKit='';continue;
    }
    await chooseKit(s);await applyMain(mainControl(s));await advance();
  }
  check('Earned campaign transition opens Act IV',page.url().includes('hyperbolic-act.html'));
  await waitReady(()=>!!window.arrowSpaceShiftActFour,'Act IV');await screenshot('act-four-earned-entry');await click('#launch');
  current=null;attempt=0;
  while(report.observedSeconds<maxSeconds){
    const s=await actRead();
    await observe(s,'act-four',s.stageIndex,s.player.hull);
    if(act4Stage!==s.stageIndex){act4Stage=s.stageIndex;attempt=0;act4Start=s.time;actFlags={};sectionWall=Date.now();await log({actFourStage:s.stageIndex+1,phase:s.phase,hull:s.player.hull,score:s.score});}
    for(const event of s.events)actFlags[event.type]=true;
    if(s.phase==='lost'){
      await release();const entry={actFour:s.stageIndex+1,attempt:attempt+1,result:'lost',seconds:s.time,hull:s.player.hull,events:s.events};report.attempts.push(entry);await log(entry);await save();
      if(attempt++>=maxRetries)throw new Error(`Act IV stage ${s.stageIndex+1} retry limit.`);actFlags={};await click('#launch');continue;
    }
    if(s.phase==='cleared'||s.phase==='won'){
      await release();const entry={actFour:s.stageIndex+1,attempt:attempt+1,result:s.phase,seconds:s.time,hull:s.player.hull,score:s.score,reward:s.finalReward,events:s.events};report.sections.push(entry);await log(entry);await save();
      await screenshot(`act-four-${s.stageIndex+1}-clear`);if(s.phase==='won')break;await click('#next');continue;
    }
    if(s.phase==='ready'){await click('#launch');continue;}
    if(s.paused){await press('p');continue;}
    if(s.time-act4Start>240)throw new Error(`Act IV stage ${s.stageIndex+1} controller timeout.`);
    const reward=s.finalReward;
    if(reward&&['exposed','collected'].includes(reward.state)&&!(report.coreStages||[]).some(item=>item.state===reward.state)){
      const banked=await page.evaluate(()=>!!JSON.parse(localStorage.getItem('arrow-space-shift:journey:v1')||'null')?.parts?.['hyperbolic-core']);
      check(`Core ${reward.state} is not yet banked`,!banked);(report.coreStages||=[]).push({state:reward.state,time:s.time,hull:s.player.hull});
      await screenshot(`earned-core-${reward.state}`);
    }
    let target=reward?.state==='exposed'?reward.position:reward?.state==='collected'?reward.extractionPosition:null;
    if(!target&&s.enemies.length)target=[...s.enemies].sort((a,b)=>quotientDistance(s.player.position,a.position)-quotientDistance(s.player.position,b.position))[0].position;
    const needCross=!!ACT4_STAGES[s.stageIndex].require?.crossings&&!actFlags['player-crossing'];
    const needCapture=!!ACT4_STAGES[s.stageIndex].require?.captures&&!actFlags.capture;
    if(s.stageIndex===4&&!actFlags.fold)await press('ShiftLeft');
    if(needCross){
      await key('ArrowLeft',false);await key('ArrowRight',false);await key('ArrowDown',false);await key('ArrowUp',true);await key('Space',false);
      if(s.shots.some(shot=>shot.team==='enemy'&&quotientDistance(s.player.position,shot.position)<.3))await press('c');
      await advance();continue;
    }
    if(!target){await key('ArrowUp',needCross);await key('ArrowDown',false);await key('Space',false);await advance();continue;}
    const d=quotientAim(s.player.position,target),h=s.player.heading,error=Math.atan2(h.x*d.y-h.y*d.x,h.x*d.x+h.y*d.y),distance=quotientDistance(s.player.position,target);
    const threat=s.shots.filter(x=>x.team==='enemy').reduce((m,b)=>Math.min(m,quotientDistance(s.player.position,b.position)),Infinity);
    await key('ArrowLeft',error>.055);await key('ArrowRight',error<-.055);
    await key('Space',!reward&&!needCapture&&Math.abs(error)<.15);
    await key('ArrowUp',reward?Math.abs(error)<.35&&distance>.06:needCross||threat>=.45&&distance>1);
    await key('ArrowDown',!reward&&!needCross&&threat<.45);
    if(threat<.3)await press('c');if(s.echoes>0&&Math.abs(error)<.15)await press('e');
    await advance();
  }
  const finalAct=await actRead();check('Double Torus core is physically extracted',finalAct.phase==='won'&&finalAct.finalReward?.state==='extracted');
  await Promise.all([page.waitForURL('**/repair-dock.html'),click('#return')]);await waitReady(()=>window.arrowSpaceShiftRepair?.assets().ready,'Repair dock');await screenshot('earned-repair-dock');
  check('All four earned components permit assembly',await page.locator('#assemble').isVisible());await click('#assemble');
  let r=await repairRead();check('Assembly does not complete the campaign',r.journey.assembled&&!r.journey.activated&&!r.journey.completed);await click('#dock-launch');
  while(report.observedSeconds<maxSeconds){
    r=await repairRead();if(r.phase==='complete')break;
    if(r.paused){await click('#dock-launch');continue;}
    const goal=r.stageIndex===0?-220:r.stageIndex===1?220:r.echoCount?-180:120;
    await key('ArrowLeft',r.phase==='running'&&r.x>goal+5);await key('ArrowRight',r.phase==='running'&&r.x<goal-5);
    if(r.stageIndex===0&&!r.fields.length)await press('ShiftLeft');
    await key('Space',r.phase==='running'&&r.stageIndex<2&&Math.abs(r.x-goal)<10);
    await key('c',r.phase==='running'&&r.stageIndex===2&&!r.echoCount&&Math.abs(r.x-goal)<10);
    if(r.phase==='running'&&r.stageIndex===2&&r.echoCount&&Math.abs(r.x-goal)<10)await press('e');
    if(r.phase==='ending'&&!report.activation){report.activation={journey:r.journey,charged:r.charged,events:r.events};await screenshot('earned-activation');}
    await advance();
  }
  await release();r=await repairRead();check('Played repair and visible ending complete the campaign',r.phase==='complete'&&r.journey.completed);await screenshot('earned-ending');report.finalJourney=r.journey;
  await page.reload();await waitReady(()=>!!window.arrowSpaceShiftRepair,'Completed repair');check('Completion survives reload',(await repairRead()).journey.completed);
  await page.goto(base);await waitReady(()=>!!window.arrowSpaceShift,'Completed title');check('Main title recognizes earned completion',await page.locator('#campaign-completion').isVisible());await screenshot('completion-title');
  check('No browser exception occurred',report.errors.length===0);check('All requested resources loaded',report.badRequests.length===0);
  report.result=resumePath?'Earned-profile ordinary-input continuation completed':'Fresh-profile ordinary-input full campaign completed';
}catch(error){report.failure=error.stack||error.message;console.error(error.message);if(page)try{await screenshot('failure');report.finalUrl=page.url();report.finalState=await page.evaluate(()=>window.arrowSpaceShiftActFour?.read()||window.arrowSpaceShiftRepair?.read()||window.arrowSpaceShift?.read()||null);}catch{}}
finally{
  if(page)try{await release();report.storage=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));}catch{}
  await save();await browser?.close();server.kill();console.log(JSON.stringify({result:report.result,sections:report.sections.length,seconds:report.observedSeconds,failure:report.failure||null,out}));if(report.failure)process.exitCode=1;
}
