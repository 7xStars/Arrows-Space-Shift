import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';

const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const project=resolve(import.meta.dirname,'..');
const root=resolve(process.argv[2]||project);
const {BUILD,isActAvailable}=await import(pathToFileURL(join(root,'src/build.js')).href);
const output=resolve(process.argv[3]||join(project,'reports/browser-local'));
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const url=await new Promise((accept,reject)=>{
  let buffer='';
  const timer=setTimeout(()=>reject(new Error('The local server did not start.')),10000);
  server.once('error',reject);
  server.stdout.on('data',chunk=>{buffer+=chunk;const match=buffer.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});
});
const browser=await chromium.launch({headless:true,channel:'msedge'});
const results=[],errors=[],failedRequests=[];
const check=(name,value)=>{assert.ok(value,name);results.push(name);};
const observe=page=>{
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)failedRequests.push({url:response.url(),status:response.status()});});
};
try{
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{
    const Native=window.AudioContext||window.webkitAudioContext;
    window.__audioInstances=[];
    if(Native)window.AudioContext=class extends Native{
      constructor(...args){super(...args);window.__audioInstances.push(this);}
    };
  });
  const page=await context.newPage();observe(page);
  await page.goto(url);await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  check('Clean profile starts at Level 0',(await page.evaluate(()=>window.arrowSpaceShift.read().campaign.index))===-1);
  check('Normal entry has no QA controls',await page.evaluate(()=>!window.arrowSpaceShiftTest));
  await page.screenshot({path:join(output,'main-title.png')});
  await page.locator('#primary').click();
  for(const [key,duration] of [['ArrowLeft',200],['ArrowRight',400]]){
    await page.keyboard.down(key);await page.waitForTimeout(duration);await page.keyboard.up(key);
  }
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.lesson==='shoot');
  check('Real direction keys complete the movement lesson',true);
  await page.keyboard.down('Space');await page.waitForTimeout(160);await page.keyboard.up('Space');
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.lesson==='fold');
  check('Manual Space fire completes the fire lesson',true);
  await page.keyboard.press('ShiftLeft');
  check('Left Shift creates an actual fold',await page.evaluate(()=>window.arrowSpaceShift.read().fields.length>0));
  await page.keyboard.press('ShiftRight');
  check('Right Shift removes the fold',await page.evaluate(()=>window.arrowSpaceShift.read().fields.length===0));
  const x=await page.evaluate(()=>window.arrowSpaceShift.read().x);
  if(Math.abs(x)>2){const key=x>0?'ArrowLeft':'ArrowRight';await page.keyboard.down(key);await page.waitForTimeout(Math.abs(x)/360*1000);await page.keyboard.up(key);}
  await page.keyboard.down('Space');
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.index===0,{},{timeout:12000});
  await page.keyboard.up('Space');
  check('Ordinary training fire reaches Level 1 automatically',true);
  await page.getByRole('button',{name:'Equipment',exact:true}).click();
  check('Equipment pauses play',await page.evaluate(()=>window.arrowSpaceShift.read().phase==='paused'));
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Options',exact:true}).click();
  await page.locator('#reduced-motion').check();
  await page.locator('#music').uncheck();
  await page.locator('#sound').click();
  await page.keyboard.press('Escape');
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShift);
  check('Level 1 checkpoint survives reload',await page.evaluate(()=>window.arrowSpaceShift.read().campaign.index===0));
  const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('arrow-space-shift:preferences:v1')));
  check('Reload enables audio and preserves reduced motion',prefs.sound===true&&prefs.music===true&&prefs.reducedMotion===true);
  if(isActAvailable(4)){
  await page.goto(new URL('hyperbolic-act.html',url).href);
  check('Clean profile cannot bypass the Curvature Seed',await page.locator('#modal-title').textContent()==='Curvature Seed required');
  await page.goto(new URL('hyperbolic-act.html?qa=1',url).href);
  check('Act IV loads shared settings',await page.locator('#reduced-motion').isChecked()&&await page.locator('#sound').textContent()==='Sound off');
  await page.locator('#launch').click();
  await page.keyboard.press('p');
  check('P pauses Act IV',await page.locator('#pause').textContent()==='Resume (P)');
  await page.keyboard.press('p');
  check('P resumes Act IV',await page.locator('#pause').textContent()==='Pause (P)');
  await page.keyboard.down('ArrowUp');await page.keyboard.down('Space');
  await page.waitForTimeout(1800);await page.keyboard.up('Space');await page.keyboard.up('ArrowUp');
  check('Act IV records a real paired-edge crossing',Number(await page.locator('#crossings').textContent())>0);
  await page.keyboard.press('ShiftLeft');
  await page.waitForFunction(()=>Number(document.getElementById('folds').textContent)===1);
  check('Act IV fold action changes the actual fold count',Number(await page.locator('#folds').textContent())===1);
  await page.screenshot({path:join(output,'act4-combat.png')});
  await page.keyboard.press('p');
  await page.locator('#options-open').click();
  check('Act IV Options pauses play',await page.locator('#pause').textContent()==='Resume (P)');
  await page.locator('#sound').click();
  check('Act IV audio unlock follows a user action',await page.evaluate(()=>JSON.parse(localStorage.getItem('arrow-space-shift:preferences:v1')).sound));
  await page.waitForFunction(()=>window.__audioInstances.length===1&&window.__audioInstances[0].state==='running');
  check('Act IV creates one running AudioContext',true);
  await page.locator('#sound').click();
  await page.keyboard.press('Escape');
  check('Options closes with Escape and restores focus',await page.evaluate(()=>!document.getElementById('options-dialog').open&&document.activeElement.id==='options-open'));
  check('Closing Options keeps play paused',await page.locator('#pause').textContent()==='Resume (P)');
  await page.keyboard.press('p');
  check('P resumes while the Options button has focus',await page.locator('#pause').textContent()==='Pause (P)');
  await page.keyboard.press('p');
  const fitted=()=>page.evaluate(()=>{
    const controls=[document.getElementById('field'),document.querySelector('.hud'),...document.querySelectorAll('.controls button'),document.getElementById('options-open')];
    return document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1&&controls.every(element=>{
      const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;
    });
  });
  check('Act IV field and controls fit 1280 by 900',await fitted());
  for(const [width,height] of [[390,844],[320,568],[640,450]]){
    await page.setViewportSize({width,height});
    check(`Act IV field and controls fit ${width} by ${height}`,await fitted());
    await page.locator('#options-open').click();
    check(`Options fits ${width} by ${height}`,await page.locator('#options-dialog').evaluate(element=>{
      const r=element.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;
    }));
    await page.keyboard.press('Escape');
    await page.screenshot({path:join(output,`act4-${width}x${height}.png`),fullPage:true});
  }
  await page.evaluate(()=>document.documentElement.dir='rtl');
  check('Act IV controls remain in view with RTL layout',await fitted());
  }else{
    check('The jam edition is limited to Acts I to III',BUILD.maxAct===3&&BUILD.postJamContent===false);
    check('The main entry hides the later continuation',await page.locator('#continue-act4').isHidden());
    check('The main entry hides the later completion banner',await page.locator('#campaign-completion').isHidden());
    const laterLinks=()=>page.locator('a[href*="hyperbolic-act"],a[href*="repair-dock"]').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden').length);
    check('The main entry has no visible later-page link',await laterLinks()===0);
    for(const name of ['Guide','Equipment','Options']){
      await page.getByRole('button',{name,exact:true}).click();
      const text=await page.locator('dialog[open]').innerText();
      check(`${name} does not offer later content`,!/Act\s+IV|hyperbolic|Bolza|repair dock|Warp Drive repaired|Warp Drive assembled/i.test(text)&&await laterLinks()===0);
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button',{name:'Options',exact:true}).click();
    await page.locator('#music').check();await page.locator('#sound').click();
    await page.keyboard.press('Escape');await page.reload();
    await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready&&window.__audioInstances.length===1);
    if(await page.evaluate(()=>window.__audioInstances[0].state!=='running'))await page.locator('#sound-toggle').click();
    await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.trackId==='identified-return-r9'&&window.arrowSpaceShift.audio().recorded.activeSources===1);
    check('The three-Act title uses one native context and one recording source',await page.evaluate(()=>window.__audioInstances.length===1&&window.__audioInstances[0].state==='running'));
    await page.locator('#primary').click();
    await page.waitForFunction(()=>window.arrowSpaceShift.read().phase==='running'&&window.arrowSpaceShift.audio().recorded.trackId==='act1-03'&&window.arrowSpaceShift.audio().recorded.activeSources>=2);
    check('Resume keeps the earned Level 1 checkpoint and campaign music',await page.evaluate(()=>window.arrowSpaceShift.read().campaign.index===0&&window.__audioInstances.length===1));
    await page.keyboard.press('p');
    await page.waitForFunction(()=>window.arrowSpaceShift.read().phase==='paused'&&window.arrowSpaceShift.audio().recorded.activeSources===0);
    check('Manual pause keeps the three-Act recording silent',true);
    const fitted=()=>page.evaluate(()=>{
      const controls=[document.querySelector('.viewport'),document.querySelector('.hud'),document.getElementById('sound-toggle'),...document.querySelectorAll('.flight-controls button')].filter(element=>element?.getClientRects().length);
      return document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1&&controls.every(element=>{
        const rect=element.getBoundingClientRect();return rect.width>0&&rect.height>0&&rect.left>=0&&rect.top>=0&&rect.right<=innerWidth+1&&rect.bottom<=innerHeight+1;
      });
    });
    check('Main field and controls fit 1280 by 900',await fitted());
    for(const [width,height] of [[390,844],[320,568],[640,450]]){
      await page.setViewportSize({width,height});
      check(`Main field and controls fit ${width} by ${height}`,await fitted());
      await page.getByRole('button',{name:'Options',exact:true}).click();
      check(`Main Options fits ${width} by ${height}`,await page.locator('#options-dialog').evaluate(element=>{
        const rect=element.getBoundingClientRect();return rect.left>=0&&rect.top>=0&&rect.right<=innerWidth+1&&rect.bottom<=innerHeight+1;
      }));
      await page.keyboard.press('Escape');
      await page.screenshot({path:join(output,`main-${width}x${height}.png`),fullPage:true});
    }
    await page.evaluate(()=>document.documentElement.dir='rtl');
    check('Main controls remain in view with RTL layout',await fitted());
  }
  check('Runtime has no page exception',errors.length===0);
  check('Requested assets and modules loaded',failedRequests.length===0);
  console.log(JSON.stringify({checks:results.length,results,errors,failedRequests},null,2));
}finally{
  await writeFile(join(output,'results.json'),JSON.stringify({root,url,edition:BUILD,checks:results.length,results,errors,failedRequests,
    limits:isActAvailable(4)?'Local headless Edge. Ordinary Act I tutorial input. Act IV uses the local QA unlock. This does not verify full campaign play, audible mix, human comprehension, or physical mobile performance.':'Local headless Edge. Ordinary Act I tutorial input and earned checkpoint. Three-Act menu, native title, pause, settings, and emulated layout checks. This does not verify the full campaign, physical sound output, human comprehension, or physical mobile performance.'},null,2)+'\n');
  await browser.close();server.kill();
}
