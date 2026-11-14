import test from 'node:test';
import assert from 'node:assert/strict';
import {AV_GRAMMAR,AVEventReader,adaptAVEvent} from '../src/av-events.js';
import {FlightAudio,SCORE_THEMES,scoreThemeFor} from '../src/audio.js';
import {createActFour,startActFour,fireActFour,actFourAction} from '../src/hyperbolic-campaign.js';

const state=(events=[],extra={})=>({time:10,phase:'running',events,...extra});
const hyperbolic=(events=[])=>state(events,{stageIndex:0,player:{position:{x:0,y:0}}});

test('the implemented grammar is immutable and has a cue contract for each event family',()=>{
  const ids=new Set();
  for(const [type,rule] of Object.entries(AV_GRAMMAR)){
    assert.equal(rule.type,type);
    assert.ok(!ids.has(rule.id));ids.add(rule.id);
    for(const key of ['meaning','animation','timing','fallback','acceptance'])assert.ok(rule[key]);
    assert.ok(Object.isFrozen(rule));assert.ok(Object.isFrozen(rule.invariants));
  }
  assert.ok(Object.isFrozen(AV_GRAMMAR));
  assert.equal(AV_GRAMMAR['preview.future_image'].sound,null);
});

test('event records copy and freeze position and transform data without changing the source',()=>{
  const event={type:'klein-crossing',time:10,rule:'projective',shotId:37,
    sourceId:'turret-2',position:{x:2,z:3},from:{x:4,z:5},to:{x:6,z:7}};
  const before=structuredClone(event),adapted=adaptAVEvent(event,state(),'test:1');
  assert.deepEqual(event,before);
  assert.equal(adapted.type,'topology.projective.cross');
  assert.equal(adapted.objectId,37);assert.equal(adapted.sourceId,'turret-2');
  assert.notEqual(adapted.worldPos,event.position);assert.notEqual(adapted.transform.from,event.from);
  event.position.x=99;event.to.z=99;
  assert.equal(adapted.worldPos.x,2);assert.equal(adapted.transform.to.z,7);
  assert.ok(Object.isFrozen(adapted));assert.ok(Object.isFrozen(adapted.transform.to));
  assert.throws(()=>{adapted.transform.to.z=8;},TypeError);
  assert.doesNotThrow(()=>adaptAVEvent(Object.freeze({type:'capture',t:10,shotId:1}),hyperbolic()));
});

test('real joins use their actual topology rule and forecasts stay silent',()=>{
  for(const rule of ['klein','projective','periodic']){
    const event=adaptAVEvent({type:'klein-crossing',time:10,rule},state());
    assert.equal(event.type,`topology.${rule}.cross`);assert.equal(event.cue,`${rule}-crossing`);
    assert.equal(event.forecast,false);
  }
  const forecast=adaptAVEvent({type:'klein-crossing',time:10,rule:'klein',forecast:true},state());
  assert.equal(forecast.type,'preview.future_image');assert.equal(forecast.cue,null);assert.equal(forecast.isPhysical,false);
  const unknown=adaptAVEvent({type:'klein-crossing',time:10,rule:'unknown'},state());
  assert.equal(unknown.cue,null);
  const bolza=adaptAVEvent({type:'shot-crossing',t:10,shotId:14,from:2,to:6},hyperbolic());
  assert.equal(bolza.type,'topology.bolza.join');assert.equal(bolza.objectId,14);
  assert.equal(bolza.transform.from,2);assert.equal(bolza.transform.to,6);
});

test('the reader keeps event order and reads new events after a bounded log shifts',()=>{
  const reader=new AVEventReader(),s=hyperbolic();
  const observed=[];
  for(let i=0;i<260;i++){
    s.time=i/60;
    s.events.push(Object.freeze({type:'shot-crossing',t:s.time,shotId:i,from:0,to:4}));
    if(s.events.length>120)s.events.shift();
    const fresh=reader.read(s);assert.equal(fresh.length,1);
    observed.push(fresh[0]);assert.equal(reader.read(s).length,0);
  }
  assert.deepEqual(observed.map(event=>event.objectId),Array.from({length:260},(_,i)=>i));
  assert.equal(new Set(observed.map(event=>event.instanceId)).size,260);
});

test('a large retained append log reads only its tail and new entries after the first scan',()=>{
  let indexedReads=0;
  const history=Array.from({length:10000},(_,id)=>Object.freeze({type:'player-fire',time:10,shotId:id}));
  const events=new Proxy(history,{get(target,key,receiver){if(typeof key==='string'&&/^\d+$/.test(key))indexedReads++;return Reflect.get(target,key,receiver);}});
  const s=state(events),reader=new AVEventReader(),first=reader.read(s);assert.equal(first.length,10000);
  indexedReads=0;
  for(let index=0;index<1000;index++)assert.deepEqual(reader.read(s),[]);
  assert.ok(indexedReads<=2000,'unchanged reads inspect at most two retained tail positions');
  indexedReads=0;events.push(Object.freeze({type:'enemy-fire',time:10,shotId:10000}));
  const fresh=reader.read(s);assert.equal(fresh.length,1);assert.equal(fresh[0].objectId,10000);
  assert.ok(indexedReads<=3,'an append does not scan the retained 10000-event prefix');
  assert.equal(history.length,10001);assert.equal(history[0].shotId,0);
});

test('clearing and reusing an event array retains identity filtering and accepts new records',()=>{
  const old={type:'player-fire',time:10,shotId:1},events=[old],s=state(events),reader=new AVEventReader();
  assert.equal(reader.read(s)[0].objectId,1);events.length=0;assert.deepEqual(reader.read(s),[]);
  events.push(old,{type:'damage',time:10,shotId:2});
  assert.deepEqual(reader.read(s).map(event=>event.objectId),[2]);
  events.length=0;events.push({type:'echo-captured',time:10,shotId:3});
  assert.deepEqual(reader.read(s).map(event=>event.objectId),[3]);
  assert.equal(events.length,1);assert.equal(events[0].shotId,3);
});

test('replacement and changed tail positions use the full identity scan without replay',()=>{
  const old={type:'player-fire',time:10,shotId:1},s=state([old]),reader=new AVEventReader();
  const first=reader.read(s)[0];
  s.events=[{type:'enemy-fire',time:10,shotId:2},old,{type:'damage',time:10,shotId:3}];
  const replaced=reader.read(s);assert.deepEqual(replaced.map(event=>event.objectId),[2,3]);
  s.events.shift();s.events.push({type:'echo-captured',time:10,shotId:4});
  assert.deepEqual(reader.read(s).map(event=>event.objectId),[4]);
  s.time=0;s.events.push({type:'player-fire',time:0,shotId:5});
  const rewind=reader.read(s);assert.deepEqual(rewind.map(event=>event.objectId),[5]);
  assert.equal(first.instanceId.split(':')[0],rewind[0].instanceId.split(':')[0]);
  const next=state(s.events,{time:0});assert.deepEqual(reader.read(next).map(event=>event.objectId),[5]);
});

test('paused, stale, and future records cannot sound later on resume or retry',()=>{
  const reader=new AVEventReader(),s=state([{type:'player-fire',time:8},{type:'enemy-fire',time:20},{type:'damage',time:10}],{paused:true});
  assert.deepEqual(reader.read(s),[]);
  s.paused=false;assert.deepEqual(reader.read(s),[]);
  s.events.push({type:'echo-captured',time:10});
  assert.equal(reader.read(s)[0].type,'module.capture');
  s.time=0;assert.deepEqual(reader.read(s),[]);
  s.time=10;assert.deepEqual(reader.read(s),[]);
  const resumed=state([{type:'damage',time:10}]);
  assert.equal(reader.read(resumed)[0].type,'player.damage');
});

test('FlightAudio routes both logs and stops music during an Act IV pause',()=>{
  const audio=new FlightAudio(),cues=[],playing=[];
  audio.cue=cue=>cues.push(cue);audio.setPlaying=(active,s)=>playing.push({active,state:s});
  const s=hyperbolic([
    {type:'fire',t:10},{type:'enemy-volley',t:10},{type:'capture',t:10,shotId:3},
    {type:'release',t:10},{type:'shot-crossing',t:10,shotId:4,from:1,to:5},
    {type:'hit',t:10},{type:'recovery',t:10},
  ]);
  const before=structuredClone(s);audio.process(s);assert.deepEqual(s,before);
  assert.deepEqual(cues,['player-fire','enemy-fire','echo-captured','echo-released','bolza-crossing','damage','wave-break']);
  audio.process(s);assert.equal(cues.length,7);
  s.paused=true;audio.process(s);assert.equal(playing.at(-1).active,false);
  const legacy=state([{type:'echo-captured',time:10},{type:'echo-released',time:10},
    {type:'klein-crossing',time:10,rule:'projective'},{type:'drive-part-collected',time:10,part:'klein-relay'},
    {type:'pattern-warning',time:10,patternKey:'gap'}]);
  audio.process(legacy);
  assert.deepEqual(cues.slice(7),['echo-captured','echo-released','projective-crossing','relay-recovered','pattern-gap']);
});

test('successful Act IV actions produce cues without adding simulation objects',()=>{
  const s=createActFour(3),reader=new AVEventReader();startActFour(s);reader.read(s);
  assert.equal(fireActFour(s),true);
  const fired=structuredClone(s);
  assert.equal(reader.read(s)[0].type,'player.weapon.fire');assert.deepEqual(s,fired);
  assert.equal(actFourAction(s,'capture'),false);assert.deepEqual(reader.read(s),[]);
  s.captureReady=0;s.shots.push({id:500,team:'enemy',position:{...s.player.position}});
  assert.equal(actFourAction(s,'capture'),true);
  assert.equal(reader.read(s)[0].objectId,500);
  assert.equal(actFourAction(s,'release'),true);
  const released=structuredClone(s),count=s.shots.length;
  assert.equal(reader.read(s)[0].type,'module.release');
  assert.deepEqual(s,released);assert.equal(s.shots.length,count);
});

test('topology and capture sound families remain distinct within the existing voice budget',()=>{
  const audio=new FlightAudio(),notes=[];
  audio.context={state:'running',currentTime:1};audio.voice=note=>notes.push(note);
  const phrases=[];
  for(const cue of ['klein-crossing','projective-crossing','periodic-crossing','bolza-crossing','echo-captured','echo-released']){
    notes.length=0;audio.cue(cue);assert.ok(notes.length>0&&notes.length<=2);
    phrases.push(JSON.stringify(notes));
  }
  assert.equal(new Set(phrases).size,6);
  audio.options.sound=false;notes.length=0;audio.cue('damage');assert.equal(notes.length,0);
});

test('each act has its own arrangement and authored recovery stays sparse',()=>{
  assert.equal(scoreThemeFor(createActFour()),'bolza');
  const recovery=createActFour();recovery.breakUntil=2;
  assert.equal(scoreThemeFor(recovery),'recovery');
  assert.deepEqual(Object.keys(SCORE_THEMES),['traditional','klein','projective','bolza','recovery','ending']);
});

test('the retained offline score cancels music notes and resumes one scheduler',()=>{
  const oscillators=[],parameters=[];
  const parameter=()=>{
    const events=[];parameters.push(events);
    return {setValueAtTime:(...args)=>events.push(['value',...args]),
      exponentialRampToValueAtTime:(...args)=>events.push(['ramp',...args]),
      cancelScheduledValues:(...args)=>events.push(['cancel',...args]),
      setTargetAtTime:(...args)=>events.push(['target',...args])};
  };
  const context={state:'running',currentTime:1,
    createOscillator(){const osc={frequency:parameter(),connect:node=>node,disconnect(){},
      start(time){this.startedAt=time;},stop(time){this.stops??=[];this.stops.push(time);}};
      oscillators.push(osc);return osc;},
    createGain(){return {gain:parameter(),connect:node=>node,disconnect(){}};}};
  const audio=new FlightAudio({recordedMusic:false});audio.context=context;audio.master={};
  audio.voice({from:400,to:200,duration:.1});
  const effect=oscillators[0];
  audio.setPlaying(true,createActFour());
  const score=oscillators.slice(1);assert.ok(score.length>=2);
  const count=oscillators.length;audio.setPlaying(true,createActFour());assert.equal(oscillators.length,count);
  context.currentTime=1.01;audio.setPlaying(false);
  for(const osc of score)assert.ok(osc.stops.at(-1)<=1.03,'all scheduled music stops within the pause fade');
  assert.equal(effect.stops.length,1,'pause keeps short action effects separate from music');
  assert.ok(parameters.some(events=>events.some(event=>event[0]==='cancel')));
  const stops=score.map(osc=>osc.stops.length);audio.setPlaying(false);
  assert.deepEqual(score.map(osc=>osc.stops.length),stops,'repeated pause does not stop a voice twice');
  for(const osc of score){osc.onended();osc.onended();}
  assert.equal(audio.voices,1);assert.equal(audio.activeVoices.size,1);
  audio.setPlaying(true,createActFour());assert.ok(oscillators.length>count);
  audio.options.music=false;audio.setPlaying(true,createActFour());assert.equal(audio.ambient,null);
});
