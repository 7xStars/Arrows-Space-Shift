import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {quotientAim,quotientDistance} from '../src/hyperbolic-campaign.js';
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const project=resolve(import.meta.dirname,'..'),root=resolve(process.argv[2]||project),out=resolve(process.argv[3]||join(project,'reports/completion-0.25.0-dev.1/act4-browser'));await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser;
const report={candidate:JSON.parse(await readFile(join(root,'package.json'),'utf8')).version,fixture:'Existing profile with all earlier parts and Act IV stages1–8 cleared. No QA parameter. Player state is observed through a read-only API. All boss, pickup and extraction actions use real keyboard input.',checks:[],errors:[]};
try{
 const url=await new Promise((accept,reject)=>{let text='';const timeout=setTimeout(()=>reject(new Error('server timeout')),10000);server.stdout.on('data',chunk=>{text+=chunk;const m=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m){clearTimeout(timeout);accept(m[0]);}});});
 browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url);
 await page.evaluate(()=>{
  localStorage.clear();localStorage.setItem('arrow-space-shift:fleet:v1',JSON.stringify({version:5,fleetUnlocked:true,driveParts:['klein-relay','projective-module','curvature-seed'],selectedShip:0}));
  localStorage.setItem('arrow-space-shift:act4:v1',JSON.stringify({version:3,unlocked:8,resumeStage:8,score:1700,completed:false,entries:{8:{score:1700,echoes:0,seed:71,shipId:0,inventory:[],equipped:[]}}}));
  localStorage.setItem('arrow-space-shift:preferences:v1',JSON.stringify({version:1,sound:false,music:false,reducedMotion:true}));
 });
 await page.goto(new URL('hyperbolic-act.html',url).href);await page.locator('#launch').click();
 const held=new Set();const set=async(key,yes)=>{if(yes&&!held.has(key)){await page.keyboard.down(key);held.add(key);}else if(!yes&&held.has(key)){await page.keyboard.up(key);held.delete(key);}};
 let seenExposure=false,seenCollection=false,reloadedExposure=false,reloadedCollection=false,s;const start=Date.now();
 const reloadUnbanked=async label=>{
  for(const key of held)await page.keyboard.up(key);held.clear();
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShiftActFour);
  const restored=await page.evaluate(()=>window.arrowSpaceShiftActFour.read());
  assert.equal(restored.phase,'ready');assert.equal(restored.finalReward,null);assert.equal(restored.score,1700);
  assert.equal(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('arrow-space-shift:journey:v1')||'null')?.parts?.['hyperbolic-core']),false);
  report.checks.push(`Reload after ${label} restores the boss entry without banking a core`);
  await page.locator('#launch').click();
 };
 while(Date.now()-start<90000){
  s=await page.evaluate(()=>window.arrowSpaceShiftActFour.read());if(s.phase==='won'||s.phase==='lost')break;
  const boss=s.enemies[0],r=s.finalReward,target=boss?.position||(r?.state==='exposed'?r.position:r?.extractionPosition);
  if(!target){await page.waitForTimeout(50);continue;}
  const d=quotientAim(s.player.position,target),h=s.player.heading,diff=Math.atan2(h.x*d.y-h.y*d.x,h.x*d.x+h.y*d.y);
  await set('ArrowLeft',diff>.055);await set('ArrowRight',diff<-.055);
  await set('Space',!!boss&&Math.abs(diff)<.11);
  await set('ArrowUp',!boss&&Math.abs(diff)<.18&&quotientDistance(s.player.position,target)>.08);
  if(boss&&s.shots.some(x=>x.team==='enemy'&&quotientDistance(s.player.position,x.position)<.3))await page.keyboard.press('c');
  if(boss&&s.echoes>0&&Math.abs(diff)<.11)await page.keyboard.press('e');
  if(r?.state==='exposed'&&!seenExposure){
   assert.equal(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('arrow-space-shift:journey:v1')||'null')?.parts?.['hyperbolic-core']),false);
   report.checks.push('Boss defeat exposes a real core without banking it');seenExposure=true;await page.screenshot({path:join(out,'core-exposed.png')});
  }
  if(r?.state==='exposed'&&!reloadedExposure){reloadedExposure=true;await reloadUnbanked('exposure');continue;}
  if(r?.state==='collected'&&!seenCollection){
   assert.equal(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('arrow-space-shift:journey:v1')||'null')?.parts?.['hyperbolic-core']),false);
   report.checks.push('Physical pickup does not bank the core');seenCollection=true;await page.screenshot({path:join(out,'core-collected.png')});
  }
  if(r?.state==='collected'&&!reloadedCollection){reloadedCollection=true;await reloadUnbanked('pickup');continue;}
  await page.waitForTimeout(50);
 }
 for(const key of held)await page.keyboard.up(key);
 assert.equal(s.phase,'won',JSON.stringify({phase:s.phase,time:s.time,hull:s.player.hull,reward:s.finalReward}));
 assert.ok(seenExposure&&seenCollection);assert.ok(s.player.hull>0);report.checks.push('Normal-health keyboard play defeats the boss and reaches extraction');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('arrow-space-shift:journey:v1')));
 await writeFile(join(out,'journey-extracted.json'),JSON.stringify(saved,null,2)+'\n');
 const stored=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
 await writeFile(join(out,'browser-storage.json'),JSON.stringify(stored,null,2)+'\n');
 assert.equal(saved.parts['hyperbolic-core'].extracted,true);assert.equal(saved.completed,false);assert.equal(saved.assembled,false);report.checks.push('Extraction banks provenance without assembling or completing the campaign');
 await page.screenshot({path:join(out,'core-extracted.png')});
 await page.reload();await page.waitForFunction(()=>window.arrowSpaceShiftActFour);
 assert.equal(await page.locator('#dock-link').getAttribute('href'),'./repair-dock.html');assert.equal(await page.locator('#dock-link').evaluate(x=>x.hidden),false);
 report.checks.push('Reload retains the banked core and repair dock link');
 report.final={phase:s.phase,hull:s.player.hull,time:s.time,score:s.score,receipt:saved.parts['hyperbolic-core']};
 assert.deepEqual(report.errors,[]);report.checks.push('No page exception');
 console.log(JSON.stringify(report,null,2));
}finally{await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}

