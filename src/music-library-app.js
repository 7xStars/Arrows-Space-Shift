const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export const LIBRARY_REVISION='stc-act-library-r1';
export const LIBRARY_COLLECTIONS=Object.freeze({
  original:Object.freeze({revision:LIBRARY_REVISION,folder:'stc-act-library-r1',label:'Original Act collection',intro:'Four original studies for each Act. Compare a steady rhythmic core with its evolving atmosphere.'}),
  tempo:Object.freeze({revision:'stc-tempo-r2',folder:'stc-tempo-r2',label:'Tempo collection · 120–240 BPM',intro:'Nine original two-minute pieces. The tempos include 120, 136, 144, 152, 168, 184, 200, 220, and 240 BPM.'}),
});
export function libraryCollection(key){return Object.hasOwn(LIBRARY_COLLECTIONS,key)?LIBRARY_COLLECTIONS[key]:LIBRARY_COLLECTIONS.original;}
export const ACT_DESCRIPTIONS=Object.freeze({
  1:'Electro and mechanical rhythm establish movement, pulse, and repeated formations.',
  2:'Hypnotic repetition and acid filtering retain a motif through changes of order.',
  3:'Industrial and EBM textures test capture, release, pressure, and recovery.',
  4:'Sparse atmosphere, acid motion, and harmonic persistence frame unfamiliar space.',
});
export function formatTime(seconds){const value=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;}
export function validateCatalog(value,revision=LIBRARY_REVISION){
  const tempo=revision==='stc-tempo-r2',counts=tempo?[3,2,2,2]:[4,4,4,4],bpms=[[120,136,144],[152,168],[200,240],[184,220]];
  if(![LIBRARY_REVISION,'stc-tempo-r2'].includes(revision)||value?.revision!==revision||!Array.isArray(value.tracks)||value.tracks.length!==counts.reduce((a,b)=>a+b,0))throw new Error('The track list is incomplete.');
  const ids=new Set(),slots=new Set();
  for(const track of value.tracks){
    if(typeof track.id!=='string'||ids.has(track.id)||!Number.isInteger(track.act)||track.act<1||track.act>4||
      !Number.isInteger(track.slot)||track.slot<1||track.slot>counts[track.act-1]||track.id!==`${tempo?'tempo-':''}act${track.act}-0${track.slot}`||track.seconds!==(tempo?120:[60,120,240,360][track.slot-1])||typeof track.title!=='string'||!track.title.trim()||
      tempo&&track.bpm!==bpms[track.act-1][track.slot-1]||
      !Number.isFinite(track.bpm)||track.bpm<=0||!['core','atmosphere','full','preview'].every(key=>typeof track[key]==='string'&&/^[a-z0-9-]+\.ogg$/.test(track[key])))throw new Error('A track entry is not valid.');
    const key=`${track.act}:${track.slot}`;if(slots.has(key))throw new Error('A track slot is repeated.');
    ids.add(track.id);slots.add(key);
  }
  return [...value.tracks].sort((left,right)=>left.act-right.act||left.slot-right.slot);
}

/** Keep one selected pair of production stems on one audio timeline. */
export class LibraryPlayer{
  constructor({makeContext,fetcher=globalThis.fetch,onChange=()=>{},revision=LIBRARY_REVISION}={}){
    this.makeContext=makeContext||(()=>{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)throw new Error('This browser has no Web Audio support.');return new Audio();});
    this.fetcher=fetcher.bind(globalThis);this.onChange=onChange;this.revision=revision;this.context=null;this.contextCreations=0;this.track=null;this.baseUrl=null;
    this.buffers=[];this.sources=[];this.abort=null;this.loadPromise=null;this.version=0;this.generation=0;
    this.state='idle';this.error='';this.offset=0;this.startedAt=null;this.startOffset=0;this.volume=.6;this.atmosphere=true;
    this.fetches=0;this.decodes=0;this.history=[];this.decodeQueue=Promise.resolve();
  }
  notify(){this.onChange(this.read());}
  select(track,baseUrl){
    this.version++;this.abort?.abort();this.abort=null;this.loadPromise=null;this.stopSources();this.buffers=[];
    this.track=track;this.baseUrl=baseUrl;this.offset=0;this.startOffset=0;this.state='ready';this.error='';this.notify();
  }
  ensureContext(){
    if(this.context)return;
    this.context=this.makeContext();this.contextCreations++;
    this.context.addEventListener?.('statechange',()=>{if(this.context.state!=='running'&&this.state==='playing')this.pause();});
    this.master=this.context.createGain();this.master.gain.value=this.volume;this.master.connect(this.context.destination);
    this.atmosphereGain=this.context.createGain();this.atmosphereGain.gain.value=this.atmosphere?1:0;this.atmosphereGain.connect(this.master);
  }
  async load(token){
    if(this.buffers.length===2)return true;
    if(this.loadPromise)return this.loadPromise;
    const controller=new AbortController();this.abort=controller;const track=this.track,base=this.baseUrl;
    const promise=(async()=>{
      const buffers=await Promise.all(['core','atmosphere'].map(async key=>{
        const response=await this.fetcher(new URL(track[key],base).href,{signal:controller.signal});
        if(!response.ok)throw new Error(`Audio load failed: ${response.status}`);this.fetches++;
        const data=await response.arrayBuffer();if(token!==this.version)throw new DOMException('Track changed.','AbortError');
        return this.decode(data,token);
      }));
      if(token!==this.version)return false;
      if(buffers.some(buffer=>buffer.numberOfChannels!==2)||buffers[0].sampleRate!==buffers[1].sampleRate||buffers[0].length!==buffers[1].length||
        Math.abs(buffers[0].duration-track.seconds)>.02)throw new Error('The track layers are not aligned.');
      this.buffers=buffers;this.abort=null;return true;
    })();
    this.loadPromise=promise;
    try{return await promise;}finally{if(this.loadPromise===promise)this.loadPromise=null;}
  }
  async decode(data,token){
    const pending=this.decodeQueue.then(()=>{
      if(token!==this.version)throw new DOMException('Track changed.','AbortError');
      return this.context.decodeAudioData(data);
    });
    this.decodeQueue=pending.then(()=>undefined,()=>undefined);
    const buffer=await pending;this.decodes++;
    if(token!==this.version)throw new DOMException('Track changed.','AbortError');return buffer;
  }
  async play(){
    if(!this.track||this.state==='playing'||this.state==='loading')return false;
    const token=this.version;
    try{
      this.ensureContext();this.state='loading';this.error='';this.notify();
      await this.context.resume();if(token!==this.version)return false;
      if(!await this.load(token)||token!==this.version)return false;
      if(this.context.state!=='running')await this.context.resume();if(token!==this.version)return false;
      if(this.offset>=this.duration())this.offset=0;
      this.startSources();this.state='playing';this.notify();return true;
    }catch(error){
      if(token!==this.version||error.name==='AbortError')return false;
      this.version++;this.abort?.abort();this.abort=null;
      this.stopSources();this.buffers=[];this.state='error';this.error=String(error.message||error);this.notify();return false;
    }
  }
  duration(){return this.buffers[0]?.duration||this.track?.seconds||0;}
  position(){return Math.min(this.duration(),this.startedAt===null?this.offset:this.startOffset+Math.max(0,this.context.currentTime-this.startedAt));}
  startSources(){
    this.stopSources();const at=this.context.currentTime+.04,offset=this.offset,token=++this.generation;
    this.startOffset=offset;this.startedAt=at;
    this.sources=this.buffers.map((buffer,index)=>{
      const source=this.context.createBufferSource();source.buffer=buffer;source.connect(index?this.atmosphereGain:this.master);
      source.onended=()=>{source.disconnect();if(token!==this.generation)return;this.sources=this.sources.filter(value=>value!==source);
        if(this.sources.length===0&&this.state==='playing'){this.offset=this.duration();this.startedAt=null;this.state='ended';this.notify();}};
      source.start(at,offset);this.history.push({trackId:this.track.id,index,at,offset});if(this.history.length>32)this.history.shift();return source;
    });
  }
  stopSources(){
    this.generation++;this.startedAt=null;const sources=this.sources;this.sources=[];
    for(const source of sources){try{source.stop();}catch{}source.disconnect();}
  }
  pause(reason='paused'){
    if(this.state!=='playing')return;this.offset=this.position();this.stopSources();this.state=reason;this.notify();
  }
  stop(){
    this.version++;this.abort?.abort();this.abort=null;this.loadPromise=null;this.stopSources();
    this.offset=0;this.startOffset=0;this.state=this.track?'ready':'idle';this.error='';this.notify();
  }
  seek(seconds){
    if(!this.track||this.state==='loading')return;
    const wasPlaying=this.state==='playing';this.offset=Math.max(0,Math.min(this.duration(),Number(seconds)||0));this.stopSources();
    if(wasPlaying&&this.offset<this.duration()){this.startSources();this.state='playing';}
    else this.state=this.offset>=this.duration()?'ended':'paused';this.notify();
  }
  setVolume(value){this.volume=clamp(value);this.master?.gain.setTargetAtTime(this.volume,this.context.currentTime,.025);this.notify();}
  setAtmosphere(value){this.atmosphere=Boolean(value);this.atmosphereGain?.gain.setTargetAtTime(this.atmosphere?1:0,this.context.currentTime,.04);this.notify();}
  read(){return {revision:this.revision,state:this.state,trackId:this.track?.id||null,position:this.position(),duration:this.duration(),volume:this.volume,
    atmosphere:this.atmosphere,contextCreations:this.contextCreations,contextState:this.context?.state||'uninitialized',buffers:this.buffers.length,
    activeSources:this.sources.length,fetches:this.fetches,decodes:this.decodes,error:this.error,history:this.history.map(item=>({...item}))};}
}

export async function startMusicLibrary(document){
  const $=id=>document.getElementById(id),collectionKey=new URL(globalThis.location.href).searchParams.get('collection'),collection=libraryCollection(collectionKey),catalogUrl=new URL(`../assets/audio/${collection.folder}/catalog.json`,import.meta.url);
  let tracks=[],selected=null,lastStatus='',frame=0,mixRevision='';
  const player=new LibraryPlayer({onChange:renderPlayer,revision:collection.revision});
  if($('collection')){
    $('collection').value=collection===LIBRARY_COLLECTIONS.tempo?'tempo':'original';
    $('collection').addEventListener('change',()=>{player.stop();const url=new URL(globalThis.location.href);url.searchParams.set('collection',$('collection').value);globalThis.location.assign(url.href);});
  }
  if($('collection-intro'))$('collection-intro').textContent=collection.intro;
  if($('collection-name'))$('collection-name').textContent=`Arrow Space Shift · ${collection.label}`;
  function status(text,isError=false){if(lastStatus!==text){$('status').textContent=text;lastStatus=text;}$('status').dataset.error=String(isError);}
  function renderPlayer(state=player.read()){
    const available=Boolean(selected),busy=state.state==='loading';
    $('play').disabled=!available||busy||state.state==='playing';$('play').textContent=['paused','hidden'].includes(state.state)?'Resume':'Play';
    $('pause').disabled=state.state!=='playing';$('stop').disabled=!available||state.state==='ready';
    $('seek').disabled=!available||busy;$('seek').max=state.duration||1;
    if(document.activeElement!==$('seek'))$('seek').value=state.position;
    $('time').value=`${formatTime(state.position)} / ${formatTime(state.duration)}`;
    const messages={idle:'Select a track.',ready:'Ready. Select Play to listen.',loading:'Loading the selected track.',playing:'Playing. Turn atmosphere off to compare the rhythmic core.',
      paused:'Paused. Select Resume to continue.',hidden:'Paused because the page is hidden. Select Resume to continue.',ended:'Track ended. Select Play to start again.'};
    status(state.state==='error'?'Audio is not available. Select Play to retry, or select another track.':messages[state.state]||'Ready.',state.state==='error');
  }
  function select(track){
    selected=track;player.select(track,catalogUrl);$('now-title').textContent=track.title;
    $('now-meta').textContent=`Act ${['I','II','III','IV'][track.act-1]} · ${formatTime(track.seconds)} · ${track.bpm} BPM${track.id==='tempo-act3-02'&&mixRevision==='r2b'?' · Swells and stereo revision':''}`;
    $('full-mix').href=new URL(track.full,catalogUrl).href;$('full-mix').download=track.full;$('full-mix').hidden=false;renderTracks();
  }
  function renderTracks(){
    const act=Number($('act').value);$('act-description').textContent=ACT_DESCRIPTIONS[act];
    const fragment=document.createDocumentFragment();
    for(const track of tracks.filter(item=>item.act===act)){
      const card=document.createElement('article');card.className='track';card.dataset.track=track.id;card.dataset.selected=String(selected?.id===track.id);
      const number=document.createElement('p');number.className='track-number';number.textContent=`Study ${track.slot}`;
      const top=document.createElement('div');top.className='track-top';const title=document.createElement('h3');title.textContent=track.title;
      const duration=document.createElement('span');duration.className='duration';duration.textContent=formatTime(track.seconds);top.append(title,duration);
      const purpose=document.createElement('p');purpose.className='purpose';purpose.textContent=track.purpose||'Original musical study.';
      const meta=document.createElement('p');meta.className='meta';meta.textContent=`${track.bpm} BPM · ${track.seconds/60} min`;
      const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Inspect the experiment';details.append(summary);
      for(const [label,text]of [['Question',track.hypothesis],['Retained identity',track.invariant],['Operations',track.operations?.join(', ')]]){
        if(text){const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=`${label}: `;p.append(strong,document.createTextNode(text));details.append(p);}
      }
      const mark=document.createElement('p');mark.className='selected-mark';mark.textContent=selected?.id===track.id?'Selected track':'';
      const button=document.createElement('button');button.textContent=`Select ${track.title}`;button.dataset.select=track.id;button.addEventListener('click',()=>{select(track);document.querySelector(`[data-select="${track.id}"]`)?.focus();});
      card.append(number,top,meta,purpose,details,mark,button);fragment.append(card);
    }
    $('tracks').replaceChildren(fragment);
  }
  $('play').addEventListener('click',()=>player.play());$('pause').addEventListener('click',()=>player.pause());$('stop').addEventListener('click',()=>player.stop());
  $('seek').addEventListener('change',()=>player.seek(Number($('seek').value)));
  $('volume').addEventListener('input',()=>{player.setVolume(Number($('volume').value)/100);$('volume-value').value=`${$('volume').value}%`;});
  $('atmosphere').addEventListener('change',()=>player.setAtmosphere($('atmosphere').checked));
  $('act').addEventListener('change',()=>renderTracks());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause('hidden');});
  globalThis.addEventListener('pagehide',()=>player.stop());
  function tick(){if(player.state==='playing')renderPlayer();frame=globalThis.requestAnimationFrame(tick);}
  frame=globalThis.requestAnimationFrame(tick);
  const read=()=>({...player.read(),mixRevision,selectedAct:Number($('act').value),trackCount:tracks.length,tracks:tracks.map(({id,act,slot,seconds,title,bpm})=>({id,act,slot,seconds,title,bpm}))});
  globalThis.arrowSpaceShiftMusicLibrary={read};
  try{
    const response=await fetch(catalogUrl);if(!response.ok)throw new Error(`Catalog load failed: ${response.status}`);
    const catalog=await response.json();tracks=validateCatalog(catalog,collection.revision);mixRevision=typeof catalog.mix_revision==='string'?catalog.mix_revision:'';
    if(mixRevision&&$('collection-name'))$('collection-name').textContent=`Arrow Space Shift · ${collection.label} · ${mixRevision}`;
    select(tracks[0]);
  }catch(error){
    $('now-title').textContent='Track list is not available';$('tracks').replaceChildren();const p=document.createElement('p');p.className='empty';p.textContent='Reload the page to try again.';$('tracks').append(p);
    status('The track list is not available. Reload the page to try again.',true);
  }
  return {player,read,destroy(){globalThis.cancelAnimationFrame(frame);player.stop();}};
}

if(typeof document!=='undefined')startMusicLibrary(document);
