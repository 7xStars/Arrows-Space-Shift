import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(import.meta.dirname,'..'),output=resolve(process.argv[2]||join(root,'reports/audio-0.25.0-dev.1'));
const plans=[
  {theme:'traditional',duration:32,mode:'music-review-r2'},
  {theme:'bolza',duration:32,mode:'music-review-r2'},
  {theme:'traditional',duration:32,mode:'mix-review-r2'},
  {theme:'bolza',duration:32,mode:'mix-review-r2'},
  ...['traditional','klein','projective','bolza','recovery','ending'].map(theme=>({theme,duration:8,mode:'mix-stress-r2'})),
];
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const url=await new Promise((accept,reject)=>{
  let result='';const timer=setTimeout(()=>reject(new Error('The audio fixture server did not start.')),10000);
  server.once('error',reject);server.stdout.on('data',chunk=>{result+=chunk;const match=result.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});
});
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
  const page=await browser.newPage();await page.goto(url);
  const results=[];
  for(const plan of plans){
    const rendered=await page.evaluate(async ({theme:name,duration,mode})=>{
      const {FlightAudio}=await import('./src/audio.js'),{SCORE_THEMES}=await import('./src/music.js');
      const rate=48000,context=new OfflineAudioContext(2,duration*rate,rate),audio=new FlightAudio({volume:1}).useContext(context),stress=mode==='mix-stress-r2';
      audio.master.gain.setValueAtTime(1,duration-.55);audio.master.gain.exponentialRampToValueAtTime(.0001,duration-.02);
      const exampleCues=name==='traditional'?[
        [1,'player-fire'],[1.18,'player-fire'],[1.36,'player-fire'],[6,'pattern-fan'],[6.8,'enemy-fire'],[8.3,'enemy-hit'],
        [13,'player-fire'],[13.18,'player-fire'],[18,'pattern-aimed'],[18.8,'enemy-fire'],[21.4,'damage'],[26,'player-fire'],[26.18,'player-fire'],
      ]:[
        [1,'player-fire'],[1.18,'player-fire'],[6,'pattern-aimed'],[6.8,'enemy-fire'],[7.6,'bolza-crossing'],
        [11.5,'echo-captured'],[12.5,'echo-released'],[18,'fold'],[22,'bolza-crossing'],[24,'pattern-fan'],[24.8,'enemy-fire'],[27,'damage'],
      ];
      let nextNote=.025,step=0,nextCue=.3,cueIndex=0;
      function schedule(){
        const horizon=Math.min(duration-.5,context.currentTime+.19);
        while(nextNote<horizon){audio.scheduleMusicStep(name,step++,nextNote,{intensity:stress?.85:.45,boss:stress,fold:stress,phase:2});nextNote+=15/SCORE_THEMES[name].bpm;}
        if(stress&&context.currentTime>=nextCue&&context.currentTime<duration-1){
          for(const cue of ['player-fire','enemy-fire','echo-captured','bolza-crossing','pattern-gap'])audio.cue(cue);
          if(nextCue>3)audio.cue('damage');nextCue+=.6;
        }
        if(mode==='mix-review-r2')while(cueIndex<exampleCues.length&&context.currentTime>=exampleCues[cueIndex][0])audio.cue(exampleCues[cueIndex++][1]);
      }
      schedule();let boundary=.125,suspended=context.suspend(boundary),render=context.startRendering();
      while(boundary<duration-.15){
        await suspended;schedule();boundary+=.125;
        if(boundary<duration-.15)suspended=context.suspend(boundary);
        await context.resume();
      }
      const buffer=await render,channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
      let peak=0,squares=0,nonFinite=0,clipped=0;
      for(const channel of channels)for(const sample of channel){if(!Number.isFinite(sample))nonFinite++;else{peak=Math.max(peak,Math.abs(sample));squares+=sample*sample;if(Math.abs(sample)>=1)clipped++;}}
      const pcm=new ArrayBuffer(44+buffer.length*4),view=new DataView(pcm),label=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
      label(0,'RIFF');view.setUint32(4,pcm.byteLength-8,true);label(8,'WAVEfmt ');view.setUint32(16,16,true);
      view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);
      view.setUint16(32,4,true);view.setUint16(34,16,true);label(36,'data');view.setUint32(40,buffer.length*4,true);
      for(let i=0;i<buffer.length;i++)for(let channel=0;channel<2;channel++)view.setInt16(44+i*4+channel*2,Math.round(Math.max(-1,Math.min(1,channels[channel][i]))*32767),true);
      const bytes=new Uint8Array(pcm);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
      return {wav:btoa(binary),metrics:{theme:name,mode,duration,peak,peakDbfs:20*Math.log10(Math.max(1e-12,peak)),rms:Math.sqrt(squares/(buffer.length*buffer.numberOfChannels)),nonFinite,clipped,diagnostic:audio.diagnosticState()}};
    },plan);
    assert.equal(rendered.metrics.nonFinite,0);assert.equal(rendered.metrics.clipped,0);assert.ok(rendered.metrics.peak>0);
    assert.ok(rendered.metrics.diagnostic.peakVoices<=24);
    if(plan.mode==='music-review-r2')assert.equal(rendered.metrics.diagnostic.dropped,0);
    await writeFile(join(output,`ass-${plan.theme}-${plan.mode}.wav`),Buffer.from(rendered.wav,'base64'));results.push(rendered.metrics);
  }
  const report={version:'0.25.0-dev.1',revision:'music-r2',method:'OfflineAudioContext in headless Microsoft Edge. 32-second music-only and separate illustrative action mixes for Acts I/IV. Separate eight-second SFX stress fixtures for all arrangements. Master volume 1; default bus gains. Final fade only; no loudness normalization.',
    limits:'Synthetic review and stress fixtures, not recorded gameplay. PCM peak and finite-sample checks do not establish listening quality, comprehension, device playback, or all possible dense mixes. The original mix-fixture WAVs and results.json remain unchanged.',results};
  await writeFile(join(output,'results-music-review-r2.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({output,results:results.map(({theme,mode,peakDbfs,clipped,nonFinite})=>({theme,mode,peakDbfs,clipped,nonFinite}))},null,2));
}finally{await browser.close();server.kill();}
