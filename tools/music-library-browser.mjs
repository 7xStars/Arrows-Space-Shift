import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const project=resolve(import.meta.dirname,'..'),root=resolve(process.argv[2]||project),
  output=resolve(process.argv[3]||join(project,'reports/stc-act-library-r1/browser'));
await mkdir(output,{recursive:true});
const results=[],errors=[],failedRequests=[],trackChecks=[];
const report={revision:'stc-act-library-r1',root,results,errors,failedRequests,trackChecks,
  input:'Ordinary keyboard and native controls, with read-only runtime inspection.',
  limits:'Local headless Microsoft Edge. No listening approval, screen-reader, physical-device, physical audio latency, automatic page-visibility, or heap-retention result.'};
for(const file of ['music-library.html','src/music-library-app.js']){
  report.sourceIdentity||={};report.sourceIdentity[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
}
const check=(name,value)=>{assert.ok(value,name);results.push(name);};
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser,url;
try{
  url=await new Promise((accept,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error('The library server did not start.')),10000);
    server.once('error',reject);server.stdout.on('data',chunk=>{log+=chunk;const match=log.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
  browser=await chromium.launch({headless:true,channel:'msedge'});report.browserVersion=browser.version();
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{
    const Native=window.AudioContext||window.webkitAudioContext;window.__musicContextCount=0;window.__musicSources=[];window.__musicGains=[];window.__musicDecodePair=[];
    const ids=new WeakMap();let next=1;
    if(Native)window.AudioContext=class extends Native{
      constructor(...args){super(...args);window.__musicContextCount++;}
      createBufferSource(){
        const source=super.createBufferSource(),record={started:false,ended:false,stopped:false,disconnected:false},
          start=source.start.bind(source),stop=source.stop.bind(source),disconnect=source.disconnect.bind(source);
        source.start=(at=0,offset=0,...rest)=>{const buffer=source.buffer;if(!ids.has(buffer))ids.set(buffer,next++);
          window.__musicDecodePair.push(buffer);if(window.__musicDecodePair.length>2)window.__musicDecodePair.shift();
          Object.assign(record,{started:true,at,offset,bufferId:ids.get(buffer),duration:buffer.duration,frames:buffer.length,channels:buffer.numberOfChannels,rate:buffer.sampleRate});return start(at,offset,...rest);};
        source.stop=(...args)=>{record.stopped=true;return stop(...args);};source.disconnect=(...args)=>{record.disconnected=true;return disconnect(...args);};
        source.addEventListener('ended',()=>{record.ended=true;});window.__musicSources.push(record);return source;
      }
      createGain(){const node=super.createGain();window.__musicGains.push(node);return node;}
    };
    localStorage.setItem('arrow-space-shift:music-library-fixture','retained');window.__musicStorageBefore=JSON.stringify(Object.fromEntries(Object.entries(localStorage)));
    window.__musicStorageWrites=[];const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
    Storage.prototype.setItem=function(...args){window.__musicStorageWrites.push('set');return set.apply(this,args);};
    Storage.prototype.removeItem=function(...args){window.__musicStorageWrites.push('remove');return remove.apply(this,args);};
    Storage.prototype.clear=function(...args){window.__musicStorageWrites.push('clear');return clear.apply(this,args);};
  });
  const page=await context.newPage();const audioRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)failedRequests.push({url:response.url(),status:response.status()});});
  page.on('request',request=>{if(/\.ogg(?:\?|$)/.test(request.url()))audioRequests.push(request.url());});
  await page.goto(new URL('music-library.html',url).href);
  await page.waitForFunction(()=>window.arrowSpaceShiftMusicLibrary?.read().trackCount===16);
  const read=()=>page.evaluate(()=>window.arrowSpaceShiftMusicLibrary.read());
  const active=()=>page.evaluate(()=>window.__musicSources.filter(value=>value.started&&!value.stopped&&!value.ended&&!value.disconnected));
  let state=await read();
  check('The catalog contains four durations for all four Acts',state.trackCount===16&&[1,2,3,4].every(act=>
    JSON.stringify(state.tracks.filter(track=>track.act===act).map(track=>track.seconds))===JSON.stringify([60,120,240,360])));
  check('Startup selects a track without audio autoplay',state.state==='ready'&&state.contextCreations===0&&audioRequests.length===0&&(await active()).length===0);
  check('The Act control has a native accessible name',await page.getByRole('combobox',{name:'Act',exact:true}).count()===1);
  await page.locator('#act').selectOption('2');check('Act selection exposes four track cards',await page.locator('.track').count()===4&&await page.locator('[data-track="act2-04"]').count()===1);
  check('Browsing the catalog does not fetch music',audioRequests.length===0&&(await read()).contextCreations===0);
  await page.locator('#act').selectOption('1');const first=state.tracks[0];
  await page.locator(`[data-select="${first.id}"]`).focus();await page.keyboard.press('Enter');
  check('Track selection retains keyboard focus on its control',await page.locator(`[data-select="${first.id}"]`).evaluate(element=>element===document.activeElement));
  await page.locator('#play').click();await page.waitForFunction(()=>['playing','error'].includes(window.arrowSpaceShiftMusicLibrary.read().state),null,{timeout:30000});
  report.firstPlayback=await read();assert.equal(report.firstPlayback.state,'playing',JSON.stringify(report.firstPlayback));
  state=await read();const pair=await active();
  check('Playback creates one context and one decoded pair',state.contextCreations===1&&state.buffers===2&&state.activeSources===2&&audioRequests.length===2);
  check('Both native sources start at one time and offset',pair.length===2&&pair[0].at===pair[1].at&&pair[0].offset===pair[1].offset&&pair[0].frames===pair[1].frames);
  await page.waitForTimeout(220);await page.locator('#pause').click();state=await read();const pausedAt=state.position;
  check('Pause retains position and removes both active sources',state.state==='paused'&&pausedAt>0&&(await active()).length===0);
  await page.locator('#play').click();await page.waitForFunction(()=>window.arrowSpaceShiftMusicLibrary.read().state==='playing');
  const resumed=await active();check('Resume reuses both buffers at the retained position',resumed.length===2&&resumed[0].offset===resumed[1].offset&&Math.abs(resumed[0].offset-pausedAt)<.01&&
    resumed[0].bufferId===pair[0].bufferId&&resumed[1].bufferId===pair[1].bufferId&&audioRequests.length===2);
  await page.locator('#atmosphere').uncheck();await page.waitForTimeout(400);state=await read();
  check('Atmosphere mute keeps the core and shared timeline active',!state.atmosphere&&state.activeSources===2&&await page.evaluate(()=>Math.abs(window.__musicGains[1].gain.value)<.001));
  await page.locator('#volume').focus();await page.keyboard.press('Home');await page.waitForTimeout(250);
  check('The native Volume control can mute the full mix',(await read()).volume===0&&await page.evaluate(()=>Math.abs(window.__musicGains[0].gain.value)<.001));
  await page.keyboard.press('End');await page.locator('#atmosphere').check();
  await page.locator('#stop').click();state=await read();check('Stop returns the selected track to its start',state.state==='ready'&&state.position===0&&state.buffers===2&&(await active()).length===0);
  await page.locator('#seek').focus();await page.keyboard.press('End');for(let index=0;index<10;index++)await page.keyboard.press('ArrowLeft');
  await page.locator('#play').click();await page.waitForFunction(()=>window.arrowSpaceShiftMusicLibrary.read().state==='ended');
  check('Natural track end clears the current source pair',(await read()).activeSources===0&&(await active()).length===0);
  for(const track of (await read()).tracks){
    await page.locator('#act').selectOption(String(track.act));await page.locator(`[data-select="${track.id}"]`).click();
    await page.evaluate(()=>{window.__musicDecodePair=[];});
    const selected=await read();assert.equal(selected.buffers,0);assert.equal(selected.activeSources,0);
    await page.locator('#play').click();await page.waitForFunction(()=>window.arrowSpaceShiftMusicLibrary.read().state==='playing',null,{timeout:45000});
    const loaded=await read(),native=await active();assert.equal(loaded.buffers,2);assert.equal(native.length,2);
    assert.ok(native.every(value=>value.channels===2&&Math.abs(value.duration-track.seconds)<.02));
    assert.equal(native[0].frames,native[1].frames);assert.equal(native[0].at,native[1].at);
    await page.locator('#pause').click();
    const decoded=await page.evaluate(()=>{
      const buffers=window.__musicDecodePair;if(buffers.length!==2)throw new Error('The native probe has no current stem pair.');
      const data=buffers.map(buffer=>[buffer.getChannelData(0),buffer.getChannelData(1)]),
        core={peak:0,nonFinite:0,fullScale:0},atmosphere={peak:0,nonFinite:0,fullScale:0},combined={peak:0,nonFinite:0,fullScale:0};
      for(let channel=0;channel<2;channel++)for(let frame=0;frame<buffers[0].length;frame++){
        const values=[data[0][channel][frame],data[1][channel][frame]];values.push(values[0]+values[1]);
        const meters=[core,atmosphere,combined];
        for(let index=0;index<3;index++){
          const value=values[index],meter=meters[index];if(!Number.isFinite(value))meter.nonFinite++;
          else{meter.peak=Math.max(meter.peak,Math.abs(value));if(Math.abs(value)>=1)meter.fullScale++;}
        }
      }
      window.__musicDecodePair=[];return {core,atmosphere,combined};
    });
    trackChecks.push({id:track.id,seconds:track.seconds,frames:native[0].frames,rate:native[0].rate,channels:2,contextCreations:loaded.contextCreations,decoded});
    for(const meter of Object.values(decoded)){assert.equal(meter.nonFinite,0,`${track.id} has non-finite decoded samples`);assert.equal(meter.fullScale,0,`${track.id} reaches full scale after decode`);}
    await page.locator('#stop').click();
  }
  check('All sixteen real encoded stem pairs decode and start',trackChecks.length===16);
  check('Every native decoded core, atmosphere, and combined mix has finite samples below full scale',trackChecks.every(track=>
    Object.values(track.decoded).every(meter=>meter.nonFinite===0&&meter.fullScale===0)));
  check('All track changes reuse one context and retain only the current pair',(await read()).contextCreations===1&&(await read()).buffers===2&&(await active()).length===0);
  check('Playback history remains bounded',(await read()).history.length<=32);
  await page.locator('#play').click();await page.waitForFunction(()=>window.arrowSpaceShiftMusicLibrary.read().state==='playing');
  await page.locator('#pause').click();
  await page.screenshot({path:join(output,'library-desktop.png'),fullPage:true});
  await page.setViewportSize({width:320,height:568});await page.locator('#act').scrollIntoViewIfNeeded();
  check('The library reflows at 320 pixels without horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check('All controls have usable compact target bounds',await page.locator('button,select,input[type="checkbox"]').evaluateAll(elements=>elements.every(element=>{
    const rect=element.getBoundingClientRect();return rect.width>=20&&rect.height>=20;
  })));
  await page.screenshot({path:join(output,'library-320.png'),fullPage:true});
  await page.evaluate(()=>{document.documentElement.dir='rtl';});
  check('RTL layout retains its content without horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:join(output,'library-320-rtl.png'),fullPage:true});
  await page.evaluate(()=>{document.documentElement.dir='ltr';document.body.style.fontSize='200%';});
  check('Text at 200 percent retains control access and reflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:join(output,'library-320-text-200.png'),fullPage:true});
  await page.evaluate(()=>{document.body.style.fontSize='';});
  await page.emulateMedia({reducedMotion:'reduce'});
  check('The library contains no automatic visual animation',await page.evaluate(()=>document.getAnimations().length===0));
  check('Controls use native buttons, ranges, and a checkbox',await page.getByRole('button',{name:'Resume',exact:true}).count()===1&&
    await page.getByRole('slider',{name:'Volume',exact:true}).count()===1&&await page.getByRole('checkbox',{name:'Include atmosphere',exact:true}).count()===1);
  const storage=await page.evaluate(()=>({unchanged:window.__musicStorageBefore===JSON.stringify(Object.fromEntries(Object.entries(localStorage))),writes:window.__musicStorageWrites}));
  check('The library does not write campaign or preference storage',storage.unchanged&&storage.writes.length===0);report.storage=storage;
  check('The normal browser flow has no page exception or missing asset',errors.length===0&&failedRequests.length===0);
  const failureContext=await browser.newContext(),failurePage=await failureContext.newPage(),failureErrors=[];
  failurePage.on('pageerror',error=>failureErrors.push(error.message));await failurePage.route('**/*-atmosphere.ogg',route=>route.fulfill({status:503,body:'Controlled unavailable atmosphere fixture'}));
  await failurePage.goto(new URL('music-library.html',url).href);await failurePage.waitForFunction(()=>window.arrowSpaceShiftMusicLibrary?.read().trackCount===16);
  await failurePage.locator('#play').click();await failurePage.waitForFunction(()=>window.arrowSpaceShiftMusicLibrary.read().state==='error');
  check('A missing layer stops the pair and gives a retry instruction',await failurePage.locator('#status').innerText().then(text=>/Select Play to retry/.test(text))&&
    (await failurePage.evaluate(()=>window.arrowSpaceShiftMusicLibrary.read().activeSources))===0);
  await failurePage.unroute('**/*-atmosphere.ogg');await failurePage.locator('#play').click();await failurePage.waitForFunction(()=>window.arrowSpaceShiftMusicLibrary.read().state==='playing');
  check('Retry recovers the pair without a second context',await failurePage.evaluate(()=>{const state=window.arrowSpaceShiftMusicLibrary.read();return state.contextCreations===1&&state.activeSources===2;})&&failureErrors.length===0);
  report.controlledFailure={status:503,errors:failureErrors};await failureContext.close();
  console.log(JSON.stringify({checks:results.length,trackPairs:trackChecks.length,results,errors,failedRequests},null,2));
}catch(error){report.failure=String(error.stack||error);throw error;}
finally{
  report.url=url;report.checks=results.length;await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  if(browser)await browser.close();server.kill();
}
