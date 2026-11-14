import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(import.meta.dirname,'..'),output=resolve(process.argv[2]||'reports/stc-study-r6');
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser;
try{
  const url=await new Promise((accept,reject)=>{let text='';const timeout=setTimeout(()=>reject(new Error('The server did not start.')),10000);
    server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timeout);accept(match[0]);}});});
  browser=await chromium.launch({headless:true,channel:'msedge'});
  const page=await browser.newPage();await page.goto(url);
  const report=await page.evaluate(async()=>{
    const {RecordedScoreAudio}=await import('./src/stc-track-player.js');
    const context=new OfflineAudioContext(2,1,48000),player=new RecordedScoreAudio().useContext(context);
    if(!await player.load())throw new Error(player.loadError);
    const metrics=buffer=>{
      let peak=0,squares=0,nonFinite=0,fullScale=0;
      for(let c=0;c<2;c++)for(const sample of buffer.getChannelData(c)){
        if(!Number.isFinite(sample))nonFinite++;
        else{peak=Math.max(peak,Math.abs(sample));squares+=sample*sample;if(Math.abs(sample)>=1)fullScale++;}
      }
      return {frames:buffer.length,sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels,duration:buffer.duration,
        peak,rms:Math.sqrt(squares/(buffer.length*2)),nonFinite,fullScale};
    };
    const mixes=[0,.3,1].map(room=>{
      let peak=0,nonFinite=0,fullScale=0;
      for(let c=0;c<2;c++){
        const dry=player.buffers[0].getChannelData(c),wet=player.buffers[1].getChannelData(c);
        for(let i=0;i<dry.length;i++){
          const value=dry[i]+room*wet[i];if(!Number.isFinite(value))nonFinite++;
          else{peak=Math.max(peak,Math.abs(value));if(Math.abs(value)>=1)fullScale++;}
        }
      }
      return {room,peak,nonFinite,fullScale};
    });
    return {stems:player.buffers.map(metrics),mixes,loads:player.bufferLoads,decodes:player.decodeCount};
  });
  assert.equal(report.stems[0].frames,report.stems[1].frames);
  assert.equal(report.loads,2);assert.equal(report.decodes,2);
  for(const stem of report.stems){assert.equal(stem.nonFinite,0);assert.equal(stem.fullScale,0);assert.equal(stem.channels,2);assert.equal(stem.sampleRate,48000);assert.ok(stem.peak>0);}
  for(const mix of report.mixes){assert.equal(mix.nonFinite,0);assert.equal(mix.fullScale,0);}
  report.method='Native Edge decode of the shipped Vorbis files. Mix arithmetic is measured before playback gain or limiter.';
  report.limits='Technical decoding and peak checks only. No listening or physical-device acceptance.';
  await writeFile(join(output,'decoded-stems.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill();}
