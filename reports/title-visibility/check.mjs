import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(process.argv[2]||'.'),out=resolve(process.argv[3]||'reports/title-visibility/current');await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const url=await new Promise((accept,reject)=>{let data='';server.stdout.on('data',chunk=>{data+=chunk;const match=data.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match)accept(match[0]);});server.once('error',reject);});
const browser=await chromium.launch({channel:'msedge',headless:!process.argv.includes('--headed')}),context=await browser.newContext(),page=await context.newPage();
page.setDefaultTimeout(10000);const report={root,method:'Native tab selection through Page.bringToFront. No visibility property override.'};
try{
  await page.goto(url);await page.waitForFunction(()=>window.arrowSpaceShift);await page.waitForTimeout(300);
  if(await page.evaluate(()=>window.arrowSpaceShift.audio().contextState!=='running'))await page.locator('#overlay-title').click();
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.state==='playing');
  report.before=await page.evaluate(()=>({hidden:document.hidden,visibility:document.visibilityState,audio:window.arrowSpaceShift.audio()}));
  const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();await page.waitForTimeout(250);
  report.hidden=await page.evaluate(()=>({hidden:document.hidden,visibility:document.visibilityState,audio:window.arrowSpaceShift.audio()}));
  await page.waitForTimeout(200);report.later=await page.evaluate(()=>window.arrowSpaceShift.audio());
  await page.bringToFront();await page.waitForTimeout(250);
  report.restored=await page.evaluate(()=>({hidden:document.hidden,visibility:document.visibilityState,audio:window.arrowSpaceShift.audio()}));
  report.nativeHiddenObserved=report.hidden.hidden;
  report.stoppedWhenHidden=report.hidden.hidden&&report.hidden.audio.recorded.activeSources===0;
  report.offsetHeld=report.hidden.hidden&&Math.abs(report.hidden.audio.recorded.offset-report.later.recorded.offset)<.005;
  report.resumedWhenVisible=!report.restored.hidden&&report.restored.audio.recorded.state==='playing';
  report.limits='Native browser visibility and audio scheduling only. No audible listening or physical-device result.';
}finally{
  await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.kill();
  console.log(JSON.stringify({nativeHiddenObserved:report.nativeHiddenObserved,stoppedWhenHidden:report.stoppedWhenHidden,offsetHeld:report.offsetHeld,resumedWhenVisible:report.resumedWhenVisible,before:report.before?.visibility,hidden:report.hidden?.visibility,restored:report.restored?.visibility},null,2));
}
