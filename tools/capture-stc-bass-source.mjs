import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(import.meta.dirname,'..'),out=join(root,'audio/stc-study/foxdot-bass-r7');
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser;
try{
  const url=await new Promise((accept,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error('The source server did not start.')),10000);
    server.once('error',reject);server.stdout.on('data',chunk=>{log+=chunk;const match=log.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
  browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();await page.goto(url);
  const result=await page.evaluate(async()=>{
    const {StructuralAudio}=await import('./audio/stc-study/r5-source/src/stc-audio.js'),
      {STC_STEP_SECONDS,STC_DURATION}=await import('./audio/stc-study/r5-source/src/stc-score.js');
    const rate=48000,duration=STC_DURATION+2,frames=Math.ceil(duration*rate),context=new OfflineAudioContext(4,frames,rate),
      audio=new StructuralAudio({volume:1,spatialMode:'stereo'}).useContext(context);
    const connect=audio.connect;let acidMain;
    audio.connect=function(source,...nodes){if(nodes.at(-1)===this.acidRoute?.panner)acidMain=nodes.at(-2);return connect.call(this,source,...nodes);};
    audio.start();if(!acidMain)throw new Error('The direct acid source was not found.');
    acidMain.disconnect(audio.acidRoute.panner);
    for(const bus of Object.values(audio.buses))bus.disconnect();
    const fixed=context.createGain(),fixedMaster=context.createGain(),acidMaster=context.createGain(),
      acidMusic=context.createGain(),acidDuck=context.createGain(),split=context.createChannelSplitter(2),merge=context.createChannelMerger(4);
    audio.buses.music.connect(fixed);audio.buses.ambience.connect(fixed);
    fixedMaster.gain.value=0;acidMaster.gain.value=0;acidMusic.gain.value=0;
    fixedMaster.gain.setTargetAtTime(1,0,.018);acidMaster.gain.setTargetAtTime(1,0,.018);acidMusic.gain.setTargetAtTime(.55,0,.018);
    fixed.connect(fixedMaster).connect(split);split.connect(merge,0,0);split.connect(merge,1,1);
    acidMain.connect(acidDuck).connect(acidMusic).connect(acidMaster).connect(merge,0,2);merge.connect(context.destination);
    for(const gain of [fixedMaster.gain,acidMaster.gain]){gain.setValueAtTime(1,duration-1.8);gain.linearRampToValueAtTime(0,duration-.04);}
    let index=0,next=.04,boundary=.125;
    const schedule=()=>{while(next<Math.min(STC_DURATION,context.currentTime+.17)){
      const frame=audio.scheduleStep(index++,next,{intensity:.66,phase:0});
      if(frame.pump){acidDuck.gain.setValueAtTime(.55,next);acidDuck.gain.exponentialRampToValueAtTime(1,next+.19);}
      next+=STC_STEP_SECONDS;
    }};
    schedule();let suspended=context.suspend(boundary),render=context.startRendering();
    while(boundary<duration-.15){await suspended;schedule();boundary+=.125;if(boundary<duration-.15)suspended=context.suspend(boundary);await context.resume();}
    const rendered=await render;
    const encode=indices=>{
      const count=indices.length,data=new ArrayBuffer(44+frames*count*4),view=new DataView(data),label=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));};
      label(0,'RIFF');view.setUint32(4,data.byteLength-8,true);label(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,3,true);view.setUint16(22,count,true);view.setUint32(24,rate,true);view.setUint32(28,rate*count*4,true);view.setUint16(32,count*4,true);view.setUint16(34,32,true);label(36,'data');view.setUint32(40,frames*count*4,true);
      let peak=0,nonFinite=0,fullScale=0;const channels=indices.map(index=>rendered.getChannelData(index));
      for(let frame=0;frame<frames;frame++)for(let c=0;c<count;c++){const value=channels[c][frame];if(!Number.isFinite(value))nonFinite++;peak=Math.max(peak,Math.abs(value));if(Math.abs(value)>=1)fullScale++;view.setFloat32(44+(frame*count+c)*4,value,true);}
      const bytes=new Uint8Array(data);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
      return {wav:btoa(binary),frames,channels:count,rate,peak,nonFinite,fullScale};
    };
    return {accompaniment:encode([0,1]),acid:encode([2]),steps:index,duration:frames/rate,stepSeconds:STC_STEP_SECONDS,
      method:'Preserved r5 synthesis source. The direct acid signal is captured before its original panner. Its source gain and kick-duck envelope are retained. Music and ambience buses feed the fixed accompaniment without the shared safety compressor. Shared acid/percussion delays stay in the accompaniment.',
      limits:'Source extraction uses the historical Web Audio instruments. This is not new browser composition. Separate pre-safety stems do not reproduce the old nonlinear master exactly.'};
  });
  for(const [key,file]of [['accompaniment','source-accompaniment.wav'],['acid','source-acid-direct.wav']]){
    const item=result[key];assert.equal(item.nonFinite,0);assert.ok(item.peak>0);await writeFile(join(out,file),Buffer.from(item.wav,'base64'));delete item.wav;
    item.file=file;item.sha256=createHash('sha256').update(await readFile(join(out,file))).digest('hex');
  }
  const sources={};for(const file of ['audio/stc-study/r5-source/src/stc-audio.js','audio/stc-study/r5-source/src/stc-score.js'])sources[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
  await writeFile(join(out,'source-capture.json'),JSON.stringify({...result,sources,browserVersion:browser.version(),authoring:'Historical source extraction only. FoxDot and SuperCollider author and render the r7 motion and mix.'},null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{if(browser)await browser.close();server.kill();}
