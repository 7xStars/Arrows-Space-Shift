import test from 'node:test';
import assert from 'node:assert/strict';
import {RecordedScoreAudio} from '../src/stc-track-player.js';

function fixture(){
  const parameter=()=>({value:0,setTargetAtTime(value){this.value=value;},setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(){}});
  const node=()=>({connections:[],connect(next){this.connections.push(next);},disconnect(){this.disconnected=true;}});
  const context={currentTime:10,state:'running',destination:node(),sources:[],
    createGain:()=>Object.assign(node(),{gain:parameter()}),
    createDynamicsCompressor:()=>Object.assign(node(),Object.fromEntries(['threshold','knee','ratio','attack','release'].map(key=>[key,parameter()]))),
    createBufferSource(){const source=Object.assign(node(),{starts:[],start(...args){this.starts.push(args);},stop(time){this.stoppedAt=time;}});this.sources.push(source);return source;},
    createOscillator(){return Object.assign(node(),{frequency:parameter(),start(time){this.startAt=time;},stop(time){this.stopAt=time;}});},
    createStereoPanner:()=>Object.assign(node(),{pan:parameter()}),
    async resume(){this.state='running';},
  };
  const audio=new RecordedScoreAudio().useContext(context);
  audio.buffers=Array.from({length:2},()=>({duration:75,sampleRate:48000,length:3600000,numberOfChannels:2}));
  return {context,audio};
}

test('the two production stems start with one time and retain alignment after pause and resume',()=>{
  const {audio,context}=fixture();audio.start();
  assert.equal(context.sources.length,2);assert.deepEqual(context.sources[0].starts,context.sources[1].starts);
  assert.equal(context.sources[0].buffer,audio.buffers[0]);assert.equal(context.sources[1].buffer,audio.buffers[1]);
  audio.update();audio.update();assert.equal(context.sources.length,2,'frames cannot start duplicate soundtrack pairs');
  context.currentTime=12.04;audio.pause();assert.ok(Math.abs(audio.offset-2)<1e-9);
  assert.ok(context.sources.every(source=>source.disconnected&&source.stoppedAt===12.04));
  assert.equal(audio.diagnosticState().activeMusicSources,0);
  context.currentTime=30;audio.resume();assert.equal(context.sources.length,4);
  assert.deepEqual(context.sources[2].starts,context.sources[3].starts);
  assert.ok(Math.abs(context.sources[2].starts[0][1]-2)<1e-9,'resume seeks instead of replaying the entrance');
  assert.equal(context.sources[2].buffer,context.sources[0].buffer,'decoded buffers are retained');
  audio.stop();assert.equal(audio.offset,0);assert.equal(audio.musicSources.length,0);
});

test('room control changes only the rendered return and preserves the direct mix',()=>{
  const {audio}=fixture();audio.start();const originalDry=audio.dry.gain.value,originalMusic=audio.buses.music.gain.value;
  audio.setOptions({roomVolume:0});assert.equal(audio.wet.gain.value,0);
  assert.equal(audio.dry.gain.value,originalDry);assert.equal(audio.buses.music.gain.value,originalMusic);
  audio.setOptions({roomVolume:.55});assert.equal(audio.wet.gain.value,.55);assert.equal(audio.dry.gain.value,1);
  audio.setOptions({sound:false});assert.equal(audio.master.gain.value,0);assert.equal(audio.musicSources.length,2);
  audio.setOptions({sound:true});assert.equal(audio.master.gain.value,.5);
  audio.setMode('visual');assert.equal(audio.master.gain.value,0);
  audio.setMode('combined');assert.equal(audio.master.gain.value,.5);
  assert.equal(audio.diagnosticState().engine,'recorded-stems');assert.equal(audio.diagnosticState().hrtfNodes,0);
});

test('loading validates synchronized stereo files and reuses decoded music on later gestures',async()=>{
  const {context}=fixture();let decodes=0,fetches=0;const prior=globalThis.fetch;
  context.decodeAudioData=async()=>{decodes++;return {numberOfChannels:2,sampleRate:48000,length:3600000,duration:75};};
  globalThis.fetch=async()=>{fetches++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
  try{
    const audio=new RecordedScoreAudio().useContext(context);
    assert.equal(await audio.unlock(),true);assert.equal(await audio.unlock(),true);
    assert.equal(fetches,2);assert.equal(decodes,2);assert.equal(audio.diagnosticState().decodedBuffers,2);
    audio.start();audio.pause();audio.resume();assert.equal(decodes,2);
    context.decodeAudioData=async()=>({numberOfChannels:2,sampleRate:48000,length:decodes++===2?100:200,duration:1});
    const invalid=new RecordedScoreAudio().useContext(context);assert.equal(await invalid.load(),false);
    assert.match(invalid.loadError,/not aligned/);assert.equal(invalid.buffers.length,0);
  }finally{globalThis.fetch=prior;}
});

test('typed action cues retain their identity and pan outside the room stem',()=>{
  const {audio}=fixture();audio.start();
  const entry={type:'attack-entered',eventId:'entry',objectId:'shot',family:'pulse',position:{x:.5,y:0},topology:'bolza'};
  const before=structuredClone(entry);assert.equal(audio.announce(entry),true);assert.deepEqual(entry,before);
  assert.equal(audio.attack(entry),false);assert.equal(audio.crossing({...entry,type:'prediction'}),false);
  assert.equal(audio.crossing({type:'crossing',eventId:'return',objectId:'shot',from:1,to:5,pan:-.5,topology:'bolza'}),true);
  const state=audio.diagnosticState();assert.equal(state.sourceHistory[0].motif,state.crossingHistory[0].motif);
  assert.equal(state.crossingHistory[0].pan,-.5);
  for(const voice of audio.voices)assert.equal(voice.nodes.at(-1).connections[0],audio.buses.effects);
  audio.setMode('mismatched');audio.crossing({type:'crossing',eventId:'probe',objectId:'other',from:2,to:6,pan:.4,topology:'bolza'});
  assert.equal(audio.diagnosticState().crossingHistory.at(-1).pan,-.4);
  audio.pause();assert.equal(audio.voices.size,0);
});
