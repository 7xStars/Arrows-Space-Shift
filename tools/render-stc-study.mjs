import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {STC_SCORE,STC_DURATION,STC_SECTIONS,STC_ACID_PATTERN,STC_STEP_SECONDS,stcScoreStep} from '../src/stc-score.js';
if(!process.argv.includes('--legacy'))throw new Error('This is the retained Web Audio prototype renderer. Current music production uses tools/render-foxdot-bass.py. Use --legacy only for a separate historical comparison.');
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const revision=STC_SCORE.id.match(/r\d+/)?.[0]||'unversioned',root=resolve(import.meta.dirname,'..');
const outputArgument=process.argv.slice(2).find(value=>!value.startsWith('--'));
const out=resolve(outputArgument||join(root,`reports/legacy-stc-${revision}-rerender`));
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser;
try{
  const url=await new Promise((accept,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('The study server did not start.')),10000);
    server.once('error',reject);server.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
  browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();await page.goto(url);
  const plans=[
    {id:'binaural-music',spatialMode:'headphones',duration:STC_DURATION+2,offset:0,cues:false},
    {id:'stereo-music',spatialMode:'stereo',duration:STC_DURATION+2,offset:0,cues:false},
    {id:'binaural-crossing-mix',spatialMode:'headphones',duration:26,offset:12*16,cues:true},
  ],results=[];
  for(const plan of plans){
    const result=await page.evaluate(async plan=>{
      const {StructuralAudio}=await import('./src/stc-audio.js'),{STC_STEP_SECONDS,STC_DURATION}=await import('./src/stc-score.js'),
        {moveBolza}=await import('./src/hyperbolic.js');
      const rate=48000,duration=plan.duration,a=new OfflineAudioContext(2,Math.ceil(duration*rate),rate),
        audio=new StructuralAudio({volume:1,spatialMode:plan.spatialMode}).useContext(a);audio.start();
      let step=plan.offset,next=.04,boundary=.125,cueIndex=0,entryIndex=0;
      const cueTimes=[4.2,8.4,13.3,18.4,22.2];
      const objects=[{position:{x:.6,y:0},heading:{x:1,y:0}},{position:{x:-.6,y:0},heading:{x:-1,y:0}}];
      const nextCrossing=index=>{
        const object=objects[index];
        for(let guard=0;guard<2000;guard++){
          const moved=moveBolza(object.position,object.heading,.025,.01);object.position=moved.position;object.heading=moved.heading;
          if(moved.crossings.length){const crossing=moved.crossings[0],segment=moved.segments.find(value=>value.jump);
            return {...crossing,source:segment.from,destination:segment.to,pan:Math.max(-.65,Math.min(.65,segment.to.x))};}
        }
        throw new Error('The fixture did not reach an actual paired edge.');
      };
      const schedule=()=>{
        const horizon=Math.min(plan.cues?duration-1:STC_DURATION,a.currentTime+.17);
        while(next<horizon){audio.scheduleStep(step++,next,{intensity:.66,phase:plan.cues?2:0});next+=STC_STEP_SECONDS;}
        if(plan.cues)while(entryIndex<2&&a.currentTime>=1.2+entryIndex){
          const index=entryIndex++;audio.announce({type:'attack-entered',eventId:`entry-${index}`,objectId:`probe-${index}`,
            family:`fixture-${index}`,position:{...objects[index].position},pan:index?-.6:.6,topology:'bolza'});
        }
        if(plan.cues)while(cueIndex<cueTimes.length&&a.currentTime>=cueTimes[cueIndex]){
          const index=cueIndex++,geometry=nextCrossing(index%2);audio.crossing({type:'crossing',eventId:`crossing-${index}`,objectId:`probe-${index%2}`,...geometry,topology:'bolza'});
        }
      };
      audio.master.gain.setValueAtTime(1,duration-1.8);audio.master.gain.linearRampToValueAtTime(0,duration-.04);
      schedule();let suspended=a.suspend(boundary),render=a.startRendering();
      while(boundary<duration-.15){await suspended;schedule();boundary+=.125;if(boundary<duration-.15)suspended=a.suspend(boundary);await a.resume();}
      const buffer=await render,channels=[buffer.getChannelData(0),buffer.getChannelData(1)];let peak=0,squares=0,nonFinite=0,fullScale=0;
      for(const channel of channels)for(const sample of channel){if(!Number.isFinite(sample))nonFinite++;else{peak=Math.max(peak,Math.abs(sample));squares+=sample*sample;if(Math.abs(sample)>=1)fullScale++;}}
      const data=new ArrayBuffer(44+buffer.length*4),view=new DataView(data),label=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));};
      label(0,'RIFF');view.setUint32(4,data.byteLength-8,true);label(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);label(36,'data');view.setUint32(40,buffer.length*4,true);
      for(let i=0;i<buffer.length;i++)for(let channel=0;channel<2;channel++)view.setInt16(44+i*4+channel*2,Math.round(Math.max(-1,Math.min(1,channels[channel][i]))*32767),true);
      const bytes=new Uint8Array(data);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
      let differenceSquares=0,midSquares=0;
      for(let i=0;i<buffer.length;i++){differenceSquares+=(channels[0][i]-channels[1][i])**2;midSquares+=((channels[0][i]+channels[1][i])*.5)**2;}
      return {wav:btoa(binary),metrics:{id:plan.id,spatialMode:plan.spatialMode,duration:buffer.duration,sampleRate:rate,channels:2,peak,peakDbfs:20*Math.log10(Math.max(1e-12,peak)),rms:Math.sqrt(squares/(buffer.length*2)),differenceRms:Math.sqrt(differenceSquares/buffer.length),monoRms:Math.sqrt(midSquares/buffer.length),nonFinite,fullScale,diagnostic:audio.diagnosticState()}};
    },plan);
    assert.equal(result.metrics.nonFinite,0);assert.equal(result.metrics.fullScale,0);assert.ok(result.metrics.peak>0);
    assert.ok(result.metrics.diagnostic.peakVoices<=32&&result.metrics.diagnostic.peakSources<=96);
    assert.equal(result.metrics.diagnostic.dropped,0);
    const file=`ass-identified-return-${revision}-${plan.id}.wav`;await writeFile(join(out,file),Buffer.from(result.wav,'base64'));
    results.push({file,...result.metrics});
  }
  await writeFile(join(out,'render-results.json'),JSON.stringify({revision:`stc-study-${revision}`,score:STC_SCORE,
    method:'Original synthesis in headless Edge OfflineAudioContext. Headphones use native HRTF routes; the separate speaker comparison uses stereo routes. No external recordings, normalization, playback-device observation, or listening acceptance.',
    mix:'Master1; music0.55, effects0.8, ambience0.25. Native safety compressor. Same synthesis as live study. Final fade only.',
    limits:'The crossing mix uses geometry traces from moveBolza with synthetic presentation times and actual entry/return identity cues. It is not a gameplay recording. The full study is not a seamless loop. Audio-only listening and physical output remain unverified.',results},null,2)+'\n');
  const authoring=join(root,'audio/stc-study');await mkdir(authoring,{recursive:true});
  await writeFile(join(authoring,`score-${revision}.json`),JSON.stringify({score:STC_SCORE,stepSeconds:STC_STEP_SECONDS,duration:STC_DURATION,sections:STC_SECTIONS,acid:STC_ACID_PATTERN,
    steps:Array.from({length:STC_SCORE.bars*16},(_,index)=>({time:index*STC_STEP_SECONDS,...stcScoreStep(index,{intensity:.66,phase:0})}))},null,2)+'\n');
  console.log(JSON.stringify({out,results:results.map(({file,duration,peakDbfs,rms,diagnostic})=>({file,duration,peakDbfs,rms,peakVoices:diagnostic.peakVoices,peakSources:diagnostic.peakSources,dropped:diagnostic.dropped}))},null,2));
}finally{if(browser)await browser.close();server.kill();}
