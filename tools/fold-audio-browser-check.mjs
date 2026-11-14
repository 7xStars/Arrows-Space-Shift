import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(process.argv[2]||resolve(import.meta.dirname,'..'));
const output=resolve(process.argv[3]||join(root,'reports/fold-audio-dev3/browser'));
const sourceOverride=process.argv[4]?resolve(process.argv[4]):null;
await mkdir(output,{recursive:true});
const report={candidate:JSON.parse(await readFile(join(root,'package.json'),'utf8')).version,
  method:'Isolated headless Edge. Existing QA entry fixtures select Acts I to III. Real keyboard input folds and unfolds. Act IV uses its existing QA entry page. Native Web Audio calls and read-only diagnostics are observed. No game rule or audio policy is mocked.',
  results:[],errors:[],badRequests:[],cases:[],failure:null};
for(const file of ['src/audio.js','src/campaign-recorded-audio.js','src/app.js','src/hyperbolic-act.js'])
  (report.hashes??={})[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser,page;
const check=(name,value)=>{assert.ok(value,name);report.results.push(name);console.log(`PASS ${name}`);};
const read=()=>page.evaluate(()=>window.__foldSnapshot());
async function sample(label,seconds){
  const before=await read(),choices=[],end=Date.now()+seconds*1000;
  while(Date.now()<end){
    await page.waitForTimeout(Math.min(150,end-Date.now()));
    const state=await read();
    if(state.phase==='choosing'){
      await page.waitForTimeout(220);const choiceBefore=await read();
      await page.keyboard.press('Digit1');await page.waitForTimeout(150);
      choices.push({before:choiceBefore,after:await read()});
    }
  }
  return {label,before,after:await read(),choices};
}
async function keyCase(key){
  const before=await read();await page.keyboard.press(key);await page.waitForTimeout(180);const after=await read();
  return {key,before,after};
}
try{
  const url=await new Promise((accept,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Server startup timed out.')),10000);
    server.once('error',reject);server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
  report.url=url;
  browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{
    const Native=window.AudioContext||window.webkitAudioContext;
    window.__foldContexts=[];window.__foldStarts=[];window.__foldStops=[];window.__foldSamples=[];
    const connect=AudioNode.prototype.connect;
    AudioNode.prototype.connect=function(destination,...args){this.__foldNext=destination;return connect.call(this,destination,...args);};
    window.AudioContext=class extends Native{
      constructor(...args){super(...args);this.__foldGains=[];window.__foldContexts.push(this);}
      createGain(){const gain=super.createGain();this.__foldGains.push(gain);return gain;}
      createBufferSource(){
        const source=super.createBufferSource(),start=source.start.bind(source),stop=source.stop.bind(source);
        const bus=()=>{let n=source;for(let i=0;n&&i<15;i++,n=n.__foldNext)if(n===this.__foldGains[1]||(n===this.__foldGains[3]&&source.buffer?.duration>20))return 'music';return 'other';};
        source.start=(...args)=>{source.__foldId=window.__foldStarts.length;window.__foldStarts.push({id:source.__foldId,bus:bus(),at:args[0]??this.currentTime,offset:args[1]??0,duration:source.buffer?.duration});return start(...args);};
        source.stop=(...args)=>{window.__foldStops.push({id:source.__foldId,bus:bus(),at:args[0]??this.currentTime});return stop(...args);};return source;
      }
    };
    window.__foldSnapshot=()=>{
      const api=window.arrowSpaceShift||window.arrowSpaceShiftActFour,s=api?.read(),a=api?.audio();
      return {wall:performance.now(),time:s?.time,phase:s?.phase,paused:s?.paused,fields:s?.fields?.length,foldsUsed:s?.foldsUsed,
        wave:s?.campaign?.currentWave,phaseBreakUntil:s?.campaign?.phaseBreakUntil,bossPhase:s?.campaign?.bossPhase,
        event:s?.events?.slice(-3),audio:a,contexts:window.__foldContexts.length,
        actualCore:window.__foldContexts[0]?.__foldGains[4]?.gain.value,
        actualAir:window.__foldContexts[0]?.__foldGains[5]?.gain.value,
        sourceStarts:window.__foldStarts.filter(x=>x.bus==='music').length,sourceStops:window.__foldStops.filter(x=>x.bus==='music').length};
    };
    setInterval(()=>{if((window.arrowSpaceShift||window.arrowSpaceShiftActFour)&&window.__foldSamples.length<5000)window.__foldSamples.push(window.__foldSnapshot());},25);
  });
  page=await context.newPage();page.setDefaultTimeout(12000);
  if(sourceOverride){
    report.sourceOverride={root:sourceOverride,hashes:{}};
    for(const file of ['src/audio.js','src/campaign-recorded-audio.js','src/app.js']){
      const body=await readFile(join(sourceOverride,file),'utf8');report.sourceOverride.hashes[file]=createHash('sha256').update(body).digest('hex');
      await page.route(`**/${file}`,route=>route.fulfill({status:200,contentType:'text/javascript',body}));
    }
  }
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)report.badRequests.push({url:response.url(),status:response.status()});});
  for(const [act,chapter,track] of [[1,0,'act1-03'],[2,9,'act2-03'],[3,18,'act3-03'],[3,25,'act3-03']]){
    await page.goto(new URL('index.html?qa=1',url).href);await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
    await page.locator('#primary').click();
    await page.getByRole('button',{name:'Options',exact:true}).click();
    await page.getByRole('button',{name:'QA: Projective Ecology',exact:true}).click();
    await page.evaluate(index=>window.arrowSpaceShiftTest.loadChapterTrial(index),chapter);
    await page.locator('canvas').focus();await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(id=>{const a=window.arrowSpaceShift.audio();return a.recorded.trackId===id&&a.recorded.state==='playing';},track);
    await page.waitForTimeout(2300);
    const result={act,chapter,track,fold:await keyCase('ShiftLeft')};report.cases.push(result);
    if(chapter===25){
      result.secondFold=await keyCase('ShiftLeft');result.thirdFold=await keyCase('ShiftLeft');
      result.hold=await sample('Three folds held',6);
      check('Projective Mastery advances through real combat while folded',result.hold.after.time>result.hold.before.time+2);
      check('Folding reaches the Echo Forge choice through the route',result.hold.choices.length>0);
      if(!sourceOverride)for(const choice of result.hold.choices){
        check('Echo Forge keeps both native music stems running',choice.before.audio.recorded.state==='playing'&&choice.before.audio.recorded.activeSources>=2);
        check('Echo Forge keeps the rhythm audible in the recovery mix',choice.before.audio.recorded.layers.core>0&&choice.before.actualCore>0);
        check('A real Forge choice retains its music clock',choice.after.audio.recorded.offset>choice.before.audio.recorded.offset&&choice.after.sourceStops===choice.before.sourceStops);
      }
    }
    result.unfold=await keyCase('ShiftRight');
    check(`Act ${act} keyboard fold changes the real field count`,result.fold.after.fields>result.fold.before.fields);
    check(`Act ${act} keyboard unfold removes the real field`,result.unfold.after.fields<result.unfold.before.fields);
    for(const event of [result.fold,result.unfold]){
      check(`Act ${act} ${event.key} retains the track and running context`,event.after.audio.recorded.trackId===track&&event.after.audio.contextState==='running');
      check(`Act ${act} ${event.key} retains native music sources`,event.after.sourceStops===event.before.sourceStops&&event.after.audio.recorded.activeSources>=2);
      check(`Act ${act} ${event.key} advances the music offset`,event.after.audio.recorded.offset>event.before.audio.recorded.offset);
    }
    result.samples=await page.evaluate(()=>window.__foldSamples);result.nativeStarts=await page.evaluate(()=>window.__foldStarts);result.nativeStops=await page.evaluate(()=>window.__foldStops);
  }
  await page.goto(new URL('hyperbolic-act.html?qa=1',url).href);await page.locator('#launch').click();await page.locator('canvas').focus();
  await page.waitForFunction(()=>window.arrowSpaceShiftActFour.audio().recorded.state==='playing');
  const bolza={act:4,fold:await keyCase('ShiftLeft')};report.cases.push(bolza);
  check('Act IV keyboard fold records the real action',bolza.fold.after.event.some(e=>e.type==='fold'));
  check('Act IV fold keeps native music playback active',bolza.fold.after.audio.recorded.activeSources>=2&&bolza.fold.after.sourceStops===bolza.fold.before.sourceStops);
  await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowLeft');await page.keyboard.down('Space');
  bolza.interval=await sample('Segment boundary with active combat and real steering/fire',24.3);
  await page.keyboard.up('ArrowUp');await page.keyboard.up('ArrowLeft');await page.keyboard.up('Space');
  bolza.samples=await page.evaluate(()=>window.__foldSamples);bolza.nativeStarts=await page.evaluate(()=>window.__foldStarts);bolza.nativeStops=await page.evaluate(()=>window.__foldStops);
  check('Act IV continues through the first recording segment boundary',bolza.interval.after.audio.recorded.history.some(x=>x.segment===1)&&bolza.interval.after.audio.recorded.underruns===0);
  await page.keyboard.press('p');await page.waitForTimeout(150);const paused=await read();
  check('Pause stops recorded music sources',paused.audio.recorded.activeSources===0&&paused.paused===true);
  await page.keyboard.press('p');await page.waitForFunction(()=>window.arrowSpaceShiftActFour.audio().recorded.state==='playing');
  const resumed=await read();check('Resume keeps the recording position',resumed.audio.recorded.offset>=paused.audio.recorded.offset&&resumed.audio.recorded.offset<paused.audio.recorded.offset+1);
  await page.locator('#options-open').click();await page.locator('#music').uncheck();await page.locator('#options-close').click();await page.keyboard.press('p');await page.waitForTimeout(180);
  check('Music mute leaves the recording silent during resumed play',(await read()).audio.recorded.activeSources===0);
  check('No browser exception or failed asset request occurred',report.errors.length===0&&report.badRequests.length===0);
}catch(error){report.failure=error.stack||error.message;if(page&&!page.isClosed()){report.failureState=await read().catch(()=>null);await page.screenshot({path:join(output,'failure.png')}).catch(()=>{});}throw error;}
finally{
  report.checks=report.results.length;report.limits='This is native browser playback and input verification. QA entry fixtures select late Acts. These checks do not establish human listening, player comprehension, physical latency, or physical-device performance.';
  await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  if(browser)await browser.close();server.kill();console.log(JSON.stringify({checks:report.checks,failure:report.failure},null,2));
}
