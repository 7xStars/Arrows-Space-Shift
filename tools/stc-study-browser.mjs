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
  output=resolve(process.argv[3]||join(project,'reports/stc-study-r7/browser'));
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const results=[],errors=[],failedRequests=[];let browser,url;
const check=(name,value)=>{assert.ok(value,name);results.push(name);};
const sourceFiles=['divergent-pulse.html','src/divergent-pulse-app.js','src/divergent-pulse.js','src/stc-track-player.js','src/stc-score.js',
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
    window.__stcNativePanners=[];
    const createPanner=BaseAudioContext.prototype.createPanner;
    BaseAudioContext.prototype.createPanner=function(...args){
      const node=createPanner.apply(this,args),record={node,disconnected:false},disconnect=node.disconnect.bind(node);
      node.disconnect=(...targets)=>{record.disconnected=true;return disconnect(...targets);};
      window.__stcNativePanners.push(record);return node;
    };
    window.__stcNativeConvolvers=[];
    const createConvolver=BaseAudioContext.prototype.createConvolver;
    BaseAudioContext.prototype.createConvolver=function(...args){const node=createConvolver.apply(this,args);window.__stcNativeConvolvers.push(node);return node;};
    window.__stcBufferSources=[];window.__stcBufferIds=new WeakMap();window.__stcNextBufferId=1;
    const createBufferSource=BaseAudioContext.prototype.createBufferSource;
    BaseAudioContext.prototype.createBufferSource=function(...args){
      const node=createBufferSource.apply(this,args),record={node,started:false,stopAt:null,ended:false,disconnected:false,when:null,offset:null},
        start=node.start.bind(node),stop=node.stop.bind(node),disconnect=node.disconnect.bind(node);
      node.start=(when=0,offset=0,...rest)=>{record.started=true;record.when=when;record.offset=offset;return start(when,offset,...rest);};
      node.stop=(when=0,...args)=>{record.stopAt=when||this.currentTime;return stop(when,...args);};
      node.disconnect=(...args)=>{record.disconnected=true;return disconnect(...args);};
      node.addEventListener('ended',()=>{record.ended=true;});
      window.__stcBufferSources.push(record);return node;
    };
    window.__stcNativeOscillators=[];
    const createOscillator=BaseAudioContext.prototype.createOscillator;
    BaseAudioContext.prototype.createOscillator=function(...args){
      const node=createOscillator.apply(this,args),record={node,started:false,stopAt:null,ended:false,disconnected:false},
        start=node.start.bind(node),stop=node.stop.bind(node),disconnect=node.disconnect.bind(node);
      node.start=(...args)=>{record.started=true;return start(...args);};
      node.stop=(when=0,...args)=>{record.stopAt=when||this.currentTime;return stop(when,...args);};
      node.disconnect=(...args)=>{record.disconnected=true;return disconnect(...args);};
      node.addEventListener('ended',()=>{record.ended=true;});
      window.__stcNativeOscillators.push(record);return node;
    };
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
  const nativeMusic=()=>page.evaluate(()=>window.__stcBufferSources.filter(record=>record.started&&!record.ended&&!record.disconnected&&
    (record.stopAt===null||record.stopAt>record.node.context.currentTime)&&record.node.buffer?.duration>10).map(record=>{
    const buffer=record.node.buffer;if(!window.__stcBufferIds.has(buffer))window.__stcBufferIds.set(buffer,window.__stcNextBufferId++);
    return {bufferId:window.__stcBufferIds.get(buffer),duration:buffer.duration,length:buffer.length,sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels,
      when:record.when,offset:record.offset,loop:record.node.loop};
  }));
  const nativeProcessing=()=>page.evaluate(()=>({hrtf:window.__stcNativePanners.filter(record=>record.node.panningModel==='HRTF').length,
    convolvers:window.__stcNativeConvolvers.length,
    oscillators:window.__stcNativeOscillators.filter(record=>record.started&&!record.ended&&!record.disconnected&&
      (record.stopAt===null||record.stopAt>record.node.context.currentTime)).length}));
  const wait=condition=>page.waitForFunction(condition,{}, {timeout:10000});
  let state=await read();
  report.studyVersion=state.version;report.musicRevision=state.musicRevision;report.audioScoreId=state.audioScoreId;
  check('The r7 study starts ready without an audio context',state.status==='ready'&&state.audio.contextCreations===0&&
    state.version==='stc-study-r7'&&state.musicRevision==='identified-return-r7-bass-fade'&&state.audioScoreId===state.musicRevision);
  await page.locator('#start').click();
  await wait(()=>window.arrowSpaceShiftPulse.read().audio.playing);
  await page.waitForTimeout(160);state=await read();
  check('A launch gesture starts one running audio context',state.audio.contextCreations===1&&state.audio.contextState==='running');
  const firstMusic=await nativeMusic(),processing=await nativeProcessing();
  check('Stereo is the only session playback mode',state.options.spatialMode==='stereo'&&await page.locator('#spatial-mode').count()===0);
  check('The browser plays two decoded stereo stems',firstMusic.length===2&&firstMusic.every(source=>source.channels===2&&source.duration>10));
  check('Dry and room stems start at the same time and offset',firstMusic[0].when===firstMusic[1].when&&firstMusic[0].offset===firstMusic[1].offset&&
    Math.abs(firstMusic[0].length-firstMusic[1].length)<=1&&firstMusic[0].sampleRate===firstMusic[1].sampleRate);
  check('The browser adds no HRTF or convolution processing',processing.hrtf===0&&processing.convolvers===0);
  check('The room amount starts at the lower session default',state.options.roomVolume===.12&&state.audio.roomVolume===.12);
  const primaryEntry=state.audio.sourceHistory.find(event=>event.objectId===state.primary.id);
  check('The actual attack entry has a source motif before its first return',Boolean(primaryEntry)&&state.primary.joins===0);
  await page.waitForTimeout(300);
  check('Continuous music uses recorded stems without browser synth voices',(await nativeProcessing()).oscillators===0);
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
  check('Pause stops and disconnects both musical sources',(await nativeMusic()).length===0);
  await page.keyboard.press('KeyP');await page.waitForTimeout(160);state=await read();
  check('Resume retains one audio context',!state.paused&&state.audio.playing&&state.audio.contextCreations===1);
  const resumedMusic=await nativeMusic();
  check('Resume reuses both decoded stem buffers',resumedMusic.length===2&&resumedMusic.every(source=>firstMusic.some(previous=>previous.bufferId===source.bufferId)));
  check('Resume seeks both stems to the retained position',resumedMusic[0].offset===resumedMusic[1].offset&&resumedMusic[0].offset>0);
  await page.locator('#guide').click();
  check('Guide stops the active music sources',(await nativeMusic()).length===0);
  const range=async(selector,value)=>{await page.locator(selector).scrollIntoViewIfNeeded();await page.locator(selector).focus();await page.keyboard.press('Home');for(let i=0;i<Math.floor(value/10);i++)await page.keyboard.press('PageUp');for(let i=0;i<value%10;i++)await page.keyboard.press('ArrowRight');};
  await range('#music-volume',20);await range('#effects-volume',70);
  await range('#room-volume',0);
  state=await read();
  check('Native mix controls set independent session levels',state.options.musicVolume===.2&&state.options.effectsVolume===.7&&state.options.volume===.5);
  check('The recorded mix exposes no inactive ambience control',await page.locator('#ambience-volume').count()===0);
  await page.locator('#close-options').click();await page.keyboard.press('KeyP');await page.waitForTimeout(250);state=await read();
  report.selectedMix=state.audio;
  check('The active recorded music uses its selected mix gain',Math.abs(state.audio.buses.music-.2)<.01);
  const dryGain=state.audio.dryGain;
  check('Room zero mutes only the room stem',state.options.roomVolume===0&&Math.abs(state.audio.wetGain)<.001&&dryGain>0&&(await nativeMusic()).length===2);
  await page.locator('#guide').click();await range('#room-volume',55);
  state=await read();check('The native Room control selects a session amount',state.options.roomVolume===.55&&state.paused);
  check('Room has a native slider role and visible label',await page.getByRole('slider',{name:/^Room/}).count()===1);
  await page.locator('#sound').focus();await page.keyboard.press('Tab');
  check('Keyboard Tab reaches Room after Sound',await page.locator('#room-volume').evaluate(element=>element===document.activeElement));
  await page.screenshot({path:join(output,'options-1280x900.png')});
  await page.setViewportSize({width:320,height:568});await page.locator('#room-volume').scrollIntoViewIfNeeded();
  const roomFits=await page.locator('#room-volume').evaluate(element=>{
    const r=element.getBoundingClientRect(),dialog=element.closest('dialog');
    return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&dialog.scrollWidth<=dialog.clientWidth;
  });
  check('The Room control remains reachable in the compact dialog',roomFits);
  await page.screenshot({path:join(output,'options-room-320x568.png')});
  await page.locator('#close-options').click();
  check('Closing Options returns focus to its button',await page.locator('#guide').evaluate(element=>element===document.activeElement));
  await page.setViewportSize({width:1280,height:900});
  await page.keyboard.press('KeyP');await page.waitForTimeout(160);state=await read();
  check('The room stem returns without changing the dry gain',state.audio.wetGain>0&&Math.abs(state.audio.dryGain-dryGain)<.001);
  check('Room changes keep one context and two synchronized sources',state.audio.contextCreations===1&&(await nativeMusic()).length===2);
  await page.locator('#guide').click();await page.locator('#sound').uncheck();
  await page.locator('#close-options').click();await page.keyboard.press('KeyP');await page.waitForTimeout(160);state=await read();
  check('Mute keeps the selected room amount and clears audible output',state.options.roomVolume===.55&&!state.options.sound&&Math.abs(state.audio.masterGain)<.001);
  await page.locator('#guide').click();await page.locator('#sound').check();
  await page.locator('#close-options').click();await page.keyboard.press('KeyP');await page.waitForTimeout(160);state=await read();
  check('Unmute resumes one musical instance with the selected room',state.options.sound&&state.options.roomVolume===.55&&state.audio.wetGain>0&&
    state.audio.contextCreations===1&&(await nativeMusic()).length===2);
  await wait(()=>window.arrowSpaceShiftPulse.read().canAdvance);const primaryId=state.primary.id;
  await page.locator('#next').click();
  await wait(()=>{const s=window.arrowSpaceShiftPulse.read();return s.phaseIndex===1&&s.trace.some(trace=>trace.objectId===s.primary.id);});
  await wait(()=>Math.abs(window.arrowSpaceShiftPulse.read().audio.buses.effects-.7)<.01);
  state=await read();const crossing=state.trace.find(trace=>trace.objectId===state.primary.id);
  report.activeCueMix=state.audio;
  check('An actual return cue uses the selected Effects gain',Math.abs(state.audio.buses.effects-.7)<.01);
  check('The teaching attack retains its ID through an actual paired crossing',state.primary.id===primaryId&&state.primary.joins>0&&crossing.to===(crossing.from+4)%8);
  check('The actual crossing routes one retained audio motif',state.audio.crossingHistory.some(event=>event.eventId===crossing.eventId&&event.objectId===primaryId&&event.to===crossing.to));
  const returned=state.audio.crossingHistory.find(event=>event.eventId===crossing.eventId);
  check('Source and return retain the same object motif',returned.motif===primaryEntry.motif&&returned.objectId===primaryEntry.objectId);
  check('Recorded music preserves the actual destination cue pan',Math.abs(returned.pan-Math.max(-.65,Math.min(.65,crossing.destination.x)))<1e-9);
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
  check('Restart leaves no musical source active',(await nativeMusic()).length===0);
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
  await wait(()=>window.arrowSpaceShiftPulse.read().canAdvance);await page.locator('#next').click();
  await wait(()=>window.arrowSpaceShiftPulse.read().phaseIndex===1&&window.arrowSpaceShiftPulse.read().trace.length>0);
  state=await read();
  const mismatchCrossing=state.trace.find(event=>event.objectId===state.primary.id),
    mismatchCue=state.audio.crossingHistory.find(event=>event.eventId===mismatchCrossing.eventId);
  check('Recorded music preserves the research mismatch cue rule',Boolean(mismatchCue)&&mismatchCue.mode==='mismatched'&&
    Math.abs(mismatchCue.pan+Math.max(-.65,Math.min(.65,mismatchCrossing.destination.x)))<1e-9);
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
  check('Native export retains earlier first choices and the music revision',notes.study==='stc-study-r7'&&notes.musicRevision===report.musicRevision&&
    download.suggestedFilename()==='divergent-pulse-r7-notes.json'&&
    notes.previousRuns.some(run=>run.records.some(record=>record.firstChoice===0))&&
    notes.previousRuns.some(run=>run.records.some(record=>record.taskKind==='listen-only'&&record.notScored)));
  check('Native export retains the session room choices',notes.spatialMode==='stereo'&&notes.audioOptions.spatialMode==='stereo'&&notes.roomVolume===.55&&
    notes.roomHistory.some(event=>event.roomVolume===0)&&notes.roomHistory.at(-1).roomVolume===.55);
  check('All study runs retain decoded buffers without extra music instances',(await nativeMusic()).length<=2&&
    state.audio.decodeCount===2&&state.audio.bufferLoads===2&&(await nativeProcessing()).hrtf===0&&(await nativeProcessing()).convolvers===0);
  const storage=await page.evaluate(()=>({unchanged:window.__stcBefore===JSON.stringify(Object.fromEntries(Object.entries(localStorage))),writes:window.__stcStorageWrites}));
  check('Study actions preserve campaign storage without writes',storage.unchanged&&storage.writes.length===0);
  check('The browser recorded no page exception',errors.length===0);
  check('Every requested runtime resource loaded',failedRequests.length===0);
  report.final=await read();report.storage=storage;
  const failureContext=await browser.newContext({viewport:{width:1280,height:900}}),failurePage=await failureContext.newPage(),failureErrors=[];
  let releaseAssets;const assetGate=new Promise(accept=>{releaseAssets=accept;});
  await failurePage.route('**/assets/audio/*.ogg',async route=>{await assetGate;await route.fulfill({status:503,body:'Controlled unavailable-audio fixture'});});
  failurePage.on('pageerror',error=>failureErrors.push(error.message));
  await failurePage.goto(new URL('divergent-pulse.html',url).href);await failurePage.locator('#start').click();
  check('Loading feedback prevents repeated Start input',await failurePage.locator('#start').isDisabled()&&await failurePage.locator('#status').innerText()==='Loading music.');
  releaseAssets();
  await failurePage.waitForFunction(()=>Boolean(window.arrowSpaceShiftPulse.read().audio.loadError));
  check('An unavailable music asset has a visible sound-off fallback',/Music is not available/.test(await failurePage.locator('#status').innerText())&&
    !(await failurePage.locator('#start').isDisabled()));
  await failurePage.locator('#guide').click();await failurePage.locator('#sound').uncheck();await failurePage.locator('#close-options').click();
  await failurePage.keyboard.press('KeyP');await failurePage.locator('#field').focus();
  await failurePage.keyboard.down('Space');await failurePage.waitForTimeout(100);await failurePage.keyboard.up('Space');
  const fallback=await failurePage.evaluate(()=>window.arrowSpaceShiftPulse.read());
  check('Silent play remains available after a controlled music-load failure',!fallback.options.sound&&fallback.shots.length>0&&failureErrors.length===0);
  report.controlledAudioFailure={expectedStatus:503,loadError:fallback.audio.loadError,manualShots:fallback.shots.length,errors:failureErrors};
  await failureContext.close();
  console.log(JSON.stringify({checks:results.length,results,errors,failedRequests},null,2));
}catch(error){report.failure=String(error.stack||error);throw error;}
finally{
  report.url=url;report.checks=results.length;
  await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  if(browser)await browser.close();server.kill();
}
