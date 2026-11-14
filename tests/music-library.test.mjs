import test from 'node:test';
import assert from 'node:assert/strict';
import {LibraryPlayer,validateCatalog,formatTime,LIBRARY_REVISION} from '../src/music-library-app.js';

function catalog(){return {revision:LIBRARY_REVISION,tracks:Array.from({length:16},(_,index)=>{
  const act=Math.floor(index/4)+1,slot=index%4+1,id=`act${act}-0${slot}`;
  return {id,act,slot,title:`Track ${id}`,seconds:[60,120,240,360][slot-1],bpm:132,
    core:`${id}-core.ogg`,atmosphere:`${id}-atmosphere.ogg`,full:`${id}.ogg`,preview:`${id}-preview.ogg`};
})};}
function fixture(){
  const parameter=()=>({value:0,setTargetAtTime(value){this.value=value;}});
  const node=()=>({connect(next){this.destination=next;return next;},disconnect(){this.disconnected=true;}});
  let fetches=0,decodes=0;const contexts=[],sources=[];
  const context={currentTime:10,state:'suspended',destination:{},resume:async()=>{context.state='running';},
    createGain:()=>Object.assign(node(),{gain:parameter()}),
    createBufferSource(){const source=Object.assign(node(),{start(...args){this.startArgs=args;},stop(){this.stopped=true;}});sources.push(source);return source;},
    async decodeAudioData(){decodes++;return {numberOfChannels:2,sampleRate:48000,length:60*48000,duration:60};},
  };
  const player=new LibraryPlayer({makeContext:()=>{contexts.push(context);return context;},fetcher:async()=>{fetches++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};}});
  const track=catalog().tracks[0];player.select(track,'https://example.test/audio/catalog.json');
  return {player,context,sources,contexts,counts:()=>({fetches,decodes}),track};
}

test('the catalog requires four duration slots for each Act and safe relative audio names',()=>{
  const data=catalog();assert.equal(validateCatalog(data).length,16);assert.equal(formatTime(360),'6:00');assert.equal(formatTime(61.9),'1:01');
  assert.throws(()=>validateCatalog({...data,tracks:data.tracks.slice(1)}),/incomplete/);
  const repeated=structuredClone(data);repeated.tracks[1]={...repeated.tracks[0]};assert.throws(()=>validateCatalog(repeated),/valid/);
  const invalid=structuredClone(data);invalid.tracks[0].core='../foreign.ogg';assert.throws(()=>validateCatalog(invalid),/valid/);
  const wrongLength=structuredClone(data);wrongLength.tracks[0].seconds=61;assert.throws(()=>validateCatalog(wrongLength),/valid/);
});

test('playback uses one context and two sources with the same start and retained offset',async()=>{
  const {player,context,sources,contexts,counts}=fixture();assert.equal(contexts.length,0);assert.equal(player.read().buffers,0);
  const starting=player.play();assert.equal(await player.play(),false);assert.equal(await starting,true);assert.equal(contexts.length,1);assert.equal(sources.length,2);
  assert.deepEqual(sources[0].startArgs,sources[1].startArgs);assert.deepEqual(counts(),{fetches:2,decodes:2});
  context.currentTime=12.04;player.pause();assert.ok(Math.abs(player.read().position-2)<1e-8);assert.equal(player.read().activeSources,0);
  assert.ok(sources.every(source=>source.stopped&&source.disconnected));context.currentTime=20;
  assert.equal(await player.play(),true);assert.deepEqual(sources[2].startArgs,sources[3].startArgs);assert.ok(Math.abs(sources[2].startArgs[1]-2)<1e-8);
  assert.deepEqual(counts(),{fetches:2,decodes:2});assert.equal(contexts.length,1);
});

test('atmosphere mute changes its gain while the rhythmic core and timeline continue',async()=>{
  const {player,sources}=fixture();await player.play();player.setAtmosphere(false);
  assert.equal(player.atmosphereGain.gain.value,0);assert.equal(player.master.gain.value,.6);assert.equal(player.read().activeSources,2);
  assert.equal(sources[0].destination,player.master);assert.equal(sources[1].destination,player.atmosphereGain);
  player.setVolume(0);assert.equal(player.master.gain.value,0);player.setAtmosphere(true);assert.equal(player.atmosphereGain.gain.value,1);
  player.seek(59.8);assert.equal(player.read().activeSources,2);assert.deepEqual(sources[2].startArgs,sources[3].startArgs);
});

test('selection drops prior decoded music and prevents a delayed old request from replacing it',async()=>{
  const {player,context,track,sources}=fixture(),pending=[];
  player.fetcher=()=>new Promise(accept=>{pending.push(accept);});const loading=player.play();await Promise.resolve();assert.equal(pending.length,2);
  const other={...track,id:'act1-02',slot:2,seconds:120};player.select(other,'https://example.test/audio/catalog.json');
  for(const release of pending)release({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});assert.equal(await loading,false);
  assert.equal(player.read().trackId,other.id);assert.equal(player.read().buffers,0);assert.equal(player.read().activeSources,0);
  assert.equal(sources.length,0);assert.equal(context.state,'running');
});

test('load errors keep retry available and invalid frame alignment cannot start sources',async()=>{
  const {player,context,sources}=fixture();player.fetcher=async()=>({ok:false,status:503});
  assert.equal(await player.play(),false);assert.equal(player.state,'error');assert.match(player.error,/503/);assert.equal(sources.length,0);
  player.fetcher=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});let number=0;
  context.decodeAudioData=async()=>({numberOfChannels:2,sampleRate:48000,length:++number===1?60*48000:60*48000+1,duration:60});
  assert.equal(await player.play(),false);assert.match(player.error,/not aligned/);assert.equal(player.buffers.length,0);
});

test('native decoding runs one job at a time instead of overlapping long stem allocations',async()=>{
  const {player,context}=fixture();let active=0,peak=0,completed=0;
  context.decodeAudioData=async()=>{active++;peak=Math.max(peak,active);await new Promise(accept=>setTimeout(accept,2));active--;completed++;
    return {numberOfChannels:2,sampleRate:48000,length:60*48000,duration:60};};
  assert.equal(await player.play(),true);assert.equal(completed,2);assert.equal(peak,1);assert.equal(player.read().buffers,2);
});

test('the native fetch function keeps its global receiver',async()=>{
  const {context,track}=fixture();const previous=globalThis.fetch;
  globalThis.fetch=async function(){assert.equal(this,globalThis);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
  try{const player=new LibraryPlayer({makeContext:()=>context});player.select(track,'https://example.test/audio/catalog.json');assert.equal(await player.play(),true);}
  finally{globalThis.fetch=previous;}
});

test('stop and natural end leave no current source pair and retain bounded history',async()=>{
  const {player,sources}=fixture();await player.play();sources[0].onended();sources[1].onended();
  assert.equal(player.state,'ended');assert.equal(player.read().position,60);assert.equal(player.read().activeSources,0);
  await player.play();assert.equal(sources[2].startArgs[1],0);player.stop();assert.equal(player.state,'ready');assert.equal(player.read().position,0);
  for(let i=0;i<20;i++){await player.play();player.stop();}assert.equal(player.history.length,32);assert.equal(player.read().buffers,2);
});
