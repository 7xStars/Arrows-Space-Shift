import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignRecordedAudio,CampaignAttackMotifs,CAMPAIGN_RECORDINGS,campaignRecordingFor} from '../src/campaign-recorded-audio.js';
import {FlightAudio} from '../src/audio.js';
import {createFlight,recordEvent} from '../src/simulation.js';
import {enterChapter} from '../src/campaign.js';
import {addFold,removeFold} from '../src/space.js';
import {queueEvolution,chooseEvolution} from '../src/ecology.js';
import {readFile} from 'node:fs/promises';

function fixture({failure=false,defer=false}={}){
  const sources=[],oscillators=[],jobs=[];
  const param=(value=0)=>({value,events:[],setValueAtTime(value,time){this.value=value;this.events.push(['set',value,time]);},
    linearRampToValueAtTime(value,time){this.value=value;this.events.push(['ramp',value,time]);},
    exponentialRampToValueAtTime(value,time){this.events.push(['exp',value,time]);},cancelScheduledValues(){},
    setTargetAtTime(value,time){this.value=value;this.events.push(['target',value,time]);}});
  const node=()=>({connect(next){this.destination=next;return next;},disconnect(){this.disconnected=true;}});
  const context={currentTime:0,state:'running',sampleRate:48000,destination:node(),
    async resume(){this.state='running';},createGain(){return {...node(),gain:param()};},
    createBiquadFilter(){return {...node(),frequency:param(),Q:param()};},
    createOscillator(){const source={...node(),frequency:param(),start(at){this.startAt=at;},stop(at){this.stopAt=at;}};oscillators.push(source);return source;},
    createBufferSource(){const source={...node(),start(...args){this.args=args;this.end=args[0]+args[2];},stop(at){this.end=Math.min(this.end,at);this.stopped=true;}};sources.push(source);return source;},
    async decodeAudioData(bytes){const seconds=new DataView(bytes).getFloat64(0);return {numberOfChannels:2,sampleRate:48000,length:Math.round(seconds*48000),duration:seconds};},
  };
  const fetcher=async url=>{
    if(defer)await new Promise(accept=>jobs.push(accept));
    if(failure)return {ok:false,status:503};
    const seconds=url.includes('title-r9')?3678806/48000:url.includes('-09-')?24:24.08;
    const bytes=new ArrayBuffer(8);new DataView(bytes).setFloat64(0,seconds);
    return {ok:true,arrayBuffer:async()=>bytes};
  };
  const buses={music:node(),ambience:node()},player=new CampaignRecordedAudio(context,buses,{fetcher});
  const advance=time=>{context.currentTime=time;for(const source of sources)if(!source.ended&&source.end<=time){source.ended=true;source.onended?.();}};
  return {context,player,sources,oscillators,fetcher,jobs,advance};
}
const runState=()=>({time:10,phase:'running',paused:false,campaign:{index:0},enemies:[],shots:[],enemyShots:[],events:[]});
async function ready(player,selection){player.update(selection,true);await player.ensure(0);player.update(selection,true);await player.queue;}

test('recorded selections use the existing four Act compositions and produced ending atmosphere',()=>{
  const s=runState(),before=structuredClone(s);assert.equal(campaignRecordingFor(s).track.id,'act1-03');
  s.campaign.index=9;assert.equal(campaignRecordingFor(s).track.id,'act2-03');s.campaign.index=18;assert.equal(campaignRecordingFor(s).track.id,'act3-03');
  assert.equal(campaignRecordingFor({stageIndex:0,player:{position:{x:0,y:0}}}).track.id,'act4-03');
  const repair=campaignRecordingFor({mode:'repair',phase:'running'});assert.equal(repair.track.id,'act4-03');assert.equal(repair.quiet,true);assert.equal(repair.mixMode,'atmosphere');
  const end=campaignRecordingFor({mode:'repair',phase:'ending'});assert.equal(end.offset,216);assert.equal(end.repeat,false);assert.equal(end.quiet,true);assert.equal(end.mixMode,'atmosphere');
  assert.equal(campaignRecordingFor(before,{title:true}).track.id,'identified-return-r9');assert.equal(before.campaign.index,0);
});

test('aligned core and atmosphere start on one audio clock with no repeating AudioBufferSource',async()=>{
  const {player,sources}=fixture();await ready(player,campaignRecordingFor(runState()));
  assert.equal(sources.length,2);assert.deepEqual(sources[0].args,sources[1].args);assert.equal(sources[0].loop,false);
  assert.equal(sources[0].args[0],.045);assert.equal(player.read().engine,'recorded-segments');assert.equal(player.read().trackId,'act1-03');
  assert.equal(player.read().loadedSegments,2);assert.ok(player.read().decodedBytes<38*1024*1024);
});

test('the next segment is scheduled before the boundary with complementary linear fades',async()=>{
  const {player,sources,advance}=fixture(),selection=campaignRecordingFor(runState());await ready(player,selection);
  advance(23.9);player.update(selection,true);assert.equal(sources.length,4);assert.deepEqual(sources[2].args,sources[3].args);
  assert.equal(sources[2].args[0],24.045);assert.equal(sources[2].args[1],0);
  const old=sources[0].destination.gain.events,newer=sources[2].destination.gain.events;
  assert.ok(old.some(([kind,value,time])=>kind==='ramp'&&value===0&&Math.abs(time-24.125)<1e-8));
  assert.ok(newer.some(([kind,value,time])=>kind==='ramp'&&value===1&&Math.abs(time-24.125)<1e-8));
});

test('pause and resume retain the position and do not decode the same segment again',async()=>{
  const {player,sources,advance}=fixture(),selection=campaignRecordingFor(runState());await ready(player,selection);
  advance(3.045);player.update(null,false);const state=player.read();assert.ok(Math.abs(state.offset-3)<1e-8);assert.equal(state.activeSources,0);
  advance(10);player.update(selection,true);assert.equal(sources.length,4);assert.ok(Math.abs(sources[2].args[1]-3)<1e-8);
  assert.equal(player.read().decodes,state.decodes);assert.equal(player.read().activeSources,2);
});

test('flight recovery keeps a quiet rhythmic reference without restarting its sources',async()=>{
  const {player,advance,sources}=fixture(),selection=campaignRecordingFor(runState());await ready(player,selection);
  advance(5);const before=player.read().offset;player.update(campaignRecordingFor(runState(),{recovery:true}),true);
  assert.equal(player.read().offset,before);assert.equal(player.read().layers.core,.42);assert.equal(player.read().layers.atmosphere,1);assert.equal(sources.length,2);
  assert.equal(player.read().mixMode,'recovery');
  player.update(selection,true);assert.ok(player.read().layers.core>0);assert.equal(sources.length,2);
});

test('repair and ending retain the atmosphere-only mix',async()=>{
  for(const state of [{mode:'repair',phase:'running'},{mode:'repair',phase:'ending'}]){
    const {player}=fixture(),selection=campaignRecordingFor(state);player.update(selection,true);
    await player.queue;await player.queue;player.update(selection,true);await player.queue;
    assert.equal(player.read().mixMode,'atmosphere');assert.equal(player.read().layers.core,0);
    assert.equal(player.read().layers.atmosphere,1);assert.equal(player.read().state,'playing');
  }
});

test('repeated critical warnings have a fixed attenuation floor and retain the music clock',async()=>{
  const {player,sources,advance}=fixture(),selection=campaignRecordingFor(runState());await ready(player,selection);
  const base=player.read().layers;
  for(let time=1;time<=5;time+=.1){
    advance(time);player.duck();player.update(selection,true);
    const read=player.read();assert.equal(read.ducked,true);assert.equal(read.mixMode,'full');
    assert.equal(read.layers.core,base.core*.75);assert.equal(read.layers.atmosphere,base.atmosphere*.9);
    assert.equal(read.activeSources,2);assert.equal(read.underruns,0);assert.equal(sources.length,2);
    assert.ok(Math.abs(read.offset-(time-.045))<1e-8);
  }
  player.update(campaignRecordingFor(runState(),{recovery:true}),true);assert.equal(player.read().layers.core,.42*.75);
  advance(6);player.update(selection,true);assert.equal(player.read().ducked,false);assert.deepEqual(player.read().layers,base);
});

test('cache and node counts stay bounded through a whole finite arrangement and its repeat',async()=>{
  const {player,advance}=fixture(),selection=campaignRecordingFor(runState());await ready(player,selection);
  for(let index=0;index<16;index++){
    advance(index*24+.045);player.update(selection,true);await player.queue;player.update(selection,true);await player.queue;
    advance(index*24+23.9);player.update(selection,true);await player.queue;
    assert.ok(player.read().loadedSegments<=2);assert.ok(player.read().activeSources<=4);assert.ok(player.read().history.length<=24);
  }
  assert.ok(player.read().repeats>0);assert.ok(player.read().peakDecodedSegments<=2);
});

test('a late request cannot restart a former Act after a selection change',async()=>{
  const {player,jobs}=fixture({defer:true});player.update(campaignRecordingFor(runState()),true);await Promise.resolve();
  assert.equal(jobs.length,1);player.update(campaignRecordingFor({campaign:{index:9}}),false);jobs.shift()();await player.queue;
  assert.equal(player.read().trackId,'act2-03');assert.equal(player.read().loadedSegments,0);assert.equal(player.read().activeSources,0);
});

test('a changed Act cancels its previous fetch before the next native decode job',async()=>{
  const {player,fetcher}=fixture();let oldSignal;
  player.fetcher=(url,options)=>oldSignal?fetcher(url):new Promise((accept,reject)=>{
    oldSignal=options.signal;oldSignal.addEventListener('abort',()=>reject(new Error('Cancelled old recording.')),{once:true});
  });
  player.update(campaignRecordingFor(runState()),true);await Promise.resolve();
  const next=runState();next.campaign.index=9;player.update(campaignRecordingFor(next),true);
  await player.queue;await player.queue;player.update(null,true);await player.queue;
  assert.equal(oldSignal.aborted,true);assert.equal(player.read().trackId,'act2-03');assert.equal(player.read().error,'');
  assert.equal(player.read().state,'playing');
});

test('a failed live recording leaves music silent and supports an explicit retry',async()=>{
  const {player,sources,fetcher}=fixture({failure:true});player.update(campaignRecordingFor(runState()),true);await player.queue;
  assert.equal(player.read().state,'error');assert.match(player.read().error,/503/);assert.equal(sources.length,0);
  player.fetcher=fixture().fetcher;assert.equal(await player.retry(),true);await player.queue;
  assert.equal(player.read().state,'playing');assert.equal(sources.length,2);assert.equal(player.read().error,'');
});

test('live FlightAudio uses recorded music while action sounds retain the effects bus',async()=>{
  const {context,fetcher,oscillators}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher}).useContext(context),state=runState(),before=structuredClone(state);
  audio.process(state);await audio.recorded.queue;await audio.recorded.queue;audio.process(state);
  assert.equal(audio.diagnosticState().recorded.trackId,'act1-03');assert.equal(oscillators.length,0);assert.deepEqual(state,before);
  audio.cue('player-fire');assert.equal(oscillators.length,1);assert.equal(oscillators[0].destination.destination,audio.buses.effects);
  audio.setOptions({music:false});assert.equal(audio.diagnosticState().recorded.activeSources,0);assert.ok(audio.options.sound);
});

test('a gesture without a new state retains the current Act and music position',async()=>{
  const {context,fetcher,sources,advance}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher}).useContext(context),state=runState();
  state.campaign.index=18;
  audio.process(state);await audio.recorded.queue;await audio.recorded.queue;audio.process(state);
  advance(5);audio.process(state);const before=audio.diagnosticState().recorded;
  audio.setPlaying(true);
  const after=audio.diagnosticState().recorded;
  assert.equal(after.trackId,'act3-03');assert.equal(after.offset,before.offset);
  assert.equal(after.starts,before.starts);assert.equal(sources.length,2);
  assert.equal(after.state,'playing');assert.equal(after.error,'');
});

test('real fold and unfold operations retain music sources and position in Acts I to III',async()=>{
  for(const [index,trackId] of [[0,'act1-03'],[9,'act2-03'],[25,'act3-03']]){
    const {context,fetcher,sources,advance}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher}).useContext(context);
    const state=createFlight('campaign',{seed:3449244629});enterChapter(state,index);state.phase='running';
    audio.process(state);await audio.recorded.queue;await audio.recorded.queue;audio.process(state);
    const starts=audio.recorded.read().starts;
    for(const [time,type,change] of [[2,'fold',addFold],[3,'unfold',removeFold],[4,'fold',addFold]]){
      advance(time);state.time=time;assert.ok(change(state));recordEvent(state,type,{fields:state.fields.length});
      const before=structuredClone(state);audio.process(state);assert.deepEqual(state,before);
      const recording=audio.recorded.read();assert.equal(recording.trackId,trackId);assert.equal(recording.starts,starts);
      assert.equal(recording.state,'playing');assert.equal(recording.quiet,false);assert.equal(recording.ducked,false);
      assert.ok(recording.layers.core>=.78);assert.equal(recording.underruns,0);assert.equal(sources.length,2);
      assert.ok(Math.abs(recording.offset-(time-.045))<1e-8);
    }
  }
});

test('an actual Echo Forge offer keeps the recovery rhythm and the source clock',async()=>{
  const {context,fetcher,sources,advance}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher}).useContext(context);
  const state=createFlight('campaign',{seed:3449244629,fleetProfile:{driveParts:['klein-relay','projective-module'],fleetUnlocked:true}});
  enterChapter(state,25);state.phase='running';audio.process(state);await audio.recorded.queue;await audio.recorded.queue;audio.process(state);
  advance(3);state.time=3;assert.equal(queueEvolution(state,'audio-recovery-test'),true);assert.equal(state.phase,'choosing');
  const before=structuredClone(state);audio.process(state);assert.deepEqual(state,before);
  const offer=audio.recorded.read();assert.equal(offer.state,'playing');assert.equal(offer.trackId,'act3-03');
  assert.equal(offer.mixMode,'recovery');assert.equal(offer.layers.core,.42);assert.equal(offer.activeSources,2);
  advance(5);audio.process(state);assert.equal(state.time,3);assert.ok(Math.abs(audio.recorded.read().offset-4.955)<1e-8);
  assert.equal(sources.length,2);assert.equal(audio.recorded.read().underruns,0);
  assert.equal(chooseEvolution(state,state.projective.offers[0]),true);audio.process(state);
  assert.equal(audio.recorded.read().mixMode,'full');assert.ok(audio.recorded.read().layers.core>=.78);assert.equal(sources.length,2);
  state.phase='paused';audio.process(state);assert.equal(audio.recorded.read().activeSources,0);
});

test('Echo Forge music still obeys mute, manual pause, and page hiding',async()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'document'),document={hidden:false};
  Object.defineProperty(globalThis,'document',{value:document,configurable:true});
  try{
    for(const condition of ['mute','manual-pause','hidden']){
      document.hidden=false;
      const {context,fetcher}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher}).useContext(context);
      const state=createFlight('campaign',{seed:3449244629,fleetProfile:{driveParts:['klein-relay','projective-module'],fleetUnlocked:true}});
      enterChapter(state,25);state.phase='running';audio.process(state);await audio.recorded.queue;await audio.recorded.queue;
      assert.equal(queueEvolution(state,'audio-interruption-test'),true);audio.process(state);
      assert.equal(audio.recorded.read().activeSources,2);assert.equal(audio.recorded.read().mixMode,'recovery');
      if(condition==='mute')audio.setOptions({music:false});
      if(condition==='manual-pause')state.phase='paused';
      if(condition==='hidden')document.hidden=true;
      audio.process(state);assert.equal(audio.recorded.read().activeSources,0);assert.equal(audio.recorded.read().state,'paused');
    }
  }finally{if(descriptor)Object.defineProperty(globalThis,'document',descriptor);else delete globalThis.document;}
});

test('a live recording failure never invokes the rejected procedural score',async()=>{
  const {context,fetcher,oscillators}=fixture({failure:true}),audio=new FlightAudio({recordedFetcher:fetcher}).useContext(context);
  audio.process(runState());await audio.recorded.queue;audio.process(audio.flight);assert.equal(oscillators.length,0);
  assert.equal(audio.diagnosticState().recorded.state,'error');audio.cue('player-fire');assert.equal(oscillators.length,1);
});

test('the title request API uses the produced r9 asset and one context',async()=>{
  const previous=globalThis.AudioContext,{context,fetcher,sources}=fixture();let contexts=0;
  globalThis.AudioContext=class{constructor(){contexts++;return context;}};
  try{
    const audio=new FlightAudio({recordedFetcher:fetcher});assert.equal(audio.context,null);assert.equal(await audio.startTitle(),true);
    await audio.recorded.queue;audio.setPlaying(false,{phase:'ready',paused:false});assert.equal(audio.diagnosticState().recorded.trackId,'identified-return-r9');
    assert.equal(contexts,1);assert.equal(sources.length,1);audio.setPlaying(false,{phase:'ready',paused:true});assert.equal(audio.diagnosticState().recorded.activeSources,0);
    audio.stopTitle();assert.equal(audio.titleRequested,false);
  }finally{globalThis.AudioContext=previous;}
});

test('automatic title preparation loads r9 while browser audio waits for a gesture',async()=>{
  const {context,fetcher,sources}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher}).useContext(context);
  context.state='suspended';let release;
  context.resume=()=>new Promise(accept=>{release=()=>{context.state='running';accept();};});
  const pending=audio.startTitle();
  await audio.recorded.queue;
  assert.equal(audio.recorded.read().trackId,'identified-return-r9');
  assert.equal(audio.recorded.read().loadedSegments,1);
  assert.equal(sources.length,0);
  assert.equal(audio.diagnosticState().titleStartup.state,'waiting-for-gesture');
  release();assert.equal(await pending,true);
  assert.equal(audio.recorded.read().activeSources,1);
  assert.equal(audio.diagnosticState().titleStartup.state,'playing');
});

test('a late browser resume cannot start a title that was muted during preparation',async()=>{
  const {context,fetcher,sources}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher}).useContext(context);
  context.state='suspended';let release;
  context.resume=()=>new Promise(accept=>{release=()=>{context.state='running';accept();};});
  const pending=audio.startTitle();await audio.recorded.queue;
  assert.equal(audio.recorded.read().loadedSegments,1);
  audio.setOptions({sound:false});release();assert.equal(await pending,false);
  assert.equal(sources.length,0);
  assert.equal(audio.diagnosticState().titleStartup.state,'muted');
});

test('repeated title requests reuse one prepared buffer and start one source after permission',async()=>{
  const {context,fetcher,sources}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher}).useContext(context);
  context.state='suspended';const resumes=[];
  context.resume=()=>new Promise(accept=>resumes.push(accept));
  const first=audio.startTitle(),second=audio.startTitle();await audio.recorded.queue;
  assert.equal(audio.recorded.read().fetches,1);assert.equal(audio.recorded.read().decodes,1);
  assert.equal(sources.length,0);context.state='running';for(const resume of resumes)resume();
  assert.deepEqual(await Promise.all([first,second]),[false,true]);
  assert.equal(sources.length,1);assert.equal(audio.recorded.read().activeSources,1);
});

test('a late title resume cannot override Stop, music mute, or a campaign launch',async()=>{
  for(const action of ['stop','mute','launch']){
    const {context,fetcher,sources}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher});audio.useContext(context);
    let release;audio.resumeFromGesture=()=>new Promise(accept=>{release=accept;});
    const pending=audio.startTitle();
    if(action==='stop')audio.stopTitle();
    if(action==='mute')audio.setOptions({music:false});
    if(action==='launch')audio.setPlaying(true,runState());
    release(true);assert.equal(await pending,false);await audio.recorded.queue;
    if(action==='launch')assert.equal(audio.recorded.read().trackId,'act1-03');
    else {
      assert.equal(sources.length,0);assert.equal(audio.recorded.read().activeSources,0);
      assert.equal(audio.recorded.read().state,'paused');
    }
  }
});

test('sound and music preferences block the title before audio initialization',async()=>{
  for(const options of [{sound:false},{music:false}]){
    const audio=new FlightAudio(options);let attempts=0;audio.resumeFromGesture=async()=>{attempts++;return true;};
    assert.equal(await audio.startTitle(),false);assert.equal(attempts,0);assert.equal(audio.titleRequested,false);
  }
});

test('a hidden page stops title sources, holds their position, and respects Stop on return',async()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'document'),document={hidden:false};
  Object.defineProperty(globalThis,'document',{value:document,configurable:true});
  try{
    const {context,fetcher,sources,advance}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher});audio.useContext(context);
    let resumes=0;audio.resumeFromGesture=async()=>{resumes++;return true;};
    await audio.startTitle();await audio.recorded.queue;audio.setPlaying(false,{phase:'ready'});assert.equal(audio.recorded.read().activeSources,1);
    advance(2);document.hidden=true;audio.setPlaying(false,{phase:'ready'});
    const offset=audio.recorded.read().offset;assert.equal(audio.recorded.read().activeSources,0);assert.equal(audio.titleRequested,true);
    advance(8);audio.setPlaying(false,{phase:'ready'});assert.equal(audio.recorded.read().offset,offset);
    assert.equal(await audio.startTitle(),false);assert.equal(resumes,1);
    document.hidden=false;audio.setPlaying(false,{phase:'ready'});assert.equal(audio.recorded.read().activeSources,1);
    assert.equal(sources.at(-1).args[1],offset);
    audio.stopTitle();document.hidden=true;audio.setPlaying(false,{phase:'ready'});
    document.hidden=false;audio.setPlaying(false,{phase:'ready'});assert.equal(audio.recorded.read().activeSources,0);
    audio.setOptions({music:false});assert.equal(await audio.startTitle(),false);
  }finally{if(descriptor)Object.defineProperty(globalThis,'document',descriptor);else delete globalThis.document;}
});

test('a title resume that finishes while hidden cannot start a source; offline rendering stays independent',async()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'document'),document={hidden:false};
  Object.defineProperty(globalThis,'document',{value:document,configurable:true});
  try{
    const {context,fetcher,sources}=fixture(),audio=new FlightAudio({recordedFetcher:fetcher});audio.useContext(context);
    let release;audio.resumeFromGesture=()=>new Promise(accept=>{release=accept;});
    const pending=audio.startTitle();document.hidden=true;release(true);assert.equal(await pending,false);assert.equal(sources.length,0);
    let scheduled=0;audio.offline=true;audio.scheduleScore=()=>{scheduled++;};audio.setPlaying(true,runState());assert.equal(scheduled,1);
  }finally{if(descriptor)Object.defineProperty(globalThis,'document',descriptor);else delete globalThis.document;}
});

test('hostile attack motifs retain identity across real topology changes and reject forecasts',()=>{
  const motifs=new CampaignAttackMotifs(),entry={type:'enemy.weapon.fire',isPhysical:true,forecast:false,sourceId:'enemy-4',objectId:'shot-7',objectIds:[]};
  const first=motifs.read(entry,1),before=structuredClone(entry);assert.ok(first);assert.equal(motifs.read({...entry,type:'preview.future_image',forecast:true},2),null);
  const crossing=motifs.read({...entry,type:'topology.klein.cross',topology:'klein'},2);assert.equal(first.motif,crossing.motif);assert.equal(first.objectId,crossing.objectId);assert.deepEqual(entry,before);
  assert.equal(motifs.read({...entry,objectId:'unknown',type:'topology.bolza.join'},3),null);
  for(let index=0;index<500;index++)motifs.read({...entry,objectId:`shot-${index}`},4+index*.3);
  assert.ok(motifs.identities.size<=128);assert.ok(motifs.history.length<=32);
});

test('the runtime recording manifest agrees with the exported aligned asset intervals',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../assets/audio/campaign-music-v1/catalog.json',import.meta.url),'utf8'));
  for(const theme of ['traditional','klein','projective','bolza']){
    const runtime=CAMPAIGN_RECORDINGS[theme],record=manifest.tracks[theme];assert.equal(runtime.id,record.id);assert.equal(runtime.title,record.title);assert.equal(runtime.bpm,record.bpm);
    assert.equal(runtime.segments.length,10);assert.equal(record.segments.length,10);
    for(let index=0;index<10;index++){assert.equal(runtime.segments[index].duration,record.segments[index].seconds);assert.equal(runtime.segments[index].span,record.segments[index].span_seconds);}
  }
});
