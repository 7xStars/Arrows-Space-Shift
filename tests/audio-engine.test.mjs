import test from 'node:test';
import assert from 'node:assert/strict';
import {FlightAudio,AUDIO_LIMITS} from '../src/audio.js';
import {SCORE_THEMES,arrangementStep,musicContextFor,scoreThemeFor,HARMONIC_CYCLE,MELODIC_PHRASE,MUSIC_PHRASE_STEPS,midiHz} from '../src/music.js';

function contextFixture(){
  const parameter=(value=0)=>({value,events:[],setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t]);},
    exponentialRampToValueAtTime(v,t){this.events.push(['ramp',v,t]);},cancelScheduledValues(t){this.events.push(['cancel',t]);},
    setTargetAtTime(v,t,c){this.value=v;this.events.push(['target',v,t,c]);}});
  const node=()=>({connections:[],connect(next){this.connections.push(next);return next;},disconnect(){this.disconnected=true;}});
  const context={currentTime:0,sampleRate:48000,state:'running',destination:node(),nodes:[],buffers:0,
    async resume(){this.state='running';this.resumeCalls=(this.resumeCalls||0)+1;},
    createGain(){return Object.assign(node(),{gain:parameter()});},
    createBiquadFilter(){return Object.assign(node(),{frequency:parameter(),Q:parameter()});},
    createStereoPanner(){return Object.assign(node(),{pan:parameter()});},
    createWaveShaper(){return node();},
    createBuffer(channels,length){this.buffers++;const data=new Float32Array(length);return {getChannelData:()=>data};},
    createOscillator(){const result=Object.assign(node(),{frequency:parameter(),start(time){this.startAt=time;},stop(time){this.stopAt=time;}});this.nodes.push(result);return result;},
    createBufferSource(){const result=Object.assign(node(),{start(time){this.startAt=time;},stop(time){this.stopAt=time;}});this.nodes.push(result);return result;},
  };
  return context;
}

test('master and the three mix buses have independent gains',()=>{
  const context=contextFixture(),audio=new FlightAudio().useContext(context);
  assert.deepEqual(audio.diagnosticState().buses,{music:.55,effects:.8,ambience:.25});
  assert.equal(audio.master.gain.value,.5);
  audio.setOptions({musicVolume:0,effectsVolume:.6,ambienceVolume:.1,volume:.4});
  assert.deepEqual(audio.diagnosticState().buses,{music:0,effects:.6,ambience:.1});
  assert.equal(audio.master.gain.value,.4);
  const effect=audio.voice({from:440,to:220}),music=audio.voice({bus:'music'}),ambience=audio.voice({bus:'ambience'});
  assert.equal(effect.nodes.at(-1).connections[0],audio.buses.effects);
  assert.equal(music.nodes.at(-1).connections[0],audio.buses.music);
  assert.equal(ambience.nodes.at(-1).connections[0],audio.buses.ambience);
  audio.setOptions({sound:false});assert.equal(audio.master.gain.value,0);
  assert.equal(audio.voice(),false);
});

test('a critical warning replaces a lower priority voice at capacity',()=>{
  const audio=new FlightAudio().useContext(contextFixture());
  for(let i=0;i<AUDIO_LIMITS.regularVoices;i++)assert.ok(audio.voice({priority:0,bus:'music'}));
  assert.equal(audio.voice({priority:0}),false);
  for(let i=0;i<AUDIO_LIMITS.voices-AUDIO_LIMITS.regularVoices;i++)assert.ok(audio.voice({priority:2}));
  const before=audio.diagnosticState();audio.cue('join-warning');
  const after=audio.diagnosticState();
  assert.equal(after.voices,AUDIO_LIMITS.voices);assert.equal(after.stolen,before.stolen+2);
  assert.equal([...audio.activeVoices].filter(voice=>voice.priority===3).length,2);
  for(let i=0;i<100;i++)audio.voice({priority:3});
  assert.ok(audio.diagnosticState().voices<=AUDIO_LIMITS.voices);
  assert.ok(audio.diagnosticState().retiringVoices<=AUDIO_LIMITS.retiringVoices);
});

test('the semantic event priority reaches actual voice allocation',()=>{
  const audio=new FlightAudio().useContext(contextFixture()),state={time:1,phase:'running',stageIndex:0,player:{position:{x:0,y:0}},events:[{type:'capture',t:1}]};
  audio.process(state);
  const effects=[...audio.activeVoices].filter(voice=>voice.bus==='effects');
  assert.equal(effects.length,2);assert.ok(effects.every(voice=>voice.priority===2));
});

test('repeated procedural noise reuses bounded buffers and releases its nodes',()=>{
  const context=contextFixture(),audio=new FlightAudio().useContext(context);
  for(const duration of [.035,.055,.075,.18,.24,.32]){
    const voice=audio.noise(duration,.01,1000);voice.osc.onended();voice.osc.onended();
  }
  assert.equal(context.buffers,1);assert.equal(audio.diagnosticState().noiseBuffers,1);
  assert.equal(audio.diagnosticState().voices,0);
});

test('gesture recovery resumes one existing context without duplicate construction',async()=>{
  const previous=globalThis.AudioContext;let created=0;
  globalThis.AudioContext=class{constructor(){created++;return {...contextFixture(),state:'suspended'};}};
  try{
    const audio=new FlightAudio();assert.equal(await audio.resumeFromGesture(),true);
    const first=audio.context;first.state='suspended';
    assert.equal(await audio.unlock(),true);assert.equal(created,1);assert.equal(audio.context,first);
    assert.equal(first.resumeCalls,2);audio.setOptions({sound:false});
    first.state='suspended';assert.equal(await audio.resumeFromGesture(),false);assert.equal(first.resumeCalls,2);
  }finally{globalThis.AudioContext=previous;}
});

test('the six original arrangements are finite, distinct, and sparse during recovery',()=>{
  const signatures=new Set();
  for(const name of Object.keys(SCORE_THEMES)){
    const notes=Array.from({length:64},(_,step)=>arrangementStep(name,step,{intensity:.9,boss:true,fold:true}));
    signatures.add(JSON.stringify(notes));
    for(const note of notes.flat()){
      assert.ok(note.duration>0&&note.volume>0&&Number.isFinite(note.volume));
      assert.ok(note.duration<=4);assert.ok(['music','ambience'].includes(note.bus));
      if(note.kind==='tone')assert.ok(note.from>20&&note.to>20);
    }
  }
  assert.equal(signatures.size,6);
  const count=name=>Array.from({length:16},(_,step)=>arrangementStep(name,step,{intensity:.9})).flat().length;
  assert.ok(count('recovery')<count('traditional')/2);
  assert.ok(count('ending')<count('projective')/2);
});

test('the retained offline score adapts without changing simulation state',()=>{
  const s={time:10,phase:'running',campaign:{index:18},enemies:[{hp:3,boss:true}],shots:Array.from({length:30},()=>({})),fields:[{}]};
  const before=structuredClone(s),audio=new FlightAudio({recordedMusic:false}).useContext(contextFixture());
  audio.setPlaying(true,s);assert.deepEqual(s,before);
  assert.equal(scoreThemeFor(s),'projective');assert.equal(musicContextFor(s).fold,true);
  const first=audio.scoreStep;audio.setPlaying(true,s);assert.equal(audio.scoreStep,first);
  audio.context.currentTime=30;audio.scheduleScore(s);assert.ok(audio.scoreStep-first<=3,'a late frame cannot produce an old-score burst');
  assert.equal(scoreThemeFor({musicState:'ending'}),'ending');
});

test('the retained offline ending plays its confirmed activation and arrangement',()=>{
  const audio=new FlightAudio({recordedMusic:false}).useContext(contextFixture()),s={mode:'repair',phase:'ending',musicState:'ending',
    time:4,paused:false,events:[{type:'drive-activated',time:4}]},before=structuredClone(s);
  audio.process(s);assert.deepEqual(s,before);assert.equal(audio.scoreTheme,'ending');
  assert.equal([...audio.activeVoices].filter(voice=>voice.bus==='effects'&&voice.priority===3).length,4);
  assert.ok([...audio.activeVoices].some(voice=>voice.bus==='music'));
  s.phase='complete';s.events.push({type:'won',time:4});audio.process(s);
  assert.equal(audio.ambient,null);assert.ok([...audio.activeVoices].some(voice=>voice.bus==='effects'));
});

test('Act IV boss phase and recovery drive their actual score context',()=>{
  const state={time:10,stageIndex:8,player:{position:{x:0,y:0}},stage:{boss:true},bossPhase:2,bossRecoveryUntil:0,
    shots:Array.from({length:45},()=>({})),enemies:[{hp:30,boss:true}]};
  assert.equal(scoreThemeFor(state),'bolza');assert.equal(musicContextFor(state).phase,2);
  const second=arrangementStep('bolza',24,musicContextFor(state));state.bossPhase=3;
  const third=arrangementStep('bolza',24,musicContextFor(state));assert.notDeepEqual(second,third);
  state.bossRecoveryUntil=12.3;assert.equal(scoreThemeFor(state),'recovery');
  state.time=12.3;assert.equal(scoreThemeFor(state),'bolza');
});

test('musical envelopes hold a sustain level while short effects keep their decay',()=>{
  const audio=new FlightAudio().useContext(contextFixture());
  const held=audio.voice({duration:1.5,volume:.02,sustain:.75,release:.3}),events=held.gain.gain.events;
  assert.ok(events.some(([kind,value,time])=>kind==='set'&&value===.015&&time===1.2));
  assert.deepEqual(events.at(-1),['ramp',.0001,1.5]);
  const effect=audio.voice({duration:.1,volume:.02});
  assert.equal(effect.gain.gain.events.filter(([kind])=>kind==='set').length,1,'legacy effects have no held sustain');
});

test('an eight-bar melody and bass cadence continue independently of combat density',()=>{
  assert.equal(MUSIC_PHRASE_STEPS,128);assert.ok(MELODIC_PHRASE.length>=12);
  const roots=[];
  for(let bar=0;bar<8;bar++){
    const notes=arrangementStep('traditional',bar*16,{intensity:.5});
    roots.push(notes.find(note=>note.role==='bass').from);
    const harmony=notes.filter(note=>note.role==='harmony');assert.equal(harmony.length,3);
    assert.ok(harmony.every(note=>note.duration>1&&note.sustain>0));
  }
  assert.deepEqual(roots,HARMONIC_CYCLE.map(chord=>midiHz(chord.root)));
  assert.notEqual(roots[0],roots[1]);assert.equal(HARMONIC_CYCLE[7].name,'Am');
  const phrase=[];
  for(let step=0;step<128;step++){
    const calm=arrangementStep('traditional',step,{intensity:0}).filter(note=>note.role==='melody'),
      busy=arrangementStep('traditional',step,{intensity:1}).filter(note=>note.role==='melody');
    assert.deepEqual(calm,busy);phrase.push(...calm);
  }
  assert.ok(phrase.some(note=>note.duration>.8));assert.ok(phrase.every(note=>note.from===note.to&&note.sustain>0));
  assert.deepEqual(arrangementStep('traditional',0,{intensity:.5}),arrangementStep('traditional',128,{intensity:.5}));
});

test('soft distortion curves are bounded, cached, and do not add gain',()=>{
  const audio=new FlightAudio().useContext(contextFixture());
  const first=audio.voice({distortion:.12}),second=audio.voice({distortion:.12});
  const shape=first.nodes.find(node=>node.curve);assert.ok(shape);
  assert.equal(shape.curve,second.nodes.find(node=>node.curve).curve);
  for(const sample of shape.curve)assert.ok(Number.isFinite(sample)&&Math.abs(sample)<=1);
  assert.equal(shape.curve[256],0);
  for(let i=0;i<10;i++)audio.voice({distortion:.01+i*.01});
  assert.ok(audio.diagnosticState().distortionCurves<=AUDIO_LIMITS.distortionCurves);
  const accent=arrangementStep('projective',0,{intensity:1});assert.ok(accent.some(note=>note.distortion>0));
});
