import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const project=resolve(import.meta.dirname,'..'),root=resolve(process.argv[2]||project),output=resolve(process.argv[3]||join(project,'reports/stc-study-r9/browser-source'));
await mkdir(output,{recursive:true});
const checks=[],errors=[],missing=[];
const result={revision:'identified-return-r9',root,checks,errors,missing,limits:'Headless Microsoft Edge. No human listening, screen-reader, physical-device, or latency acceptance.'};
const check=(label,value)=>{assert.ok(value,label);checks.push(label);};
for(const file of ['track-review-r9.html','src/track-review-r9.js']){result.sourceIdentity||={};result.sourceIdentity[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');}
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser;
try{
  const url=await new Promise((accept,reject)=>{let log='';const timeout=setTimeout(()=>reject(new Error('The server did not start.')),10000);server.once('error',reject);server.stdout.on('data',chunk=>{log+=chunk;const match=log.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timeout);accept(match[0]);}});});
  browser=await chromium.launch({headless:true,channel:'msedge'});result.browserVersion=browser.version();
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await context.addInitScript(()=>{window.__reviewWrites=[];for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.__reviewWrites.push({name,args});return original.apply(this,args);};}});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)missing.push({url:response.url(),status:response.status()});});
  await page.goto(new URL('track-review-r9.html',url).href);
  await page.waitForFunction(()=>Number.isFinite(document.querySelector('audio').duration));
  const player=page.locator('#player'),select=page.getByLabel('Track',{exact:true});
  check('The page creates one native player',await page.locator('audio').count()===1);
  check('Startup remains paused',await player.evaluate(element=>element.paused&&element.currentTime===0));
  check('The full candidate has the native expected duration',Math.abs(await player.evaluate(element=>element.duration)-3678806/48000)<.001);
  await select.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  check('Keyboard input selects the foundation',await select.inputValue()==='r8-control.wav');
  await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
  await player.focus();await page.keyboard.press('Space');await page.waitForFunction(()=>document.querySelector('audio').currentTime>.08&&!document.querySelector('audio').paused);
  check('Keyboard input starts native playback',true);
  await page.keyboard.press('Space');await page.waitForFunction(()=>document.querySelector('audio').paused);
  check('Keyboard input pauses native playback',true);
  const files=await select.locator('option').evaluateAll(options=>options.map(option=>({file:option.value,full:option.dataset.full==='true',start:Number(option.dataset.start||0)})));
  for(const item of files){
    await select.selectOption(item.file);await page.waitForFunction(file=>document.querySelector('audio').currentSrc.endsWith('/'+file)&&Number.isFinite(document.querySelector('audio').duration)&&document.querySelector('audio').readyState>=1,item.file);
    if(item.start)await page.waitForFunction(start=>Math.abs(document.querySelector('audio').currentTime-start)<.1,item.start);
    check(`Native metadata loads: ${item.file}`,await player.evaluate(element=>element.duration>0&&element.paused));
    check(`Position controls match the selected interval: ${item.file}`,await page.getByRole('button',{name:'Return',exact:true}).isDisabled()===!item.full);
    await player.focus();await page.keyboard.press('Space');await page.waitForFunction(()=>!document.querySelector('audio').paused);
    await page.waitForTimeout(120);
    check(`Native playback advances: ${item.file}`,await player.evaluate((element,start)=>element.currentTime>start,item.start));
  }
  await select.selectOption('ass-identified-return-r9-music.wav');await page.waitForFunction(()=>document.querySelector('audio').readyState>=1);
  await page.getByRole('button',{name:'Break',exact:true}).click();
  check('The Break control seeks and retains pause',await player.evaluate(element=>element.paused&&Math.abs(element.currentTime-50.1892537313)<.01));
  await page.getByRole('button',{name:'Return',exact:true}).focus();await page.keyboard.press('Enter');
  check('Keyboard input selects the return',await player.evaluate(element=>element.paused&&Math.abs(element.currentTime-57.3534328358)<.01));
  await player.focus();await page.keyboard.press('Space');await page.waitForFunction(()=>!document.querySelector('audio').paused);
  const beforeBackground=await player.evaluate(element=>element.currentTime),away=await context.newPage();await away.goto('about:blank');await away.bringToFront();
  if(await page.evaluate(()=>document.hidden)){
    await page.waitForFunction(()=>document.querySelector('audio').paused,{},{timeout:2000});
    check('A real hidden-page transition promptly stops playback',await player.evaluate((element,time)=>element.currentTime<time+2,beforeBackground));
    result.visibility={status:'passed',observedHidden:true};
  }else result.visibility={status:'not-verified',reason:'This headless browser keeps the background page visible. No hidden-page event was simulated.'};
  await away.close();await page.bringToFront();
  if(!await player.evaluate(element=>element.paused)){await player.focus();await page.keyboard.press('Space');}
  await page.getByRole('button',{name:'Break',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('audio').seeking&&document.querySelector('#status').textContent.startsWith('Position selected:'));
  check('The position message follows a completed native seek',true);
  for(const width of [1280,320]){await page.setViewportSize({width,height:900});check(`The page fits width ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:join(output,`review-${width}.png`),fullPage:true});}
  await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>{document.documentElement.style.fontSize='34px';});
  check('Text at 200 percent has no page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:join(output,'review-200-percent.png'),fullPage:true});
  check('The review does not write browser storage',await page.evaluate(()=>window.__reviewWrites.length===0));
  check('Normal assets have no missing responses',missing.length===0);check('No runtime exception occurs',errors.length===0);
  const filePage=await context.newPage();await filePage.goto(pathToFileURL(join(root,'track-review-r9.html')).href);
  await filePage.waitForFunction(()=>Number.isFinite(document.querySelector('audio').duration));
  check('The extracted page supports native file startup',await filePage.locator('audio').evaluate(element=>element.paused&&element.duration>76));
  await filePage.locator('audio').focus();await filePage.keyboard.press('Space');await filePage.waitForFunction(()=>document.querySelector('audio').currentTime>.08);
  check('Native file playback advances after a keyboard gesture',true);
  await filePage.close();result.status='passed';result.count=checks.length;
}catch(error){result.status='failed';result.failure=error.stack;throw error;}
finally{await writeFile(join(output,'results.json'),JSON.stringify(result,null,2)+'\n');if(browser)await browser.close();server.kill();}
console.log(JSON.stringify({status:result.status,checks:checks.length,output},null,2));
