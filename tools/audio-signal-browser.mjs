import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(process.argv[2]||resolve(import.meta.dirname,'..'));
const output=resolve(process.argv[3]||join(root,'reports/mute-investigation/signal-browser'));
await mkdir(output,{recursive:true});
const report={root,candidate:JSON.parse(await readFile(join(root,'package.json'),'utf8')).version,
  method:'Isolated headless Edge. Native decoded PCM and Analyser samples after real audio gains. Original output connections stay intact. Each observer has a zero-gain destination branch. Ordinary pointer and keyboard actions control the game.',
  checks:[],cases:[],errors:[],failedAssets:[],failure:null};
for(const file of ['src/audio.js','src/campaign-recorded-audio.js','src/app.js','src/storage.js'])
  (report.sourceHashes??={})[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);console.log('PASS '+name);};
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser,page;
const state=()=>page.evaluate(()=>({flight:window.arrowSpaceShift.read(),audio:window.arrowSpaceShift.audio(),
  preferences:JSON.parse(localStorage.getItem('arrow-space-shift:preferences:v1')),contextCount:window.__signalContexts.length,
  gains:window.__signalContexts.map(context=>context.__signalGains.slice(0,6).map((gain,index)=>({index,value:gain.gain.value}))),
  decoded:window.__signalDecoded}));
async function sample(label,seconds=2){
  const result=await page.evaluate(async seconds=>{
    const context=window.__signalContexts[0],names=['master','music','effects','ambience','core','air'];
    const rows=context.__signalAnalysers.slice(0,6).map((analyser,index)=>({name:names[index],samples:0,peak:0,rmsMax:0,rmsSum:0,buffer:new Float32Array(analyser.fftSize)}));
    const until=performance.now()+seconds*1000;
    while(performance.now()<until){
      rows.forEach((row,index)=>{context.__signalAnalysers[index].getFloatTimeDomainData(row.buffer);let energy=0;
        for(const value of row.buffer){row.peak=Math.max(row.peak,Math.abs(value));energy+=value*value;}
        const rms=Math.sqrt(energy/row.buffer.length);row.rmsMax=Math.max(row.rmsMax,rms);row.rmsSum+=rms;row.samples++;
      });await new Promise(resolve=>setTimeout(resolve,25));
    }
    return rows.map(({buffer,rmsSum,...row})=>({...row,rmsMean:rmsSum/row.samples}));
  },seconds);
  const current=await state(),item={label,signals:result,state:current};report.cases.push(item);return item;
}
const signal=(item,name)=>item.signals.find(row=>row.name===name);
try{
  const url=await new Promise((accept,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Server startup timed out.')),10000);
    server.once('error',reject);server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
  report.url=url;
  browser=await chromium.launch({channel:'msedge',headless:true,ignoreDefaultArgs:['--autoplay-policy=no-user-gesture-required']});
  report.browser=browser.version();
  const session=await browser.newBrowserCDPSession();
  const command=await session.send('Browser.getBrowserCommandLine').catch(error=>({error:error.message}));
  report.browserAudioArgs=command.arguments?.filter(arg=>/audio|autoplay|media|fake-device/.test(arg))||null;
  report.commandLineInspection={argumentListReturned:Array.isArray(command.arguments),error:command.error||null};await session.detach();
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{
    const Native=window.AudioContext||window.webkitAudioContext,connect=AudioNode.prototype.connect;
    window.__signalContexts=[];window.__signalDecoded=[];
    window.AudioContext=class extends Native{
      constructor(...args){super(...args);this.__signalGains=[];this.__signalAnalysers=[];window.__signalContexts.push(this);}
      createGain(){
        const gain=super.createGain(),index=this.__signalGains.length;this.__signalGains.push(gain);
        if(index<6){const analyser=super.createAnalyser(),sink=super.createGain();analyser.fftSize=2048;analyser.smoothingTimeConstant=0;sink.gain.value=0;
          connect.call(gain,analyser);connect.call(analyser,sink);connect.call(sink,this.destination);this.__signalAnalysers.push(analyser);}
        return gain;
      }
      async decodeAudioData(...args){
        const buffer=await super.decodeAudioData(...args);let peak=0,energy=0,count=0;
        for(let channel=0;channel<buffer.numberOfChannels;channel++)for(const value of buffer.getChannelData(channel)){peak=Math.max(peak,Math.abs(value));energy+=value*value;count++;}
        window.__signalDecoded.push({channels:buffer.numberOfChannels,rate:buffer.sampleRate,frames:buffer.length,seconds:buffer.duration,peak,rms:Math.sqrt(energy/count)});
        return buffer;
      }
    };
  });
  page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)report.failedAssets.push({url:response.url(),status:response.status()});});
  await page.goto(url);await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  await page.waitForTimeout(300);
  report.initial=await state();
  if(report.initial.audio.contextState!=='running'){
    await page.locator('#sound-toggle').click();report.requiredEnableClick=true;
  }else report.requiredEnableClick=false;
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.trackId==='identified-return-r9'&&window.arrowSpaceShift.audio().recorded.state==='playing');
  const title=await sample('Title: default preferences',4);
  check('Title decoded PCM is not silent',title.state.decoded.some(buffer=>buffer.seconds>70&&buffer.rms>.001));
  check('Title produces a music bus signal',signal(title,'music').rmsMax>1e-4);
  check('Title produces a post-master signal before the hardware destination',signal(title,'master').rmsMax>1e-4);
  await page.locator('#primary').click();
  await page.waitForFunction(()=>window.arrowSpaceShift.read().phase==='running'&&window.arrowSpaceShift.audio().recorded.trackId==='act1-03'&&window.arrowSpaceShift.audio().recorded.state==='playing');
  const campaign=await sample('Act I tutorial: no fire',3);
  check('Campaign produces a music bus signal',signal(campaign,'music').rmsMax>1e-4);
  check('Campaign produces a post-master signal',signal(campaign,'master').rmsMax>1e-4);
  for(const [key,ms] of [['ArrowLeft',200],['ArrowRight',400]]){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);}
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.lesson==='shoot');
  await page.keyboard.down('Space');
  const fire=await sample('Act I tutorial: real manual firing',1.2);await page.keyboard.up('Space');
  check('Manual fire produces a native effects bus signal',signal(fire,'effects').rmsMax>1e-4);
  check('Manual fire and music reach the post-master node',signal(fire,'master').rmsMax>1e-4);
  await page.locator('#sound-toggle').click();await page.waitForTimeout(350);
  const muted=await sample('Speaker mute control',.5);
  check('Speaker mute reduces the post-master signal to zero',signal(muted,'master').peak<1e-7);
  check('Speaker mute persists a false sound preference',muted.state.preferences.sound===false);
  await page.locator('#sound-toggle').click();
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.state==='playing');
  const enabled=await sample('Speaker enabled during flight',1.5);
  check('Speaker enable restores the post-master campaign signal',signal(enabled,'master').rmsMax>1e-4&&enabled.state.audio.recorded.trackId==='act1-03');
  check('One audio context serves title, campaign, mute, and enable',enabled.state.contextCount===1);
  await page.getByRole('button',{name:'Options',exact:true}).click();
  await page.locator('#volume').focus();await page.keyboard.press('Home');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.state==='playing');await page.waitForTimeout(350);
  const zeroVolume=await sample('Master volume zero control',.7);
  check('Zero master volume can show playing while output is zero',zeroVolume.state.audio.recorded.state==='playing'&&signal(zeroVolume,'music').rmsMax>1e-4&&signal(zeroVolume,'master').peak<1e-7);
  await page.getByRole('button',{name:'Options',exact:true}).click();
  await page.locator('#volume').focus();await page.keyboard.press('End');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.state==='playing');
  const fullVolume=await sample('Master volume restored control',.7);
  check('Restoring master volume restores a post-master signal',signal(fullVolume,'master').rmsMax>1e-4);
  check('No page exception or failed asset response occurred',report.errors.length===0&&report.failedAssets.length===0);
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;}
finally{
  report.limits='Signals are measured inside native Web Audio before its hardware destination. This does not prove sound at speakers or headphones. The isolated headless browser can have a --mute-audio flag. No user browser, storage, output device, or browser setting is changed.';
  await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  await browser?.close();server.kill();console.log(JSON.stringify({checks:report.checks.length,failure:report.failure},null,2));
}
