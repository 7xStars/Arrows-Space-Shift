import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:960,height:720},reducedMotion:'reduce'}),results=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));const check=(name,value)=>{assert.ok(value,name);results.push(name);};
const assets=()=>page.evaluate(()=>window.arrowSpaceShift.assets());
const advance=n=>page.evaluate(n=>window.arrowSpaceShiftTest.advance(n),n);
try{
  await page.goto('http://127.0.0.1:4177/?test=1');await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);check('The pixel atlas loads without error',(await assets()).ready&&!(await assets()).error);
  check('The player uses a pixel sprite',(await assets()).used.includes('player.arrow'));
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadChapterTrial(0));await advance(.1);check('The first route draws a Heavy or Gunner', (await assets()).used.some(id=>id==='enemy.heavy'||id==='enemy.gunner'));
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadChapterTrial(1));await advance(.1);check('The quiet route draws a Scout',(await assets()).used.includes('enemy.scout'));
  check('Asteroids use the pixel atlas',(await assets()).used.some(id=>id.startsWith('asteroid.')));await page.screenshot({path:'reports/art-quiet-belt.png'});
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadEnemyReturnTrial(6,'right'));await advance(.3);check('Stage 7 draws Klein Runner art',(await assets()).used.some(id=>id.startsWith('enemy.klein')));
  check('Klein edges draw the twist tile',(await assets()).used.includes('edge.twist'));await page.screenshot({path:'reports/art-klein-return.png'});
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadAsteroidTrial('player'));await advance(.1);check('An authoritative asteroid break draws its authored frame',(await assets()).used.includes('asteroid.break-0')||(await assets()).used.includes('asteroid.break-1'));
  await page.setViewportSize({width:320,height:568});await page.evaluate(()=>window.arrowSpaceShiftTest.loadChapterTrial(1));await advance(.1);check('Pixel assets retain the compact viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));await page.screenshot({path:'reports/art-compact.png'});
  check('No art integration runtime error occurred',errors.length===0);
  const fallback=await browser.newPage();await fallback.route('**/assets/crossing/manifest.json',route=>route.fulfill({status:404,body:'Unavailable'}));await fallback.goto('http://127.0.0.1:4177/');await fallback.waitForFunction(()=>window.arrowSpaceShift?.assets().error);
  check('A missing atlas manifest leaves the procedural fallback playable',await fallback.getByRole('button',{name:'Start campaign',exact:true}).isEnabled()&&await fallback.evaluate(()=>!window.arrowSpaceShift.assets().ready));await fallback.close();
  const report={checks:results.length,results,errors,limits:'Rendered fixtures and asset-use records. Mask differences do not establish human recognition. Visual contact alignment and artistic acceptance still need human review.'};await fs.writeFile('reports/art-browser-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
