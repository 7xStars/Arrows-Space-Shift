import test from 'node:test';
import assert from 'node:assert/strict';
import {StructuralAudio,STC_AUDIO_LIMITS} from '../src/stc-audio.js';
import {STC_SCORE,STC_DURATION,STC_STEP_SECONDS,stcScoreStep,stcMidiHz} from '../src/stc-score.js';

function fixture(){
  const parameter=(value=0)=>({value,events:[],setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t]);},
    exponentialRampToValueAtTime(v,t){this.events.push(['ramp',v,t]);},cancelScheduledValues(t){this.events.push(['cancel',t]);},
    setTargetAtTime(v,t,c){this.value=v;this.events.push(['target',v,t,c]);}});
  const node=()=>({connections:[],connect(next){this.connections.push(next);return next;},disconnect(){this.disconnected=true;}});
  const context={currentTime:0,sampleRate:48000,state:'running',destination:node(),createdOscillators:[],
    async resume(){this.state='running';this.resumes=(this.resumes||0)+1;},
    createGain(){return Object.assign(node(),{gain:parameter()});},
    createBiquadFilter(){return Object.assign(node(),{frequency:parameter(),Q:parameter()});},
    createStereoPanner(){return Object.assign(node(),{pan:parameter()});},
    createWaveShaper(){return node();},
    createDelay(){return Object.assign(node(),{delayTime:parameter()});},
    createDynamicsCompressor(){return Object.assign(node(),{threshold:parameter(),knee:parameter(),ratio:parameter(),attack:parameter(),release:parameter()});},
    createBuffer(channels,length){const data=new Float32Array(length);return {getChannelData:()=>data};},
    createOscillator(){const result=Object.assign(node(),{frequency:parameter(),start(time){this.startAt=time;},stop(time){this.stopAt=time;}});this.createdOscillators.push(result);return result;},
    createBufferSource(){return Object.assign(node(),{start(time){this.startAt=time;},stop(time){this.stopAt=time;}});},
  };return context;
}

test('the study retains its sequence while articulation changes and breaks the pulse only in its authored interval',()=>{
  assert.ok(STC_DURATION>=60&&STC_DURATION<=90);
  const first=stcScoreStep(4*16+7),transformed=stcScoreStep(16*16+7);
  assert.equal(first.acid.midi,transformed.acid.midi);assert.equal(first.acid.accent,transformed.acid.accent);
  assert.notEqual(first.acid.cutoff,transformed.acid.cutoff);
  const calm=stcScoreStep(10*16+7,{phase:0}),pressure=stcScoreStep(10*16+7,{phase:2});
  assert.equal(calm.acid.midi,pressure.acid.midi);assert.equal(calm.acid.gate,pressure.acid.gate);
  assert.ok(pressure.acid.cutoff>calm.acid.cutoff,'the actual complication changes timbre without changing the sequence');
  for(const bar of [0,5,16,25,34]){
    const beat=Array.from({length:16},(_,i)=>stcScoreStep(bar*16+i));
    assert.equal(beat.flatMap(x=>x.events).filter(x=>x.instrument==='kick').length,4);
  }
  const breakEvents=Array.from({length:4*16},(_,i)=>stcScoreStep(28*16+i));
  assert.equal(breakEvents.flatMap(x=>x.events).filter(x=>x.instrument==='kick').length,0);
  assert.ok(breakEvents.some(x=>x.acid));
  const phaseA=Array.from({length:16},(_,i)=>stcScoreStep(20*16+i).events.some(x=>x.instrument==='metal'));
  const phaseB=Array.from({length:16},(_,i)=>stcScoreStep(21*16+i).events.some(x=>x.instrument==='metal'));
  assert.notDeepEqual(phaseA,phaseB,'the 15-step percussion cycle moves against the four-beat pulse');
});

test('acid uses two persistent oscillators, tied pitch slides, and an actual resonant filter envelope',()=>{
  const context=fixture(),audio=new StructuralAudio().useContext(context);audio.start();
  const acid=audio.acid,oscillators=[...acid.osc],initial=context.createdOscillators.length;
  audio.scheduleAcid({...stcScoreStep(3).acid,cutoff:300,envelope:1000},1);
  audio.scheduleAcid(stcScoreStep(4).acid,1+STC_STEP_SECONDS);
  assert.deepEqual(audio.acid.osc,oscillators);assert.equal(context.createdOscillators.length,initial);
  assert.ok(oscillators.every(x=>x.frequency.events.some(e=>e[0]==='ramp'&&e[1]===stcMidiHz(41))));
  const filterEvents=acid.first.frequency.events;
  assert.ok(filterEvents.some(e=>e[0]==='ramp'&&e[1]>1000));
  assert.ok(filterEvents.some(e=>e[0]==='ramp'&&e[1]===300));
  assert.ok(acid.first.Q.events.some(e=>e[1]>=4&&e[1]<6));
});

test('real crossing identity is retained, duplicate delivery is rejected, and research mismatch changes sound only',()=>{
  const audio=new StructuralAudio().useContext(fixture());audio.start();
  const event={type:'crossing',eventId:1,objectId:'shot-7',from:2,to:6,source:{x:.7,y:.1},destination:{x:-.65,y:.2},topology:'bolza',pan:-.65},before=structuredClone(event);
  assert.equal(audio.crossing({...event,type:'prediction'}),false);
  assert.equal(audio.crossing({...event,renderOnly:true}),false);
  assert.equal(audio.crossing({...event,from:8}),false);
  assert.equal(audio.diagnosticState().crossingHistory.length,0);
  assert.equal(audio.crossing(event),true);assert.equal(audio.crossing(event),false);assert.deepEqual(event,before);
  audio.setMode('mismatched');assert.equal(audio.crossing({...event,eventId:2}),true);
  const history=audio.diagnosticState().crossingHistory;
  assert.equal(history[0].motif,history[1].motif);assert.equal(history[0].pan,-.65);assert.equal(history[1].pan,.65);
  history[0].objectId='changed';assert.equal(audio.diagnosticState().crossingHistory[0].objectId,'shot-7');
  const count=audio.voices.size;audio.setMode('visual');audio.crossing({...event,eventId:3});assert.equal(audio.voices.size,count);
  assert.equal(audio.master.gain.value,0);
});

test('voice, source, identity, and trace allocations stay bounded under repeated crossings',()=>{
  const audio=new StructuralAudio().useContext(fixture());audio.start();
  for(let index=0;index<400;index++)audio.crossing({type:'crossing',eventId:index,objectId:index,from:1,to:5,topology:'bolza',pan:.3});
  const state=audio.diagnosticState();
  assert.ok(state.voices<=STC_AUDIO_LIMITS.voices);assert.ok(state.sources<=STC_AUDIO_LIMITS.sources);
  assert.ok(state.seenEvents<=STC_AUDIO_LIMITS.identities);assert.ok(state.identities<=STC_AUDIO_LIMITS.identities);
  assert.equal(state.crossingHistory.length,STC_AUDIO_LIMITS.history);assert.ok(state.dropped>0);
});

test('an actual entry announces the same object motif before its real return and never invents a crossing',()=>{
  const audio=new StructuralAudio().useContext(fixture());audio.start();
  const entry={type:'attack-entered',eventId:'entry-1',objectId:'attack-19',family:'return-fan',position:{x:.5,y:.1},pan:.5,topology:'bolza'},before=structuredClone(entry);
  assert.equal(audio.announce({...entry,type:'prediction'}),false);
  assert.equal(audio.announce({...entry,predicted:true}),false);
  assert.equal(audio.diagnosticState().cueHistory.length,0);
  assert.equal(audio.announce(entry),true);assert.equal(audio.attack(entry),false);assert.deepEqual(entry,before);
  let state=audio.diagnosticState();assert.equal(state.crossings,0);assert.equal(state.crossingHistory.length,0);assert.equal(state.sourceHistory.length,1);
  audio.crossing({type:'crossing',eventId:'crossing-1',objectId:entry.objectId,from:1,to:5,topology:'bolza',pan:-.5});
  state=audio.diagnosticState();assert.equal(state.sourceHistory[0].motif,state.crossingHistory[0].motif);
  assert.equal(state.sourceHistory[0].pan,.5);assert.equal(state.crossingHistory[0].pan,-.5);
  assert.deepEqual(state.cueHistory.map(event=>event.kind),['entry','crossing']);
});

test('pause clears scheduled sound and resume uses the same context and next unplayed step',()=>{
  const context=fixture(),audio=new StructuralAudio().useContext(context);audio.start();audio.update({intensity:.6});
  const first=audio.scheduled.find(x=>x.time>=context.currentTime);audio.pause();
  assert.equal(audio.playing,false);assert.equal(audio.voices.size,0);assert.equal(audio.sources.size,0);assert.equal(audio.step,first.step);
  context.currentTime=10;audio.resume();audio.update({intensity:.6});assert.equal(audio.context,context);
  assert.ok(audio.scheduled.every(x=>x.time>=10));
  audio.setOptions({volume:.4,musicVolume:.3,effectsVolume:.2,ambienceVolume:.1});
  assert.equal(audio.master.gain.value,.4);assert.deepEqual(audio.diagnosticState().buses,{music:.3,effects:.2,ambience:.1});
  const before=audio.stats.steps;context.currentTime=100;audio.update({intensity:.6});assert.ok(audio.stats.steps-before<=3);
  audio.stop();assert.equal(audio.step,0);assert.equal(audio.sources.size,0);
});

test('the study never starts an audio context without a gesture and recovers one context',async()=>{
  const original=globalThis.AudioContext;let created=0;
  globalThis.AudioContext=class{constructor(){created++;return {...fixture(),state:'suspended'};}};
  try{
    const audio=new StructuralAudio();audio.update({intensity:.5});assert.equal(created,0);
    assert.equal(await audio.unlock(),true);audio.start();const context=audio.context;
    context.state='suspended';assert.equal(await audio.unlock(),true);assert.equal(audio.context,context);assert.equal(created,1);
    audio.stop();
  }finally{globalThis.AudioContext=original;}
});
