import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(process.argv[2]||'.'),out=resolve(process.argv[3]||'reports/integration-0.25.1/visual-browser');
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const url=await new Promise((accept,reject)=>{let data='';server.stdout.on('data',chunk=>{data+=chunk;const m=data.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)accept(m[0]);});server.once('error',reject);});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}});
const results=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
const check=(name,value)=>{assert.ok(value,name);results.push(name);};
try{
  await page.clock.install();
  await page.goto(new URL('?qa=1',url).href);await page.waitForFunction(()=>window.arrowSpaceShiftTest&&window.arrowSpaceShift.assets().ready);
  await page.evaluate(async()=>{
    const {StructuralFeedback}=await import('./src/structural-feedback.js'),update=StructuralFeedback.prototype.update;
    window.__feedback=[];
    StructuralFeedback.prototype.update=function(state,options){
      const response=update.call(this,state,options);
      window.__feedback.push({...response,time:state.time,hull:state.hull});
      if(window.__feedback.length>4000)window.__feedback.shift();
      return response;
    };
  });
  await page.getByRole('button',{name:'Options',exact:true}).click();
  await page.getByRole('button',{name:'QA: Curvature Gate',exact:true}).click();
  await page.keyboard.down('Space');
  for(let step=0;step<45;step++){
    await page.clock.runFor(500);
    if(await page.evaluate(()=>window.__feedback.some(value=>value.damage>0)&&window.__feedback.some(value=>Math.abs(value.recoilPixels)>.05)))break;
  }
  await page.keyboard.up('Space');
  const observed=await page.evaluate(()=>({frames:window.__feedback,events:window.arrowSpaceShift.read().events}));
  await writeFile(join(out,'observed.json'),JSON.stringify(observed,null,2)+'\n');
  check('Manual keyboard fire produces bounded recoil in the actual renderer',observed.frames.some(value=>Math.abs(value.recoilPixels)>.05)&&observed.frames.every(value=>Math.abs(value.recoilPixels)<=2.8));
  check('Actual combat damage produces the coupled response',observed.frames.some(value=>value.damage>0)&&observed.events.some(event=>event.type==='damage'));
  check('Presentation retains a fixed collision core',observed.frames.every(value=>value.collisionOffset===0));
  await page.screenshot({path:join(out,'combat.png')});
  await page.getByRole('button',{name:'Options',exact:true}).click();
  await page.locator('#reduced-motion').check();await page.keyboard.press('Escape');await page.keyboard.press('p');
  await page.evaluate(()=>{window.__feedback=[];});await page.keyboard.down('Space');await page.clock.runFor(350);await page.keyboard.up('Space');
  check('Reduced motion removes recoil during actual fire',await page.evaluate(()=>window.__feedback.length>0&&window.__feedback.every(value=>value.recoilPixels===0)));
  check('No presentation page exception occurred',errors.length===0);
}finally{
  await writeFile(join(out,'results.json'),JSON.stringify({results,checks:results.length,errors,limits:'An isolated QA combat fixture with actual keyboard fire and actual incoming damage. A wrapper records presentation return values. It does not change those values or simulation state. This is not a fresh campaign, human observation, or device performance test.'},null,2)+'\n');
  await browser.close();server.kill();console.log(JSON.stringify({checks:results.length,results,errors},null,2));
}
