import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(process.argv[2]||resolve(import.meta.dirname,'..'));
const output=resolve(process.argv[3]||join(root,'reports/three-act-dev5/browser'));
await mkdir(output,{recursive:true});
const load=name=>import(pathToFileURL(join(root,'src',name)).href);
const [{createFleetProfile},{createJourney,syncLegacyParts,bankFinalComponent,setActFourBridge,JOURNEY_KEY},{FLEET_KEY,PREFS_KEY,SAVE_KEY,DEFAULT_PREFERENCES,checkpointFromFlight},{ACT4_SAVE_KEY},{createFlight},{enterChapter}]=await Promise.all([
  load('fleet.js'),load('journey.js'),load('storage.js'),load('hyperbolic-campaign.js'),load('simulation.js'),load('campaign.js')]);
const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module','curvature-seed'],craftedShipIds:[3],selectedShip:3});
const journey=createJourney();syncLegacyParts(journey,profile);
setActFourBridge(journey,{shipId:0,seed:47,score:900,echoes:3,inventory:[],equipped:[null,null]});
bankFinalComponent(journey,{id:'hyperbolic-core',source:'double-torus',stage:8,seed:47,shipId:0,score:1900,exposed:true,collected:true,extracted:true});
journey.assembled=true;journey.activated=true;journey.completed=true;journey.endingSeen=true;
const oldStore={
  [FLEET_KEY]:JSON.stringify(profile),
  [JOURNEY_KEY]:JSON.stringify(journey),
  [ACT4_SAVE_KEY]:JSON.stringify({version:2,unlocked:8,resumeStage:8,score:900,completed:true,entries:{8:{score:900,echoes:3,seed:47}}}),
  [PREFS_KEY]:JSON.stringify({version:1,...DEFAULT_PREFERENCES,sound:false,music:false}),
};
const report={root,candidate:JSON.parse(await readFile(join(root,'package.json'),'utf8')).version,
  method:'Isolated headless Edge. A supplied old-profile fixture checks hidden entries and storage retention. A separate local post-defeat fixture exposes the Curvature Seed; ordinary keyboard input must collect it and complete extraction. No claim about defeating the boss or a fresh campaign is made.',
  checks:[],errors:[],failedAssets:[],cases:{},failure:null};
report.sourceHashes={};
for(const file of ['src/build.js','src/app.js','src/interface.js','src/later-content-entry.js']){
  try{report.sourceHashes[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');}
  catch(error){if(file!=='src/later-content-entry.js')throw error;report.sourceHashes[file]='Not included in the playable package.';}
}
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);console.log('PASS '+name);};
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser,page;
const store=page=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
const lateKeys=[ACT4_SAVE_KEY,JOURNEY_KEY];
const kept=(before,after)=>lateKeys.every(key=>before[key]===after[key]);
const forbidden=/Act\s+IV|hyperbolic|Bolza|repair dock|Warp Drive repaired|Warp Drive assembled/i;
async function visibleLaterLinks(page){
  return page.locator('a[href*="hyperbolic-act"],a[href*="repair-dock"]').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden').map(node=>({text:node.textContent,href:node.getAttribute('href')})));
}
try{
  const url=await new Promise((accept,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Server startup timed out.')),10000);
    server.once('error',reject);server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
  report.url=url;browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
  const observe=page=>{page.on('pageerror',error=>report.errors.push(error.message));page.on('response',response=>{if(response.status()>=400)report.failedAssets.push({url:response.url(),status:response.status()});});};
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(seed=>{
    if(localStorage.getItem('__ass_scope_qa')!=='1'){
      for(const [key,value] of Object.entries(seed))localStorage.setItem(key,value);
      localStorage.setItem('__ass_scope_qa','1');
    }
    window.__scopeWrites=[];window.__scopeContexts=0;
    for(const name of ['setItem','removeItem','clear']){
      const original=Storage.prototype[name];Storage.prototype[name]=function(...args){if(this===localStorage)window.__scopeWrites.push({name,key:args[0]});return original.apply(this,args);};
    }
    const Native=window.AudioContext||window.webkitAudioContext;
    if(Native)window.AudioContext=class extends Native{constructor(...args){super(...args);window.__scopeContexts++;}};
  },oldStore);
  const laterPages=['hyperbolic-act.html','repair-dock.html'];
  for(const name of laterPages){
    let included=true;try{await access(join(root,name));}catch{included=false;}
    if(!included){
      const response=await fetch(new URL(name,url));check(`Packaged ${name} is not available`,response.status===404);continue;
    }
    page=await context.newPage();observe(page);const requests=[];page.on('request',request=>requests.push(request.url()));
    await page.goto(url+name+'?qa=1');await page.locator('#deferred-content').waitFor();await page.waitForTimeout(120);
    const current=await store(page),detail=await page.evaluate(()=>({writes:window.__scopeWrites,contexts:window.__scopeContexts,act:!!window.arrowSpaceShiftActFour,repair:!!window.arrowSpaceShiftRepair}));
    check(`${name} shows the edition boundary`,await page.getByRole('heading',{name:'Acts I–III',exact:true}).isVisible());
    check(`${name} retains all supplied old records`,Object.entries(oldStore).every(([key,value])=>current[key]===value));
    check(`${name} performs no storage write`,detail.writes.length===0);
    check(`${name} starts no later runtime or audio context`,!detail.act&&!detail.repair&&detail.contexts===0&&!requests.some(value=>/\/src\/(?:hyperbolic-act|repair-app)\.js(?:\?|$)/.test(value)));
    await page.setViewportSize({width:320,height:568});
    check(`${name} notice fits a narrow viewport`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('#deferred-content').getBoundingClientRect().bottom<=innerHeight));
    await page.screenshot({path:join(output,name.replace('.html','')+'-guard-320.png')});
    report.cases[name]=detail;await page.close();
  }
  page=await context.newPage();observe(page);await page.goto(url);await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  const before=await store(page);
  check('The old-profile fixture retains its fabricated ship',profile.selectedShip===3&&profile.unlockedShips.includes(3));
  check('A profile with later progress still has no Act IV start',await page.locator('#continue-act4').isHidden());
  check('The title recognizes the completed three Acts',await page.getByRole('heading',{name:'Act III complete',exact:true}).isVisible()&&await page.getByRole('button',{name:'Replay Act III',exact:true}).isVisible());
  check('Later completion does not expose the repaired-drive banner',await page.locator('#campaign-completion').isHidden());
  check('The main view has no visible later-page link',(await visibleLaterLinks(page)).length===0);
  await page.locator('#continue-act4').evaluate(button=>button.click());
  await page.waitForTimeout(100);
  check('The retained hidden control cannot launch a later Act',page.url()===url&&await page.getByRole('heading',{name:'Act III complete',exact:true}).isVisible());
  for(const name of ['Guide','Equipment','Options']){
    await page.getByRole('button',{name,exact:true}).click();
    const dialog=page.locator('dialog[open]');
    const text=await dialog.innerText(),links=await visibleLaterLinks(page);
    (report.cases.menus??={})[name]={text,links};
    check(`${name} has no visible post-jam prompt`,!forbidden.test(text)&&links.length===0);
    await page.keyboard.press('Escape');
  }
  check('Main menus retain old later-Act checkpoint and repair records',kept(before,await store(page)));
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  check('Reload retains the later-Act records without exposing their start',kept(before,await store(page))&&await page.locator('#continue-act4').isHidden());
  await page.getByRole('button',{name:'Replay Act III',exact:true}).click();
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.index===18);
  check('A completed profile can explicitly replay Act III',await page.evaluate(()=>window.arrowSpaceShift.read().campaign.index===18));
  check('Replay does not erase the stored later progress',kept(before,await store(page)));
  const checkpointFlight=createFlight('campaign',{fleetProfile:profile,shipId:3,seed:47});
  enterChapter(checkpointFlight,24);checkpointFlight.phase='running';
  const oldCheckpoint=checkpointFromFlight(checkpointFlight);
  await page.evaluate(([key,value])=>localStorage.setItem(key,value),[SAVE_KEY,JSON.stringify(oldCheckpoint)]);
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  const restored=await page.evaluate(()=>window.arrowSpaceShift.read());
  check('An existing section checkpoint takes priority over the completion entry',restored.phase==='paused'&&restored.campaign.index===24&&restored.runSeed===47&&/Continue your flight/.test(await page.locator('#overlay-title').innerText()));
  check('Checkpoint entry does not erase later content records',kept(before,await store(page)));
  await page.evaluate(key=>localStorage.removeItem(key),SAVE_KEY);
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  await page.getByRole('button',{name:'New campaign · Level 0',exact:true}).click();
  const newEntry=await page.evaluate(()=>window.arrowSpaceShift.read());
  check('New campaign requires an explicit start instead of an automatic Level 0 reset',newEntry.phase==='ready'&&newEntry.campaign.index===-1&&await page.getByRole('button',{name:'Begin at Level 0',exact:true}).isVisible());
  check('The explicit new-campaign entry keeps older later-Act records',kept(before,await store(page)));
  await page.close();

  const recoveryContext=await browser.newContext({viewport:{width:1280,height:900}});
  page=await recoveryContext.newPage();observe(page);await page.goto(url+'?qa=1');await page.waitForFunction(()=>window.arrowSpaceShiftTest&&window.arrowSpaceShift.assets().ready);
  await page.getByRole('button',{name:'Options',exact:true}).click();
  await page.getByRole('button',{name:'QA: Curvature Seed recovery',exact:true}).click();
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.repairPart?.id==='curvature-seed');
  let s=await page.evaluate(()=>window.arrowSpaceShift.read());
  check('The post-defeat fixture exposes the real Curvature Seed',s.campaign.repairPart.id==='curvature-seed'&&!s.campaign.repairPart.collected&&s.fleetProfile.curvatureSeed===false);
  const exposed={time:s.time,x:s.x,part:s.campaign.repairPart};
  let held=null,collected=null;const deadline=Date.now()+30000;
  while(Date.now()<deadline){
    s=await page.evaluate(()=>window.arrowSpaceShift.read());if(s.phase==='won')break;
    if(s.campaign.repairPart?.collected&&!collected){collected={time:s.time,part:s.campaign.repairPart,unlocked:s.fleetProfile.curvatureSeed};}
    const goal=s.campaign.repairPart&&!s.campaign.repairPart.collected?s.campaign.repairPart.x:0;
    const next=Math.abs(goal-s.x)<5?null:goal>s.x?'ArrowRight':'ArrowLeft';
    if(next!==held){if(held)await page.keyboard.up(held);if(next)await page.keyboard.down(next);held=next;}
    await page.waitForTimeout(45);
  }
  if(held)await page.keyboard.up(held);
  s=await page.evaluate(()=>window.arrowSpaceShift.read());
  check('Physical collection precedes permanent unlocking',collected&&collected.part.collected&&collected.unlocked===false);
  check('Ordinary steering and route extraction reach the three-Act ending',s.phase==='won'&&s.fleetProfile.curvatureSeed===true&&s.events.some(event=>event.type==='boss-extracted'&&event.part==='curvature-seed'));
  await page.waitForFunction(()=>document.querySelector('#overlay-title')?.textContent==='Act III complete'&&!document.querySelector('#overlay').hidden,{},{timeout:5000});
  check('The ending identifies Act III and offers replay',await page.getByRole('heading',{name:'Act III complete',exact:true}).isVisible()&&await page.getByRole('button',{name:'Replay Act III',exact:true}).isVisible());
  check('The ending has no visible later-Act continuation',(await visibleLaterLinks(page)).length===0&&await page.locator('#continue-act4').isHidden()&&!forbidden.test(await page.locator('.viewport').innerText()));
  const endingStore=await store(page);
  check('The local reward fixture does not award a completed Warp Drive',!JSON.parse(endingStore[JOURNEY_KEY]||'null')?.completed);
  report.cases.recovery={exposed,collected,extracted:{time:s.time,phase:s.phase,profile:s.fleetProfile,events:s.events.filter(event=>['boss-defeated','drive-part-collected','boss-extracted'].includes(event.type))}};
  await page.screenshot({path:join(output,'act-three-complete.png')});
  await page.getByRole('button',{name:'Replay Act III',exact:true}).click();
  check('The ending replay action starts Act III rather than Level 0',await page.evaluate(()=>window.arrowSpaceShift.read().campaign.index===18&&window.arrowSpaceShift.read().phase==='running'));
  check('No browser exception or failed active asset occurred',report.errors.length===0&&report.failedAssets.length===0);
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:join(output,'failure.png'),fullPage:true}).catch(()=>{});}
finally{
  report.limits='Old-profile injection is a compatibility fixture. The final-boss fixture starts after defeat and does not verify boss combat, fairness, a fresh-game completion, human play, or physical devices. The real pickup and extraction use ordinary keyboard input. The user browser and storage are not changed.';
  await browser?.close();server.kill();await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks.length,failure:report.failure},null,2));
}
