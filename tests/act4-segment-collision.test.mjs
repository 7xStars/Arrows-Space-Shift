import test from 'node:test';
import assert from 'node:assert/strict';
import {createActFour,startActFour,stepActFour,sweptBolzaHit} from '../src/hyperbolic-campaign.js';
import {geodesicBetween} from '../src/hyperbolic.js';

const point=(x,y)=>({x,y});
const segment=(from,to,t0,t1,jump=false)=>({from,to,t0,t1,jump});
const still=position=>[segment(position,position,0,1)];

test('real collision segments remain eligible before and after an identified-edge jump',()=>{
  const path=[segment(point(-.003,0),point(.003,0),0,.3),
    segment(point(.003,0),point(-.6,.3),.3,.6,true),
    segment(point(-.6,.3),point(-.598,.3),.6,1)];
  assert.equal(sweptBolzaHit(path,still(point(0,0)),.005),true);
  assert.equal(sweptBolzaHit(path,still(geodesicBetween(path[2].from,path[2].to,.5)),.005),true);
  assert.equal(sweptBolzaHit(path,still(point(-.3,.15)),.005),false,'the jump never becomes a collision line');
});

test('local segment checks compare only positions at the same tick time',()=>{
  const first=[segment(point(-.2,0),point(.2,0),0,.25),
    segment(point(.2,0),point(.7,0),.25,.75,true),segment(point(.7,0),point(.7,0),.75,1)];
  const second=[segment(point(.45,.3),point(.45,.3),0,.75),
    segment(point(.45,.3),point(0,0),.75,.8,true),segment(point(0,0),point(0,0),.8,1)];
  assert.equal(sweptBolzaHit(first,second,.03),false,'visiting the same point at different times is not a hit');
});

test('native Bolza movement retains bounded time intervals for its local segments',()=>{
  const s=createActFour();startActFour(s);
  stepActFour(s,{drive:1,fire:true},1/90);
  for(const actor of [s.player,...s.shots]){
    assert.ok(actor.motion.length>0);
    let previous=0;
    for(const item of actor.motion){
      assert.ok(item.t0>=previous-1e-12);assert.ok(item.t1>=item.t0);assert.ok(item.t1<=1);
      previous=item.t1;
    }
    assert.equal(previous,1);
  }
});
