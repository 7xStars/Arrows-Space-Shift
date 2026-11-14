export const STC_SCORE=Object.freeze({id:'identified-return-r6-room',title:'Identified Return',bpm:134,
  production:'FoxDot sample-entry pattern → SuperCollider room render',source:'Selected r5 stereo take'});
const clamp=(value,fallback=0)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:fallback));
const midiHz=value=>440*2**((value-69)/12);
const hash=value=>{let result=2166136261;for(const letter of String(value))result=Math.imul(result^letter.charCodeAt(0),16777619);return result>>>0;};

/** Play aligned production stems. Only immediate action cues use oscillators. */
export class RecordedScoreAudio{
  constructor(options={}){
    this.options={sound:true,volume:.5,music:true,musicVolume:.55,effectsVolume:.8,ambienceVolume:.25,roomVolume:.3,...options};
    this.context=null;this.contextCreations=0;this.playing=false;this.mode='combined';
    this.buffers=[];this.bufferLoads=0;this.decodeCount=0;this.loadPromise=null;this.loadError='';
    this.musicSources=[];this.voices=new Set();this.offset=0;this.startedAt=null;this.startOffset=0;
    this.identities=new Map();this.seen=new Set();this.history=[];this.generation=0;
    this.stats={announcements:0,crossings:0,peakVoices:0,dropped:0};
    this.urls=options.assets||[
      new URL('../assets/audio/stc-title-r6-dry.ogg',import.meta.url).href,
      new URL('../assets/audio/stc-title-r6-room.ogg',import.meta.url).href,
    ];
  }
  useContext(context){
    if(this.context&&this.context!==context)throw new Error('The audio context is already assigned.');
    this.context=context;return this;
  }
  buildGraph(){
    if(this.master||!this.context)return;
    const a=this.context;this.master=a.createGain();this.master.gain.value=0;
    this.buses={music:a.createGain(),effects:a.createGain(),ambience:a.createGain()};
    this.dry=a.createGain();this.wet=a.createGain();this.dry.gain.value=1;this.wet.gain.value=this.options.roomVolume;
    this.dry.connect(this.buses.music);this.wet.connect(this.buses.music);
    const safety=a.createDynamicsCompressor();safety.threshold.value=-6;safety.knee.value=3;
    safety.ratio.value=8;safety.attack.value=.003;safety.release.value=.09;
    for(const bus of Object.values(this.buses))bus.connect(safety);
    safety.connect(this.master);this.master.connect(a.destination);this.applyOptions();
  }
  async load(){
    if(this.buffers.length===2)return true;
    if(!this.context)return false;
    if(!this.loadPromise)this.loadPromise=(async()=>{
      const buffers=await Promise.all(this.urls.map(async url=>{
        const response=await fetch(url);if(!response.ok)throw new Error(`Audio load failed: ${response.status}`);
        this.bufferLoads++;const data=await response.arrayBuffer();
        const buffer=await this.context.decodeAudioData(data);this.decodeCount++;return buffer;
      }));
      if(buffers.some(buffer=>buffer.numberOfChannels!==2)||buffers[0].sampleRate!==buffers[1].sampleRate||
        buffers[0].length!==buffers[1].length)throw new Error('The music stems are not aligned.');
      this.buffers=buffers;this.loadError='';return true;
    })().catch(error=>{this.loadError=String(error.message||error);this.loadPromise=null;return false;});
    return this.loadPromise;
  }
  async unlock(){
    if(!this.options.sound)return false;
    try{
      if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;this.context=new Audio();this.contextCreations++;}
      if(this.context.state!=='running')await this.context.resume();
      this.buildGraph();const loaded=await this.load();
      if(loaded&&this.playing&&this.musicSources.length===0)this.startMusic();
      return loaded&&this.context.state==='running';
    }catch(error){this.loadError=String(error.message||error);return false;}
  }
  positionSeconds(){
    const duration=this.buffers[0]?.duration||0;
    const value=this.startedAt===null?this.offset:this.startOffset+Math.max(0,this.context.currentTime-this.startedAt);
    return duration?value%duration:value;
  }
  startMusic(){
    if(!this.playing||!this.context||this.context.state!=='running'||this.buffers.length!==2||this.musicSources.length)return;
    this.buildGraph();const at=this.context.currentTime+.04,duration=this.buffers[0].duration;
    const offset=duration?this.offset%duration:0,token=++this.generation;
    this.startedAt=at;this.startOffset=offset;
    this.musicSources=this.buffers.map((buffer,index)=>{
      const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;
      source.loopStart=0;source.loopEnd=duration;source.connect(index?this.wet:this.dry);
      source.onended=()=>{source.disconnect();if(token===this.generation)this.musicSources=this.musicSources.filter(item=>item!==source);};
      source.start(at,offset);return source;
    });
  }
  stopMusic(){
    const sources=this.musicSources;this.musicSources=[];this.startedAt=null;this.generation++;
    for(const source of sources){try{source.stop(this.context.currentTime);}catch{}source.disconnect();}
  }
  start(){this.stop();this.seen.clear();this.identities.clear();this.history=[];this.playing=true;this.startMusic();return this;}
  pause(){if(!this.playing)return;this.offset=this.positionSeconds();this.playing=false;this.stopMusic();this.stopCues();}
  resume(){if(this.playing)return;this.playing=true;this.startMusic();}
  stop(){this.playing=false;this.stopMusic();this.stopCues();this.offset=0;this.startOffset=0;}
  update(){if(this.playing&&this.musicSources.length===0&&this.buffers.length===2)this.startMusic();}
  applyOptions(){
    if(!this.master)return;const now=this.context.currentTime,audible=this.options.sound&&this.mode!=='visual';
    this.master.gain.setTargetAtTime(audible?clamp(this.options.volume,.5):0,now,.018);
    this.buses.music.gain.setTargetAtTime(this.options.music?clamp(this.options.musicVolume,.55):0,now,.018);
    this.buses.effects.gain.setTargetAtTime(clamp(this.options.effectsVolume,.8),now,.018);
    this.buses.ambience.gain.setTargetAtTime(clamp(this.options.ambienceVolume,.25),now,.018);
    this.wet.gain.setTargetAtTime(clamp(this.options.roomVolume,.3),now,.025);
  }
  setOptions(options={}){Object.assign(this.options,options);this.options.roomVolume=clamp(this.options.roomVolume,.3);this.applyOptions();}
  setMode(mode){if(!['combined','visual','audio','mismatched'].includes(mode))throw new RangeError('Unknown study mode.');this.mode=mode;this.applyOptions();}
  stopCue(voice){
    if(voice.finished)return;voice.finished=true;this.voices.delete(voice);
    try{voice.source.stop(this.context.currentTime);}catch{}
    for(const node of voice.nodes)node.disconnect();
  }
  stopCues(){for(const voice of [...this.voices])this.stopCue(voice);}
  playIdentity(cue){
    if(!this.playing||!this.options.sound||this.mode==='visual'||!this.context||this.context.state!=='running')return;
    this.buildGraph();const time=this.context.currentTime+.002,note=[53,56,58,60][cue.motif];
    for(const [offset,midi,level] of [[0,note,.11],[.085,note+7,.075]]){
      if(this.voices.size>=32){this.stats.dropped++;continue;}
      const a=this.context,source=a.createOscillator(),gain=a.createGain(),pan=a.createStereoPanner(),at=time+offset;
      source.type='triangle';source.frequency.setValueAtTime(midiHz(midi),at);pan.pan.value=cue.pan;
      gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(level*(cue.kind==='entry'?.82:1),at+.004);
      gain.gain.exponentialRampToValueAtTime(.0001,at+.13);source.connect(gain);gain.connect(pan);pan.connect(this.buses.effects);
      const voice={source,nodes:[source,gain,pan],finished:false};this.voices.add(voice);
      source.onended=()=>this.stopCue(voice);source.start(at);source.stop(at+.14);
      this.stats.peakVoices=Math.max(this.stats.peakVoices,this.voices.size);
    }
  }
  identityCue(event,kind){
    const id=String(event.eventId);if(this.seen.has(id))return null;this.seen.add(id);
    while(this.seen.size>128)this.seen.delete(this.seen.values().next().value);
    const objectId=String(event.objectId);if(!this.identities.has(objectId))this.identities.set(objectId,hash(event.motif??event.family??objectId)%4);
    while(this.identities.size>128)this.identities.delete(this.identities.keys().next().value);
    const position=kind==='crossing'?event.destination:event.position;
    const originalPan=Math.max(-.65,Math.min(.65,Number.isFinite(event.pan)?event.pan:Number.isFinite(position?.x)?position.x:0));
    const cue=Object.freeze({kind,type:event.type,eventId:id,objectId,from:event.from,to:event.to,motif:this.identities.get(objectId),
      pan:this.mode==='mismatched'&&kind==='crossing'?-originalPan:originalPan,mode:this.mode});
    this.history.push(cue);if(this.history.length>64)this.history.shift();return cue;
  }
  announce(event){
    if(!event||event.type!=='attack-entered'||event.topology!=='bolza'||event.eventId==null||event.objectId==null||
      event.predicted||event.renderOnly||!Number.isFinite(event.position?.x)||!Number.isFinite(event.position?.y))return false;
    const cue=this.identityCue(event,'entry');if(!cue)return false;this.stats.announcements++;this.playIdentity(cue);return true;
  }
  attack(event){return this.announce(event);}
  crossing(event){
    if(!event||event.type!=='crossing'||event.topology!=='bolza'||event.eventId==null||event.objectId==null||event.predicted||event.renderOnly||
      !Number.isInteger(event.from)||event.from<0||event.from>7||!Number.isInteger(event.to)||event.to<0||event.to>7)return false;
    const cue=this.identityCue(event,'crossing');if(!cue)return false;this.stats.crossings++;this.playIdentity(cue);return true;
  }
  diagnosticState(){
    return {engine:'recorded-stems',scoreId:STC_SCORE.id,production:STC_SCORE.production,contextState:this.context?.state||'uninitialized',
      contextCreations:this.contextCreations,playing:this.playing,mode:this.mode,spatialMode:'stereo',hrtfNodes:0,
      decodedBuffers:this.buffers.length,buffers:this.buffers.length,bufferLoads:this.bufferLoads,decodeCount:this.decodeCount,
      activeMusicSources:this.musicSources.length,duration:this.buffers[0]?.duration||0,currentOffset:this.positionSeconds(),positionSeconds:this.positionSeconds(),
      roomVolume:this.options.roomVolume,dryGain:this.dry?.gain.value??1,wetGain:this.wet?.gain.value??this.options.roomVolume,
      masterGain:this.master?.gain.value??0,buses:Object.fromEntries(Object.entries(this.buses||{}).map(([name,node])=>[name,node.gain.value])),
      voices:this.voices.size,sources:this.musicSources.length+this.voices.size,loadError:this.loadError,...this.stats,
      cueHistory:this.history.map(value=>({...value})),sourceHistory:this.history.filter(value=>value.kind==='entry').map(value=>({...value})),
      crossingHistory:this.history.filter(value=>value.kind==='crossing').map(value=>({...value}))};
  }
}
