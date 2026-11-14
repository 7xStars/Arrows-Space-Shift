import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(import.meta.dirname,'../..'),out=import.meta.dirname;
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const url=await new Promise((accept,reject)=>{let data='';const timer=setTimeout(()=>reject(new Error('Server start timeout.')),10000);server.stdout.on('data',chunk=>{data+=chunk;const match=data.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});server.once('error',reject);});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage(),checks=[],errors=[];
page.on('pageerror',error=>errors.push(error.message));
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
let decoded,states;
try{
  await page.goto(url+'recorded-check-page');
  await page.evaluate(async()=>{
    const module=await import('/src/audio.js');const recording=await import('/src/campaign-recorded-audio.js');
    window.qa={module,recording,contexts:0};document.body.innerHTML='<button id="start">Start recording check</button>';
    document.querySelector('#start').onclick=async()=>{
      const context=new AudioContext({sampleRate:48000});qa.contexts++;qa.audio=new module.FlightAudio();qa.audio.useContext(context);await context.resume();
      qa.selection=recording.campaignRecordingFor({campaign:{index:0}});qa.audio.recorded.update(qa.selection,true);
      qa.timer=setInterval(()=>qa.audio.recorded.update(null,qa.audio.recorded.desired),16);
    };
  });
  await page.locator('#start').click();
  await page.waitForFunction(()=>qa.audio?.recorded.read().state==='playing'&&qa.audio.recorded.read().loadedSegments===2);
  const initial=await page.evaluate(()=>qa.audio.diagnosticState());
  check('The actual browser decodes and plays the aligned produced Act I stems',initial.recorded.trackId==='act1-03'&&initial.recorded.activeSources===2&&initial.recorded.error==='');
  await page.evaluate(()=>{qa.audio.recorded.update(null,false);qa.audio.recorded.offset=23.75;qa.audio.recorded.update(qa.selection,true);});
  await page.waitForFunction(()=>qa.audio.recorded.read().history.some(item=>item.absolute===1));
  const crossing=await page.evaluate(()=>qa.audio.recorded.read());
  check('The next actual stem pair starts on the shared scheduled boundary',crossing.history.filter(item=>item.absolute===1).length===1&&crossing.activeSources<=4);
  await page.waitForTimeout(450);
  await page.evaluate(()=>qa.audio.recorded.update(null,false));
  const paused=await page.evaluate(()=>qa.audio.recorded.read());await page.waitForTimeout(100);
  check('Pause retains the audio position and stops the actual sources',await page.evaluate(offset=>qa.audio.recorded.read().activeSources===0&&qa.audio.recorded.read().offset===offset,paused.offset));
  await page.evaluate(()=>qa.audio.recorded.update(qa.selection,true));
  await page.waitForFunction(()=>qa.audio.recorded.read().state==='playing');
  check('Resume uses one existing AudioContext',await page.evaluate(()=>qa.contexts===1&&qa.audio.recorded.read().offset>=24));
  await page.evaluate(()=>qa.audio.recorded.update({...qa.selection,quiet:true},true));
  check('Recovery removes the core and retains the produced atmosphere',await page.evaluate(()=>qa.audio.recorded.read().layers.core===0&&qa.audio.recorded.read().layers.atmosphere===1));
  await page.evaluate(()=>{qa.audio.recorded.update(null,false);clearInterval(qa.timer);});
  decoded=await page.evaluate(async()=>{
    const rows=[];
    for(const [theme,track] of Object.entries(qa.recording.CAMPAIGN_RECORDINGS))for(const segment of track.segments){
      for(const url of segment.urls){
        const response=await fetch(url);if(!response.ok)throw new Error(String(response.status));
        const buffer=await qa.audio.context.decodeAudioData(await response.arrayBuffer());
        rows.push({theme,index:segment.index,channels:buffer.numberOfChannels,rate:buffer.sampleRate,frames:buffer.length,expected:Math.round(segment.duration*buffer.sampleRate)});
      }
    }
    return rows;
  });
  check('All 81 produced files decode to their exact stereo frame counts in Edge',decoded.length===81&&decoded.every(item=>item.channels===2&&item.rate===48000&&item.frames===item.expected));
  await page.evaluate(async()=>{await qa.audio.startTitle();});
  await page.waitForFunction(()=>qa.audio.recorded.read().trackId==='identified-return-r9'&&qa.audio.recorded.read().state==='playing');
  const title=await page.evaluate(()=>qa.audio.diagnosticState());
  check('The explicit title API plays the existing produced r9 recording',title.recorded.activeSources===1&&title.recorded.trackId==='identified-return-r9');
  await page.evaluate(()=>qa.audio.stopTitle());
  check('The title stop API stops its actual source',await page.evaluate(()=>qa.audio.recorded.read().activeSources===0));
  states={initial,crossing,paused,title};
  check('The isolated native browser check has no page exception',errors.length===0);
}finally{
  await writeFile(join(out,'native-browser.json'),JSON.stringify({browser:'Microsoft Edge headless',checks:checks.length,passed:checks,errors,decoded,states,limits:'Native browser audio decode, scheduling, and lifecycle. This is an isolated engine check. It is not an audible listening review, a full game playthrough, or a physical-device result.'},null,2)+'\n');
  await browser.close();server.kill();console.log(JSON.stringify({checks:checks.length,passed:checks,errors},null,2));
}
