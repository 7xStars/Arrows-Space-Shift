import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight} from '../src/simulation.js';
import {enterChapter} from '../src/campaign.js';
import {KLEIN_BOUNDS,pathsHit,traceKleinProjective} from '../src/klein.js';
import {MANIFOLD_VISUAL_CONTRACT,projectileVisualTruth,projectileManifoldRule,projectileJoinPreview,manifoldFrameIndicator} from '../src/manifold-visuals.js';
import {FlightRenderer} from '../src/renderer.js';
import {DEFAULT_PREFERENCES,loadPreferences,savePreferences} from '../src/storage.js';

const fresh=(index=8)=>{const s=createFlight('campaign',{seed:77});enterChapter(s,index);s.phase='running';s.campaign.introRemaining=0;s.view={width:1100,height:820,topInset:110,bottomInset:106};return s;};
const still=(x,y)=>[{from:{x,y},to:{x,y},t0:0,t1:1}];

test('real bullets stay live: opposite edge image is physically collidable across a Klein join',()=>{
  const s=fresh(8),shot={x:399,z:0,vx:140,vz:0,geometryRule:'klein'};
  assert.equal(projectileVisualTruth(s,shot).collisionEntity,true);
  assert.equal(projectileVisualTruth(s,shot).status,'live');
  assert.equal(pathsHit(still(399,350),still(-399,530),8,KLEIN_BOUNDS),true);
  assert.match(MANIFOLD_VISUAL_CONTRACT.caveat,/no global opposite-side immunity/);
});

test('Klein preview is a future image, not a second projectile or collision mask',()=>{
  const s=fresh(8),shot={x:380,z:0,vx:100,vz:0};
  const p=projectileJoinPreview(s,shot,{horizon:.5});
  assert.equal(p.status,'imminent');assert.equal(p.rule,'klein');
  assert.equal(p.kind,'future-projection');assert.equal(p.collisionEntity,false);
  assert.equal(p.notAnAdditionalProjectile,true);assert.equal(p.destination.x,-400);
  assert.equal(p.destination.y,KLEIN_BOUNDS.top+KLEIN_BOUNDS.bottom);
  assert.equal(projectileVisualTruth(s,shot).collisionEntity,true);
  assert.equal(projectileJoinPreview(s,{...shot,dead:true}),null);
});

test('future images only appear when an actual join is forecast',()=>{
  const s=fresh(9);
  assert.equal(projectileJoinPreview(s,{x:0,z:0,vx:10,vz:0},{horizon:.5}),null);
  assert.equal(projectileJoinPreview(s,{x:380,z:0,vx:-100,vz:0},{horizon:.5}),null);
  assert.equal(projectileJoinPreview(s,{x:380,z:0,vx:100,vz:0,salvo:true},{horizon:.5}),null);
});

test('hybrid boss phase two assigns projective imagery only to the projective-source shot',()=>{
  const s=fresh(17);s.campaign.hybridPhase=2;
  assert.equal(projectileManifoldRule(s,{geometryRule:'klein',projective:false}),'klein');
  assert.equal(projectileManifoldRule(s,{geometryRule:'projective',projective:true}),'projective');
  assert.match(manifoldFrameIndicator(s).name,/P ANCHOR/);
  s.campaign.hybridPhase=3;s.campaign.phaseBreakUntil=s.time+2.2;
  assert.equal(projectileManifoldRule(s,{geometryRule:'klein'}),'klein','player rule is not changed during warning');
  s.time+=2.21;
  assert.equal(projectileManifoldRule(s,{geometryRule:'klein'}),'hybrid');
  assert.equal(projectileManifoldRule(s,{geometryRule:'projective'}),'projective');
  assert.match(manifoldFrameIndicator(s).name,/PROJECTIVE/);
});

test('projective prediction uses the same antipodal mapping as the combat trace',()=>{
  const s=fresh(18),shot={x:90,z:0,vx:0,vz:100};
  // choose a point near the top of the current chart
  shot.z=950-12;
  const p=projectileJoinPreview(s,shot,{horizon:.5});
  const expected=traceKleinProjective({x:90,y:938},0,50).crossings[0];
  assert.equal(p.rule,'projective');
  assert.deepEqual(p.destination,{x:expected.x,y:expected.y});
  assert.equal(p.collisionEntity,false);
});

test('renderer with previews draws without modifying enemy shots or the collision state',()=>{
  const s=fresh(8);s.enemyShots=[{x:390,z:0,vx:120,vz:0,owner:'enemy'}];
  const fake=new Proxy({measureText:v=>({width:String(v).length*6})},{get(o,key){return key in o?o[key]:()=>{};},set(o,key,v){o[key]=v;return true;}});
  const r=new FlightRenderer(fake,null,{manifoldCues:true});
  const before=structuredClone(s.enemyShots);
  assert.doesNotThrow(()=>r.render(s,{width:1100,height:820,dt:1/60}));
  assert.deepEqual(s.enemyShots,before);
});

test('manifold cues default enabled and persist without changing save format',()=>{
  const items=new Map(),storage={getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v)};
  assert.equal(DEFAULT_PREFERENCES.manifoldCues,true);
  assert.equal(savePreferences({...DEFAULT_PREFERENCES,manifoldCues:false},storage),true);
  assert.equal(loadPreferences(storage).manifoldCues,false);
});

test('in hybrid phase 2 a projective source previews a P join while a Klein source previews a K join',()=>{
  const s=fresh(17);s.campaign.hybridPhase=2;
  const projective=projectileJoinPreview(s,{x:60,z:938,vx:0,vz:120,geometryRule:'projective',projective:true},{horizon:.4});
  const klein=projectileJoinPreview(s,{x:390,z:200,vx:80,vz:0,geometryRule:'klein',projective:false},{horizon:.4});
  assert.equal(projective?.rule,'projective');assert.equal(projective?.classCode,'P');
  assert.equal(klein?.rule,'klein');assert.equal(klein?.classCode,'K');
});

test('hybrid after arming visually encodes both the chart and the specific crossed join',()=>{
  const s=fresh(17);s.campaign.hybridPhase=3;s.campaign.phaseBreakUntil=-1;
  const p=projectileJoinPreview(s,{x:390,z:200,vx:80,vz:0,geometryRule:'hybrid',projective:true},{horizon:.4});
  assert.equal(p?.topology,'hybrid');assert.equal(p?.rule,'klein');
  assert.equal(p?.classCode,'K+P / K');
  assert.equal(p?.collisionEntity,false);
});

test('dense visual preview path remains bounded and does not cull gameplay shots',()=>{
  const s=fresh(18);
  const shots=Array.from({length:300},(_,i)=>({x:(i%2?1:-1)*(200+i%175),z:i*2,vx:120,vz:-145,geometryRule:'projective',owner:'enemy'}));
  s.enemyShots=shots;
  const ctx=new Proxy({measureText:v=>({width:String(v).length*6})},{get(o,key){return key in o?o[key]:()=>{};},set(o,key,v){o[key]=v;return true;}});
  const renderer=new FlightRenderer(ctx,null,{manifoldCues:true,reducedMotion:true});
  assert.doesNotThrow(()=>renderer.render(s,{width:1100,height:820,dt:0,juice:false,reducedMotion:true}));
  assert.equal(s.enemyShots.length,shots.length);
  assert.ok(s.enemyShots.every((item,i)=>item===shots[i]));
});

test('optionally hiding extra previews does not suppress the real solid projectile',()=>{
  const s=fresh(8);s.enemyShots=[{x:395,z:0,vx:140,vz:0,owner:'enemy'}];
  const ctx=new Proxy({measureText:v=>({width:String(v).length*6})},{get(o,key){return key in o?o[key]:()=>{};},set(o,key,v){o[key]=v;return true;}});
  const r=new FlightRenderer(ctx,null,{manifoldCues:false});
  assert.doesNotThrow(()=>r.render(s,{width:1100,height:820,dt:0}));
  assert.equal(projectileVisualTruth(s,s.enemyShots[0]).status,'live');
});
