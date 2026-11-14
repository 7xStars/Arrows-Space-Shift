import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {AVEventReader as CurrentReader} from '../../src/av-events.js';
const baselinePath='G:/Music Projects/Arrow Space Shift/scratch/campaign-baseline-20261113/src/av-events.js';
const {AVEventReader:BaselineReader}=await import(pathToFileURL(baselinePath).href);
const events=Array.from({length:10000},(_,shotId)=>Object.freeze({type:'player-fire',time:10,shotId}));
const state={time:10,phase:'running',events};
const measure=(Reader,reads)=>{
  const reader=new Reader();assert.equal(reader.read(state).length,10000);
  let emitted=0;const cpuStart=process.cpuUsage(),time=performance.now();
  for(let index=0;index<reads;index++)emitted+=reader.read(state).length;
  const elapsedMs=performance.now()-time,cpu=process.cpuUsage(cpuStart);assert.equal(emitted,0);
  return {elapsedMs,cpuMs:(cpu.user+cpu.system)/1000};
};
for(let index=0;index<3;index++){measure(BaselineReader,100);measure(CurrentReader,100);}
const baseline=[],current=[];
for(let round=0;round<7;round++){
  if(round%2){current.push(measure(CurrentReader,1000));baseline.push(measure(BaselineReader,1000));}
  else{baseline.push(measure(BaselineReader,1000));current.push(measure(CurrentReader,1000));}
}
const median=values=>values.slice().sort((a,b)=>a-b)[Math.floor(values.length/2)];
const baselineMedian=median(baseline.map(row=>row.elapsedMs)),currentMedian=median(current.map(row=>row.elapsedMs));
const result={node:process.version,platform:process.platform,architecture:process.arch,eventCount:10000,readsPerRound:1000,rounds:7,
  scenario:'Repeated AVEventReader reads of a retained event array with no append. The initial scan is outside the measured interval.',
  baselineSource:baselinePath,currentSource:'src/av-events.js',baseline,current,
  baselineMedianMs:baselineMedian,currentMedianMs:currentMedian,ratio:baselineMedian/currentMedian,
  limits:'A synchronous JavaScript reader unit benchmark on this host. It is not a game frame-rate result. Rendering, physics, readFlight state copies, native audio, and human perception are outside this measurement.'};
await writeFile(new URL('benchmark.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({eventCount:result.eventCount,readsPerRound:result.readsPerRound,rounds:result.rounds,baselineMedianMs:baselineMedian,currentMedianMs:currentMedian,ratio:result.ratio,limits:result.limits},null,2));
