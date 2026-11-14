import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(process.argv[2]||resolve(import.meta.dirname,'..')),out=resolve(process.argv[3]||'reports/campaign-music-v1/game-browser');await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const url=await new Promise((accept,reject)=>{let data='';const timer=setTimeout(()=>reject(new Error('Server startup timed out.')),10000);server.stdout.on('data',chunk=>{data+=chunk;const m=data.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m){clearTimeout(timer);accept(m[0]);}});server.once('error',reject);});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage(),errors=[],results=[],states={},missingAssets=[],publicLinks=[];
let forcedFailure=false;
page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{
  if(response.status()<400||!new URL(response.url()).pathname.startsWith('/assets/'))return;
  if(forcedFailure&&response.status()===503&&response.url().includes('/campaign-music-v1/'))return;
  missingAssets.push({url:response.url(),status:response.status()});
});
page.on('requestfailed',request=>{if(new URL(request.url()).pathname.startsWith('/assets/'))missingAssets.push({url:request.url(),failure:request.failure()?.errorText});});
await page.addInitScript(()=>{
  const Native=window.AudioContext||window.webkitAudioContext;window.__contexts=[];window.__sourceStarts=[];
  const connect=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(destination,...args){this.__qaNext=destination;return connect.call(this,destination,...args);};
  const record=(context,source,kind,args)=>{
    let node=source,bus='other';
    for(let index=0;node&&index<14;index++,node=node.__qaNext){
      if(node===context.__qaGains[1]){bus='music';break;}
      if(node===context.__qaGains[2]){bus='effects';break;}
      if(node===context.__qaGains[3]){bus='ambience';break;}
    }
    window.__sourceStarts.push({kind,bus,at:args[0]??context.currentTime,duration:source.buffer?.duration??null});
  };
  window.AudioContext=class extends Native{
    constructor(...args){super(...args);this.__qaGains=[];window.__contexts.push(this);}
    createGain(){const gain=super.createGain();this.__qaGains.push(gain);return gain;}
    createOscillator(){const source=super.createOscillator(),start=source.start.bind(source);source.start=(...args)=>{record(this,source,'oscillator',args);return start(...args);};return source;}
    createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{record(this,source,'buffer',args);return start(...args);};return source;}
  };
});
const check=(name,value)=>{assert.ok(value,name);results.push(name);console.log(`PASS ${name}`);};
const closeOptions=async()=>{await page.locator('#options-close').click();await page.waitForFunction(()=>!document.querySelector('#options-dialog').open&&document.activeElement?.id==='options-open');};
const inspectLinks=async entry=>publicLinks.push({entry,visibleResearchLinks:await page.locator('a[href]').evaluateAll(links=>links.filter(link=>
  link.getClientRects().length&&/operator-lab|hyperbolic-lab|divergent-pulse|music-library|track-review|playtest\.html/.test(link.getAttribute('href'))
).map(link=>({href:link.getAttribute('href'),text:link.textContent.trim()})))});
try{
  await page.goto(new URL('index.html',url).href);await page.waitForFunction(()=>window.arrowSpaceShift);
  await inspectLinks('index.html');
  await page.waitForTimeout(300);
  states.titleAutomaticAttempt=await page.evaluate(()=>window.arrowSpaceShift.audio());
  if(states.titleAutomaticAttempt.contextState!=='running'){
    await page.getByRole('button',{name:'Enable title music',exact:true}).click();
    states.titleEnableClicks=1;
  }else states.titleEnableClicks=0;
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.trackId==='identified-return-r9'&&window.arrowSpaceShift.audio().recorded.state==='playing');
  states.title=await page.evaluate(()=>window.arrowSpaceShift.audio());
  await page.screenshot({path:join(out,'title-recording.png')});
  check('The title starts r9 automatically or from one Enable title music click',await page.evaluate(()=>window.__contexts.length===1&&window.__sourceStarts.some(source=>source.kind==='buffer'&&source.bus==='music'&&source.duration>70)));
  await page.locator('#title-music').click();
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.activeSources===0);
  check('The title stop action stops its recorded source',await page.evaluate(()=>window.arrowSpaceShift.audio().recorded.state==='paused'));
  await page.locator('#title-music').click();
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.state==='playing');
  check('The title can restart after Stop without another context',await page.evaluate(()=>window.__contexts.length===1&&window.arrowSpaceShift.audio().recorded.activeSources===1));
  await page.locator('#primary').click();
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.trackId==='act1-03'&&window.arrowSpaceShift.audio().recorded.state==='playing');
  check('Campaign launch replaces the title and does not restore its pending request',await page.evaluate(()=>window.arrowSpaceShift.audio().recorded.mode==='traditional'&&window.arrowSpaceShift.audio().recorded.activeSources===2));

  forcedFailure=true;
  await page.route('**/assets/audio/campaign-music-v1/**',route=>route.fulfill({status:503,contentType:'text/plain',body:'Recorded music load test.'}));
  await page.goto(new URL('hyperbolic-act.html?qa=1',url).href);await page.locator('#launch').click();
  await page.waitForFunction(()=>window.__contexts.length===1&&window.__contexts[0].state==='running');
  await page.waitForFunction(()=>window.arrowSpaceShiftActFour.audio().recorded.state==='error');
  states.loadFailure=await page.evaluate(()=>window.arrowSpaceShiftActFour.audio());
  check('An actual recording load failure leaves music silent without a procedural score',await page.evaluate(()=>{
    const a=window.arrowSpaceShiftActFour.audio();return a.recorded.engine==='recorded-segments'&&a.recorded.activeSources===0&&Boolean(a.recorded.error)&&!window.__sourceStarts.some(source=>source.bus==='music'||source.bus==='ambience');
  }));
  const effectsBefore=await page.evaluate(()=>window.__sourceStarts.filter(source=>source.bus==='effects').length);
  await page.keyboard.down('Space');await page.waitForTimeout(180);await page.keyboard.up('Space');
  check('Manual fire still schedules effects while the recording has failed',await page.evaluate(count=>window.arrowSpaceShiftActFour.read().shots.length>0&&window.__sourceStarts.filter(source=>source.bus==='effects').length>count,effectsBefore));
  await page.locator('#options-open').click();
  check('Options report the real recording error and show Retry music',await page.locator('.music-source').innerText().then(text=>text.includes('Music could not load.')&&text.includes('Retry music')));
  await page.unroute('**/assets/audio/campaign-music-v1/**');
  forcedFailure=false;
  await page.getByRole('button',{name:'Retry music',exact:true}).click();
  await page.waitForFunction(()=>!window.arrowSpaceShiftActFour.audio().recorded.error);
  check('Retry loads the recording while Options keep play paused',await page.evaluate(()=>window.arrowSpaceShiftActFour.read().paused&&window.arrowSpaceShiftActFour.audio().recorded.activeSources===0));
  await closeOptions();await page.keyboard.press('p');
  await page.waitForFunction(()=>window.arrowSpaceShiftActFour.audio().recorded.state==='playing');
  states.recovered=await page.evaluate(()=>window.arrowSpaceShiftActFour.audio());
  await page.screenshot({path:join(out,'act-four-recording.png')});await inspectLinks('hyperbolic-act.html');
  check('Act IV starts the actual aligned recorded core and atmosphere after Retry',await page.evaluate(()=>{
    const a=window.arrowSpaceShiftActFour.audio(),starts=window.__sourceStarts.filter(source=>source.kind==='buffer'&&['music','ambience'].includes(source.bus));
    return a.recorded.trackId==='act4-03'&&a.recorded.activeSources===2&&starts.length===2&&starts[0].at===starts[1].at&&starts.every(source=>source.duration>24);
  }));
  check('The live soundtrack schedules no procedural music oscillator',await page.evaluate(()=>!window.__sourceStarts.some(source=>source.kind==='oscillator'&&['music','ambience'].includes(source.bus))));
  await page.locator('#field').click();
  const before=await page.evaluate(()=>window.arrowSpaceShiftActFour.read().time);
  await page.evaluate(()=>window.__contexts[0].suspend());
  await page.keyboard.down('Space');await page.waitForTimeout(150);await page.keyboard.up('Space');
  await page.waitForFunction(()=>window.__contexts[0].state==='running');
  check('Manual fire recovers an interrupted context without restarting play',await page.evaluate(t=>window.__contexts.length===1&&window.arrowSpaceShiftActFour.read().time>t,before));
  await page.locator('#options-open').click();
  for(const [id,value] of [['music-volume',20],['effects-volume',75],['ambience-volume',10]]){
    await page.locator('#'+id).fill(String(value));await page.locator('#'+id).dispatchEvent('input');
  }
  await closeOptions();await page.reload();
  await page.waitForFunction(()=>window.arrowSpaceShiftActFour);
  check('All independent volume levels survive page reload',await page.evaluate(()=>{
    const p=JSON.parse(localStorage.getItem('arrow-space-shift:preferences:v1'));return p.musicVolume===.2&&p.effectsVolume===.75&&p.ambienceVolume===.1;
  }));
  await page.locator('#launch').click();
  await page.waitForFunction(()=>window.arrowSpaceShiftActFour.audio().recorded.state==='playing');
  await page.locator('#options-open').click();await page.locator('#music').uncheck();await closeOptions();
  await page.keyboard.press('p');await page.locator('#field').click();
  const musicOffEffects=await page.evaluate(()=>window.__sourceStarts.filter(source=>source.bus==='effects').length);
  await page.keyboard.down('Space');await page.waitForTimeout(150);await page.keyboard.up('Space');
  check('Music mute stops its sources while manual effects remain active',await page.evaluate(count=>{
    const a=window.arrowSpaceShiftActFour.audio();return a.recorded.activeSources===0&&window.__sourceStarts.filter(source=>source.bus==='effects').length>count;
  },musicOffEffects));
  await page.locator('#options-open').click();await page.locator('#sound').click();await closeOptions();await page.keyboard.press('p');await page.locator('#field').click();
  const mutedStarts=await page.evaluate(()=>window.__sourceStarts.length);
  await page.keyboard.down('Space');await page.waitForTimeout(150);await page.keyboard.up('Space');
  check('Sound mute stops audio scheduling while Act IV runs with visible status',await page.evaluate(count=>!window.arrowSpaceShiftActFour.read().paused&&window.arrowSpaceShiftActFour.audio().recorded.activeSources===0&&window.__sourceStarts.length===count&&document.getElementById('status').textContent.length>0,mutedStarts));
  await page.evaluate(()=>localStorage.setItem('arrow-space-shift:transfer-backup:v1','{broken'));
  const stored=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])));
  for(const [entry,ready] of [['index.html','arrowSpaceShift'],['hyperbolic-act.html','arrowSpaceShiftActFour'],['repair-dock.html','arrowSpaceShiftRepair']]){
    await page.goto(new URL(entry,url).href);await page.waitForFunction(name=>Boolean(window[name]),ready);
    await page.waitForTimeout(100);
    const after=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])));
    let titleMuted=true;
    if(entry==='index.html'){
      states.savedMuteTitle=await page.evaluate(()=>({disabled:document.querySelector('#title-music').disabled,label:document.querySelector('#title-music').textContent,contexts:window.__contexts.length,audio:window.arrowSpaceShift.audio()}));
      titleMuted=states.savedMuteTitle.disabled&&states.savedMuteTitle.label==='Title music off'&&states.savedMuteTitle.contexts===0;
    }
    check(`${entry} preserves unresolved recovery storage${entry==='index.html'?' and the saved title mute':''}`,JSON.stringify(after)===JSON.stringify(stored)&&titleMuted);
    await inspectLinks(entry);
  }
  check('No audio page exception, missing asset, or visible research link occurred',errors.length===0&&missingAssets.length===0&&publicLinks.every(entry=>entry.visibleResearchLinks.length===0));
}finally{
  await writeFile(join(out,'results.json'),JSON.stringify({root,checks:results.length,results,errors,missingAssets,publicLinks,states,
    limits:'Actual headless Edge page actions, native recording sources, forced load failure and retry, effects routing, context recovery, settings, and muted play. No audible listening review, physical latency result, or complete campaign playthrough.'},null,2)+'\n');
  await browser.close();server.kill();console.log(JSON.stringify({checks:results.length,results,errors},null,2));
}
