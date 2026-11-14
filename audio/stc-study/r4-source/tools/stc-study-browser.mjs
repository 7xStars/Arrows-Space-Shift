import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {pairedSideGlyph} from '../src/hyperbolic-visuals.js';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const project=resolve(import.meta.dirname,'..'),root=resolve(process.argv[2]||project),
  output=resolve(process.argv[3]||join(project,'reports/stc-study-r4/browser'));
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const results=[],errors=[],failedRequests=[];let browser,url;
const check=(name,value)=>{assert.ok(value,name);results.push(name);};
const sourceFiles=['divergent-pulse.html','src/divergent-pulse-app.js','src/divergent-pulse.js','src/stc-audio.js','src/stc-score.js',
  'src/hyperbolic.js','src/hyperbolic-campaign.js','src/hyperbolic-visuals.js'];
const sourceIdentity=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,createHash('sha256').update(await readFile(join(root,file))).digest('hex')])));
const report={study:'Divergent Pulse',geometryContract:'ASS-STC-003:r3',root,input:'Ordinary keyboard and native controls',results,errors,failedRequests,
  sourceIdentity,nodeVersion:process.version,platform:process.platform,
  limits:'Local headless Microsoft Edge. Read-only state supports real input checks. No listening acceptance, human prediction, physical touch, or device-latency result.'};
try{
  url=await new Promise((accept,reject)=>{let text='';const timer=setTimeout(()=>reject(new Error('The study server did not start.')),10000);
    server.once('error',reject);server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
  browser=await chromium.launch({headless:true,channel:'msedge'});
  report.browserVersion=browser.version();
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{
    window.__stcCanvasText=[];
    const canvasText=CanvasRenderingContext2D.prototype.fillText,canvasFill=CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillText=function(...args){window.__stcCanvasText.push(String(args[0]));return canvasText.apply(this,args);};
    CanvasRenderingContext2D.prototype.fillRect=function(...args){if(args[0]===0&&args[1]===0&&args[2]===1000&&args[3]===700)window.__stcCanvasText=[];return canvasFill.apply(this,args);};
    const fixtures={
      'arrow-space-shift:fleet:v1':'{"version":5,"selectedShip":1,"driveParts":["klein-relay"],"fixture":"stc-preservation"}',
      'arrow-space-shift:checkpoint:v1':'{"version":1,"fixture":"stc-preservation"}',
      'arrow-space-shift:act4:v1':'{"version":3,"resumeStage":3,"fixture":"stc-preservation"}',
      'arrow-space-shift:journey:v1':'{"version":1,"fixture":"stc-preservation"}',
      'arrow-space-shift:preferences:v1':'{"version":1,"volume":0.37,"reducedMotion":false,"fixture":"stc-preservation"}'
    };
    for(const [key,value] of Object.entries(fixtures))localStorage.setItem(key,value);
    window.__stcBefore=JSON.stringify(Object.fromEntries(Object.entries(localStorage)));
    window.__stcStorageWrites=[];
    const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
    Storage.prototype.setItem=function(key,value){window.__stcStorageWrites.push({operation:'set',key});return set.call(this,key,value);};
    Storage.prototype.removeItem=function(key){window.__stcStorageWrites.push({operation:'remove',key});return remove.call(this,key);};
    Storage.prototype.clear=function(){window.__stcStorageWrites.push({operation:'clear'});return clear.call(this);};
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)failedRequests.push({url:response.url(),status:response.status()});});
  await page.goto(new URL('divergent-pulse.html',url).href);
  await page.waitForFunction(()=>window.arrowSpaceShiftPulse);
  const read=()=>page.evaluate(()=>window.arrowSpaceShiftPulse.read());
  const wait=condition=>page.waitForFunction(condition,{}, {timeout:10000});
  let state=await read();
  report.studyVersion=state.version;report.musicRevision=state.musicRevision;report.audioScoreId=state.audioScoreId;
  check('The study starts ready without an audio context',state.status==='ready'&&state.audio.contextCreations===0);
  await page.locator('#start').click();
  await wait(()=>window.arrowSpaceShiftPulse.read().audio.playing);
  await page.waitForTimeout(160);state=await read();
  check('A launch gesture starts one running audio context',state.audio.contextCreations===1&&state.audio.contextState==='running');
  const primaryEntry=state.audio.sourceHistory.find(event=>event.objectId===state.primary.id);
  check('The actual attack entry has a source motif before its first return',Boolean(primaryEntry)&&state.primary.joins===0);
  check('The player does not fire without Space',state.shots.length===0&&!state.events.some(event=>event.type==='manual-fire'));
  const beforeMove=state.player.position;
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(220);await page.keyboard.up('ArrowUp');
  state=await read();
  check('Ordinary arrow input moves the ship',Math.hypot(state.player.position.x-beforeMove.x,state.player.position.y-beforeMove.y)>.001);
  await page.keyboard.down('Space');await page.waitForTimeout(100);await page.keyboard.up('Space');
  state=await read();
  check('Manual Space creates a physical player shot',state.shots.length>0&&state.events.some(event=>event.type==='manual-fire'));
  await page.keyboard.press('KeyP');const paused=await read();await page.waitForTimeout(260);state=await read();
  check('Pause stops the study clock and music',state.paused&&state.time===paused.time&&!state.audio.playing);
  await page.keyboard.press('KeyP');await page.waitForTimeout(160);state=await read();
  check('Resume retains one audio context',!state.paused&&state.audio.playing&&state.audio.contextCreations===1);
  await page.locator('#guide').click();
  const range=async(selector,value)=>{await page.locator(selector).focus();await page.keyboard.press('Home');for(let i=0;i<value/10;i++)await page.keyboard.press('PageUp');};
  await range('#music-volume',20);await range('#effects-volume',70);await range('#ambience-volume',10);
  state=await read();
  check('Native mix controls set independent session levels',state.options.musicVolume===.2&&state.options.effectsVolume===.7&&state.options.ambienceVolume===.1&&state.options.volume===.5);
  await page.locator('#close-options').click();await page.keyboard.press('KeyP');await page.waitForTimeout(100);state=await read();
  check('The resumed graph uses all three selected gains',Math.abs(state.audio.buses.music-.2)<.01&&Math.abs(state.audio.buses.effects-.7)<.01&&Math.abs(state.audio.buses.ambience-.1)<.01);
  await wait(()=>window.arrowSpaceShiftPulse.read().canAdvance);const primaryId=state.primary.id;
  await page.locator('#next').click();
  await wait(()=>{const s=window.arrowSpaceShiftPulse.read();return s.phaseIndex===1&&s.trace.some(trace=>trace.objectId===s.primary.id);});
  state=await read();const crossing=state.trace.find(trace=>trace.objectId===state.primary.id);
  check('The teaching attack retains its ID through an actual paired crossing',state.primary.id===primaryId&&state.primary.joins>0&&crossing.to===(crossing.from+4)%8);
  check('The actual crossing routes one retained audio motif',state.audio.crossingHistory.some(event=>event.eventId===crossing.eventId&&event.objectId===primaryId&&event.to===crossing.to));
  const returned=state.audio.crossingHistory.find(event=>event.eventId===crossing.eventId);
  check('Source and return retain the same object motif',returned.motif===primaryEntry.motif&&returned.objectId===primaryEntry.objectId);
  await page.locator('#next').click();await wait(()=>window.arrowSpaceShiftPulse.read().canAdvance);
  state=await read();check('Complication adds a distinct second physical attack',state.secondary&&state.secondary.id!==state.primary.id&&state.primary.id===primaryId);
  await page.locator('#next').click();
  await page.waitForTimeout(50);state=await read();
  const selected=state.displayCrossing,latest=state.trace.filter(trace=>trace.objectId===state.primary.id).at(-1),
    mapping=`${pairedSideGlyph(selected.from)} → ${pairedSideGlyph(selected.to)}`;
  check('The disclosure selects the latest actual primary crossing',selected.eventId===latest.eventId);
  check('The HUD and canvas show the same actual mapping',(await page.locator('#crossings').innerText()).includes(mapping)&&
    await page.evaluate(expected=>window.__stcCanvasText.some(text=>text.startsWith('SAME OBJECT')&&text.includes(expected)),mapping));
  await page.screenshot({path:join(output,'disclosure.png')});
  await page.locator('#next').click();state=await read();
  check('Transfer starts a changed example before feedback',state.awaitingPrediction&&state.primary.id!==primaryId&&state.prediction===null&&state.feedback===null);
  check('The transfer hides destination feedback before a first choice',state.trace.length===0&&state.events.every(event=>event.type!=='crossing')&&await page.locator('#crossings').innerText()==='Destination withheld until first choice');
  const waitingPosition=state.primary.position,audioCrossings=state.audio.crossings,announcements=state.audio.announcements;
  await page.waitForTimeout(250);state=await read();
  check('No transfer movement or destination audio occurs before commitment',JSON.stringify(state.primary.position)===JSON.stringify(waitingPosition)&&state.audio.crossings===audioCrossings);
  check('The transfer has no source announcement before commitment',state.audio.announcements===announcements&&!state.audio.sourceHistory.some(event=>event.objectId===state.primary.id));
  await page.screenshot({path:join(output,'transfer-before-choice.png')});
  for(const viewport of [{width:390,height:844},{width:320,height:568}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(60);
    const fits=await page.evaluate(()=>[...document.querySelectorAll('header button,header a,footer button,#choices button')].filter(element=>!element.hidden&&element.getClientRects().length).every(element=>{
      const r=element.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;
    })&&document.documentElement.scrollWidth<=innerWidth+1);
    check(`Transfer choices fit ${viewport.width} by ${viewport.height}`,fits);
    await page.screenshot({path:join(output,`transfer-${viewport.width}x${viewport.height}.png`)});
  }
  await page.setViewportSize({width:1280,height:900});
  await page.locator('#edge-0').click();state=await read();
  check('The native edge control records one first choice',state.prediction.firstChoice===0&&state.records.length===1&&state.prediction.actualSide===null);
  await wait(()=>Boolean(window.arrowSpaceShiftPulse.read().feedback));state=await read();
  check('The real result retains the first response after disclosure',state.prediction.firstChoice===0&&state.records[0].firstChoice===0&&Number.isInteger(state.prediction.actualSide)&&state.feedback.objectId===state.primary.id);
  check('The committed transfer announces and returns the same motif',state.audio.sourceHistory.some(entry=>entry.objectId===state.primary.id&&
    state.audio.crossingHistory.some(returned=>returned.objectId===entry.objectId&&returned.motif===entry.motif)));
  check('The first answer cannot be replaced by a second edge click',await page.locator('#edge-1').isDisabled());
  await page.screenshot({path:join(output,'transfer-result.png')});
  await page.locator('#retry-transfer').click();const retry=await read();
  check('A retry changes the example and retains the earlier response',retry.retryCount===1&&retry.records.length===1&&retry.primary.id!==state.primary.id);
  await page.locator('#edge-1').click();await wait(()=>Boolean(window.arrowSpaceShiftPulse.read().feedback));state=await read();
  check('A retry is recorded as assisted',state.records.length===2&&state.records[1].assisted===true&&state.records[0].firstChoice===0);
  await page.locator('#restart').click();state=await read();
  check('Restart restores a ready study and stops music',state.status==='ready'&&state.phaseIndex===0&&state.shots.length===0&&state.records.length===0&&!state.audio.playing);
  await page.locator('#guide').click();await page.locator('#probe').check();await page.locator('#condition').selectOption('audio');
  await page.locator('#close-options').click();await page.locator('#start').click();
  if((await read()).paused)await page.locator('#pause').click();
  for(let phase=0;phase<4;phase++){await wait(()=>window.arrowSpaceShiftPulse.read().canAdvance);await page.locator('#next').click();}
  state=await read();
  check('Audio-only is a labeled non-damaging listening probe',state.condition==='audio'&&state.probe&&!state.awaitingPrediction&&await page.locator('#choices').isHidden());
  const listenContacts=state.contacts,listenShots=state.shots.length;
  await page.keyboard.down('Space');await page.keyboard.down('ArrowUp');await page.waitForTimeout(100);await page.keyboard.up('Space');await page.keyboard.up('ArrowUp');
  state=await read();
  check('Audio-only disables combat input and contact counts',state.contacts===listenContacts&&state.shots.length===listenShots&&await page.locator('[data-hold="Space"]').isDisabled());
  await wait(()=>Boolean(window.arrowSpaceShiftPulse.read().feedback));state=await read();
  check('Audio-only does not score a blind destination guess',state.prediction===null&&state.records.every(record=>record.notScored&&record.firstChoice===null&&record.correct===null));
  await page.locator('#restart').click();await page.locator('#guide').click();await page.locator('#condition').selectOption('mismatched');
  await page.locator('#reduced').check();await page.locator('#sound').uncheck();await page.locator('#close-options').click();
  state=await read();
  check('The mismatched condition is explicit and requires a safe probe',state.condition==='mismatched'&&state.probe&&/non-damaging/.test(await page.locator('#condition-label').innerText()));
  check('Silent and reduced-motion settings remain active',!state.options.sound&&state.options.reducedMotion);
  await page.locator('#start').click();if((await read()).paused)await page.locator('#pause').click();
  await page.waitForTimeout(250);const liveTime=(await read()).time;
  await page.locator('#guide').click();const guideState=await read();await page.waitForTimeout(200);state=await read();
  check('Guide pauses play and records its phase exposure',state.paused&&state.time===guideState.time&&state.guideHistory.length>0&&state.time>=liveTime);
  await page.locator('#close-options').click();check('Closing Guide keeps the study paused',(await read()).paused);
  await page.keyboard.press('KeyP');state=await read();
  check('P resumes while the Guide button has focus',!state.paused);
  for(const viewport of [{width:390,height:844},{width:320,height:568}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(70);
    const fits=await page.evaluate(()=>[...document.querySelectorAll('header button,header a,footer button')].filter(element=>!element.hidden).every(element=>{
      const r=element.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;
    })&&document.documentElement.scrollWidth<=innerWidth+1);
    check(`Study controls fit ${viewport.width} by ${viewport.height}`,fits);
    await page.screenshot({path:join(output,`study-${viewport.width}x${viewport.height}.png`)});
  }
  const downloading=page.waitForEvent('download');await page.locator('#export').click();
  const download=await downloading,notesPath=join(output,'study-notes.json');await download.saveAs(notesPath);
  const notes=JSON.parse(await readFile(notesPath,'utf8'));
  check('Native export retains earlier first choices and the music revision',notes.musicRevision===report.musicRevision&&
    notes.previousRuns.some(run=>run.records.some(record=>record.firstChoice===0))&&
    notes.previousRuns.some(run=>run.records.some(record=>record.taskKind==='listen-only'&&record.notScored)));
  const storage=await page.evaluate(()=>({unchanged:window.__stcBefore===JSON.stringify(Object.fromEntries(Object.entries(localStorage))),writes:window.__stcStorageWrites}));
  check('Study actions preserve campaign storage without writes',storage.unchanged&&storage.writes.length===0);
  check('The browser recorded no page exception',errors.length===0);
  check('Every requested runtime resource loaded',failedRequests.length===0);
  report.final=await read();report.storage=storage;
  console.log(JSON.stringify({checks:results.length,results,errors,failedRequests},null,2));
}catch(error){report.failure=String(error.stack||error);throw error;}
finally{
  report.url=url;report.checks=results.length;
  await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  if(browser)await browser.close();server.kill();
}
