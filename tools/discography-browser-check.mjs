import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
if(!process.argv[2])throw Error('Supply the extracted discography folder.');
const root=resolve(process.argv[2]),output=resolve(process.argv[3]||'reports/fold-audio-dev3/discography-browser');
await mkdir(output,{recursive:true});
const report={root,method:'Local file in isolated headless Edge. Native WAV playback and ordinary pointer controls.',checks:[],errors:[],failure:null};
const check=(name,result)=>{assert.ok(result,name);report.checks.push(name);};
let browser;
try{
  const manifest=JSON.parse(await readFile(join(root,'discography.json'),'utf8'));
  for(const track of manifest.tracks)check(`WAV exists: ${track.title}`,(await stat(join(root,track.file))).size>44);
  browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();
  report.browser=browser.version();page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(pathToFileURL(join(root,'index.html')).href);
  check('One audio player serves all 26 compositions',await page.locator('audio').count()===1&&await page.locator('button[data-file]').count()===26);
  check('The page waits for a Play action',await page.locator('audio').evaluate(node=>node.paused&&!node.getAttribute('src')));
  const representatives=manifest.releases.map(release=>manifest.tracks.find(track=>track.release_id===release.id));
  for(const track of representatives){
    const button=page.locator('button[data-file]').filter({hasText:`Play ${track.title}`});
    await button.click();
    await page.waitForFunction(()=>{const audio=document.querySelector('audio');return !audio.paused&&audio.currentTime>.08&&audio.readyState>=2;});
    const state=await page.locator('audio').evaluate(node=>({time:node.currentTime,duration:node.duration,src:decodeURI(node.src)}));
    check(`Native full WAV plays: ${track.title}`,Math.abs(state.duration-track.seconds)<.02&&state.src.endsWith(track.file));
    check(`One selected track: ${track.title}`,await page.locator('button[aria-pressed="true"]').count()===1);
  }
  const paused=await page.locator('audio').evaluate(node=>{node.pause();return node.currentTime;});
  await page.waitForTimeout(160);
  check('Pause retains the position',await page.locator('audio').evaluate((node,time)=>node.paused&&Math.abs(node.currentTime-time)<.03,paused));
  await page.locator('audio').evaluate(node=>{node.currentTime=node.duration-1;});
  await page.waitForFunction(()=>{const node=document.querySelector('audio');return Math.abs(node.currentTime-(node.duration-1))<.1;});
  check('Native WAV seeking reaches the ending',true);
  await page.screenshot({path:join(output,'discography-desktop.png'),fullPage:true});
  await page.setViewportSize({width:320,height:568});
  check('The page fits a 320-pixel viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:join(output,'discography-mobile.png'),fullPage:true});
  check('No page exception occurred',report.errors.length===0);
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;}
finally{await browser?.close();await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
