import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const output=import.meta.dirname,extraction=JSON.parse(await readFile(join(output,'package-extraction.json'),'utf8'));
const report={revision:extraction.revision,limits:'Local headless Edge. No human, listening, physical-device, screen-reader, or frame-rate acceptance.',archives:{}};
const browser=await chromium.launch({headless:true,channel:'msedge'});report.browserVersion=browser.version();
try{
  for(const [name,archive]of Object.entries(extraction.archives)){
    const server=spawn(process.execPath,[join(archive.root,'tools/local-server.mjs'),'--port=0'],{cwd:archive.root,windowsHide:true});
    try{
      const url=await new Promise((accept,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error('The package server did not start.')),10000);
        server.once('error',reject);server.stdout.on('data',chunk=>{log+=chunk;const match=log.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
      const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[],missing=[],failedRequests=[],responses=[];
      page.on('pageerror',error=>errors.push(error.message));page.on('requestfailed',request=>failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
      page.on('response',response=>{responses.push({url:response.url(),status:response.status()});if(response.status()>=400)missing.push({url:response.url(),status:response.status()});});
      const response=await page.goto(url);await page.waitForFunction(()=>{const value=window.arrowSpaceShiftOperatorLab?.read();return value?.audio.ready&&value.audio.analysisReady;});
      await page.locator('[data-panel="sound"]').focus();await page.keyboard.press('Enter');
      await page.waitForFunction(()=>window.arrowSpaceShiftOperatorLab.read().active==='sound');
      await page.locator('[data-panel="motion"]').click();await page.screenshot({path:join(output,`root-entry-${name}.png`),fullPage:true});
      const state=await page.evaluate(()=>window.arrowSpaceShiftOperatorLab.read());
      assert.equal(response.status(),200);assert.equal(new URL(page.url()).pathname,'/');
      assert.equal(await page.locator('h1').innerText(),'Operator laboratory');assert.equal(state.revision,extraction.revision);
      assert.equal(state.active,'motion');assert.equal(state.audio.paused,true);assert.equal(state.audio.muted,true);
      assert.equal(await page.locator('audio').count(),1);assert.equal(errors.length,0);assert.equal(missing.length,0);assert.equal(failedRequests.length,0);
      assert.ok(responses.some(value=>value.url.endsWith('/src/operator-lab-app.js')));
      assert.ok(responses.some(value=>value.url.endsWith('/assets/audio/stc-operator-lab-r1/analysis.json')));
      report.archives[name]={archive:archive.file,archiveSha256:archive.sha256,root:archive.root,url,entry:'/',entryStatus:response.status(),
        indexSha256:createHash('sha256').update(await readFile(join(archive.root,'index.html'))).digest('hex'),
        title:await page.title(),revision:state.revision,muted:state.audio.muted,paused:state.audio.paused,keyboardSectionChange:'passed',
        errors,missing,failedRequests,responses,result:'passed'};
      await context.close();
    }finally{server.kill();}
  }
  console.log(JSON.stringify(report,null,2));
}finally{await writeFile(join(output,'package-root-entry.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
