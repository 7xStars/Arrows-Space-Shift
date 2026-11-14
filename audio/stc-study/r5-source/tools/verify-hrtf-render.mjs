import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const output=resolve(process.argv[2]||'reports/stc-study-r5');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
  const page=await browser.newPage();
  const results=await page.evaluate(async()=>{
    const result=[];
    for(const model of ['equalpower','HRTF']){
      const context=new OfflineAudioContext(2,16384,48000),buffer=context.createBuffer(1,128,48000);
      buffer.getChannelData(0)[0]=.5;
      const source=context.createBufferSource(),panner=context.createPanner();
      source.buffer=buffer;panner.panningModel=model;panner.rolloffFactor=0;
      panner.positionX.value=.9;panner.positionY.value=.1;panner.positionZ.value=-1;
      source.connect(panner);panner.connect(context.destination);source.start(.02);
      const rendered=await context.startRendering(),channels=[];
      for(let c=0;c<2;c++){
        const values=rendered.getChannelData(c);let peak=0,peakIndex=0,nonzero=0,energy=0,nonFinite=0;
        for(let i=0;i<values.length;i++){
          if(!Number.isFinite(values[i]))nonFinite++;
          else{const value=Math.abs(values[i]);energy+=values[i]*values[i];if(value>1e-8)nonzero++;if(value>peak){peak=value;peakIndex=i;}}
        }
        channels.push({peak,peakIndex,nonzero,energy,nonFinite});
      }
      result.push({model,channels});
    }
    return result;
  });
  const [stereo,binaural]=results;
  for(const value of results)for(const channel of value.channels){assert.equal(channel.nonFinite,0);assert.ok(channel.energy>0);}
  assert.ok(stereo.channels.every(channel=>channel.nonzero<=2),'equal-power panning retains the impulse shape');
  assert.ok(binaural.channels.every(channel=>channel.nonzero>8),'HRTF processing applies a measured filter response');
  assert.notEqual(binaural.channels[0].peakIndex,binaural.channels[1].peakIndex,'the off-center HRTF response has an interaural time difference');
  const report={browser:browser.version(),method:'Native off-center impulse render in headless Edge OfflineAudioContext. Same input and position in both modes.',
    results,passed:true,limits:'Verifies native filter and channel timing behavior. It does not establish human localization, physical output, or musical acceptance.'};
  await writeFile(join(output,'hrtf-native-render.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
