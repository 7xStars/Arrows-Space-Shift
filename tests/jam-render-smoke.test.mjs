import test from 'node:test';import assert from 'node:assert/strict';
import {createFlight} from '../src/simulation.js';import {enterChapter} from '../src/campaign.js';
import {FlightRenderer} from '../src/renderer.js';
const gradient={addColorStop(){}};
function fakeCanvas(){return new Proxy({measureText:s=>({width:String(s).length*7}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},
 {get(o,p){return p in o?o[p]:()=>{};},set(o,p,v){o[p]=v;return true;}});}
for(const chapterIndex of [0,8,9,17,18,26]){
 test(`visual render path does not crash for campaign chapter ${chapterIndex}`,()=>{
  const s=createFlight('campaign',{seed:345});enterChapter(s,chapterIndex);s.phase='running';s.view={width:1100,height:820,topInset:110,bottomInset:106};
  if(chapterIndex===17)s.campaign.hybridPhase=3;
  const renderer=new FlightRenderer(fakeCanvas(),null,{juice:true});
  assert.doesNotThrow(()=>renderer.render(s,{width:1100,height:820,dt:1/60,flash:0}));
  s.x=395;s.lateralVelocity=240;s.time+=.1;
  assert.doesNotThrow(()=>renderer.render(s,{width:1100,height:820,dt:1/60,flash:0}));
 });
}
