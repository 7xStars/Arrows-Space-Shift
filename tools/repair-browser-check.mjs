import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createJourney,syncLegacyParts,bankFinalComponent,JOURNEY_KEY} from '../src/journey.js';
import {createFleetProfile} from '../src/fleet.js';
import {FLEET_KEY} from '../src/storage.js';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(process.argv[2]||resolve(import.meta.dirname,'..')),output=resolve(process.argv[3]||'reports/completion-0.25.0-dev.1/repair-browser');
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const url=await new Promise((accept,reject)=>{let text='';const timer=setTimeout(()=>reject(new Error('Server startup timed out.')),10000);server.stdout.on('data',chunk=>{text+=chunk;const m=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m){clearTimeout(timer);accept(m[0]);}});server.on('error',reject);});
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:output,size:{width:1280,height:900}}});
const page=await context.newPage(),video=page.video(),results=[],errors=[],badRequests=[];
page.on('pageerror',error=>errors.push(error.message));page.on('response',res=>{if(res.status()>=400)badRequests.push(res.url());});
const check=(label,value)=>{assert.ok(value,label);results.push(label);};
const read=()=>page.evaluate(()=>window.arrowSpaceShiftRepair.read());
const moveTo=async x=>{
  let state=await read(),key=x>state.x?'ArrowRight':'ArrowLeft';
  await page.keyboard.down(key);
  const end=Date.now()+6000;
  while(Date.now()<end){state=await read();if(key==='ArrowRight'?state.x>=x-8:state.x<=x+8)break;await page.waitForTimeout(15);}
  await page.keyboard.up(key);assert.ok(Math.abs((await read()).x-x)<30,'The normal steering input reached the receiver lane.');
};
let failure=null;
try{
  await page.goto(new URL('repair-dock.html',url).href);await page.waitForFunction(()=>window.arrowSpaceShiftRepair);
  check('A clean profile cannot assemble an unearned drive',await page.locator('#assemble').isHidden());
  const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module','curvature-seed'],selectedShip:0});
  const journey=createJourney();syncLegacyParts(journey,profile);
  bankFinalComponent(journey,{id:'hyperbolic-core',source:'double-torus',stage:8,exposed:true,collected:true,extracted:true,seed:2501,shipId:0,score:4000});
  await page.evaluate(({journey,profile,JOURNEY_KEY,FLEET_KEY})=>{localStorage.setItem(JOURNEY_KEY,JSON.stringify(journey));localStorage.setItem(FLEET_KEY,JSON.stringify(profile));},{journey,profile,JOURNEY_KEY,FLEET_KEY});
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShiftRepair?.assets().ready);
  await page.locator('#assemble').click();check('Assembly alone does not activate or complete the campaign',await read().then(s=>s.journey.assembled&&!s.journey.activated&&!s.journey.completed));
  await page.locator('#dock-launch').click();
  await moveTo(-220);await page.keyboard.press('ShiftLeft');await page.keyboard.down('Space');
  await page.waitForFunction(()=>window.arrowSpaceShiftRepair.read().stageIndex===1);await page.keyboard.up('Space');
  check('A real folded charge reaches the first receiver',(await read()).charged.compression);
  await moveTo(220);await page.keyboard.down('Space');
  await page.waitForFunction(()=>window.arrowSpaceShiftRepair.read().stageIndex===2);await page.keyboard.up('Space');
  check('A real Klein return reaches the second receiver',(await read()).charged.klein);
  await moveTo(120);await page.keyboard.down('c');
  await page.waitForFunction(()=>window.arrowSpaceShiftRepair.read().echoCount===1);await page.keyboard.up('c');
  check('Capture stores a physical incoming charge',(await read()).echoCount===1);
  await moveTo(-180);await page.keyboard.press('e');
  await page.waitForFunction(()=>window.arrowSpaceShiftRepair.read().phase==='ending');
  check('Only the delivered echo activates the drive',await read().then(s=>s.charged.echo&&s.journey.activated&&!s.journey.completed));
  await page.screenshot({path:join(output,'activation.png')});
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShiftRepair);
  check('Reload retains activation but requires the visible ending',await read().then(s=>s.phase==='ending'&&s.paused&&s.journey.activated&&!s.journey.completed));
  await page.locator('#dock-launch').click();
  await page.waitForFunction(()=>window.arrowSpaceShiftRepair.read().journey.completed,{},{timeout:16000});
  check('The visible ending saves campaign completion',true);
  await page.screenshot({path:join(output,'ending.png')});
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShiftRepair);
  check('Completion survives another page reload',await read().then(s=>s.journey.completed&&s.phase==='complete'));
  for(const [width,height] of [[390,844],[320,568]]){
    await page.setViewportSize({width,height});
    check(`Dock fits ${width} by ${height}`,await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:join(output,`dock-${width}x${height}.png`),fullPage:true});
  }
  await page.goto(url);await page.waitForFunction(()=>window.arrowSpaceShift);
  check('The main title recognizes saved campaign completion',await page.locator('#campaign-completion').isVisible());
  check('No page exception occurred',errors.length===0);check('All requested resources loaded',badRequests.length===0);
}catch(error){failure=error.message;await page.screenshot({path:join(output,'failure.png'),fullPage:true});throw error;}
finally{
  await writeFile(join(output,'results.json'),JSON.stringify({checks:results.length,results,errors,badRequests,failure,
    fixture:'Existing valid four-part saved profile. No final boss combat is claimed by this repair-only test. All repair delivery and ending interactions use real keyboard input.',
    limits:'Local headless Edge. No human comprehension, listening, physical touch, or complete new-campaign acceptance.'},null,2)+'\n');
  await context.close();if(video){const path=await video.path();await rename(path,join(output,'repair-and-ending.webm'));}
  await browser.close();server.kill();console.log(JSON.stringify({checks:results.length,results,failure},null,2));
}
